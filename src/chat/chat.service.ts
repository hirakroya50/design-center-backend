import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  listConversations(userId: string) {
    return this.prisma.conversation.findMany({
      where: { participantIds: { has: userId } },
      orderBy: { lastMessageAt: 'desc' },
    });
  }

  createConversation(visitorId: string | null, participantIds: string[]) {
    return this.prisma.conversation.create({
      data: { visitorId, participantIds },
    });
  }

  async getMessages(conversationId: string, limit = 50, before?: string) {
    const where: any = { conversationId };
    if (before) {
      const ref = await this.prisma.message.findUnique({
        where: { id: before },
        select: { createdAt: true },
      });
      if (ref) where.createdAt = { lt: ref.createdAt };
    }
    return this.prisma.message.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async sendMessage(conversationId: string, senderId: string, text: string) {
    const now = new Date();
    const [message] = await this.prisma.$transaction([
      this.prisma.message.create({
        data: { conversationId, senderId, text },
      }),
      this.prisma.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: now },
      }),
    ]);
    return message;
  }

  pollMessages(conversationId: string, since: Date) {
    return this.prisma.message.findMany({
      where: {
        conversationId,
        createdAt: { gt: since },
      },
      orderBy: { createdAt: 'asc' },
    });
  }
}
