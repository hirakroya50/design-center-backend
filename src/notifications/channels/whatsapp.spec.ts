import { WhatsappMock } from './whatsapp-mock';

describe('WhatsappMock', () => {
  it('sends without error', async () => {
    const m = new WhatsappMock();
    await expect(m.send('new_lead', 'Test')).resolves.toBeUndefined();
  });
});
