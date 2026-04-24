import { Button, DropdownMenu, Loader } from '@cloudflare/kumo'
import { DotsThreeIcon, TrashIcon } from '@phosphor-icons/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTRPC } from '@/server/api/trpc/client'

export function WebhookActions({ id }: { id: string }) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const mutation = useMutation(trpc.webhooks.delete.mutationOptions())

  async function handleDelete() {
    await mutation.mutateAsync(id, {
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.webhooks.list.queryOptions())
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
