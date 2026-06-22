import { CrmHubspot } from './crm-hubspot';

describe('CrmHubspot', () => {
  const mockFetch = jest.fn();
  global.fetch = mockFetch;

  beforeEach(() => {
    jest.resetAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ id: '123' }),
      text: async () => '',
    });
  });

  it('syncLead creates contact and returns hubspot-{id}', async () => {
    const hubspot = new CrmHubspot('test-key');
    const result = await hubspot.syncLead({
      id: 'visitor-1',
      fullName: 'John Doe',
      email: 'john@test.com',
      mobile: '+971500000000',
    });

    expect(result).toBe('hubspot-123');
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.hubapi.com/crm/v3/objects/contacts',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-key',
        }),
        body: expect.stringContaining('"firstname":"John"'),
      }),
    );
  });

  it('updateLeadStage patches contact lead status', async () => {
    const hubspot = new CrmHubspot('test-key');
    await hubspot.updateLeadStage('hubspot-456', 'contacted');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.hubapi.com/crm/v3/objects/contacts/456',
      expect.objectContaining({
        method: 'PATCH',
        body: expect.stringContaining('"hs_lead_status":"CONTACTED"'),
      }),
    );
  });

  it('syncLead throws on API error', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => 'Bad request',
    });

    const hubspot = new CrmHubspot('test-key');
    await expect(hubspot.syncLead({ id: 'v1', fullName: 'Test' })).rejects.toThrow(
      'HubSpot syncLead failed (400): Bad request',
    );
  });
});
