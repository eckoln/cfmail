import { mutationOptions, queryOptions } from '@tanstack/react-query'
import { createServerFn } from '@tanstack/react-start'
import z from 'zod'
import { createDatabase } from '@/server/database/database'
import {
  createWebhook,
  deleteWebhook,
  getWebhookById,
  listWebhookDeliveries,
  listWebhooks,
} from '@/server/database/queries/webhooks'

export const createWebhookSchema = z.object({
  endpoint: z.url(),
  eventTypes: z.array(z.string()).nonempty(),
})

export const createWebhookFn = createServerFn()
  .inputValidator(createWebhookSchema)
  .handler(async ({ data }) => {
    const secret = crypto.randomUUID()
    const database = createDatabase()
    return createWebhook(database, {
      url: data.endpoint,
      events: data.eventTypes,
      secret,
    })
  })

export const listWebhooksFn = createServerFn().handler(async () => {
  const database = createDatabase()
  return listWebhooks(database)
})

export const getWebhookByIdFn = createServerFn()
  .inputValidator((id: string) => id)
  .handler(async ({ data }) => {
    const database = createDatabase()
    return getWebhookById(database, data)
  })

export const listWebhookDeliveriesFn = createServerFn()
  .inputValidator((id: string) => id)
  .handler(async ({ data }) => {
    const database = createDatabase()
    return listWebhookDeliveries(database, data)
  })

export const deleteWebhookFn = createServerFn()
  .inputValidator((id: string) => id)
  .handler(async ({ data }) => {
    const database = createDatabase()
    return deleteWebhook(database, data)
  })

export function listWebhooksOptions() {
  return queryOptions({
    queryKey: ['webhooks'],
    queryFn: () => listWebhooksFn(),
    refetchInterval: 5000,
  })
}

export function getWebhookByIdOptions(id: string) {
  return queryOptions({
    queryKey: ['webhooks', id],
    queryFn: () => getWebhookByIdFn({ data: id }),
    staleTime: 60 * 1000 * 60, // 1 hour
  })
}

export function listWebhookDeliveriesOptions(id: string) {
  return queryOptions({
    queryKey: ['webhooks', id, 'deliveries'],
    queryFn: () => listWebhookDeliveriesFn({ data: id }),
    refetchInterval: 5000,
  })
}

export function createWebhookOptions() {
  return mutationOptions({
    mutationKey: ['webhooks', 'create'],
    mutationFn: (data: z.infer<typeof createWebhookSchema>) =>
      createWebhookFn({ data }),
  })
}

export function deleteWebhookOptions() {
  return mutationOptions({
    mutationKey: ['webhooks', 'delete'],
    mutationFn: (id: string) => deleteWebhookFn({ data: id }),
  })
}
