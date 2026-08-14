"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Minus, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type MetricTrend = "up" | "down" | "stable";

/** Colour palette for the icon container. Maps to safe Tailwind pairings. */
export type MetricColor =
  | "primary"
  | "green"
  | "blue"
  | "purple"
  | "amber"
  | "red"
  | "orange";

const iconBgMap: Record<MetricColor, string> = {
  primary: "bg-primary/10 text-primary",
  green: "bg-green-500/10 text-green-600 dark:text-green-400",
  blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  purple: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  red: "bg-red-500/10 text-red-600 dark:text-red-400",
  orange: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
};

const trendColorMap: Record<MetricTrend, string> = {
  up: "text-green-600 dark:text-green-400",
  down: "text-red-500 dark:text-red-400",
  stable: "text-muted-foreground",
};

const badgeBgMap: Record<MetricTrend, string> = {
  up: "bg-green-500/10 text-green-600 dark:text-green-400",
  down: "bg-red-500/10 text-red-500 dark:text-red-400",
  stable: "bg-muted text-muted-foreground",
};

export interface MetricCardProps {
  /** Short label shown above the value */
  label: string;
  /** Primary large number / text */
  value: string;
  /** Smaller secondary line below value */
  sub?: string;
  /** Trend badge text e.g. "+5%" or "2 due" */
  badge?: string;
  /** Direction of the badge arrow */
  trend?: MetricTrend;
  /** Lucide icon component */
  icon: LucideIcon;
  /** Icon background colour palette */
  iconColor?: MetricColor;
  /** 0-100 progress value. Renders a progress bar when provided. */
  progress?: number;
  className?: string;
}

export function MetricCard({
  label,
  value,
  sub,
  badge,
  trend = "stable",
  icon: Icon,
  iconColor = "primary",
  progress,
  className,
}: MetricCardProps) {
  const TrendIcon =
    trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

  return (
    <Card
      className={cn(
        "metric-card group hover:shadow-lg transition-all duration-300",
        className
      )}
    >
      <CardContent className="p-5">
        {/* Top row: icon + badge */}
        <div className="flex items-start justify-between mb-4">
          <div
            className={cn(
              "h-11 w-11 rounded-xl flex items-center justify-center",
              "ring-1 ring-inset ring-border/20",
              "group-hover:scale-110 transition-transform duration-300",
              iconBgMap[iconColor]
            )}
          >
            <Icon className="h-5 w-5" />
          </div>

          {badge && (
            <span
              className={cn(
                "flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full",
                badgeBgMap[trend]
              )}
            >
              <TrendIcon className={cn("h-3 w-3", trendColorMap[trend])} />
              {badge}
            </span>
          )}
        </div>

        {/* Text */}
        <div className="space-y-0.5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
            {label}
          </p>
          <p className="text-3xl font-bold text-foreground tracking-tight">
            {value}
          </p>
          {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
        </div>

        {/* Optional progress bar */}
        {progress !== undefined && (
          <div className="mt-4">
            <Progress value={progress} className="h-1.5 bg-muted" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
