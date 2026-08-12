"use client";

/**
 * Hospital — Notifications Page
 */

import { HospitalSidebarWrapper } from "@/components/sidebars";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, CheckCircle2, Clock } from "lucide-react";

export default function HospitalNotificationsPage() {
  return (
    <HospitalSidebarWrapper currentPath="/hospital/notifications">
      <div className="min-h-screen bg-background overflow-auto p-6 max-w-4xl mx-auto space-y-6">
        <div className="border-b pb-4">
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" /> Hospital Notifications
          </h1>
          <p className="text-sm text-muted-foreground">Alerts for authorization updates, HMO responses, and patient arrivals</p>
        </div>

        <Card className="data-visualization">
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { title: "Pre-authorization Approved", desc: "ClearMed HMO approved pre-auth for General Consultation", time: "10 mins ago" },
              { title: "New Patient Request", desc: "A patient submitted a coverage inquiry to your facility", time: "1 hour ago" },
              { title: "System Maintenance", desc: "Scheduled HMO gateway sync at 11:00 PM tonight", time: "4 hours ago" },
            ].map((n, i) => (
              <div key={i} className="p-3 rounded-lg border bg-card flex items-start gap-3">
                <Bell className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground text-sm">{n.title}</p>
                  <p className="text-xs text-muted-foreground">{n.desc}</p>
                  <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {n.time}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </HospitalSidebarWrapper>
  );
}
