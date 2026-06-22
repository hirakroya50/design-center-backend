import { CrmProvider } from './crm-provider';

export class CrmMock implements CrmProvider {
  async syncLead(v: any): Promise<string> {
    return `mock-${v.id}`;
  }

  async updateLeadStage(_id: string, _stage: string): Promise<void> {}

  async createNote(_id: string, _note: string): Promise<void> {}
}
