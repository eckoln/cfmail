import { env } from 'cloudflare:workers'
import { createRemoteJWKSet, jwtVerify } from 'jose'

export async function getUser(headers: Headers) {
  if (import.meta.env.DEV) {
    return { email: 'user@localhost' }
  }

  const token = headers.get('CF-Access-JWT-Assertion')
  if (!token) {
    throw new Error('Missing required CF Access JWT')
  }

  const JWKS = createRemoteJWKSet(
    new URL('/cdn-cgi/access/certs', env.TEAM_DOMAIN),
  )

  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: env.TEAM_DOMAIN,
      audience: env.POLICY_AUD,
    })
    return { email: payload.email as string }
  } catch {
    throw new Error('Invalid token')
  }
}
