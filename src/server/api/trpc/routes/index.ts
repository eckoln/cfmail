import { router } from '../trpc'
import { emailsRouter } from './emails'
import { usersRouter } from './users'
import { webhooksRouter } from './webhooks'

export const trpcRouter = router({
  users: usersRouter,
  emails: emailsRouter,
  webhooks: webhooksRouter,
})

export type TRPCRouter = typeof trpcRouter
