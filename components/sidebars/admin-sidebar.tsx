"use client";

import {
  Sidebar,
  SidebarProvider,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarToggle,
  SidebarMobileToggle,
  SidebarNav,
  SidebarNavItem,
  SidebarGroup,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Shield,
  LayoutDashboard,
  Users,
  Building2,
  Activity,
  FileText,
  Settings,
  LogOut,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface AdminSidebarProps {
  currentPath?: string;
}

const navigationItems = [
  {
    title: "Overview",
    items: [
      {
        title: "Dashboard",
        href: "/admin/dashboard",
        icon: <LayoutDashboard className="h-4 w-4" />,
      },
    ],
  },
  {
    title: "User Management",
    items: [
      {
        title: "All Users",
        href: "/admin/users",
        icon: <Users className="h-4 w-4" />,
      },
    ],
  },
  {
    title: "Organisations",
    items: [
      {
        title: "Hospitals",
        href: "/admin/hospitals",
        icon: <Building2 className="h-4 w-4" />,
      },
      {
        title: "HMOs",
        href: "/admin/hmos",
        icon: <Activity className="h-4 w-4" />,
      },
    ],
  },
  {
    title: "System",
    items: [
      {
        title: "Audit Log",
        href: "/admin/audit-log",
        icon: <FileText className="h-4 w-4" />,
      },
    ],
  },
];

export function AdminSidebar({ currentPath }: AdminSidebarProps) {
  const { isCollapsed } = useSidebar();

  return (
    <Sidebar>
      <SidebarHeader>
        {!isCollapsed ? (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Shield className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold">ClearMed Admin</span>
              <span className="text-xs text-muted-foreground">System Administration</span>
            </div>
          </div>
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Shield className="h-4 w-4" />
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
                  isActive={
                    currentPath === item.href ||
                    (item.href !== "/admin/dashboard" &&
                      currentPath?.startsWith(item.href))
                  }
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
            href="/admin/settings"
            icon={<Settings className="h-4 w-4" />}
            isActive={currentPath === "/admin/settings"}
          >
            Settings
          </SidebarNavItem>
          <ThemeToggle collapsed={isCollapsed} />
          <SidebarNavItem
            href="/api/auth/signout?callbackUrl=/auth/login"
            icon={<LogOut className="h-4 w-4" />}
          >
            Sign out
          </SidebarNavItem>
        </SidebarNav>
      </SidebarFooter>
    </Sidebar>
  );
}

export function AdminSidebarWrapper({
  children,
  currentPath,
}: {
  children: React.ReactNode;
  currentPath?: string;
}) {
  return (
    <SidebarProvider>
      <div className="flex h-screen">
        <AdminSidebar currentPath={currentPath} />
        <main className="relative flex-1 overflow-y-auto">
          <SidebarMobileToggle />
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
