"use client";

import { useState } from "react";
import { HMOSidebarWrapper } from "@/components/sidebars";
import { PersonalSidebarWrapper } from "@/components/sidebars";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Sparkles,
  Layers,
  Smartphone,
  Palette,
  Code2,
  ArrowRight,
  CheckCircle,
  Monitor,
  Users,
  Shield,
} from "lucide-react";

type SidebarType = "hmo" | "personal";

export default function SidebarDemo() {
  const [currentSidebar, setCurrentSidebar] = useState<SidebarType>("hmo");
  const [currentPath, setCurrentPath] = useState("/hmo/dashboard");

  const handleSidebarChange = (type: SidebarType) => {
    setCurrentSidebar(type);
    switch (type) {
      case "hmo":
        setCurrentPath("/hmo/dashboard");
        break;
      case "personal":
        setCurrentPath("/personal/dashboard");
        break;
    }
  };

  const features = [
    {
      icon: <Layers className="h-6 w-6" />,
      title: "Adaptive Architecture",
      description:
        "Intelligent sidebar that adapts to different user roles and contexts with seamless transitions.",
    },
    {
      icon: <Smartphone className="h-6 w-6" />,
      title: "Mobile Excellence",
      description:
        "Responsive design with native mobile interactions, overlay patterns, and touch-optimized navigation.",
    },
    {
      icon: <Palette className="h-6 w-6" />,
      title: "Design System",
      description:
        "Sophisticated glassmorphism effects, gradient accents, and consistent visual language throughout.",
    },
    {
      icon: <Code2 className="h-6 w-6" />,
      title: "Developer Experience",
      description:
        "Clean API, TypeScript support, and modular architecture for easy customization and extension.",
    },
  ];

  const specifications = [
    "Collapsible navigation with smooth animations",
    "Role-based menu customization",
    "Active state management and routing",
    "Glassmorphism visual effects",
    "Mobile-first responsive design",
    "TypeScript and accessibility support",
  ];

  const DemoContent = () => (
    <div className="flex h-full flex-col">
      {/* Hero Section */}
      <div className="demo-hero-gradient border-b border-white/10 px-8 py-12">
        <div className="mx-auto max-w-4xl">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-white/70">
              <Sparkles className="h-4 w-4" />
              ClearMed Component Library
            </div>

            <h1 className="text-5xl font-bold demo-text-gradient leading-tight">
              Revolutionary Sidebar
              <br />
              <span className="demo-accent-gradient">Component System</span>
            </h1>

            <p className="text-xl text-white/60 max-w-2xl mx-auto leading-relaxed">
              Experience the next generation of healthcare navigation
              interfaces. Designed for professionals, built for performance.
            </p>

            <div className="flex items-center justify-center gap-4 pt-4">
              <Button
                variant={currentSidebar === "hmo" ? "default" : "outline"}
                onClick={() => handleSidebarChange("hmo")}
                className="px-6 py-3 text-base font-medium"
              >
                <Shield className="h-4 w-4 mr-2" />
                HMO Portal
              </Button>
              <Button
                variant={currentSidebar === "personal" ? "default" : "outline"}
                onClick={() => handleSidebarChange("personal")}
                className="px-6 py-3 text-base font-medium"
              >
                <Users className="h-4 w-4 mr-2" />
                Patient Portal
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="px-8 py-16 bg-black/20">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              Engineered for Excellence
            </h2>
            <p className="text-white/60 text-lg max-w-2xl mx-auto">
              Every detail crafted to deliver exceptional user experiences in
              healthcare environments.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="demo-feature-card p-6 demo-floating"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-orange-500/20">
                    {feature.icon}
                  </div>
                  <h3 className="font-semibold text-white">{feature.title}</h3>
                </div>
                <p className="text-white/60 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Technical Specifications */}
      <div className="px-8 py-16">
        <div className="mx-auto max-w-4xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-white mb-6">
                Technical Specifications
              </h2>
              <div className="space-y-4">
                {specifications.map((spec, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                    <span className="text-white/70">{spec}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-6 demo-sidebar-preview rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                  <Monitor className="h-5 w-5 text-white/70" />
                  <span className="text-sm font-medium text-white">
                    Current Configuration
                  </span>
                </div>
                <div className="text-xs text-white/50 space-y-1">
                  <div>
                    Portal:{" "}
                    <span className="text-purple-400 capitalize">
                      {currentSidebar}
                    </span>
                  </div>
                  <div>
                    Route:{" "}
                    <span className="text-orange-400">{currentPath}</span>
                  </div>
                  <div>
                    Theme:{" "}
                    <span className="text-white/70">Dark Professional</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="demo-code-block rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10">
                <Code2 className="h-4 w-4 text-white/70" />
                <span className="text-sm font-medium text-white/70">
                  Implementation
                </span>
              </div>
              <pre className="text-xs text-white/80 leading-relaxed overflow-x-auto">
                {`import { ${
                  currentSidebar.charAt(0).toUpperCase() +
                  currentSidebar.slice(1)
                }SidebarWrapper } from '@/components/sidebars'

export default function Layout({ children }) {
  return (
    <${
      currentSidebar.charAt(0).toUpperCase() + currentSidebar.slice(1)
    }SidebarWrapper 
      currentPath="${currentPath}"
    >
      {children}
    </${
      currentSidebar.charAt(0).toUpperCase() + currentSidebar.slice(1)
    }SidebarWrapper>
  )
}`}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="px-8 py-16 border-t border-white/10">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your Interface?
          </h2>
          <p className="text-white/60 mb-8">
            Experience the power of professional healthcare navigation designed
            for modern applications.
          </p>
          <Button size="lg" className="px-8 py-4 text-base font-medium">
            Explore Documentation
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );

  if (currentSidebar === "hmo") {
    return (
      <HMOSidebarWrapper currentPath={currentPath}>
        <DemoContent />
      </HMOSidebarWrapper>
    );
  }

  return (
    <PersonalSidebarWrapper currentPath={currentPath}>
      <DemoContent />
    </PersonalSidebarWrapper>
  );
}
