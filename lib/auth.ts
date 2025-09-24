import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import UserRole from "@/lib/generated/prisma/UserRole";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

// Get the current session
export async function getSession() {
  return await getServerSession(authOptions);
}

// Check if user is authenticated
export async function getCurrentUser() {
  const session = await getSession();

  if (!session?.user?.email) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: {
      email: session.user.email,
    },
  });

  if (!user) {
    return null;
  }

  return user;
}

// Hash password
export async function hashPassword(password: string) {
  return await bcrypt.hash(password, 10);
}

// Register a new user
export async function registerUser(userData: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: UserRole;
}) {
  const { email, password, firstName, lastName, phoneNumber, role } = userData;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error("User with this email already exists");
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phoneNumber,
      role,
    },
  });

  return user;
}

// Role-based access control
export function requireAuth(allowedRoles?: UserRole[]) {
  return async function () {
    const session = await getSession();

    if (!session?.user) {
      return redirect("/auth/login");
    }

    if (allowedRoles && allowedRoles.length > 0) {
      const userRole = session.user.role as UserRole;
      if (!allowedRoles.includes(userRole)) {
        return redirect("/auth/unauthorized");
      }
    }
  };
}

// Role-specific redirects
export async function redirectBasedOnRole() {
  const session = await getSession();

  if (!session?.user) {
    return redirect("/auth/login");
  }

  const role = session.user.role as UserRole;

  switch (role) {
    case "PATIENT":
      return redirect("/personal/dashboard");
    case "DOCTOR":
    case "HOSPITAL_ADMIN":
    case "PHARMACY":
    case "LAB":
      return redirect("/hospital/dashboard");
    case "HMO_STAFF":
    case "HMO_ADMIN":
      return redirect("/hmo/dashboard");
    case "SYSTEM_ADMIN":
      return redirect("/admin/dashboard");
    default:
      return redirect("/auth/login");
  }
}