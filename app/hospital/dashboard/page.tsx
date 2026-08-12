"use client";

import { useEffect, useState } from "react";
import { HospitalSidebarWrapper } from "@/components/sidebars";
import {
  Users,
  Bed,
  UserCheck,
  Activity,
  Clock,
  AlertTriangle,
  Heart,
  Stethoscope,
  Calendar,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  FileText,
} from "lucide-react";
import Link from "next/link";

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down";
  icon: React.ReactNode;
  color?: string;
}

function MetricCard({
  title,
  value,
  change,
  trend,
  icon,
  color = "primary",
}: MetricCardProps) {
  const colorClasses = {
    primary: "bg-primary/10 text-primary",
    green: "bg-green-500/10 text-green-600",
    blue: "bg-blue-500/10 text-blue-600",
    orange: "bg-orange-500/10 text-orange-600",
  };

  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-lg ${
              colorClasses[color as keyof typeof colorClasses] ??
              colorClasses.primary
            }`}
          >
            {icon}
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        </div>
        <div
          className={`flex items-center gap-1 text-sm ${
            trend === "up" ? "text-green-600" : "text-red-600"
          }`}
        >
          {trend === "up" ? (
            <TrendingUp className="h-4 w-4" />
          ) : (
            <TrendingDown className="h-4 w-4" />
          )}
          {change}
        </div>
      </div>
    </div>
  );
}

function BedOccupancy() {
  const departments = [
    { name: "ICU", total: 24, occupied: 22, available: 2, occupancy: 92 },
    { name: "Emergency", total: 18, occupied: 15, available: 3, occupancy: 83 },
    { name: "General Ward", total: 120, occupied: 95, available: 25, occupancy: 79 },
    { name: "Pediatrics", total: 30, occupied: 18, available: 12, occupancy: 60 },
    { name: "Maternity", total: 25, occupied: 12, available: 13, occupancy: 48 },
  ];

  const getOccupancyColor = (occupancy: number) => {
    if (occupancy >= 90) return "text-red-600 bg-red-50";
    if (occupancy >= 75) return "text-yellow-600 bg-yellow-50";
    return "text-green-600 bg-green-50";
  };

  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <h3 className="text-lg font-semibold mb-4">
        Bed Occupancy by Department
      </h3>
      <div className="space-y-4">
        {departments.map((dept) => (
          <div key={dept.name} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">{dept.name}</span>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getOccupancyColor(
                    dept.occupancy,
                  )}`}
                >
                  {dept.occupancy}%
                </span>
                <span className="text-sm text-muted-foreground">
                  {dept.occupied}/{dept.total}
                </span>
              </div>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  dept.occupancy >= 90
                    ? "bg-red-500"
                    : dept.occupancy >= 75
                      ? "bg-yellow-500"
                      : "bg-green-500"
                }`}
                style={{ width: `${dept.occupancy}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecentRequests({ requests }: { requests: any[] }) {
  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Incoming Patient & Pre-Auth Requests</h3>
        <Link href="/hospital/requests" className="text-xs text-primary hover:underline font-medium">
          View all →
        </Link>
      </div>

      {requests.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          No patient requests received yet.
        </p>
      ) : (
        <div className="space-y-4">
          {requests.slice(0, 5).map((req) => (
            <div
              key={req.id}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors border"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-medium text-sm">
                  {(req.patientName || "P").charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-sm">{req.patientName}</p>
                  <p className="text-xs text-muted-foreground">
                    {req.serviceName} • HMO: {req.hmoName}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    req.status === "APPROVED" || req.status === "AUTO_APPROVED"
                      ? "bg-green-100 text-green-800"
                      : req.status === "PENDING"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {req.status}
                </span>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(req.requestDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function HospitalDashboard() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/hospital/requests")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setRequests(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalCount = requests.length;
  const pendingCount = requests.filter((r) => r.status === "PENDING").length;
  const approvedCount = requests.filter((r) => r.status === "APPROVED" || r.status === "AUTO_APPROVED").length;

  return (
    <HospitalSidebarWrapper currentPath="/hospital/dashboard">
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="border-b bg-background p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Hospital Dashboard</h1>
              <p className="text-muted-foreground">
                Monitor incoming patient requests, authorizations, and hospital operations
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Live Sync</p>
              <p className="text-sm font-medium">
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <MetricCard
              title="Total Requests"
              value={String(totalCount)}
              change="+Live"
              trend="up"
              icon={<FileText className="h-5 w-5" />}
            />
            <MetricCard
              title="Pending Authorization"
              value={String(pendingCount)}
              change="Active"
              trend="up"
              icon={<Clock className="h-5 w-5" />}
              color="orange"
            />
            <MetricCard
              title="Approved Pre-Auths"
              value={String(approvedCount)}
              change="+Ok"
              trend="up"
              icon={<CheckCircle2 className="h-5 w-5" />}
              color="green"
            />
            <MetricCard
              title="Bed Occupancy"
              value="78%"
              change="-2.1%"
              trend="down"
              icon={<Bed className="h-5 w-5" />}
              color="blue"
            />
          </div>

          {/* Charts and Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <BedOccupancy />
            <RecentRequests requests={requests} />
          </div>
        </div>
      </div>
    </HospitalSidebarWrapper>
  );
}
