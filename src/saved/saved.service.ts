import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SavedService {
  constructor(private prisma: PrismaService) {}

  getSavedVendorIds(userId: string) {
    return this.prisma.savedVendor
      .findMany({ where: { userId }, select: { vendorId: true } })
      .then((rows) => rows.map((r) => r.vendorId));
  }

  saveVendor(userId: string, vendorId: string) {
    return this.prisma.savedVendor.upsert({
      where: { userId_vendorId: { userId, vendorId } },
      create: { userId, vendorId },
      update: {},
    });
  }

  unsaveVendor(userId: string, vendorId: string) {
    return this.prisma.savedVendor.deleteMany({ where: { userId, vendorId } });
  }

  getSavedServiceIds(userId: string) {
    return this.prisma.savedService
      .findMany({ where: { userId }, select: { serviceId: true } })
      .then((rows) => rows.map((r) => r.serviceId));
  }

  saveService(userId: string, serviceId: string) {
    return this.prisma.savedService.upsert({
      where: { userId_serviceId: { userId, serviceId } },
      create: { userId, serviceId },
      update: {},
    });
  }

  unsaveService(userId: string, serviceId: string) {
    return this.prisma.savedService.deleteMany({
      where: { userId, serviceId },
    });
  }
}
