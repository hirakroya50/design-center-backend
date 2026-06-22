import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService, CreateNotificationInput } from './notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { WHATSAPP_CHANNEL } from './channels/channel.interface';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: PrismaService;
  let whatsapp: { send: jest.Mock };

  const mockPrisma = {
    notification: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockWhatsapp = { send: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: WHATSAPP_CHANNEL, useValue: mockWhatsapp },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    prisma = module.get<PrismaService>(PrismaService);
    whatsapp = module.get<{ send: jest.Mock }>(WHATSAPP_CHANNEL);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a notification with all fields', async () => {
      const input: CreateNotificationInput = {
        kind: 'consultation',
        title: 'New consultation',
        subtitle: 'You have a new consultation request',
        visitorId: 'visitor-1',
      };
      const notification = { id: 'n1', ...input };
      mockPrisma.notification.create.mockResolvedValue(notification);

      const result = await service.create(input);

      expect(result).toEqual(notification);
      expect(mockPrisma.notification.create).toHaveBeenCalledWith({
        data: {
          kind: 'consultation',
          title: 'New consultation',
          subtitle: 'You have a new consultation request',
          visitorId: 'visitor-1',
        },
      });
    });

    it('should create a notification with minimal fields', async () => {
      const input: CreateNotificationInput = {
        kind: 'alert',
        title: 'Alert',
      };
      const notification = { id: 'n2', kind: 'alert', title: 'Alert', subtitle: undefined, visitorId: undefined };
      mockPrisma.notification.create.mockResolvedValue(notification);

      const result = await service.create(input);

      expect(result).toEqual(notification);
      expect(mockPrisma.notification.create).toHaveBeenCalledWith({
        data: {
          kind: 'alert',
          title: 'Alert',
          subtitle: undefined,
          visitorId: undefined,
        },
      });
    });

    it.each(['new_lead', 'follow_up_reminder', 'consultation_request', 'lead_assignment'])(
      'dispatches WhatsApp for WA_KIND %s',
      async (kind) => {
        const input: CreateNotificationInput = { kind, title: 'Test' };
        mockPrisma.notification.create.mockResolvedValue({ id: 'n1', ...input });
        mockWhatsapp.send.mockResolvedValue(undefined);

        await service.create(input);
        expect(mockWhatsapp.send).toHaveBeenCalledWith(kind, 'Test', undefined);
      },
    );

    it('does not dispatch WhatsApp for non-WA kinds', async () => {
      const input: CreateNotificationInput = { kind: 'alert', title: 'Alert' };
      mockPrisma.notification.create.mockResolvedValue({ id: 'n1', ...input });

      await service.create(input);
      expect(mockWhatsapp.send).not.toHaveBeenCalled();
    });

    it('catches WhatsApp errors without propagating', async () => {
      const input: CreateNotificationInput = { kind: 'new_lead', title: 'Test' };
      mockPrisma.notification.create.mockResolvedValue({ id: 'n1', ...input });
      mockWhatsapp.send.mockRejectedValue(new Error('API down'));

      await expect(service.create(input)).resolves.toBeDefined();
    });
  });

  describe('list', () => {
    it('should list notifications ordered by createdAt desc with default limit', async () => {
      const notifications = [
        { id: 'n1', createdAt: new Date('2025-02-01') },
        { id: 'n2', createdAt: new Date('2025-01-01') },
      ];
      mockPrisma.notification.findMany.mockResolvedValue(notifications);

      const result = await service.list();

      expect(result).toEqual(notifications);
      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    });

    it('should list notifications with custom limit', async () => {
      mockPrisma.notification.findMany.mockResolvedValue([]);

      await service.list(10);

      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
        take: 10,
      });
    });
  });

  describe('markRead', () => {
    it('should update the notification with a readAt timestamp', async () => {
      const now = new Date();
      jest.useFakeTimers().setSystemTime(now);

      const updated = { id: 'n1', readAt: now };
      mockPrisma.notification.update.mockResolvedValue(updated);

      const result = await service.markRead('n1');

      expect(result).toEqual(updated);
      expect(mockPrisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'n1' },
        data: { readAt: now },
      });

      jest.useRealTimers();
    });
  });
});
