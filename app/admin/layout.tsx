/**
 * Admin layout: wraps all /admin/* routes.
 * Role-based access is enforced in middleware.
 * Uses a pathname-aware client wrapper to highlight the active sidebar link.
 */
"use client";

import { usePathname } from "next/navigation";
import { AdminSidebarWrapper } from "@/components/sidebars";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return <AdminSidebarWrapper currentPath={pathname}>{children}</AdminSidebarWrapper>;
}
