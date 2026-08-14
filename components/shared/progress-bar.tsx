"use client";

import { cn } from "@/lib/utils";

interface ProgressBarProps {
  label: string;
  value: number;
  max?: number;
  subText?: string;
  color?: "primary" | "green" | "yellow" | "red" | "blue" | "purple" | "orange";
  className?: string;
}

const progressColors = {
  primary: "bg-primary",
  green: "bg-green-500",
  yellow: "bg-yellow-500",
  red: "bg-red-500",
  blue: "bg-blue-500",
  purple: "bg-purple-500",
  orange: "bg-orange-500",
};

export function ProgressBar({
  label,
  value,
  max = 100,
  subText,
  color = "primary",
  className,
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">{label}</span>
        <div className="flex items-center gap-2">
          {subText && (
            <span className="text-xs text-muted-foreground">{subText}</span>
          )}
          <span className="font-bold text-foreground">
            {percentage.toFixed(0)}%
          </span>
        </div>
      </div>
      <div className="w-full bg-muted rounded-full h-2 overflow-hidden border border-border/20">
        <div
          className={cn("h-full rounded-full transition-all duration-500", progressColors[color])}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
