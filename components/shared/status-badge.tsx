"use client";

import type React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, XCircle, ShieldCheck, AlertCircle, Check, Ban } from "lucide-react";

export type StatusType =
  | "approved"
  | "auto_approved"
  | "pending"
  | "denied"
  | "rejected"
  | "expired"
  | "warning"
  | "success"
  | "info"
  | "active"
  | "inactive"
  | "completed"
  | "accepted"
  | string;

interface StatusBadgeProps {
  status: StatusType;
  showIcon?: boolean;
  className?: string;
}

const statusConfig: Record<
  string,
  { style: string; icon: React.ElementType }
> = {
  approved: {
    style: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    icon: CheckCircle2,
  },
  auto_approved: {
    style: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    icon: ShieldCheck,
  },
  success: {
    style: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    icon: CheckCircle2,
  },
  active: {
    style: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    icon: Check,
  },
  accepted: {
    style: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    icon: Check,
  },
  completed: {
    style: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    icon: ShieldCheck,
  },
  pending: {
    style: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    icon: Clock,
  },
  warning: {
    style: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
    icon: AlertCircle,
  },
  denied: {
    style: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    icon: XCircle,
  },
  rejected: {
    style: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    icon: XCircle,
  },
  expired: {
    style: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20",
    icon: Clock,
  },
  inactive: {
    style: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    icon: Ban,
  },
  info: {
    style: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
    icon: AlertCircle,
  },
};

export function StatusBadge({ status, showIcon = true, className }: StatusBadgeProps) {
  const normalizedKey = (status || "").toString().toLowerCase().replace(/[\s_-]+/g, "_");
  const config = statusConfig[normalizedKey] || {
    style: "bg-muted text-muted-foreground border-border/50",
    icon: AlertCircle,
  };
  const IconComponent = config.icon;

  const displayLabel = (status || "")
    .toString()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-semibold text-xs tracking-wide px-2.5 py-0.5 rounded-full border transition-colors shrink-0 inline-flex items-center gap-1.5",
        config.style,
        className
      )}
    >
      {showIcon && <IconComponent className="w-3.5 h-3.5 shrink-0" />}
      <span>{displayLabel}</span>
    </Badge>
  );
}
