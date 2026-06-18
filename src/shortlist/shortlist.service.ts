import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ShortlistService {
  constructor(private prisma: PrismaService) {}

  getIds(userId: string) {
    return this.prisma.shortlistVendor
      .findMany({ where: { userId }, select: { vendorId: true } })
      .then((rows) => rows.map((r) => r.vendorId));
  }

  add(userId: string, vendorId: string) {
    return this.prisma.shortlistVendor.upsert({
      where: { userId_vendorId: { userId, vendorId } },
      create: { userId, vendorId },
      update: {},
    });
  }

  remove(userId: string, vendorId: string) {
    return this.prisma.shortlistVendor.deleteMany({
      where: { userId, vendorId },
    });
  }
}
