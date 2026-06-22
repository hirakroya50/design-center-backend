import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { VendorsService } from './vendors.service';
import { PrismaService } from '../prisma/prisma.service';

describe('VendorsService', () => {
  let service: VendorsService;
  let prisma: {
    vendor: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    profile: { findUnique: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      vendor: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      profile: { findUnique: jest.fn() },
    };

    const mod = await Test.createTestingModule({
      providers: [
        VendorsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = mod.get(VendorsService);
  });

  describe('findAll', () => {
    it('returns all vendors ordered by name ascending', async () => {
      const vendors = [
        { id: 'v1', name: 'Alpha' },
        { id: 'v2', name: 'Beta' },
      ];
      prisma.vendor.findMany.mockResolvedValue(vendors);

      const result = await service.findAll();

      expect(result).toEqual(vendors);
      expect(prisma.vendor.findMany).toHaveBeenCalledWith({
        orderBy: { name: 'asc' },
      });
    });
  });

  describe('findOne', () => {
    it('returns a vendor when found', async () => {
      const vendor = { id: 'v1', name: 'Test Vendor' };
      prisma.vendor.findUnique.mockResolvedValue(vendor);

      const result = await service.findOne('v1');

      expect(result).toEqual(vendor);
      expect(prisma.vendor.findUnique).toHaveBeenCalledWith({
        where: { id: 'v1' },
      });
    });

    it('throws NotFoundException when vendor does not exist', async () => {
      prisma.vendor.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('creates a vendor with the provided data', async () => {
      const dto = { id: 'v1', name: 'New Vendor', categoryId: 'c1' };
      const created = { id: 'v1', name: 'New Vendor', categoryId: 'c1' };
      prisma.vendor.create.mockResolvedValue(created);

      const result = await service.create(dto as any);

      expect(result).toEqual(created);
      expect(prisma.vendor.create).toHaveBeenCalledWith({
        data: dto,
      });
    });
  });

  describe('update', () => {
    const vendorId = 'v1';
    const dto = { name: 'Updated' };

    it('allows admin to update any vendor', async () => {
      const requester = { id: 'admin1', role: 'admin' };
      const updated = { id: vendorId, name: 'Updated' };
      prisma.vendor.update.mockResolvedValue(updated);

      const result = await service.update(vendorId, dto as any, requester);

      expect(result).toEqual(updated);
      expect(prisma.vendor.update).toHaveBeenCalledWith({
        where: { id: vendorId },
        data: dto,
      });
    });

    it('allows partner to update their own vendor when profile.vendorId matches', async () => {
      const requester = { id: 'profile1', role: 'partner' };
      prisma.profile.findUnique.mockResolvedValue({
        vendorId: vendorId,
      });
      const updated = { id: vendorId, name: 'Updated' };
      prisma.vendor.update.mockResolvedValue(updated);

      const result = await service.update(vendorId, dto as any, requester);

      expect(result).toEqual(updated);
      expect(prisma.profile.findUnique).toHaveBeenCalledWith({
        where: { id: 'profile1' },
        select: { vendorId: true },
      });
    });

    it('throws ForbiddenException when partner tries to update a different vendor', async () => {
      const requester = { id: 'profile1', role: 'partner' };
      prisma.profile.findUnique.mockResolvedValue({
        vendorId: 'other-vendor',
      });

      await expect(
        service.update(vendorId, dto as any, requester),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when partner profile has no vendorId', async () => {
      const requester = { id: 'profile1', role: 'partner' };
      prisma.profile.findUnique.mockResolvedValue(null);

      await expect(
        service.update(vendorId, dto as any, requester),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('deletes a vendor by id', async () => {
      const deleted = { id: 'v1', name: 'Deleted Vendor' };
      prisma.vendor.delete.mockResolvedValue(deleted);

      const result = await service.remove('v1');

      expect(result).toEqual(deleted);
      expect(prisma.vendor.delete).toHaveBeenCalledWith({
        where: { id: 'v1' },
      });
    });
  });

  describe('incrementView', () => {
    it('increments viewCount by 1 and returns the new count', async () => {
      prisma.vendor.update.mockResolvedValue({ viewCount: 5 });

      const result = await service.incrementView('v1');

      expect(result).toEqual({ viewCount: 5 });
      expect(prisma.vendor.update).toHaveBeenCalledWith({
        where: { id: 'v1' },
        data: { viewCount: { increment: 1 } },
        select: { viewCount: true },
      });
    });
  });
});
