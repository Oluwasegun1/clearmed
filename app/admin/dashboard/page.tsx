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
}

function StatCard({ title, value, description, icon, loading, href }: StatCardProps) {
  const router = useRouter();
  return (
    <Card
      className={`data-visualization transition-colors ${href ? "hover:border-primary/40 cursor-pointer" : ""}`}
      onClick={() => href && router.push(href)}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
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

interface Stats {
  hospitals: number;
  hmos: number;
  users: number;
  auditLogs: number;
}

export default function AdminDashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [hRes, mRes, uRes, aRes] = await Promise.all([
          fetch("/api/admin/hospitals"),
          fetch("/api/admin/hmos"),
          fetch("/api/admin/users?limit=1"),
          fetch("/api/admin/audit-log?limit=1"),
        ]);
        const hospitals = hRes.ok ? await hRes.json() : [];
        const hmos = mRes.ok ? await mRes.json() : [];
        const usersData = uRes.ok ? await uRes.json() : { total: 0 };
        const auditData = aRes.ok ? await aRes.json() : { total: 0 };

        setStats({
          hospitals: Array.isArray(hospitals) ? hospitals.length : 0,
          hmos: Array.isArray(hmos) ? hmos.length : 0,
          users: typeof usersData?.total === "number" ? usersData.total : 0,
          auditLogs: typeof auditData?.total === "number" ? auditData.total : 0,
        });
      } catch {
        setStats({ hospitals: 0, hmos: 0, users: 0, auditLogs: 0 });
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

        {/* Stats row */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Hospitals"
            value={stats?.hospitals ?? "—"}
            description="Registered facilities"
            icon={<Building2 className="h-4 w-4" />}
            loading={statsLoading}
            href="/admin/hospitals"
          />
          <StatCard
            title="HMOs"
            value={stats?.hmos ?? "—"}
            description="Health maintenance organisations"
            icon={<Activity className="h-4 w-4" />}
            loading={statsLoading}
            href="/admin/hmos"
          />
          <StatCard
            title="Users"
            value={stats?.users ?? "—"}
            description="Total user accounts"
            icon={<Users className="h-4 w-4" />}
            loading={statsLoading}
            href="/admin/users"
          />
          <StatCard
            title="Audit Log Entries"
            value={stats?.auditLogs ?? "—"}
            description="System activity records"
            icon={<FileText className="h-4 w-4" />}
            loading={statsLoading}
            href="/admin/audit-log"
          />
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
