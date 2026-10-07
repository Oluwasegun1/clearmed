"use client";

/**
 * Hospital Doctor — Create Pre-Authorization Request (ClearMed v2.0).
 * Complies with Section 8.3 Patient Privacy & Binding Relationship Rules.
 * Step 1: Provider identifies patient (binding rule or exact Membership Number).
 * Step 2: Provider enters, per service: description, cost, reason, category, supporting documents.
 * Step 3: All services submitted as PENDING in a single request.
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { HospitalSidebarWrapper } from "@/components/sidebars";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  PlusCircle,
  Loader2,
  AlertCircle,
  CheckCircle2,
  User,
  Stethoscope,
  Building2,
  Search,
  ShieldCheck,
  Lock,
  Trash2,
  Plus,
  FileText,
  DollarSign,
} from "lucide-react";

interface PatientOption {
  id: string;
  name: string;
  email?: string;
  phoneNumber?: string;
  membershipNumber: string;
  hmoName: string;
  planName: string;
  bindingType?: string;
}

interface ServiceOption {
  id: string;
  name: string;
  category: string;
  standardPrice: number;
}

interface ServiceLineItem {
  id: string;
  serviceId?: string;
  description: string;
  category: string;
  cost: number;
  quantity: number;
  reason: string;
  supportingDocs?: string;
}

const CATEGORIES = [
  "Consultation",
  "Laboratory",
  "Pharmacy / Medication",
  "Radiology / Imaging",
  "Procedure / Surgery",
  "Physiotherapy",
  "General Care",
];

export default function DoctorCreateRequestPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [hospitals, setHospitals] = useState<{ id: string; name: string }[]>([]);

  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [selectedHospitalId, setSelectedHospitalId] = useState("");
  const [diagnosisCode, setDiagnosisCode] = useState("");
  const [overallDiagnosisNotes, setOverallDiagnosisNotes] = useState("");

  // Multi-service line items  
  const [items, setItems] = useState<ServiceLineItem[]>([
    {
      id: "item-1",
      description: "",
      category: "Consultation",
      cost: 5000,
      quantity: 1,
      reason: "",
      supportingDocs: "",
    },
  ]);

  // Membership lookup state
  const [membershipInput, setMembershipInput] = useState("");
  const [verifyingMembership, setVerifyingMembership] = useState(false);
  const [membershipError, setMembershipError] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [hospRes, servRes, patRes] = await Promise.all([
          fetch("/api/hospitals"),
          fetch("/api/services"),
          fetch("/api/hospital/patients"),
        ]);

        const hospData = hospRes.ok ? await hospRes.json() : [];
        const servData = servRes.ok ? await servRes.json() : [];
        const patData = patRes.ok ? await patRes.json() : [];

        setHospitals(Array.isArray(hospData) ? hospData : []);
        setServices(Array.isArray(servData) ? servData : []);
        setPatients(Array.isArray(patData) ? patData : []);

        if (hospData.length > 0) setSelectedHospitalId(hospData[0].id);
        if (patData.length > 0) setSelectedPatientId(patData[0].id);

        if (servData.length > 0) {
          setItems([
            {
              id: "item-1",
              serviceId: servData[0].id,
              description: servData[0].name,
              category: servData[0].category,
              cost: servData[0].standardPrice,
              quantity: 1,
              reason: "",
              supportingDocs: "",
            },
          ]);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const handleVerifyMembership = async () => {
    if (!membershipInput.trim()) return;
    setVerifyingMembership(true);
    setMembershipError("");

    try {
      const res = await fetch(
        `/api/hospital/patients?membershipNumber=${encodeURIComponent(membershipInput.trim())}`
      );
      const data = await res.json();

      if (!res.ok || !data || data.length === 0) {
        throw new Error(data.error || "No active patient found matching this Membership Number");
      }

      const verified = data[0] as PatientOption;
      setPatients((prev) => {
        const exists = prev.some((p) => p.id === verified.id);
        return exists ? prev : [verified, ...prev];
      });
      setSelectedPatientId(verified.id);
    } catch (err) {
      setMembershipError(err instanceof Error ? err.message : "Patient verification failed");
    } finally {
      setVerifyingMembership(false);
    }
  };

  const selectedPatient = patients.find((p) => p.id === selectedPatientId);

  // Line item manipulation
  const addItem = () => {
    const newItem: ServiceLineItem = {
      id: `item-${Date.now()}`,
      description: "",
      category: "Laboratory",
      cost: 5000,
      quantity: 1,
      reason: "",
      supportingDocs: "",
    };
    setItems((prev) => [...prev, newItem]);
  };

  const removeItem = (id: string) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateItem = <K extends keyof ServiceLineItem>(id: string, field: K, value: ServiceLineItem[K]) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i;

        if (field === "serviceId") {
          const matched = services.find((s) => s.id === value);
          if (matched) {
            return {
              ...i,
              serviceId: value as string,
              description: matched.name,
              category: matched.category,
              cost: matched.standardPrice,
            };
          }
        }

        return { ...i, [field]: value };
      })
    );
  };

  const totalCost = items.reduce((sum, it) => sum + (Number(it.cost) || 0) * (Number(it.quantity) || 1), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!selectedPatientId) {
      setError("Please select or verify a patient first (Step 1).");
      return;
    }

    if (items.some((i) => !i.description.trim())) {
      setError("Please provide a description or select a service for all line items.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/authorizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: selectedPatientId,
          hospitalId: selectedHospitalId,
          diagnosisCode: diagnosisCode || "CONSULTATION",
          diagnosisNotes: overallDiagnosisNotes || "Pre-authorization request",
          items: items.map((i) => ({
            serviceId: i.serviceId,
            description: i.description,
            category: i.category,
            cost: Number(i.cost) || 0,
            quantity: Number(i.quantity) || 1,
            reason: i.reason || overallDiagnosisNotes || "Requested medical service",
            supportingDocs: i.supportingDocs || undefined,
          })),
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
      <div className="min-h-screen bg-background overflow-auto p-6 max-w-5xl mx-auto space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
              ClearMed v2.0 Workflow
            </Badge>
          </div>
          <h1 className="text-2xl font-semibold flex items-center gap-2 mt-1">
            <PlusCircle className="h-6 w-6 text-primary" /> Create Pre-Authorization Request
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter patient details and multiple service line items for independent HMO review and fulfillment
          </p>
        </div>

        {/* Section 8.3 Notice */}
        <div className="p-3 bg-muted/40 rounded-lg border border-border/80 flex items-start gap-2.5 text-xs text-muted-foreground">
          <Lock className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <span>
            <strong>Patient Privacy & Access Control (Sec 8.3):</strong> Doctors may only access patient records where an active or historical relationship exists at this hospital, or by exact verified Membership Number on presentation.
          </span>
        </div>

        {success && (
          <Alert className="bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <AlertTitle>Authorization Submitted</AlertTitle>
            <AlertDescription>
              All service items have been submitted as <strong>PENDING</strong> for HMO review. Redirecting to request list…
            </AlertDescription>
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
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Patient Selection & Verification */}
            <Card className="data-visualization">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" /> Step 1 — Patient Identification
                </CardTitle>
                <CardDescription>
                  Select a hospital-bound patient or verify on presentation using HMO Membership Number
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Hospital Selection */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5">
                      <Building2 className="h-4 w-4 text-muted-foreground" /> Healthcare Provider
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

                  {/* Existing Hospital Patients Select */}
                  <div className="space-y-2">
                    <Label>Hospital Patient (Binding Relationship)</Label>
                    <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                      <SelectTrigger><SelectValue placeholder="Select treated patient..." /></SelectTrigger>
                      <SelectContent>
                        {patients.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name} ({p.membershipNumber}) — {p.hmoName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Or Verify by Membership Number */}
                <div className="pt-3 border-t space-y-2">
                  <Label htmlFor="memNum" className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Verify New Patient by HMO Membership Number
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="memNum"
                      placeholder="e.g. MEM-000123 or CM-PAT-123456"
                      value={membershipInput}
                      onChange={(e) => setMembershipInput(e.target.value)}
                      className="text-sm max-w-md"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleVerifyMembership}
                      disabled={verifyingMembership || !membershipInput.trim()}
                      className="shrink-0 gap-1.5"
                    >
                      {verifyingMembership ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                      Verify
                    </Button>
                  </div>
                  {membershipError && (
                    <p className="text-xs text-destructive">{membershipError}</p>
                  )}
                </div>

                {/* Selected Patient Banner */}
                {selectedPatient && (
                  <div className="p-3 bg-secondary/50 rounded-lg border text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-foreground">{selectedPatient.name}</span>
                      <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30">
                        {selectedPatient.bindingType === "VERIFIED_MEMBERSHIP" ? "Verified HMO Member" : "Hospital Patient"}
                      </Badge>
                    </div>
                    <div className="text-muted-foreground">
                      HMO: <strong className="text-foreground">{selectedPatient.hmoName}</strong> | Plan: <strong className="text-foreground">{selectedPatient.planName}</strong> | Member ID: <strong className="font-mono text-foreground">{selectedPatient.membershipNumber}</strong>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Overall Diagnosis & Clinical Overview */}
            <Card className="data-visualization">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" /> Overall Clinical Context
                </CardTitle>
                <CardDescription>ICD-10 classification and overarching clinical notes for this encounter</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="diagnosisCode">Diagnosis Code / ICD-10 Code</Label>
                    <Input
                      id="diagnosisCode"
                      placeholder="e.g. ICD-10-J06.9, K29.7, or E11.9"
                      value={diagnosisCode}
                      onChange={(e) => setDiagnosisCode(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="overallNotes">Clinical Encounter Summary</Label>
                    <Input
                      id="overallNotes"
                      placeholder="Brief clinical reason for overall encounter..."
                      value={overallDiagnosisNotes}
                      onChange={(e) => setOverallDiagnosisNotes(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Step 2: Itemized Services Builder */}
            <Card className="data-visualization">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Stethoscope className="h-4 w-4 text-primary" /> Step 2 — Requested Services (Itemized Line Items)
                  </CardTitle>
                  <CardDescription>
                    Enter per service: description, cost, clinical reason, and supporting documents
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addItem}
                  className="gap-1.5 text-xs h-8"
                >
                  <Plus className="h-3.5 w-3.5 text-primary" /> Add Service
                </Button>
              </CardHeader>
              <CardContent className="space-y-5">
                {items.map((item, index) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl border border-border/70 bg-card space-y-4 relative"
                  >
                    <div className="flex items-center justify-between border-b pb-2">
                      <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                        Service #{index + 1}
                      </span>
                      {items.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                          className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10 text-xs gap-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Remove
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Catalog Selector */}
                      <div className="space-y-1.5">
                        <Label className="text-xs">Quick Select from Catalog</Label>
                        <Select
                          value={item.serviceId || ""}
                          onValueChange={(val) => updateItem(item.id, "serviceId", val)}
                        >
                          <SelectTrigger className="text-xs h-9">
                            <SelectValue placeholder="Pick standard service..." />
                          </SelectTrigger>
                          <SelectContent>
                            {services.map((s) => (
                              <SelectItem key={s.id} value={s.id} className="text-xs">
                                {s.name} (₦{s.standardPrice.toLocaleString()})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Service Description */}
                      <div className="space-y-1.5">
                        <Label className="text-xs">Service Description *</Label>
                        <Input
                          placeholder="e.g. Full Blood Count, Amoxicillin 500mg"
                          value={item.description}
                          onChange={(e) => updateItem(item.id, "description", e.target.value)}
                          className="text-xs h-9"
                          required
                        />
                      </div>

                      {/* Category */}
                      <div className="space-y-1.5">
                        <Label className="text-xs">Category</Label>
                        <Select
                          value={item.category}
                          onValueChange={(val) => updateItem(item.id, "category", val)}
                        >
                          <SelectTrigger className="text-xs h-9">
                            <SelectValue placeholder="Category..." />
                          </SelectTrigger>
                          <SelectContent>
                            {CATEGORIES.map((cat) => (
                              <SelectItem key={cat} value={cat} className="text-xs">
                                {cat}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      {/* Cost */}
                      <div className="space-y-1.5">
                        <Label className="text-xs flex items-center gap-1">
                          <DollarSign className="h-3 w-3 text-muted-foreground" /> Cost (₦) *
                        </Label>
                        <Input
                          type="number"
                          min="0"
                          step="100"
                          value={item.cost}
                          onChange={(e) => updateItem(item.id, "cost", Number(e.target.value))}
                          className="text-xs h-9 font-semibold"
                          required
                        />
                      </div>

                      {/* Quantity */}
                      <div className="space-y-1.5">
                        <Label className="text-xs">Quantity / Units</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, "quantity", Number(e.target.value))}
                          className="text-xs h-9"
                        />
                      </div>

                      {/* Supporting Docs */}
                      <div className="space-y-1.5 sm:col-span-2">
                        <Label className="text-xs">Supporting Documents / Referrals</Label>
                        <Input
                          placeholder="e.g. Lab requisition #102, X-Ray scan report attached"
                          value={item.supportingDocs || ""}
                          onChange={(e) => updateItem(item.id, "supportingDocs", e.target.value)}
                          className="text-xs h-9"
                        />
                      </div>
                    </div>

                    {/* Specific Clinical Reason */}
                    <div className="space-y-1.5">
                      <Label className="text-xs">Clinical Justification & Reason *</Label>
                      <Textarea
                        rows={2}
                        placeholder="Detail the clinical necessity for this specific service line item..."
                        value={item.reason}
                        onChange={(e) => updateItem(item.id, "reason", e.target.value)}
                        className="text-xs resize-none"
                        required
                      />
                    </div>
                  </div>
                ))}

                {/* Estimated Request Cost Summary */}
                <div className="flex items-center justify-between p-4 bg-muted/40 rounded-xl border border-border">
                  <div>
                    <span className="text-xs text-muted-foreground">Total Services</span>
                    <p className="text-sm font-semibold text-foreground">
                      {items.length} line item(s) configured
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-muted-foreground">Estimated Total Cost</span>
                    <p className="text-lg font-bold text-primary">
                      ₦{totalCost.toLocaleString()}
                    </p>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={submitting || !selectedPatientId}
                  className="w-full gap-2 mt-4 h-11 text-sm font-semibold"
                  id="btn-submit-request"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <PlusCircle className="h-4 w-4" />
                  )}
                  Submit Pre-Authorization to HMO (Step 3: All Items PENDING)
                </Button>
              </CardContent>
            </Card>
          </form>
        )}
      </div>
    </HospitalSidebarWrapper>
  );
}
