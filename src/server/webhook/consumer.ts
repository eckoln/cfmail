import crypto from 'node:crypto'
import type { PrismaClient } from 'generated/prisma/client'
import type { DeliveryStatus } from 'generated/prisma/enums'
import { createDatabase } from '../database/database'
import {
  createWebhookDeliveryItem,
  getActiveWebhookById,
} from '../database/queries/webhooks'
import type { WebhookQueueMessage } from './webhook'

function generateSignature(body: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(body).digest('hex')
}

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
  const webhook = await getActiveWebhookById(db, message.body.webhookId)
  if (!webhook) {
    message.ack()
    return
  }

  const { webhookId, eventType, url, secret, payload } = message.body

  const body = JSON.stringify(payload)
  const signature = generateSignature(body, secret)

  const headers = new Headers({
    'Content-Type': 'application/json',
    'X-Webhook-Signature': signature,
    'X-Webhook-ID': webhookId,
  })

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
      webhook: {
        connect: {
          id: webhookId,
        },
      },
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
