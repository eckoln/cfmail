import type { QueryClient } from '@tanstack/react-query'
import {
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from '@tanstack/react-router'
import type { TRPCOptionsProxy } from '@trpc/tanstack-react-query'
import type { TRPCRouter } from '@/server/api/trpc/routes'
import appCss from '../styles.css?url'

export const Route = createRootRouteWithContext<{
  trpc: TRPCOptionsProxy<TRPCRouter>
  queryClient: QueryClient
}>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'cfmail',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scheme-only-dark" data-mode="dark">
      <head>
        <HeadContent />
      </head>
      <body className="flex h-screen w-full">
        {children}
        <Scripts />
      </body>
    </html>
  )
}
