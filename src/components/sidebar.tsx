import { Sidebar, Text } from '@cloudflare/kumo'
import { EnvelopeIcon, UserIcon } from '@phosphor-icons/react'
import { Link, useRouteContext } from '@tanstack/react-router'

export function DashboardSidebar() {
  const { user } = useRouteContext({ from: '/(app)' })

  return (
    <Sidebar>
      <Sidebar.Header className="px-5">
        <Text variant="heading3">CFMAIL</Text>
      </Sidebar.Header>
      <Sidebar.Content>
        <Sidebar.Group>
          <Sidebar.GroupLabel>Navigation</Sidebar.GroupLabel>
          <Sidebar.Menu>
            <Link to="/emails">
              {({ isActive }) => (
                <Sidebar.MenuButton icon={EnvelopeIcon} active={isActive}>
                  Emails
                </Sidebar.MenuButton>
              )}
            </Link>
          </Sidebar.Menu>
        </Sidebar.Group>
      </Sidebar.Content>
      <Sidebar.Footer>
        <Sidebar.MenuButton icon={UserIcon}>{user.email}</Sidebar.MenuButton>
      </Sidebar.Footer>
    </Sidebar>
  )
}
