import type { PrismaClient } from 'generated/prisma/client'
import type {
  WebhookCreateInput,
  WebhookDeliveryCreateInput,
} from 'generated/prisma/models'

export async function createWebhook(
  db: PrismaClient,
  payload: WebhookCreateInput,
) {
  return db.webhook.create({
    data: payload,
  })
}

export async function listWebhooks(db: PrismaClient) {
  return db.webhook.findMany({
    orderBy: { createdAt: 'desc' },
  })
}

export async function getWebhookById(db: PrismaClient, id: string) {
  return db.webhook.findUniqueOrThrow({ where: { id } })
}

export async function getActiveWebhooksForEvent(
  db: PrismaClient,
  eventType: string,
) {
  return (
    await db.webhook.findMany({
      where: { isActive: true },
    })
  ).filter((webhook) => (webhook.events as string[]).includes(eventType))
}

export async function listWebhookDeliveries(db: PrismaClient, id: string) {
  return db.webhookDelivery.findMany({
    where: { webhookId: id },
    take: 6,
    orderBy: { attemptedAt: 'desc' },
  })
}

export async function createWebhookDeliveryItem(
  db: PrismaClient,
  payload: WebhookDeliveryCreateInput,
) {
  return db.webhookDelivery.create({ data: payload })
}

export async function deleteWebhook(db: PrismaClient, id: string) {
  return db.webhook.delete({ where: { id } })
}

export async function getActiveWebhookById(db: PrismaClient, id: string) {
  return db.webhook.findUnique({
    where: { id, isActive: true },
  })
}
