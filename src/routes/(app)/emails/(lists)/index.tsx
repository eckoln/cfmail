import { EnvelopeIcon } from '@phosphor-icons/react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Badge } from '@/components/ui/badge'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { listEmailsOptions } from '@/lib/queries/emails'

export const Route = createFileRoute('/(app)/emails/(lists)/')({
  component: RouteComponent,
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(listEmailsOptions('outbound'))
  },
})

function RouteComponent() {
  const { data: emails } = useSuspenseQuery(listEmailsOptions('outbound'))

  return (
    <div>
      {emails.length > 0 ? (
        <Table className="rounded-lg overflow-hidden">
          <TableHeader className="bg-muted ">
            <TableRow>
              <TableHead>To</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead className="text-right">Sent</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {emails.map((email) => {
              const recipients = email.recipients
                .filter((r) => r.role === 'to')
                .map((r) => r.emailAddress)

              return (
                <TableRow key={email.id}>
                  <TableCell>
                    <Link
                      to="/emails/$id"
                      params={{ id: email.id }}
                      className="flex items-center gap-3 w-fit hover:underline"
                    >
                      <div className="flex size-7 items-center justify-center rounded-md bg-primary">
                        <EnvelopeIcon size={20} />
                      </div>
                      <span>
                        {recipients.length > 1
                          ? `${recipients[0]} (+${recipients.length - 1})`
                          : recipients[0]}
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge className="capitalize">
                      {email.lastEvent?.toLocaleLowerCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>{email.subject}</TableCell>
                  <TableCell className="text-right">
                    {new Date(email.createdAt).toLocaleString()}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      ) : (
        <Empty className="border border-dashed rounded-lg py-12">
          <EmptyHeader>
            <EmptyTitle>No sent emails yet</EmptyTitle>
            <EmptyDescription>
              Send your first email to get started.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </div>
  )
}
