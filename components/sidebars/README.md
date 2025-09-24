# ClearMed Sidebar Components

A collection of reusable sidebar components designed for the ClearMed healthcare platform. These components provide consistent navigation experiences across different user types: HMO administrators, hospital staff, and personal users.

## Features

- **Collapsible Design**: Toggle between expanded and collapsed states
- **Responsive Layout**: Works seamlessly across different screen sizes
- **Type-Specific Navigation**: Customized menu items for each user type
- **Active State Management**: Visual indication of current page/section
- **Grouped Navigation**: Organized menu items with section headers
- **Icon Integration**: Uses Lucide React icons throughout
- **Consistent Styling**: Built with Tailwind CSS and CSS custom properties
- **Accessibility**: Proper ARIA labels and keyboard navigation support

## Components

### Base Sidebar Components

- `Sidebar`: Main container component
- `SidebarProvider`: Context provider for sidebar state
- `SidebarHeader`: Header section with logo and toggle
- `SidebarContent`: Scrollable content area
- `SidebarFooter`: Footer section for settings/notifications
- `SidebarToggle`: Collapse/expand toggle button
- `SidebarNav`: Navigation container
- `SidebarNavItem`: Individual navigation item
- `SidebarGroup`: Grouped navigation section

### Specialized Sidebar Components

1. **HMO Sidebar** (`HMOSidebar`, `HMOSidebarWrapper`)
   - Dashboard and analytics
   - Hospital and member management
   - Claims and compliance tracking

2. **Hospital Sidebar** (`HospitalSidebar`, `HospitalSidebarWrapper`)
   - Patient care management
   - Staff and department organization
   - Billing and insurance claims

3. **Personal Sidebar** (`PersonalSidebar`, `PersonalSidebarWrapper`)
   - Health metrics and records
   - Appointment scheduling
   - Insurance and billing management

## Installation

The components are already included in your ClearMed project. Make sure you have the required dependencies:

```bash
npm install lucide-react class-variance-authority clsx tailwind-merge
```

## Usage

### Basic Usage with Wrapper Components

```tsx
import { HMOSidebarWrapper } from '@/components/sidebars'

export default function HMOLayout({ children }: { children: React.ReactNode }) {
  return (
    <HMOSidebarWrapper currentPath="/hmo/dashboard">
      {children}
    </HMOSidebarWrapper>
  )
}
```

### Custom Implementation

```tsx
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarNav,
  SidebarNavItem,
  SidebarToggle
} from '@/components/sidebars'
import { Home, Settings } from 'lucide-react'

function CustomSidebar() {
  return (
    <SidebarProvider>
      <div className="flex h-screen">
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2">
              <span className="font-semibold">My App</span>
            </div>
            <SidebarToggle />
          </SidebarHeader>
          
          <SidebarContent>
            <SidebarNav>
              <SidebarNavItem href="/" icon={<Home className="h-4 w-4" />}>
                Home
              </SidebarNavItem>
              <SidebarNavItem href="/settings" icon={<Settings className="h-4 w-4" />}>
                Settings
              </SidebarNavItem>
            </SidebarNav>
          </SidebarContent>
        </Sidebar>
        
        <main className="flex-1 overflow-hidden">
          {/* Your content here */}
        </main>
      </div>
    </SidebarProvider>
  )
}
```

### Using the Sidebar Hook

```tsx
import { useSidebar } from '@/components/sidebars'

function MyComponent() {
  const { isCollapsed, setIsCollapsed } = useSidebar()
  
  return (
    <div>
      <p>Sidebar is {isCollapsed ? 'collapsed' : 'expanded'}</p>
      <button onClick={() => setIsCollapsed(!isCollapsed)}>
        Toggle Sidebar
      </button>
    </div>
  )
}
```

## Props

### SidebarProvider

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | - | Child components |
| `defaultCollapsed` | `boolean` | `false` | Initial collapsed state |

### SidebarNavItem

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | - | Item label |
| `icon` | `ReactNode` | - | Icon component |
| `isActive` | `boolean` | `false` | Active state |
| `href` | `string` | - | Navigation URL |

### Wrapper Components

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | - | Page content |
| `currentPath` | `string` | - | Current page path for active states |

## Styling

The components use CSS custom properties defined in your `globals.css`:

```css
:root {
  --sidebar: oklch(0.984 0.003 247.858);
  --sidebar-foreground: oklch(0.129 0.042 264.695);
  --sidebar-primary: oklch(0.208 0.042 265.755);
  --sidebar-primary-foreground: oklch(0.984 0.003 247.858);
  --sidebar-accent: oklch(0.968 0.007 247.896);
  --sidebar-accent-foreground: oklch(0.208 0.042 265.755);
  --sidebar-border: oklch(0.929 0.013 255.508);
  --sidebar-ring: oklch(0.704 0.04 256.788);
}
```

## Demo

Visit `/sidebar-demo` to see all sidebar variants in action and test the interactive features.

## Customization

To create a new sidebar variant:

1. Create a new file in `components/sidebars/`
2. Import the base components
3. Define your navigation structure
4. Export both the sidebar component and wrapper
5. Add the export to `components/sidebars/index.ts`

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

When adding new navigation items or modifying existing ones:

1. Ensure icons are from the Lucide React library
2. Follow the existing naming conventions
3. Update the TypeScript interfaces if needed
4. Test across all sidebar variants
5. Update this documentation