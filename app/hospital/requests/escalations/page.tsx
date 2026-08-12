"use client";

/**
 * Hospital Admin — Escalated Authorization Requests.
 * Displays requests that are rejected or pending review over 24 hours.
 */

import { useState, useEffect } from "react";
import { HospitalSidebarWrapper } from "@/components/sidebars";
import { UserRole } from "@/lib/enums/UserRole";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RequestItem {
  id: string;
  authCode: string;
  status: string;
  requestDate: string;
  patientName: string;
  hmoName: string;
  serviceName: string;
  price: number;
  reviewComments: string | null;
}

export default function HospitalEscalationsPage() {
  const [escalations, setEscalations] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEscalations = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/hospital/requests");
      const data = await res.json();
      if (Array.isArray(data)) {
        // Filter for REJECTED or PENDING requests
        const filtered = data.filter(
          (r: RequestItem) => r.status === "REJECTED" || r.status === "PENDING"
        );
        setEscalations(filtered);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEscalations();
  }, []);

  return (
    <HospitalSidebarWrapper currentPath="/hospital/requests/escalations" role={UserRole.HOSPITAL_ADMIN}>
      <div className="min-h-screen bg-background overflow-auto p-6 space-y-6">
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-amber-500" /> Escalated & Flagged Requests
            </h1>
            <p className="text-sm text-muted-foreground">
              Requests requiring administrative attention, HMO follow-up, or appeal
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchEscalations} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : escalations.length === 0 ? (
          <Card className="data-visualization">
            <CardContent className="p-8 text-center">
              <AlertTriangle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No escalated requests at this time.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {escalations.map((item) => (
              <Card key={item.id} className="data-visualization border-amber-500/30">
                <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{item.patientName}</h3>
                      <Badge variant="outline" className={item.status === "REJECTED" ? "bg-red-500/10 text-red-600" : "bg-yellow-500/10 text-yellow-600"}>
                        {item.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {item.serviceName} • HMO: {item.hmoName}
                    </p>
                    {item.reviewComments && (
                      <p className="text-xs text-amber-600 mt-2 bg-amber-500/10 p-2 rounded">
                        HMO Note: {item.reviewComments}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-foreground">₦{item.price.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(item.requestDate).toLocaleDateString()}
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
