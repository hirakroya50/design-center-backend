import { Test, TestingModule } from '@nestjs/testing';
import { RoomBookingService } from './room-booking.service';
import { PrismaService } from '../prisma/prisma.service';

describe('RoomBookingService', () => {
  let service: RoomBookingService;
  let prisma: PrismaService;

  const mockPrisma = {
    conferenceRoom: {
      findMany: jest.fn(),
    },
    timeSlot: {
      findMany: jest.fn(),
    },
    roomBooking: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomBookingService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<RoomBookingService>(RoomBookingService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('listRooms', () => {
    it('should return all active rooms ordered by name', async () => {
      const rooms = [
        { id: 'room-1', name: 'A Room', active: true },
        { id: 'room-2', name: 'B Room', active: true },
      ];
      mockPrisma.conferenceRoom.findMany.mockResolvedValue(rooms);

      const result = await service.listRooms();

      expect(result).toEqual(rooms);
      expect(mockPrisma.conferenceRoom.findMany).toHaveBeenCalledWith({
        where: { active: true },
        orderBy: { name: 'asc' },
      });
    });
  });

  describe('getSlots', () => {
    it('should return available time slots for a room on a date', async () => {
      const slots = [
        { id: 'slot-1', roomId: 'room-1', date: new Date('2026-06-22'), startAt: new Date('1970-01-01T09:00:00'), endAt: new Date('1970-01-01T10:00:00'), available: true },
      ];
      mockPrisma.timeSlot.findMany.mockResolvedValue(slots);

      const result = await service.getSlots('room-1', '2026-06-22');

      expect(result).toEqual(slots);
      expect(mockPrisma.timeSlot.findMany).toHaveBeenCalledWith({
        where: { roomId: 'room-1', date: new Date('2026-06-22'), available: true },
        orderBy: { startAt: 'asc' },
      });
    });
  });

  describe('bookRoom', () => {
    it('should create a booking and return it', async () => {
      const dto = {
        date: '2026-06-22',
        startAt: '09:00',
        endAt: '10:00',
        purpose: 'Team meeting',
        contactInfo: 'john@example.com',
        userId: 'user-1',
      };
      const booking = {
        id: 'booking-1',
        roomId: 'room-1',
        ...dto,
        date: new Date('2026-06-22'),
        startAt: new Date('1970-01-01T09:00:00'),
        endAt: new Date('1970-01-01T10:00:00'),
        status: 'confirmed',
        contactInfo: 'john@example.com',
        userId: 'user-1',
        visitorId: null,
        createdAt: new Date(),
      };
      mockPrisma.roomBooking.create.mockResolvedValue(booking);

      const result = await service.bookRoom('room-1', dto);

      expect(result).toEqual(booking);
      expect(mockPrisma.roomBooking.create).toHaveBeenCalledWith({
        data: {
          roomId: 'room-1',
          date: new Date('2026-06-22'),
          startAt: new Date('1970-01-01T09:00:00'),
          endAt: new Date('1970-01-01T10:00:00'),
          purpose: 'Team meeting',
          contactInfo: 'john@example.com',
          userId: 'user-1',
          status: 'confirmed',
        },
      });
    });

    it('should create a booking with visitorId and without userId', async () => {
      const dto = {
        date: '2026-06-22',
        startAt: '10:00',
        endAt: '11:00',
        purpose: 'Client meeting',
        visitorId: 'visitor-1',
      };
      const booking = {
        id: 'booking-2',
        roomId: 'room-1',
        date: new Date('2026-06-22'),
        startAt: new Date('1970-01-01T10:00:00'),
        endAt: new Date('1970-01-01T11:00:00'),
        purpose: 'Client meeting',
        visitorId: 'visitor-1',
        userId: null,
        contactInfo: null,
        status: 'confirmed',
        createdAt: new Date(),
      };
      mockPrisma.roomBooking.create.mockResolvedValue(booking);

      const result = await service.bookRoom('room-1', dto);

      expect(result).toEqual(booking);
      expect(mockPrisma.roomBooking.create).toHaveBeenCalledWith({
        data: {
          roomId: 'room-1',
          date: new Date('2026-06-22'),
          startAt: new Date('1970-01-01T10:00:00'),
          endAt: new Date('1970-01-01T11:00:00'),
          purpose: 'Client meeting',
          visitorId: 'visitor-1',
          status: 'confirmed',
        },
      });
    });
  });

  describe('listBookings', () => {
    it('should return all bookings when no userId provided', async () => {
      const bookings = [
        { id: 'booking-1', roomId: 'room-1', date: new Date('2026-06-22') },
      ];
      mockPrisma.roomBooking.findMany.mockResolvedValue(bookings);

      const result = await service.listBookings();

      expect(result).toEqual(bookings);
      expect(mockPrisma.roomBooking.findMany).toHaveBeenCalledWith({
        orderBy: { date: 'desc' },
        include: { room: true },
      });
    });

    it('should return bookings filtered by userId', async () => {
      const bookings = [
        { id: 'booking-1', roomId: 'room-1', userId: 'user-1', date: new Date('2026-06-22') },
      ];
      mockPrisma.roomBooking.findMany.mockResolvedValue(bookings);

      const result = await service.listBookings('user-1');

      expect(result).toEqual(bookings);
      expect(mockPrisma.roomBooking.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { date: 'desc' },
        include: { room: true },
      });
    });
  });
});
