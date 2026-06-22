import { Test, TestingModule } from '@nestjs/testing';
import { SmsGreetingController } from './sms-greeting.controller';
import { SMS_PROVIDER, SmsProvider } from './sms-provider';

describe('SmsGreetingController', () => {
  let controller: SmsGreetingController;
  let sms: jest.Mocked<SmsProvider>;

  beforeEach(async () => {
    sms = { send: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SmsGreetingController],
      providers: [{ provide: SMS_PROVIDER, useValue: sms }],
    }).compile();
    controller = module.get<SmsGreetingController>(SmsGreetingController);
  });

  it('should call sms.send with correct phone and "Hiii"', async () => {
    const result = await controller.sendGreeting('9876543210');
    expect(sms.send).toHaveBeenCalledWith('9876543210', 'Hiii');
    expect(result).toEqual({ ok: true, message: 'Sent' });
  });

  it('should throw BadRequestException for invalid phone (non-digits)', async () => {
    await expect(controller.sendGreeting('abc')).rejects.toThrow('Invalid mobile number');
  });

  it('should throw BadRequestException for too-short phone', async () => {
    await expect(controller.sendGreeting('123')).rejects.toThrow('Invalid mobile number');
  });
});
