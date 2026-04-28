import { Sidebar } from '@cloudflare/kumo'
import { ShikiProvider } from '@cloudflare/kumo/code'
import { createFileRoute, notFound, Outlet } from '@tanstack/react-router'
import { DashboardSidebar } from '@/components/sidebar'

export const Route = createFileRoute('/(app)')({
  component: RouteComponent,
  beforeLoad: async ({ context }) => {
    try {
      const user = await context.queryClient.fetchQuery(
        context.trpc.users.me.queryOptions(),
      )
      return { user }
    } catch {
      throw notFound()
    }
  },
})

function RouteComponent() {
  return (
    <Sidebar.Provider defaultOpen>
      <DashboardSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl w-full mx-auto px-4 py-16">
          <ShikiProvider engine="javascript" languages={['bash', 'json']}>
            <Outlet />
          </ShikiProvider>
        </div>
      </main>
    </Sidebar.Provider>
  )
}
