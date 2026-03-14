"use client";

/**
 * System admin dashboard: overview of users, hospitals, HMOs, and system activity.
 * Access restricted to SYSTEM_ADMIN by middleware.
 */
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
  LayoutDashboard,
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";

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
        <div className="flex items-center gap-2">
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
      </div>
    </header>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
}

function StatCard({ title, value, description, icon }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminDashboardPage() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />
      <main className="container px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">
            System overview
          </h1>
          <p className="text-muted-foreground">
            Signed in as {session?.user?.email ?? "Admin"}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Users"
            value="—"
            description="Total user accounts"
            icon={<Users className="h-4 w-4" />}
          />
          <StatCard
            title="Hospitals"
            value="—"
            description="Registered facilities"
            icon={<Building2 className="h-4 w-4" />}
          />
          <StatCard
            title="HMOs"
            value="—"
            description="Health maintenance organizations"
            icon={<Activity className="h-4 w-4" />}
          />
          <StatCard
            title="Audit logs"
            value="—"
            description="System activity"
            icon={<FileText className="h-4 w-4" />}
          />
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LayoutDashboard className="h-5 w-5" />
              Admin actions
            </CardTitle>
            <CardDescription>
              User management, hospital and HMO onboarding, and audit logs can be
              added here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              This dashboard is only accessible to users with the SYSTEM_ADMIN
              role. Extend it with user tables, hospital/HMO CRUD, and audit log
              viewers as needed.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
