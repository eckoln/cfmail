import { Button, DropdownMenu, Loader } from '@cloudflare/kumo'
import { DotsThreeIcon, TrashIcon } from '@phosphor-icons/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  deleteWebhookOptions,
  listWebhooksOptions,
} from '@/lib/queries/webhooks'

export function WebhookActions({ id }: { id: string }) {
  const mutation = useMutation(deleteWebhookOptions())
  const queryClient = useQueryClient()

  function handleDelete() {
    mutation.mutate(id, {
      onSuccess: () => {
        queryClient.invalidateQueries(listWebhooksOptions())
      },
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenu.Trigger
        render={
          <Button
            size="sm"
            shape="square"
            icon={DotsThreeIcon}
            aria-label="Actions"
          />
        }
      />
      <DropdownMenu.Content align="end">
        <DropdownMenu.Item
          variant="danger"
          icon={mutation.isPending ? <Loader /> : TrashIcon}
          disabled={mutation.isPending}
          onClick={handleDelete}
        >
          Delete Webhook
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu>
  )
}
