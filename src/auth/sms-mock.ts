import { SmsProvider } from './sms-provider';

export class SmsMock implements SmsProvider {
  async send(phone: string, message: string): Promise<void> {
    console.log(`[SMS Mock] To: ${phone} — ${message}`);
  }
}
