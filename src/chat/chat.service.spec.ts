import { Test, TestingModule } from '@nestjs/testing';
import { ChatService } from './chat.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ChatService', () => {
  let service: ChatService;
  let prisma: PrismaService;

  const mockPrisma = {
    conversation: {
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    message: {
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('listConversations', () => {
    it('should return conversations where user is a participant, ordered by lastMessageAt desc', async () => {
      const userId = 'user-1';
      const conversations = [
        { id: 'c1', participantIds: ['user-1', 'user-2'], lastMessageAt: new Date('2025-02-01') },
        { id: 'c2', participantIds: ['user-1', 'user-3'], lastMessageAt: new Date('2025-01-01') },
      ];
      mockPrisma.conversation.findMany.mockResolvedValue(conversations);

      const result = await service.listConversations(userId);

      expect(result).toEqual(conversations);
      expect(mockPrisma.conversation.findMany).toHaveBeenCalledWith({
        where: { participantIds: { has: userId } },
        orderBy: { lastMessageAt: 'desc' },
      });
    });

    it('should return empty array when no conversations found', async () => {
      mockPrisma.conversation.findMany.mockResolvedValue([]);

      const result = await service.listConversations('nonexistent');

      expect(result).toEqual([]);
    });
  });

  describe('createConversation', () => {
    it('should create a conversation with visitorId and participantIds', async () => {
      const dto = { visitorId: 'vis-1', participantIds: ['user-1', 'user-2'] };
      const created = { id: 'c1', ...dto, createdAt: new Date() };
      mockPrisma.conversation.create.mockResolvedValue(created);

      const result = await service.createConversation(dto.visitorId, dto.participantIds);

      expect(result).toEqual(created);
      expect(mockPrisma.conversation.create).toHaveBeenCalledWith({
        data: { visitorId: 'vis-1', participantIds: ['user-1', 'user-2'] },
      });
    });

    it('should create a conversation without visitorId', async () => {
      const participantIds = ['user-1', 'user-2'];
      const created = { id: 'c1', visitorId: null, participantIds, createdAt: new Date() };
      mockPrisma.conversation.create.mockResolvedValue(created);

      const result = await service.createConversation(null, participantIds);

      expect(result).toEqual(created);
      expect(mockPrisma.conversation.create).toHaveBeenCalledWith({
        data: { visitorId: null, participantIds },
      });
    });
  });

  describe('getMessages', () => {
    it('should return messages ordered by createdAt desc with default limit', async () => {
      const conversationId = 'c1';
      const messages = [
        { id: 'm1', conversationId, text: 'Hello', createdAt: new Date('2025-02-02') },
        { id: 'm2', conversationId, text: 'Hi', createdAt: new Date('2025-02-01') },
      ];
      mockPrisma.message.findMany.mockResolvedValue(messages);

      const result = await service.getMessages(conversationId);

      expect(result).toEqual(messages);
      expect(mockPrisma.message.findMany).toHaveBeenCalledWith({
        where: { conversationId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    });

    it('should accept custom limit', async () => {
      mockPrisma.message.findMany.mockResolvedValue([]);

      await service.getMessages('c1', 10);

      expect(mockPrisma.message.findMany).toHaveBeenCalledWith({
        where: { conversationId: 'c1' },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });
    });

    it('should filter messages before a given message cursor', async () => {
      const conversationId = 'c1';
      const beforeId = 'm2';
      const refMessage = { createdAt: new Date('2025-02-01') };
      const messages = [{ id: 'm1', conversationId, createdAt: new Date('2025-01-01') }];
      mockPrisma.message.findUnique.mockResolvedValue(refMessage);
      mockPrisma.message.findMany.mockResolvedValue(messages);

      const result = await service.getMessages(conversationId, 50, beforeId);

      expect(result).toEqual(messages);
      expect(mockPrisma.message.findUnique).toHaveBeenCalledWith({
        where: { id: beforeId },
        select: { createdAt: true },
      });
      expect(mockPrisma.message.findMany).toHaveBeenCalledWith({
        where: { conversationId, createdAt: { lt: refMessage.createdAt } },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    });

    it('should ignore before cursor when message not found', async () => {
      mockPrisma.message.findUnique.mockResolvedValue(null);
      mockPrisma.message.findMany.mockResolvedValue([]);

      const result = await service.getMessages('c1', 50, 'nonexistent');

      expect(result).toEqual([]);
      expect(mockPrisma.message.findMany).toHaveBeenCalledWith({
        where: { conversationId: 'c1' },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    });
  });

  describe('sendMessage', () => {
    it('should create a message and update conversation lastMessageAt in a transaction', async () => {
      const conversationId = 'c1';
      const senderId = 'user-1';
      const text = 'Hello!';
      const now = new Date();
      jest.useFakeTimers().setSystemTime(now);

      const createdMessage = { id: 'm1', conversationId, senderId, text, createdAt: now };
      mockPrisma.$transaction.mockImplementation(async (cb: any) => {
        if (typeof cb === 'function') return cb(mockPrisma);
        return [createdMessage, { id: conversationId, lastMessageAt: now }];
      });

      mockPrisma.message.create.mockResolvedValue(createdMessage);
      mockPrisma.conversation.update.mockResolvedValue({ id: conversationId, lastMessageAt: now });

      const result = await service.sendMessage(conversationId, senderId, text);

      expect(result).toEqual(createdMessage);

      jest.useRealTimers();
    });

    it('should create message with correct data in transaction', async () => {
      const conversationId = 'c1';
      const senderId = 'user-1';
      const text = 'Hello!';
      const now = new Date();
      jest.useFakeTimers().setSystemTime(now);

      mockPrisma.message.create.mockResolvedValue({ id: 'm1', conversationId, senderId, text, createdAt: now });
      mockPrisma.conversation.update.mockResolvedValue({ id: conversationId, lastMessageAt: now });
      mockPrisma.$transaction.mockImplementation(
        (queries: any[]) => Promise.all(queries.map((q: any) => q)),
      );

      await service.sendMessage(conversationId, senderId, text);

      expect(mockPrisma.message.create).toHaveBeenCalledWith({
        data: { conversationId, senderId, text },
      });
      expect(mockPrisma.conversation.update).toHaveBeenCalledWith({
        where: { id: conversationId },
        data: { lastMessageAt: now },
      });

      jest.useRealTimers();
    });
  });

  describe('pollMessages', () => {
    it('should return messages created after since date, ordered ascending', async () => {
      const conversationId = 'c1';
      const since = new Date('2025-02-01');
      const messages = [
        { id: 'm2', conversationId, text: 'Later', createdAt: new Date('2025-02-02') },
      ];
      mockPrisma.message.findMany.mockResolvedValue(messages);

      const result = await service.pollMessages(conversationId, since);

      expect(result).toEqual(messages);
      expect(mockPrisma.message.findMany).toHaveBeenCalledWith({
        where: {
          conversationId,
          createdAt: { gt: since },
        },
        orderBy: { createdAt: 'asc' },
      });
    });

    it('should return empty array when no messages since date', async () => {
      mockPrisma.message.findMany.mockResolvedValue([]);

      const result = await service.pollMessages('c1', new Date());

      expect(result).toEqual([]);
    });
  });
});
