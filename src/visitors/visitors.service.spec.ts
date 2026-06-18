import { Test } from '@nestjs/testing';
import { VisitorsService } from './visitors.service';
import { PrismaService } from '../prisma/prisma.service';

describe('VisitorsService.followUp', () => {
  let service: VisitorsService;
  let prisma: { visitor: any; timelineEvent: any };

  beforeEach(async () => {
    prisma = {
      visitor: {
        findUniqueOrThrow: jest
          .fn()
          .mockResolvedValue({ id: 'v1', stage: 'new' }),
        update: jest
          .fn()
          .mockImplementation(({ data }) =>
            Promise.resolve({ id: 'v1', ...data }),
          ),
      },
      timelineEvent: { create: jest.fn().mockResolvedValue({}) },
    };
    const mod = await Test.createTestingModule({
      providers: [
        VisitorsService,
        { provide: PrismaService, useValue: prisma },
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
});
