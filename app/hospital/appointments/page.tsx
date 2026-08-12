"use client";

/**
 * Hospital — Appointments Page
 */

import { useState, useEffect } from "react";
import { HospitalSidebarWrapper } from "@/components/sidebars";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, Loader2, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function HospitalAppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/hospital/requests")
      .then((r) => r.json())
      .then((d) => setAppointments(Array.isArray(d) ? d : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <HospitalSidebarWrapper currentPath="/hospital/appointments">
      <div className="min-h-screen bg-background overflow-auto p-6 max-w-5xl mx-auto space-y-6">
        <div className="border-b pb-4">
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Calendar className="h-6 w-6 text-primary" /> Hospital Appointments & Consultations
          </h1>
          <p className="text-sm text-muted-foreground">Scheduled patient visits and pre-authorized service appointments</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : appointments.length === 0 ? (
          <Card className="data-visualization">
            <CardContent className="p-8 text-center">
              <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No upcoming appointments scheduled.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {appointments.map((apt) => (
              <Card key={apt.id} className="data-visualization">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{apt.patientName}</p>
                      <p className="text-sm text-muted-foreground">{apt.serviceName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                      Scheduled
                    </Badge>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end mt-1">
                      <Clock className="h-3 w-3" /> {new Date(apt.requestDate).toLocaleDateString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </HospitalSidebarWrapper>
  );
}
