import { AuthStatus } from "@/lib/enums/AuthStatus";
import { UserRole } from "@/lib/enums/UserRole";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "@/lib/prisma";

interface CreateAuthorizationRequestParams {
  patientId?: string;
  dependentId?: string;
  hospitalId: string;
  requestedById: string; // HospitalStaff.id
  serviceId: string;
  diagnosisCode?: string;
  diagnosisNotes?: string;
  quantity?: number;
}

interface ReviewAuthorizationRequestParams {
  authRequestId: string;
  reviewedById: string; // HMOStaff.id
  decision: AuthStatus;
  comments?: string;
}

export class AuthorizationService {
  /**
   * Creates a new authorization request
   */
  async createAuthorizationRequest(params: CreateAuthorizationRequestParams) {
    const {
      patientId,
      dependentId,
      hospitalId,
      requestedById,
      serviceId,
      diagnosisCode,
      diagnosisNotes,
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

    const authCode = this.generateAuthorizationCode();
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);

    const authRequest = await prisma.authorizationRequest.create({
      data: {
        patientId: targetPatientId,
        dependentId,
        hospitalId,
        requestedById,
        serviceId,
        diagnosisCode,
        diagnosisNotes,
        quantity,
        authCode,
        status: "PENDING",
        expiryDate,
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
        requestedBy: {
          include: {
            user: true,
          },
        },
      },
    });

    // Auto-approval engine processing
    await this.processAuthorizationRequest(authRequest.id);

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: authRequest.requestedBy.userId,
        action: "AUTH_REQUEST",
        entityType: "AuthorizationRequest",
        entityId: authRequest.id,
        details: `Authorization request created with code ${authCode}`,
      },
    });

    // Patient notification
    await prisma.notification.create({
      data: {
        userId: patient.userId,
        type: "AUTH_REQUEST",
        title: "New Authorization Request",
        message: `An authorization request has been submitted for service processing.`,
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
          message: `A new authorization request requires review.`,
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

    const canAutoApprove = await this.canAutoApprove(request);

    if (canAutoApprove) {
      await prisma.authorizationRequest.update({
        where: { id: requestId },
        data: {
          status: "AUTO_APPROVED",
        },
      });

      if (request.patient) {
        await prisma.notification.create({
          data: {
            userId: request.patient.userId,
            type: "AUTH_APPROVAL",
            title: "Authorization Auto-Approved",
            message: `Your authorization request for ${request.service.name} was automatically approved.`,
            relatedEntityId: requestId,
            relatedEntityType: "AuthorizationRequest",
          },
        });
      }
    }

    return request;
  }

  /**
   * Check if request meets auto-approval criteria
   */
  async canAutoApprove(request: {
    patient?: { coveragePlanId?: string | null; hmoId?: string | null } | null;
    patientId?: string | null;
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
   * Review an authorization request (HMO Staff action)
   */
  async reviewAuthorizationRequest(params: ReviewAuthorizationRequestParams) {
    const { authRequestId, reviewedById, decision, comments } = params;

    const request = await prisma.authorizationRequest.findUnique({
      where: { id: authRequestId },
      include: {
        patient: true,
      },
    });

    if (!request) {
      throw new Error("Authorization request not found");
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
      data: {
        status: decision,
      },
    });

    if (request.patient) {
      const isApproved = decision === "APPROVED" || decision === "AUTO_APPROVED";
      await prisma.notification.create({
        data: {
          userId: request.patient.userId,
          type: isApproved ? "AUTH_APPROVAL" : "AUTH_REJECTION",
          title: `Authorization Request ${isApproved ? "Approved" : "Rejected"}`,
          message: `Your authorization request has been ${decision.toLowerCase()}`,
          relatedEntityId: authRequestId,
          relatedEntityType: "AuthorizationRequest",
        },
      });
    }

    return review;
  }

  /**
   * Validate an authorization code for service delivery
   */
  async validateAuthorizationCode(authCode: string, serviceId: string) {
    const authRequest = await prisma.authorizationRequest.findFirst({
      where: {
        authCode,
        status: { in: ["APPROVED", "AUTO_APPROVED"] },
      },
      include: {
        service: true,
        patient: { include: { user: true } },
      },
    });

    if (!authRequest) {
      return {
        valid: false,
        message: "Invalid or unapproved authorization code",
      };
    }

    if (authRequest.serviceId !== serviceId) {
      return {
        valid: false,
        message: "Service does not match authorized service code",
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
   * Record service delivery by hospital staff
   */
  async recordServiceDelivery(
    authCode: string,
    serviceId: string,
    deliveredById: string,
    actualQuantity: number = 1,
    actualCost?: number
  ) {
    const validation = await this.validateAuthorizationCode(authCode, serviceId);

    if (!validation.valid || !validation.authRequest) {
      throw new Error(validation.message);
    }

    const authRequest = validation.authRequest;
    const cost = actualCost ?? authRequest.service.standardPrice * actualQuantity;

    const serviceDelivery = await prisma.serviceDelivery.create({
      data: {
        authRequestId: authRequest.id,
        deliveredById,
        serviceId,
        actualQuantity,
        actualCost: cost,
      },
    });

    if (authRequest.patient) {
      await prisma.notification.create({
        data: {
          userId: authRequest.patient.userId,
          type: "SERVICE_DELIVERY",
          title: "Healthcare Service Delivered",
          message: `Service ${authRequest.service.name} has been marked as delivered.`,
          relatedEntityId: serviceDelivery.id,
          relatedEntityType: "ServiceDelivery",
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