import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { verifyTotpCode } from "@/lib/mfa";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/auth/mfa/verify
 * Verifies 6-digit TOTP code for non-Patient staff accounts.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const { code } = await req.json();
    if (!code || typeof code !== "string" || code.trim().length !== 6) {
      return NextResponse.json(
        { message: "Please provide a valid 6-digit MFA verification code." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    // Default secret or user secret
    const secret = user.mfaSecret || "CLEARMED_STAFF_MFA_SECRET_KEY";
    const isValid = verifyTotpCode(secret, code.trim());

    if (!isValid) {
      // Audit log failed MFA
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "MFA_FAILED",
          entityType: "User",
          entityId: user.id,
          details: "Failed MFA verification attempt",
        },
      });

      return NextResponse.json(
        { message: "Invalid MFA verification code. Please check your authenticator app." },
        { status: 400 }
      );
    }

    // Mark MFA enabled on user if first time
    if (!user.mfaEnabled) {
      await prisma.user.update({
        where: { id: user.id },
        data: { mfaEnabled: true, mfaSecret: secret },
      });
    }

    // Audit log successful MFA verification
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "MFA_VERIFIED",
        entityType: "User",
        entityId: user.id,
        details: "MFA verification successful",
      },
    });

    return NextResponse.json(
      { message: "MFA verification successful." },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("MFA error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ message }, { status: 500 });
  }
}
