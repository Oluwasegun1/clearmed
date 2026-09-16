"use client";

import type React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  HelpCircle,
  CheckCircle2,
  ShieldCheck,
  XCircle,
  CheckCheck,
  Ban,
  TimerOff,
  AlertCircle,
  Check,
} from "lucide-react";

export type AuthStatusKey =
  | "PENDING"
  | "MORE_INFORMATION_REQUIRED"
  | "APPROVED"
  | "AUTO_APPROVED"
  | "REJECTED"
  | "COMPLETED"
  | "CANCELLED"
  | "EXPIRED"
  | string;

export interface StatusMeta {
  label: string;
  description: string;
  style: string;
  icon: React.ElementType;
}

export const AUTH_STATUS_CONFIG: Record<string, StatusMeta> = {
  pending: {
    label: "Pending",
    description: "Submitted, awaiting HMO decision.",
    style: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25",
    icon: Clock,
  },
  more_information_required: {
    label: "More Info Required",
    description: "HMO has requested clarification; provider can resubmit with added detail.",
    style: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/25",
    icon: HelpCircle,
  },
  more_info_required: {
    label: "More Info Required",
    description: "HMO has requested clarification; provider can resubmit with added detail.",
    style: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/25",
    icon: HelpCircle,
  },
  approved: {
    label: "Approved",
    description: "HMO has approved this service. Reserves — does not yet consume — coverage.",
    style: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
    icon: CheckCircle2,
  },
  partially_approved: {
    label: "Partially Approved",
    description: "Some requested services approved; other services declined or requiring clarification.",
    style: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/25",
    icon: CheckCircle2,
  },
  auto_approved: {
    label: "Auto Approved",
    description: "Instantly authorized under automated coverage rules. Reserves coverage.",
    style: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
    icon: ShieldCheck,
  },
  rejected: {
    label: "Rejected",
    description: "HMO has declined this service. Requires a reason.",
    style: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25",
    icon: XCircle,
  },
  denied: {
    label: "Rejected",
    description: "HMO has declined this service. Requires a reason.",
    style: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25",
    icon: XCircle,
  },
  completed: {
    label: "Completed",
    description: "Service has been fulfilled (confirmed by pharmacy/lab/provider). Consumes coverage.",
    style: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25",
    icon: CheckCheck,
  },
  cancelled: {
    label: "Cancelled",
    description: "Withdrawn by the provider or patient before a decision, or after approval but before fulfillment.",
    style: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/25",
    icon: Ban,
  },
  canceled: {
    label: "Cancelled",
    description: "Withdrawn by the provider or patient before a decision, or after approval but before fulfillment.",
    style: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/25",
    icon: Ban,
  },
  expired: {
    label: "Expired",
    description: "PENDING longer than the SLA window with no HMO action.",
    style: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/25",
    icon: TimerOff,
  },
  active: {
    label: "Active",
    description: "Currently active.",
    style: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
    icon: Check,
  },
  inactive: {
    label: "Inactive",
    description: "Currently inactive.",
    style: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/25",
    icon: Ban,
  },
};

export interface StatusBadgeProps {
  status: AuthStatusKey;
  showIcon?: boolean;
  showTooltip?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function StatusBadge({
  status,
  showIcon = true,
  showTooltip = true,
  size = "md",
  className,
}: StatusBadgeProps) {
  const normalizedKey = (status || "").toString().toLowerCase().replace(/[\s_-]+/g, "_");
  const config = AUTH_STATUS_CONFIG[normalizedKey] || {
    label: (status || "")
      .toString()
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase()),
    description: "",
    style: "bg-muted text-muted-foreground border-border/50",
    icon: AlertCircle,
  };

  const IconComponent = config.icon;

  const sizeClasses = {
    sm: "text-[11px] px-2 py-0.2 gap-1",
    md: "text-xs px-2.5 py-0.5 gap-1.5",
    lg: "text-sm px-3 py-1 gap-2 font-medium",
  }[size];

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-3.5 h-3.5",
    lg: "w-4 h-4",
  }[size];

  return (
    <Badge
      variant="outline"
      title={showTooltip ? config.description || config.label : undefined}
      className={cn(
        "font-semibold tracking-wide rounded-full border transition-colors shrink-0 inline-flex items-center select-none",
        sizeClasses,
        config.style,
        className
      )}
    >
      {showIcon && <IconComponent className={cn(iconSizes, "shrink-0")} />}
      <span>{config.label}</span>
    </Badge>
  );
}

export default StatusBadge;
