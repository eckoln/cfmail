import { Badge, Empty, LayerCard, Table, Text } from '@cloudflare/kumo'
import { ArrowsDownUpIcon } from '@phosphor-icons/react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { CreateWebhookForm } from '@/components/webhooks/create-webhook-form'
import { WebhookActions } from '@/components/webhooks/webhook-actions-button'
import { listWebhooksOptions } from '@/lib/queries/webhooks'

export const Route = createFileRoute('/(app)/webhooks/')({
  component: RouteComponent,
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(listWebhooksOptions())
  },
  head: () => ({
    meta: [
      {
        title: 'Webhooks - cfmail',
      },
    ],
  }),
})

function RouteComponent() {
  const { data: webhooks } = useSuspenseQuery(listWebhooksOptions())

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Text variant="heading1">Webhooks</Text>
        <CreateWebhookForm />
      </div>

      {webhooks.length > 0 ? (
        <LayerCard>
          <Table layout="fixed">
            <Table.Header variant="compact">
              <Table.Row>
                <Table.Head>Endpoint</Table.Head>
                <Table.Head>Status</Table.Head>
                <Table.Head className="text-right">Created</Table.Head>
                <Table.Head className="w-20" />
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {webhooks.map((webhook) => {
                return (
                  <Table.Row key={webhook.id}>
                    <Table.Cell>
                      <Link
                        to="/webhooks/$id"
                        params={{ id: webhook.id }}
                        className="flex items-center gap-3 w-fit hover:underline [&_svg]:text-kumo-strong"
                      >
                        <ArrowsDownUpIcon size={20} />
                        <span>{webhook.url}</span>
                      </Link>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge
                        variant={webhook.isActive ? 'green' : 'red'}
                        className="capitalize"
                      >
                        {webhook.isActive ? 'active' : 'inactive'}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell className="text-right">
                      {new Date(webhook.createdAt).toLocaleString()}
                    </Table.Cell>
                    <Table.Cell className="w-24 place-items-end">
                      <WebhookActions id={webhook.id} />
                    </Table.Cell>
                  </Table.Row>
                )
              })}
            </Table.Body>
          </Table>
        </LayerCard>
      ) : (
        <Empty title="No webhooks found" />
      )}
    </div>
  )
}
