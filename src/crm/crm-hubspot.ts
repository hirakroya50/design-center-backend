import { CrmProvider } from './crm-provider';

export class CrmHubspot implements CrmProvider {
  async syncLead(_v: any): Promise<string> {
    throw new Error('HubSpot not implemented');
  }

  async updateLeadStage(_id: string, _stage: string): Promise<void> {
    throw new Error('HubSpot not implemented');
  }

  async createNote(_id: string, _note: string): Promise<void> {
    throw new Error('HubSpot not implemented');
  }
}
