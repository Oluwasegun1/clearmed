import { DefaultSession } from "next-auth";
import { UserRole } from "@/lib/enums/UserRole";

declare module "next-auth" {
  interface User {
    id: string;
    role: UserRole;
    name: string;
  }

  interface Session extends DefaultSession {
    user: {
      id: string;
      role: UserRole;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
  }
}