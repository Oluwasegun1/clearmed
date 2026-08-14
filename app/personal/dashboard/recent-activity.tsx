"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FlaskConical, Pill, Calendar, CheckCircle } from "lucide-react";

interface ActivityItem {
  id: string;
  title: string;
  sub: string;
  time: string;
  icon: React.ElementType;
  iconBg: string;
  dotColor: string;
}

const activities: ActivityItem[] = [
  {
    id: "1",
    title: "Lab results received",
    sub: "Complete Blood Count — Normal ranges",
    time: "2 hours ago",
    icon: FlaskConical,
    iconBg: "bg-green-500/10 text-green-600 dark:text-green-400",
    dotColor: "bg-green-500",
  },
  {
    id: "2",
    title: "Medication refilled",
    sub: "Lisinopril 10mg — 30 day supply",
    time: "1 day ago",
    icon: Pill,
    iconBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    dotColor: "bg-blue-500",
  },
  {
    id: "3",
    title: "Appointment confirmed",
    sub: "Dr. Sarah Johnson — General Checkup",
    time: "2 days ago",
    icon: Calendar,
    iconBg: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    dotColor: "bg-purple-500",
  },
  {
    id: "4",
    title: "Authorization approved",
    sub: "MRI scan — Lower back imaging",
    time: "3 days ago",
    icon: CheckCircle,
    iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    dotColor: "bg-amber-500",
  },
];

export function RecentActivity() {
  return (
    <Card className="data-visualization">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold text-foreground">
              Recent Activity
            </CardTitle>
            <CardDescription>Latest updates to your health record</CardDescription>
          </div>
          <Button variant="ghost" size="sm" className="h-7 text-xs">
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="relative">
          {/* Vertical timeline line */}
          <div className="absolute left-5 top-5 bottom-5 w-px bg-border/60" />

          <div className="space-y-1">
            {activities.map((item, idx) => (
              <div
                key={item.id}
                className="relative flex items-start gap-4 p-3 pl-3 rounded-xl hover:bg-muted/40 transition-colors group"
              >
                {/* Icon acts as timeline node */}
                <div
                  className={`relative z-10 w-10 h-10 rounded-lg ${item.iconBg} flex items-center justify-center shrink-0 ring-2 ring-background`}
                >
                  <item.icon className="h-4 w-4" />
                </div>

                <div className="flex-1 min-w-0 pt-1">
                  <p className="text-sm font-medium text-foreground leading-none">
                    {item.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {item.sub}
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    {item.time}
                  </p>
                </div>

                {idx === 0 && (
                  <span className="shrink-0 mt-1 text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    New
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
