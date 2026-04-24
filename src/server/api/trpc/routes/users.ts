import { t } from '../trpc'

export const usersRouter = t.router({
  me: t.procedure.query(({ ctx }) => {
    return ctx.user
  }),
})
