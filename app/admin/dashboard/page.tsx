"use client";

/**
 * System admin dashboard: live stats for hospitals, HMOs, users, and audit log entries.
 * Quick actions for hospital/HMO onboarding.
 * Access restricted to SYSTEM_ADMIN. Layout provided by app/admin/layout.tsx.
 */

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Users,
  FileText,
  Activity,
  PlusCircle,
  ArrowRight,
  Loader2,
  Shield,
  Stethoscope,
  CreditCard,
  UserCheck,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

/* ── Stat card ────────────────────────────────────────────────── */

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  loading?: boolean;
  href?: string;
  accent?: string;
}

function StatCard({ title, value, description, icon, loading, href, accent = "bg-primary/10 text-primary" }: StatCardProps) {
  const router = useRouter();
  return (
    <Card
      className={`data-visualization transition-colors ${href ? "hover:border-primary/40 cursor-pointer" : ""}`}
      onClick={() => href && router.push(href)}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${accent}`}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

/* ── Quick action card ─────────────────────────────────────────── */

interface ActionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  cta: string;
  accent: string;
}

function ActionCard({ title, description, icon, href, cta, accent }: ActionCardProps) {
  const router = useRouter();
  return (
    <Card className="data-visualization hover:border-primary/40 transition-colors">
      <CardHeader>
        <div className="flex items-start gap-4">
          <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${accent}`}>
            {icon}
          </div>
          <div>
            <CardTitle className="text-base text-foreground">{title}</CardTitle>
            <CardDescription className="mt-1">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Button
          className="w-full gap-2"
          onClick={() => router.push(href)}
          id={`action-${title.toLowerCase().replace(/\s+/g, "-")}`}
        >
          <PlusCircle className="h-4 w-4" />
          {cta}
          <ArrowRight className="h-4 w-4 ml-auto" />
        </Button>
      </CardContent>
    </Card>
  );
}

/* ── Dashboard page ─────────────────────────────────────────────── */

interface AdminStats {
  totalUsers: number;
  totalPatients: number;
  totalHospitals: number;
  totalHMOs: number;
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
}

const emptyStats: AdminStats = {
  totalUsers: 0,
  totalPatients: 0,
  totalHospitals: 0,
  totalHMOs: 0,
  totalRequests: 0,
  pendingRequests: 0,
  approvedRequests: 0,
  rejectedRequests: 0,
};

export default function AdminDashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/admin/stats");
        if (res.ok) {
          const data: AdminStats = await res.json();
          setStats(data);
        } else {
          setStats(emptyStats);
        }
      } catch {
        setStats(emptyStats);
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 professional-grid opacity-30 pointer-events-none" />

      <main className="relative container px-6 py-8 space-y-8">
        {/* Greeting */}
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">System Overview</h1>
            <p className="text-muted-foreground text-sm">
              Signed in as{" "}
              <span className="font-medium text-foreground">
                {session?.user?.email ?? "Admin"}
              </span>
            </p>
          </div>
        </div>

        {/* ── Registry Stats ── */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Registry
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Users"
              value={stats?.totalUsers ?? "—"}
              description="All registered accounts"
              icon={<Users className="h-4 w-4" />}
              accent="bg-primary/10 text-primary"
              loading={statsLoading}
              href="/admin/users"
            />
            <StatCard
              title="Total Patients"
              value={stats?.totalPatients ?? "—"}
              description="Enrolled HMO members"
              icon={<UserCheck className="h-4 w-4" />}
              accent="bg-blue-500/10 text-blue-600"
              loading={statsLoading}
            />
            <StatCard
              title="Total Hospitals"
              value={stats?.totalHospitals ?? "—"}
              description="Registered facilities"
              icon={<Building2 className="h-4 w-4" />}
              accent="bg-indigo-500/10 text-indigo-600"
              loading={statsLoading}
              href="/admin/hospitals"
            />
            <StatCard
              title="Total HMOs"
              value={stats?.totalHMOs ?? "—"}
              description="Health maintenance organisations"
              icon={<Activity className="h-4 w-4" />}
              accent="bg-violet-500/10 text-violet-600"
              loading={statsLoading}
              href="/admin/hmos"
            />
          </div>
        </div>

        {/* ── Authorization Request Stats ── */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Authorization Requests
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Requests"
              value={stats?.totalRequests ?? "—"}
              description="All pre-auth requests submitted"
              icon={<FileText className="h-4 w-4" />}
              accent="bg-slate-500/10 text-slate-600"
              loading={statsLoading}
            />
            <StatCard
              title="Pending"
              value={stats?.pendingRequests ?? "—"}
              description="Awaiting HMO review"
              icon={<CreditCard className="h-4 w-4" />}
              accent="bg-yellow-500/10 text-yellow-600"
              loading={statsLoading}
            />
            <StatCard
              title="Approved"
              value={stats?.approvedRequests ?? "—"}
              description="Approved by HMO (incl. auto-approved)"
              icon={<Stethoscope className="h-4 w-4" />}
              accent="bg-green-500/10 text-green-600"
              loading={statsLoading}
            />
            <StatCard
              title="Rejected"
              value={stats?.rejectedRequests ?? "—"}
              description="Declined by HMO"
              icon={<Shield className="h-4 w-4" />}
              accent="bg-red-500/10 text-red-600"
              loading={statsLoading}
            />
          </div>
        </div>

        {/* Quick actions */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            <ActionCard
              title="Register Hospital"
              description="Onboard a new healthcare facility. All hospital staff will be linked to the registered entity."
              icon={<Building2 className="h-6 w-6 text-blue-600" />}
              accent="bg-blue-50 dark:bg-blue-500/10"
              href="/admin/hospitals/new"
              cta="Register hospital"
            />
            <ActionCard
              title="Register HMO"
              description="Onboard a new Health Maintenance Organisation. A default Standard Care Plan is created automatically."
              icon={<Shield className="h-6 w-6 text-primary" />}
              accent="bg-primary/10"
              href="/admin/hmos/new"
              cta="Register HMO"
            />
            <ActionCard
              title="Manage Users"
              description="View all user accounts, activate or deactivate accounts, and review account lock status."
              icon={<Users className="h-6 w-6 text-purple-600" />}
              accent="bg-purple-50 dark:bg-purple-500/10"
              href="/admin/users"
              cta="View all users"
            />
          </div>
        </div>
      </main>
    </div>
  );
}
