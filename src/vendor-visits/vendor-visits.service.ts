import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VendorVisitsService {
  constructor(private prisma: PrismaService) {}

  async recordVisit(visitorId: string, vendorId: string) {
    const existing = await this.prisma.vendorVisit.findUnique({
      where: { visitorId_vendorId: { visitorId, vendorId } },
    });

    if (existing) {
      return this.prisma.vendorVisit.update({
        where: { visitorId_vendorId: { visitorId, vendorId } },
        data: {
          visitCount: existing.visitCount + 1,
          lastVisit: new Date(),
        },
      });
    }

    return this.prisma.vendorVisit.create({
      data: { visitorId, vendorId },
    });
  }

  findByVisitor(visitorId: string) {
    return this.prisma.vendorVisit.findMany({
      where: { visitorId },
      orderBy: { lastVisit: 'desc' },
      include: { visitor: { select: { fullName: true, city: true } } },
    });
  }

  async getAggregatedStats() {
    const visits = await this.prisma.vendorVisit.groupBy({
      by: ['vendorId'],
      _sum: { visitCount: true },
      _count: { visitorId: true },
      orderBy: { _sum: { visitCount: 'desc' } },
      take: 10,
    });

    const vendorIds = visits.map((v) => v.vendorId);
    const vendors = await this.prisma.vendor.findMany({
      where: { id: { in: vendorIds } },
      select: { id: true, name: true },
    });

    return visits.map((v) => ({
      vendorId: v.vendorId,
      vendorName: vendors.find((vend) => vend.id === v.vendorId)?.name ?? v.vendorId,
      totalVisits: v._sum.visitCount ?? 0,
      uniqueVisitors: v._count.visitorId,
    }));
  }

  async getLeadVendorActivity(visitorId: string) {
    const visitor = await this.prisma.visitor.findUnique({
      where: { id: visitorId },
      select: { fullName: true, city: true, stage: true },
    });
    if (!visitor) return null;

    const visits = await this.prisma.vendorVisit.findMany({
      where: { visitorId },
      orderBy: { lastVisit: 'desc' },
    });

    const vendorIds = visits.map((v) => v.vendorId);
    const vendors = vendorIds.length > 0
      ? await this.prisma.vendor.findMany({
          where: { id: { in: vendorIds } },
          select: { id: true, name: true, categoryId: true },
        })
      : [];

    return {
      visitor,
      totalVendorsVisited: visits.length,
      totalVisits: visits.reduce((sum, v) => sum + v.visitCount, 0),
      vendors: visits.map((v) => ({
        vendorId: v.vendorId,
        vendorName: vendors.find((vend) => vend.id === v.vendorId)?.name ?? v.vendorId,
        categoryId: vendors.find((vend) => vend.id === v.vendorId)?.categoryId ?? null,
        visitCount: v.visitCount,
        firstVisit: v.firstVisit,
        lastVisit: v.lastVisit,
      })),
    };
  }
}
