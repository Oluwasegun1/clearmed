import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authSecret } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
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

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) throw new Error("User not found");
        if (!user.isActive)
          throw new Error("Account is deactivated. Contact support.");

        const isValid = await bcrypt.compare(
          credentials.password,
          user.password,
        );
        if (!isValid) throw new Error("Invalid password");

        // Update last login timestamp
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() },
        });

        // Create audit log for login
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: "LOGIN",
            entityType: "User",
            entityId: user.id,
            details: "User logged in",
          },
        });

        return {
          id: user.id,
          email: user.email,
          role: user.role,
          name: `${user.firstName} ${user.lastName}`,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Allow relative URLs (e.g. callbackUrl from signIn)
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
