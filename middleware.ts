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

  // If authenticated but trying to access auth pages (excluding root and sidebar-demo)
  if (token && isPublicRoute && !pathname.startsWith("/sidebar-demo") && pathname !== "/") {
    const role = token.role as string;

    if (role.includes("PATIENT")) {
      return NextResponse.redirect(new URL("/personal/dashboard", request.url));
    } else if (
      role.includes("DOCTOR") ||
      role.includes("HOSPITAL_ADMIN") ||
      role.includes("PHARMACY") ||
      role.includes("LAB")
    ) {
      return NextResponse.redirect(new URL("/hospital/dashboard", request.url));
    } else if (role.includes("HMO_")) {
      return NextResponse.redirect(new URL("/hmo/dashboard", request.url));
    } else if (role === "SYSTEM_ADMIN") {
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
