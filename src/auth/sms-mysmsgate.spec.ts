import { ConfigService } from '@nestjs/config';
import { SmsMySmsGate } from './sms-mysmsgate';

describe('SmsMySmsGate', () => {
  let provider: SmsMySmsGate;

  beforeEach(() => {
    const config = new ConfigService({ MYSMS_GATE_API_KEY: 'test-key' });
    provider = new SmsMySmsGate(config);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should call fetch with correct MySMSGate URL and headers', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, status: 202 });
    global.fetch = fetchMock;

    await provider.send('9002297603', 'Hiii');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, opts] = fetchMock.mock.calls[0];
    expect(url).toBe('https://mysmsgate.net/api/v1/send');
    expect(opts.method).toBe('POST');
    expect(opts.headers.Authorization).toBe('Bearer test-key');
    expect(JSON.parse(opts.body)).toEqual({ to: '+919002297603', message: 'Hiii' });
  });

  it('should not add +91 prefix if already has +', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, status: 202 });
    global.fetch = fetchMock;

    await provider.send('+447700900000', 'Hiii');

    expect(JSON.parse(fetchMock.mock.calls[0][1].body).to).toBe('+447700900000');
  });

  it('should throw when API returns non-ok response', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 401, text: () => 'Unauthorized' });

    await expect(provider.send('9002297603', 'Hiii')).rejects.toThrow();
  });

  it('should throw when API key is missing', () => {
    const badConfig = new ConfigService({});
    expect(() => new SmsMySmsGate(badConfig)).toThrow();
  });
});
