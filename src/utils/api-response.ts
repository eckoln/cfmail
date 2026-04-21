/**
 * Helper function to create a JSON response.
 *
 * @param data The data to include in the response.
 * @param statusCode The HTTP status code.
 * @returns A Response object with the given data.
 */
export function apiResponse<T = unknown>(
  data: {
    status: boolean
    result?: T
    errors?: unknown
  },
  statusCode: number = 200,
): Response {
  return new Response(JSON.stringify(data), {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}
