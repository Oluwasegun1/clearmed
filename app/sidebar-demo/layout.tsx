"use client";

import { SessionProvider } from "next-auth/react";

export default function SidebarDemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SessionProvider>{children}</SessionProvider>;
}