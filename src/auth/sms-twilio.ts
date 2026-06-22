import { ConfigService } from '@nestjs/config';
import { SmsProvider } from './sms-provider';

export class SmsTwilio implements SmsProvider {
  private readonly accountSid: string;
  private readonly authToken: string;
  private readonly from: string;

  constructor(config: ConfigService) {
    this.accountSid = config.getOrThrow<string>('TWILIO_SID');
    this.authToken = config.getOrThrow<string>('TWILIO_AUTH_TOKEN');
    this.from = config.getOrThrow<string>('TWILIO_PHONE');
  }

  async send(phone: string, message: string): Promise<void> {
    const normalized = phone.startsWith('+') ? phone : `+${phone}`;
    const auth = btoa(`${this.accountSid}:${this.authToken}`);

    const body = new URLSearchParams({
      To: normalized,
      From: this.from,
      Body: message,
    });

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      },
    );

    if (!response.ok) {
      const text = await response.text();
      console.error(`[SMS Twilio] Error ${response.status}: ${text}`);
      throw new Error(`Twilio API returned ${response.status}`);
    }
  }
}
