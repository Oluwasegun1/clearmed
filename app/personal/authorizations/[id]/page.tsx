"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { PersonalSidebarWrapper } from "@/components/sidebars";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface AuthorizationDetail {
  id: string;
  authorizationCode?: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED" | string;
  hospital?: {
    id?: string;
    name?: string;
    address?: string;
    city?: string;
    state?: string;
  } | null;
  createdAt: string;
  diagnosis: string;
  reviewedAt?: string | null;
  services?: string | null;
  service?: {
    name?: string;
  } | null;
  notes?: string | null;
  rejectionReason?: string | null;
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>;
      case "APPROVED":
        return <Badge className="bg-green-100 text-green-800 border-green-200">Approved</Badge>;
      case "REJECTED":
        return <Badge className="bg-red-100 text-red-800 border-red-200">Rejected</Badge>;
      case "COMPLETED":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Completed</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">{status}</Badge>;
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <PersonalSidebarWrapper currentPath="/personal/authorizations">
      <div className="p-6 space-y-6">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="sm"
            className="mr-4"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Authorization Details</h1>
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
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Request #{authorization.id}</CardTitle>
                  {getStatusBadge(authorization.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {authorization.authorizationCode && (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-md p-4 mb-4">
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
                      <div>
                        <p className="font-medium text-green-800 dark:text-green-300">
                          Authorization Code
                        </p>
                        <p className="text-green-700 dark:text-green-200 text-lg font-mono">
                          {authorization.authorizationCode}
                        </p>
                        <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                          Present this code to the hospital when receiving services
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Hospital</p>
                    <p className="text-base">{authorization.hospital?.name || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Created At</p>
                    <p className="text-base">{formatDate(authorization.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Diagnosis</p>
                    <p className="text-base">{authorization.diagnosis}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Reviewed At</p>
                    <p className="text-base">
                      {authorization.reviewedAt
                        ? formatDate(authorization.reviewedAt)
                        : "Not yet reviewed"}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Services</p>
                  <p className="text-base whitespace-pre-wrap">
                    {authorization.services || authorization.service?.name || "N/A"}
                  </p>
                </div>

                {authorization.notes && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Notes</p>
                    <p className="text-base whitespace-pre-wrap">{authorization.notes}</p>
                  </div>
                )}

                {authorization.rejectionReason && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4">
                    <div className="flex items-start">
                      <XCircle className="h-5 w-5 text-destructive mr-2 mt-0.5" />
                      <div>
                        <p className="font-medium text-destructive">Rejection Reason</p>
                        <p className="text-destructive/90 whitespace-pre-wrap">
                          {authorization.rejectionReason}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Not Found</AlertTitle>
            <AlertDescription>
              The authorization request could not be found.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </PersonalSidebarWrapper>
  );
}