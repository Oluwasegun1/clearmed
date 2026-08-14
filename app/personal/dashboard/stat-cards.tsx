"use client";

import { MetricCard, type MetricColor, type MetricTrend } from "@/components/shared/metric-card";
import { Heart, Pill, Calendar, Shield, ArrowUpRight, TrendingDown, Clock } from "lucide-react";

interface StatItem {
  label: string;
  value: string;
  sub: string;
  badge: string;
  trend: MetricTrend;
  icon: typeof Heart;
  iconColor: MetricColor;
  progress?: number;
}

export function StatCards() {
  const stats: StatItem[] = [
    {
      label: "Health Score",
      value: "85",
      sub: "vs last month",
      badge: "+5",
      trend: "up",
      icon: Heart,
      iconColor: "green",
      progress: 85,
    },
    {
      label: "Active Medications",
      value: "3",
      sub: "next in 30 min",
      badge: "2 due",
      trend: "stable",
      icon: Pill,
      iconColor: "blue",
    },
    {
      label: "Appointments",
      value: "2",
      sub: "next tomorrow",
      badge: "upcoming",
      trend: "stable",
      icon: Calendar,
      iconColor: "purple",
    },
    {
      label: "Coverage Used",
      value: "25%",
      sub: "of annual limit",
      badge: "-3%",
      trend: "up", // up represents good trend direction in this custom mapping
      icon: Shield,
      iconColor: "green",
      progress: 25,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <MetricCard
          key={stat.label}
          label={stat.label}
          value={stat.value}
          sub={stat.sub}
          badge={stat.badge}
          trend={stat.trend}
          icon={stat.icon}
          iconColor={stat.iconColor}
          progress={stat.progress}
        />
      ))}
    </div>
  );
}

export { ArrowUpRight, TrendingDown, Clock };
