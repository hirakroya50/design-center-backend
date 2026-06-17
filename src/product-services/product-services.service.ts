import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductServicesService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.service.findMany({ orderBy: { name: 'asc' } });
  }

  async findOne(id: string) {
    const s = await this.prisma.service.findUnique({ where: { id } });
    if (!s) throw new NotFoundException('Service not found');
    return s;
  }

  create(data: any) {
    return this.prisma.service.create({ data });
  }

  update(id: string, data: any) {
    return this.prisma.service.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prisma.service.delete({ where: { id } });
  }
}
