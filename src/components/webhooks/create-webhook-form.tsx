import { Button, Dialog, Input, Select } from '@cloudflare/kumo'
import { PlusIcon, XIcon } from '@phosphor-icons/react'
import { useForm } from '@tanstack/react-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import z from 'zod'
import { useTRPC } from '@/server/api/trpc/client'

export const formSchema = z.object({
  provider: z.enum(['raw', 'discord', 'slack', 'telegram']),
  endpoint: z.url().nonempty(),
  eventTypes: z.array(z.string()).nonempty(),
})

export function CreateWebhookForm() {
  const trpc = useTRPC()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const mutation = useMutation(
    trpc.webhooks.create.mutationOptions({
      onSuccess: (data) => {
        queryClient.invalidateQueries(trpc.webhooks.list.queryOptions())
        navigate({ to: '/webhooks/$id', params: { id: data.id } })
      },
    }),
  )

  const form = useForm({
    defaultValues: {
      provider: 'raw',
      endpoint: '',
      eventTypes: [],
    } as z.infer<typeof formSchema>,
    validators: { onChange: formSchema },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync(value)
    },
  })

  return (
    <Dialog.Root>
      <Dialog.Trigger
        render={(p) => (
          <Button icon={PlusIcon} {...p}>
            Add Webhook
          </Button>
        )}
      />
      <Dialog className="flex flex-col gap-4 p-4 w-full sm:w-full sm:max-w-lg">
        <div className="flex items-start justify-between gap-4">
          <Dialog.Title className="text-lg font-semibold">
            Add Webhook
          </Dialog.Title>
          <Dialog.Close
            aria-label="Close"
            render={(props) => (
              <Button
                {...props}
                variant="secondary"
                shape="square"
                size="sm"
                icon={XIcon}
                aria-label="Close"
              />
            )}
          />
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
        >
          <div className="flex flex-col gap-4">
            <form.Field name="provider">
              {(field) => {
                return (
                  <Select
                    name={field.name}
                    label="Provider"
                    className="w-full"
                    items={[
                      { label: 'Raw', value: 'raw' },
                      { label: 'Discord', value: 'discord' },
                      { label: 'Slack', value: 'slack' },
                      { label: 'Telegram', value: 'telegram' },
                    ]}
                    description={
                      field.state.value === 'telegram'
                        ? 'Example: https://api.telegram.org/bot<TOKEN>/sendMessage?chat_id=<ID>'
                        : null
                    }
                    value={field.state.value}
                    onValueChange={(value) => field.setValue(value as any)}
                    required
                  />
                )
              }}
            </form.Field>

            <form.Field name="endpoint">
              {(field) => {
                return (
                  <Input
                    name={field.name}
                    type="url"
                    label="Endpoint URL"
                    className="w-full"
                    placeholder="https://"
                    value={field.state.value}
                    onChange={(e) => field.setValue(e.target.value)}
                    required
                  />
                )
              }}
            </form.Field>

            <form.Field name="eventTypes" mode="array">
              {(field) => {
                return (
                  <Select
                    name={field.name}
                    label="Events types"
                    className="w-full"
                    items={{
                      'email.sent': 'email.sent',
                      'email.received': 'email.received',
                    }}
                    value={field.state.value}
                    onValueChange={(e) => field.setValue(e)}
                    error={field.state.meta.errors[0]?.message}
                    multiple
                    required
                  />
                )
              }}
            </form.Field>

            <div className="flex justify-start">
              <Button
                type="submit"
                variant="primary"
                icon={PlusIcon}
                loading={mutation.isPending}
              >
                Add
              </Button>
            </div>
          </div>
        </form>
      </Dialog>
    </Dialog.Root>
  )
}
