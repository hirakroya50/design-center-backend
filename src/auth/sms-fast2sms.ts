import { ConfigService } from '@nestjs/config';
import { SmsProvider } from './sms-provider';

export class SmsFast2Sms implements SmsProvider {
  private readonly apiKey: string;
  private readonly senderId: string;

  constructor(config: ConfigService) {
    this.apiKey = config.getOrThrow<string>('FAST2SMS_API_KEY');
    this.senderId = config.get<string>('FAST2SMS_SENDER_ID') || 'TXTIND';
  }

  async send(phone: string, message: string): Promise<void> {
    const url = new URL('https://www.fast2sms.com/dev/bulkV2');
    url.searchParams.set('authorization', this.apiKey);
    url.searchParams.set('route', 'v3');
    url.searchParams.set('sender_id', this.senderId);
    url.searchParams.set('message', message);
    url.searchParams.set('language', 'english');
    url.searchParams.set('flash', '0');
    url.searchParams.set('numbers', phone);

    const response = await fetch(url.toString());
    if (!response.ok) {
      const body = await response.text();
      console.error(`[SMS Fast2SMS] Error ${response.status}: ${body}`);
      throw new Error(`Fast2SMS API returned ${response.status}`);
    }
  }
}
