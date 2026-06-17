import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ConsultationsService {
  constructor(private prisma: PrismaService) {}

  findByUser(userId: string) {
    return this.prisma.consultation.findMany({
      where: { userId },
      orderBy: { date: 'asc' },
    });
  }

  findAll() {
    return this.prisma.consultation.findMany({ orderBy: { date: 'asc' } });
  }

  findByVendor(vendorId: string) {
    return this.prisma.consultation.findMany({
      where: { vendorId },
      orderBy: { date: 'asc' },
    });
  }

  create(
    userId: string,
    data: {
      vendorId: string;
      visitorName: string;
      date: string;
      time: string;
      meetingType: string;
      room: string;
      service: string;
    },
  ) {
    return this.prisma.consultation.create({
      data: {
        userId,
        vendorId: data.vendorId,
        visitorName: data.visitorName,
        date: new Date(data.date),
        time: new Date(`1970-01-01T${data.time}:00`),
        meetingType: data.meetingType,
        room: data.room,
        service: data.service,
        status: 'upcoming',
      },
    });
  }
}
