import handler from '@tanstack/react-start/server-entry'
import { createRemoteJWKSet, jwtVerify } from 'jose'
import PostalMime from 'postal-mime'
import { createEmail } from './server/database/queries/emails'
import { processWebhookBatch } from './server/webhook/consumer'
import {
  triggerWebhook,
  type WebhookQueueMessage,
} from './server/webhook/webhook'

export default {
  async fetch(request, env) {
    if (!import.meta.env.DEV) {
      const { POLICY_AUD, TEAM_DOMAIN } = env

      if (!POLICY_AUD || !TEAM_DOMAIN) {
        return new Response(
          'Cloudflare Access must be configured in production. Set POLICY_AUD and TEAM_DOMAIN.',
          {
            status: 403,
            headers: { 'Content-Type': 'text/plain' },
          },
        )
      }

      const token = request.headers.get('CF-Access-JWT-Assertion')

      if (!token) {
        return new Response('Missing required CF Access JWT', {
          status: 403,
          headers: { 'Content-Type': 'text/plain' },
        })
      }

      const jwksUrl = new URL('/cdn-cgi/access/certs', env.TEAM_DOMAIN)
      const JWKS = createRemoteJWKSet(jwksUrl)

      try {
        await jwtVerify(token, JWKS, {
          issuer: TEAM_DOMAIN,
          audience: POLICY_AUD,
        })
      } catch {
        return new Response('Invalid token', {
          status: 403,
          headers: { 'Content-Type': 'text/plain' },
        })
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

      const createdEmail = await createEmail({
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
