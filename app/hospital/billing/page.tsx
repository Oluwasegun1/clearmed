"use client";

/**
 * Hospital Admin — Financial & Claims Overview
 */

import { useState, useEffect } from "react";
import { HospitalSidebarWrapper } from "@/components/sidebars";
import { UserRole } from "@/lib/enums/UserRole";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CreditCard, DollarSign, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function HospitalBillingPage() {
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/hospital/requests")
      .then((r) => r.json())
      .then((d) => setClaims(Array.isArray(d) ? d : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalValue = claims.reduce((sum, item) => sum + (item.price || 0), 0);
  const approvedClaims = claims.filter((c) => c.status === "APPROVED" || c.status === "AUTO_APPROVED");
  const approvedValue = approvedClaims.reduce((sum, item) => sum + (item.price || 0), 0);

  return (
    <HospitalSidebarWrapper currentPath="/hospital/billing" role={UserRole.HOSPITAL_ADMIN}>
      <div className="min-h-screen bg-background overflow-auto p-6 max-w-6xl mx-auto space-y-6">
        <div className="border-b pb-4">
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-primary" /> Billing & Claims Overview
          </h1>
          <p className="text-sm text-muted-foreground">Track pre-authorized service claims and HMO reimbursements</p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="data-visualization">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">₦</div>
              <div>
                <p className="text-xs text-muted-foreground">Total Claims Value</p>
                <p className="text-2xl font-bold">₦{totalValue.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="data-visualization">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-green-500/10 text-green-600 flex items-center justify-center font-bold"><CheckCircle2 className="h-5 w-5" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Approved for Payment</p>
                <p className="text-2xl font-bold">₦{approvedValue.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="data-visualization">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-yellow-500/10 text-yellow-600 flex items-center justify-center font-bold"><Clock className="h-5 w-5" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Pending Claims</p>
                <p className="text-2xl font-bold">{claims.filter(c => c.status === "PENDING").length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Claims List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : claims.length === 0 ? (
          <Card className="data-visualization">
            <CardContent className="p-8 text-center">
              <CreditCard className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No billing or claim records found.</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="data-visualization">
            <CardHeader>
              <CardTitle className="text-base">Recent Service Claims</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/60">
                {claims.map((claim) => (
                  <div key={claim.id} className="p-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-foreground text-sm">{claim.patientName}</p>
                      <p className="text-xs text-muted-foreground">{claim.serviceName} • HMO: {claim.hmoName}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-foreground">₦{claim.price.toLocaleString()}</p>
                      <Badge variant="outline" className="mt-0.5">{claim.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </HospitalSidebarWrapper>
  );
}
