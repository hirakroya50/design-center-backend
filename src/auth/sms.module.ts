import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SMS_PROVIDER } from './sms-provider';
import { SmsMock } from './sms-mock';
import { SmsMsg91 } from './sms-msg91';
import { SmsTwilio } from './sms-twilio';

const SmsProviderFactory = {
  provide: SMS_PROVIDER,
  useFactory: (config: ConfigService) => {
    if (config.get('TWILIO_SID')) return new SmsTwilio(config);
    if (config.get('MSG91_AUTH_KEY')) return new SmsMsg91(config);
    return new SmsMock();
  },
  inject: [ConfigService],
};

@Module({
  imports: [ConfigModule],
  providers: [SmsProviderFactory],
  exports: [SMS_PROVIDER],
})
export class SmsModule {}
