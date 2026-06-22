import { CrmProvider } from './crm-provider';

export class CrmHubspot implements CrmProvider {
  private base = 'https://api.hubapi.com/crm/v3';

  constructor(private apiKey: string) {}

  async syncLead(v: {
    id: string;
    fullName: string;
    email?: string;
    mobile?: string;
    city?: string;
    leadSource?: string;
  }): Promise<string> {
    const properties: Record<string, string> = {
      firstname: v.fullName.split(' ')[0] || v.fullName,
      lastname: v.fullName.split(' ').slice(1).join(' ') || '.',
      hs_lead_status: 'NEW',
    };
    if (v.email) properties.email = v.email;
    if (v.mobile) properties.phone = v.mobile;
    if (v.city) properties.city = v.city;
    if (v.leadSource) properties.hs_analytics_source = v.leadSource;

    const res = await fetch(`${this.base}/objects/contacts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({ properties }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`HubSpot syncLead failed (${res.status}): ${body}`);
    }

    const data = (await res.json()) as { id: string };
    return `hubspot-${data.id}`;
  }

  async updateLeadStage(externalId: string, stage: string): Promise<void> {
    const hubspotId = externalId.replace('hubspot-', '');
    const pipelineStage = this.mapStage(stage);

    const res = await fetch(`${this.base}/objects/contacts/${hubspotId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        properties: { hs_lead_status: pipelineStage },
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`HubSpot updateLeadStage failed (${res.status}): ${body}`);
    }
  }

  async createNote(_externalId: string, _note: string): Promise<void> {
    console.log('[HubSpot Note] skipped — notes scope not configured');
  }

  private mapStage(stage: string): string {
    const map: Record<string, string> = {
      new: 'NEW',
      contacted: 'CONTACTED',
      consultation: 'APPOINTMENT_SCHEDULED',
      won: 'CLOSED_WON',
      lost: 'CLOSED_LOST',
    };
    return map[stage] ?? 'NEW';
  }
}
