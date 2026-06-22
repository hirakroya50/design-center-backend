import { ConfigService } from '@nestjs/config';
import { SmsProvider } from './sms-provider';

export class SmsTwilio implements SmsProvider {
  constructor(private config: ConfigService) {}
  async send(phone: string, message: string): Promise<void> {
    console.log(`[SMS Twilio Stub] To: ${phone} — ${message}`);
  }
}
