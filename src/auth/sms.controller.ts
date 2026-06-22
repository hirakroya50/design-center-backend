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
import { RequestOtpSmsDto } from './dto/request-otp-sms.dto';
import { VerifyOtpSmsDto } from './dto/verify-otp-sms.dto';

@Controller('auth')
export class SmsController {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    @Inject(SMS_PROVIDER) private sms: SmsProvider,
  ) {}

  @Post('request-otp-sms')
  async requestOtpSms(@Body() dto: RequestOtpSmsDto) {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const codeHash = await bcrypt.hash(code, 10);
    await this.prisma.emailOtp.create({
      data: { email: '', mobile: dto.mobile, codeHash, expiresAt: new Date(Date.now() + 10 * 60 * 1000) },
    });
    await this.sms.send(dto.mobile, `Your Design Center code is: ${code}`);
    return { ok: true };
  }

  @Post('verify-otp-sms')
  async verifyOtpSms(@Body() dto: VerifyOtpSmsDto) {
    const otp = await this.prisma.emailOtp.findFirst({
      where: { mobile: dto.mobile, consumedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    if (!otp || otp.expiresAt < new Date()) throw new BadRequestException('Code expired');
    const valid = await bcrypt.compare(dto.code, otp.codeHash);
    if (!valid) throw new BadRequestException('Invalid code');
    await this.prisma.emailOtp.update({
      where: { id: otp.id },
      data: { consumedAt: new Date() },
    });
    const user = await this.prisma.user.upsert({
      where: { email: `${dto.mobile}@sms.user` },
      update: {},
      create: {
        email: `${dto.mobile}@sms.user`,
        passwordHash: '',
        role: 'customer',
        profile: { create: { name: 'Mobile User', phone: dto.mobile } },
      },
    });
    const token = this.jwt.sign({ sub: user.id, role: user.role, email: user.email });
    return { token, user: { id: user.id, role: user.role } };
  }
}
