import type { PrismaClient } from 'generated/prisma/client'
import type { EmailType } from 'generated/prisma/enums'
import type { EmailCreateInput } from 'generated/prisma/models'

export async function createEmail(
  db: PrismaClient,
  payload: Omit<EmailCreateInput, 'id'>,
) {
  return db.email.create({ data: payload, include: { recipients: true } })
}

export async function listEmailsByType(db: PrismaClient, type: EmailType) {
  return db.email.findMany({
    where: { type },
    include: { recipients: true },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getEmailById(db: PrismaClient, id: string) {
  return db.email.findUniqueOrThrow({
    where: { id },
    include: { recipients: true },
  })
}
