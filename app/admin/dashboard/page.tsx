"use client";

/**
 * System admin dashboard: live stats + quick actions for hospital/HMO onboarding.
 * Access restricted to SYSTEM_ADMIN.
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
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Building2,
  Users,
  FileText,
  Activity,
  LogOut,
  PlusCircle,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

/* ── Header ──────────────────────────────────────────────────── */

function AdminHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <span className="font-semibold">ClearMed</span>
            <Badge variant="secondary" className="ml-2 text-xs">
              Admin
            </Badge>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut({ callbackUrl: "/auth/login" })}
          className="gap-2"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </header>
  );
}

/* ── Stat card ───────────────────────────────────────────────── */

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  loading?: boolean;
}

function StatCard({ title, value, description, icon, loading }: StatCardProps) {
  return (
    <Card>
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

/* ── Quick action card ───────────────────────────────────────── */

interface ActionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  cta: string;
  accent: string; // Tailwind colour class for the icon bg
}

function ActionCard({ title, description, icon, href, cta, accent }: ActionCardProps) {
  const router = useRouter();
  return (
    <Card className="data-visualization hover:border-primary/40 transition-colors">
      <CardHeader>
        <div className="flex items-start gap-4">
          <div
            className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${accent}`}
          >
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

/* ── Dashboard ───────────────────────────────────────────────── */

interface Stats {
  hospitals: number;
  hmos: number;
}

export default function AdminDashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [hRes, mRes] = await Promise.all([
          fetch("/api/admin/hospitals"),
          fetch("/api/admin/hmos"),
        ]);
        const hospitals = hRes.ok ? await hRes.json() : [];
        const hmos = mRes.ok ? await mRes.json() : [];
        setStats({
          hospitals: Array.isArray(hospitals) ? hospitals.length : 0,
          hmos: Array.isArray(hmos) ? hmos.length : 0,
        });
      } catch {
        setStats({ hospitals: 0, hmos: 0 });
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 professional-grid opacity-30 pointer-events-none" />
      <AdminHeader />

      <main className="relative container px-6 py-8 space-y-8">
        {/* Greeting */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">System overview</h1>
          <p className="text-muted-foreground">
            Signed in as{" "}
            <span className="font-medium text-foreground">
              {session?.user?.email ?? "Admin"}
            </span>
          </p>
        </div>

        {/* Stats row */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Hospitals"
            value={stats?.hospitals ?? "—"}
            description="Registered facilities"
            icon={<Building2 className="h-4 w-4" />}
            loading={statsLoading}
          />
          <StatCard
            title="HMOs"
            value={stats?.hmos ?? "—"}
            description="Health maintenance organisations"
            icon={<Activity className="h-4 w-4" />}
            loading={statsLoading}
          />
          <StatCard
            title="Users"
            value="—"
            description="Total user accounts"
            icon={<Users className="h-4 w-4" />}
          />
          <StatCard
            title="Audit logs"
            value="—"
            description="System activity records"
            icon={<FileText className="h-4 w-4" />}
          />
        </div>

        {/* Quick actions */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Quick actions
          </h2>
          <div className="grid gap-5 md:grid-cols-2">
            <ActionCard
              title="Register Hospital"
              description="Onboard a new healthcare facility. All hospital staff will be linked to the registered entity."
              icon={<Building2 className="h-6 w-6 text-blue-600" />}
              accent="bg-blue-50"
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
          </div>
        </div>
      </main>
    </div>
  );
}
