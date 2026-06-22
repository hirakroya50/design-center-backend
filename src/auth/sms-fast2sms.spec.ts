import { ConfigService } from '@nestjs/config';
import { SmsFast2Sms } from './sms-fast2sms';

describe('SmsFast2Sms', () => {
  let provider: SmsFast2Sms;
  let config: ConfigService;

  beforeEach(() => {
    config = new ConfigService({ FAST2SMS_API_KEY: 'test-key', FAST2SMS_SENDER_ID: 'TESTID' });
    provider = new SmsFast2Sms(config);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should call fetch with correct Fast2SMS URL', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true });
    global.fetch = fetchMock;

    await provider.send('9876543210', 'Hiii');

    const calledUrl = fetchMock.mock.calls[0][0] as string;
    expect(calledUrl).toContain('https://www.fast2sms.com/dev/bulkV2');
    expect(calledUrl).toContain('authorization=test-key');
    expect(calledUrl).toContain('numbers=9876543210');
    expect(calledUrl).toContain('message=Hiii');
    expect(calledUrl).toContain('sender_id=TESTID');
  });

  it('should throw when Fast2SMS returns non-ok response', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 401, text: () => 'Unauthorized' });

    await expect(provider.send('9876543210', 'Hiii')).rejects.toThrow();
  });

  it('should throw when API key is missing', () => {
    const badConfig = new ConfigService({});
    expect(() => new SmsFast2Sms(badConfig)).toThrow();
  });
});
