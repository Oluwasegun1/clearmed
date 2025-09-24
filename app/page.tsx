"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Shield,
  Zap,
  Clock,
  Users,
  CheckCircle,
  Star,
} from "lucide-react";
import { useState, useEffect } from "react";

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      <div className="fixed inset-0 grid-pattern opacity-30" />

      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-primary/20 rounded-full animate-pulse"
            style={{
              top: `${20 + i * 15}%`,
              left: `${10 + i * 12}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${3 + i * 0.5}s`,
            }}
          />
        ))}
      </div>

      <header className="relative z-50 border-b border-border/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">ClearMed</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex gap-2">
                <Link href="/sidebar-demo">
                  <Button variant="outline" size="sm">
                    Sidebar Demo
                  </Button>
                </Link>
                <Link href="/auth/login">
                  <Button size="sm">
                    Login
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button variant="secondary" size="sm">
                    Register
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        <section className="container mx-auto px-6 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-8 px-4 py-2 text-sm">
              <Star className="w-4 h-4 mr-2" />
              Trusted by 10,000+ healthcare providers
            </Badge>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 text-balance">
              The complete platform to{" "}
              <span className="text-gradient">revolutionize</span> healthcare
              authorization
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto text-pretty leading-relaxed">
              Streamline medical approvals with AI-powered automation. Reduce
              wait times from days to minutes while ensuring compliance and
              security.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link href="/auth/register">
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary/90 px-8 py-6 text-lg"
                >
                  Start Free Trial
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/demo">
                <Button
                  variant="outline"
                  size="lg"
                  className="px-8 py-6 text-lg bg-transparent"
                >
                  Watch Demo
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              {
                value: "98%",
                label: "Approval Rate",
                subtext: "Average processing success",
              },
              {
                value: "2min",
                label: "Average Time",
                subtext: "From submission to approval",
              },
              {
                value: "50k+",
                label: "Processed",
                subtext: "Monthly authorizations",
              },
              {
                value: "24/7",
                label: "Availability",
                subtext: "Always-on system",
              },
            ].map((stat, index) => (
              <Card
                key={index}
                className="glass-card p-6 text-center hover:bg-white/10 transition-all duration-300"
              >
                <div className="text-3xl font-bold text-primary mb-2">
                  {stat.value}
                </div>
                <div className="font-semibold mb-1">{stat.label}</div>
                <div className="text-sm text-muted-foreground">
                  {stat.subtext}
                </div>
              </Card>
            ))}
          </div>
        </section>

        <section className="container mx-auto px-6 py-20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Built for modern healthcare
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Advanced automation meets regulatory compliance in a platform
                designed for the future of medical authorization.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Zap className="w-8 h-8" />,
                  title: "Instant Processing",
                  description:
                    "AI-powered decision engine processes requests in real-time with 98% accuracy.",
                },
                {
                  icon: <Shield className="w-8 h-8" />,
                  title: "Enterprise Security",
                  description:
                    "HIPAA-compliant infrastructure with end-to-end encryption and audit trails.",
                },
                {
                  icon: <Users className="w-8 h-8" />,
                  title: "Seamless Integration",
                  description:
                    "Connect with existing EHR systems and workflows without disruption.",
                },
                {
                  icon: <Clock className="w-8 h-8" />,
                  title: "24/7 Availability",
                  description:
                    "Always-on system ensures authorizations never wait for business hours.",
                },
                {
                  icon: <CheckCircle className="w-8 h-8" />,
                  title: "Smart Validation",
                  description:
                    "Automated compliance checking against the latest medical guidelines.",
                },
                {
                  icon: <Star className="w-8 h-8" />,
                  title: "Provider Portal",
                  description:
                    "Intuitive dashboard for tracking, managing, and analyzing all requests.",
                },
              ].map((feature, index) => (
                <Card
                  key={index}
                  className="glass-card p-8 hover:bg-white/10 transition-all duration-300 group"
                >
                  <div className="text-primary mb-4 group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="container mx-auto px-6 py-20">
          <Card className="glass-card p-12 max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to transform your authorization process?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of healthcare providers who have already
              streamlined their operations with ClearMed.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/register">
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary/90 px-8 py-6 text-lg"
                >
                  Start Your Free Trial
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button
                  variant="outline"
                  size="lg"
                  className="px-8 py-6 text-lg bg-transparent"
                >
                  Contact Sales
                </Button>
              </Link>
            </div>
          </Card>
        </section>
      </main>

      <footer className="border-t border-border/50 mt-20">
        <div className="container mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                <Shield className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">ClearMed</span>
            </div>
            <div className="text-sm text-muted-foreground">
              © 2025 ClearMed. Revolutionizing healthcare authorization.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
