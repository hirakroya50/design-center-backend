import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationChannel, WHATSAPP_CHANNEL } from './channels/channel.interface';

export interface CreateNotificationInput {
  kind: string;
  title: string;
  subtitle?: string;
  visitorId?: string;
}

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    @Inject(WHATSAPP_CHANNEL) private whatsapp: NotificationChannel,
  ) {}

  async create(input: CreateNotificationInput) {
    const notification = await this.prisma.notification.create({
      data: {
        kind: input.kind,
        title: input.title,
        subtitle: input.subtitle,
        visitorId: input.visitorId,
      },
    });

    const WA_KINDS = ['new_lead', 'follow_up_reminder', 'consultation_request', 'lead_assignment'];
    if (WA_KINDS.includes(input.kind)) {
      await this.whatsapp.send(input.kind, input.title, input.subtitle).catch(() => {});
    }

    return notification;
  }

  list(limit = 50) {
    return this.prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  markRead(id: string) {
    return this.prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });
  }
}
