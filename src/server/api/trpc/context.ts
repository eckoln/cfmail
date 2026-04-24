import { getUser } from '@/lib/queries/user'
import { createDatabase } from '@/server/database/database'

export async function createContext(headers: Headers) {
  const database = createDatabase()
  const user = await getUser(headers)
  return { database, user }
}

export type Context = Awaited<ReturnType<typeof createContext>>
