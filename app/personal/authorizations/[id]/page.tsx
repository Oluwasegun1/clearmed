"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { PersonalSidebarWrapper } from "@/components/sidebars";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function AuthorizationDetails({ params }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [authorization, setAuthorization] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAuthorizationDetails = async () => {
      if (!params.id) return;

      try {
        const response = await fetch(`/api/authorizations/${params.id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch authorization details");
        }

        const data = await response.json();
        setAuthorization(data);
      } catch (error) {
        console.error("Error fetching authorization details:", error);
        setError(error.message || "Failed to load authorization details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAuthorizationDetails();
  }, [params.id]);

  const getStatusBadge = (status) => {
    switch (status) {
      case "PENDING":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "APPROVED":
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case "REJECTED":
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      case "COMPLETED":
        return <Badge className="bg-blue-100 text-blue-800">Completed</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const formatDate = (dateString) => {
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
                  <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                      <div>
                        <p className="font-medium text-green-800">
                          Authorization Code
                        </p>
                        <p className="text-green-700 text-lg font-mono">
                          {authorization.authorizationCode}
                        </p>
                        <p className="text-sm text-green-600 mt-1">
                          Present this code to the hospital when receiving services
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Hospital</p>
                    <p className="text-base">{authorization.hospital?.name || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Created At</p>
                    <p className="text-base">{formatDate(authorization.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Diagnosis</p>
                    <p className="text-base">{authorization.diagnosis}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Reviewed At</p>
                    <p className="text-base">
                      {authorization.reviewedAt ? formatDate(authorization.reviewedAt) : "Not yet reviewed"}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Services</p>
                  <p className="text-base whitespace-pre-wrap">{authorization.services}</p>
                </div>

                {authorization.notes && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Notes</p>
                    <p className="text-base whitespace-pre-wrap">{authorization.notes}</p>
                  </div>
                )}

                {authorization.rejectionReason && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <div className="flex items-start">
                      <XCircle className="h-5 w-5 text-red-600 mr-2 mt-0.5" />
                      <div>
                        <p className="font-medium text-red-800">Rejection Reason</p>
                        <p className="text-red-700 whitespace-pre-wrap">
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