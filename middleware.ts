import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { authSecret } from "@/lib/auth-config";
import { checkRateLimit, getClientIp, createRateLimitResponse } from "@/lib/rate-limit";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = getClientIp(request);

  // 1. Rate Limiting on API endpoints
  if (pathname.startsWith("/api")) {
    const isAuthApi = pathname.startsWith("/api/auth");
    const rateLimit = checkRateLimit(ip, {
      maxRequests: isAuthApi ? 10 : 100, // 10 req/min for auth, 100 req/min for public API
      windowMs: 60000,
      keyPrefix: isAuthApi ? "auth-api" : "pub-api",
    });

    if (!rateLimit.isAllowed) {
      return createRateLimitResponse(rateLimit.limit, rateLimit.resetTimeMs);
    }
  }

  const token = await getToken({ req: request, secret: authSecret });

  // Public routes accessible without authentication
  const publicRoutes = [
    "/auth/login",
    "/auth/register",
    "/auth/forgot-password",
    "/sidebar-demo",
    "/terms",
    "/privacy",
    "/contact",
  ];
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Protected route prefixes requiring login
  const protectedPrefixes = ["/personal", "/hospital", "/hmo", "/admin"];
  const isProtectedRoute = protectedPrefixes.some((prefix) =>
    pathname.startsWith(prefix)
  );

  // If not authenticated and trying to access protected route
  if (!token && isProtectedRoute) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  // 2. MFA Enforcement: Non-patient roles must complete MFA before accessing protected routes
  if (token) {
    const mfaRequired = Boolean(token.mfaRequired);
    const mfaVerified = Boolean(token.mfaVerified);

    if (mfaRequired && !mfaVerified && isProtectedRoute && !pathname.startsWith("/auth/mfa")) {
      return NextResponse.redirect(new URL("/auth/mfa", request.url));
    }
  }

  // Authenticated user on home: redirect to role-specific dashboard
  if (token && pathname === "/") {
    const role = token.role as string;
    if (role === "PATIENT") {
      return NextResponse.redirect(new URL("/personal/dashboard", request.url));
    }
    if (
      role === "DOCTOR" ||
      role === "HOSPITAL_ADMIN" ||
      role === "PHARMACY" ||
      role === "LAB"
    ) {
      return NextResponse.redirect(new URL("/hospital/dashboard", request.url));
    }
    if (role?.startsWith("HMO_")) {
      return NextResponse.redirect(new URL("/hmo/dashboard", request.url));
    }
    if (role === "SYSTEM_ADMIN") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
  }

  // Allow /auth/login and /auth/mfa when authenticated so user can complete MFA or sign out
  if (token && isPublicRoute && !pathname.startsWith("/sidebar-demo") && pathname !== "/") {
    if (pathname.startsWith("/auth/login") || pathname.startsWith("/auth/mfa")) {
      return NextResponse.next();
    }
    const role = token.role as string;
    if (role.includes("PATIENT")) {
      return NextResponse.redirect(new URL("/personal/dashboard", request.url));
    }
    if (
      role.includes("DOCTOR") ||
      role.includes("HOSPITAL_ADMIN") ||
      role.includes("PHARMACY") ||
      role.includes("LAB")
    ) {
      return NextResponse.redirect(new URL("/hospital/dashboard", request.url));
    }
    if (role.includes("HMO_")) {
      return NextResponse.redirect(new URL("/hmo/dashboard", request.url));
    }
    if (role === "SYSTEM_ADMIN") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
  }

  // Role-based access control
  if (token) {
    const role = token.role as string;

    if (pathname.startsWith("/personal") && !role.includes("PATIENT")) {
      return NextResponse.redirect(new URL("/auth/unauthorized", request.url));
    }

    if (
      pathname.startsWith("/hospital") &&
      !(
        role.includes("DOCTOR") ||
        role.includes("HOSPITAL_ADMIN") ||
        role.includes("PHARMACY") ||
        role.includes("LAB")
      )
    ) {
      return NextResponse.redirect(new URL("/auth/unauthorized", request.url));
    }

    if (pathname.startsWith("/hmo") && !role.includes("HMO_")) {
      return NextResponse.redirect(new URL("/auth/unauthorized", request.url));
    }

    if (pathname.startsWith("/admin") && role !== "SYSTEM_ADMIN") {
      return NextResponse.redirect(new URL("/auth/unauthorized", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

