export interface NotificationChannel {
  send(kind: string, title: string, subtitle?: string): Promise<void>;
}

export const WHATSAPP_CHANNEL = 'WHATSAPP_CHANNEL';
