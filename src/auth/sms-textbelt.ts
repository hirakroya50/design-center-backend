import { SmsProvider } from './sms-provider';

export class SmsTextBelt implements SmsProvider {
  async send(phone: string, message: string): Promise<void> {
    const normalized = phone.startsWith('+') ? phone : `+${phone}`;

    const response = await fetch('https://textbelt.com/text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: normalized, message, key: 'textbelt' }),
    });

    const data = await response.json();
    if (!data.success) {
      console.error(`[SMS TextBelt] Error: ${JSON.stringify(data)}`);
      throw new Error(data.error || 'TextBelt API returned error');
    }
  }
}
