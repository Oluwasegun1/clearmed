"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  FileQuestion,
  Home,
  ArrowLeft,
  Sparkles,
  Compass,
  LifeBuoy,
  LayoutDashboard,
  Activity,
} from "lucide-react";

export default function NotFound() {
  const router = useRouter();
  const { data: session } = useSession();

  // Determine dashboard redirect based on logged-in user role
  const getDashboardPath = () => {
    if (!session?.user?.role) return "/";
    const role = session.user.role as string;
    if (role === "PATIENT") return "/personal/dashboard";
    if (
      role === "DOCTOR" ||
      role === "HOSPITAL_ADMIN" ||
      role === "PHARMACY" ||
      role === "LAB"
    )
      return "/hospital/dashboard";
    if (role.startsWith("HMO_")) return "/hmo/dashboard";
    if (role === "SYSTEM_ADMIN") return "/admin/dashboard";
    return "/";
  };

  const dashboardPath = getDashboardPath();

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden overflow-y-auto relative flex flex-col justify-between">
      {/* Background effects */}
      <div className="fixed inset-0 grid-pattern opacity-20 pointer-events-none" />

      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1.5 h-1.5 bg-primary/30 rounded-full animate-pulse"
            style={{
              top: `${20 + i * 14}%`,
              left: `${12 + i * 14}%`,
              animationDelay: `${i * 0.7}s`,
              animationDuration: `${2.5 + i * 0.4}s`,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <header className="relative z-50 border-b border-border/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">ClearMed</span>
            </Link>
            <div className="flex items-center space-x-3">
              {session?.user ? (
                <Link href={dashboardPath}>
                  <Button variant="outline" size="sm">
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    My Dashboard
                  </Button>
                </Link>
              ) : (
                <Link href="/auth/login">
                  <Button variant="default" size="sm">
                    Sign In
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center py-16 px-4">
        <div className="w-full max-w-xl text-center">
          {/* Badge & Graphic */}
          <div className="relative inline-flex items-center justify-center mb-6">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
            <div className="w-24 h-24 bg-card/80 border border-border/80 rounded-2xl flex items-center justify-center shadow-xl backdrop-blur-md relative">
              <FileQuestion className="w-12 h-12 text-primary" />
            </div>
          </div>

          <div className="mb-4">
            <Badge variant="secondary" className="px-4 py-1.5 text-xs font-semibold bg-primary/10 text-primary border-primary/20">
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              404 • Page Under Development
            </Badge>
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight text-balance">
            Page Not Found or <span className="text-gradient">Under Construction</span>
          </h1>

          <p className="text-base md:text-lg text-muted-foreground max-w-md mx-auto mb-8 text-pretty leading-relaxed">
            The requested feature or route is either not developed yet or has been moved. We&apos;re continuously building new capabilities into ClearMed.
          </p>

          {/* Card with Quick Actions */}
          <Card className="glass-card p-6 md:p-8 mb-8 text-left space-y-6">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-primary" />
              Quick Navigation Options
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => router.back()}
                className="w-full justify-start py-6 bg-card/50 hover:bg-card border-border/80"
              >
                <ArrowLeft className="w-4 h-4 mr-3 text-primary" />
                <div className="text-left">
                  <div className="font-semibold text-sm">Go Back</div>
                  <div className="text-[11px] text-muted-foreground">Return to previous page</div>
                </div>
              </Button>

              <Link href={dashboardPath} className="w-full">
                <Button
                  variant="outline"
                  className="w-full justify-start py-6 bg-card/50 hover:bg-card border-border/80"
                >
                  <LayoutDashboard className="w-4 h-4 mr-3 text-primary" />
                  <div className="text-left">
                    <div className="font-semibold text-sm">Dashboard</div>
                    <div className="text-[11px] text-muted-foreground">Go to your workspace</div>
                  </div>
                </Button>
              </Link>
            </div>

            <div className="pt-4 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-500" />
                ClearMed System Status: Normal
              </span>
              <Link
                href="/contact"
                className="text-primary hover:underline flex items-center gap-1"
              >
                <LifeBuoy className="w-3.5 h-3.5" />
                Need help? Contact support
              </Link>
            </div>
          </Card>

          {/* Footer Action */}
          <div>
            <Link href="/">
              <Button size="lg" className="bg-primary hover:bg-primary/90 px-8">
                <Home className="w-4 h-4 mr-2" />
                Return to Home Page
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-50 border-t border-border/50 backdrop-blur-sm py-4 text-center text-xs text-muted-foreground">
        <div className="container mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; {new Date().getFullYear()} ClearMed Healthcare. All rights reserved.</span>
          <div className="flex items-center space-x-4">
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link href="/contact" className="hover:text-foreground transition-colors">
              Support
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
