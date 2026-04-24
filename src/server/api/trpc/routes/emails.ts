import z from 'zod'
import {
  getEmailById,
  listEmailsByType,
} from '@/server/database/queries/emails'
import { t } from '../trpc'

export const emailsRouter = t.router({
  list: t.procedure
    .input(z.enum(['inbound', 'outbound']))
    .query(async ({ ctx, input }) => {
      return listEmailsByType(ctx.database, input)
    }),

  get: t.procedure.input(z.string()).query(async ({ ctx, input }) => {
    return getEmailById(ctx.database, input)
  }),
})
