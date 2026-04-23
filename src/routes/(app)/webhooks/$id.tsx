import {
  Badge,
  Button,
  Empty,
  LayerCard,
  SensitiveInput,
  Table,
  Text,
} from '@cloudflare/kumo'
import {
  ArrowsDownUpIcon,
  CaretDownIcon,
  CaretRightIcon,
} from '@phosphor-icons/react'
import { useSuspenseQueries } from '@tanstack/react-query'
import { createFileRoute, notFound } from '@tanstack/react-router'
import React, { useState } from 'react'
import {
  getWebhookByIdOptions,
  listWebhookDeliveriesOptions,
} from '@/lib/queries/webhooks'

export const Route = createFileRoute('/(app)/webhooks/$id')({
  component: RouteComponent,
  loader: async ({ context, params }) => {
    try {
      const webhook = await context.queryClient.ensureQueryData(
        getWebhookByIdOptions(params.id),
      )

      await context.queryClient.ensureQueryData(
        listWebhookDeliveriesOptions(params.id),
      )

      return { webhook }
    } catch {
      throw notFound()
    }
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: `${loaderData?.webhook?.url || 'Webhook'} - cfmail`,
      },
    ],
  }),
})

function RouteComponent() {
  const { id } = Route.useParams()

  const [{ data: webhook }, { data: deliveries }] = useSuspenseQueries({
    queries: [getWebhookByIdOptions(id), listWebhookDeliveriesOptions(id)],
  })

  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  const toggleRow = (rowId: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      if (next.has(rowId)) {
        next.delete(rowId)
      } else {
        next.add(rowId)
      }
      return next
    })
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <ArrowsDownUpIcon className="text-kumo-strong" size={36} />
          <div>
            <Text variant="secondary">Webhook</Text>
            <Text variant="heading2">{webhook.url}</Text>
          </div>
        </div>
        <SensitiveInput label="Secret" defaultValue={webhook.secret} />
      </div>

      <div className="grid grid-cols-3 gap-8">
        {[
          {
            label: 'Listening for',
            value: (webhook.events as string[]).join(', '),
          },
          {
            label: 'Status',
            value: (
              <Badge variant={webhook.isActive ? 'green' : 'red'}>
                {webhook.isActive ? 'Active' : 'Inactive'}
              </Badge>
            ),
          },
          {
            label: 'Created',
            value: new Date(webhook.createdAt).toLocaleString(),
          },
        ].map((card, index) => (
          <LayerCard className="p-4 space-y-2" key={index.toString()}>
            <Text variant="secondary" bold>
              {card.label}
            </Text>
            <Text truncate>{card.value}</Text>
          </LayerCard>
        ))}
      </div>

      {deliveries.length > 0 ? (
        <LayerCard>
          <Table>
            <Table.Header variant="compact">
              <Table.Row>
                <Table.Head className="w-16" />
                <Table.Head>ID</Table.Head>
                <Table.Head>Status</Table.Head>
                <Table.Head>Type</Table.Head>
                <Table.Head className="text-right">Sent At</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {deliveries.map((row) => (
                <React.Fragment key={row.id}>
                  <Table.Row>
                    <Table.Cell className="[&_svg]:text-kumo-strong">
                      <Button
                        size="sm"
                        shape="square"
                        icon={
                          expandedRows.has(row.id)
                            ? CaretDownIcon
                            : CaretRightIcon
                        }
                        aria-label="Show details for webhook delivery"
                        onClick={() => toggleRow(row.id)}
                      />
                    </Table.Cell>
                    <Table.Cell>{row.id}</Table.Cell>
                    <Table.Cell>
                      <Text
                        variant={
                          (row.status === 'success' && 'success') ||
                          (row.status === 'failed' && 'error') ||
                          undefined
                        }
                      >
                        {row.httpStatus}
                      </Text>
                    </Table.Cell>
                    <Table.Cell>{row.eventType}</Table.Cell>
                    <Table.Cell className="text-right">
                      {new Date(row.attemptedAt).toLocaleString()}
                    </Table.Cell>
                  </Table.Row>
                  {expandedRows.has(row.id) && (
                    <Table.Row>
                      <Table.Cell colSpan={5}>
                        <pre className="max-h-72 overflow-auto">
                          <code>
                            {JSON.stringify(
                              {
                                ...row,
                                payload: JSON.parse(row.payload as string),
                              },
                              null,
                              2,
                            )}
                          </code>
                        </pre>
                      </Table.Cell>
                    </Table.Row>
                  )}
                </React.Fragment>
              ))}
            </Table.Body>
          </Table>
        </LayerCard>
      ) : (
        <Empty title="No webhook events yet" size="lg" />
      )}
    </div>
  )
}
