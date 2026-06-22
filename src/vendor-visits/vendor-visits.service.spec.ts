import { Test, TestingModule } from '@nestjs/testing';
import { VendorVisitsService } from './vendor-visits.service';
import { PrismaService } from '../prisma/prisma.service';

describe('VendorVisitsService', () => {
  let service: VendorVisitsService;
  let prisma: PrismaService;

  const mockPrisma = {
    vendorVisit: {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
    visitor: {
      findUnique: jest.fn(),
    },
    vendor: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VendorVisitsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<VendorVisitsService>(VendorVisitsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('recordVisit', () => {
    it('should create a new visit record when no existing visit', async () => {
      mockPrisma.vendorVisit.findUnique.mockResolvedValue(null);
      const created = { visitorId: 'vis-1', vendorId: 'v-1', visitCount: 1 };
      mockPrisma.vendorVisit.create.mockResolvedValue(created);

      const result = await service.recordVisit('vis-1', 'v-1');

      expect(result).toEqual(created);
      expect(mockPrisma.vendorVisit.findUnique).toHaveBeenCalledWith({
        where: { visitorId_vendorId: { visitorId: 'vis-1', vendorId: 'v-1' } },
      });
      expect(mockPrisma.vendorVisit.create).toHaveBeenCalledWith({
        data: { visitorId: 'vis-1', vendorId: 'v-1' },
      });
    });

    it('should increment visitCount and update lastVisit when existing visit found', async () => {
      const now = new Date();
      jest.useFakeTimers().setSystemTime(now);

      const existing = { visitorId: 'vis-1', vendorId: 'v-1', visitCount: 3 };
      mockPrisma.vendorVisit.findUnique.mockResolvedValue(existing);
      const updated = { visitorId: 'vis-1', vendorId: 'v-1', visitCount: 4, lastVisit: now };
      mockPrisma.vendorVisit.update.mockResolvedValue(updated);

      const result = await service.recordVisit('vis-1', 'v-1');

      expect(result).toEqual(updated);
      expect(mockPrisma.vendorVisit.update).toHaveBeenCalledWith({
        where: { visitorId_vendorId: { visitorId: 'vis-1', vendorId: 'v-1' } },
        data: { visitCount: 4, lastVisit: now },
      });

      jest.useRealTimers();
    });
  });

  describe('findByVisitor', () => {
    it('should return visits for a visitor with visitor details', async () => {
      const visits = [
        {
          id: 'visit-1',
          visitorId: 'vis-1',
          vendorId: 'v-1',
          lastVisit: new Date(),
          visitor: { fullName: 'John', city: 'NYC' },
        },
      ];
      mockPrisma.vendorVisit.findMany.mockResolvedValue(visits);

      const result = await service.findByVisitor('vis-1');

      expect(result).toEqual(visits);
      expect(mockPrisma.vendorVisit.findMany).toHaveBeenCalledWith({
        where: { visitorId: 'vis-1' },
        orderBy: { lastVisit: 'desc' },
        include: { visitor: { select: { fullName: true, city: true } } },
      });
    });
  });

  describe('getAggregatedStats', () => {
    it('should return aggregated stats grouped by vendor', async () => {
      const groupByResult = [
        { vendorId: 'v-1', _sum: { visitCount: 10 }, _count: { visitorId: 3 } },
        { vendorId: 'v-2', _sum: { visitCount: 5 }, _count: { visitorId: 2 } },
      ];
      mockPrisma.vendorVisit.groupBy.mockResolvedValue(groupByResult);
      mockPrisma.vendor.findMany.mockResolvedValue([
        { id: 'v-1', name: 'Vendor One' },
        { id: 'v-2', name: 'Vendor Two' },
      ]);

      const result = await service.getAggregatedStats();

      expect(result).toEqual([
        { vendorId: 'v-1', vendorName: 'Vendor One', totalVisits: 10, uniqueVisitors: 3 },
        { vendorId: 'v-2', vendorName: 'Vendor Two', totalVisits: 5, uniqueVisitors: 2 },
      ]);
      expect(mockPrisma.vendorVisit.groupBy).toHaveBeenCalledWith({
        by: ['vendorId'],
        _sum: { visitCount: true },
        _count: { visitorId: true },
        orderBy: { _sum: { visitCount: 'desc' } },
        take: 10,
      });
    });

    it('should fall back to vendorId when vendor name not found', async () => {
      const groupByResult = [
        { vendorId: 'v-unknown', _sum: { visitCount: 3 }, _count: { visitorId: 1 } },
      ];
      mockPrisma.vendorVisit.groupBy.mockResolvedValue(groupByResult);
      mockPrisma.vendor.findMany.mockResolvedValue([]);

      const result = await service.getAggregatedStats();

      expect(result).toEqual([
        { vendorId: 'v-unknown', vendorName: 'v-unknown', totalVisits: 3, uniqueVisitors: 1 },
      ]);
    });
  });

  describe('getLeadVendorActivity', () => {
    it('should return visitor details with vendor visits', async () => {
      const visitor = { fullName: 'John', city: 'NYC', stage: 'lead' };
      mockPrisma.visitor.findUnique.mockResolvedValue(visitor);

      const visits = [
        { vendorId: 'v-1', visitCount: 2, firstVisit: new Date('2025-01-01'), lastVisit: new Date('2025-02-01') },
        { vendorId: 'v-2', visitCount: 1, firstVisit: new Date('2025-01-15'), lastVisit: new Date('2025-01-15') },
      ];
      mockPrisma.vendorVisit.findMany.mockResolvedValue(visits);

      mockPrisma.vendor.findMany.mockResolvedValue([
        { id: 'v-1', name: 'Vendor One', categoryId: 'cat-1' },
        { id: 'v-2', name: 'Vendor Two', categoryId: 'cat-2' },
      ]);

      const result = await service.getLeadVendorActivity('vis-1');

      expect(result).toEqual({
        visitor,
        totalVendorsVisited: 2,
        totalVisits: 3,
        vendors: [
          {
            vendorId: 'v-1',
            vendorName: 'Vendor One',
            categoryId: 'cat-1',
            visitCount: 2,
            firstVisit: visits[0].firstVisit,
            lastVisit: visits[0].lastVisit,
          },
          {
            vendorId: 'v-2',
            vendorName: 'Vendor Two',
            categoryId: 'cat-2',
            visitCount: 1,
            firstVisit: visits[1].firstVisit,
            lastVisit: visits[1].lastVisit,
          },
        ],
      });
    });

    it('should return null when visitor is not found', async () => {
      mockPrisma.visitor.findUnique.mockResolvedValue(null);

      const result = await service.getLeadVendorActivity('nonexistent');

      expect(result).toBeNull();
      expect(mockPrisma.vendorVisit.findMany).not.toHaveBeenCalled();
    });
  });
});
