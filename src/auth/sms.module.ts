import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SMS_PROVIDER } from './sms-provider';
import { SmsMock } from './sms-mock';
import { SmsTwilio } from './sms-twilio';

const SmsProviderFactory = {
  provide: SMS_PROVIDER,
  useFactory: (config: ConfigService) => {
    return config.get('TWILIO_SID') ? new SmsTwilio(config) : new SmsMock();
  },
  inject: [ConfigService],
};

@Module({
  imports: [ConfigModule],
  providers: [SmsProviderFactory],
  exports: [SMS_PROVIDER],
})
export class SmsModule {}
