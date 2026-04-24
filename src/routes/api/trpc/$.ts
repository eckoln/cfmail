import { createFileRoute } from '@tanstack/react-router'
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { createContext } from '@/server/api/trpc/context'
import { trpcRouter } from '@/server/api/trpc/routes'

export const Route = createFileRoute('/api/trpc/$')({
  server: {
    handlers: {
      ANY: async ({ request }) => {
        return fetchRequestHandler({
          endpoint: '/api/trpc',
          req: request,
          router: trpcRouter,
          createContext: ({ req }) => {
            return createContext(req.headers)
          },
        })
      },
    },
  },
})
