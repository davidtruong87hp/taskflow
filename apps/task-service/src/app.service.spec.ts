import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';

const mockPrismaService = {
  task: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
};

describe('AppService (task-service)', () => {
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
    it('returns all tasks with total count', async () => {
      const tasks = [
        { id: 1, title: 'Set up CI pipeline', userId: 1, status: 'done' },
        { id: 2, title: 'Write K8s manifests', userId: 1, status: 'done' },
      ];
      mockPrismaService.task.findMany.mockResolvedValue(tasks);

      const result = await service.findAll();

      expect(result).toEqual({ data: tasks, total: 2 });
      expect(mockPrismaService.task.findMany).toHaveBeenCalled();
    });

    it('returns empty list when no tasks exist', async () => {
      mockPrismaService.task.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual({ data: [], total: 0 });
    });
  });

  describe('findOne', () => {
    it('returns a task by id', async () => {
      const task = {
        id: 1,
        title: 'Set up CI pipeline',
        userId: 1,
        status: 'done',
      };
      mockPrismaService.task.findUnique.mockResolvedValue(task);

      const result = await service.findOne('1');

      expect(result).toEqual(task);
      expect(mockPrismaService.task.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('throws NotFoundException when task does not exist', async () => {
      mockPrismaService.task.findUnique.mockResolvedValue(null);

      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('999')).rejects.toThrow(
        'Task with id 999 not found',
      );
    });
  });

  describe('findByUser', () => {
    it('returns tasks for a specific user', async () => {
      const tasks = [
        { id: 1, title: 'Set up CI pipeline', userId: 1, status: 'done' },
        { id: 2, title: 'Write K8s manifests', userId: 1, status: 'done' },
      ];
      mockPrismaService.task.findMany.mockResolvedValue(tasks);

      const result = await service.findByUser('1');

      expect(result).toEqual({ data: tasks });
      expect(mockPrismaService.task.findMany).toHaveBeenCalledWith({
        where: { userId: 1 },
      });
    });

    it('returns empty list when user has no tasks', async () => {
      mockPrismaService.task.findMany.mockResolvedValue([]);

      const result = await service.findByUser('99');

      expect(result).toEqual({ data: [] });
    });
  });
});

describe('AppController (task-service)', () => {
  let controller: AppController;

  const mockAppService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByUser: jest.fn(),
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
    it('returns all tasks', async () => {
      const tasks = { data: [{ id: 1, title: 'Task 1' }], total: 1 };
      mockAppService.findAll.mockResolvedValue(tasks);

      const result = await controller.findAll();

      expect(result).toEqual(tasks);
      expect(mockAppService.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('returns a task by id', async () => {
      const task = { id: 1, title: 'Task 1' };
      mockAppService.findOne.mockResolvedValue(task);

      const result = await controller.findOne('1');

      expect(result).toEqual(task);
      expect(mockAppService.findOne).toHaveBeenCalledWith('1');
    });
  });

  describe('findByUser', () => {
    it('returns tasks for a specific user', async () => {
      const tasks = { data: [{ id: 1, title: 'Task 1', userId: 1 }] };
      mockAppService.findByUser.mockResolvedValue(tasks);

      const result = await controller.findByUser('1');

      expect(result).toEqual(tasks);
      expect(mockAppService.findByUser).toHaveBeenCalledWith('1');
    });
  });
});
