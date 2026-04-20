import type { EmailType } from 'generated/prisma/enums'
import type { EmailCreateInput } from 'generated/prisma/models'
import { createDatabase } from '../database'

export async function createEmail(payload: Omit<EmailCreateInput, 'id'>) {
  const database = createDatabase()
  return database.email.create({ data: payload })
}

export async function listEmailsByType(type: EmailType) {
  const database = createDatabase()
  return database.email.findMany({
    where: { type },
    include: { recipients: true },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getEmailById(id: string) {
  const database = createDatabase()
  return database.email.findUniqueOrThrow({
    where: { id },
    include: {
      recipients: true,
    },
  })
}
