import { Test } from '@nestjs/testing';
import { VisitorsService } from './visitors.service';
import { MailService } from '../mail/mail.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { CRM_PROVIDER } from '../crm/crm-provider';
import { CrmProvider } from '../crm/crm-provider';

describe('VisitorsService.followUp', () => {
  let service: VisitorsService;
  let prisma: { visitor: any; timelineEvent: any };
  let crm: CrmProvider;

  beforeEach(async () => {
    prisma = {
      visitor: {
        findUniqueOrThrow: jest
          .fn()
          .mockResolvedValue({ id: 'v1', stage: 'new', crmExternalId: 'mock-v1' }),
        findUnique: jest.fn().mockResolvedValue({ id: 'v1', stage: 'new', crmExternalId: 'mock-v1' }),
        update: jest
          .fn()
          .mockImplementation(({ data }) =>
            Promise.resolve({ id: 'v1', ...data }),
          ),
        create: jest
          .fn()
          .mockImplementation(({ data }) =>
            Promise.resolve({ id: 'v1', ...data }),
          ),
      },
      timelineEvent: { create: jest.fn().mockResolvedValue({}) },
    };
    crm = {
      syncLead: jest.fn().mockResolvedValue('mock-v1'),
      updateLeadStage: jest.fn().mockResolvedValue(undefined),
      createNote: jest.fn().mockResolvedValue(undefined),
    };
    const mod = await Test.createTestingModule({
      providers: [
        VisitorsService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: MailService,
          useValue: { sendFollowUp: jest.fn(), sendOtp: jest.fn() },
        },
        { provide: NotificationsService, useValue: { create: jest.fn() } },
        { provide: CRM_PROVIDER, useValue: crm },
      ],
    }).compile();
    service = mod.get(VisitorsService);
  });

  it('advances new -> contacted and logs a timeline event', async () => {
    const r = await service.followUp('v1', {
      outcome: 'advance',
      note: 'called, interested',
    });
    expect(r.stage).toBe('contacted');
    expect(prisma.timelineEvent.create).toHaveBeenCalled();
    expect(prisma.visitor.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          stage: 'contacted',
          lastContactedAt: expect.any(Date),
        }),
      }),
    );
  });

  it('sets stage to won on outcome=won', async () => {
    const r = await service.followUp('v1', { outcome: 'won' });
    expect(r.stage).toBe('won');
  });

  it('sets stage to lost with reason on outcome=lost', async () => {
    const r = await service.followUp('v1', {
      outcome: 'lost',
      lostReason: 'budget',
    });
    expect(r.stage).toBe('lost');
    expect(r.lostReason).toBe('budget');
  });

  it('does not change stage on outcome=note', async () => {
    const r = await service.followUp('v1', {
      outcome: 'note',
      note: 'left voicemail',
    });
    expect(r.stage).toBe('new');
  });

  it('advance on terminal stage (won) stays at won', async () => {
    prisma.visitor.findUniqueOrThrow.mockResolvedValue({
      id: 'v1',
      stage: 'won',
    });
    const r = await service.followUp('v1', { outcome: 'advance' });
    expect(r.stage).toBe('won');
  });

  it('calls crm.syncLead after create and persists externalId', async () => {
    await service.create('h1', { fullName: 'Test' });
    expect(crm.syncLead).toHaveBeenCalled();
    expect(prisma.visitor.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ crmExternalId: 'mock-v1' }),
      }),
    );
  });

  it('calls crm.updateLeadStage when stage changes in followUp', async () => {
    await service.followUp('v1', { outcome: 'advance' });
    expect(crm.updateLeadStage).toHaveBeenCalledWith(
      expect.any(String),
      'contacted',
    );
  });

  it('does not call crm.updateLeadStage when stage unchanged', async () => {
    await service.followUp('v1', { outcome: 'note' });
    expect(crm.updateLeadStage).not.toHaveBeenCalled();
  });

  it('calls crm.createNote after addTimelineEvent', async () => {
    await service.addTimelineEvent('v1', {
      label: 'call',
      detail: 'left msg',
    });
    expect(crm.createNote).toHaveBeenCalled();
  });
});
