"use client";

import Link from "next/link";
import { Shield, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface ContentPageShellProps {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
  ctaHref?: string;
  ctaLabel?: string;
}

export function ContentPageShell({
  eyebrow,
  title,
  description,
  children,
  ctaHref = "/auth/login",
  ctaLabel = "Back to sign in",
}: ContentPageShellProps) {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden overflow-y-auto">
      <div className="fixed inset-0 grid-pattern opacity-20 pointer-events-none" />

      <header className="relative z-50 border-b border-border/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">ClearMed</span>
          </Link>
          <Link href={ctaHref}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
              {ctaLabel}
            </Button>
          </Link>
        </div>
      </header>

      <main className="relative z-10 container mx-auto px-4 py-12 md:px-6">
        <div className="mx-auto flex max-w-4xl flex-col gap-8">
          <div className="space-y-4 text-center">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
              {eyebrow}
            </p>
            <h1 className="text-4xl font-bold text-balance md:text-5xl">
              {title}
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground text-pretty">
              {description}
            </p>
          </div>

          <Card className="glass-card p-6 md:p-10">{children}</Card>
        </div>
      </main>
    </div>
  );
}
