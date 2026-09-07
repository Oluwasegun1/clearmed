import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authSecret } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { isMfaRequiredForRole } from "@/lib/mfa";

const INACTIVITY_TIMEOUT_SECONDS = 30 * 60; // 30 minutes of inactivity
const ABSOLUTE_SESSION_MAX_AGE_SECONDS = 12 * 60 * 60; // 12 hours absolute maximum

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: ABSOLUTE_SESSION_MAX_AGE_SECONDS,
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const normalizedEmail = credentials.email.trim().toLowerCase();
        const user = await prisma.user.findUnique({
          where: { email: normalizedEmail },
        });

        if (!user) {
          throw new Error("Invalid email or password");
        }

        if (!user.isActive) {
          throw new Error("Account is deactivated. Contact support.");
        }

        // 1. Check account lockout status (15-minute lockout after 5 failed attempts)
        const now = new Date();
        if (user.lockedUntil && user.lockedUntil > now) {
          const remainingMinutes = Math.ceil(
            (user.lockedUntil.getTime() - now.getTime()) / (60 * 1000)
          );
          throw new Error(
            `Account locked due to 5 failed login attempts. Please try again in ${remainingMinutes} minute(s).`
          );
        }

        // 2. Validate password
        const isValid = await bcrypt.compare(credentials.password, user.password);

        if (!isValid) {
          const newFailedAttempts = user.failedLoginAttempts + 1;
          const shouldLock = newFailedAttempts >= 5;
          const lockedUntil = shouldLock
            ? new Date(Date.now() + 15 * 60 * 1000) // 15-minute lockout
            : null;

          // Update user lockout state
          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: newFailedAttempts,
              lockedUntil: lockedUntil,
            },
          });

          // Log LOGIN_FAILED audit event
          await prisma.auditLog.create({
            data: {
              userId: user.id,
              action: "LOGIN_FAILED",
              entityType: "User",
              entityId: user.id,
              details: `Failed login attempt ${newFailedAttempts} of 5`,
            },
          });

          // Log ACCOUNT_LOCKED audit event if 5th attempt failed
          if (shouldLock) {
            await prisma.auditLog.create({
              data: {
                userId: user.id,
                action: "ACCOUNT_LOCKED",
                entityType: "User",
                entityId: user.id,
                details: `Account locked for 15 minutes after 5 failed attempts`,
              },
            });
            throw new Error(
              "Account locked due to 5 consecutive failed login attempts. Please try again after 15 minutes."
            );
          }

          throw new Error(
            `Invalid email or password. Attempt ${newFailedAttempts} of 5.`
          );
        }

        // 3. Password valid -> Reset failed attempts & update last login
        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: 0,
            lockedUntil: null,
            lastLogin: now,
          },
        });

        // Log successful LOGIN audit event
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: "LOGIN",
            entityType: "User",
            entityId: user.id,
            details: "User logged in successfully",
          },
        });

        const mfaRequired = isMfaRequiredForRole(user.role);

        return {
          id: user.id,
          email: user.email,
          role: user.role,
          name: `${user.firstName} ${user.lastName}`,
          mfaRequired,
          mfaVerified: !mfaRequired, // Patients are pre-verified; staff require MFA verification
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      const nowSeconds = Math.floor(Date.now() / 1000);

      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.mfaRequired = (user as unknown as { mfaRequired?: boolean }).mfaRequired ?? false;
        token.mfaVerified = (user as unknown as { mfaVerified?: boolean }).mfaVerified ?? false;
        token.createdAt = nowSeconds;
        token.lastActivity = nowSeconds;
        return token;
      }

      if (trigger === "update" && session) {
        if (typeof session.mfaVerified === "boolean") {
          token.mfaVerified = session.mfaVerified;
        }
        return token;
      }

      // Check 30-minute inactivity timeout
      const lastActivity = (token.lastActivity as number) || nowSeconds;
      if (nowSeconds - lastActivity > INACTIVITY_TIMEOUT_SECONDS) {
        // Session expired due to 30 minutes of inactivity
        return {} as typeof token;
      }

      // Check 12-hour absolute session cap
      const createdAt = (token.createdAt as number) || nowSeconds;
      if (nowSeconds - createdAt > ABSOLUTE_SESSION_MAX_AGE_SECONDS) {
        // Session expired due to 12-hour absolute limit
        return {} as typeof token;
      }

      // Update last activity timestamp for active session
      token.lastActivity = nowSeconds;
      return token;
    },
    async session({ session, token }) {
      if (!token.id) {
        // Return empty session if token expired
        return { expires: new Date(0).toISOString() } as typeof session;
      }

      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as any;
        (session.user as unknown as { mfaRequired?: boolean }).mfaRequired = token.mfaRequired as boolean;
        (session.user as unknown as { mfaVerified?: boolean }).mfaVerified = token.mfaVerified as boolean;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/") && !url.startsWith("//")) {
        return `${baseUrl}${url}`;
      }
      if (url.startsWith(baseUrl)) return url;
      return baseUrl;
    },
  },
  pages: {
    signIn: "/auth/login",
  },
  secret: authSecret,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

