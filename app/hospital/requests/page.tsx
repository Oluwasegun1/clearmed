"use client";

/**
 * Hospital Requests Page — View & manage all pre-auth requests sent to or created by this hospital.
 * Live data from /api/hospital/requests.
 */

import { useState, useEffect, useCallback } from "react";
import { HospitalSidebarWrapper } from "@/components/sidebars";
import { UserRole } from "@/lib/enums/UserRole";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  ClipboardList, Search, RefreshCw, Loader2, AlertCircle,
  CheckCircle2, Clock, XCircle, FileText, User, Building2, Plus,
  ShieldCheck, Eye, Copy, Check,
} from "lucide-react";
import Link from "next/link";

interface RequestItem {
  id: string;
  authCode: string;
  status: string;
  rawStatus: string;
  requestDate: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  hmoName: string;
  planName: string;
  serviceName: string;
  category: string;
  price: number;
  diagnosisCode: string;
  diagnosisNotes: string;
  quantity: number;
  requestedByName: string;
  reviewComments: string | null;
  reviewedAt: string | null;
  hasServiceDelivery: boolean;
}

export default function HospitalRequestsPage() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState("ALL");
  const [selectedReq, setSelectedReq] = useState<RequestItem | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/hospital/requests${statusTab !== "ALL" ? `?status=${statusTab}` : ""}`);
      if (!res.ok) throw new Error("Failed to load requests");
      const data = await res.json();
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error fetching requests");
    } finally {
      setLoading(false);
    }
  }, [statusTab]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const filtered = requests.filter((r) => {
    const q = search.toLowerCase();
    return (
      r.patientName.toLowerCase().includes(q) ||
      r.serviceName.toLowerCase().includes(q) ||
      r.hmoName.toLowerCase().includes(q) ||
      r.authCode.toLowerCase().includes(q) ||
      r.diagnosisNotes.toLowerCase().includes(q)
    );
  });

  const statusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
      case "AUTO_APPROVED":
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/30 gap-1"><CheckCircle2 className="h-3 w-3" /> Approved</Badge>;
      case "PENDING":
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30 gap-1"><Clock className="h-3 w-3" /> Pending Review</Badge>;
      case "REJECTED":
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/30 gap-1"><XCircle className="h-3 w-3" /> Rejected</Badge>;
      case "COMPLETED":
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/30 gap-1"><ShieldCheck className="h-3 w-3" /> Delivered</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <HospitalSidebarWrapper currentPath="/hospital/requests">
      <div className="min-h-screen bg-background overflow-auto">
        <div className="fixed inset-0 professional-grid opacity-30 pointer-events-none" />

        {/* Header */}
        <div className="relative border-b border-border/50 bg-card/30 backdrop-blur-xl px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <ClipboardList className="h-6 w-6 text-primary" /> Hospital Authorization Requests
            </h1>
            <p className="text-sm text-muted-foreground">
              Pre-authorization requests submitted by patients or doctors to HMOs
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={fetchRequests} disabled={loading} className="gap-2">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
            </Button>
            <Link href="/hospital/request/new">
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" /> Create Request
              </Button>
            </Link>
          </div>
        </div>

        <div className="relative p-6 max-w-7xl mx-auto space-y-6">

          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              {["ALL", "PENDING", "APPROVED", "REJECTED"].map((tab) => (
                <Button
                  key={tab}
                  variant={statusTab === tab ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusTab(tab)}
                  className="capitalize text-xs"
                >
                  {tab === "ALL" ? "All Requests" : tab.toLowerCase()}
                </Button>
              ))}
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search patient, service, HMO..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 text-sm"
              />
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Requests Table / Cards */}
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <Card className="data-visualization">
              <CardContent className="p-12 text-center space-y-3">
                <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto" />
                <h3 className="text-lg font-semibold">No requests found</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  {search
                    ? "No requests matching your search query."
                    : "No authorization requests have been submitted for this hospital yet."}
                </p>
                <Link href="/hospital/request/new">
                  <Button className="mt-2 gap-2"><Plus className="h-4 w-4" /> Create First Request</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filtered.map((req) => (
                <Card key={req.id} className="data-visualization hover:border-primary/40 transition-all">
                  <CardContent className="p-5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Left: Patient & Service */}
                      <div className="flex items-start gap-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold shrink-0 mt-0.5">
                          {req.patientName.charAt(0).toUpperCase()}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-foreground text-base">{req.patientName}</h3>
                            {statusBadge(req.status)}
                            {req.authCode && (
                              <code className="text-xs bg-muted px-2 py-0.5 rounded font-mono text-primary font-semibold">
                                #{req.authCode}
                              </code>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground flex items-center gap-3 flex-wrap">
                            <span className="font-medium text-foreground">{req.serviceName}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5" /> {req.hmoName}</span>
                            <span>•</span>
                            <span>Plan: {req.planName}</span>
                          </p>
                          {req.diagnosisNotes && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              Diagnosis/Notes: {req.diagnosisNotes}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: Date, Cost & Action */}
                      <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 pt-3 md:pt-0 border-border/50">
                        <div className="text-left md:text-right">
                          <p className="text-base font-bold text-foreground">
                            ₦{req.price ? req.price.toLocaleString() : "0"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(req.requestDate).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedReq(req)}
                          className="gap-1.5"
                        >
                          <Eye className="h-4 w-4" /> Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Details Modal Drawer */}
          {selectedReq && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
              <Card className="w-full max-w-xl data-visualization max-h-[90vh] overflow-y-auto">
                <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
                  <div>
                    <CardTitle className="text-lg">Authorization Request Details</CardTitle>
                    <CardDescription>Request ID: {selectedReq.id}</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedReq(null)}>✕</Button>
                </CardHeader>
                <CardContent className="p-6 space-y-6">

                  {/* Status Banner */}
                  <div className="flex items-center justify-between bg-muted/50 p-4 rounded-xl border">
                    <div>
                      <p className="text-xs text-muted-foreground">Current Status</p>
                      <div className="mt-1">{statusBadge(selectedReq.status)}</div>
                    </div>
                    {selectedReq.authCode && (
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Authorization Code</p>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="text-base font-mono font-bold text-primary">{selectedReq.authCode}</code>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => copyCode(selectedReq.authCode)}>
                            {copiedCode ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Patient Info */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Patient & HMO Info</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm bg-card p-3 rounded-lg border">
                      <div>
                        <p className="text-muted-foreground text-xs">Patient Name</p>
                        <p className="font-medium">{selectedReq.patientName}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">HMO Provider</p>
                        <p className="font-medium">{selectedReq.hmoName}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Coverage Plan</p>
                        <p className="font-medium">{selectedReq.planName}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Requested By</p>
                        <p className="font-medium">{selectedReq.requestedByName}</p>
                      </div>
                    </div>
                  </div>

                  {/* Requested Service & Diagnosis */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Medical Service Requested</h4>
                    <div className="bg-card p-4 rounded-lg border space-y-3 text-sm">
                      <div className="flex justify-between items-center border-b pb-2">
                        <div>
                          <p className="font-semibold text-foreground">{selectedReq.serviceName}</p>
                          <p className="text-xs text-muted-foreground">Category: {selectedReq.category}</p>
                        </div>
                        <p className="font-bold text-base">₦{selectedReq.price.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Diagnosis / Symptoms / Notes</p>
                        <p className="text-sm mt-0.5 text-foreground">{selectedReq.diagnosisNotes || "None provided"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Review Comments */}
                  {selectedReq.reviewComments && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">HMO Review Notes</h4>
                      <div className="bg-muted p-3 rounded-lg border text-sm text-foreground">
                        {selectedReq.reviewComments}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <Button variant="outline" onClick={() => setSelectedReq(null)}>Close</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

        </div>
      </div>
    </HospitalSidebarWrapper>
  );
}
