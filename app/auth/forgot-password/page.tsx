"use client";

import type React from "react";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import toast from "react-hot-toast";
import {
  Shield,
  ArrowRight,
  Mail,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  KeyRound,
  RefreshCw,
} from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setIsLoading(true);

    try {
      // Simulate API call for password reset email
      await new Promise((resolve) => setTimeout(resolve, 1200));

      setIsSubmitted(true);
      toast.success("Password reset instructions sent to your email!");
      startCooldown();
    } catch {
      setError("Failed to send reset link. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const startCooldown = () => {
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setIsLoading(true);
    setError("");

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("A new password reset link has been sent!");
      startCooldown();
    } catch {
      setError("Failed to resend email. Please try again.");
    } finally {
      setIsLoading(false);
    }
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
              <Link href="/auth/login">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex items-center justify-center min-h-[calc(100vh-80px)] py-12 px-4">
        <div className="w-full max-w-lg">
          {/* Header Section */}
          <div className="text-center mb-10">
            <div className="flex items-center justify-center mb-6">
              <Badge variant="secondary" className="px-4 py-2 text-sm">
                <KeyRound className="w-4 h-4 mr-2" />
                Account Recovery
              </Badge>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-balance">
              Reset your <span className="text-gradient">Password</span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-md mx-auto text-pretty">
              {isSubmitted
                ? "Check your inbox for reset instructions"
                : "Enter your registered email address to receive password reset instructions"}
            </p>
          </div>

          {/* Form Card */}
          <Card className="glass-card p-8 md:p-10">
            {error && (
              <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-destructive mb-1">
                    Error
                  </h3>
                  <p className="text-sm text-destructive/80">{error}</p>
                </div>
              </div>
            )}

            {!isSubmitted ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="text-sm font-medium text-foreground"
                  >
                    Email Address
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
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 text-foreground placeholder:text-muted-foreground"
                      placeholder="Enter your registered email"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 text-lg font-semibold bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      <span>Sending reset link...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span>Send Reset Link</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  )}
                </Button>
              </form>
            ) : (
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
                  <CheckCircle className="w-8 h-8 text-primary" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-foreground">
                    Reset Link Sent
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    We sent a password reset link to{" "}
                    <span className="font-semibold text-foreground">{email}</span>.
                    Please check your inbox and follow the instructions.
                  </p>
                </div>

                <div className="pt-4 border-t border-border/50 flex flex-col items-center space-y-3">
                  <Button
                    variant="outline"
                    onClick={handleResend}
                    disabled={isLoading || resendCooldown > 0}
                    className="w-full"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    {resendCooldown > 0
                      ? `Resend available in ${resendCooldown}s`
                      : "Resend Email"}
                  </Button>

                  <Link href="/auth/login" className="w-full">
                    <Button variant="ghost" className="w-full">
                      Return to Sign In
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </Card>

          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-sm text-muted-foreground">
              Remembered your password?{" "}
              <Link
                href="/auth/login"
                className="text-primary hover:text-primary/80 font-medium"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
