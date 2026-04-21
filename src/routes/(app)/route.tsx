import { Sidebar } from '@cloudflare/kumo'
import { createFileRoute, notFound, Outlet } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { DashboardSidebar } from '@/components/sidebar'
import { getUser } from '@/lib/queries/user'

const getUserServerFn = createServerFn().handler(async () => {
  if (!import.meta.env.DEV) {
    return getUser(getRequestHeaders())
  }
  return { email: 'localhost' }
})

export const Route = createFileRoute('/(app)')({
  component: RouteComponent,
  beforeLoad: async () => {
    const user = await getUserServerFn()

    if (!user) {
      throw notFound()
    }

    return { user }
  },
})

function RouteComponent() {
  return (
    <Sidebar.Provider defaultOpen>
      <DashboardSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl w-full mx-auto px-4 py-16">
          <Outlet />
        </div>
      </main>
    </Sidebar.Provider>
  )
}
