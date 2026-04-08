import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';

const mockPrismaService = {
  user: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
};

describe('AppService (user-service)', () => {
  let service: AppService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<AppService>(AppService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('returns all users with total count', async () => {
      const users = [
        { id: 1, name: 'Alice', email: 'alice@taskflow.dev' },
        { id: 2, name: 'Bob', email: 'bob@taskflow.dev' },
      ];
      mockPrismaService.user.findMany.mockResolvedValue(users);

      const result = await service.findAll();

      expect(result).toEqual({ data: users, total: 2 });
      expect(mockPrismaService.user.findMany).toHaveBeenCalled();
    });

    it('returns empty list when no users exist', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual({ data: [], total: 0 });
    });
  });

  describe('findOne', () => {
    it('returns a user by id', async () => {
      const user = { id: 1, name: 'Alice', email: 'alice@taskflow.dev' };
      mockPrismaService.user.findUnique.mockResolvedValue(user);

      const result = await service.findOne('1');

      expect(result).toEqual(user);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('throws NotFoundException when user does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('999')).rejects.toThrow(
        'User with id 999 not found',
      );
    });
  });
});

describe('AppController (user-service)', () => {
  let controller: AppController;

  const mockAppService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [{ provide: AppService, useValue: mockAppService }],
    }).compile();

    controller = module.get<AppController>(AppController);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('returns all users', async () => {
      const users = { data: [{ id: 1, name: 'Alice' }], total: 1 };
      mockAppService.findAll.mockResolvedValue(users);

      const result = await controller.findAll();

      expect(result).toEqual(users);
      expect(mockAppService.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('returns a user by id', async () => {
      const user = { id: 1, name: 'Alice' };
      mockAppService.findOne.mockResolvedValue(user);

      const result = await controller.findOne('1');

      expect(result).toEqual(user);
      expect(mockAppService.findOne).toHaveBeenCalledWith('1');
    });
  });
});
