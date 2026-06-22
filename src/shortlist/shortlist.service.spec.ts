import { Test, TestingModule } from '@nestjs/testing';
import { ShortlistService } from './shortlist.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ShortlistService', () => {
  let service: ShortlistService;
  let prisma: PrismaService;

  const mockPrisma = {
    shortlistVendor: {
      findMany: jest.fn(),
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShortlistService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ShortlistService>(ShortlistService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getIds', () => {
    it('should return an array of shortlisted vendor IDs', async () => {
      mockPrisma.shortlistVendor.findMany.mockResolvedValue([
        { vendorId: 'v1' },
        { vendorId: 'v2' },
      ]);

      const result = await service.getIds('user-1');

      expect(result).toEqual(['v1', 'v2']);
      expect(mockPrisma.shortlistVendor.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        select: { vendorId: true },
      });
    });

    it('should return empty array when nothing shortlisted', async () => {
      mockPrisma.shortlistVendor.findMany.mockResolvedValue([]);

      const result = await service.getIds('user-1');

      expect(result).toEqual([]);
    });
  });

  describe('add', () => {
    it('should upsert a shortlist record', async () => {
      const record = { userId: 'user-1', vendorId: 'v1' };
      mockPrisma.shortlistVendor.upsert.mockResolvedValue(record);

      const result = await service.add('user-1', 'v1');

      expect(result).toEqual(record);
      expect(mockPrisma.shortlistVendor.upsert).toHaveBeenCalledWith({
        where: { userId_vendorId: { userId: 'user-1', vendorId: 'v1' } },
        create: { userId: 'user-1', vendorId: 'v1' },
        update: {},
      });
    });
  });

  describe('remove', () => {
    it('should delete the shortlist record', async () => {
      mockPrisma.shortlistVendor.deleteMany.mockResolvedValue({ count: 1 });

      const result = await service.remove('user-1', 'v1');

      expect(result).toEqual({ count: 1 });
      expect(mockPrisma.shortlistVendor.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', vendorId: 'v1' },
      });
    });
  });
});
