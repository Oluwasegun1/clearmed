"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

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
  | "inactive";

interface StatusBadgeProps {
  status: StatusType | string;
  className?: string;
}

const statusStyles: Record<string, string> = {
  approved: "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/20",
  auto_approved: "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/20",
  success: "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/20",
  active: "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/20",
  
  pending: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20",
  warning: "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/20",
  
  denied: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/20",
  rejected: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/20",
  expired: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/20",
  inactive: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/20",
  
  info: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20",
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalizedStatus = status.toLowerCase().replace(/[\s_-]+/g, "_");
  const baseStyle = statusStyles[normalizedStatus] || "bg-muted text-muted-foreground border-border/50";
  
  // Pretty format for display
  const displayLabel = status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-semibold text-xs tracking-wide px-2.5 py-0.5 rounded-full border transition-colors shrink-0",
        baseStyle,
        className
      )}
    >
      {displayLabel}
    </Badge>
  );
}
