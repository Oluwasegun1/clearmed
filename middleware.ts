import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const { pathname } = request.nextUrl;

  // Public routes accessible without authentication
  const publicRoutes = [
    "/auth/login",
    "/auth/register",
    "/auth/forgot-password",
    "/sidebar-demo",
  ];
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // If not authenticated and trying to access protected route
  if (!token && !isPublicRoute && pathname !== "/") {
    return NextResponse.redirect(new URL("/auth/login", request.url));
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

  // Allow /auth/login when authenticated so user can sign out and sign in as another role.
  // Other auth pages (register, forgot-password): redirect to role dashboard.
  if (token && isPublicRoute && !pathname.startsWith("/sidebar-demo") && pathname !== "/") {
    if (pathname.startsWith("/auth/login")) {
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
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
