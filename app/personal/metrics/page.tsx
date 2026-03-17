"use client";

/**
 * Health Metrics: view vitals and health trends. Placeholder following project design system.
 */

import { PersonalSidebarWrapper } from "@/components/sidebars";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Heart, Activity, Droplets, Scale, TrendingDown } from "lucide-react";

export default function HealthMetricsPage() {
  const metrics = [
    {
      label: "Blood Pressure",
      value: "120/80",
      unit: "mmHg",
      trend: "normal",
      icon: Heart,
      color: "text-red-400",
      bg: "bg-red-500/10",
    },
    {
      label: "Heart Rate",
      value: "72",
      unit: "bpm",
      trend: "stable",
      icon: Activity,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      label: "Blood Sugar",
      value: "95",
      unit: "mg/dL",
      trend: "fasting",
      icon: Droplets,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
    {
      label: "Weight",
      value: "70",
      unit: "kg",
      trend: "stable",
      icon: Scale,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
    },
  ];

  return (
    <PersonalSidebarWrapper currentPath="/personal/metrics">
      <div className="min-h-screen bg-background overflow-x-hidden overflow-y-auto">
        <div className="fixed inset-0 professional-grid opacity-40 pointer-events-none" />
        <div className="relative border-b border-border/50 bg-card/30 backdrop-blur-xl">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-semibold text-foreground">
              Health Metrics
            </h1>
            <p className="text-sm text-muted-foreground">
              Your vital signs and health trends
            </p>
          </div>
        </div>
        <div className="relative p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.map((metric) => (
              <Card key={metric.label} className="metric-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        {metric.label}
                      </p>
                      <p className="text-2xl font-bold text-foreground">
                        {metric.value}{" "}
                        <span className="text-sm font-normal text-muted-foreground">
                          {metric.unit}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {metric.trend}
                      </p>
                    </div>
                    <div
                      className={`h-10 w-10 rounded-lg ${metric.bg} flex items-center justify-center ${metric.color}`}
                    >
                      <metric.icon className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card className="data-visualization">
            <CardHeader>
              <CardTitle className="text-base font-medium text-foreground">
                Health score
              </CardTitle>
              <CardDescription>
                Overall wellness based on your recent metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Progress value={85} className="flex-1 h-3" />
                <span className="text-2xl font-bold text-foreground">85</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Good — keep up your routine. Last updated today.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </PersonalSidebarWrapper>
  );
}
