import { Test, TestingModule } from '@nestjs/testing';
import { ConsultationsService } from './consultations.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ConsultationsService', () => {
  let service: ConsultationsService;
  let prisma: PrismaService;

  const mockPrisma = {
    consultation: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConsultationsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ConsultationsService>(ConsultationsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByUser', () => {
    it('should return consultations for a given userId ordered by date', async () => {
      const consultations = [
        { id: '1', userId: 'user-1', date: new Date('2025-01-01') },
        { id: '2', userId: 'user-1', date: new Date('2025-01-02') },
      ];
      mockPrisma.consultation.findMany.mockResolvedValue(consultations);

      const result = await service.findByUser('user-1');

      expect(result).toEqual(consultations);
      expect(mockPrisma.consultation.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { date: 'asc' },
      });
    });
  });

  describe('findAll', () => {
    it('should return all consultations ordered by date', async () => {
      const consultations = [
        { id: '1', date: new Date('2025-01-01') },
        { id: '2', date: new Date('2025-01-02') },
      ];
      mockPrisma.consultation.findMany.mockResolvedValue(consultations);

      const result = await service.findAll();

      expect(result).toEqual(consultations);
      expect(mockPrisma.consultation.findMany).toHaveBeenCalledWith({
        orderBy: { date: 'asc' },
      });
    });
  });

  describe('findByVendor', () => {
    it('should return consultations for a given vendorId ordered by date', async () => {
      const consultations = [
        { id: '1', vendorId: 'vendor-1', date: new Date('2025-01-01') },
      ];
      mockPrisma.consultation.findMany.mockResolvedValue(consultations);

      const result = await service.findByVendor('vendor-1');

      expect(result).toEqual(consultations);
      expect(mockPrisma.consultation.findMany).toHaveBeenCalledWith({
        where: { vendorId: 'vendor-1' },
        orderBy: { date: 'asc' },
      });
    });
  });

  describe('create', () => {
    it('should create a consultation with default status upcoming', async () => {
      const data = {
        vendorId: 'vendor-1',
        visitorName: 'John Doe',
        date: '2025-06-15',
        time: '14:30',
        meetingType: 'in-person',
        room: 'Room A',
        service: 'Consulting',
      };
      const created = { id: '1', userId: 'user-1', ...data, status: 'upcoming' };
      mockPrisma.consultation.create.mockResolvedValue(created);

      const result = await service.create('user-1', data);

      expect(result).toEqual(created);
      expect(mockPrisma.consultation.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          vendorId: 'vendor-1',
          visitorName: 'John Doe',
          date: new Date('2025-06-15'),
          time: new Date('1970-01-01T14:30:00'),
          meetingType: 'in-person',
          room: 'Room A',
          service: 'Consulting',
          status: 'upcoming',
        },
      });
    });
  });
});
