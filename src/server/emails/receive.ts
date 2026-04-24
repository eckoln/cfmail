import PostalMime from 'postal-mime'
import { createDatabase } from '@/server/database/database'
import { createEmail } from '@/server/database/queries/emails'
import { triggerWebhook } from '@/server/webhook/webhook'

export async function receiveEmail(
  message: ForwardableEmailMessage,
  ctx: ExecutionContext,
) {
  if (!message.to) {
    throw new Error('No recipients found')
  }

  try {
    const email = await new PostalMime().parse(message.raw)

    const replyToAddresses = email.replyTo
      ?.map((reply) => reply.address)
      .filter((address): address is string => Boolean(address))

    const database = createDatabase()
    const createdEmail = await createEmail(database, {
      type: 'inbound',
      from: email.from?.address || '',
      subject: email.subject || '',
      rawBody: email.html || email.text || '',
      rawHeaders: email.headers,
      replyTo: replyToAddresses?.length ? replyToAddresses : undefined,
      messageId: email.messageId,
      lastEvent: 'received',
      recipients: {
        create: {
          role: 'to',
          status: 'received',
          emailAddress: message.to,
        },
      },
    })

    const { rawHeaders, replyTo, rawBody, ...payload } = createdEmail
    ctx.waitUntil(triggerWebhook('email.received', payload))
  } catch (error) {
    console.error('Error while processing email: ', error)
    throw error
  }
}
