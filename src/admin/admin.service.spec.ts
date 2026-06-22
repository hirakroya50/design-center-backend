import { Test } from '@nestjs/testing';
import { AdminService } from './admin.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';

describe('AdminService', () => {
  let service: AdminService;
  let prisma: any;
  let auth: any;

  beforeEach(async () => {
    prisma = {
      user: {
        findMany: jest.fn(),
        count: jest.fn(),
      },
      profile: {
        upsert: jest.fn(),
      },
      visitor: {
        findMany: jest.fn(),
        count: jest.fn(),
        groupBy: jest.fn(),
      },
      vendor: {
        count: jest.fn(),
        findMany: jest.fn(),
      },
      service: {
        count: jest.fn(),
        findMany: jest.fn(),
      },
      consultation: {
        count: jest.fn(),
        findMany: jest.fn(),
      },
      savedVendor: {
        groupBy: jest.fn(),
      },
      savedService: {
        groupBy: jest.fn(),
      },
    };

    auth = {
      me: jest.fn(),
      createUser: jest.fn(),
    };

    const mod = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuthService, useValue: auth },
      ],
    }).compile();

    service = mod.get(AdminService);
  });

  describe('listUsers', () => {
    it('returns mapped users without role filter', async () => {
      prisma.user.findMany.mockResolvedValue([
        {
          id: 'u1',
          email: 'a@b.com',
          role: 'customer',
          profile: { name: 'Alice', vendorId: null },
        },
        {
          id: 'u2',
          email: 'b@b.com',
          role: 'partner',
          profile: { name: 'Bob', vendorId: 'v1' },
        },
      ]);

      const result = await service.listUsers();

      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: undefined,
        include: { profile: true },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual([
        { id: 'u1', email: 'a@b.com', role: 'customer', name: 'Alice', vendorId: null },
        { id: 'u2', email: 'b@b.com', role: 'partner', name: 'Bob', vendorId: 'v1' },
      ]);
    });

    it('filters by role when role is provided', async () => {
      prisma.user.findMany.mockResolvedValue([
        {
          id: 'u3',
          email: 'c@b.com',
          role: 'partner',
          profile: { name: 'Carol', vendorId: 'v2' },
        },
      ]);

      const result = await service.listUsers('partner');

      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: { role: 'partner' },
        include: { profile: true },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toHaveLength(1);
      expect(result[0].role).toBe('partner');
    });

    it('handles null profile gracefully', async () => {
      prisma.user.findMany.mockResolvedValue([
        { id: 'u4', email: 'd@b.com', role: 'customer', profile: null },
      ]);

      const result = await service.listUsers();

      expect(result).toEqual([
        { id: 'u4', email: 'd@b.com', role: 'customer', name: null, vendorId: null },
      ]);
    });

    it('returns empty array when no users exist', async () => {
      prisma.user.findMany.mockResolvedValue([]);

      const result = await service.listUsers();

      expect(result).toEqual([]);
    });
  });

  describe('getUser', () => {
    it('delegates to auth.me', async () => {
      auth.me.mockResolvedValue({ id: 'u1', email: 'a@b.com' });

      const result = await service.getUser('u1');

      expect(auth.me).toHaveBeenCalledWith('u1');
      expect(result).toEqual({ id: 'u1', email: 'a@b.com' });
    });
  });

  describe('createUser', () => {
    it('delegates to auth.createUser', async () => {
      const dto = { email: 'a@b.com', name: 'A', password: 'secret', role: 'customer' as any };
      auth.createUser.mockResolvedValue({ id: 'u1', ...dto });

      const result = await service.createUser(dto);

      expect(auth.createUser).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ id: 'u1', ...dto });
    });
  });

  describe('linkPartnerVendor', () => {
    it('upserts profile with vendorId', async () => {
      prisma.profile.upsert.mockResolvedValue({
        id: 'u1',
        vendorId: 'v1',
        name: null,
      });

      const result = await service.linkPartnerVendor('u1', 'v1');

      expect(prisma.profile.upsert).toHaveBeenCalledWith({
        where: { id: 'u1' },
        create: { id: 'u1', vendorId: 'v1' },
        update: { vendorId: 'v1' },
      });
      expect(result.vendorId).toBe('v1');
    });

    it('updates existing profile when vendorId changes', async () => {
      prisma.profile.upsert.mockResolvedValue({
        id: 'u1',
        vendorId: 'v2',
      });

      const result = await service.linkPartnerVendor('u1', 'v2');

      expect(prisma.profile.upsert).toHaveBeenCalledWith({
        where: { id: 'u1' },
        create: { id: 'u1', vendorId: 'v2' },
        update: { vendorId: 'v2' },
      });
      expect(result.vendorId).toBe('v2');
    });
  });

  describe('listAllVisitors', () => {
    it('returns visitors with ordered timeline events', async () => {
      const visitors = [
        {
          id: 'v1',
          fullName: 'Visitor One',
          timelineEvents: [
            { id: 'e1', timestamp: new Date('2025-01-02') },
            { id: 'e2', timestamp: new Date('2025-01-01') },
          ],
        },
      ];
      prisma.visitor.findMany.mockResolvedValue(visitors);

      const result = await service.listAllVisitors();

      expect(prisma.visitor.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
        include: { timelineEvents: { orderBy: { timestamp: 'asc' } } },
      });
      expect(result).toEqual(visitors);
    });

    it('returns empty array when no visitors exist', async () => {
      prisma.visitor.findMany.mockResolvedValue([]);

      const result = await service.listAllVisitors();

      expect(result).toEqual([]);
    });
  });

  describe('getStats', () => {
    const defaultCounts = () => [100, 20, 50, 500, 80, 5, 40, 150, 200, 30, 50, 60, 40];

    function setupBasicMocks() {
      prisma.user.count
        .mockResolvedValueOnce(100)  // totalUsers
        .mockResolvedValueOnce(60)   // customerCount (role: customer)
        .mockResolvedValueOnce(40);  // partnerCount (role: partner)

      prisma.vendor.count.mockResolvedValue(20);
      prisma.service.count.mockResolvedValue(50);
      prisma.visitor.count
        .mockResolvedValueOnce(500)  // totalVisitors
        .mockResolvedValueOnce(5)    // todayVisitors
        .mockResolvedValueOnce(40)   // weekVisitors
        .mockResolvedValueOnce(150)  // monthVisitors
        .mockResolvedValueOnce(200); // activeLeads (tourProgress < 1)

      prisma.consultation.count
        .mockResolvedValueOnce(80)   // totalConsultations
        .mockResolvedValueOnce(30)   // pendingConsultations (status: upcoming)
        .mockResolvedValueOnce(50);  // completedConsultations (status: completed)

      prisma.visitor.groupBy.mockResolvedValue([
        { leadSource: 'Walk-in', _count: { id: 200 } },
        { leadSource: 'Instagram', _count: { id: 150 } },
      ]);
    }

    it('returns the correct shape with overview counts', async () => {
      setupBasicMocks();

      prisma.visitor.findMany
        .mockResolvedValueOnce([/* recent visitors */])       // first: recent 10 visitors
        .mockResolvedValueOnce([/* leadRows for aggregateLeads */
          { stage: 'new', leadSource: 'Walk-in' },
          { stage: 'won', leadSource: 'Instagram' },
        ]);

      prisma.consultation.findMany.mockResolvedValueOnce([]);   // recentConsultations

      prisma.vendor.findMany
        .mockResolvedValueOnce([                                // topViewedVendors
          { id: 'v1', name: 'Vendor A', viewCount: 100 },
        ])
        .mockResolvedValueOnce([{ id: 'v1', name: 'Vendor A' }]);  // savedVendorRows lookup

      prisma.savedVendor.groupBy.mockResolvedValue([
        { vendorId: 'v1', _count: { vendorId: 10 } },
      ]);

      prisma.savedService.groupBy.mockResolvedValue([
        { serviceId: 's1', _count: { serviceId: 5 } },
      ]);

      prisma.service.findMany.mockResolvedValueOnce([
        { id: 's1', name: 'Design' },
      ]);

      prisma.consultation.findMany
        .mockResolvedValueOnce([                                 // consultRows for highestConversionServices
          { service: 'Design', status: 'completed' },
          { service: 'Design', status: 'upcoming' },
          { service: 'Build', status: 'completed' },
        ]);

      const result = await service.getStats();

      expect(result.overview).toEqual({
        totalUsers: 100,
        totalVendors: 20,
        totalServices: 50,
        totalVisitors: 500,
        totalConsultations: 80,
        customerCount: 60,
        partnerCount: 40,
        conversionRate: 10,
      });

      expect(result.today).toEqual({ visitors: 5 });
      expect(result.week).toEqual({ visitors: 40 });
      expect(result.month).toEqual({ visitors: 150 });

      expect(result.leads).toEqual({
        active: 200,
        bySource: { 'Walk-in': 200, Instagram: 150 },
      });

      expect(result.consultations).toEqual({
        pending: 30,
        completed: 50,
      });
    });

    it('returns conversionRate as 0 when totalVisitors is 0', async () => {
      prisma.user.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);
      prisma.vendor.count.mockResolvedValue(0);
      prisma.service.count.mockResolvedValue(0);
      prisma.visitor.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);
      prisma.consultation.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);
      prisma.visitor.groupBy.mockResolvedValue([]);
      prisma.visitor.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      prisma.consultation.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      prisma.vendor.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      prisma.savedVendor.groupBy.mockResolvedValue([]);
      prisma.savedService.groupBy.mockResolvedValue([]);
      prisma.service.findMany.mockResolvedValueOnce([]);

      const result = await service.getStats();

      expect(result.overview.conversionRate).toBe(0);
      expect(result.leads.bySource).toEqual({});
    });

    it('includes pipeline, leadSources and conversionRate from aggregateLeads', async () => {
      setupBasicMocks();

      prisma.visitor.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          { stage: 'new', leadSource: 'Walk-in' },
          { stage: 'won', leadSource: 'Walk-in' },
        ]);

      prisma.consultation.findMany.mockResolvedValueOnce([]);
      prisma.vendor.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      prisma.savedVendor.groupBy.mockResolvedValue([]);
      prisma.savedService.groupBy.mockResolvedValue([]);
      prisma.service.findMany.mockResolvedValueOnce([]);
      prisma.consultation.findMany.mockResolvedValueOnce([]);

      const result = await service.getStats();

      expect(result.pipeline).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ stage: 'new' }),
          expect.objectContaining({ stage: 'won' }),
        ]),
      );
      expect(result.leadSources).toBeDefined();
      expect(typeof result.conversionRate).toBe('number');
    });

    it('returns topViewedVendors, topSavedVendors, topServices, highestConversionServices', async () => {
      setupBasicMocks();

      prisma.visitor.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      prisma.consultation.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          { service: 'Design', status: 'completed' },
          { service: 'Build', status: 'completed' },
          { service: 'Build', status: 'upcoming' },
        ]);

      prisma.vendor.findMany
        .mockResolvedValueOnce([
          { id: 'v1', name: 'Vendor A', viewCount: 100 },
          { id: 'v2', name: 'Vendor B', viewCount: 80 },
        ])
        .mockResolvedValueOnce([
          { id: 'v1', name: 'Vendor A' },
          { id: 'v2', name: 'Vendor B' },
        ]);

      prisma.savedVendor.groupBy.mockResolvedValue([
        { vendorId: 'v1', _count: { vendorId: 15 } },
        { vendorId: 'v2', _count: { vendorId: 10 } },
      ]);

      prisma.savedService.groupBy.mockResolvedValue([
        { serviceId: 's1', _count: { serviceId: 8 } },
      ]);

      prisma.service.findMany.mockResolvedValueOnce([
        { id: 's1', name: 'Design' },
      ]);

      const result = await service.getStats();

      expect(result.topViewedVendors).toEqual([
        { id: 'v1', name: 'Vendor A', viewCount: 100 },
        { id: 'v2', name: 'Vendor B', viewCount: 80 },
      ]);

      expect(result.topSavedVendors).toEqual([
        { id: 'v1', name: 'Vendor A', savedCount: 15 },
        { id: 'v2', name: 'Vendor B', savedCount: 10 },
      ]);

      expect(result.topServices).toEqual([
        { id: 's1', name: 'Design', requests: 8 },
      ]);

      // Both Design (1/1) and Build (1/2) have entries;
      // Build has conversion 50, Design has 100 — Design sorts first
      expect(result.highestConversionServices).toHaveLength(2);
      expect(result.highestConversionServices[0].name).toBe('Design');
      expect(result.highestConversionServices[0].conversion).toBe(100);
      expect(result.highestConversionServices[1].name).toBe('Build');
      expect(result.highestConversionServices[1].conversion).toBe(50);
    });

    it('includes recentVisitors and recentConsultations in response', async () => {
      setupBasicMocks();

      const recentVisitorsData = [
        { id: 'v1', fullName: 'Alice', city: 'NYC', leadSource: 'Walk-in', tourProgress: 0.5, createdAt: new Date(), propertyType: 'house', interestedCategories: ['kitchen'] },
      ];
      const recentConsultationsData = [
        { id: 'c1', status: 'upcoming', createdAt: new Date(), vendor: { name: 'Vendor A' } },
      ];

      prisma.visitor.findMany
        .mockResolvedValueOnce(recentVisitorsData)
        .mockResolvedValueOnce([]);

      prisma.consultation.findMany
        .mockResolvedValueOnce(recentConsultationsData)
        .mockResolvedValueOnce([]);

      prisma.vendor.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      prisma.savedVendor.groupBy.mockResolvedValue([]);
      prisma.savedService.groupBy.mockResolvedValue([]);
      prisma.service.findMany.mockResolvedValueOnce([]);

      const result = await service.getStats();

      expect(result.recentVisitors).toEqual(recentVisitorsData);
      expect(result.recentConsultations).toEqual(recentConsultationsData);
    });
  });
});
