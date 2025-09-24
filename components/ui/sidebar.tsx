"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface SidebarContextType {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

const SidebarContext = React.createContext<SidebarContextType | undefined>(
  undefined
);

function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}

interface SidebarProviderProps {
  children: React.ReactNode;
  defaultCollapsed?: boolean;
}

function SidebarProvider({
  children,
  defaultCollapsed = false,
}: SidebarProviderProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);

  return (
    <SidebarContext.Provider value={{ isCollapsed, setIsCollapsed }}>
      {children}
    </SidebarContext.Provider>
  );
}

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

function Sidebar({ children, className, ...props }: SidebarProps) {
  const { isCollapsed } = useSidebar();

  return (
    <div
      className={cn(
        "flex h-screen flex-col border-r bg-sidebar transition-all duration-300",
        isCollapsed ? "w-16" : "w-64",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface SidebarHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

function SidebarHeader({ children, className, ...props }: SidebarHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between border-b border-sidebar-border p-4",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface SidebarContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

function SidebarContent({
  children,
  className,
  ...props
}: SidebarContentProps) {
  return (
    <div className={cn("flex-1 overflow-y-auto p-4", className)} {...props}>
      {children}
    </div>
  );
}

interface SidebarFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

function SidebarFooter({ children, className, ...props }: SidebarFooterProps) {
  return (
    <div
      className={cn("border-t border-sidebar-border p-4", className)}
      {...props}
    >
      {children}
    </div>
  );
}

type SidebarToggleProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

function SidebarToggle({ className, ...props }: SidebarToggleProps) {
  const { isCollapsed, setIsCollapsed } = useSidebar();

  return (
    <button
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-md border border-sidebar-border bg-sidebar hover:bg-sidebar-accent transition-colors",
        className
      )}
      onClick={() => setIsCollapsed(!isCollapsed)}
      {...props}
    >
      {isCollapsed ? (
        <ChevronRight className="h-4 w-4" />
      ) : (
        <ChevronLeft className="h-4 w-4" />
      )}
    </button>
  );
}

interface SidebarNavProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

function SidebarNav({ children, className, ...props }: SidebarNavProps) {
  return (
    <nav className={cn("space-y-2", className)} {...props}>
      {children}
    </nav>
  );
}

interface SidebarNavItemProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  children: React.ReactNode;
  icon?: React.ReactNode;
  isActive?: boolean;
}

function SidebarNavItem({
  children,
  icon,
  isActive,
  className,
  ...props
}: SidebarNavItemProps) {
  const { isCollapsed } = useSidebar();

  return (
    <a
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        isCollapsed && "justify-center px-2",
        className
      )}
      {...props}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {!isCollapsed && <span className="truncate">{children}</span>}
    </a>
  );
}

interface SidebarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  title?: string;
}

function SidebarGroup({
  children,
  title,
  className,
  ...props
}: SidebarGroupProps) {
  const { isCollapsed } = useSidebar();

  return (
    <div className={cn("space-y-2", className)} {...props}>
      {title && !isCollapsed && (
        <h4 className="px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/70">
          {title}
        </h4>
      )}
      {children}
    </div>
  );
}

export {
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
};
