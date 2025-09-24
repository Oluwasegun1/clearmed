"use client";

import type React from "react";

import { HMOSidebarWrapper } from "@/components/sidebars";
import {
  Building2,
  Users,
  FileText,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Activity,
  AlertTriangle,
  Zap,
} from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down";
  icon: React.ReactNode;
}

function MetricCard({ title, value, change, trend, icon }: MetricCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] p-6 backdrop-blur-xl transition-all duration-300 hover:border-white/20 hover:bg-gradient-to-br hover:from-white/10 hover:to-white/[0.05]">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-orange-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-orange-500/20 text-white backdrop-blur-sm">
            {icon}
          </div>
          <div>
            <p className="text-sm font-medium text-white/70">{title}</p>
            <p className="text-3xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
              {value}
            </p>
          </div>
        </div>
        <div
          className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium backdrop-blur-sm ${
            trend === "up"
              ? "bg-green-500/20 text-green-300 border border-green-500/30"
              : "bg-red-500/20 text-red-300 border border-red-500/30"
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-500/20 text-green-300 border-green-500/30";
      case "pending":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
      case "warning":
        return "bg-orange-500/20 text-orange-300 border-orange-500/30";
      case "error":
        return "bg-red-500/20 text-red-300 border-red-500/30";
      default:
        return "bg-white/10 text-white/70 border-white/20";
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] p-6 backdrop-blur-xl">
      <h3 className="text-xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent mb-6">
        Recent Activity
      </h3>
      <div className="space-y-4">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="group flex items-start gap-4 p-4 rounded-xl hover:bg-white/5 transition-all duration-300 border border-transparent hover:border-white/10"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-orange-500/20 text-white backdrop-blur-sm">
              {activity.type === "claim" && <FileText className="h-5 w-5" />}
              {activity.type === "enrollment" && <Users className="h-5 w-5" />}
              {activity.type === "payment" && (
                <DollarSign className="h-5 w-5" />
              )}
              {activity.type === "alert" && (
                <AlertTriangle className="h-5 w-5" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-semibold text-white">
                  {activity.title}
                </p>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                    activity.status
                  )}`}
                >
                  {activity.status}
                </span>
              </div>
              <p className="text-sm text-white/70 mb-1">
                {activity.description}
              </p>
              <p className="text-xs text-white/50">{activity.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
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
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] p-6 backdrop-blur-xl">
      <h3 className="text-xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent mb-6">
        Top Hospitals by Claims
      </h3>
      <div className="space-y-4">
        {hospitals.map((hospital, index) => (
          <div
            key={hospital.name}
            className="group flex items-center justify-between p-4 rounded-xl hover:bg-white/5 transition-all duration-300 border border-transparent hover:border-white/10"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/30 to-orange-500/30 text-white font-bold backdrop-blur-sm">
                {index + 1}
              </div>
              <div>
                <p className="font-semibold text-white">{hospital.name}</p>
                <p className="text-sm text-white/70">
                  {hospital.claims} claims
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-white">{hospital.amount}</p>
              <div className="flex items-center gap-2">
                <div className="w-16 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-orange-500 rounded-full transition-all duration-500"
                    style={{ width: `${hospital.utilization}%` }}
                  />
                </div>
                <p className="text-sm text-white/70">{hospital.utilization}%</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HMODashboard() {
  return (
    <HMOSidebarWrapper currentPath="/hmo/dashboard">
      <div className="flex h-full flex-col bg-black relative overflow-hidden">
        {/* Animated background grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />

        {/* Floating orbs */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse delay-1000" />

        {/* Header */}
        <div className="relative border-b border-white/10 bg-gradient-to-r from-black/50 to-black/30 backdrop-blur-xl p-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-purple-200 to-orange-200 bg-clip-text text-transparent mb-2">
                HMO Dashboard
              </h1>
              <p className="text-white/70 text-lg">
                Monitor your health management organizations performance
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-white/50 mb-1">Last updated</p>
              <p className="text-sm font-medium text-white/80">
                {new Date().toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="relative flex-1 overflow-y-auto p-8">
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <MetricCard
              title="Total Members"
              value="24,567"
              change="+12.5%"
              trend="up"
              icon={<Users className="h-6 w-6" />}
            />
            <MetricCard
              title="Active Claims"
              value="1,234"
              change="-3.2%"
              trend="down"
              icon={<FileText className="h-6 w-6" />}
            />
            <MetricCard
              title="Network Hospitals"
              value="156"
              change="+8.1%"
              trend="up"
              icon={<Building2 className="h-6 w-6" />}
            />
            <MetricCard
              title="Monthly Revenue"
              value="$8.2M"
              change="+15.3%"
              trend="up"
              icon={<DollarSign className="h-6 w-6" />}
            />
          </div>

          {/* Charts and Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <RecentActivity />
            <TopHospitals />
          </div>

          {/* Additional Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] p-6 backdrop-blur-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-orange-500/20 text-white backdrop-blur-sm">
                  <Activity className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                  Utilization Rate
                </h3>
              </div>
              <div className="space-y-6">
                {[
                  { name: "Emergency Care", rate: 87 },
                  { name: "Outpatient", rate: 72 },
                  { name: "Specialist Care", rate: 65 },
                ].map((item) => (
                  <div key={item.name}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-white/80">
                        {item.name}
                      </span>
                      <span className="text-sm font-bold text-white">
                        {item.rate}%
                      </span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-orange-500 h-3 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${item.rate}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] p-6 backdrop-blur-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-orange-500/20 text-white backdrop-blur-sm">
                  <DollarSign className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                  Cost Analysis
                </h3>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-white/70">
                    Average Cost per Member
                  </span>
                  <span className="font-semibold text-white">$334</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-white/70">
                    Claims Processing Cost
                  </span>
                  <span className="font-semibold text-white">$12.50</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-white/70">
                    Administrative Cost
                  </span>
                  <span className="font-semibold text-white">$45.20</span>
                </div>
                <div className="border-t border-white/10 pt-4 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-white/90">
                      Total Monthly Cost
                    </span>
                    <span className="font-bold text-xl bg-gradient-to-r from-purple-400 to-orange-400 bg-clip-text text-transparent">
                      $6.8M
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] p-6 backdrop-blur-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-orange-500/20 text-white backdrop-blur-sm">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                  Alerts & Notifications
                </h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 backdrop-blur-sm">
                  <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-yellow-300">
                      High Utilization
                    </p>
                    <p className="text-xs text-yellow-400/80">
                      Cardiology dept at 95% capacity
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 backdrop-blur-sm">
                  <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-red-300">
                      Overdue Claims
                    </p>
                    <p className="text-xs text-red-400/80">
                      23 claims pending review
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 backdrop-blur-sm">
                  <Zap className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-blue-300">
                      System Update
                    </p>
                    <p className="text-xs text-blue-400/80">
                      Scheduled maintenance tonight
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </HMOSidebarWrapper>
  );
}
