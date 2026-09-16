"use client";

/**
 * Patient Dashboard — Authorization Summary & Recent Activity List
 * Displays pending, approved, rejected, and completed request counts and recent history.
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  PlusCircle,
  ArrowUpRight,
  Building2,
  Calendar,
  Loader2,
  CheckCheck,
} from "lucide-react";

import { StatusBadge } from "@/components/shared";

interface AuthItem {
  id: string;
  authorizationCode?: string;
  status: string;
  createdAt: string;
  hospital: {
    name: string;
  };
  services: Array<{
    id: string;
    name: string;
    cost: number;
  }>;
  diagnosis?: string;
}

interface AuthorizationListProps {
  counts?: {
    pending: number;
    approved: number;
    rejected: number;
    completed: number;
    total: number;
  };
}

export default function AuthorizationList({ counts }: AuthorizationListProps) {
  const [requests, setRequests] = useState<AuthItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/authorizations")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setRequests(Array.isArray(data) ? data.slice(0, 5) : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Compute live counts if not provided via props
  const summaryCounts = counts || {
    pending: requests.filter((r) => r.status === "PENDING").length,
    approved: requests.filter((r) => ["APPROVED", "AUTO_APPROVED"].includes(r.status)).length,
    rejected: requests.filter((r) => r.status === "REJECTED").length,
    completed: requests.filter((r) => r.status === "COMPLETED").length,
    total: requests.length,
  };

  return (
    <div className="space-y-6">
      {/* Authorization Status Metric Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs text-amber-700 dark:text-amber-300 font-medium block">Pending</span>
            <span className="text-xl font-bold text-amber-700 dark:text-amber-300">{summaryCounts.pending}</span>
          </div>
          <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
        </div>

        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs text-emerald-700 dark:text-emerald-300 font-medium block">Approved</span>
            <span className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{summaryCounts.approved}</span>
          </div>
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
        </div>

        <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs text-red-700 dark:text-red-300 font-medium block">Rejected</span>
            <span className="text-xl font-bold text-red-700 dark:text-red-300">{summaryCounts.rejected}</span>
          </div>
          <XCircle className="h-5 w-5 text-red-600" />
        </div>

        <div className="p-3.5 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs text-blue-700 dark:text-blue-300 font-medium block">Completed</span>
            <span className="text-xl font-bold text-blue-700 dark:text-blue-300">{summaryCounts.completed}</span>
          </div>
          <CheckCheck className="h-5 w-5 text-blue-600" />
        </div>
      </div>

      {/* Recent Authorization Activity List */}
      <Card className="data-visualization">
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" /> Recent Authorization Activity
            </CardTitle>
            <CardDescription>Track real-time HMO pre-authorizations and claims status</CardDescription>
          </div>
          <Button asChild variant="ghost" size="sm" className="text-xs gap-1">
            <Link href="/personal/requests">
              View All ({summaryCounts.total}) <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-10 px-4 space-y-3">
              <FileText className="h-10 w-10 text-muted-foreground/50 mx-auto" />
              <div>
                <p className="text-sm font-medium text-foreground">No authorization requests yet</p>
                <p className="text-xs text-muted-foreground">Submit your first treatment or medication request</p>
              </div>
              <Button asChild size="sm" className="gap-1.5">
                <Link href="/personal/request/new">
                  <PlusCircle className="h-4 w-4" /> New Authorization Request
                </Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {requests.map((req) => {
                const serviceName = req.services[0]?.name || "Medical Consultation & Care";
                const serviceCost = req.services[0]?.cost || 0;

                return (
                  <div key={req.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/20 transition-colors">
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-foreground">{serviceName}</span>
                        {req.authorizationCode && (
                          <span className="text-[11px] font-mono text-primary font-bold bg-primary/10 px-1.5 py-0.5 rounded">
                            {req.authorizationCode}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5" /> {req.hospital?.name || "General Hospital"}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" /> {new Date(req.createdAt).toLocaleDateString()}
                        </span>
                        {serviceCost > 0 && (
                          <>
                            <span>•</span>
                            <span className="font-medium text-foreground">₦{serviceCost.toLocaleString()}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                      <StatusBadge status={req.status} />
                      <Button asChild variant="outline" size="sm" className="h-7 text-xs">
                        <Link href={`/personal/requests?id=${req.id}`}>
                          Details
                        </Link>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
