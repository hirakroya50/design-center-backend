import { Test, TestingModule } from '@nestjs/testing';
import { SavedService } from './saved.service';
import { PrismaService } from '../prisma/prisma.service';

describe('SavedService', () => {
  let service: SavedService;
  let prisma: PrismaService;

  const mockPrisma = {
    savedVendor: {
      findMany: jest.fn(),
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    },
    savedService: {
      findMany: jest.fn(),
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SavedService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<SavedService>(SavedService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSavedVendorIds', () => {
    it('should return an array of vendor IDs', async () => {
      mockPrisma.savedVendor.findMany.mockResolvedValue([
        { vendorId: 'v1' },
        { vendorId: 'v2' },
      ]);

      const result = await service.getSavedVendorIds('user-1');

      expect(result).toEqual(['v1', 'v2']);
      expect(mockPrisma.savedVendor.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        select: { vendorId: true },
      });
    });

    it('should return empty array when no vendors saved', async () => {
      mockPrisma.savedVendor.findMany.mockResolvedValue([]);

      const result = await service.getSavedVendorIds('user-1');

      expect(result).toEqual([]);
    });
  });

  describe('saveVendor', () => {
    it('should upsert a saved vendor record', async () => {
      const record = { userId: 'user-1', vendorId: 'v1' };
      mockPrisma.savedVendor.upsert.mockResolvedValue(record);

      const result = await service.saveVendor('user-1', 'v1');

      expect(result).toEqual(record);
      expect(mockPrisma.savedVendor.upsert).toHaveBeenCalledWith({
        where: { userId_vendorId: { userId: 'user-1', vendorId: 'v1' } },
        create: { userId: 'user-1', vendorId: 'v1' },
        update: {},
      });
    });
  });

  describe('unsaveVendor', () => {
    it('should delete the saved vendor record', async () => {
      mockPrisma.savedVendor.deleteMany.mockResolvedValue({ count: 1 });

      const result = await service.unsaveVendor('user-1', 'v1');

      expect(result).toEqual({ count: 1 });
      expect(mockPrisma.savedVendor.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', vendorId: 'v1' },
      });
    });
  });

  describe('getSavedServiceIds', () => {
    it('should return an array of service IDs', async () => {
      mockPrisma.savedService.findMany.mockResolvedValue([
        { serviceId: 's1' },
        { serviceId: 's2' },
      ]);

      const result = await service.getSavedServiceIds('user-1');

      expect(result).toEqual(['s1', 's2']);
      expect(mockPrisma.savedService.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        select: { serviceId: true },
      });
    });

    it('should return empty array when no services saved', async () => {
      mockPrisma.savedService.findMany.mockResolvedValue([]);

      const result = await service.getSavedServiceIds('user-1');

      expect(result).toEqual([]);
    });
  });

  describe('saveService', () => {
    it('should upsert a saved service record', async () => {
      const record = { userId: 'user-1', serviceId: 's1' };
      mockPrisma.savedService.upsert.mockResolvedValue(record);

      const result = await service.saveService('user-1', 's1');

      expect(result).toEqual(record);
      expect(mockPrisma.savedService.upsert).toHaveBeenCalledWith({
        where: { userId_serviceId: { userId: 'user-1', serviceId: 's1' } },
        create: { userId: 'user-1', serviceId: 's1' },
        update: {},
      });
    });
  });

  describe('unsaveService', () => {
    it('should delete the saved service record', async () => {
      mockPrisma.savedService.deleteMany.mockResolvedValue({ count: 1 });

      const result = await service.unsaveService('user-1', 's1');

      expect(result).toEqual({ count: 1 });
      expect(mockPrisma.savedService.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', serviceId: 's1' },
      });
    });
  });
});
