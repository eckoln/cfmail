import { env } from 'cloudflare:workers'
import { createFileRoute } from '@tanstack/react-router'
import { createMiddleware } from '@tanstack/react-start'
import z from 'zod'
import { createEmail } from '@/server/database/queries/emails'
import { apiResponse } from '@/utils/api-response'

const schema = z
  .object({
    from: z.union([
      z.object({
        name: z.string(),
        email: z.email(),
      }),
      z.email(),
    ]),
    to: z.array(z.email()).min(1),
    cc: z.array(z.email()).optional().default([]),
    bcc: z.array(z.email()).optional().default([]),
    replyTo: z.email().optional(),
    subject: z.string().min(1),
    html: z.string().min(1),
  })
  .superRefine(({ to, cc, bcc }, ctx) => {
    const totalRecipients = to.length + cc.length + bcc.length
    if (totalRecipients > 50) {
      ctx.addIssue({
        code: 'custom',
        message: 'Maximum 50 recipients (to, cc, bcc) allowed.',
        path: ['to', 'cc', 'bcc'],
      })
    }
  })

const validationMiddleware = createMiddleware({ type: 'request' }).server(
  async ({ next, request }) => {
    const payload = await request.json()
    const result = schema.safeParse(payload)

    if (!result.success) {
      return apiResponse({ status: false, errors: result.error.issues }, 400)
    }

    return next({ context: { data: result.data } })
  },
)

export const Route = createFileRoute('/api/emails/')({
  server: {
    middleware: [validationMiddleware],
    handlers: {
      POST: async ({ context }) => {
        const payload = context.data

        try {
          const response = await env.EMAIL.send({
            from: payload.from,
            subject: payload.subject,
            to: payload.to,
            cc: payload.cc,
            bcc: payload.bcc,
            replyTo: payload.replyTo,
            html: payload.html,
          })

          const email = await createEmail({
            type: 'outbound',
            from:
              typeof payload.from === 'string'
                ? payload.from
                : payload.from.email,
            subject: payload.subject,
            rawBody: payload.html,
            replyTo: payload.replyTo ? [payload.replyTo] : undefined,
            messageId: response.messageId,
            lastEvent: 'delivered',
            recipients: {
              createMany: {
                data: [
                  ...payload.to.map((email) => ({
                    emailAddress: email,
                    role: 'to' as const,
                    status: 'delivered' as const,
                  })),
                  ...(payload.cc || []).map((email) => ({
                    emailAddress: email,
                    role: 'cc' as const,
                    status: 'delivered' as const,
                  })),
                  ...(payload.bcc || []).map((email) => ({
                    emailAddress: email,
                    role: 'bcc' as const,
                    status: 'delivered' as const,
                  })),
                ],
              },
            },
          })

          return apiResponse({ status: true, result: { id: email.id } }, 200)
        } catch (error) {
          if (error instanceof Error) {
            console.error(
              'Email sending failed:',
              (error as Error & { code: string }).code,
              error.message,
            )
          }
          return apiResponse(
            { status: false, errors: 'An unknown error occurred' },
            500,
          )
        }
      },
    },
  },
})
