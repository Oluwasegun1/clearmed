"use client";

/**
 * My Requests: lists all authorization requests (hospital) with tabs and link to make a new request.
 * Uses same design system as dashboard and authorizations.
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PersonalSidebarWrapper } from "@/components/sidebars";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import AuthorizationCard from "@/components/ui/authorization-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Loader2, AlertCircle, PlusCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface AuthRequest {
  id: string;
  status: string;
  createdAt: string;
  authorizationCode?: string;
  patient?: { user?: { name?: string } };
  hospital?: { name?: string };
  diagnosis?: string;
  services?: Array<{ id: string; name?: string; cost?: number; service?: { name?: string } }>;
  reviewedAt?: string | null;
}

export default function MyRequestsPage() {
  const router = useRouter();
  const [authorizations, setAuthorizations] = useState<AuthRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    const fetchAuthorizations = async () => {
      try {
        const response = await fetch("/api/authorizations");
        if (!response.ok) {
          throw new Error("Failed to fetch requests");
        }
        const data = await response.json();
        setAuthorizations(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load requests"
        );
      } finally {
        setIsLoading(false);
      }
    };
    fetchAuthorizations();
  }, []);

  const filtered = () => {
    if (activeTab === "all") return authorizations;
    const status = activeTab.toUpperCase();
    return authorizations.filter((auth) => auth.status === status);
  };

  const normalizeServices = (
    services: AuthRequest["services"]
  ): Array<{ id: string; name: string; cost: number }> => {
    if (!Array.isArray(services)) return [];
    return services.map((s) => ({
      id: s.id,
      name: s.service?.name ?? s.name ?? "Service",
      cost: s.cost ?? 0,
    }));
  };

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
                  View and manage your authorization and hospital requests
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
              ) : filtered().length === 0 ? (
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
                  {filtered().map((auth) => (
                    <AuthorizationCard
                      key={auth.id}
                      id={auth.id}
                      authorizationCode={auth.authorizationCode ?? ""}
                      patientName={auth.patient?.user?.name ?? "Unknown"}
                      hospitalName={auth.hospital?.name ?? "Unknown Hospital"}
                      diagnosis={auth.diagnosis ?? ""}
                      services={normalizeServices(auth.services)}
                      status={auth.status as "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED"}
                      createdAt={new Date(auth.createdAt)}
                      reviewedAt={
                        auth.reviewedAt
                          ? new Date(auth.reviewedAt)
                          : null
                      }
                      onView={() => router.push(`/personal/authorizations/${auth.id}`)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </PersonalSidebarWrapper>
  );
}
