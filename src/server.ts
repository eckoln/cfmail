import handler from '@tanstack/react-start/server-entry'
import { getUser } from './lib/queries/user'
import { receiveEmail } from './server/emails/receive'
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
              {
                message:
                  'Cloudflare Access must be configured in production. Set POLICY_AUD and TEAM_DOMAIN.',
              },
            ],
          },
          403,
        )
      }

      try {
        await getUser(request.headers)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        return apiResponse(
          { status: false, errors: [{ message }] },
          403,
        )
      }
    }

    return handler.fetch(request)
  },

  async email(message, _env, ctx) {
    try {
      await receiveEmail(message, ctx)
    } catch {
      message.setReject('550 Message rejected due to processing error')
    }
  },

  async queue(batch) {
    await processWebhookBatch(batch as MessageBatch<WebhookQueueMessage>)
  },
} satisfies ExportedHandler<Env>
