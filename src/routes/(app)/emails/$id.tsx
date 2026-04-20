import { EnvelopeIcon } from '@phosphor-icons/react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, notFound } from '@tanstack/react-router'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-6">
        <div className="flex size-14 items-center justify-center rounded-xl bg-primary">
          <EnvelopeIcon size={36} />
        </div>
        <div className="space-y-2">
          <h6 className="text-sm font-medium leading-none text-muted-foreground">
            {email.type === 'inbound' ? 'Received' : 'Email'}
          </h6>
          <h1 className="font-semibold text-2xl leading-none">
            {email.type === 'inbound'
              ? email.from
              : email.recipients.length > 1
                ? 'Multiple Recipients'
                : email.recipients[0].emailAddress}
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6">
        <div className="space-y-2">
          <h6 className="text-sm font-medium leading-none text-muted-foreground">
            From
          </h6>
          <p className="text-sm leading-none">{email.from}</p>
        </div>
        <div className="space-y-2">
          <h6 className="text-sm font-medium leading-none text-muted-foreground">
            Subject
          </h6>
          <p className="text-sm leading-none">{email.subject}</p>
        </div>
        <div className="space-y-2">
          <h6 className="text-sm font-medium leading-none text-muted-foreground">
            To
          </h6>
          <p className="text-sm leading-none">
            {email.type === 'outbound'
              ? email.recipients.length > 1
                ? `${email.recipients[0].emailAddress} (+${email.recipients.length - 1})`
                : email.recipients[0].emailAddress
              : email.recipients[0].emailAddress}
          </p>
        </div>
        <div className="space-y-2">
          <h6 className="text-sm font-medium leading-none text-muted-foreground">
            ID
          </h6>
          <p className="text-sm leading-none">{email.id}</p>
        </div>
      </div>

      <Card>
        <CardContent>
          <Tabs className="gap-4" defaultValue="preview">
            <TabsList>
              <TabsTrigger value="preview">Prevew</TabsTrigger>
              <TabsTrigger value="raw">Raw</TabsTrigger>
            </TabsList>
            <TabsContent value="preview" className="overflow-auto max-h-123">
              <iframe
                title="Email Content"
                width="100%"
                height="100%"
                srcDoc={email.rawBody || ''}
                sandbox="allow-popups"
              />
            </TabsContent>
            <TabsContent value="raw" className="overflow-auto max-h-123">
              <pre>
                <code>{JSON.stringify(email, null, 2)}</code>
              </pre>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
