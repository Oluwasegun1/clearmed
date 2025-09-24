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

export default function AuthorizationsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [authorizations, setAuthorizations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    const fetchAuthorizations = async () => {
      try {
        const response = await fetch("/api/authorizations");
        if (!response.ok) {
          throw new Error("Failed to fetch authorizations");
        }

        const data = await response.json();
        setAuthorizations(data);
      } catch (error) {
        console.error("Error fetching authorizations:", error);
        setError(error.message || "Failed to load authorizations");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAuthorizations();
  }, []);

  const filteredAuthorizations = () => {
    if (activeTab === "all") return authorizations;
    return authorizations.filter((auth) => auth.status === activeTab.toUpperCase());
  };

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

        <Tabs defaultValue="all" onValueChange={setActiveTab}>
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
            ) : filteredAuthorizations().length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="flex flex-col items-center justify-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium mb-2">
                      No authorization requests found
                    </h3>
                    <p className="text-gray-500 mb-4">
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
                {filteredAuthorizations().map((auth) => (
                  <AuthorizationCard
                    key={auth.id}
                    id={auth.id}
                    authorizationCode={auth.authorizationCode || ""}
                    patientName={auth.patient?.user?.name || "Unknown"}
                    hospitalName={auth.hospital?.name || "Unknown Hospital"}
                    diagnosis={auth.diagnosis}
                    services={auth.services || []}
                    status={auth.status}
                    createdAt={new Date(auth.createdAt)}
                    reviewedAt={auth.reviewedAt ? new Date(auth.reviewedAt) : null}
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