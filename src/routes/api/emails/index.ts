import { env } from 'cloudflare:workers'
import { createFileRoute } from '@tanstack/react-router'
import { createMiddleware } from '@tanstack/react-start'
import z from 'zod'
import { createEmail } from '@/server/database/queries/emails'
import { apiResponse } from '@/utils/api-response'

const schema = z
  .object({
    from: z.email().min(1),
    to: z.array(z.email()).min(1),
    cc: z.array(z.email()).optional().default([]),
    bcc: z.array(z.email()).optional().default([]),
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
        try {
          const sendResults = await Promise.all(
            context.data.to.map(async (email) => {
              try {
                await env.EMAIL.send({
                  to: email,
                  from: context.data.from,
                  subject: context.data.subject,
                  html: context.data.html,
                })
                return { emailAddress: email }
              } catch (error) {
                return {
                  emailAddress: email,
                  error: error instanceof Error ? error.message : String(error),
                }
              }
            }),
          )

          const deliveredCount = sendResults.filter((r) => !r.error).length
          const failedCount = sendResults.filter((r) => r.error).length

          const result = await createEmail({
            type: 'outbound',
            from: context.data.from,
            subject: context.data.subject,
            rawBody: context.data.html,
            lastEvent: deliveredCount > failedCount ? 'delivered' : 'failed',
            recipients: {
              createMany: {
                data: sendResults.map((r) => ({
                  emailAddress: r.emailAddress,
                  role: 'to',
                  status: r.error ? 'failed' : 'delivered',
                })),
              },
            },
          })

          return apiResponse({ status: true, result: { id: result.id } }, 201)
        } catch {
          return apiResponse(
            { status: false, errors: 'An unknown error occurred' },
            500,
          )
        }
      },
    },
  },
})
