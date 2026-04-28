import type { PrismaClient } from 'generated/prisma/client'
import type { DeliveryStatus } from 'generated/prisma/enums'
import { createDatabase } from '../database/database'
import {
  createWebhookDeliveryItem,
  getActiveWebhookById,
} from '../database/queries/webhooks'
import { WebhookProvider } from './providers'
import type { WebhookQueueMessage } from './webhook'

async function deliverWebhook(
  url: string,
  headers: Headers,
  body: string,
): Promise<{
  status: DeliveryStatus
  httpStatus?: number
}> {
  try {
    const res = await fetch(url, { method: 'POST', headers, body })
    const status: DeliveryStatus = res.ok ? 'success' : 'failed'
    return { status, httpStatus: res.status }
  } catch {
    return { status: 'failed' }
  }
}

export async function processWebhook(
  db: PrismaClient,
  message: Message<WebhookQueueMessage>,
) {
  const { webhook, eventType, payload } = message.body
  const { provider, secret, id, url } = webhook

  const activeWebhook = await getActiveWebhookById(db, id)
  if (!activeWebhook) {
    message.ack()
    return
  }

  const webhookTarget = new WebhookProvider(provider, secret)
  const { body, headers } = webhookTarget.transform(url, payload)

  const { status, httpStatus } = await deliverWebhook(url, headers, body)
  if (status === 'success') {
    message.ack()
  } else {
    message.retry()
  }

  try {
    await createWebhookDeliveryItem(db, {
      eventType,
      payload: body,
      status,
      httpStatus,
      responseBody: null,
      attempts: message.attempts,
      webhook: { connect: { id } },
    })
  } catch (error) {
    console.error('Unhandled error in createWebhookDeliveryItem:', error)
  }
}

export async function processWebhookBatch(
  batch: MessageBatch<WebhookQueueMessage>,
) {
  const database = createDatabase()
  for (const message of batch.messages) {
    try {
      await processWebhook(database, message)
    } catch (error) {
      console.error('Unhandled error in processWebhook:', error)
      message.retry()
    }
  }
}
