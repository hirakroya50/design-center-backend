import { Test, TestingModule } from '@nestjs/testing';
import { ProfileService } from './profile.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ProfileService', () => {
  let service: ProfileService;
  let prisma: PrismaService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
    },
    profile: {
      upsert: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfileService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ProfileService>(ProfileService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('get', () => {
    it('should return mapped user fields with profile data', async () => {
      const user = {
        id: 'user-1',
        email: 'test@example.com',
        role: 'visitor',
        profile: {
          name: 'John',
          phone: '1234567890',
          avatarUrl: 'http://example.com/avatar.png',
          heardAboutUs: 'Google',
          vendorId: 'vendor-1',
        },
      };
      mockPrisma.user.findUnique.mockResolvedValue(user);

      const result = await service.get('user-1');

      expect(result).toEqual({
        id: 'user-1',
        email: 'test@example.com',
        role: 'visitor',
        name: 'John',
        phone: '1234567890',
        avatarUrl: 'http://example.com/avatar.png',
        heardAboutUs: 'Google',
        vendorId: 'vendor-1',
      });
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        include: { profile: true },
      });
    });

    it('should return null fields when profile is missing', async () => {
      const user = {
        id: 'user-1',
        email: 'test@example.com',
        role: 'visitor',
        profile: null,
      };
      mockPrisma.user.findUnique.mockResolvedValue(user);

      const result = await service.get('user-1');

      expect(result).toEqual({
        id: 'user-1',
        email: 'test@example.com',
        role: 'visitor',
        name: null,
        phone: null,
        avatarUrl: null,
        heardAboutUs: null,
        vendorId: null,
      });
    });

    it('should throw when user is not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.get('nonexistent')).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('should upsert profile and return updated user', async () => {
      const data = { name: 'Jane', phone: '0987654321' };
      const updatedUser = {
        id: 'user-1',
        email: 'test@example.com',
        role: 'visitor',
        profile: { name: 'Jane', phone: '0987654321', avatarUrl: null, heardAboutUs: null, vendorId: null },
      };

      mockPrisma.profile.upsert.mockResolvedValue(undefined);
      mockPrisma.user.findUnique.mockResolvedValue(updatedUser);

      const result = await service.update('user-1', data);

      expect(mockPrisma.profile.upsert).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        create: { id: 'user-1', ...data },
        update: data,
      });
      expect(result).toEqual({
        id: 'user-1',
        email: 'test@example.com',
        role: 'visitor',
        name: 'Jane',
        phone: '0987654321',
        avatarUrl: null,
        heardAboutUs: null,
        vendorId: null,
      });
    });
  });
});
