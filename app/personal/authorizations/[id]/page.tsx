"use client";

/**
 * Patient Authorization Details Page (ClearMed v2.0).
 * Step 8: Patient sees decision and status per service line item, HMO notes, and derived overall status.
 */

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { PersonalSidebarWrapper } from "@/components/sidebars";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle,
  Building2,
  Calendar,
  Stethoscope,
  DollarSign,
  FileQuestion,
  HelpCircle,
  Copy,
  Check,
  MessageSquare,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ServiceItemDetail {
  id: string;
  name?: string;
  description?: string;
  category: string;
  cost: number;
  quantity: number;
  reason?: string;
  status: string;
  decisionReason?: string | null;
  reviewedAt?: string | null;
  reviewerName?: string | null;
  fulfilledAt?: string | null;
}

interface AuthorizationDetail {
  id: string;
  authCode?: string | null;
  authorizationCode?: string | null;
  status: string;
  hospital?: {
    id?: string;
    name?: string;
    address?: string;
    city?: string;
    state?: string;
  } | null;
  patient?: {
    membershipNumber?: string;
    coveragePlan?: { name: string };
    hmo?: { name: string };
  } | null;
  requestDate?: string;
  createdAt: string;
  diagnosisCode?: string;
  diagnosisNotes?: string;
  diagnosis?: string;
  items?: ServiceItemDetail[];
  service?: {
    name?: string;
    category?: string;
    standardPrice?: number;
  } | null;
  quantity?: number;
  reviews?: Array<{
    id: string;
    decision: string;
    comments?: string | null;
    reviewDate: string;
  }>;
}

export default function AuthorizationDetails({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: session } = useSession();
  const [authorization, setAuthorization] = useState<AuthorizationDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    const fetchAuthorizationDetails = async () => {
      if (!id) return;

      try {
        const response = await fetch(`/api/authorizations/${id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch authorization details");
        }

        const data = await response.json();
        setAuthorization(data);
      } catch (err: unknown) {
        console.error("Error fetching authorization details:", err);
        const message =
          err instanceof Error ? err.message : "Failed to load authorization details";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAuthorizationDetails();
  }, [id]);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const code = authorization?.authCode || authorization?.authorizationCode || "";

  const serviceItems: ServiceItemDetail[] =
    authorization?.items && authorization.items.length > 0
      ? authorization.items
      : authorization?.service
      ? [
          {
            id: authorization.id,
            name: authorization.service.name || "Medical Service",
            category: authorization.service.category || "General",
            cost: (authorization.service.standardPrice || 5000) * (authorization.quantity || 1),
            quantity: authorization.quantity || 1,
            reason: authorization.diagnosisNotes || authorization.diagnosis,
            status: authorization.status,
            decisionReason: authorization.reviews?.[0]?.comments,
            reviewedAt: authorization.reviews?.[0]?.reviewDate,
          },
        ]
      : [];

  const totalCost = serviceItems.reduce((acc, it) => acc + (it.cost || 0), 0);
  const hmoCoverageRate = 0.85; // 85%
  const hmoTotalPayable = Math.round(totalCost * hmoCoverageRate);
  const patientTotalResponsibility = totalCost - hmoTotalPayable;

  return (
    <PersonalSidebarWrapper currentPath="/personal/authorizations">
      <div className="min-h-screen bg-background overflow-auto p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="gap-1.5"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Requests
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Authorization Details</h1>
            <p className="text-xs text-muted-foreground">
              v2.0 Service-level review status and HMO decisions
            </p>
          </div>
        </div>

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
        ) : authorization ? (
          <div className="space-y-6">
            {/* Status & Code Banner */}
            <Card className="data-visualization border-border/80">
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">
                      Overall Request Status
                    </span>
                    <StatusBadge status={authorization.status} />
                  </div>
                  {code && (
                    <div className="bg-primary/5 p-3 rounded-xl border border-primary/20 flex items-center gap-3">
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-primary block">
                          Pre-Auth Code
                        </span>
                        <code className="text-lg font-mono font-bold text-primary">{code}</code>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => copyCode(code)}
                      >
                        {copiedCode ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Provider & Coverage Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="data-visualization">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" /> Healthcare Provider
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs space-y-1">
                  <p className="font-semibold text-sm text-foreground">
                    {authorization.hospital?.name || "Hospital Provider"}
                  </p>
                  <p className="text-muted-foreground">
                    Location: {authorization.hospital?.city}, {authorization.hospital?.state}
                  </p>
                  <p className="text-muted-foreground">
                    Encounter: {authorization.diagnosisNotes || authorization.diagnosis || "General care"}
                  </p>
                </CardContent>
              </Card>

              <Card className="data-visualization">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-primary" /> Cost & Coverage Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Services Cost:</span>
                    <span className="font-semibold text-foreground">₦{totalCost.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 dark:text-emerald-400">
                    <span>HMO Covered (85%):</span>
                    <span className="font-semibold">₦{hmoTotalPayable.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-amber-700 dark:text-amber-400">
                    <span>Your Responsibility (15%):</span>
                    <span className="font-semibold">₦{patientTotalResponsibility.toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Itemized Services List (Step 8: Patient receives result per service) */}
            <Card className="data-visualization">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-base flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-primary" /> Itemized Services & HMO Decisions
                </CardTitle>
                <CardDescription>
                  Review individual authorization decisions, reviewer comments, and fulfillment status
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {serviceItems.map((item, idx) => {
                  const itemCost = item.cost || 0;
                  const itemHmo = Math.round(itemCost * 0.85);
                  const itemPatient = itemCost - itemHmo;

                  return (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl border border-border/70 bg-card space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-muted-foreground">#{idx + 1}</span>
                            <span className="font-semibold text-foreground text-sm">
                              {item.name || item.description}
                            </span>
                            <Badge variant="outline" className="text-[10px]">
                              {item.category}
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            Qty: {item.quantity || 1}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-foreground text-sm">
                            ₦{itemCost.toLocaleString()}
                          </span>
                          <StatusBadge status={item.status} />
                        </div>
                      </div>

                      {/* Clinical Reason */}
                      {item.reason && (
                        <p className="text-xs text-muted-foreground">
                          <strong>Clinical Reason:</strong> {item.reason}
                        </p>
                      )}

                      {/* HMO Reviewer Feedback / Clarification Request */}
                      {item.decisionReason && (
                        <div className="p-3 rounded-lg bg-muted/40 border border-border/60 text-xs space-y-1">
                          <div className="flex items-center gap-1.5 font-semibold text-foreground">
                            {item.status === "MORE_INFORMATION_REQUIRED" ? (
                              <>
                                <FileQuestion className="h-3.5 w-3.5 text-purple-600" />
                                HMO Clarification Request:
                              </>
                            ) : (
                              <>
                                <MessageSquare className="h-3.5 w-3.5 text-primary" />
                                HMO Review Notes:
                              </>
                            )}
                          </div>
                          <p className="text-muted-foreground">{item.decisionReason}</p>
                        </div>
                      )}

                      {/* Financial breakdown */}
                      <div className="flex flex-wrap gap-4 text-xs pt-1 border-t text-muted-foreground">
                        <span>HMO Pays (85%): <strong className="text-emerald-600">₦{itemHmo.toLocaleString()}</strong></span>
                        <span>Your Co-pay (15%): <strong className="text-amber-600">₦{itemPatient.toLocaleString()}</strong></span>
                        {item.status === "COMPLETED" && (
                          <span className="text-blue-600 font-semibold flex items-center gap-1">
                            <CheckCircle className="h-3.5 w-3.5" /> Service Fulfilled & Claimed
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        ) : (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Not Found</AlertTitle>
            <AlertDescription>The authorization request could not be found.</AlertDescription>
          </Alert>
        )}
      </div>
    </PersonalSidebarWrapper>
  );
}