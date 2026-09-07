import Link from "next/link";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileCheck2,
  Hospital,
  LockKeyhole,
  Menu,
  ShieldCheck,
  Stethoscope,
  UserRound,
  WalletCards,
  X,
  Activity,
  ClipboardCheck,
  Sparkles,
  Star,
  TrendingUp,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">

      {/* ── Layered ambient background ── */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        {/* Radial glow top-centre */}
        <div className="absolute left-1/2 top-0 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-primary/8 blur-[120px]" />
        {/* Secondary accent glow bottom-right */}
        <div className="absolute -bottom-32 -right-32 h-[500px] w-[500px] rounded-full bg-accent/6 blur-[100px]" />
        {/* Fine grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.3)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.3)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_80%_70%_at_50%_0%,black_30%,transparent_100%)]" />
      </div>

      {/* ═══════════════════════════ NAVBAR ═══════════════════════════ */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/70 backdrop-blur-2xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-8">

          {/* Logo */}
          <Link href="/" className="group flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20 transition-shadow group-hover:shadow-lg group-hover:shadow-primary/30">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold tracking-tight">ClearMed</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-1 md:flex">
            {[
              { href: "#how-it-works", label: "How it works" },
              { href: "#solutions", label: "Solutions" },
              { href: "#coverage", label: "Coverage" },
              { href: "#security", label: "Security" },
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-md px-4 py-2 text-sm text-muted-foreground transition-all hover:bg-muted/60 hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <ThemeToggle iconOnly />
            <Link href="/auth/login" className="hidden sm:block">
              <Button variant="ghost" size="sm" className="h-9 px-4 text-sm">
                Log in
              </Button>
            </Link>
            <Link href="/auth/register">
              <Button size="sm" className="h-9 gap-1.5 px-4 shadow-sm shadow-primary/20">
                Get started
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
            <Button variant="ghost" size="icon" className="h-9 w-9 md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main>

        {/* ═══════════════════════════ HERO ═══════════════════════════ */}
        <section className="relative overflow-hidden pt-14 pb-20 md:pt-20 md:pb-28">
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-6 lg:grid-cols-[1fr_1fr] lg:gap-16 lg:px-8">

            {/* Left: copy */}
            <div className="max-w-2xl">
              {/* Pill badge */}
              <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-xs font-medium text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Healthcare authorization, simplified
              </div>

              <h1 className="text-balance text-5xl font-semibold leading-[1.06] tracking-[-0.04em] sm:text-6xl lg:text-[68px]">
                Healthcare{" "}
                <span className="relative">
                  <span className="demo-accent-gradient">authorization</span>
                </span>{" "}
                without the back-and-forth.
              </h1>

              <p className="mt-6 max-w-lg text-pretty text-lg leading-8 text-muted-foreground">
                ClearMed connects patients, providers and HMOs in one secure
                platform — submit, track, approve and manage healthcare
                authorizations in minutes, not days.
              </p>

              {/* CTAs */}
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link href="/auth/register">
                  <Button size="lg" className="h-12 w-full gap-2 px-7 shadow-lg shadow-primary/20 sm:w-auto">
                    Get started free
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <a href="#how-it-works">
                  <Button size="lg" variant="outline" className="h-12 w-full px-7 sm:w-auto">
                    See how it works
                  </Button>
                </a>
              </div>

              {/* Trust micro-chips */}
              <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2.5">
                {[
                  "Encrypted at rest",
                  "Role-based access",
                  "Real-time tracking",
                  "Audit logs",
                ].map((t) => (
                  <span key={t} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-primary" />
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Right: floating product card */}
            <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
              {/* Glow behind card */}
              <div className="absolute -inset-6 rounded-[2.5rem] bg-primary/10 blur-3xl" />
              <div className="demo-floating">
                <ProductPreviewCard />
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════ STATS STRIP ═══════════════════════ */}
        <section className="border-y border-border/60 bg-muted/20">
          <div className="mx-auto max-w-6xl">
            <div className="grid grid-cols-2 divide-x divide-border/50 md:grid-cols-4">
              {[
                { icon: <TrendingUp className="h-5 w-5" />, value: "98%", label: "Approval rate", sub: "avg. processing success" },
                { icon: <Clock3 className="h-5 w-5" />, value: "< 3 min", label: "Decision time", sub: "from submission" },
                { icon: <Zap className="h-5 w-5" />, value: "50k+", label: "Monthly requests", sub: "processed" },
                { icon: <Star className="h-5 w-5" />, value: "24 / 7", label: "Always available", sub: "round the clock" },
              ].map((s) => (
                <div key={s.label} className="flex flex-col items-center justify-center gap-1 px-6 py-8 text-center">
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    {s.icon}
                  </div>
                  <span className="text-3xl font-semibold tracking-tight">{s.value}</span>
                  <span className="text-sm font-medium">{s.label}</span>
                  <span className="text-xs text-muted-foreground">{s.sub}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════ HOW IT WORKS ═══════════════════════ */}
        <section id="how-it-works" className="scroll-mt-20 py-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">

            <SectionLabel>How ClearMed works</SectionLabel>

            <div className="mt-4 max-w-2xl">
              <h2 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
                From request to care,{" "}
                <span className="text-muted-foreground font-normal">without the chaos.</span>
              </h2>
              <p className="mt-5 text-lg leading-8 text-muted-foreground">
                One connected workflow keeps every party informed at every
                stage of the authorization process.
              </p>
            </div>

            {/* Steps with connector line */}
            <div className="relative mt-16">
              {/* Connector line (desktop only) */}
              <div className="pointer-events-none absolute left-0 right-0 top-[52px] hidden h-px bg-gradient-to-r from-transparent via-border to-transparent md:block" />

              <div className="grid gap-5 md:grid-cols-5">
                {[
                  {
                    n: "01", icon: <FileCheck2 className="h-5 w-5" />, title: "Request",
                    desc: "A provider creates an authorization with services, costs and supporting information.",
                  },
                  {
                    n: "02", icon: <Hospital className="h-5 w-5" />, title: "Review",
                    desc: "The HMO receives and reviews the request and each service within it.",
                  },
                  {
                    n: "03", icon: <ClipboardCheck className="h-5 w-5" />, title: "Decision",
                    desc: "Services are individually approved, rejected or flagged for more information.",
                  },
                  {
                    n: "04", icon: <CheckCircle2 className="h-5 w-5" />, title: "Fulfillment",
                    desc: "Approved services are confirmed when care is actually delivered.",
                  },
                  {
                    n: "05", icon: <Activity className="h-5 w-5" />, title: "Coverage updated",
                    desc: "Completed services automatically update patient coverage utilisation.",
                  },
                ].map((step) => (
                  <div key={step.n} className="group relative">
                    {/* Number + icon bubble */}
                    <div className="relative z-10 mb-6 flex flex-col items-start gap-3 md:items-center">
                      <span className="text-xs font-semibold tracking-[0.15em] text-muted-foreground/60">
                        {step.n}
                      </span>
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-card shadow-sm text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-md group-hover:shadow-primary/20">
                        {step.icon}
                      </div>
                    </div>
                    <div className="md:text-center">
                      <h3 className="font-semibold">{step.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════ SOLUTIONS ═══════════════════════ */}
        <section id="solutions" className="scroll-mt-20 border-y border-border/60 bg-muted/20 py-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">

            <div className="flex flex-col gap-12 lg:flex-row lg:gap-20">

              {/* Left sticky text */}
              <div className="max-w-sm lg:sticky lg:top-24 lg:self-start">
                <SectionLabel>One platform</SectionLabel>
                <h2 className="mt-4 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
                  Built around the people who make healthcare happen.
                </h2>
                <p className="mt-5 text-lg leading-8 text-muted-foreground">
                  Each participant gets the tools and information relevant to
                  their role — nothing more, nothing less.
                </p>
                <Link href="/auth/register" className="mt-8 inline-block">
                  <Button className="gap-2">
                    Get started
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>

              {/* Right stacked cards */}
              <div className="flex flex-1 flex-col gap-5">
                {[
                  {
                    icon: <UserRound className="h-5 w-5" />,
                    label: "For patients",
                    color: "text-blue-500",
                    bg: "bg-blue-500/10",
                    title: "Know exactly where you stand.",
                    description: "See your healthcare coverage, track authorizations and understand the status of every requested service — in real time.",
                    items: ["View coverage and limits", "Track all authorization requests", "See approval and rejection status", "Full authorization history"],
                  },
                  {
                    icon: <Stethoscope className="h-5 w-5" />,
                    label: "For providers",
                    color: "text-emerald-500",
                    bg: "bg-emerald-500/10",
                    title: "Spend less time chasing approvals.",
                    description: "Create authorization requests, attach supporting information and follow every HMO decision from one place.",
                    items: ["Create authorization requests", "Attach supporting documents", "Track HMO decisions", "Manage all authorization activity"],
                  },
                  {
                    icon: <Hospital className="h-5 w-5" />,
                    label: "For HMOs",
                    color: "text-violet-500",
                    bg: "bg-violet-500/10",
                    title: "Make decisions with full clarity.",
                    description: "Review requests, assess individual services and manage coverage decisions in a structured, organized queue.",
                    items: ["Manage authorization queues", "Review coverage information", "Approve or reject services", "Request additional information"],
                  },
                ].map((s) => (
                  <Card key={s.label} className="group overflow-hidden rounded-2xl border-border/70 p-7 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/5">
                    <div className="flex items-start gap-5">
                      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${s.bg} ${s.color} transition-transform group-hover:scale-110`}>
                        {s.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs font-semibold uppercase tracking-widest ${s.color}`}>{s.label}</p>
                        <h3 className="mt-1.5 text-xl font-semibold tracking-tight">{s.title}</h3>
                        <p className="mt-2.5 text-sm leading-6 text-muted-foreground">{s.description}</p>
                        <div className="mt-5 grid grid-cols-1 gap-2 border-t border-border/60 pt-5 sm:grid-cols-2">
                          {s.items.map((item) => (
                            <div key={item} className="flex items-center gap-2 text-sm">
                              <Check className={`h-4 w-4 shrink-0 ${s.color}`} />
                              {item}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════ COVERAGE ═══════════════════════ */}
        <section id="coverage" className="scroll-mt-20 py-24">
          <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 sm:px-6 lg:grid-cols-2 lg:gap-20 lg:px-8">

            <div>
              <SectionLabel>Coverage visibility</SectionLabel>
              <h2 className="mt-4 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
                Healthcare coverage you can{" "}
                <em className="not-italic text-primary">actually understand.</em>
              </h2>
              <p className="mt-6 text-lg leading-8 text-muted-foreground">
                Patients get visibility into their plan, coverage percentage,
                annual limit, amount used and remaining balance — all in one
                simple view.
              </p>

              <div className="mt-8 space-y-3.5">
                {[
                  "See your HMO and active coverage plan",
                  "Understand your annual coverage limit",
                  "Track completed services against coverage",
                  "Follow all authorization activity in one place",
                ].map((t) => (
                  <div key={t} className="flex items-center gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Check className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="text-sm font-medium">{t}</span>
                  </div>
                ))}
              </div>

              <div className="mt-10">
                <Link href="/auth/register">
                  <Button variant="outline" className="gap-2">
                    View your coverage
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Coverage preview card */}
            <div className="relative">
              <div className="absolute -inset-4 rounded-[2rem] bg-primary/8 blur-3xl" />
              <Card className="relative overflow-hidden rounded-2xl border-border/60 shadow-2xl shadow-black/10">
                {/* Card header */}
                <div className="flex items-center justify-between border-b border-border/60 bg-muted/30 px-6 py-5">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Coverage plan</p>
                    <h3 className="mt-1 text-lg font-semibold">Premium Health Plan</h3>
                  </div>
                  <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400">
                    <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Active
                  </Badge>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Annual limit", value: "₦2,000,000", highlight: false },
                      { label: "Coverage", value: "90%", highlight: false },
                      { label: "Amount used", value: "₦650,000", highlight: false },
                      { label: "Remaining", value: "₦1,350,000", highlight: true },
                    ].map((s) => (
                      <div key={s.label} className={`rounded-xl border p-4 ${s.highlight ? "border-primary/30 bg-primary/5" : "bg-muted/20"}`}>
                        <p className="text-xs text-muted-foreground">{s.label}</p>
                        <p className={`mt-2 text-lg font-semibold ${s.highlight ? "text-primary" : ""}`}>{s.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Progress */}
                  <div className="mt-6">
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Coverage utilized</span>
                      <span className="font-semibold">32.5%</span>
                    </div>
                    <div className="relative h-3 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70"
                        style={{ width: "32.5%" }}
                      />
                    </div>
                    <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
                      <span>₦0</span>
                      <span>₦2,000,000</span>
                    </div>
                  </div>

                  {/* Info pill */}
                  <div className="mt-5 flex items-start gap-3 rounded-xl border border-border/60 bg-muted/20 p-4">
                    <WalletCards className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <div>
                      <p className="text-sm font-medium">Coverage at a glance</p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        Completed services update your utilisation so you always
                        know what remains available.
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* ═══════════════════════ SECURITY ═══════════════════════ */}
        <section id="security" className="scroll-mt-20 border-y border-border/60 bg-muted/20 py-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <SectionLabel centered>Security & privacy</SectionLabel>
              <h2 className="mt-4 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
                Built with healthcare privacy in mind.
              </h2>
              <p className="mt-5 text-lg leading-8 text-muted-foreground">
                Sensitive healthcare data deserves strong access controls,
                encryption and full accountability.
              </p>
            </div>

            <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  icon: <ShieldCheck className="h-6 w-6" />,
                  title: "Role-based access",
                  desc: "Users only see and do what their role permits. Nothing more.",
                },
                {
                  icon: <LockKeyhole className="h-6 w-6" />,
                  title: "Secure authentication",
                  desc: "Protected sessions with additional authentication for staff roles.",
                },
                {
                  icon: <ClipboardCheck className="h-6 w-6" />,
                  title: "Audit trails",
                  desc: "Every significant system action is logged for full accountability.",
                },
                {
                  icon: <Hospital className="h-6 w-6" />,
                  title: "Privacy by design",
                  desc: "Controlled access to sensitive patient information from the ground up.",
                },
              ].map((s) => (
                <Card key={s.title} className="group rounded-2xl p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-md group-hover:shadow-primary/20">
                    {s.icon}
                  </div>
                  <h3 className="font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{s.desc}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════ TESTIMONIALS ═══════════════════════ */}
        <section className="py-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <SectionLabel centered>Trusted by healthcare teams</SectionLabel>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                What people are saying
              </h2>
            </div>
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  quote: "Authorization decisions that used to take three days now happen the same morning. ClearMed changed how we operate.",
                  name: "Dr. Amara Osei",
                  role: "Medical Director, Lagos General Hospital",
                  initials: "AO",
                  color: "bg-blue-500",
                },
                {
                  quote: "Our patients actually understand their coverage now. The visibility ClearMed gives them has reduced confusion and complaints dramatically.",
                  name: "Fatima Al-Hassan",
                  role: "Benefits Manager, XYZ Health HMO",
                  initials: "FA",
                  color: "bg-violet-500",
                },
                {
                  quote: "I can finally see what my HMO approved and why a service was rejected — all in one place, without calling anyone.",
                  name: "Emmanuel Okafor",
                  role: "Patient",
                  initials: "EO",
                  color: "bg-emerald-500",
                },
              ].map((t) => (
                <Card key={t.name} className="flex flex-col rounded-2xl p-7">
                  <div className="mb-4 flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <blockquote className="flex-1 text-sm leading-7 text-muted-foreground">
                    &ldquo;{t.quote}&rdquo;
                  </blockquote>
                  <div className="mt-6 flex items-center gap-3 border-t border-border/60 pt-5">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${t.color} text-xs font-semibold text-white`}>
                      {t.initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════ FINAL CTA ═══════════════════════ */}
        <section className="pb-24 pt-4">
          <div className="mx-auto max-w-5xl px-5 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-3xl bg-primary px-8 py-16 text-primary-foreground shadow-2xl shadow-primary/20 sm:px-14 sm:py-20">
              {/* Decorative blurs */}
              <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
              <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-black/10 blur-3xl" />
              {/* Fine grid overlay */}
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,white/5_1px,transparent_1px),linear-gradient(to_bottom,white/5_1px,transparent_1px)] bg-[size:48px_48px]" />

              <div className="relative mx-auto max-w-3xl text-center">
                <Badge className="mb-6 border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20">
                  Start today — it&apos;s free
                </Badge>
                <h2 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
                  Move healthcare authorization forward.
                </h2>
                <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-primary-foreground/75">
                  Bring patients, providers and HMOs into one clearer, faster,
                  connected authorization workflow.
                </p>
                <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
                  <Link href="/auth/register">
                    <Button size="lg" variant="secondary" className="h-12 w-full gap-2 px-8 sm:w-auto font-semibold">
                      Get started free
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/auth/login">
                    <Button
                      size="lg"
                      variant="outline"
                      className="h-12 w-full border-primary-foreground/25 bg-transparent px-8 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground sm:w-auto"
                    >
                      Log in
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ═══════════════════════ FOOTER ═══════════════════════ */}
      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-12 sm:px-6 md:flex-row md:items-start md:justify-between lg:px-8">

          {/* Brand */}
          <div className="max-w-[220px]">
            <Link href="/" className="group flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <span className="font-semibold">ClearMed</span>
            </Link>
            <p className="mt-3 text-xs leading-5 text-muted-foreground">
              The connected platform for healthcare authorization between
              patients, providers and HMOs.
            </p>
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            <FooterCol title="Product" links={[
              { href: "#how-it-works", label: "How it works" },
              { href: "#solutions", label: "Solutions" },
              { href: "#coverage", label: "Coverage" },
              { href: "#security", label: "Security" },
            ]} />
            <FooterCol title="Platform" links={[
              { href: "/auth/register", label: "Get started" },
              { href: "/auth/login", label: "Log in" },
            ]} />
          </div>
        </div>

        <div className="border-t border-border/40 py-5">
          <p className="text-center text-xs text-muted-foreground">
            © 2026 ClearMed. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

/* ════════════════════════════════════════════════
   SUB-COMPONENTS
════════════════════════════════════════════════ */

function SectionLabel({ children, centered = false }: { children: React.ReactNode; centered?: boolean }) {
  return (
    <div className={`inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary ${centered ? "mx-auto" : ""}`}>
      <Sparkles className="h-3 w-3" />
      {children}
    </div>
  );
}

function FooterCol({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <h4 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">{title}</h4>
      <ul className="space-y-2.5">
        {links.map((l) => (
          <li key={l.href}>
            <a href={l.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ProductPreviewCard() {
  return (
    <Card className="overflow-hidden rounded-2xl border-border/60 bg-card/95 shadow-2xl shadow-black/20">
      {/* Browser chrome */}
      <div className="flex items-center justify-between border-b border-border/60 bg-muted/40 px-5 py-3">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/60" />
        </div>
        <div className="flex items-center gap-1.5 rounded-md border border-border/50 bg-background/40 px-3 py-1 text-[10px] text-muted-foreground">
          <ShieldCheck className="h-2.5 w-2.5 text-primary" />
          app.clearmed.io
        </div>
        <div className="w-16" />
      </div>

      <div className="p-5 sm:p-6">
        {/* Request header */}
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Authorization request</p>
            <h3 className="mt-1 text-base font-semibold">#CLM-000123</h3>
          </div>
          <Badge className="shrink-0 bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400 text-[11px]">
            Partially approved
          </Badge>
        </div>

        {/* Patient / HMO */}
        <div className="mb-4 grid grid-cols-2 gap-3 rounded-xl border border-border/60 bg-muted/20 p-4">
          <div>
            <p className="text-[11px] text-muted-foreground">Patient</p>
            <p className="mt-1 text-sm font-semibold">John Doe</p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">HMO</p>
            <p className="mt-1 text-sm font-semibold">XYZ Health</p>
          </div>
        </div>

        {/* Service rows */}
        <div className="space-y-2.5">
          <ServiceRow icon={<Stethoscope className="h-3.5 w-3.5" />} title="Consultation" amount="₦20,000" type="approved" />
          <ServiceRow icon={<Activity className="h-3.5 w-3.5" />} title="Blood Test" amount="₦30,000" type="approved" />
          <ServiceRow icon={<X className="h-3.5 w-3.5" />} title="X-Ray Imaging" amount="₦100,000" type="rejected" />
        </div>

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock3 className="h-3.5 w-3.5" />
            Updated today at 10:42 AM
          </div>
          <Button variant="outline" size="sm" className="h-7 px-3 text-xs">
            View details
          </Button>
        </div>
      </div>
    </Card>
  );
}

function ServiceRow({
  icon,
  title,
  amount,
  type,
}: {
  icon: React.ReactNode;
  title: string;
  amount: string;
  type: "approved" | "rejected";
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-background p-3">
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs ${type === "approved" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/10 text-rose-600 dark:text-rose-400"}`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{amount}</p>
      </div>
      <Badge
        variant="outline"
        className={`text-[10px] shrink-0 ${type === "approved" ? "border-emerald-500/25 bg-emerald-500/8 text-emerald-600 dark:text-emerald-400" : "border-rose-500/25 bg-rose-500/8 text-rose-600 dark:text-rose-400"}`}
      >
        {type === "approved" ? "Approved" : "Rejected"}
      </Badge>
    </div>
  );
}
