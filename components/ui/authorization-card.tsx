'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AuthStatus } from "@/lib/enums/AuthStatus";
import { StatusBadge } from "@/components/shared";
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
  status: AuthStatus | string;
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
    return new Date(date).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <Card className="w-full mb-4 data-visualization">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-base font-mono font-bold text-primary">
              #{authorizationCode || id.substring(0, 8)}
            </CardTitle>
            <CardDescription>{formatDate(createdAt)}</CardDescription>
          </div>
          <StatusBadge status={status} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="text-muted-foreground">Patient</p>
              <p className="font-medium text-foreground">{patientName}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Hospital</p>
              <p className="font-medium text-foreground">{hospitalName}</p>
            </div>
          </div>
          {diagnosis && (
            <div className="text-xs">
              <p className="text-muted-foreground">Diagnosis / Encounter</p>
              <p className="text-foreground">{diagnosis}</p>
            </div>
          )}
          <div className="text-xs">
            <p className="text-muted-foreground mb-1">Services ({services.length})</p>
            <ul className="space-y-0.5">
              {services.map((service) => (
                <li key={service.id} className="flex justify-between text-foreground">
                  <span>{service.name}</span>
                  <span className="font-semibold">₦{service.cost.toLocaleString()}</span>
                </li>
              ))}
            </ul>
            <div className="flex justify-between border-t pt-1.5 mt-1.5 font-bold text-foreground">
              <span>Total Estimated Cost</span>
              <span className="text-primary">₦{totalCost.toLocaleString()}</span>
            </div>
          </div>
          {reviewedAt && (
            <div className="text-xs text-muted-foreground">
              <p>Reviewed: {formatDate(reviewedAt)}</p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-2 pb-4 px-6 border-t">
        <div className="flex justify-end w-full space-x-2">
          {onView ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onView(id)}
              disabled={isLoading}
              className="text-xs h-8"
            >
              View Service Breakdown
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/personal/authorizations/${id}`)}
              disabled={isLoading}
              className="text-xs h-8"
            >
              View Service Breakdown
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}