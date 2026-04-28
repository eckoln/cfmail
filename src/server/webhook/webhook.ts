import { env } from 'cloudflare:workers'
import type {
  EmailModel,
  RecipientModel,
  WebhookModel,
} from 'generated/prisma/models'
import { createDatabase } from '../database/database'
import { getActiveWebhooksForEvent } from '../database/queries/webhooks'

export type WebhookEvent = 'email.sent' | 'email.received'

export interface WebhookPayload {
  type: WebhookEvent
  created_at: string
  data: WebhookEmailData
}

export interface WebhookQueueMessage {
  webhook: WebhookModel
  eventType: WebhookEvent
  payload: WebhookPayload
}

export interface WebhookEmailData
  extends Omit<EmailModel, 'rawHeaders' | 'replyTo' | 'rawBody'> {
  recipients: RecipientModel[]
}

export async function triggerWebhook(
  eventType: WebhookEvent,
  data: WebhookEmailData,
) {
  const database = createDatabase()

  const webhooks = await getActiveWebhooksForEvent(database, eventType)
  if (webhooks.length === 0) {
    return
  }

  const messages: MessageSendRequest<WebhookQueueMessage>[] = webhooks.map(
    (webhook) => ({
      body: {
        webhook,
        eventType,
        payload: {
          type: eventType,
          created_at: new Date().toISOString(),
          data,
        },
      },
    }),
  )

  await env.WEBHOOK_QUEUE.sendBatch(messages)
}
