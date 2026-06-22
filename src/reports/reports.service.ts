import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async visitorsCsv(): Promise<string> {
    const visitors = await this.prisma.visitor.findMany({
      orderBy: { createdAt: 'desc' },
    });
    const headers =
      'fullName,email,mobile,city,leadSource,stage,propertyType,projectStage,createdAt';
    const rows = visitors.map((v) =>
      [
        v.fullName,
        v.email,
        v.mobile,
        v.city,
        v.leadSource,
        v.stage,
        v.propertyType,
        v.projectStage,
        v.createdAt.toISOString(),
      ]
        .map((f) => `"${(f ?? '').replace(/"/g, '""')}"`)
        .join(','),
    );
    return [headers, ...rows].join('\n');
  }

  async consultationsCsv(): Promise<string> {
    const consultations = await this.prisma.consultation.findMany({
      orderBy: { createdAt: 'desc' },
    });
    const headers = 'visitorName,vendorId,date,time,status';
    const rows = consultations.map((c) =>
      [
        c.visitorName,
        c.vendorId,
        c.date instanceof Date ? c.date.toISOString().split('T')[0] : String(c.date),
        c.time instanceof Date ? c.time.toISOString().split('T')[1]?.split('.')[0] ?? '' : String(c.time),
        c.status,
      ]
        .map((f) => `"${(f ?? '').replace(/"/g, '""')}"`)
        .join(','),
    );
    return [headers, ...rows].join('\n');
  }

  async analyticsCsv(): Promise<string> {
    const [users, vendors, services, visitors, consultations] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.vendor.count(),
      this.prisma.service.count(),
      this.prisma.visitor.findMany({ select: { leadSource: true, stage: true } }),
      this.prisma.consultation.findMany({ select: { status: true } }),
    ]);

    const completed = consultations.filter((c) => c.status === 'completed').length;
    const pending = consultations.filter((c) => c.status === 'upcoming').length;

    const sourceCounts: Record<string, number> = {};
    for (const v of visitors) {
      const src = v.leadSource ?? 'Unknown';
      sourceCounts[src] = (sourceCounts[src] ?? 0) + 1;
    }

    const stageCounts: Record<string, number> = {};
    for (const v of visitors) {
      stageCounts[v.stage] = (stageCounts[v.stage] ?? 0) + 1;
    }

    const header = 'metric,value';
    const rows = [
      `totalUsers,${users}`,
      `totalVendors,${vendors}`,
      `totalServices,${services}`,
      `totalVisitors,${visitors.length}`,
      `totalConsultations,${consultations.length}`,
      `completedConsultations,${completed}`,
      `pendingConsultations,${pending}`,
      ...Object.entries(sourceCounts).map(
        ([source, count]) => `leadSource_${source},${count}`,
      ),
      ...Object.entries(stageCounts).map(
        ([stage, count]) => `stage_${stage},${count}`,
      ),
    ];
    return [header, ...rows].join('\n');
  }
}
