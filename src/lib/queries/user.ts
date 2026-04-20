import { env } from 'cloudflare:workers'
import { createRemoteJWKSet, jwtVerify } from 'jose'

export async function getUser(headers: Headers) {
  const token = headers.get('CF-Access-JWT-Assertion')
  if (!token) {
    return null
  }

  const JWKS = createRemoteJWKSet(
    new URL(`${env.TEAM_DOMAIN}/cdn-cgi/access/certs`),
  )

  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: env.TEAM_DOMAIN,
      audience: env.POLICY_AUD,
    })
    return { email: payload.email as string }
  } catch {
    return null
  }
}
