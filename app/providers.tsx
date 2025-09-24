'use client';

import { SessionProvider } from "next-auth/react";
import { ToastProvider } from "@/components/providers/toast-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ToastProvider />
      {children}
    </SessionProvider>
  );
}