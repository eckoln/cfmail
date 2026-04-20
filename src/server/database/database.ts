import { env } from 'cloudflare:workers'
import { PrismaD1 } from '@prisma/adapter-d1'
import { PrismaClient } from 'generated/prisma/client'

export function createDatabase() {
  return new PrismaClient({
    adapter: new PrismaD1(env.DATABASE),
  })
}
