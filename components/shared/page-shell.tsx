"use client";

import { cn } from "@/lib/utils";

interface PageShellProps {
  children: React.ReactNode;
  className?: string;
  /** Whether to show standard backdrops/gradients */
  withBackdrop?: boolean;
}

export function PageShell({ children, className, withBackdrop = true }: PageShellProps) {
  return (
    <div className={cn("min-h-full bg-background overflow-x-hidden relative", className)}>
      {withBackdrop && (
        <>
          {/* Subtle grid background */}
          <div className="fixed inset-0 professional-grid opacity-30 pointer-events-none" />

          {/* Top-right blur gradient */}
          <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-primary/3 rounded-full blur-[120px] pointer-events-none" />
          
          {/* Bottom-left blur gradient */}
          <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-accent/3 rounded-full blur-[100px] pointer-events-none" />
        </>
      )}
      <div className="relative flex flex-col min-h-screen">
        {children}
      </div>
    </div>
  );
}
