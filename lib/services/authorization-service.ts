import { PrismaClient, AuthStatus } from "@/lib/generated/prisma";
import UserRole from "@/lib/generated/prisma/UserRole";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

interface CreateAuthorizationRequestParams {
  patientId: string;
  hospitalId: string;
  requestedBy: string; // userId of the doctor or hospital staff
  serviceIds: string[];
  diagnosis: string;
  notes?: string;
}

interface ReviewAuthorizationRequestParams {
  requestId: string;
  reviewerId: string; // userId of the HMO staff
  status: AuthStatus;
  notes?: string;
}

export class AuthorizationService {
  /**
   * Creates a new authorization request
   */
  async createAuthorizationRequest(params: CreateAuthorizationRequestParams) {
    const { patientId, hospitalId, requestedBy, serviceIds, diagnosis, notes } = params;

    // Get patient details to determine HMO and coverage plan
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        coveragePlan: true,
      },
    });

    if (!patient) {
      throw new Error("Patient not found");
    }

    // Generate a unique authorization code
    const authCode = this.generateAuthorizationCode();

    // Create the authorization request
    const authRequest = await prisma.authorizationRequest.create({
      data: {
        patientId,
        hospitalId,
        hmoId: patient.hmoId,
        requestedBy,
        diagnosis,
        notes,
        authorizationCode: authCode,
        coveragePlanId: patient.coveragePlanId,
        // Create service requests for each service
        services: {
          create: serviceIds.map((serviceId) => ({
            serviceId,
          })),
        },
      },
      include: {
        services: true,
        patient: {
          include: {
            user: true,
            coveragePlan: true,
          },
        },
        hospital: true,
      },
    });

    // Process the request through the auto-approval engine
    await this.processAuthorizationRequest(authRequest.id);

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: requestedBy,
        action: "CREATE",
        entityType: "AuthorizationRequest",
        entityId: authRequest.id,
        details: `Authorization request created for patient ${patientId} with code ${authCode}`,
      },
    });

    // Create notification for patient
    await prisma.notification.create({
      data: {
        userId: patient.userId,
        type: "AUTHORIZATION_REQUEST",
        title: "New Authorization Request",
        message: `A new authorization request has been submitted for your approval`,
        relatedEntityId: authRequest.id,
        relatedEntityType: "AuthorizationRequest",
      },
    });

    // Create notification for HMO
    // Find HMO staff to notify
    const hmoStaff = await prisma.hMOStaff.findFirst({
      where: {
        hmoId: patient.hmoId,
        user: {
          role: "HMO_STAFF",
        },
      },
      include: {
        user: true,
      },
    });

    if (hmoStaff) {
      await prisma.notification.create({
        data: {
          userId: hmoStaff.userId,
          type: "AUTHORIZATION_REQUEST",
          title: "New Authorization Request",
          message: `A new authorization request requires your review`,
          relatedEntityId: authRequest.id,
          relatedEntityType: "AuthorizationRequest",
        },
      });
    }

    return authRequest;
  }

  /**
   * Process an authorization request through the auto-approval engine
   */
  async processAuthorizationRequest(requestId: string) {
    const request = await prisma.authorizationRequest.findUnique({
      where: { id: requestId },
      include: {
        services: {
          include: {
            service: true,
          },
        },
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

    // Check if the request can be auto-approved
    const canAutoApprove = await this.canAutoApprove(request);

    if (canAutoApprove) {
      // Auto-approve the request
      await prisma.authorizationRequest.update({
        where: { id: requestId },
        data: {
          status: "APPROVED",
          reviewedAt: new Date(),
          // Create a system review
          reviews: {
            create: {
              reviewerId: "system", // Special ID for system reviews
              status: "APPROVED",
              notes: "Auto-approved by system based on coverage rules",
            },
          },
        },
      });

      // Create notification for patient
      await prisma.notification.create({
        data: {
          userId: request.patient.userId,
          type: "AUTHORIZATION_APPROVED",
          title: "Authorization Request Approved",
          message: `Your authorization request has been automatically approved`,
          relatedEntityId: requestId,
          relatedEntityType: "AuthorizationRequest",
        },
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId: "system",
          action: "UPDATE",
          entityType: "AuthorizationRequest",
          entityId: requestId,
          details: `Authorization request ${requestId} auto-approved by system`,
        },
      });
    } else {
      // Mark for manual review
      await prisma.authorizationRequest.update({
        where: { id: requestId },
        data: {
          status: "PENDING",
        },
      });
    }

    return request;
  }

  /**
   * Determine if a request can be auto-approved based on rules
   */
  async canAutoApprove(request: any) {
    // Get coverage rules for the patient's plan
    const coverageRules = await prisma.coverageRule.findMany({
      where: {
        coveragePlanId: request.patient.coveragePlanId,
      },
    });

    // Get contract between hospital and HMO
    const contract = await prisma.hMOHospitalContract.findFirst({
      where: {
        hmoId: request.patient.hmoId,
        hospitalId: request.hospitalId,
        isActive: true,
      },
      include: {
        services: {
          include: {
            service: true,
          },
        },
      },
    });

    // If no active contract exists, cannot auto-approve
    if (!contract) {
      return false;
    }

    // Check if all services are covered by the contract and within auto-approval limits
    for (const serviceRequest of request.services) {
      const service = serviceRequest.service;

      // Find if service is in contract
      const contractService = contract.services.find(
        (cs) => cs.serviceId === service.id
      );

      if (!contractService) {
        return false; // Service not in contract
      }

      // Find coverage rule for this service
      const coverageRule = coverageRules.find(
        (rule) => rule.serviceId === service.id
      );

      // If no specific rule exists or service cost exceeds auto-approval threshold
      if (!coverageRule || service.cost > coverageRule.autoApprovalThreshold) {
        return false;
      }

      // Check if service requires pre-authorization
      if (coverageRule.requiresPreAuth) {
        // Additional checks could be implemented here
        // For now, if it requires pre-auth, we'll say it needs manual review
        return false;
      }
    }

    // If all checks pass, the request can be auto-approved
    return true;
  }

  /**
   * Review an authorization request (for HMO staff)
   */
  async reviewAuthorizationRequest(params: ReviewAuthorizationRequestParams) {
    const { requestId, reviewerId, status, notes } = params;

    // Get the request
    const request = await prisma.authorizationRequest.findUnique({
      where: { id: requestId },
      include: {
        patient: true,
      },
    });

    if (!request) {
      throw new Error("Authorization request not found");
    }

    // Create the review
    const review = await prisma.authorizationReview.create({
      data: {
        requestId,
        reviewerId,
        status,
        notes,
      },
    });

    // Update the request status
    await prisma.authorizationRequest.update({
      where: { id: requestId },
      data: {
        status,
        reviewedAt: new Date(),
      },
    });

    // Create notification for patient
    await prisma.notification.create({
      data: {
        userId: request.patient.userId,
        type: status === "APPROVED" ? "AUTHORIZATION_APPROVED" : "AUTHORIZATION_REJECTED",
        title: `Authorization Request ${status === "APPROVED" ? "Approved" : "Rejected"}`,
        message: `Your authorization request has been ${status.toLowerCase()} by the HMO`,
        relatedEntityId: requestId,
        relatedEntityType: "AuthorizationRequest",
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: reviewerId,
        action: "UPDATE",
        entityType: "AuthorizationRequest",
        entityId: requestId,
        details: `Authorization request ${requestId} ${status.toLowerCase()} by HMO staff`,
      },
    });

    return review;
  }

  /**
   * Validate an authorization code for service delivery
   */
  async validateAuthorizationCode(authCode: string, serviceId: string) {
    // Find the authorization request by code
    const authRequest = await prisma.authorizationRequest.findFirst({
      where: {
        authorizationCode: authCode,
        status: "APPROVED",
      },
      include: {
        services: true,
      },
    });

    if (!authRequest) {
      return {
        valid: false,
        message: "Invalid or expired authorization code",
      };
    }

    // Check if the service is included in the authorization
    const serviceIncluded = authRequest.services.some(
      (s) => s.serviceId === serviceId
    );

    if (!serviceIncluded) {
      return {
        valid: false,
        message: "Service not included in this authorization",
      };
    }

    // Check if the authorization has expired (e.g., 30 days validity)
    const validityDays = 30;
    const expiryDate = new Date(authRequest.createdAt);
    expiryDate.setDate(expiryDate.getDate() + validityDays);

    if (new Date() > expiryDate) {
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
   * Record service delivery
   */
  async recordServiceDelivery(authCode: string, serviceId: string, staffId: string) {
    // Validate the authorization code
    const validation = await this.validateAuthorizationCode(authCode, serviceId);

    if (!validation.valid) {
      throw new Error(validation.message);
    }

    const authRequest = validation.authRequest;

    // Record the service delivery
    const serviceDelivery = await prisma.serviceDelivery.create({
      data: {
        authorizationRequestId: authRequest.id,
        serviceId,
        deliveredBy: staffId,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: staffId,
        action: "CREATE",
        entityType: "ServiceDelivery",
        entityId: serviceDelivery.id,
        details: `Service ${serviceId} delivered for authorization ${authCode}`,
      },
    });

    // Create notification for patient
    await prisma.notification.create({
      data: {
        userId: authRequest.patientId,
        type: "SERVICE_DELIVERED",
        title: "Service Delivered",
        message: `Your authorized service has been delivered`,
        relatedEntityId: serviceDelivery.id,
        relatedEntityType: "ServiceDelivery",
      },
    });

    return serviceDelivery;
  }

  /**
   * Generate a unique authorization code
   */
  private generateAuthorizationCode(): string {
    // Generate a random 8-character alphanumeric code
    const uuid = uuidv4();
    return `AUTH-${uuid.substring(0, 8).toUpperCase()}`;
  }
}