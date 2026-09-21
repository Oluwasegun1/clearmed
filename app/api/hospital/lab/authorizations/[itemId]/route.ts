/**
 * PATCH /api/hospital/lab/authorizations/[itemId]
 *
 * Marks a lab AuthorizationItem as COMPLETED and records a ServiceDelivery
 * for utilization tracking (Section 12.1). Cascades request status to COMPLETED
 * when all items are resolved.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = session.user.role as string;
    if (role !== "LAB") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { itemId } = await params;
    const body = await request.json().catch(() => ({}));
    const fulfillmentNotes: string | undefined = body.fulfillmentNotes;

    // Resolve HospitalStaff record for the fulfiller
    const staffRecord = await prisma.hospitalStaff.findFirst({
      where: { userId: session.user.id },
    });

    // Load the item with its parent request
    const item = await prisma.authorizationItem.findUnique({
      where: { id: itemId },
      include: {
        authRequest: {
          include: {
            items: true,
            serviceDelivery: true,
          },
        },
      },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    if (!["APPROVED", "AUTO_APPROVED"].includes(item.status)) {
      return NextResponse.json(
        { error: "Item is not in an approved state" },
        { status: 400 }
      );
    }

    const now = new Date();

    // Mark item as COMPLETED
    const updatedItem = await prisma.authorizationItem.update({
      where: { id: itemId },
      data: {
        status: "COMPLETED",
        fulfilledById: staffRecord?.id ?? undefined,
        fulfilledAt: now,
        fulfillmentNotes: fulfillmentNotes ?? null,
        actualCost: item.cost,
      },
    });

    // Utilization tracking (Section 12.1): create ServiceDelivery if not already present
    const req = item.authRequest;
    if (!req.serviceDelivery && staffRecord) {
      const targetServiceId =
        item.serviceId ??
        (await prisma.service.findFirst())?.id;

      if (targetServiceId) {
        await prisma.serviceDelivery.create({
          data: {
            authRequestId: req.id,
            deliveredById: staffRecord.id,
            serviceId: targetServiceId,
            deliveryDate: now,
            notes: fulfillmentNotes ?? `Lab test performed (item: ${item.description})`,
            actualQuantity: item.quantity,
            actualCost: item.cost,
          },
        }).catch(() => {
          // Non-blocking: ServiceDelivery creation may fail if duplicate
        });
      }
    }

    // Cascade: mark parent request COMPLETED if all items resolved
    const siblingItems = req.items.map((i) =>
      i.id === itemId ? { ...i, status: "COMPLETED" } : i
    );
    const resolvedStatuses = new Set(["COMPLETED", "REJECTED", "CANCELLED", "EXPIRED"]);
    const allResolved = siblingItems.every((i) => resolvedStatuses.has(i.status));

    if (allResolved) {
      await prisma.authorizationRequest.update({
        where: { id: req.id },
        data: { status: "COMPLETED" },
      });
    }

    return NextResponse.json({ success: true, item: updatedItem });
  } catch (error) {
    console.error("[lab/authorizations/[itemId]] PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to complete lab item" },
      { status: 500 }
    );
  }
}
