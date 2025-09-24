"use client";

import {
  Sidebar,
  SidebarProvider,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarToggle,
  SidebarNav,
  SidebarNavItem,
  SidebarGroup,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Building2,
  FileText,
  BarChart3,
  Settings,
  Bell,
  CreditCard,
  Shield,
  UserCheck,
  AlertTriangle,
  ClipboardCheck,
  ClipboardList,
  ChartBar,
  Hospital,
  UserRound,
} from "lucide-react";

interface HMOSidebarProps {
  currentPath?: string;
}

export function HMOSidebar({ currentPath }: HMOSidebarProps) {
  const { isCollapsed } = useSidebar();

  const navigationItems = [
    {
      title: "Overview",
      items: [
        {
          title: "Dashboard",
          href: "/hmo/dashboard",
          icon: <BarChart3 className="h-4 w-4" />,
        },
        {
          title: "Reports & Analytics",
          href: "/hmo/analytics",
          icon: <ChartBar className="h-4 w-4" />,
        },
      ],
    },
    {
      title: "Requests",
      items: [
        {
          title: "Pending Requests",
          href: "/hmo/requests/pending",
          icon: <ClipboardCheck className="h-4 w-4" />,
        },
        {
          title: "All Requests",
          href: "/hmo/requests/all",
          icon: <ClipboardList className="h-4 w-4" />,
        },
        {
          title: "Fraud Detection",
          href: "/hmo/fraud-detection",
          icon: <AlertTriangle className="h-4 w-4" />,
        },
      ],
    },
    {
      title: "Management",
      items: [
        {
          title: "Hospital Management",
          href: "/hmo/hospitals",
          icon: <Hospital className="h-4 w-4" />,
        },
        {
          title: "Patient Management",
          href: "/hmo/patients",
          icon: <UserRound className="h-4 w-4" />,
        },
        {
          title: "Providers",
          href: "/hmo/providers",
          icon: <UserCheck className="h-4 w-4" />,
        },
      ],
    },
    {
      title: "Operations",
      items: [
        {
          title: "Claims",
          href: "/hmo/claims",
          icon: <FileText className="h-4 w-4" />,
        },
        {
          title: "Payments",
          href: "/hmo/payments",
          icon: <CreditCard className="h-4 w-4" />,
        },
        {
          title: "Compliance",
          href: "/hmo/compliance",
          icon: <Shield className="h-4 w-4" />,
        },
      ],
    },
  ];

  return (
    <Sidebar>
      <SidebarHeader>
        {!isCollapsed ? (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Building2 className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold">ClearMed HMO</span>
              <span className="text-xs text-muted-foreground">
                Health Management
              </span>
            </div>
          </div>
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Building2 className="h-4 w-4" />
          </div>
        )}
        <SidebarToggle />
      </SidebarHeader>

      <SidebarContent>
        <SidebarNav>
          {navigationItems.map((group) => (
            <SidebarGroup key={group.title} title={group.title}>
              {group.items.map((item) => (
                <SidebarNavItem
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  isActive={currentPath === item.href}
                >
                  {item.title}
                </SidebarNavItem>
              ))}
            </SidebarGroup>
          ))}
        </SidebarNav>
      </SidebarContent>

      <SidebarFooter>
        <SidebarNav>
          <SidebarNavItem
            href="/hmo/notifications"
            icon={<Bell className="h-4 w-4" />}
            isActive={currentPath === "/hmo/notifications"}
          >
            Notifications
          </SidebarNavItem>
          <SidebarNavItem
            href="/hmo/settings"
            icon={<Settings className="h-4 w-4" />}
            isActive={currentPath === "/hmo/settings"}
          >
            Settings
          </SidebarNavItem>
        </SidebarNav>
      </SidebarFooter>
    </Sidebar>
  );
}

export function HMOSidebarWrapper({
  children,
  currentPath,
}: {
  children: React.ReactNode;
  currentPath?: string;
}) {
  return (
    <SidebarProvider>
      <div className="flex h-screen">
        <HMOSidebar currentPath={currentPath} />
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </SidebarProvider>
  );
}
