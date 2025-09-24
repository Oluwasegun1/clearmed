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
  Hospital,
  Calendar,
  FileText,
  Stethoscope,
  Settings,
  Bell,
  CreditCard,
  UserCheck,
  Activity,
  Pill,
  PlusCircle,
  ClipboardList,
  AlertTriangle,
  ChartBar,
  ClipboardCheck,
  Microscope,
  Upload,
} from "lucide-react";
import { UserRole } from "@/lib/generated/prisma/UserRole";

interface HospitalSidebarProps {
  currentPath?: string;
  role?: UserRole;
}

export function HospitalSidebar({
  currentPath,
  role = UserRole.DOCTOR,
}: HospitalSidebarProps) {
  const { isCollapsed } = useSidebar();

  // Doctor Portal navigation items
  const doctorNavigationItems = [
    {
      title: "Overview",
      items: [
        {
          title: "Dashboard",
          href: "/hospital/dashboard",
          icon: <Activity className="h-4 w-4" />,
        },
      ],
    },
    {
      title: "Patient Care",
      items: [
        {
          title: "Create Request",
          href: "/hospital/request/new",
          icon: <PlusCircle className="h-4 w-4" />,
        },
        {
          title: "Patient Records",
          href: "/hospital/records",
          icon: <FileText className="h-4 w-4" />,
        },
        {
          title: "My Requests",
          href: "/hospital/requests",
          icon: <ClipboardList className="h-4 w-4" />,
        },
        {
          title: "Appointments",
          href: "/hospital/appointments",
          icon: <Calendar className="h-4 w-4" />,
        },
      ],
    },
  ];

  // Hospital Admin navigation items
  const adminNavigationItems = [
    {
      title: "Overview",
      items: [
        {
          title: "Dashboard",
          href: "/hospital/dashboard",
          icon: <Activity className="h-4 w-4" />,
        },
      ],
    },
    {
      title: "Requests",
      items: [
        {
          title: "All Requests",
          href: "/hospital/requests/all",
          icon: <ClipboardList className="h-4 w-4" />,
        },
        {
          title: "Escalations",
          href: "/hospital/requests/escalations",
          icon: <AlertTriangle className="h-4 w-4" />,
        },
      ],
    },
    {
      title: "Financial",
      items: [
        {
          title: "Billing/Claims",
          href: "/hospital/billing",
          icon: <CreditCard className="h-4 w-4" />,
        },
      ],
    },
    {
      title: "Management",
      items: [
        {
          title: "Staff",
          href: "/hospital/staff",
          icon: <UserCheck className="h-4 w-4" />,
        },
        {
          title: "Departments",
          href: "/hospital/departments",
          icon: <Stethoscope className="h-4 w-4" />,
        },
        {
          title: "Reports",
          href: "/hospital/reports",
          icon: <ChartBar className="h-4 w-4" />,
        },
      ],
    },
  ];

  // Pharmacy Staff navigation items
  const pharmacyNavigationItems = [
    {
      title: "Overview",
      items: [
        {
          title: "Dashboard",
          href: "/hospital/dashboard",
          icon: <Activity className="h-4 w-4" />,
        },
      ],
    },
    {
      title: "Pharmacy",
      items: [
        {
          title: "Verify Prescription",
          href: "/hospital/pharmacy/verify",
          icon: <ClipboardCheck className="h-4 w-4" />,
        },
        {
          title: "Stock Check",
          href: "/hospital/pharmacy/stock",
          icon: <Pill className="h-4 w-4" />,
        },
      ],
    },
  ];

  // Lab Staff navigation items
  const labNavigationItems = [
    {
      title: "Overview",
      items: [
        {
          title: "Dashboard",
          href: "/hospital/dashboard",
          icon: <Activity className="h-4 w-4" />,
        },
      ],
    },
    {
      title: "Laboratory",
      items: [
        {
          title: "Verify Test Authorization",
          href: "/hospital/lab/verify",
          icon: <ClipboardCheck className="h-4 w-4" />,
        },
        {
          title: "Results Upload",
          href: "/hospital/lab/results",
          icon: <Upload className="h-4 w-4" />,
        },
        {
          title: "Test Records",
          href: "/hospital/lab/records",
          icon: <Microscope className="h-4 w-4" />,
        },
      ],
    },
  ];

  // Select navigation items based on role
  const navigationItems =
    role === UserRole.DOCTOR
      ? doctorNavigationItems
      : role === UserRole.HOSPITAL_ADMIN
      ? adminNavigationItems
      : role === UserRole.PHARMACY
      ? pharmacyNavigationItems
      : role === UserRole.LAB
      ? labNavigationItems
      : doctorNavigationItems; // Default to doctor navigation

  return (
    <Sidebar>
      <SidebarHeader>
        {!isCollapsed ? (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Hospital className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold">ClearMed Hospital</span>
              <span className="text-xs text-muted-foreground">
                Healthcare Provider
              </span>
            </div>
          </div>
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Hospital className="h-4 w-4" />
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
            href="/hospital/notifications"
            icon={<Bell className="h-4 w-4" />}
            isActive={currentPath === "/hospital/notifications"}
          >
            Notifications
          </SidebarNavItem>
          <SidebarNavItem
            href="/hospital/settings"
            icon={<Settings className="h-4 w-4" />}
            isActive={currentPath === "/hospital/settings"}
          >
            Settings
          </SidebarNavItem>
        </SidebarNav>
      </SidebarFooter>
    </Sidebar>
  );
}

export function HospitalSidebarWrapper({
  children,
  currentPath,
  role = UserRole.DOCTOR,
}: {
  children: React.ReactNode;
  currentPath?: string;
  role?: UserRole;
}) {
  return (
    <SidebarProvider>
      <div className="flex h-screen">
        <HospitalSidebar currentPath={currentPath} role={role} />
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </SidebarProvider>
  );
}
