import { CrmMock } from './crm-mock';

describe('CrmMock', () => {
  let crm: CrmMock;

  beforeEach(() => {
    crm = new CrmMock();
  });

  it('syncLead returns mock-{id}', async () => {
    const result = await crm.syncLead({ id: 'v1', fullName: 'Test' });
    expect(result).toBe('mock-v1');
  });

  it('updateLeadStage resolves without error', async () => {
    await expect(
      crm.updateLeadStage('mock-v1', 'won'),
    ).resolves.toBeUndefined();
  });

  it('createNote resolves without error', async () => {
    await expect(
      crm.createNote('mock-v1', 'test note'),
    ).resolves.toBeUndefined();
  });
});
