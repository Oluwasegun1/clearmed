"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case "denied":
        return <XCircle className="h-4 w-4 text-red-400" />;
      case "expired":
        return <AlertCircle className="h-4 w-4 text-orange-400" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            Approved
          </Badge>
        );
      case "denied":
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
            Denied
          </Badge>
        );
      case "expired":
        return (
          <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
            Expired
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
            Pending
          </Badge>
        );
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case "high":
        return (
          <Badge
            variant="outline"
            className="border-red-500/30 text-red-400 text-xs"
          >
            High Priority
          </Badge>
        );
      case "medium":
        return (
          <Badge
            variant="outline"
            className="border-orange-500/30 text-orange-400 text-xs"
          >
            Medium Priority
          </Badge>
        );
      default:
        return (
          <Badge
            variant="outline"
            className="border-blue-500/30 text-blue-400 text-xs"
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
    <Card className="border-white/10 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center text-white">
          <FileText className="h-5 w-5 mr-2 text-blue-400" />
          Recent Authorization Requests
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockAuthorizations.map((auth) => (
            <div
              key={auth.id}
              className="p-4 border border-white/10 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    {getStatusIcon(auth.status)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-semibold text-white">{auth.type}</h4>
                      {getUrgencyBadge(auth.urgency)}
                    </div>
                    <p className="text-sm text-white/80 mb-2">
                      {auth.description}
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-white/60">
                      <div className="flex items-center space-x-1">
                        <User className="h-3 w-3" />
                        <span>{auth.provider}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(auth.requestDate)}</span>
                      </div>
                      {auth.estimatedCost && (
                        <div className="flex items-center space-x-1">
                          <span>
                            Est. Cost: {formatCurrency(auth.estimatedCost)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(auth.status)}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-xs text-white/50">
                  Request ID: {auth.id}
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white/70 hover:text-white hover:bg-white/10 text-xs"
                  >
                    View Details
                  </Button>
                  {auth.status === "pending" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-white/20 bg-white/5 text-white hover:bg-white/10 text-xs"
                    >
                      Follow Up
                    </Button>
                  )}
                  {auth.status === "denied" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-orange-500/30 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 text-xs"
                    >
                      Appeal
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {mockAuthorizations.length === 0 && (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-white/30 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white/70 mb-2">
              No Authorization Requests
            </h3>
            <p className="text-white/50">
              You haven&apos;t submitted any authorization requests yet.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
