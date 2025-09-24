export { HMOSidebar, HMOSidebarWrapper } from './hmo-sidebar'
export { HospitalSidebar, HospitalSidebarWrapper } from './hospital-sidebar'
export { PersonalSidebar, PersonalSidebarWrapper } from './personal-sidebar'

// Re-export the base sidebar components for custom implementations
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
} from '@/components/ui/sidebar'