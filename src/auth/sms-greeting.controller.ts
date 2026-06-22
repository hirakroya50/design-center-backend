import { BadRequestException, Controller, Get, Inject, Param } from '@nestjs/common';
import { SMS_PROVIDER, SmsProvider } from './sms-provider';

@Controller('sms')
export class SmsGreetingController {
  constructor(
    @Inject(SMS_PROVIDER) private sms: SmsProvider,
  ) {}

  @Get(':mobileNo')
  async sendGreeting(@Param('mobileNo') mobileNo: string) {
    if (!/^\d{10,15}$/.test(mobileNo)) {
      throw new BadRequestException('Invalid mobile number');
    }
    await this.sms.send(mobileNo, 'Hiii');
    return { ok: true, message: 'Sent' };
  }
}
