import { env } from 'cloudflare:workers'
import { Prisma, type RecipientRole } from 'generated/prisma/client'
import type { RecipientCreateInput } from 'generated/prisma/models'
import type { EmailSendInput } from '@/server/api/schemas/emails'
import { createDatabase } from '@/server/database/database'
import { createEmail } from '@/server/database/queries/emails'
import { triggerWebhook } from '@/server/webhook/webhook'

function generateRecipients(
  emails: string[],
  role: RecipientRole,
): Pick<RecipientCreateInput, 'emailAddress' | 'role' | 'status'>[] {
  return emails.map((email) => ({
    emailAddress: email,
    role,
    status: 'sent',
  }))
}

export async function sendEmail(payload: EmailSendInput) {
  try {
    const response = await env.EMAIL.send(payload)

    const database = createDatabase()
    const email = await createEmail(database, {
      type: 'outbound',
      from:
        typeof payload.from === 'string' ? payload.from : payload.from.email,
      subject: payload.subject,
      rawBody: payload.html || payload.text || '',
      replyTo: payload.replyTo ? [payload.replyTo] : undefined,
      messageId: response.messageId,
      lastEvent: 'sent',
      recipients: {
        createMany: {
          data: [
            ...generateRecipients(payload.to || [], 'to'),
            ...generateRecipients(payload.cc || [], 'cc'),
            ...generateRecipients(payload.bcc || [], 'bcc'),
          ],
        },
      },
    })

    try {
      const { rawHeaders, replyTo, rawBody, ...payload } = email
      await triggerWebhook('email.sent', payload)
    } catch (error) {
      console.error('Failed to trigger webhook:', error)
    }

    return email
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error('CRITICAL: Email sent but DB save failed:', error)
      throw new Error('Email sent but could not be saved to the database.')
    } else if (error instanceof Error) {
      console.error('Email send failed:', error.message)
      throw new Error('Failed to send email')
    }
    throw error
  }
}
