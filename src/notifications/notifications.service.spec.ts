import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService, CreateNotificationInput } from './notifications.service';
import { PrismaService } from '../prisma/prisma.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: PrismaService;

  const mockPrisma = {
    notification: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    prisma = module.get<PrismaService>(PrismaService);
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
