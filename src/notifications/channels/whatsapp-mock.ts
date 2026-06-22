import { NotificationChannel } from './channel.interface';

export class WhatsappMock implements NotificationChannel {
  async send(kind: string, title: string, subtitle?: string): Promise<void> {
    console.log(`[WhatsApp Mock] ${kind}: ${title}${subtitle ? ` — ${subtitle}` : ''}`);
  }
}
