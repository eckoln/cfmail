import { Tabs, Text } from '@cloudflare/kumo'
import {
  createFileRoute,
  Link,
  Outlet,
  useLocation,
} from '@tanstack/react-router'

export const Route = createFileRoute('/(app)/emails/(lists)')({
  component: RouteComponent,
  head: () => ({
    meta: [
      {
        title: 'Emails - cfmail',
      },
    ],
  }),
})

function RouteComponent() {
  const location = useLocation()
  const pathname = location.pathname.split('/').pop()

  return (
    <div className="space-y-6">
      <Text variant="heading1">Emails</Text>

      <div className="space-y-4">
        <Tabs
          className="w-fit"
          variant="segmented"
          tabs={[
            {
              value: 'emails',
              label: 'Sending',
              render: (props) => <Link to="/emails" {...props} />,
            },
            {
              value: 'receiving',
              label: 'Receiving',
              render: (props) => <Link to="/emails/receiving" {...props} />,
            },
          ]}
          value={pathname}
        />

        <Outlet />
      </div>
    </div>
  )
}
