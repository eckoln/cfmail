import handler from '@tanstack/react-start/server-entry'
import PostalMime from 'postal-mime'
import { getUser } from './lib/queries/user'
import { createDatabase } from './server/database/database'
import { createEmail } from './server/database/queries/emails'
import { processWebhookBatch } from './server/webhook/consumer'

import type { WebhookQueueMessage } from './server/webhook/webhook'
import { apiResponse } from './utils/api-response'

export default {
  async fetch(request, env) {
    if (!import.meta.env.DEV) {
      const { POLICY_AUD, TEAM_DOMAIN } = env

      if (!POLICY_AUD || !TEAM_DOMAIN) {
        return apiResponse(
          {
            status: false,
            errors: [
              'Cloudflare Access must be configured in production. Set POLICY_AUD and TEAM_DOMAIN.',
            ],
          },
          403,
        )
      }

      try {
        await getUser(request.headers)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        return apiResponse({ status: false, errors: [message] }, 403)
      }
    }

    return handler.fetch(request)
  },

  async email(message, _env, ctx) {
    try {
      const email = await new PostalMime().parse(message.raw)

      if (!email.to?.length || !email.to[0].address) {
        throw new Error('No recipients found')
      }

      const database = createDatabase()
      const createdEmail = await createEmail(database, {
        type: 'inbound',
        from: email.from?.address || '',
        subject: email.subject || '',
        rawBody: email.html || email.text || '',
        rawHeaders: email.headers,
        replyTo:
          email.replyTo?.map((reply) => reply.address || '').filter(Boolean) ||
          undefined,
        messageId: email.messageId,
        lastEvent: 'received',
        recipients: {
          create: {
            emailAddress: message.to,
            role: 'to',
            status: 'received',
          },
        },
      })

      const { rawHeaders, replyTo, rawBody, ...rest } = createdEmail
      ctx.waitUntil(triggerWebhook('email.received', rest))
    } catch (error) {
      console.error('Error while processing email: ', error)
      message.setReject('550 Message rejected due to processing error')
    }
  },

  async queue(batch) {
    await processWebhookBatch(batch as MessageBatch<WebhookQueueMessage>)
  },
} satisfies ExportedHandler<Env>
