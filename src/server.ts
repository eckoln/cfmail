import handler from '@tanstack/react-start/server-entry'
import { createRemoteJWKSet, jwtVerify } from 'jose'
import PostalMime from 'postal-mime'
import { createEmail } from './server/database/queries/emails'

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

      const jwksUrl = new URL(`${TEAM_DOMAIN}/cdn-cgi/access/certs`)
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

  async email(message) {
    try {
      const email = await new PostalMime().parse(message.raw)

      if (!email.to?.length || !email.to[0].address) {
        throw new Error('No recipients found')
      }

      await createEmail({
        type: 'inbound',
        from: email.from?.address || '',
        subject: email.subject || '',
        rawBody: email.html || email.text || '',
        rawHeaders: email.headers,
        inReplyTo: email.inReplyTo,
        messageId: email.messageId,
        lastEvent: 'received',
        recipients: {
          createMany: {
            data: email.to.map((recipient) => {
              return {
                emailAddress: recipient.address || '',
                role: 'to',
                status: 'received',
              }
            }),
          },
        },
      })
    } catch (error) {
      console.error(error)
      message.setReject('550 Message rejected due to processing error')
    }
  },
} as ExportedHandler<Env>
