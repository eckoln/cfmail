import { createMiddleware } from '@tanstack/react-start'
import { emailSendSchema } from '@/server/api/schemas/emails'
import { apiResponse } from '@/utils/api-response'

export const validationMiddleware = createMiddleware({
  type: 'request',
}).server(async ({ next, request }) => {
  const payload = await request.json()
  const result = emailSendSchema.safeParse(payload)

  if (!result.success) {
    return apiResponse(
      {
        status: false,
        errors: result.error.issues.map((issue) => ({
          message: issue.message,
          path: issue.path,
        })),
      },
      400,
    )
  }

  return next({ context: { data: result.data } })
})
