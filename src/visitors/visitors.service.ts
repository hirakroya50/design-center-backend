import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VisitorsService {
  constructor(private prisma: PrismaService) {}

  findByHostess(hostessId: string) {
    return this.prisma.visitor.findMany({
      where: { hostessId },
      orderBy: { createdAt: 'desc' },
      include: { timelineEvents: { orderBy: { timestamp: 'asc' } } },
    });
  }

  async findOne(id: string) {
    const v = await this.prisma.visitor.findUnique({
      where: { id },
      include: { timelineEvents: { orderBy: { timestamp: 'asc' } } },
    });
    if (!v) throw new NotFoundException('Visitor not found');
    return v;
  }

  create(hostessId: string, data: any) {
    const { timelineEvents, ...rest } = data;
    return this.prisma.visitor.create({ data: { ...rest, hostessId } });
  }

  update(id: string, data: any) {
    const { timelineEvents, id: _id, hostessId, createdAt, updatedAt, ...rest } = data;
    return this.prisma.visitor.update({ where: { id }, data: rest });
  }

  addTimelineEvent(visitorId: string, data: { label: string; detail?: string }) {
    return this.prisma.timelineEvent.create({ data: { visitorId, ...data } });
  }
}
