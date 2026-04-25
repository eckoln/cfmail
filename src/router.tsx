import { QueryClient } from '@tanstack/react-query'
import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'
import { createTRPCOptionsProxy } from '@trpc/tanstack-react-query'
import SuperJSON from 'superjson'
import { routeTree } from './routeTree.gen'
import { makeTRPCClient, TRPCProvider } from './server/api/trpc/client'
import type { TRPCRouter } from './server/api/trpc/routes'

export function getRouter() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 2 * 60 * 1000, // 2 minutes
      },
      hydrate: {
        deserializeData: SuperJSON.deserialize,
      },
      dehydrate: {
        serializeData: SuperJSON.serialize,
      },
    },
  })

  const trpcClient = makeTRPCClient()
  const trpc = createTRPCOptionsProxy<TRPCRouter>({
    client: trpcClient,
    queryClient,
  })

  const router = createTanStackRouter({
    routeTree,

    context: { trpc, queryClient },

    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,

    Wrap: function WrapComponent({ children }) {
      return (
        <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
          {children}
        </TRPCProvider>
      )
    },
  })

  setupRouterSsrQueryIntegration({ router, queryClient })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
