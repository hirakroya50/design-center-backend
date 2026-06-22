import {
  BadRequestException,
  Body,
  Controller,
  Inject,
  Post,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { SMS_PROVIDER, SmsProvider } from './sms-provider';

@Controller('auth')
export class SmsController {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    @Inject(SMS_PROVIDER) private sms: SmsProvider,
  ) {}

  @Post('request-otp-sms')
  async requestOtpSms(@Body('mobile') mobile: string) {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const codeHash = await bcrypt.hash(code, 10);
    await this.prisma.emailOtp.create({
      data: { email: '', mobile, codeHash, expiresAt: new Date(Date.now() + 10 * 60 * 1000) },
    });
    await this.sms.send(mobile, `Your Design Center code is: ${code}`);
    return { ok: true };
  }

  @Post('verify-otp-sms')
  async verifyOtpSms(
    @Body('mobile') mobile: string,
    @Body('code') code: string,
  ) {
    const otp = await this.prisma.emailOtp.findFirst({
      where: { mobile, consumedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    if (!otp || otp.expiresAt < new Date()) throw new BadRequestException('Code expired');
    const valid = await bcrypt.compare(code, otp.codeHash);
    if (!valid) throw new BadRequestException('Invalid code');
    await this.prisma.emailOtp.update({
      where: { id: otp.id },
      data: { consumedAt: new Date() },
    });
    let user = await this.prisma.user.findFirst({
      where: { profile: { phone: mobile } },
    });
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: `${mobile}@sms.user`,
          passwordHash: '',
          role: 'customer',
          profile: { create: { name: 'Mobile User', phone: mobile } },
        },
      });
    }
    const token = this.jwt.sign({ sub: user.id, role: user.role, email: user.email });
    return { token, user: { id: user.id, role: user.role } };
  }
}
