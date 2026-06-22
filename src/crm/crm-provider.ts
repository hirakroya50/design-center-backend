export interface CrmProvider {
  syncLead(visitor: {
    id: string;
    fullName: string;
    email?: string;
    mobile?: string;
    city?: string;
    leadSource?: string;
  }): Promise<string>;
  updateLeadStage(externalId: string, stage: string): Promise<void>;
  createNote(externalId: string, note: string): Promise<void>;
}

export const CRM_PROVIDER = 'CRM_PROVIDER';
