import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VendorsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.vendor.findMany({ orderBy: { name: 'asc' } });
  }

  async findOne(id: string) {
    const v = await this.prisma.vendor.findUnique({ where: { id } });
    if (!v) throw new NotFoundException('Vendor not found');
    return v;
  }

  create(data: any) {
    return this.prisma.vendor.create({ data });
  }

  update(id: string, data: any) {
    return this.prisma.vendor.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prisma.vendor.delete({ where: { id } });
  }
}
