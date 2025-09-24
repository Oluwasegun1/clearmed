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
  User,
  Heart,
  Calendar,
  FileText,
  Pill,
  Activity,
  Bell,
  CreditCard,
  Shield,
  Phone,
  MapPin,
  PlusCircle,
  ClipboardList,
  UserCog,
} from "lucide-react";

interface PersonalSidebarProps {
  currentPath?: string;
}

export function PersonalSidebar({ currentPath }: PersonalSidebarProps) {
  const { isCollapsed } = useSidebar();

  const navigationItems = [
    {
      title: "Health Overview",
      items: [
        {
          title: "Dashboard",
          href: "/personal/dashboard",
          icon: <Activity className="h-4 w-4" />,
        },
        {
          title: "Make a Request",
          href: "/personal/request/new",
          icon: <PlusCircle className="h-4 w-4" />,
        },
        {
          title: "My Requests",
          href: "/personal/requests",
          icon: <ClipboardList className="h-4 w-4" />,
        },
        {
          title: "Coverage & Benefits",
          href: "/personal/coverage",
          icon: <Shield className="h-4 w-4" />,
        },
        {
          title: "Health Metrics",
          href: "/personal/metrics",
          icon: <Heart className="h-4 w-4" />,
        },
      ],
    },
    {
      title: "Medical Care",
      items: [
        {
          title: "Appointments",
          href: "/personal/appointments",
          icon: <Calendar className="h-4 w-4" />,
        },
        {
          title: "Medical Records",
          href: "/personal/records",
          icon: <FileText className="h-4 w-4" />,
        },
        {
          title: "Medications",
          href: "/personal/medications",
          icon: <Pill className="h-4 w-4" />,
        },
        {
          title: "Test Results",
          href: "/personal/test-results",
          icon: <FileText className="h-4 w-4" />,
        },
      ],
    },
    {
      title: "Services",
      items: [
        {
          title: "Find Providers",
          href: "/personal/providers",
          icon: <MapPin className="h-4 w-4" />,
        },
        {
          title: "Telemedicine",
          href: "/personal/telemedicine",
          icon: <Phone className="h-4 w-4" />,
        },
        {
          title: "Insurance",
          href: "/personal/insurance",
          icon: <Shield className="h-4 w-4" />,
        },
      ],
    },
    {
      title: "Financial",
      items: [
        {
          title: "Billing",
          href: "/personal/billing",
          icon: <CreditCard className="h-4 w-4" />,
        },
        {
          title: "Claims",
          href: "/personal/claims",
          icon: <FileText className="h-4 w-4" />,
        },
      ],
    },
  ];

  return (
    <Sidebar>
      <SidebarHeader>
        {!isCollapsed ? (
          <div className="flex items-center gap-2 ">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <User className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold">ClearMed Personal</span>
              <span className="text-xs text-muted-foreground ">
                Your Health Hub
              </span>
            </div>
          </div>
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <User className="h-4 w-4" />
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
            href="/personal/notifications"
            icon={<Bell className="h-4 w-4" />}
            isActive={currentPath === "/personal/notifications"}
          >
            Notifications
          </SidebarNavItem>
          <SidebarNavItem
            href="/personal/profile"
            icon={<UserCog className="h-4 w-4" />}
            isActive={currentPath === "/personal/profile"}
          >
            Profile & Settings
          </SidebarNavItem>
        </SidebarNav>
      </SidebarFooter>
    </Sidebar>
  );
}

export function PersonalSidebarWrapper({
  children,
  currentPath,
}: {
  children: React.ReactNode;
  currentPath?: string;
}) {
  return (
    <SidebarProvider>
      <div className="flex h-screen">
        <PersonalSidebar currentPath={currentPath} />
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </SidebarProvider>
  );
}
