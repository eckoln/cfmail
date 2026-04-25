import { createFileRoute } from '@tanstack/react-router'
import { validationMiddleware } from '@/server/api/rest/emails/middleware/validation'
import { sendEmail } from '@/server/api/rest/emails/send'
import { apiResponse } from '@/utils/api-response'

export const Route = createFileRoute('/api/emails/')({
  server: {
    middleware: [validationMiddleware],
    handlers: {
      POST: async ({ context }) => {
        try {
          const email = await sendEmail(context.data)
          return apiResponse({ status: true, result: { id: email.id } }, 200)
        } catch (error) {
          return apiResponse(
            {
              status: false,
              errors: [
                {
                  message:
                    error instanceof Error ? error.message : 'Unknown error',
                },
              ],
            },
            500,
          )
        }
      },
    },
  },
})
