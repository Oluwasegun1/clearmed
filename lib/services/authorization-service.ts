import { AuthStatus } from "@/lib/enums/AuthStatus";
import { UserRole } from "@/lib/enums/UserRole";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "@/lib/prisma";

export interface CreateAuthorizationItemInput {
  serviceId?: string;
  description: string;
  category?: string;
  cost: number;
  reason?: string;
  supportingDocs?: string;
  quantity?: number;
}

export interface CreateAuthorizationRequestParams {
  patientId?: string;
  dependentId?: string;
  hospitalId: string;
  requestedById: string; // HospitalStaff.id
  diagnosisCode?: string;
  diagnosisNotes?: string;
  items?: CreateAuthorizationItemInput[];
  // Legacy single-service support
  serviceId?: string;
  quantity?: number;
}

export interface ReviewAuthorizationItemParams {
  itemId: string;
  reviewedById: string; // HMOStaff.id
  decision: AuthStatus;
  comments?: string;
}

export interface FulfillAuthorizationItemParams {
  itemId: string;
  deliveredById: string; // HospitalStaff.id
  actualCost?: number;
  notes?: string;
}

export class AuthorizationService {
  /**
   * Derives overall request status from individual service item statuses
   */
  deriveRequestStatus(items: { status: AuthStatus | string }[]): AuthStatus {
    if (!items || items.length === 0) return "PENDING" as AuthStatus;

    const statuses = items.map((i) => i.status);
    const allCompleted = statuses.every((s) => s === "COMPLETED");
    if (allCompleted) return "COMPLETED" as AuthStatus;

    const allApprovedOrCompleted = statuses.every((s) =>
      ["APPROVED", "AUTO_APPROVED", "COMPLETED"].includes(s)
    );
    if (allApprovedOrCompleted) return "APPROVED" as AuthStatus;

    const allRejected = statuses.every((s) => s === "REJECTED");
    if (allRejected) return "REJECTED" as AuthStatus;

    const anyMoreInfo = statuses.some((s) => s === "MORE_INFORMATION_REQUIRED");
    const anyPending = statuses.some((s) => s === "PENDING");

    if (anyMoreInfo && !anyPending) {
      return "MORE_INFORMATION_REQUIRED" as AuthStatus;
    }

    if (anyPending) {
      return "PENDING" as AuthStatus;
    }

    // Mixed decided (e.g. some APPROVED, some REJECTED)
    const anyApproved = statuses.some((s) =>
      ["APPROVED", "AUTO_APPROVED", "COMPLETED"].includes(s)
    );
    if (anyApproved) {
      return "APPROVED" as AuthStatus;
    }

    return "PENDING" as AuthStatus;
  }

  /**
   * Creates a new authorization request with multi-service support (v2.0)
   */
  async createAuthorizationRequest(params: CreateAuthorizationRequestParams) {
    const {
      patientId,
      dependentId,
      hospitalId,
      requestedById,
      diagnosisCode,
      diagnosisNotes,
      items,
      serviceId,
      quantity = 1,
    } = params;

    let targetPatientId = patientId;
    if (!targetPatientId && dependentId) {
      const dependent = await prisma.dependent.findUnique({
        where: { id: dependentId },
      });
      if (dependent) {
        targetPatientId = dependent.patientId;
      }
    }

    if (!targetPatientId) {
      throw new Error("Patient or dependent ID is required");
    }

    const patient = await prisma.patient.findUnique({
      where: { id: targetPatientId },
      include: {
        user: true,
        coveragePlan: true,
      },
    });

    if (!patient) {
      throw new Error("Patient not found");
    }

    // Build items list
    let preparedItems: CreateAuthorizationItemInput[] = [];

    if (items && items.length > 0) {
      preparedItems = items;
    } else if (serviceId) {
      const service = await prisma.service.findUnique({ where: { id: serviceId } });
      preparedItems = [
        {
          serviceId,
          description: service?.name || "Medical Service",
          category: service?.category || "General",
          cost: (service?.standardPrice || 5000) * quantity,
          reason: diagnosisNotes || "Clinical treatment",
          quantity,
        },
      ];
    } else {
      const defaultService = await prisma.service.findFirst();
      preparedItems = [
        {
          serviceId: defaultService?.id,
          description: defaultService?.name || "General Consultation",
          category: defaultService?.category || "Consultation",
          cost: (defaultService?.standardPrice || 5000) * quantity,
          reason: diagnosisNotes || "General consultation",
          quantity,
        },
      ];
    }

    const authCode = this.generateAuthorizationCode();
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);

    // Primary service for legacy backwards-compatibility
    const primaryServiceId = preparedItems[0]?.serviceId || (await prisma.service.findFirst())?.id;

    // Create the authorization request with its child items
    const authRequest = await prisma.authorizationRequest.create({
      data: {
        patientId: targetPatientId,
        dependentId,
        hospitalId,
        requestedById,
        serviceId: primaryServiceId,
        diagnosisCode: diagnosisCode || "GENERAL",
        diagnosisNotes: diagnosisNotes || "Medical Pre-Authorization",
        quantity: preparedItems.reduce((acc, item) => acc + (item.quantity || 1), 0),
        authCode,
        status: "PENDING",
        expiryDate,
        items: {
          create: preparedItems.map((item) => ({
            serviceId: item.serviceId,
            description: item.description,
            category: item.category || "General",
            cost: Number(item.cost) || 0,
            reason: item.reason || diagnosisNotes || null,
            supportingDocs: item.supportingDocs || null,
            quantity: Number(item.quantity) || 1,
            status: "PENDING",
          })),
        },
      },
      include: {
        patient: {
          include: {
            user: true,
            coveragePlan: true,
          },
        },
        hospital: true,
        service: true,
        items: true,
        requestedBy: {
          include: {
            user: true,
          },
        },
      },
    });

    // Run auto-approval check per item
    await this.processAuthorizationRequest(authRequest.id);

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: authRequest.requestedBy.userId,
        action: "AUTH_REQUEST",
        entityType: "AuthorizationRequest",
        entityId: authRequest.id,
        details: `Authorization request created with code ${authCode} containing ${authRequest.items.length} service item(s)`,
      },
    });

    // Patient notification
    await prisma.notification.create({
      data: {
        userId: patient.userId,
        type: "AUTH_REQUEST",
        title: "New Authorization Request",
        message: `An authorization request with ${authRequest.items.length} service(s) has been submitted for HMO review.`,
        relatedEntityId: authRequest.id,
        relatedEntityType: "AuthorizationRequest",
      },
    });

    // HMO Staff notification
    const hmoStaff = await prisma.hMOStaff.findFirst({
      where: {
        hmoId: patient.hmoId,
      },
    });

    if (hmoStaff) {
      await prisma.notification.create({
        data: {
          userId: hmoStaff.userId,
          type: "AUTH_REQUEST",
          title: "New Authorization Request",
          message: `A new authorization request with ${authRequest.items.length} service item(s) requires HMO review.`,
          relatedEntityId: authRequest.id,
          relatedEntityType: "AuthorizationRequest",
        },
      });
    }

    return authRequest;
  }

  /**
   * Process an authorization request through auto-approval check
   */
  async processAuthorizationRequest(requestId: string) {
    const request = await prisma.authorizationRequest.findUnique({
      where: { id: requestId },
      include: {
        items: true,
        service: true,
        patient: {
          include: {
            coveragePlan: true,
          },
        },
        hospital: true,
      },
    });

    if (!request) {
      throw new Error("Authorization request not found");
    }

    let anyAutoApproved = false;

    // Check each item
    for (const item of request.items) {
      if (item.serviceId) {
        const canAuto = await this.canAutoApprove({
          patient: request.patient,
          hospitalId: request.hospitalId,
          serviceId: item.serviceId,
        });

        if (canAuto) {
          await prisma.authorizationItem.update({
            where: { id: item.id },
            data: {
              status: "AUTO_APPROVED",
              reviewedAt: new Date(),
              decisionReason: "Automatically approved based on active contract and coverage rules",
            },
          });
          anyAutoApproved = true;
        }
      }
    }

    // Refresh items and update overall request status
    const updatedItems = await prisma.authorizationItem.findMany({
      where: { authRequestId: requestId },
    });

    const derivedStatus = this.deriveRequestStatus(updatedItems);
    await prisma.authorizationRequest.update({
      where: { id: requestId },
      data: { status: derivedStatus },
    });

    if (anyAutoApproved && request.patient) {
      await prisma.notification.create({
        data: {
          userId: request.patient.userId,
          type: "AUTH_APPROVAL",
          title: "Authorization Auto-Approved",
          message: `One or more services in your authorization request #${request.authCode} were automatically approved.`,
          relatedEntityId: requestId,
          relatedEntityType: "AuthorizationRequest",
        },
      });
    }

    return request;
  }

  /**
   * Check if service meets auto-approval criteria
   */
  async canAutoApprove(request: {
    patient?: { coveragePlanId?: string | null; hmoId?: string | null } | null;
    serviceId?: string | null;
    hospitalId?: string | null;
  }) {
    if (
      !request.patient?.coveragePlanId ||
      !request.patient?.hmoId ||
      !request.serviceId ||
      !request.hospitalId
    ) {
      return false;
    }

    const coverageRule = await prisma.coverageRule.findFirst({
      where: {
        coveragePlanId: request.patient.coveragePlanId,
        serviceId: request.serviceId,
      },
    });

    if (!coverageRule) return false;
    if (coverageRule.requiresPreAuth) return false;

    const contract = await prisma.hMOHospitalContract.findFirst({
      where: {
        hmoId: request.patient.hmoId,
        hospitalId: request.hospitalId,
        isActive: true,
      },
    });

    return !!contract;
  }

  /**
   * Review an individual authorization service item (v2.0 HMO Step 5 & 6)
   */
  async reviewAuthorizationItem(params: ReviewAuthorizationItemParams) {
    const { itemId, reviewedById, decision, comments } = params;

    const item = await prisma.authorizationItem.findUnique({
      where: { id: itemId },
      include: {
        authRequest: {
          include: {
            patient: true,
            hospital: true,
          },
        },
      },
    });

    if (!item) {
      throw new Error("Authorization service item not found");
    }

    // Update item decision
    const updatedItem = await prisma.authorizationItem.update({
      where: { id: itemId },
      data: {
        status: decision,
        reviewerId: reviewedById,
        reviewedAt: new Date(),
        decisionReason: comments || null,
      },
    });

    // Record in review audit history
    await prisma.authorizationReview.create({
      data: {
        authRequestId: item.authRequestId,
        reviewedById,
        decision,
        comments: `[${item.description}] ${comments || ""}`.trim(),
      },
    });

    // Re-derive overall request status
    const allItems = await prisma.authorizationItem.findMany({
      where: { authRequestId: item.authRequestId },
    });
    const overallStatus = this.deriveRequestStatus(allItems);

    await prisma.authorizationRequest.update({
      where: { id: item.authRequestId },
      data: { status: overallStatus },
    });

    // Notify patient
    if (item.authRequest.patient) {
      const decisionLabel =
        decision === "APPROVED"
          ? "Approved"
          : decision === "REJECTED"
          ? "Rejected"
          : decision === "MORE_INFORMATION_REQUIRED"
          ? "Clarification Requested"
          : decision;

      await prisma.notification.create({
        data: {
          userId: item.authRequest.patient.userId,
          type: decision === "APPROVED" ? "AUTH_APPROVAL" : "AUTH_REJECTION",
          title: `Service Decision: ${item.description}`,
          message: `Your service "${item.description}" was marked as ${decisionLabel} by HMO.${comments ? ` Note: ${comments}` : ""}`,
          relatedEntityId: item.authRequestId,
          relatedEntityType: "AuthorizationRequest",
        },
      });
    }

    return updatedItem;
  }

  /**
   * Legacy review whole authorization request (updates all pending items)
   */
  async reviewAuthorizationRequest(params: {
    authRequestId: string;
    reviewedById: string;
    decision: AuthStatus;
    comments?: string;
  }) {
    const { authRequestId, reviewedById, decision, comments } = params;

    const request = await prisma.authorizationRequest.findUnique({
      where: { id: authRequestId },
      include: { items: true, patient: true },
    });

    if (!request) {
      throw new Error("Authorization request not found");
    }

    // Update all pending items
    for (const item of request.items) {
      if (item.status === "PENDING" || item.status === "MORE_INFORMATION_REQUIRED") {
        await prisma.authorizationItem.update({
          where: { id: item.id },
          data: {
            status: decision,
            reviewerId: reviewedById,
            reviewedAt: new Date(),
            decisionReason: comments || null,
          },
        });
      }
    }

    const review = await prisma.authorizationReview.create({
      data: {
        authRequestId,
        reviewedById,
        decision,
        comments,
      },
    });

    await prisma.authorizationRequest.update({
      where: { id: authRequestId },
      data: { status: decision },
    });

    if (request.patient) {
      const isApproved = decision === "APPROVED" || decision === "AUTO_APPROVED";
      await prisma.notification.create({
        data: {
          userId: request.patient.userId,
          type: isApproved ? "AUTH_APPROVAL" : "AUTH_REJECTION",
          title: `Authorization Request ${isApproved ? "Approved" : "Rejected"}`,
          message: `Your authorization request #${request.authCode} has been ${decision.toLowerCase().replace(/_/g, " ")}`,
          relatedEntityId: authRequestId,
          relatedEntityType: "AuthorizationRequest",
        },
      });
    }

    return review;
  }

  /**
   * Fulfill an individual service item (v2.0 Step 7 Fulfillment)
   * This is the trigger that increments Used Amount in the coverage engine.
   */
  async fulfillAuthorizationItem(params: FulfillAuthorizationItemParams) {
    const { itemId, deliveredById, actualCost, notes } = params;

    const item = await prisma.authorizationItem.findUnique({
      where: { id: itemId },
      include: {
        authRequest: {
          include: {
            patient: true,
            service: true,
          },
        },
      },
    });

    if (!item) {
      throw new Error("Service item not found");
    }

    if (!["APPROVED", "AUTO_APPROVED"].includes(item.status)) {
      throw new Error("Only approved services can be fulfilled");
    }

    const cost = actualCost ?? item.cost;

    const updatedItem = await prisma.authorizationItem.update({
      where: { id: itemId },
      data: {
        status: "COMPLETED",
        fulfilledById: deliveredById,
        fulfilledAt: new Date(),
        fulfillmentNotes: notes || null,
        actualCost: cost,
      },
    });

    // Record in ServiceDelivery table if not present
    const existingDelivery = await prisma.serviceDelivery.findUnique({
      where: { authRequestId: item.authRequestId },
    });

    if (!existingDelivery) {
      const targetServiceId = item.serviceId || item.authRequest.serviceId || (await prisma.service.findFirst())?.id;
      if (targetServiceId) {
        await prisma.serviceDelivery.create({
          data: {
            authRequestId: item.authRequestId,
            deliveredById,
            serviceId: targetServiceId,
            actualQuantity: item.quantity,
            actualCost: cost,
            notes: notes || `Delivered item: ${item.description}`,
          },
        });
      }
    }

    // Check if all items in the request are now completed
    const allItems = await prisma.authorizationItem.findMany({
      where: { authRequestId: item.authRequestId },
    });

    const derivedStatus = this.deriveRequestStatus(allItems);
    await prisma.authorizationRequest.update({
      where: { id: item.authRequestId },
      data: { status: derivedStatus },
    });

    // Notify patient
    if (item.authRequest.patient) {
      await prisma.notification.create({
        data: {
          userId: item.authRequest.patient.userId,
          type: "SERVICE_DELIVERY",
          title: "Service Fulfillment Confirmed",
          message: `Service "${item.description}" has been confirmed as fulfilled. Coverage used amount updated.`,
          relatedEntityId: item.authRequestId,
          relatedEntityType: "AuthorizationRequest",
        },
      });
    }

    return updatedItem;
  }

  /**
   * Validate an authorization code for service delivery
   */
  async validateAuthorizationCode(authCode: string, serviceId?: string) {
    const authRequest = await prisma.authorizationRequest.findFirst({
      where: {
        authCode,
        status: { in: ["APPROVED", "AUTO_APPROVED", "COMPLETED"] },
      },
      include: {
        items: true,
        service: true,
        patient: { include: { user: true, hmo: true } },
      },
    });

    if (!authRequest) {
      return {
        valid: false,
        message: "Invalid or unapproved authorization code",
      };
    }

    if (authRequest.expiryDate && new Date() > authRequest.expiryDate) {
      return {
        valid: false,
        message: "Authorization code has expired",
      };
    }

    return {
      valid: true,
      message: "Authorization code is valid",
      authRequest,
    };
  }

  /**
   * Record service delivery by hospital staff (legacy & code fulfillment)
   */
  async recordServiceDelivery(
    authCode: string,
    serviceId?: string,
    deliveredById?: string,
    actualQuantity: number = 1,
    actualCost?: number,
    notes?: string
  ) {
    const validation = await this.validateAuthorizationCode(authCode, serviceId);

    if (!validation.valid || !validation.authRequest) {
      throw new Error(validation.message);
    }

    const authRequest = validation.authRequest;

    // Resolve staff ID
    const staff = await prisma.hospitalStaff.findFirst({
      where: { userId: deliveredById },
    });
    const staffId = staff?.id || (await prisma.hospitalStaff.findFirst())?.id || "SYSTEM";

    // Mark all approved items in the request as COMPLETED
    const approvedItems = authRequest.items.filter((i) =>
      ["APPROVED", "AUTO_APPROVED"].includes(i.status)
    );

    for (const item of approvedItems) {
      await prisma.authorizationItem.update({
        where: { id: item.id },
        data: {
          status: "COMPLETED",
          fulfilledById: staffId,
          fulfilledAt: new Date(),
          actualCost: item.cost,
          fulfillmentNotes: notes || null,
        },
      });
    }

    const targetServiceId = serviceId || authRequest.serviceId || (await prisma.service.findFirst())?.id;
    const cost = actualCost ?? (authRequest.service?.standardPrice || 5000) * actualQuantity;

    const existingDelivery = await prisma.serviceDelivery.findUnique({
      where: { authRequestId: authRequest.id },
    });

    let serviceDelivery = existingDelivery;
    if (!existingDelivery && targetServiceId) {
      serviceDelivery = await prisma.serviceDelivery.create({
        data: {
          authRequestId: authRequest.id,
          deliveredById: staffId,
          serviceId: targetServiceId,
          actualQuantity,
          actualCost: cost,
          notes: notes || "Fulfilled via authorization code verification",
        },
      });
    }

    // Update overall request status
    await prisma.authorizationRequest.update({
      where: { id: authRequest.id },
      data: { status: "COMPLETED" },
    });

    if (authRequest.patient) {
      await prisma.notification.create({
        data: {
          userId: authRequest.patient.userId,
          type: "SERVICE_DELIVERY",
          title: "Healthcare Service Delivered",
          message: `Your authorized services for #${authRequest.authCode} have been marked as delivered and completed.`,
          relatedEntityId: authRequest.id,
          relatedEntityType: "AuthorizationRequest",
        },
      });
    }

    return serviceDelivery;
  }

  private generateAuthorizationCode(): string {
    const uuid = uuidv4();
    return `AUTH-${uuid.substring(0, 8).toUpperCase()}`;
  }
}