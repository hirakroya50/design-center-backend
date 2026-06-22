import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { SmsController } from './sms.controller';
import { SMS_PROVIDER } from './sms-provider';
import { SmsMock } from './sms-mock';
import { PrismaService } from '../prisma/prisma.service';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('$2b$10$hashedValue'),
  compare: jest.fn(),
}));

describe('SmsController', () => {
  let controller: SmsController;
  let prisma: PrismaService;

  const mockUser = { id: 'user-1', role: 'customer', email: 'test@sms.user' };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SmsController],
      providers: [
        {
          provide: PrismaService,
          useValue: {
            emailOtp: {
              create: jest.fn().mockResolvedValue({ id: 'otp-1' }),
              findFirst: jest.fn(),
              update: jest.fn().mockResolvedValue({}),
            },
            user: {
              upsert: jest.fn().mockResolvedValue(mockUser),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('test-token'),
          },
        },
        {
          provide: SMS_PROVIDER,
          useValue: new SmsMock(),
        },
      ],
    }).compile();

    controller = module.get<SmsController>(SmsController);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('POST /auth/request-otp-sms', () => {
    it('generates OTP and sends SMS', async () => {
      const result = await controller.requestOtpSms({ mobile: '+971500000000' });
      expect(result).toEqual({ ok: true });
      expect(prisma.emailOtp.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: '',
          mobile: '+971500000000',
          codeHash: expect.any(String),
          expiresAt: expect.any(Date),
        }),
      });
    });
  });

  describe('POST /auth/verify-otp-sms', () => {
    it('returns JWT on valid code', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (prisma.emailOtp.findFirst as jest.Mock).mockResolvedValue({
        id: 'otp-1',
        mobile: '+971500000000',
        codeHash: '$2b$10$hashedValue',
        expiresAt: new Date(Date.now() + 600000),
        consumedAt: null,
      });

      const result = await controller.verifyOtpSms({ mobile: '+971500000000', code: '123456' });
      expect(result).toHaveProperty('token', 'test-token');
      expect(result).toHaveProperty('user');
      expect(prisma.emailOtp.update).toHaveBeenCalled();
    });

    it('fails on invalid code', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      (prisma.emailOtp.findFirst as jest.Mock).mockResolvedValue({
        id: 'otp-1',
        mobile: '+971500000000',
        codeHash: '$2b$10$hashedValue',
        expiresAt: new Date(Date.now() + 600000),
        consumedAt: null,
      });

      await expect(controller.verifyOtpSms({ mobile: '+971500000000', code: '000000' })).rejects.toThrow(BadRequestException);
    });

    it('creates user on first login (upsert create path)', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (prisma.emailOtp.findFirst as jest.Mock).mockResolvedValue({
        id: 'otp-1',
        mobile: '+971500000000',
        codeHash: '$2b$10$hashedValue',
        expiresAt: new Date(Date.now() + 600000),
        consumedAt: null,
      });

      const newUser = { id: 'new-user', role: 'customer', email: '+971500000000@sms.user' };
      (prisma.user.upsert as jest.Mock).mockResolvedValue(newUser);

      const result = await controller.verifyOtpSms({ mobile: '+971500000000', code: '123456' });
      expect(result).toHaveProperty('token', 'test-token');
      expect(result.user.id).toBe('new-user');
      expect(prisma.user.upsert).toHaveBeenCalledWith({
        where: { email: '+971500000000@sms.user' },
        update: {},
        create: expect.objectContaining({
          email: '+971500000000@sms.user',
          passwordHash: '',
          role: 'customer',
          profile: { create: { name: 'Mobile User', phone: '+971500000000' } },
        }),
      });
    });

    it('fails on expired code', async () => {
      (prisma.emailOtp.findFirst as jest.Mock).mockResolvedValue({
        id: 'otp-1',
        mobile: '+971500000000',
        codeHash: '$2b$10$hashedValue',
        expiresAt: new Date(Date.now() - 600000),
        consumedAt: null,
      });

      await expect(controller.verifyOtpSms({ mobile: '+971500000000', code: '123456' })).rejects.toThrow(BadRequestException);
    });
  });
});
