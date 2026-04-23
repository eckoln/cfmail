import { env } from 'cloudflare:workers'
import { createFileRoute } from '@tanstack/react-router'
import { createMiddleware } from '@tanstack/react-start'
import { Prisma } from 'generated/prisma/client'
import { z } from 'zod'
import { createEmail } from '@/server/database/queries/emails'
import { triggerWebhook } from '@/server/webhook/webhook'
import { apiResponse } from '@/utils/api-response'

const recipientSchema = z
  .union([z.email(), z.array(z.email()).nonempty()])
  .transform((val) => Array.from(new Set(Array.isArray(val) ? val : [val])))

const schema = z
  .object({
    from: z.union([
      z.email(),
      z.object({
        name: z.string().nonempty(),
        email: z.email(),
      }),
    ]),

    to: recipientSchema,
    cc: recipientSchema.optional().default([]),
    bcc: recipientSchema.optional().default([]),

    subject: z.string().nonempty(),
    html: z.string().optional(),
    text: z.string().optional(),
    replyTo: z.email().optional(),
  })
  .superRefine(({ to, cc, bcc }, ctx) => {
    const total = to.length + cc.length + bcc.length

    if (total > 50) {
      ctx.addIssue({
        code: 'custom',
        message: `Cloudflare limits total recipients to 50. You have ${total}.`,
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
            text: payload.text,
          })

          const recipients = {
            to: payload.to?.map((email) => ({
              emailAddress: email,
              role: 'to' as const,
              status: 'sent' as const,
            })),
            cc: payload.cc?.map((email) => ({
              emailAddress: email,
              role: 'cc' as const,
              status: 'sent' as const,
            })),
            bcc: payload.bcc?.map((email) => ({
              emailAddress: email,
              role: 'bcc' as const,
              status: 'sent' as const,
            })),
          }

          const createdEmail = await createEmail({
            type: 'outbound',
            from:
              typeof payload.from === 'string'
                ? payload.from
                : payload.from.email,
            subject: payload.subject,
            rawBody: payload.html,
            replyTo: payload.replyTo ? [payload.replyTo] : undefined,
            messageId: response.messageId,
            lastEvent: 'sent',
            recipients: {
              createMany: {
                data: [...recipients.to, ...recipients.cc, ...recipients.bcc],
              },
            },
          })

          const { rawHeaders, replyTo, rawBody, ...rest } = createdEmail
          await triggerWebhook('email.sent', rest)

          return apiResponse(
            { status: true, result: { id: createdEmail.id } },
            200,
          )
        } catch (error) {
          if (error instanceof Prisma.PrismaClientKnownRequestError) {
            console.error('CRITICAL: Email sent but DB save failed:', error)
            return apiResponse(
              {
                status: false,
                errors: [
                  'Email was sent but could not be saved to the database.',
                ],
              },
              500,
            )
          } else if (error instanceof Error) {
            console.error('Email send failed:', error.message)
            return apiResponse(
              { status: false, errors: ['Failed to send email'] },
              500,
            )
          }

          return apiResponse(
            { status: false, errors: ['An unexpected error occurred'] },
            500,
          )
        }
      },
    },
  },
})
