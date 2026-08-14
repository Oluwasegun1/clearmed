"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { Calendar, Phone, Bell } from "lucide-react";

interface DashboardHeaderProps {
  userName?: string | null;
  planName?: string;
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function DashboardHeader({
  userName,
  planName = "Premium Plan",
}: DashboardHeaderProps) {
  const displayName = userName?.split(" ")[0] || "there";
  const greeting = `${getGreeting()}, ${displayName} 👋`;

  return (
    <PageHeader
      title={greeting}
      badge={
        <Badge className="bg-primary/10 text-primary border border-primary/20 text-xs font-semibold px-2.5 py-0.5 rounded-full">
          {planName}
        </Badge>
      }
      subtitle="Your health dashboard is up to date"
      actions={
        <>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 relative"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
          </Button>
          <Button variant="outline" size="sm" className="h-9 hidden sm:flex">
            <Calendar className="h-4 w-4 mr-2" />
            Schedule
          </Button>
          <Button
            size="sm"
            className="h-9 bg-red-600 hover:bg-red-700 text-white border-0"
          >
            <Phone className="h-4 w-4 mr-2" />
            Emergency
          </Button>
        </>
      }
    />
  );
}
