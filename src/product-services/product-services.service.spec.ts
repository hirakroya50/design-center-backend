import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ProductServicesService } from './product-services.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ProductServicesService', () => {
  let service: ProductServicesService;
  let prisma: PrismaService;

  const mockPrisma = {
    service: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductServicesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ProductServicesService>(ProductServicesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should list services ordered by name', async () => {
      const services = [
        { id: 's1', name: 'Alpha' },
        { id: 's2', name: 'Beta' },
      ];
      mockPrisma.service.findMany.mockResolvedValue(services);

      const result = await service.findAll();

      expect(result).toEqual(services);
      expect(mockPrisma.service.findMany).toHaveBeenCalledWith({
        orderBy: { name: 'asc' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a service by id', async () => {
      const svc = { id: 's1', name: 'Test Service' };
      mockPrisma.service.findUnique.mockResolvedValue(svc);

      const result = await service.findOne('s1');

      expect(result).toEqual(svc);
      expect(mockPrisma.service.findUnique).toHaveBeenCalledWith({
        where: { id: 's1' },
      });
    });

    it('should throw NotFoundException when service not found', async () => {
      mockPrisma.service.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create a service', async () => {
      const data = { name: 'New Service', description: 'A new service' };
      const created = { id: 's1', ...data };
      mockPrisma.service.create.mockResolvedValue(created);

      const result = await service.create(data);

      expect(result).toEqual(created);
      expect(mockPrisma.service.create).toHaveBeenCalledWith({ data });
    });
  });

  describe('update', () => {
    it('should update a service', async () => {
      const data = { name: 'Updated Service' };
      const updated = { id: 's1', name: 'Updated Service' };
      mockPrisma.service.update.mockResolvedValue(updated);

      const result = await service.update('s1', data);

      expect(result).toEqual(updated);
      expect(mockPrisma.service.update).toHaveBeenCalledWith({
        where: { id: 's1' },
        data,
      });
    });
  });

  describe('remove', () => {
    it('should delete a service', async () => {
      const deleted = { id: 's1' };
      mockPrisma.service.delete.mockResolvedValue(deleted);

      const result = await service.remove('s1');

      expect(result).toEqual(deleted);
      expect(mockPrisma.service.delete).toHaveBeenCalledWith({
        where: { id: 's1' },
      });
    });
  });

  describe('linkVendor', () => {
    it('should add a vendor to relatedVendorIds when attach is true', async () => {
      mockPrisma.service.findUnique.mockResolvedValue({
        id: 's1',
        relatedVendorIds: ['v1'],
      });
      mockPrisma.service.update.mockResolvedValue({
        id: 's1',
        relatedVendorIds: ['v1', 'v2'],
      });

      const result = await service.linkVendor('s1', 'v2', true);

      expect(result).toEqual({ id: 's1', relatedVendorIds: ['v1', 'v2'] });
      expect(mockPrisma.service.update).toHaveBeenCalledWith({
        where: { id: 's1' },
        data: { relatedVendorIds: ['v1', 'v2'] },
      });
    });

    it('should not duplicate vendor IDs when adding', async () => {
      mockPrisma.service.findUnique.mockResolvedValue({
        id: 's1',
        relatedVendorIds: ['v1', 'v2'],
      });
      mockPrisma.service.update.mockResolvedValue({
        id: 's1',
        relatedVendorIds: ['v1', 'v2'],
      });

      const result = await service.linkVendor('s1', 'v2', true);

      expect(result).toEqual({ id: 's1', relatedVendorIds: ['v1', 'v2'] });
      expect(mockPrisma.service.update).toHaveBeenCalledWith({
        where: { id: 's1' },
        data: { relatedVendorIds: ['v1', 'v2'] },
      });
    });

    it('should remove a vendor from relatedVendorIds when attach is false', async () => {
      mockPrisma.service.findUnique.mockResolvedValue({
        id: 's1',
        relatedVendorIds: ['v1', 'v2', 'v3'],
      });
      mockPrisma.service.update.mockResolvedValue({
        id: 's1',
        relatedVendorIds: ['v1', 'v3'],
      });

      const result = await service.linkVendor('s1', 'v2', false);

      expect(result).toEqual({ id: 's1', relatedVendorIds: ['v1', 'v3'] });
      expect(mockPrisma.service.update).toHaveBeenCalledWith({
        where: { id: 's1' },
        data: { relatedVendorIds: ['v1', 'v3'] },
      });
    });

    it('should handle empty relatedVendorIds when adding', async () => {
      mockPrisma.service.findUnique.mockResolvedValue({
        id: 's1',
        relatedVendorIds: null,
      });
      mockPrisma.service.update.mockResolvedValue({
        id: 's1',
        relatedVendorIds: ['v1'],
      });

      const result = await service.linkVendor('s1', 'v1', true);

      expect(result).toEqual({ id: 's1', relatedVendorIds: ['v1'] });
      expect(mockPrisma.service.update).toHaveBeenCalledWith({
        where: { id: 's1' },
        data: { relatedVendorIds: ['v1'] },
      });
    });

    it('should throw NotFoundException when service does not exist', async () => {
      mockPrisma.service.findUnique.mockResolvedValue(null);

      await expect(service.linkVendor('nonexistent', 'v1', true)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
