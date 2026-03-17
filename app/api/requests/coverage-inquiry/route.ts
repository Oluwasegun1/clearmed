/**
 * API route for patient-initiated HMO coverage inquiries.
 * Patient submits medical tests, treatments, and drugs to find out what the HMO will cover.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "PATIENT") {
      return NextResponse.json(
        { error: "Only patients can submit coverage inquiries" },
        { status: 403 }
      );
    }

    const patient = await prisma.patient.findFirst({
      where: { userId: session.user.id },
    });
    if (!patient) {
      return NextResponse.json(
        { error: "Patient record not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      medicalTests = [],
      treatments = [],
      drugs = [],
      notes = "",
    } = body as {
      medicalTests?: string[];
      treatments?: string[];
      drugs?: string[];
      notes?: string;
    };

    if (
      (!medicalTests || medicalTests.length === 0) &&
      (!treatments || treatments.length === 0) &&
      (!drugs || drugs.length === 0)
    ) {
      return NextResponse.json(
        {
          error:
            "Please add at least one item (medical test, treatment, or drug) to check coverage for.",
        },
        { status: 400 }
      );
    }

    // Store inquiry in notification or a simple audit for now; full CoverageInquiry model can be added later
    await prisma.notification.create({
      data: {
        userId: session.user.id,
        type: "COVERAGE_UPDATE",
        title: "Coverage inquiry submitted",
        message: `Coverage inquiry: Tests: ${(medicalTests || []).join(", ") || "none"}; Treatments: ${(treatments || []).join(", ") || "none"}; Drugs: ${(drugs || []).join(", ") || "none"}. ${notes ? `Notes: ${notes}` : ""}`,
        relatedEntityType: "CoverageInquiry",
      },
    });

    return NextResponse.json(
      {
        success: true,
        message:
          "Your coverage inquiry has been submitted. Your HMO will respond with what is covered.",
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to submit coverage inquiry";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
