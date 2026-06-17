import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProfileService {
  constructor(private prisma: PrismaService) {}

  async get(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });
    return {
      id: user!.id,
      email: user!.email,
      role: user!.role,
      name: user!.profile?.name ?? null,
      phone: user!.profile?.phone ?? null,
      avatarUrl: user!.profile?.avatarUrl ?? null,
      vendorId: user!.profile?.vendorId ?? null,
    };
  }

  async update(userId: string, data: { name?: string; phone?: string; avatarUrl?: string }) {
    await this.prisma.profile.upsert({
      where: { id: userId },
      create: { id: userId, ...data },
      update: data,
    });
    return this.get(userId);
  }
}
