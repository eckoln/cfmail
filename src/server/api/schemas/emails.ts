import { z } from 'zod'

export const recipientSchema = z
  .union([z.email(), z.array(z.email()).nonempty()])
  .transform((val) => Array.from(new Set(Array.isArray(val) ? val : [val])))

export const emailSendSchema = z
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

export type EmailSendInput = z.infer<typeof emailSendSchema>
