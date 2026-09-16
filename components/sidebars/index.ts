export { HMOSidebar, HMOSidebarWrapper } from "./hmo-sidebar";
export { HospitalSidebar, HospitalSidebarWrapper } from "./hospital-sidebar";
export { PersonalSidebar, PersonalSidebarWrapper } from "./personal-sidebar";
export { AdminSidebar, AdminSidebarWrapper } from "./admin-sidebar";

// Re-export the base sidebar components for custom implementations
export {
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
