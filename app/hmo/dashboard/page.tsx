"use client";

import { HMOSidebarWrapper } from "@/components/sidebars";
import {
  Building2,
  Users,
  FileText,
  DollarSign,
  AlertTriangle,
  Zap,
} from "lucide-react";
import {
  PageShell,
  PageHeader,
  MetricCard,
  ListCard,
  ListCardItem,
  StatusBadge,
  ProgressBar,
} from "@/components/shared";

interface RecentActivityItem {
  id: string;
  type: "claim" | "enrollment" | "payment" | "alert";
  title: string;
  description: string;
  time: string;
  status: "success" | "pending" | "warning" | "error";
}

function RecentActivity() {
  const activities: RecentActivityItem[] = [
    {
      id: "1",
      type: "claim",
      title: "New Claim Submitted",
      description: "General Hospital - Emergency Care",
      time: "2 hours ago",
      status: "pending",
    },
    {
      id: "2",
      type: "enrollment",
      title: "Member Enrollment",
      description: "John Doe - Premium Plan",
      time: "4 hours ago",
      status: "success",
    },
    {
      id: "3",
      type: "payment",
      title: "Payment Processed",
      description: "City Medical Center - $15,420",
      time: "6 hours ago",
      status: "success",
    },
    {
      id: "4",
      type: "alert",
      title: "High Utilization Alert",
      description: "Cardiology Department - 95% capacity",
      time: "8 hours ago",
      status: "warning",
    },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "claim":
        return FileText;
      case "enrollment":
        return Users;
      case "payment":
        return DollarSign;
      default:
        return AlertTriangle;
    }
  };

  const getActivityIconBg = (type: string) => {
    switch (type) {
      case "claim":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
      case "enrollment":
        return "bg-purple-500/10 text-purple-600 dark:text-purple-400";
      case "payment":
        return "bg-green-500/10 text-green-600 dark:text-green-400";
      default:
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
    }
  };

  return (
    <ListCard title="Recent Activity" className="h-full">
      <div className="space-y-2 pt-2">
        {activities.map((activity) => (
          <ListCardItem
            key={activity.id}
            icon={getActivityIcon(activity.type)}
            iconBg={getActivityIconBg(activity.type)}
            title={<span className="font-semibold">{activity.title}</span>}
            subtitle={activity.description}
            action={
              <div className="flex flex-col items-end gap-1.5">
                <StatusBadge status={activity.status} />
                <span className="text-[10px] text-muted-foreground">{activity.time}</span>
              </div>
            }
          />
        ))}
      </div>
    </ListCard>
  );
}

function TopHospitals() {
  const hospitals = [
    {
      name: "General Hospital",
      claims: 1247,
      amount: "$2.4M",
      utilization: 92,
    },
    {
      name: "City Medical Center",
      claims: 986,
      amount: "$1.8M",
      utilization: 87,
    },
    {
      name: "Regional Healthcare",
      claims: 743,
      amount: "$1.3M",
      utilization: 78,
    },
    {
      name: "Community Hospital",
      claims: 654,
      amount: "$1.1M",
      utilization: 71,
    },
    {
      name: "Metro Health System",
      claims: 521,
      amount: "$950K",
      utilization: 65,
    },
  ];

  return (
    <ListCard title="Top Hospitals by Claims" className="h-full">
      <div className="space-y-4 pt-2">
        {hospitals.map((hospital, index) => (
          <div
            key={hospital.name}
            className="p-3.5 border border-border/50 rounded-xl bg-card/50 hover:bg-muted/40 transition-colors flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold text-sm flex items-center justify-center shrink-0">
                {index + 1}
              </div>
              <div>
                <p className="font-semibold text-sm text-foreground">{hospital.name}</p>
                <p className="text-xs text-muted-foreground">{hospital.claims} claims</p>
              </div>
            </div>
            <div className="text-right space-y-1">
              <p className="font-bold text-sm text-foreground">{hospital.amount}</p>
              <div className="flex items-center gap-2">
                <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${hospital.utilization}%` }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground">{hospital.utilization}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ListCard>
  );
}

export default function HMODashboard() {
  return (
    <HMOSidebarWrapper currentPath="/hmo/dashboard">
      <PageShell>
        {/* Header */}
        <PageHeader
          title="HMO Dashboard"
          subtitle="Monitor your health management organization's performance"
          actions={
            <div className="text-right shrink-0">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                Last updated
              </p>
              <p className="text-sm font-semibold text-foreground mt-0.5">
                {new Date().toLocaleDateString()}
              </p>
            </div>
          }
        />

        {/* Main Content */}
        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              label="Total Members"
              value="24,567"
              badge="+12.5%"
              trend="up"
              icon={Users}
              iconColor="primary"
            />
            <MetricCard
              label="Active Claims"
              value="1,234"
              badge="-3.2%"
              trend="down"
              icon={FileText}
              iconColor="blue"
            />
            <MetricCard
              label="Network Hospitals"
              value="156"
              badge="+8.1%"
              trend="up"
              icon={Building2}
              iconColor="purple"
            />
            <MetricCard
              label="Monthly Revenue"
              value="$8.2M"
              badge="+15.3%"
              trend="up"
              icon={DollarSign}
              iconColor="green"
            />
          </div>

          {/* Charts and Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RecentActivity />
            <TopHospitals />
          </div>

          {/* Additional Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ListCard title="Utilization Rate">
              <div className="space-y-4 pt-2">
                {[
                  { name: "Emergency Care", rate: 87, color: "red" as const },
                  { name: "Outpatient", rate: 72, color: "yellow" as const },
                  { name: "Specialist Care", rate: 65, color: "green" as const },
                ].map((item) => (
                  <ProgressBar
                    key={item.name}
                    label={item.name}
                    value={item.rate}
                    color={item.color}
                  />
                ))}
              </div>
            </ListCard>

            <ListCard title="Cost Analysis">
              <div className="space-y-3 pt-2 text-sm">
                <div className="flex justify-between items-center py-1">
                  <span className="text-muted-foreground">Average Cost per Member</span>
                  <span className="font-semibold text-foreground">$334</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-muted-foreground">Claims Processing Cost</span>
                  <span className="font-semibold text-foreground">$12.50</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-muted-foreground">Administrative Cost</span>
                  <span className="font-semibold text-foreground">$45.20</span>
                </div>
                <div className="border-t border-border pt-3 mt-3 flex justify-between items-center">
                  <span className="font-semibold text-foreground">Total Monthly Cost</span>
                  <span className="font-bold text-lg text-primary">$6.8M</span>
                </div>
              </div>
            </ListCard>

            <ListCard title="Alerts & Notifications">
              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">High Utilization</p>
                    <p className="text-xs text-muted-foreground">Cardiology dept at 95% capacity</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                  <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-600 dark:text-red-400">Overdue Claims</p>
                    <p className="text-xs text-muted-foreground">23 claims pending review</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <Zap className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">System Update</p>
                    <p className="text-xs text-muted-foreground">Scheduled maintenance tonight</p>
                  </div>
                </div>
              </div>
            </ListCard>
          </div>
        </div>
      </PageShell>
    </HMOSidebarWrapper>
  );
}
