import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RoomBookingService {
  constructor(private prisma: PrismaService) {}

  listRooms() {
    return this.prisma.conferenceRoom.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    });
  }

  getSlots(roomId: string, date: string) {
    return this.prisma.timeSlot.findMany({
      where: { roomId, date: new Date(date), available: true },
      orderBy: { startAt: 'asc' },
    });
  }

  bookRoom(
    roomId: string,
    dto: {
      date: string;
      startAt: string;
      endAt: string;
      purpose: string;
      contactInfo?: string;
      visitorId?: string;
      userId?: string;
    },
  ) {
    return this.prisma.roomBooking.create({
      data: {
        roomId,
        date: new Date(dto.date),
        startAt: new Date(`1970-01-01T${dto.startAt}:00`),
        endAt: new Date(`1970-01-01T${dto.endAt}:00`),
        purpose: dto.purpose,
        contactInfo: dto.contactInfo,
        userId: dto.userId,
        visitorId: dto.visitorId,
        status: 'confirmed',
      },
    });
  }

  listBookings(userId?: string) {
    return this.prisma.roomBooking.findMany({
      where: userId ? { userId } : undefined,
      orderBy: { date: 'desc' },
      include: { room: true },
    });
  }
}
