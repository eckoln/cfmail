import { EnvelopeIcon } from '@phosphor-icons/react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
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

export const Route = createFileRoute('/(app)/emails/(lists)/receiving')({
  component: RouteComponent,
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(listEmailsOptions('inbound'))
  },
})

function RouteComponent() {
  const { data: emails } = useSuspenseQuery(listEmailsOptions('inbound'))

  return (
    <div>
      {emails.length > 0 ? (
        <Table className="rounded-lg overflow-hidden">
          <TableHeader className="bg-muted ">
            <TableRow>
              <TableHead>From</TableHead>
              <TableHead>To</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead className="text-right">Received</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {emails.map((email) => {
              const recipients = email.recipients
                .map((r) => r.emailAddress)
                .join(', ')
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
                      <span>{email.from}</span>
                    </Link>
                  </TableCell>
                  <TableCell>{recipients}</TableCell>
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
            <EmptyTitle>No received emails yet</EmptyTitle>
            <EmptyDescription>
              Receive emails at [EMAIL_ADDRESS]
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </div>
  )
}
