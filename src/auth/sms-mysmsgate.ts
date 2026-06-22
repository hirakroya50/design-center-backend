import { ConfigService } from '@nestjs/config';
import { SmsProvider } from './sms-provider';

export class SmsMySmsGate implements SmsProvider {
  private readonly apiKey: string;

  constructor(config: ConfigService) {
    this.apiKey = config.getOrThrow<string>('MYSMS_GATE_API_KEY');
  }

  async send(phone: string, message: string): Promise<void> {
    const normalizedPhone = phone.startsWith('+') ? phone : `+91${phone}`;

    const response = await fetch('https://mysmsgate.net/api/v1/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to: normalizedPhone, message }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(`[SMS MySMSGate] Error ${response.status}: ${body}`);
      throw new Error(`MySMSGate API returned ${response.status}`);
    }
  }
}
