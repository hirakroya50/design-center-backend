import { Test } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ReportsService', () => {
  let service: ReportsService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      visitor: { findMany: jest.fn() },
      consultation: { findMany: jest.fn() },
      user: { count: jest.fn() },
      vendor: { count: jest.fn() },
      service: { count: jest.fn() },
    };

    const mod = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = mod.get(ReportsService);
  });

  describe('visitorsCsv', () => {
    it('generates visitor CSV with headers', async () => {
      prisma.visitor.findMany.mockResolvedValue([
        {
          fullName: 'John Doe',
          email: 'john@example.com',
          mobile: '1234567890',
          city: 'NYC',
          leadSource: 'Walk-in',
          stage: 'new',
          propertyType: 'house',
          projectStage: 'planning',
          createdAt: new Date('2025-01-15T10:00:00Z'),
        },
      ]);

      const csv = await service.visitorsCsv();
      expect(csv).toContain(
        'fullName,email,mobile,city,leadSource,stage,propertyType,projectStage,createdAt',
      );
      expect(csv).toContain('John Doe');
      expect(csv).toContain('john@example.com');
    });

    it('returns headers only when no visitors exist', async () => {
      prisma.visitor.findMany.mockResolvedValue([]);
      const csv = await service.visitorsCsv();
      expect(csv).toBe(
        'fullName,email,mobile,city,leadSource,stage,propertyType,projectStage,createdAt',
      );
    });

    it('escapes double quotes in fields', async () => {
      prisma.visitor.findMany.mockResolvedValue([
        {
          fullName: 'John "Doe"',
          email: 'john@example.com',
          mobile: null,
          city: null,
          leadSource: null,
          stage: 'new',
          propertyType: null,
          projectStage: null,
          createdAt: new Date('2025-01-15T10:00:00Z'),
        },
      ]);
      const csv = await service.visitorsCsv();
      expect(csv).toContain('"John ""Doe"""');
    });
  });

  describe('consultationsCsv', () => {
    it('generates consultations CSV with headers', async () => {
      prisma.consultation.findMany.mockResolvedValue([
        {
          visitorName: 'Jane Doe',
          vendorId: 'v1',
          date: new Date('2025-02-01'),
          time: new Date('2025-02-01T14:00:00Z'),
          status: 'completed',
        },
      ]);

      const csv = await service.consultationsCsv();
      expect(csv).toContain('visitorName,vendorId,date,time,status');
      expect(csv).toContain('Jane Doe');
    });

    it('returns headers only when no consultations exist', async () => {
      prisma.consultation.findMany.mockResolvedValue([]);
      const csv = await service.consultationsCsv();
      expect(csv).toBe('visitorName,vendorId,date,time,status');
    });
  });

  describe('analyticsCsv', () => {
    it('generates analytics CSV with counts from DB', async () => {
      prisma.visitor.findMany.mockResolvedValue([
        { leadSource: 'Walk-in', stage: 'new' },
        { leadSource: 'Instagram', stage: 'won' },
      ]);
      prisma.consultation.findMany.mockResolvedValue([
        { status: 'completed' },
        { status: 'upcoming' },
      ]);
      prisma.user.count.mockResolvedValue(10);
      prisma.vendor.count.mockResolvedValue(5);
      prisma.service.count.mockResolvedValue(3);

      const csv = await service.analyticsCsv();
      expect(csv).toContain('metric,value');
      expect(csv).toContain('totalUsers,10');
      expect(csv).toContain('totalVendors,5');
      expect(csv).toContain('totalServices,3');
      expect(csv).toContain('totalVisitors,2');
      expect(csv).toContain('totalConsultations,2');
      expect(csv).toContain('completedConsultations,1');
      expect(csv).toContain('pendingConsultations,1');
    });

    it('handles empty data gracefully', async () => {
      prisma.visitor.findMany.mockResolvedValue([]);
      prisma.consultation.findMany.mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(0);
      prisma.vendor.count.mockResolvedValue(0);
      prisma.service.count.mockResolvedValue(0);

      const csv = await service.analyticsCsv();
      expect(csv).toContain('totalUsers,0');
      expect(csv).toContain('totalVisitors,0');
    });
  });
});
