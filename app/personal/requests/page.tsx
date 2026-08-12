"use client";

/**
 * My Requests: lists both hospital authorization requests and HMO coverage inquiries.
 * Hospital requests and HMO inquiries are visually distinct with type badges and icons.
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PersonalSidebarWrapper } from "@/components/sidebars";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import AuthorizationCard from "@/components/ui/authorization-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  Loader2,
  AlertCircle,
  PlusCircle,
  Shield,
  Building2,
  FlaskConical,
  Stethoscope,
  Pill,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AuthStatus } from "@/lib/enums/AuthStatus";

/* ── Types ─────────────────────────────────────────────────── */

interface HospitalRequest {
  type: "hospital";
  id: string;
  status: string;
  createdAt: string;
  authorizationCode?: string;
  patient?: { user?: { name?: string } };
  hospital?: { name?: string };
  diagnosis?: string;
  services?: Array<{ id: string; name?: string; cost?: number }>;
  reviewedAt?: string | null;
}

interface HmoInquiry {
  type: "hmo";
  id: string;
  status: string;
  createdAt: string;
  notes?: string;
  medicalTests: string[];
  treatments: string[];
  drugs: string[];
}

type AnyRequest = HospitalRequest | HmoInquiry;

/* ── Status colour helpers ──────────────────────────────────── */

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
  APPROVED: "bg-green-100 text-green-800 border-green-200",
  AUTO_APPROVED: "bg-green-100 text-green-800 border-green-200",
  REJECTED: "bg-red-100 text-red-800 border-red-200",
  COMPLETED: "bg-blue-100 text-blue-800 border-blue-200",
  REVIEWED: "bg-purple-100 text-purple-800 border-purple-200",
  CLOSED: "bg-gray-100 text-gray-700 border-gray-200",
};

function StatusBadge({ status }: { status: string }) {
  const cls = statusColors[status] ?? "bg-gray-100 text-gray-700 border-gray-200";
  return (
    <Badge variant="outline" className={`text-xs font-semibold ${cls}`}>
      {status.replace("_", " ")}
    </Badge>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/* ── HMO Inquiry Card ────────────────────────────────────────── */

function HmoInquiryCard({ inquiry }: { inquiry: HmoInquiry }) {
  const allItems = [
    ...inquiry.medicalTests.map((t) => ({ label: t, icon: "test" })),
    ...inquiry.treatments.map((t) => ({ label: t, icon: "treatment" })),
    ...inquiry.drugs.map((d) => ({ label: d, icon: "drug" })),
  ];

  return (
    <Card className="w-full data-visualization border border-border/60">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          {/* Left: type icon + title */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <Badge
                  variant="outline"
                  className="text-xs font-semibold bg-primary/10 text-primary border-primary/20"
                >
                  HMO Coverage Inquiry
                </Badge>
                <StatusBadge status={inquiry.status} />
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Submitted {formatDate(inquiry.createdAt)}
              </p>

              {/* Items */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {inquiry.medicalTests.length > 0 && (
                  <div>
                    <p className="flex items-center gap-1 text-xs font-medium text-muted-foreground mb-1">
                      <FlaskConical className="h-3 w-3" /> Medical Tests
                    </p>
                    <ul className="space-y-0.5">
                      {inquiry.medicalTests.map((t, i) => (
                        <li key={i} className="text-sm text-foreground">
                          {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {inquiry.treatments.length > 0 && (
                  <div>
                    <p className="flex items-center gap-1 text-xs font-medium text-muted-foreground mb-1">
                      <Stethoscope className="h-3 w-3" /> Treatments
                    </p>
                    <ul className="space-y-0.5">
                      {inquiry.treatments.map((t, i) => (
                        <li key={i} className="text-sm text-foreground">
                          {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {inquiry.drugs.length > 0 && (
                  <div>
                    <p className="flex items-center gap-1 text-xs font-medium text-muted-foreground mb-1">
                      <Pill className="h-3 w-3" /> Drugs
                    </p>
                    <ul className="space-y-0.5">
                      {inquiry.drugs.map((d, i) => (
                        <li key={i} className="text-sm text-foreground">
                          {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {allItems.length === 0 && (
                  <p className="text-sm text-muted-foreground col-span-3">
                    No items recorded.
                  </p>
                )}
              </div>

              {inquiry.notes && (
                <p className="text-xs text-muted-foreground mt-3 italic">
                  Notes: {inquiry.notes}
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Hospital Request wrapper ────────────────────────────────── */

function HospitalRequestCard({ req, router }: { req: HospitalRequest; router: ReturnType<typeof useRouter> }) {
  const normalizeServices = (
    services: HospitalRequest["services"]
  ): Array<{ id: string; name: string; cost: number }> => {
    if (!Array.isArray(services)) return [];
    return services.map((s) => ({
      id: s.id,
      name: s.name ?? "Service",
      cost: s.cost ?? 0,
    }));
  };

  return (
    <div className="relative">
      {/* Type badge overlay */}
      <div className="absolute top-4 left-4 z-10">
        <Badge
          variant="outline"
          className="text-xs font-semibold bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1"
        >
          <Building2 className="h-3 w-3" />
          Hospital Request
        </Badge>
      </div>
      <div className="pt-2">
        <AuthorizationCard
          id={req.id}
          authorizationCode={req.authorizationCode ?? ""}
          patientName={req.patient?.user?.name ?? "You"}
          hospitalName={req.hospital?.name ?? "Unknown Hospital"}
          diagnosis={req.diagnosis ?? ""}
          services={normalizeServices(req.services)}
          status={req.status as AuthStatus}
          createdAt={new Date(req.createdAt)}
          reviewedAt={req.reviewedAt ? new Date(req.reviewedAt) : null}
          onView={() => router.push(`/personal/authorizations/${req.id}`)}
        />
      </div>
    </div>
  );
}

/* ── Main Page ───────────────────────────────────────────────── */

export default function MyRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<AnyRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    const fetchAll = async () => {
      setIsLoading(true);
      setError("");
      try {
        // Fetch hospital authorization requests
        const [authRes, inquiryRes] = await Promise.all([
          fetch(`/api/authorizations?status=${activeTab}`),
          fetch(`/api/requests/coverage-inquiry?status=${activeTab}`),
        ]);

        const authData = authRes.ok ? await authRes.json() : [];
        // inquiryRes may 403 if user is not PATIENT – treat gracefully
        const inquiryData = inquiryRes.ok ? await inquiryRes.json() : [];

        const hospitalRequests: HospitalRequest[] = (
          Array.isArray(authData) ? authData : []
        ).map((r: Omit<HospitalRequest, "type">) => ({ ...r, type: "hospital" as const }));

        const hmoInquiries: HmoInquiry[] = Array.isArray(inquiryData) ? inquiryData : [];

        // Merge and sort by createdAt descending
        const merged: AnyRequest[] = [...hospitalRequests, ...hmoInquiries].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        setRequests(merged);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load requests");
      } finally {
        setIsLoading(false);
      }
    };
    fetchAll();
  }, [activeTab]);

  return (
    <PersonalSidebarWrapper currentPath="/personal/requests">
      <div className="min-h-screen bg-background overflow-x-hidden overflow-y-auto">
        <div className="fixed inset-0 professional-grid opacity-40 pointer-events-none" />
        <div className="relative border-b border-border/50 bg-card/30 backdrop-blur-xl">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-foreground">
                  My Requests
                </h1>
                <p className="text-sm text-muted-foreground">
                  Hospital authorization requests and HMO coverage inquiries
                </p>
              </div>
              <Button
                onClick={() => router.push("/personal/request/new")}
                className="h-9"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Make a Request
              </Button>
            </div>
          </div>
        </div>

        <div className="relative p-6 space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : error ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : requests.length === 0 ? (
                <Card className="data-visualization">
                  <CardContent className="p-6 text-center">
                    <div className="flex flex-col items-center justify-center py-8">
                      <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">
                        No requests found
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        {activeTab === "all"
                          ? "You haven't created any requests yet."
                          : `You don't have any ${activeTab.toLowerCase()} requests.`}
                      </p>
                      <Button onClick={() => router.push("/personal/request/new")}>
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Make a Request
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {requests.map((req) =>
                    req.type === "hmo" ? (
                      <HmoInquiryCard key={req.id} inquiry={req} />
                    ) : (
                      <HospitalRequestCard key={req.id} req={req} router={router} />
                    )
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </PersonalSidebarWrapper>
  );
}
