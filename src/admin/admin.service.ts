import { Injectable } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { CreateUserDto } from '../auth/dto/create-user.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService, private auth: AuthService) {}

  listUsers(role?: string) {
    return this.prisma.user
      .findMany({
        where: role ? { role: role as any } : undefined,
        include: { profile: true },
        orderBy: { createdAt: 'desc' },
      })
      .then((users) =>
        users.map((u) => ({
          id: u.id,
          email: u.email,
          role: u.role,
          name: u.profile?.name ?? null,
          vendorId: u.profile?.vendorId ?? null,
        })),
      );
  }

  getUser(id: string) {
    return this.auth.me(id);
  }

  createUser(dto: CreateUserDto) {
    return this.auth.createUser(dto);
  }

  linkPartnerVendor(userId: string, vendorId: string) {
    return this.prisma.profile.upsert({
      where: { id: userId },
      create: { id: userId, vendorId },
      update: { vendorId },
    });
  }
}
