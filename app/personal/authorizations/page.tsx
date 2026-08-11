"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { PersonalSidebarWrapper } from "@/components/sidebars";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import AuthorizationCard from "@/components/ui/authorization-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AuthStatus } from "@/lib/enums/AuthStatus";

interface AuthorizationItem {
  id: string;
  authorizationCode?: string | null;
  patient?: {
    user?: {
      firstName?: string;
      lastName?: string;
      name?: string;
    } | null;
  } | null;
  hospital?: {
    name?: string;
  } | null;
  diagnosis: string;
  services?: string | string[] | null;
  status: AuthStatus;
  createdAt: string | Date;
  reviewedAt?: string | Date | null;
}

export default function AuthorizationsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [authorizations, setAuthorizations] = useState<AuthorizationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    const fetchAuthorizations = async () => {
      setIsLoading(true);
      setError("");
      try {
        const response = await fetch(`/api/authorizations?status=${activeTab}`);
        if (!response.ok) {
          throw new Error("Failed to fetch authorizations");
        }

        const data = await response.json();
        setAuthorizations(Array.isArray(data) ? data : []);
      } catch (err: unknown) {
        console.error("Error fetching authorizations:", err);
        const message = err instanceof Error ? err.message : "Failed to load authorizations";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAuthorizations();
  }, [activeTab]);

  return (
    <PersonalSidebarWrapper currentPath="/personal/authorizations">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">My Authorization Requests</h1>
          <Button onClick={() => router.push("/personal/authorizations/new")}>
            <FileText className="h-4 w-4 mr-2" />
            New Request
          </Button>
        </div>

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
            ) : authorizations.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="flex flex-col items-center justify-center py-8">
                    <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">
                      No authorization requests found
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {activeTab === "all"
                        ? "You haven't created any authorization requests yet."
                        : `You don't have any ${activeTab.toLowerCase()} authorization requests.`}
                    </p>
                    <Button onClick={() => router.push("/personal/authorizations/new")}>
                      Create New Request
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {authorizations.map((auth) => (
                  <AuthorizationCard
                    key={auth.id}
                    id={auth.id}
                    authorizationCode={auth.authorizationCode || ""}
                    patientName={
                      auth.patient?.user?.name ||
                      `${auth.patient?.user?.firstName || ""} ${auth.patient?.user?.lastName || ""}`.trim() ||
                      "Patient"
                    }
                    hospitalName={auth.hospital?.name || "Unknown Hospital"}
                    diagnosis={auth.diagnosis}
                    services={
                      Array.isArray(auth.services)
                        ? auth.services.map((s, idx) =>
                            typeof s === "string"
                              ? { id: `${auth.id}-${idx}`, name: s, cost: 0 }
                              : s
                          )
                        : auth.services
                        ? [
                            {
                              id: `${auth.id}-0`,
                              name: String(auth.services),
                              cost: 0,
                            },
                          ]
                        : []
                    }
                    status={auth.status}
                    createdAt={new Date(auth.createdAt)}
                    reviewedAt={auth.reviewedAt ? new Date(auth.reviewedAt) : null}
                    onView={() => router.push(`/personal/authorizations/${auth.id}`)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </PersonalSidebarWrapper>
  );
}