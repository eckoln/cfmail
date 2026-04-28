import { env } from 'cloudflare:workers'
import crypto from 'node:crypto'
import type { WebhookProviderType } from 'generated/prisma/enums'
import type { WebhookEvent, WebhookPayload } from './webhook'

interface TransformResult {
  body: string
  headers: Headers
}

export class WebhookProvider {
  private readonly baseUrl = env.APP_URL

  constructor(
    private provider: WebhookProviderType,
    private secret: string,
  ) {}

  transform(url: string, payload: WebhookPayload): TransformResult {
    switch (this.provider) {
      case 'discord':
        return this.toDiscord(payload)
      case 'slack':
        return this.toSlack(payload)
      case 'telegram':
        return this.toTelegram(payload, url)
      default:
        return this.toRaw(payload)
    }
  }

  private toRaw(payload: WebhookPayload): TransformResult {
    const body = JSON.stringify(payload)
    const signature = this.generateSignature(body)

    return {
      body,
      headers: new Headers({
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
      }),
    }
  }

  private toDiscord(payload: WebhookPayload): TransformResult {
    const { type, data } = payload

    const body = {
      username: 'CFMAIL - Notification',
      embeds: [
        {
          title: WebhookProvider.titles[type],
          url: `${this.baseUrl}/${data.id}`,
          color: 0xff7800,
          fields: [
            {
              name: 'To',
              value: this.getRecipient(data),
              inline: false,
            },
          ],
          footer: {
            text: `ID: ${data.id}`,
          },
          timestamp: new Date(data.createdAt).toISOString(),
        },
      ],
    }

    return {
      body: JSON.stringify(body),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    }
  }

  private toSlack(payload: WebhookPayload): TransformResult {
    const { type, data } = payload

    const body = {
      attachments: [
        {
          color: '#ff7800',
          title: WebhookProvider.titles[type],
          fields: [
            {
              title: 'To',
              value: this.getRecipient(data),
              short: false,
            },
            {
              title: 'Link',
              value: `${this.baseUrl}/${data.id}`,
              short: false,
            },
          ],
          ts: Math.floor(new Date(data.createdAt).getTime() / 1000),
        },
      ],
    }

    return {
      body: JSON.stringify(body),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    }
  }

  private toTelegram(payload: WebhookPayload, url: string): TransformResult {
    const { type, data } = payload
    const chatId = new URL(url).searchParams.get('chat_id')

    const body = {
      chat_id: chatId,
      text: `<b>${WebhookProvider.titles[type]}</b>\n\n<b>To:</b> ${this.getRecipient(data)}\n<b>Link:</b> ${this.baseUrl}/${data.id}\n<b>Date:</b> ${new Date(data.createdAt).toISOString()}`,
      parse_mode: 'HTML',
    }

    return {
      body: JSON.stringify(body),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    }
  }

  private generateSignature(body: string): string {
    return crypto.createHmac('sha256', this.secret).update(body).digest('hex')
  }

  private getRecipient(data: WebhookPayload['data']): string {
    const first = data.recipients[0]
    if (data.recipients.length > 1) {
      return `${first.emailAddress} (+${data.recipients.length - 1} more)`
    }
    return first.emailAddress
  }

  private static readonly titles: Record<WebhookEvent, string> = {
    'email.received': '📬 New Email Received',
    'email.sent': '📤 Email Sent',
  }
}
