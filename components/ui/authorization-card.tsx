'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AuthStatus } from "@/lib/generated/prisma";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface AuthorizationCardProps {
  id: string;
  authorizationCode: string;
  patientName: string;
  hospitalName: string;
  diagnosis: string;
  services: Array<{
    id: string;
    name: string;
    cost: number;
  }>;
  status: AuthStatus;
  createdAt: Date;
  reviewedAt?: Date | null;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onView?: (id: string) => void;
  isHmoStaff?: boolean;
}

export default function AuthorizationCard({
  id,
  authorizationCode,
  patientName,
  hospitalName,
  diagnosis,
  services,
  status,
  createdAt,
  reviewedAt,
  onApprove,
  onReject,
  onView,
  isHmoStaff = false,
}: AuthorizationCardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleApprove = async () => {
    if (!onApprove) return;
    setIsLoading(true);
    try {
      await onApprove(id);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    if (!onReject) return;
    setIsLoading(true);
    try {
      await onReject(id);
    } finally {
      setIsLoading(false);
    }
  };

  const totalCost = services.reduce((sum, service) => sum + service.cost, 0);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusColor = (status: AuthStatus) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "APPROVED":
        return "bg-green-100 text-green-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card className="w-full mb-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{authorizationCode}</CardTitle>
            <CardDescription>{formatDate(createdAt)}</CardDescription>
          </div>
          <Badge className={getStatusColor(status)}>{status}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-sm font-medium text-gray-500">Patient</p>
              <p className="text-sm">{patientName}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Hospital</p>
              <p className="text-sm">{hospitalName}</p>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Diagnosis</p>
            <p className="text-sm">{diagnosis}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Services</p>
            <ul className="text-sm list-disc pl-5">
              {services.map((service) => (
                <li key={service.id}>
                  {service.name} - ₦{service.cost.toLocaleString()}
                </li>
              ))}
            </ul>
            <p className="text-sm font-medium mt-2">
              Total: ₦{totalCost.toLocaleString()}
            </p>
          </div>
          {reviewedAt && (
            <div>
              <p className="text-sm font-medium text-gray-500">Reviewed On</p>
              <p className="text-sm">{formatDate(reviewedAt)}</p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-2 pb-4 px-6">
        <div className="flex justify-end w-full space-x-2">
          {isHmoStaff && status === "PENDING" && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReject}
                disabled={isLoading}
                className="border-red-200 text-red-700 hover:bg-red-50"
              >
                Reject
              </Button>
              <Button size="sm" onClick={handleApprove} disabled={isLoading}>
                Approve
              </Button>
            </>
          )}
          {onView ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onView(id)}
              disabled={isLoading}
            >
              View Details
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/personal/authorizations/${id}`)}
              disabled={isLoading}
            >
              View Details
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}