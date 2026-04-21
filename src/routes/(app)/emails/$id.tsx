import { ClipboardText, LayerCard, Tabs, Text } from '@cloudflare/kumo'
import { EnvelopeIcon } from '@phosphor-icons/react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, notFound } from '@tanstack/react-router'
import React from 'react'
import { getEmailByIdOptions } from '@/lib/queries/emails'

export const Route = createFileRoute('/(app)/emails/$id')({
  component: RouteComponent,
  loader: async ({ context, params }) => {
    try {
      const email = await context.queryClient.ensureQueryData(
        getEmailByIdOptions(params.id),
      )

      return { email }
    } catch {
      throw notFound()
    }
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: `${loaderData?.email?.subject || 'Email'} - cfmail`,
      },
    ],
  }),
})

function RouteComponent() {
  const { id } = Route.useParams()
  const { data: email } = useSuspenseQuery(getEmailByIdOptions(id))
  const [activeTab, setActiveTab] = React.useState<string>('preview')

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <EnvelopeIcon className="text-kumo-strong" size={36} />
          <div>
            <Text variant="secondary">
              {email.type === 'inbound' ? 'Received' : 'Email'}
            </Text>
            <Text variant="heading2">
              {email.type === 'inbound'
                ? email.from
                : email.recipients.length > 1
                  ? 'Multiple Recipients'
                  : email.recipients[0].emailAddress}
            </Text>
          </div>
        </div>
        <ClipboardText text={email.id} />
      </div>

      <div className="grid grid-cols-3 gap-8">
        {[
          {
            label: 'From',
            value: email.from,
          },
          {
            label: 'Subject',
            value: email.subject,
          },
          {
            label: 'To',
            value:
              email.type === 'outbound'
                ? email.recipients.length > 1
                  ? `${email.recipients[0].emailAddress} (+${email.recipients.length - 1})`
                  : email.recipients[0].emailAddress
                : email.recipients[0].emailAddress,
          },
        ].map((card, index) => (
          <LayerCard className="rounded-lg p-4" key={index.toString()}>
            <Text variant="secondary" bold>
              {card.label}
            </Text>
            <Text truncate>{card.value}</Text>
          </LayerCard>
        ))}
      </div>

      <LayerCard>
        <LayerCard.Secondary>
          <Tabs
            className="w-fit"
            variant="underline"
            tabs={[
              { value: 'preview', label: 'Preview' },
              { value: 'raw', label: 'Raw' },
            ]}
            value={activeTab}
            onValueChange={setActiveTab}
          />
        </LayerCard.Secondary>
        <LayerCard.Primary>
          {activeTab === 'preview' ? (
            <iframe
              title="Email Preview"
              className="w-full h-full"
              srcDoc={email.rawBody || ''}
              sandbox="allow-same-origin"
            />
          ) : (
            <pre className="overflow-auto w-full max-h-125">
              <code>{JSON.stringify(email, null, 2)}</code>
            </pre>
          )}
        </LayerCard.Primary>
      </LayerCard>
    </div>
  )
}
