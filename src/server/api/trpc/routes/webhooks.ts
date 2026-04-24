import crypto from 'node:crypto'
import z from 'zod'
import {
  createWebhook,
  deleteWebhook,
  getWebhookById,
  listWebhookDeliveries,
  listWebhooks,
} from '@/server/database/queries/webhooks'
import { t } from '../trpc'

const createWebhookSchema = z.object({
  endpoint: z.url(),
  eventTypes: z.array(z.string()).nonempty(),
})

export const webhooksRouter = t.router({
  list: t.procedure.query(({ ctx }) => {
    return listWebhooks(ctx.database)
  }),

  get: t.procedure.input(z.string()).query(({ ctx, input }) => {
    return getWebhookById(ctx.database, input)
  }),

  create: t.procedure.input(createWebhookSchema).mutation(({ ctx, input }) => {
    return createWebhook(ctx.database, {
      secret: `wh_${crypto.randomBytes(16).toString('hex')}`,
      url: input.endpoint,
      events: input.eventTypes,
    })
  }),

  delete: t.procedure.input(z.string()).mutation(({ ctx, input }) => {
    return deleteWebhook(ctx.database, input)
  }),

  deliveries: t.router({
    list: t.procedure.input(z.string()).query(({ ctx, input }) => {
      return listWebhookDeliveries(ctx.database, input)
    }),
  }),
})
