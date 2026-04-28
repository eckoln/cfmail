import { Banner, LayerCard, LinkButton, Table, Text } from '@cloudflare/kumo'
import { CodeHighlighted } from '@cloudflare/kumo/code'
import { InfoIcon } from '@phosphor-icons/react'
import { createFileRoute } from '@tanstack/react-router'

const sendEmailCode = `curl -X POST '${window.location.origin}/emails' \\
  -H "CF-Access-Client-Id: <YOUR_CLIENT_ID>" \\
  -H "CF-Access-Client-Secret: <YOUR_CLIENT_SECRET>" \\
  -H 'Content-Type: application/json' \\
  -d $'{
    "from": "mail@example.com",
    "to": ["recipient@example.com"],
    "subject": "hello world",
    "html": "<p>it works!</p>"
  }'`

export const Route = createFileRoute('/(app)/api/')({
  component: RouteComponent,
  head: () => ({
    meta: [{ title: 'API - cfmail' }],
  }),
})

function RouteComponent() {
  return (
    <div className="space-y-8">
      <Banner
        variant="alert"
        icon={<InfoIcon weight="fill" />}
        title="Important"
        description="CF-Access-Client-Id and CF-Access-Client-Secret headers are required for authentication on every request. These
        credentials are provisioned via Cloudflare Access service tokens."
        action={
          <LinkButton
            size="sm"
            href="https://developers.cloudflare.com/cloudflare-one/access-controls/service-credentials/service-tokens"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn More
          </LinkButton>
        }
      />

      <LayerCard>
        <LayerCard.Secondary>
          <Text variant="heading3">Send Email</Text>
        </LayerCard.Secondary>
        <LayerCard.Primary>
          <CodeHighlighted
            lang="bash"
            code={sendEmailCode}
            showLineNumbers
            showCopyButton
          />
          <Table>
            <Table.Header variant="compact">
              <Table.Row>
                <Table.Head>Parameter</Table.Head>
                <Table.Head>Type</Table.Head>
                <Table.Head>Required</Table.Head>
                <Table.Head>Description</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              <Table.Row>
                <Table.Cell>
                  <code>from</code>
                </Table.Cell>
                <Table.Cell>string | object</Table.Cell>
                <Table.Cell>yes</Table.Cell>
                <Table.Cell>
                  Sender email or{' '}
                  <code>{'{"name":"John","email":"john@example.com"}'}</code>
                </Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.Cell>
                  <code>to</code>
                </Table.Cell>
                <Table.Cell>string | string[]</Table.Cell>
                <Table.Cell>yes</Table.Cell>
                <Table.Cell>Recipient email(s)</Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.Cell>
                  <code>subject</code>
                </Table.Cell>
                <Table.Cell>string</Table.Cell>
                <Table.Cell>yes</Table.Cell>
                <Table.Cell>Email subject line</Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.Cell>
                  <code>html</code>
                </Table.Cell>
                <Table.Cell>string</Table.Cell>
                <Table.Cell>no</Table.Cell>
                <Table.Cell>HTML body content</Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.Cell>
                  <code>text</code>
                </Table.Cell>
                <Table.Cell>string</Table.Cell>
                <Table.Cell>no</Table.Cell>
                <Table.Cell>Plain text body content</Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.Cell>
                  <code>cc</code>
                </Table.Cell>
                <Table.Cell>string | string[]</Table.Cell>
                <Table.Cell>no</Table.Cell>
                <Table.Cell>CC recipient(s)</Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.Cell>
                  <code>bcc</code>
                </Table.Cell>
                <Table.Cell>string | string[]</Table.Cell>
                <Table.Cell>no</Table.Cell>
                <Table.Cell>BCC recipient(s)</Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.Cell>
                  <code>replyTo</code>
                </Table.Cell>
                <Table.Cell>string</Table.Cell>
                <Table.Cell>no</Table.Cell>
                <Table.Cell>Reply-To email address</Table.Cell>
              </Table.Row>
            </Table.Body>
          </Table>
        </LayerCard.Primary>
      </LayerCard>
    </div>
  )
}
