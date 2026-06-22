import { ConfigService } from '@nestjs/config';
import { SmsProvider } from './sms-provider';

export class SmsMsg91 implements SmsProvider {
  private readonly authKey: string;

  constructor(config: ConfigService) {
    this.authKey = config.getOrThrow<string>('MSG91_AUTH_KEY');
  }

  async send(phone: string, message: string): Promise<void> {
    let mobile = phone.replace(/^\+/, '');
    if (!mobile.startsWith('91')) mobile = `91${mobile}`;

    const url = new URL('https://api.msg91.com/api/sendhttp.php');
    url.searchParams.set('authkey', this.authKey);
    url.searchParams.set('mobiles', mobile);
    url.searchParams.set('message', message);
    url.searchParams.set('sender', 'TESTIN');
    url.searchParams.set('route', '4');
    url.searchParams.set('country', '91');

    console.log(`[SMS MSG91] Sending to ${mobile}...`);
    const response = await fetch(url.toString());
    const text = await response.text();
    console.log(`[SMS MSG91] Response: ${text}`);
    if (!response.ok || text.startsWith('ERR')) {
      console.error(`[SMS MSG91] Error ${response.status}: ${text}`);
      throw new Error(`MSG91 API returned error: ${text}`);
    }
  }
}
