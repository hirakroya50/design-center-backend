import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SMS_PROVIDER } from './sms-provider';
import { SmsMock } from './sms-mock';
import { SmsTwilio } from './sms-twilio';
import { SmsFast2Sms } from './sms-fast2sms';

const SmsProviderFactory = {
  provide: SMS_PROVIDER,
  useFactory: (config: ConfigService) => {
    if (config.get('FAST2SMS_API_KEY')) return new SmsFast2Sms(config);
    if (config.get('TWILIO_SID')) return new SmsTwilio(config);
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
