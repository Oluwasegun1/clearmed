"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Stethoscope, Heart, MapPin, Clock } from "lucide-react";

interface Appointment {
  id: string;
  doctor: string;
  specialty: string;
  type: string;
  time: string;
  location: string;
  icon: React.ElementType;
  iconBg: string;
  status: "upcoming" | "confirmed" | "pending";
}

const appointments: Appointment[] = [
  {
    id: "1",
    doctor: "Dr. Sarah Johnson",
    specialty: "General Practice",
    type: "General Checkup",
    time: "Tomorrow • 2:00 PM",
    location: "Downtown Clinic",
    icon: Stethoscope,
    iconBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    status: "confirmed",
  },
  {
    id: "2",
    doctor: "Dr. Michael Chen",
    specialty: "Cardiology",
    type: "Cardiology Follow-up",
    time: "Next Friday • 10:30 AM",
    location: "Heart Center",
    icon: Heart,
    iconBg: "bg-red-500/10 text-red-600 dark:text-red-400",
    status: "upcoming",
  },
];

const statusStyles: Record<Appointment["status"], string> = {
  confirmed: "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/20",
  upcoming: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20",
  pending: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20",
};

export function UpcomingAppointments() {
  return (
    <Card className="data-visualization">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold text-foreground">
              Upcoming Appointments
            </CardTitle>
            <CardDescription>Your scheduled healthcare visits</CardDescription>
          </div>
          <Button variant="ghost" size="sm" className="h-7 text-xs">
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {appointments.map((appt) => (
          <div
            key={appt.id}
            className="flex items-center gap-4 p-4 rounded-xl bg-card/50 border border-border/50 hover:border-border transition-colors"
          >
            <div
              className={`w-11 h-11 rounded-xl ${appt.iconBg} flex items-center justify-center shrink-0`}
            >
              <appt.icon className="h-5 w-5" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold text-foreground truncate">
                  {appt.doctor}
                </p>
                <Badge
                  className={`text-xs capitalize border ${statusStyles[appt.status]}`}
                >
                  {appt.status}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{appt.type}</p>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {appt.time}
                </span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {appt.location}
                </span>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs shrink-0 text-muted-foreground hover:text-foreground"
            >
              Reschedule
            </Button>
          </div>
        ))}

        <Button
          variant="outline"
          className="w-full h-9 text-sm border-dashed hover:border-primary/40 hover:bg-primary/5 hover:text-primary transition-colors"
        >
          + Book New Appointment
        </Button>
      </CardContent>
    </Card>
  );
}
