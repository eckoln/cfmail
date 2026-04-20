import { queryOptions } from '@tanstack/react-query'
import { createServerFn } from '@tanstack/react-start'
import type { EmailType } from 'generated/prisma/enums'
import {
  getEmailById,
  listEmailsByType,
} from '@/server/database/queries/emails'

export const listEmailsFn = createServerFn()
  .inputValidator((type: EmailType) => type)
  .handler(async ({ data: type }) => {
    return listEmailsByType(type)
  })

export const getEmailByIdFn = createServerFn()
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) => {
    return getEmailById(id)
  })

export function listEmailsOptions(type: EmailType) {
  return queryOptions({
    queryKey: ['emails', type],
    queryFn: () => listEmailsFn({ data: type }),
    refetchInterval: 5000,
  })
}

export function getEmailByIdOptions(id: string) {
  return queryOptions({
    queryKey: ['emails', id],
    queryFn: () => getEmailByIdFn({ data: id }),
    staleTime: 60 * 1000 * 60, // 1 hour
  })
}
