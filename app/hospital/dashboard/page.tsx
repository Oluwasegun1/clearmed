"use client";

import { useEffect, useState } from "react";
import { HospitalSidebarWrapper } from "@/components/sidebars";
import {
  Bed,
  Clock,
  CheckCircle2,
  FileText,
} from "lucide-react";
import Link from "next/link";
import {
  PageShell,
  PageHeader,
  MetricCard,
  ListCard,
  ListCardItem,
  StatusBadge,
  ProgressBar,
} from "@/components/shared";

interface RequestData {
  id: string;
  patientName: string;
  serviceName: string;
  hmoName: string;
  status: string;
  requestDate: string;
}

function BedOccupancy() {
  const departments = [
    { name: "ICU", total: 24, occupied: 22, color: "red" as const },
    { name: "Emergency", total: 18, occupied: 15, color: "yellow" as const },
    { name: "General Ward", total: 120, occupied: 95, color: "yellow" as const },
    { name: "Pediatrics", total: 30, occupied: 18, color: "green" as const },
    { name: "Maternity", total: 25, occupied: 12, color: "green" as const },
  ];

  return (
    <ListCard title="Bed Occupancy by Department" className="h-full">
      <div className="space-y-4 pt-2">
        {departments.map((dept) => (
          <ProgressBar
            key={dept.name}
            label={dept.name}
            value={dept.occupied}
            max={dept.total}
            subText={`${dept.occupied}/${dept.total} occupied`}
            color={dept.color}
          />
        ))}
      </div>
    </ListCard>
  );
}

function RecentRequests({ requests }: { requests: RequestData[] }) {
  return (
    <ListCard
      title="Incoming Patient & Pre-Auth Requests"
      action={
        <Link
          href="/hospital/requests"
          className="text-xs text-primary hover:underline font-semibold"
        >
          View all →
        </Link>
      }
      className="h-full"
    >
      <div className="space-y-2 pt-2">
        {requests.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No patient requests received yet.
          </p>
        ) : (
          requests.slice(0, 5).map((req) => (
            <ListCardItem
              key={req.id}
              avatarText={req.patientName || "P"}
              title={<span className="font-semibold">{req.patientName}</span>}
              subtitle={`${req.serviceName} • HMO: ${req.hmoName}`}
              action={
                <div className="flex flex-col items-end gap-1.5">
                  <StatusBadge status={req.status} />
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(req.requestDate).toLocaleDateString()}
                  </span>
                </div>
              }
            />
          ))
        )}
      </div>
    </ListCard>
  );
}

export default function HospitalDashboard() {
  const [requests, setRequests] = useState<RequestData[]>([]);
  useEffect(() => {
    fetch("/api/hospital/requests")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setRequests(data);
      })
      .catch(console.error);
  }, []);

  const totalCount = requests.length;
  const pendingCount = requests.filter((r) => r.status === "PENDING").length;
  const approvedCount = requests.filter(
    (r) => r.status === "APPROVED" || r.status === "AUTO_APPROVED"
  ).length;

  return (
    <HospitalSidebarWrapper currentPath="/hospital/dashboard">
      <PageShell>
        {/* Header */}
        <PageHeader
          title="Hospital Dashboard"
          subtitle="Monitor incoming patient requests, authorizations, and hospital operations"
          actions={
            <div className="text-right shrink-0">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                Live Sync Active
              </p>
              <p className="text-sm font-semibold text-foreground mt-0.5">
                {new Date().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          }
        />

        {/* Main Content */}
        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              label="Total Requests"
              value={String(totalCount)}
              badge="+Live"
              trend="up"
              icon={FileText}
              iconColor="primary"
            />
            <MetricCard
              label="Pending Authorization"
              value={String(pendingCount)}
              badge="Active"
              trend="stable"
              icon={Clock}
              iconColor="orange"
            />
            <MetricCard
              label="Approved Pre-Auths"
              value={String(approvedCount)}
              badge="+Ok"
              trend="up"
              icon={CheckCircle2}
              iconColor="green"
            />
            <MetricCard
              label="Bed Occupancy"
              value="78%"
              badge="-2.1%"
              trend="down"
              icon={Bed}
              iconColor="blue"
              progress={78}
            />
          </div>

          {/* Charts and Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BedOccupancy />
            <RecentRequests requests={requests} />
          </div>
        </div>
      </PageShell>
    </HospitalSidebarWrapper>
  );
}
