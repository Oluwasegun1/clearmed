"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingDown, TrendingUp, Minus, Pill, Calendar, FileText, Shield } from "lucide-react";
import { useRouter } from "next/navigation";

type Trend = "up" | "down" | "stable";
type Period = "7D" | "30D" | "90D";

interface VitalSign {
  name: string;
  sub: string;
  value: string;
  trend: Trend;
  trendLabel: string;
  color: string;
}

const vitals: VitalSign[] = [
  {
    name: "Blood Pressure",
    sub: "Systolic / Diastolic",
    value: "120/80",
    trend: "down",
    trendLabel: "-2% avg",
    color: "bg-green-500",
  },
  {
    name: "Heart Rate",
    sub: "Resting BPM",
    value: "72",
    trend: "stable",
    trendLabel: "Stable",
    color: "bg-blue-500",
  },
  {
    name: "Blood Sugar",
    sub: "Fasting glucose",
    value: "95 mg/dL",
    trend: "down",
    trendLabel: "-5% avg",
    color: "bg-amber-500",
  },
  {
    name: "Weight",
    sub: "Body weight",
    value: "70 kg",
    trend: "stable",
    trendLabel: "Stable",
    color: "bg-purple-500",
  },
];

function TrendIcon({ trend }: { trend: Trend }) {
  if (trend === "up")
    return <TrendingUp className="h-3 w-3 text-red-500 dark:text-red-400" />;
  if (trend === "down")
    return <TrendingDown className="h-3 w-3 text-green-600 dark:text-green-400" />;
  return <Minus className="h-3 w-3 text-muted-foreground" />;
}

interface QuickAction {
  label: string;
  sub: string;
  icon: React.ElementType;
  iconBg: string;
  href: string;
}

export function HealthTrendsAndActions() {
  const router = useRouter();
  const [activePeriod, setActivePeriod] = useState<Period>("30D");
  const periods: Period[] = ["7D", "30D", "90D"];

  const quickActions: QuickAction[] = [
    {
      label: "Medications",
      sub: "Manage prescriptions",
      icon: Pill,
      iconBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
      href: "/personal/medications",
    },
    {
      label: "Appointments",
      sub: "Schedule & manage",
      icon: Calendar,
      iconBg: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
      href: "/personal/appointments",
    },
    {
      label: "Medical Records",
      sub: "View history",
      icon: FileText,
      iconBg: "bg-green-500/10 text-green-600 dark:text-green-400",
      href: "/personal/records",
    },
    {
      label: "Make a Request",
      sub: "HMO coverage or hospital",
      icon: Shield,
      iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
      href: "/personal/request/new",
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Health Trends */}
      <Card className="lg:col-span-2 data-visualization">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-foreground">
                Vital Signs
              </CardTitle>
              <CardDescription>
                Your health metrics over the past {activePeriod}
              </CardDescription>
            </div>
            <div className="flex items-center gap-1 p-1 rounded-lg bg-muted">
              {periods.map((p) => (
                <button
                  key={p}
                  onClick={() => setActivePeriod(p)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all duration-200 ${
                    activePeriod === p
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          {vitals.map((vital) => (
            <div
              key={vital.name}
              className="flex items-center justify-between p-3.5 rounded-xl bg-card/50 border border-border/50 hover:border-border transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className={`w-2.5 h-2.5 rounded-full ${vital.color} ring-4 ring-offset-1 ring-offset-card ${vital.color}/20`} />
                <div>
                  <p className="text-sm font-medium text-foreground leading-none">
                    {vital.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {vital.sub}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-foreground">
                  {vital.value}
                </p>
                <div className="flex items-center justify-end gap-1 mt-0.5">
                  <TrendIcon trend={vital.trend} />
                  <span
                    className={`text-xs ${
                      vital.trend === "down"
                        ? "text-green-600 dark:text-green-400"
                        : vital.trend === "up"
                        ? "text-red-500 dark:text-red-400"
                        : "text-muted-foreground"
                    }`}
                  >
                    {vital.trendLabel}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="data-visualization">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-foreground">
            Quick Actions
          </CardTitle>
          <CardDescription>Frequently used features</CardDescription>
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => router.push(action.href)}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-card/50 border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 group text-left"
            >
              <div
                className={`w-9 h-9 rounded-lg ${action.iconBg} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-200`}
              >
                <action.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground leading-none">
                  {action.label}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {action.sub}
                </p>
              </div>
              <Badge variant="outline" className="ml-auto text-xs border-border/50 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                →
              </Badge>
            </button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
