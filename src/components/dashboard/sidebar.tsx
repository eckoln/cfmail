import { EnvelopeSimpleIcon } from '@phosphor-icons/react'
import { Link, useRouteContext } from '@tanstack/react-router'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

export function DashboardSidebar() {
  const { user } = useRouteContext({ from: '/(app)' })

  return (
    <Sidebar className="text-muted-foreground" variant="sidebar">
      <SidebarHeader>
        <div className="flex flex-col gap-0.5 px-2.5 pt-2.5">
          <h1 className="font-semibold leading-none">User</h1>
          <span className="text-sm text-muted-foreground">{user.email}</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenuItem>
            <Link to="/emails">
              {({ isActive }) => (
                <SidebarMenuButton
                  className="cursor-pointer"
                  isActive={isActive}
                >
                  <EnvelopeSimpleIcon />
                  <span>Emails</span>
                </SidebarMenuButton>
              )}
            </Link>
          </SidebarMenuItem>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
