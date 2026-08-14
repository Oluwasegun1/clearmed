"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type LucideIcon } from "lucide-react";

interface ListCardProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

export function ListCard({
  title,
  description,
  action,
  children,
  className,
  contentClassName,
}: ListCardProps) {
  return (
    <Card className={cn("data-visualization overflow-hidden", className)}>
      <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0 gap-4">
        <div className="space-y-0.5">
          <CardTitle className="text-base font-semibold text-foreground">
            {title}
          </CardTitle>
          {description && (
            <CardDescription className="text-sm">
              {description}
            </CardDescription>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </CardHeader>
      <CardContent className={cn("pt-0 space-y-2", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}

interface ListCardItemProps {
  icon?: LucideIcon;
  iconBg?: string;
  avatarText?: string;
  avatarBg?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  meta?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function ListCardItem({
  icon: Icon,
  iconBg = "bg-primary/10 text-primary",
  avatarText,
  avatarBg = "bg-primary/10 text-primary font-semibold text-sm",
  title,
  subtitle,
  meta,
  action,
  className,
  onClick,
}: ListCardItemProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center gap-4 p-3.5 rounded-xl border border-border/50 bg-card/50 hover:bg-muted/40 transition-all duration-200 group",
        onClick && "cursor-pointer hover:border-primary/20",
        className
      )}
    >
      {/* Icon or Avatar */}
      {Icon ? (
        <div
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105",
            iconBg
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      ) : avatarText ? (
        <div
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center shrink-0 border border-border/20 transition-transform duration-200 group-hover:scale-105",
            avatarBg
          )}
        >
          {avatarText.substring(0, 2).toUpperCase()}
        </div>
      ) : null}

      {/* Text Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {typeof title === "string" ? (
            <p className="text-sm font-semibold text-foreground leading-tight truncate">
              {title}
            </p>
          ) : (
            title
          )}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        )}
        {meta && <div className="mt-1">{meta}</div>}
      </div>

      {/* Right Side Action / Badge */}
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
