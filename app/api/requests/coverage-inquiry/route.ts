/**
 * API route for patient-initiated HMO coverage inquiries.
 * POST: Patient submits medical tests, treatments, and drugs – saved to CoverageInquiry table.
 * GET:  Returns the authenticated patient's coverage inquiries (optionally filtered by status).
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

    const inquiry = await prisma.coverageInquiry.create({
      data: {
        patientId: patient.id,
        medicalTests: JSON.stringify(medicalTests),
        treatments: JSON.stringify(treatments),
        drugs: JSON.stringify(drugs),
        notes: notes || null,
        status: "PENDING",
      },
    });

    // Also fire a notification so HMO staff are alerted
    await prisma.notification.create({
      data: {
        userId: session.user.id,
        type: "COVERAGE_UPDATE",
        title: "Coverage inquiry submitted",
        message: `Tests: ${medicalTests.join(", ") || "none"} | Treatments: ${treatments.join(", ") || "none"} | Drugs: ${drugs.join(", ") || "none"}${notes ? ` | Notes: ${notes}` : ""}`,
        relatedEntityId: inquiry.id,
        relatedEntityType: "CoverageInquiry",
      },
    });

    return NextResponse.json(
      {
        success: true,
        id: inquiry.id,
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

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "PATIENT") {
      return NextResponse.json(
        { error: "Only patients can view coverage inquiries" },
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

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status");

    const inquiries = await prisma.coverageInquiry.findMany({
      where: {
        patientId: patient.id,
        ...(statusFilter && statusFilter.toUpperCase() !== "ALL"
          ? { status: statusFilter.toUpperCase() as "PENDING" | "REVIEWED" | "CLOSED" }
          : {}),
      },
      orderBy: { createdAt: "desc" },
    });

    // Deserialise JSON arrays and normalise shape for the frontend
    const normalised = inquiries.map((inq) => ({
      id: inq.id,
      type: "hmo" as const,
      status: inq.status,
      createdAt: inq.createdAt.toISOString(),
      notes: inq.notes ?? "",
      medicalTests: JSON.parse(inq.medicalTests || "[]") as string[],
      treatments: JSON.parse(inq.treatments || "[]") as string[],
      drugs: JSON.parse(inq.drugs || "[]") as string[],
    }));

    return NextResponse.json(normalised);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch coverage inquiries";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
