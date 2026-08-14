'use client';

import { SessionProvider } from "next-auth/react";
import { ToastProvider } from "@/components/providers/toast-provider";
import { ThemeProvider } from "next-themes";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange={false}
    >
      <SessionProvider>
        <ToastProvider />
        {children}
      </SessionProvider>
    </ThemeProvider>
  );
}