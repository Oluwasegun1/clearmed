"use client";

/**
 * Appointments: view and manage scheduled visits. Placeholder following project design system.
 */

import { PersonalSidebarWrapper } from "@/components/sidebars";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Stethoscope, Heart, Clock } from "lucide-react";

const placeholderAppointments = [
  {
    id: "1",
    provider: "Dr. Sarah Johnson",
    type: "General Checkup",
    date: "Tomorrow, 2:00 PM",
    location: "Downtown Clinic",
    status: "confirmed",
    icon: Stethoscope,
    color: "bg-blue-500/10",
    iconColor: "text-blue-400",
  },
  {
    id: "2",
    provider: "Dr. Michael Chen",
    type: "Cardiology Follow-up",
    date: "Next Friday, 10:30 AM",
    location: "Heart Center",
    status: "confirmed",
    icon: Heart,
    color: "bg-red-500/10",
    iconColor: "text-red-400",
  },
];

export default function AppointmentsPage() {
  return (
    <PersonalSidebarWrapper currentPath="/personal/appointments">
      <div className="min-h-screen bg-background overflow-x-hidden overflow-y-auto">
        <div className="fixed inset-0 professional-grid opacity-40 pointer-events-none" />
        <div className="relative border-b border-border/50 bg-card/30 backdrop-blur-xl">
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                Appointments
              </h1>
              <p className="text-sm text-muted-foreground">
                Your scheduled healthcare visits
              </p>
            </div>
            <Button size="sm" className="h-9">
              <Calendar className="h-4 w-4 mr-2" />
              Schedule
            </Button>
          </div>
        </div>
        <div className="relative p-6 space-y-6">
          <Card className="data-visualization">
            <CardHeader>
              <CardTitle className="text-base font-medium text-foreground">
                Upcoming
              </CardTitle>
              <CardDescription>
                Next appointments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {placeholderAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="flex items-center gap-4 p-3 rounded-lg bg-card/50 border border-border/50"
                  >
                    <div
                      className={`w-10 h-10 rounded-lg ${apt.color} flex items-center justify-center ${apt.iconColor}`}
                    >
                      <apt.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {apt.provider}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {apt.type}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {apt.date} • {apt.location}
                      </div>
                    </div>
                    <Badge variant="secondary" className="shrink-0">
                      {apt.status}
                    </Badge>
                    <Button variant="ghost" size="sm" className="h-8 text-xs">
                      Reschedule
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PersonalSidebarWrapper>
  );
}
