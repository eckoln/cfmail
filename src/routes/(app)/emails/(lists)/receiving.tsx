import { Empty, LayerCard, Table } from '@cloudflare/kumo'
import { EnvelopeIcon } from '@phosphor-icons/react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useTRPC } from '@/server/api/trpc/client'

export const Route = createFileRoute('/(app)/emails/(lists)/receiving')({
  component: RouteComponent,
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(
      context.trpc.emails.list.queryOptions('inbound'),
    )
  },
})

function RouteComponent() {
  const trpc = useTRPC()

  const { data: emails } = useSuspenseQuery(
    trpc.emails.list.queryOptions('inbound', { refetchInterval: 5000 }),
  )

  return (
    <div>
      {emails.length > 0 ? (
        <LayerCard>
          <Table layout="fixed">
            <Table.Header variant="compact">
              <Table.Row>
                <Table.Head>From</Table.Head>
                <Table.Head>To</Table.Head>
                <Table.Head>Subject</Table.Head>
                <Table.Head className="text-right">Received</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {emails.map((email) => {
                const recipient = email.recipients.filter(
                  (r) => r.role === 'to',
                )[0]

                return (
                  <Table.Row key={email.id}>
                    <Table.Cell>
                      <Link
                        to="/emails/$id"
                        params={{ id: email.id }}
                        className="flex items-center gap-3 w-fit hover:underline [&>svg]:text-kumo-strong"
                      >
                        <EnvelopeIcon size={20} />
                        <span>{email.from}</span>
                      </Link>
                    </Table.Cell>
                    <Table.Cell>{recipient.emailAddress}</Table.Cell>
                    <Table.Cell>{email.subject}</Table.Cell>
                    <Table.Cell className="text-right">
                      {new Date(email.createdAt).toLocaleString()}
                    </Table.Cell>
                  </Table.Row>
                )
              })}
            </Table.Body>
          </Table>
        </LayerCard>
      ) : (
        <Empty title="No received emails yet" />
      )}
    </div>
  )
}
