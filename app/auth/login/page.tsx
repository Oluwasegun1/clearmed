"use client";

import type React from "react";

import { useEffect, useState, useRef } from "react";
import { signIn, signOut } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import toast from "react-hot-toast";
import {
  Shield,
  ArrowRight,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Sparkles,
  User,
  Stethoscope,
  Building2,
  Pill,
  TestTube,
  Building,
  ShieldAlert,
  Zap,
  Check,
  Info,
} from "lucide-react";

interface DemoRole {
  id: string;
  label: string;
  category: string;
  email: string;
  roleCode: string;
  icon: React.ElementType;
  description: string;
  badgeColor: string;
}

const DEMO_ROLES: DemoRole[] = [
  {
    id: "patient",
    label: "Patient",
    category: "Personal Portal",
    email: "patient@example.com",
    roleCode: "PATIENT",
    icon: User,
    description: "Track pre-authorizations & claims",
    badgeColor: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  },
  {
    id: "doctor",
    label: "Doctor",
    category: "Clinical",
    email: "doctor@example.com",
    roleCode: "DOCTOR",
    icon: Stethoscope,
    description: "Create pre-auths & medical requests",
    badgeColor: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  },
  {
    id: "hospital",
    label: "Hospital Admin",
    category: "Facility Ops",
    email: "hospital@example.com",
    roleCode: "HOSPITAL_ADMIN",
    icon: Building2,
    description: "Manage hospital staff & claims",
    badgeColor: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
  },
  {
    id: "pharmacy",
    label: "Pharmacist",
    category: "Dispensing",
    email: "pharmacy@example.com",
    roleCode: "PHARMACY",
    icon: Pill,
    description: "Dispense & verify drug claims",
    badgeColor: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  },
  {
    id: "lab",
    label: "Lab Tech",
    category: "Diagnostics",
    email: "lab@example.com",
    roleCode: "LAB",
    icon: TestTube,
    description: "Upload & process lab tests",
    badgeColor: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  },
  {
    id: "hmo",
    label: "HMO Staff",
    category: "Payer Ops",
    email: "hmo@example.com",
    roleCode: "HMO_STAFF",
    icon: Building,
    description: "Review & approve authorization requests",
    badgeColor: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
  },
  {
    id: "hmo-admin",
    label: "HMO Admin",
    category: "Payer Management",
    email: "hmo-admin@example.com",
    roleCode: "HMO_ADMIN",
    icon: Building,
    description: "Configure plans & manage HMO accounts",
    badgeColor: "bg-teal-500/10 text-teal-500 border-teal-500/20",
  },
  {
    id: "admin",
    label: "System Admin",
    category: "Platform",
    email: "admin@example.com",
    roleCode: "SYSTEM_ADMIN",
    icon: ShieldAlert,
    description: "System logs & user management",
    badgeColor: "bg-rose-500/10 text-rose-500 border-rose-500/20",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered");
  const roleParam = searchParams.get("role");
  const callbackUrl = searchParams.get("callbackUrl") ?? "";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);
  const [selectedDemoRole, setSelectedDemoRole] = useState<string | null>(null);

  // Role-to-dashboard path mapping
  const getRedirectPathForRole = (role: string): string => {
    switch (role) {
      case "PATIENT":
        return "/personal/dashboard";
      case "DOCTOR":
      case "HOSPITAL_ADMIN":
      case "PHARMACY":
      case "LAB":
        return "/hospital/dashboard";
      case "HMO_STAFF":
      case "HMO_ADMIN":
        return "/hmo/dashboard";
      case "SYSTEM_ADMIN":
        return "/admin/dashboard";
      default:
        return "/";
    }
  };

  // Clear any existing session when landing on login so user can sign in as a different role
  const hasClearedSession = useRef(false);
  useEffect(() => {
    if (hasClearedSession.current) return;
    hasClearedSession.current = true;
    signOut({ redirect: false }).catch(() => {});
  }, []);

  // Restore saved email from localStorage if rememberMe was set
  useEffect(() => {
    const savedEmail = localStorage.getItem("clearmed_remember_email");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  // Set default credentials based on role query parameter or preset
  useEffect(() => {
    if (roleParam) {
      const demo = DEMO_ROLES.find(
        (r) => r.id === roleParam || r.roleCode.toLowerCase() === roleParam.toLowerCase()
      );
      if (demo) {
        setEmail(demo.email);
        setPassword("password123");
        setSelectedDemoRole(demo.id);
      }
    }
  }, [roleParam]);

  // Handle demo role pill click
  const selectDemoRole = (role: DemoRole, autoSubmit = false) => {
    setEmail(role.email);
    setPassword("password123");
    setSelectedDemoRole(role.id);
    setError("");
    toast.success(`Loaded credentials for ${role.label}`, { icon: "🔑" });

    if (autoSubmit) {
      performLogin(role.email, "password123");
    }
  };

  // Detect Caps Lock state
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.getModifierState) {
      setIsCapsLockOn(e.getModifierState("CapsLock"));
    }
  };

  const performLogin = async (loginEmail: string, loginPass: string) => {
    setError("");
    setIsLoading(true);

    if (rememberMe && loginEmail) {
      localStorage.setItem("clearmed_remember_email", loginEmail);
    } else {
      localStorage.removeItem("clearmed_remember_email");
    }

    try {
      const result = await signIn("credentials", {
        email: loginEmail,
        password: loginPass,
        redirect: false,
      });

      if (result?.error) {
        toast.error(result.error);
        setError(result.error);
        setIsLoading(false);
        return;
      }

      // Fetch fresh session (no cache)
      const sessionRes = await fetch(`/api/auth/session?t=${Date.now()}`, {
        cache: "no-store",
        credentials: "include",
      });
      const session = await sessionRes.json();
      const userRole = session?.user?.role as string | undefined;

      if (!userRole) {
        toast.error("Session initialization failed. Please try again.");
        setIsLoading(false);
        return;
      }

      toast.success(`Welcome back, ${session.user.name || "User"}!`);

      // Use callbackUrl only if it's a relative path and not auth page
      const isSafeCallback =
        callbackUrl &&
        callbackUrl.startsWith("/") &&
        !callbackUrl.startsWith("/auth/");
      const redirectPath = isSafeCallback
        ? callbackUrl
        : getRedirectPathForRole(userRole);

      router.push(redirectPath);
    } catch {
      setError("An unexpected error occurred. Please try again.");
      toast.error("An unexpected error occurred during sign in.");
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }
    performLogin(email, password);
  };

  const handleSSOClick = (providerName: string) => {
    toast.error(`${providerName} Single Sign-On is managed by your organization's IT Admin.`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden overflow-y-auto relative">
      {/* Background effects */}
      <div className="fixed inset-0 grid-pattern opacity-20 pointer-events-none" />

      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-primary/30 rounded-full animate-pulse"
            style={{
              top: `${20 + i * 15}%`,
              left: `${10 + i * 13}%`,
              animationDelay: `${i * 0.8}s`,
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
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground hidden sm:inline">
                New to ClearMed?
              </span>
              <Link href="/auth/register">
                <Button variant="ghost" size="sm">
                  Create Account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex items-center justify-center min-h-[calc(100vh-80px)] py-12 px-4">
        <div className="w-full max-w-xl">
          {/* Header Section */}
          <div className="text-center mb-8">
            {registered && (
              <Badge
                variant="secondary"
                className="mb-4 px-4 py-2 text-sm bg-emerald-500/10 text-emerald-500 border-emerald-500/20 inline-flex items-center"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Account created successfully! Please sign in.
              </Badge>
            )}

            <div className="flex items-center justify-center mb-4">
              <Badge variant="secondary" className="px-4 py-1.5 text-sm">
                <Sparkles className="w-4 h-4 mr-2 text-primary" />
                Secure Portal Access
              </Badge>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-3 text-balance">
              Sign in to <span className="text-gradient">ClearMed</span>
            </h1>

            <p className="text-base text-muted-foreground max-w-md mx-auto text-pretty">
              Smart prior authorization & health management workspace
            </p>
          </div>

          {/* Quick Demo Role Switcher */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-primary" />
                Quick Demo Sign-In
              </span>
              <span className="text-xs text-muted-foreground">
                Select role to pre-fill
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {DEMO_ROLES.slice(0, 8).map((role) => {
                const IconComponent = role.icon;
                const isSelected = selectedDemoRole === role.id;

                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => selectDemoRole(role, false)}
                    className={`relative p-2.5 rounded-xl border text-left transition-all duration-200 group flex flex-col justify-between ${
                      isSelected
                        ? "bg-primary/10 border-primary shadow-sm ring-1 ring-primary"
                        : "bg-card/60 hover:bg-card border-border/80 hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground group-hover:text-foreground"
                        }`}
                      >
                        <IconComponent className="w-4 h-4" />
                      </div>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-primary" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-foreground truncate">
                        {role.label}
                      </div>
                      <div className="text-[10px] text-muted-foreground truncate">
                        {role.category}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedDemoRole && (
              <div className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/20 flex items-center justify-between animate-fadeIn">
                <div className="flex items-center space-x-2 text-xs">
                  <Info className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-muted-foreground">
                    Selected:{" "}
                    <strong className="text-foreground font-medium">
                      {
                        DEMO_ROLES.find((r) => r.id === selectedDemoRole)
                          ?.label
                      }
                    </strong>{" "}
                    ({email})
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => {
                    const role = DEMO_ROLES.find((r) => r.id === selectedDemoRole);
                    if (role) selectDemoRole(role, true);
                  }}
                  disabled={isLoading}
                  className="h-7 px-3 text-xs bg-primary hover:bg-primary/90"
                >
                  <Zap className="w-3 h-3 mr-1" />
                  Quick Login
                </Button>
              </div>
            )}
          </div>

          {/* Login Form */}
          <Card className="glass-card p-6 md:p-8">
            {error && (
              <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-destructive mb-1 text-sm">
                    Authentication Error
                  </h3>
                  <p className="text-xs text-destructive/90">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-foreground flex items-center justify-between"
                >
                  <span>Email Address</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setSelectedDemoRole(null);
                    }}
                    className="w-full pl-10 pr-4 py-3 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 text-foreground placeholder:text-muted-foreground text-sm"
                    placeholder="name@organization.com"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="text-sm font-medium text-foreground"
                  >
                    Password
                  </label>
                  {isCapsLockOn && (
                    <span className="text-xs text-amber-500 font-medium flex items-center gap-1 animate-pulse">
                      <AlertCircle className="w-3 h-3" /> Caps Lock is ON
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onKeyUp={handleKeyDown}
                    className="w-full pl-10 pr-12 py-3 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 text-foreground placeholder:text-muted-foreground text-sm"
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center space-x-2">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary focus:ring-2 bg-input accent-primary cursor-pointer"
                  />
                  <label
                    htmlFor="remember-me"
                    className="text-xs text-muted-foreground cursor-pointer select-none"
                  >
                    Remember my email
                  </label>
                </div>

                <Link
                  href="/auth/forgot-password"
                  className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 text-base font-semibold bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    <span>Signing you in...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </Button>

              {/* Divider */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/50" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-3 text-muted-foreground font-medium">
                    Enterprise SSO
                  </span>
                </div>
              </div>

              {/* Social / Enterprise Login Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => handleSSOClick("Google Workspace")}
                  className="py-2.5 bg-card/50 hover:bg-card border-border text-xs"
                >
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Google SSO
                </Button>
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => handleSSOClick("Microsoft Entra ID")}
                  className="py-2.5 bg-card/50 hover:bg-card border-border text-xs"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="#00A4EF"
                    viewBox="0 0 24 24"
                  >
                    <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z" />
                  </svg>
                  Microsoft SSO
                </Button>
              </div>
            </form>
          </Card>

          {/* Footer */}
          <div className="text-center mt-8 space-y-4">
            <p className="text-sm text-muted-foreground">
              Don&apos;t have an account yet?{" "}
              <Link
                href="/auth/register"
                className="text-primary hover:text-primary/80 font-medium underline-offset-4 hover:underline"
              >
                Register your organization
              </Link>
            </p>

            <div className="flex items-center justify-center space-x-6 text-xs text-muted-foreground">
              <Link
                href="/terms"
                className="hover:text-foreground transition-colors"
              >
                Terms of Service
              </Link>
              <span>•</span>
              <Link
                href="/privacy"
                className="hover:text-foreground transition-colors"
              >
                Privacy Policy
              </Link>
              <span>•</span>
              <Link
                href="/contact"
                className="hover:text-foreground transition-colors"
              >
                Support
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
