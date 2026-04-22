import { Badge, Empty, LayerCard, Table } from '@cloudflare/kumo'
import { EnvelopeIcon } from '@phosphor-icons/react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
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
        <LayerCard>
          <Table layout="fixed">
            <colgroup>
              <col />
              <col className="w-24 text-left" />
              <col />
              <col />
            </colgroup>
            <Table.Header variant="compact">
              <Table.Row>
                <Table.Head>To</Table.Head>
                <Table.Head>Status</Table.Head>
                <Table.Head>Subject</Table.Head>
                <Table.Head className="text-right">Sent</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {emails.map((email) => {
                const recipients = email.recipients
                  .filter((r) => r.role === 'to')
                  .map((r) => r.emailAddress)

                return (
                  <Table.Row key={email.id}>
                    <Table.Cell>
                      <Link
                        to="/emails/$id"
                        params={{ id: email.id }}
                        className="flex items-center gap-3 w-fit hover:underline [&>svg]:text-kumo-strong"
                      >
                        <EnvelopeIcon size={20} />
                        <span>
                          {recipients.length > 1
                            ? `${recipients[0]} (+${recipients.length - 1})`
                            : recipients[0]}
                        </span>
                      </Link>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge
                        variant={
                          (email.lastEvent === 'sent' && 'outline') ||
                          (email.lastEvent === 'delivered' && 'green') ||
                          (email.lastEvent === 'failed' && 'red') ||
                          undefined
                        }
                        className="capitalize"
                      >
                        {email.lastEvent.toLocaleLowerCase()}
                      </Badge>
                    </Table.Cell>
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
        <Empty title="No sent emails yet" />
      )}
    </div>
  )
}
