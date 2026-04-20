import {
  createFileRoute,
  Link,
  Outlet,
  useLocation,
} from '@tanstack/react-router'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

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
  const activeTab = pathname === 'receiving' ? 'receiving' : 'emails'

  return (
    <div className="space-y-6">
      <h1 className="font-semibold text-2xl leading-none">Emails</h1>

      <div className="space-y-4">
        <Tabs value={activeTab}>
          <TabsList variant="line">
            <TabsTrigger value="emails" asChild>
              <Link to="/emails">Sending</Link>
            </TabsTrigger>
            <TabsTrigger value="receiving" asChild>
              <Link to="/emails/receiving">Receiving</Link>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Outlet />
      </div>
    </div>
  )
}
