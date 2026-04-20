import { createFileRoute, notFound, Outlet } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { SidebarProvider } from '@/components/ui/sidebar'
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
    <SidebarProvider>
      <DashboardSidebar />
      <main className="flex flex-col flex-1">
        <header className="flex items-center justify-between h-12 border-b"></header>
        <div className="flex-1 py-8">
          <div className="max-w-6xl w-full mx-auto px-4">
            <Outlet />
          </div>
        </div>
      </main>
    </SidebarProvider>
  )
}
