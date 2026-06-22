import { SmsMock } from './sms-mock';

describe('SmsMock', () => {
  it('logs and resolves without error', async () => {
    const mock = new SmsMock();
    await expect(mock.send('+971500000000', 'Your code is 123456')).resolves.toBeUndefined();
  });
});
