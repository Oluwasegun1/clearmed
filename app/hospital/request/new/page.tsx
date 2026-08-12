"use client";

/**
 * Hospital Doctor — Create Pre-Authorization Request.
 * Allows doctors to submit an authorization request to a patient's HMO.
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { HospitalSidebarWrapper } from "@/components/sidebars";
import { UserRole } from "@/lib/enums/UserRole";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PlusCircle, Loader2, AlertCircle, CheckCircle2, User, Stethoscope, Building2 } from "lucide-react";

interface PatientOption {
  id: string;
  name: string;
  hmoName: string;
  planName: string;
}

interface ServiceOption {
  id: string;
  name: string;
  category: string;
  standardPrice: number;
}

export default function DoctorCreateRequestPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [hospitals, setHospitals] = useState<{ id: string; name: string }[]>([]);

  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [selectedHospitalId, setSelectedHospitalId] = useState("");
  const [diagnosisCode, setDiagnosisCode] = useState("");
  const [diagnosisNotes, setDiagnosisNotes] = useState("");
  const [quantity, setQuantity] = useState("1");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [hospRes, servRes] = await Promise.all([
          fetch("/api/hospitals"),
          fetch("/api/services"),
        ]);

        const hospData = hospRes.ok ? await hospRes.json() : [];
        const servData = servRes.ok ? await servRes.json() : [];

        setHospitals(Array.isArray(hospData) ? hospData : []);
        setServices(Array.isArray(servData) ? servData : []);
        if (hospData.length > 0) setSelectedHospitalId(hospData[0].id);

        // Fetch patient profile if logged in or fallback mock list
        const patRes = await fetch("/api/patient/profile").catch(() => null);
        if (patRes && patRes.ok) {
          const p = await patRes.json();
          setPatients([{
            id: p.id || p.patientId,
            name: `${p.user?.firstName || "Patient"} ${p.user?.lastName || ""}`,
            hmoName: p.hmo?.name || "HMO Provider",
            planName: p.coveragePlan?.name || "Coverage Plan",
          }]);
          setSelectedPatientId(p.id || p.patientId);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/authorizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: selectedPatientId || undefined,
          hospitalId: selectedHospitalId,
          serviceId: selectedServiceId || undefined,
          diagnosisCode: diagnosisCode || "CONSULTATION",
          diagnosisNotes: diagnosisNotes || "Patient pre-authorization request",
          quantity: Number(quantity) || 1,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Failed to create request");

      setSuccess(true);
      setTimeout(() => router.push("/hospital/requests"), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error submitting request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <HospitalSidebarWrapper currentPath="/hospital/request/new">
      <div className="min-h-screen bg-background overflow-auto p-6 max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <PlusCircle className="h-6 w-6 text-primary" /> Create Pre-Authorization Request
          </h1>
          <p className="text-sm text-muted-foreground">
            Submit a treatment or test pre-authorization request to the patient's HMO
          </p>
        </div>

        {success && (
          <Alert className="bg-green-500/10 border-green-500/30">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle>Request Submitted</AlertTitle>
            <AlertDescription>The pre-authorization request was sent to the HMO. Redirecting…</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Card className="data-visualization">
            <CardHeader>
              <CardTitle className="text-base">Request Details</CardTitle>
              <CardDescription>Fill out medical diagnosis and service details</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Hospital Selection */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <Building2 className="h-4 w-4 text-muted-foreground" /> Hospital
                  </Label>
                  <Select value={selectedHospitalId} onValueChange={setSelectedHospitalId}>
                    <SelectTrigger><SelectValue placeholder="Select hospital..." /></SelectTrigger>
                    <SelectContent>
                      {hospitals.map((h) => (
                        <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Service Selection */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <Stethoscope className="h-4 w-4 text-muted-foreground" /> Service / Treatment Requested
                  </Label>
                  <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
                    <SelectTrigger><SelectValue placeholder="Select medical service..." /></SelectTrigger>
                    <SelectContent>
                      {services.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name} ({s.category}) — ₦{s.standardPrice.toLocaleString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Diagnosis & Quantity */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="diagnosisCode">Diagnosis Code / ICD Code</Label>
                    <Input
                      id="diagnosisCode"
                      placeholder="e.g. ICD-10-J06.9"
                      value={diagnosisCode}
                      onChange={(e) => setDiagnosisCode(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity / Units</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                    />
                  </div>
                </div>

                {/* Clinical Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Clinical Notes & Symptoms</Label>
                  <Textarea
                    id="notes"
                    rows={4}
                    placeholder="Enter clinical reasons, symptoms, or lab findings supporting this authorization request..."
                    value={diagnosisNotes}
                    onChange={(e) => setDiagnosisNotes(e.target.value)}
                    required
                  />
                </div>

                <Button type="submit" disabled={submitting} className="w-full gap-2 mt-4">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
                  Submit Request to HMO
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </HospitalSidebarWrapper>
  );
}
