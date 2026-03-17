"use client";

/**
 * Make a Request: choose between HMO coverage inquiry (tests, treatments, drugs)
 * or Hospital request (appointment, tests). Follows project design system.
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PersonalSidebarWrapper } from "@/components/sidebars";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  ArrowLeft,
  Building2,
  Shield,
  Loader2,
  AlertCircle,
  Plus,
  X,
  Stethoscope,
  FlaskConical,
  Pill,
} from "lucide-react";

type RequestType = "hmo" | "hospital" | null;

export default function MakeRequestNewPage() {
  const router = useRouter();
  const [requestType, setRequestType] = useState<RequestType>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // HMO form state: list of medical tests, treatments, drugs
  const [medicalTests, setMedicalTests] = useState<string[]>([]);
  const [treatments, setTreatments] = useState<string[]>([]);
  const [drugs, setDrugs] = useState<string[]>([]);
  const [hmoNotes, setHmoNotes] = useState("");
  const [currentTest, setCurrentTest] = useState("");
  const [currentTreatment, setCurrentTreatment] = useState("");
  const [currentDrug, setCurrentDrug] = useState("");

  // Hospital form state
  const [hospitals, setHospitals] = useState<{ id: string; name: string }[]>([]);
  const [hospitalId, setHospitalId] = useState("");
  const [requestKind, setRequestKind] = useState<"appointment" | "tests" | "both">("appointment");
  const [diagnosis, setDiagnosis] = useState("");
  const [hospitalNotes, setHospitalNotes] = useState("");
  const [patientId, setPatientId] = useState<string | null>(null);

  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        const response = await fetch("/api/hospitals");
        if (response.ok) {
          const data = await response.json();
          setHospitals(Array.isArray(data) ? data : []);
        }
      } catch {
        setHospitals([]);
      }
    };
    fetchHospitals();
  }, []);

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const response = await fetch("/api/patient/profile");
        if (response.ok) {
          const data = await response.json();
          setPatientId(data?.id ?? null);
        }
      } catch {
        setPatientId(null);
      }
    };
    fetchPatient();
  }, []);

  const addItem = (
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    current: string,
    setCurrent: React.Dispatch<React.SetStateAction<string>>
  ) => {
    const trimmed = current.trim();
    if (trimmed && !list.includes(trimmed)) {
      setList((prev) => [...prev, trimmed]);
      setCurrent("");
    }
  };

  const removeItem = (
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    index: number
  ) => {
    setList((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmitHmo = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/requests/coverage-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          medicalTests,
          treatments,
          drugs,
          notes: hmoNotes,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Failed to submit coverage inquiry");
      }
      setSuccess(true);
      setTimeout(() => router.push("/personal/requests"), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitHospital = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (!patientId || !hospitalId || !diagnosis.trim()) {
      setError("Please select a hospital and enter diagnosis.");
      return;
    }
    setIsSubmitting(true);
    try {
      // Use first available service or a placeholder; backend may expect serviceIds from catalog
      let servicesList: { id: string }[] = await fetch(
        `/api/services?hospitalId=${hospitalId}`
      )
        .then((res) => res.json())
        .catch(() => []);
      if (!Array.isArray(servicesList) || servicesList.length === 0) {
        servicesList = await fetch("/api/services")
          .then((res) => res.json())
          .catch(() => []);
      }
      const serviceIds =
        Array.isArray(servicesList) && servicesList.length > 0
          ? servicesList.slice(0, 5).map((s: { id: string }) => s.id)
          : [];
      if (serviceIds.length === 0) {
        setError(
          "No services available. Please contact support or try again later."
        );
        setIsSubmitting(false);
        return;
      }
      const response = await fetch("/api/authorizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId,
          hospitalId,
          serviceIds,
          diagnosis: diagnosis.trim(),
          notes: hospitalNotes.trim() || undefined,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || data.error || "Failed to submit request");
      }
      setSuccess(true);
      setTimeout(() => router.push("/personal/requests"), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmitHmo =
    (medicalTests.length > 0 || treatments.length > 0 || drugs.length > 0) && !success;

  return (
    <PersonalSidebarWrapper currentPath="/personal/request/new">
      <div className="min-h-screen bg-background overflow-x-hidden overflow-y-auto">
        <div className="fixed inset-0 professional-grid opacity-40 pointer-events-none" />
        <div className="relative border-b border-border/50 bg-card/30 backdrop-blur-xl">
          <div className="px-6 py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                className="h-8"
                onClick={() => (requestType ? setRequestType(null) : router.back())}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-semibold text-foreground">
                  Make a Request
                </h1>
                <p className="text-sm text-muted-foreground">
                  Request to HMO for coverage or to a hospital for appointment and tests
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {success && (
            <Alert className="bg-green-500/10 border-green-500/30 text-foreground">
              <AlertCircle className="h-4 w-4 text-green-600" />
              <AlertTitle>Request submitted</AlertTitle>
              <AlertDescription>
                Your request has been submitted. Redirecting to My Requests…
              </AlertDescription>
            </Alert>
          )}

          {!requestType && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
              <Card
                className="data-visualization cursor-pointer hover:border-primary/40 transition-colors"
                onClick={() => setRequestType("hmo")}
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Shield className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-foreground">Request to HMO</CardTitle>
                      <CardDescription>
                        List medical tests, treatments, and drugs to find out what your HMO will cover
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Add the items you need and submit. Your HMO will respond with coverage details.
                  </p>
                </CardContent>
              </Card>

              <Card
                className="data-visualization cursor-pointer hover:border-primary/40 transition-colors"
                onClick={() => setRequestType("hospital")}
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-foreground">Request to Hospital</CardTitle>
                      <CardDescription>
                        Request an appointment, tests, or both at a hospital
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Select hospital and describe your need (appointment, tests, or both).
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {requestType === "hmo" && (
            <Card className="data-visualization max-w-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Shield className="h-5 w-5" />
                  Request to HMO – Coverage inquiry
                </CardTitle>
                <CardDescription>
                  Add medical tests, treatments, and drugs you need. We’ll send this to your HMO to see what’s covered.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitHmo} className="space-y-6">
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <FlaskConical className="h-4 w-4" />
                      Medical tests
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        value={currentTest}
                        onChange={(event) => setCurrentTest(event.target.value)}
                        placeholder="e.g. Full blood count, MRI"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          addItem(
                            medicalTests,
                            setMedicalTests,
                            currentTest,
                            setCurrentTest
                          )
                        }
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {medicalTests.length > 0 && (
                      <ul className="flex flex-wrap gap-2 mt-2">
                        {medicalTests.map((item, index) => (
                          <li
                            key={`${item}-${index}`}
                            className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-sm"
                          >
                            {item}
                            <button
                              type="button"
                              onClick={() => removeItem(medicalTests, setMedicalTests, index)}
                              className="hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Stethoscope className="h-4 w-4" />
                      Treatments / procedures
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        value={currentTreatment}
                        onChange={(event) => setCurrentTreatment(event.target.value)}
                        placeholder="e.g. Physiotherapy, X-ray"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          addItem(
                            treatments,
                            setTreatments,
                            currentTreatment,
                            setCurrentTreatment
                          )
                        }
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {treatments.length > 0 && (
                      <ul className="flex flex-wrap gap-2 mt-2">
                        {treatments.map((item, index) => (
                          <li
                            key={`${item}-${index}`}
                            className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-sm"
                          >
                            {item}
                            <button
                              type="button"
                              onClick={() =>
                                removeItem(treatments, setTreatments, index)
                              }
                              className="hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Pill className="h-4 w-4" />
                      Drugs / medications
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        value={currentDrug}
                        onChange={(event) => setCurrentDrug(event.target.value)}
                        placeholder="e.g. Drug name or generic"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          addItem(drugs, setDrugs, currentDrug, setCurrentDrug)
                        }
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {drugs.length > 0 && (
                      <ul className="flex flex-wrap gap-2 mt-2">
                        {drugs.map((item, index) => (
                          <li
                            key={`${item}-${index}`}
                            className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-sm"
                          >
                            {item}
                            <button
                              type="button"
                              onClick={() => removeItem(drugs, setDrugs, index)}
                              className="hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hmo-notes">Additional notes (optional)</Label>
                    <Textarea
                      id="hmo-notes"
                      value={hmoNotes}
                      onChange={(event) => setHmoNotes(event.target.value)}
                      placeholder="Any context for the HMO"
                      rows={3}
                      className="resize-none"
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setRequestType(null)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={!canSubmitHmo || isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting…
                        </>
                      ) : (
                        "Send request to HMO"
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {requestType === "hospital" && (
            <Card className="data-visualization max-w-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Building2 className="h-5 w-5" />
                  Request to Hospital
                </CardTitle>
                <CardDescription>
                  Request an appointment, tests, or both. Select the hospital and provide details.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitHospital} className="space-y-6">
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="hospital">Hospital</Label>
                    <Select
                      value={hospitalId}
                      onValueChange={setHospitalId}
                    >
                      <SelectTrigger id="hospital">
                        <SelectValue placeholder="Select a hospital" />
                      </SelectTrigger>
                      <SelectContent>
                        {hospitals.map((hospital) => (
                          <SelectItem key={hospital.id} value={hospital.id}>
                            {hospital.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Request type</Label>
                    <Select
                      value={requestKind}
                      onValueChange={(value: "appointment" | "tests" | "both") =>
                        setRequestKind(value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="appointment">Appointment</SelectItem>
                        <SelectItem value="tests">Tests</SelectItem>
                        <SelectItem value="both">Appointment and tests</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="diagnosis">Diagnosis / reason for request</Label>
                    <Input
                      id="diagnosis"
                      value={diagnosis}
                      onChange={(event) => setDiagnosis(event.target.value)}
                      placeholder="e.g. Follow-up checkup, routine blood work"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hospital-notes">Additional notes (optional)</Label>
                    <Textarea
                      id="hospital-notes"
                      value={hospitalNotes}
                      onChange={(event) => setHospitalNotes(event.target.value)}
                      placeholder="Preferred date, special requests, etc."
                      rows={3}
                      className="resize-none"
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setRequestType(null)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting…
                        </>
                      ) : (
                        "Send request to hospital"
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PersonalSidebarWrapper>
  );
}
