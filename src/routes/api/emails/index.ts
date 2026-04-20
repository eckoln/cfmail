import { env } from 'cloudflare:workers'
import { createFileRoute } from '@tanstack/react-router'
import { createMiddleware } from '@tanstack/react-start'
import z from 'zod'
import { createEmail } from '@/server/database/queries/emails'

const schema = z.object({
  from: z.email(),
  to: z.array(z.email()).max(25),
  subject: z.string(),
  html: z.string(),
})

const validationMiddleware = createMiddleware({ type: 'request' }).server(
  async ({ next, request }) => {
    const payload = await request.json()
    const result = schema.safeParse(payload)
    if (!result.success) {
      return new Response(
        JSON.stringify({ success: false, errors: result.error.issues }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      )
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
                console.error(`Failed to send email to ${email}:`, error)
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

          return new Response(
            JSON.stringify({
              success: true,
              result: {
                id: result.id,
              },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          )
        } catch (error) {
          console.error(error)
          return new Response(
            JSON.stringify({
              success: false,
              error: 'An unknown error occurred',
            }),
            { status: 500, headers: { 'Content-Type': 'application/json' } },
          )
        }
      },
    },
  },
})
