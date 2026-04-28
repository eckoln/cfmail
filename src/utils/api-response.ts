export interface ApiError {
  message: string
  path?: (string | number | symbol)[]
}

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
    errors?: ApiError[]
  },
  statusCode: number = 200,
): Response {
  return Response.json(data, { status: statusCode })
}
