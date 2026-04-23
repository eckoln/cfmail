import { env } from 'cloudflare:workers'
import { createDatabase } from '../database/database'
import { getActiveWebhooksForEvent } from '../database/queries/webhooks'

export type WebhookEvent = 'email.sent' | 'email.received'

export interface WebhookPayload {
  type: string
  created_at: string
  data: Record<string, unknown>
}

export interface WebhookQueueMessage {
  webhookId: string
  url: string
  secret: string
  eventType: WebhookEvent
  payload: WebhookPayload
}

export async function triggerWebhook(
  eventType: WebhookEvent,
  data: Record<string, unknown>,
) {
  const database = createDatabase()

  const webhooks = await getActiveWebhooksForEvent(database, eventType)
  if (webhooks.length === 0) {
    return
  }

  const payload: WebhookPayload = {
    type: eventType,
    created_at: new Date().toISOString(),
    data,
  }

  await env.WEBHOOK_QUEUE.sendBatch(
    webhooks.map((webhook) => ({
      body: {
        webhookId: webhook.id,
        url: webhook.url,
        secret: webhook.secret,
        eventType,
        payload,
      },
    })),
  )
}
