import { createIsomorphicFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import {
  createTRPCClient,
  httpBatchStreamLink,
  httpSubscriptionLink,
  splitLink,
  unstable_localLink,
} from '@trpc/client'
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server'
import { createTRPCContext } from '@trpc/tanstack-react-query'
import SuperJSON from 'superjson'
import { createContext } from './context'
import { type TRPCRouter, trpcRouter } from './routes'

export const { TRPCProvider, useTRPC } = createTRPCContext<TRPCRouter>()

export const makeTRPCClient = createIsomorphicFn()
  .server(() => {
    return createTRPCClient<TRPCRouter>({
      links: [
        unstable_localLink({
          router: trpcRouter,
          transformer: SuperJSON,
          createContext() {
            const headers = getRequestHeaders()
            return createContext(headers)
          },
        }),
      ],
    })
  })
  .client(() => {
    return createTRPCClient<TRPCRouter>({
      links: [
        splitLink({
          condition: (op) => op.type === 'subscription',
          true: httpSubscriptionLink({
            url: '/api/trpc',
            transformer: SuperJSON,
          }),
          false: httpBatchStreamLink({
            url: '/api/trpc',
            transformer: SuperJSON,
          }),
        }),
      ],
    })
  })

export type RouterInputs = inferRouterInputs<TRPCRouter>
export type RouterOutputs = inferRouterOutputs<TRPCRouter>
