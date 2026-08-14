"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ListCard, ListCardItem, StatusBadge } from "@/components/shared";
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  User,
} from "lucide-react";

interface AuthorizationRequest {
  id: string;
  type: string;
  description: string;
  provider: string;
  requestDate: Date;
  status: "pending" | "approved" | "denied" | "expired";
  urgency: "low" | "medium" | "high";
  estimatedCost?: number;
}

// Mock data - in a real app, this would come from an API
const mockAuthorizations: AuthorizationRequest[] = [
  {
    id: "AUTH-2024-001",
    type: "Specialist Referral",
    description: "Cardiology consultation for chest pain evaluation",
    provider: "Dr. Michael Chen - Heart Center",
    requestDate: new Date("2024-01-15"),
    status: "approved",
    urgency: "high",
    estimatedCost: 450,
  },
  {
    id: "AUTH-2024-002",
    type: "Diagnostic Imaging",
    description: "MRI scan of lower back for chronic pain assessment",
    provider: "Downtown Imaging Center",
    requestDate: new Date("2024-01-12"),
    status: "pending",
    urgency: "medium",
    estimatedCost: 1200,
  },
  {
    id: "AUTH-2024-003",
    type: "Prescription",
    description: "Prior authorization for Humira (adalimumab) injection",
    provider: "Dr. Sarah Johnson - ClearMed Clinic",
    requestDate: new Date("2024-01-10"),
    status: "denied",
    urgency: "medium",
    estimatedCost: 2800,
  },
  {
    id: "AUTH-2024-004",
    type: "Surgical Procedure",
    description: "Arthroscopic knee surgery for meniscus repair",
    provider: "Dr. Robert Kim - Orthopedic Surgery",
    requestDate: new Date("2024-01-08"),
    status: "pending",
    urgency: "low",
    estimatedCost: 8500,
  },
];

export default function AuthorizationList() {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return CheckCircle;
      case "denied":
        return XCircle;
      case "expired":
        return AlertCircle;
      default:
        return Clock;
    }
  };

  const getStatusIconColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-500/10 text-green-600 dark:text-green-400";
      case "denied":
        return "bg-red-500/10 text-red-600 dark:text-red-400";
      case "expired":
        return "bg-orange-500/10 text-orange-600 dark:text-orange-400";
      default:
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case "high":
        return (
          <Badge
            variant="outline"
            className="border-red-500/30 text-red-600 dark:text-red-400 text-xs px-2.5 py-0.5 rounded-full"
          >
            High Priority
          </Badge>
        );
      case "medium":
        return (
          <Badge
            variant="outline"
            className="border-orange-500/30 text-orange-600 dark:text-orange-400 text-xs px-2.5 py-0.5 rounded-full"
          >
            Medium Priority
          </Badge>
        );
      default:
        return (
          <Badge
            variant="outline"
            className="border-blue-500/30 text-blue-600 dark:text-blue-400 text-xs px-2.5 py-0.5 rounded-full"
          >
            Low Priority
          </Badge>
        );
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  return (
    <ListCard
      title="Recent Authorization Requests"
      className="border-border bg-card/60 backdrop-blur-sm"
    >
      <div className="space-y-4 pt-2">
        {mockAuthorizations.map((auth) => (
          <ListCardItem
            key={auth.id}
            icon={getStatusIcon(auth.status)}
            iconBg={getStatusIconColor(auth.status)}
            title={
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-semibold text-foreground">{auth.type}</h4>
                {getUrgencyBadge(auth.urgency)}
              </div>
            }
            subtitle={
              <div className="space-y-2 mt-1">
                <p className="text-sm text-muted-foreground">
                  {auth.description}
                </p>
                <div className="flex items-center space-x-4 text-xs text-muted-foreground flex-wrap gap-y-1">
                  <div className="flex items-center space-x-1">
                    <User className="h-3.5 w-3.5" />
                    <span>{auth.provider}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{formatDate(auth.requestDate)}</span>
                  </div>
                  {auth.estimatedCost && (
                    <div className="flex items-center space-x-1">
                      <span className="font-medium text-foreground">
                        Est. Cost: {formatCurrency(auth.estimatedCost)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            }
            action={
              <div className="flex flex-col items-end gap-3">
                <StatusBadge status={auth.status} />
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground hover:text-foreground h-7"
                  >
                    View Details
                  </Button>
                  {auth.status === "pending" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-border text-foreground hover:bg-muted text-xs h-7"
                    >
                      Follow Up
                    </Button>
                  )}
                  {auth.status === "denied" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400 hover:bg-orange-500/20 text-xs h-7"
                    >
                      Appeal
                    </Button>
                  )}
                </div>
              </div>
            }
          />
        ))}

        {mockAuthorizations.length === 0 && (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              No Authorization Requests
            </h3>
            <p className="text-sm text-muted-foreground">
              You haven&apos;t submitted any authorization requests yet.
            </p>
          </div>
        )}
      </div>
    </ListCard>
  );
}
