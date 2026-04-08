import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RedisService } from './redis.service';

const mockAppService = {
  getUsers: jest.fn(),
  getUser: jest.fn(),
  getTasks: jest.fn(),
  getTask: jest.fn(),
  getUserWithTasks: jest.fn(),
};

const mockRedisService = {
  get: jest.fn(),
  set: jest.fn(),
};

describe('AppController', () => {
  let controller: AppController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        { provide: AppService, useValue: mockAppService },
        { provide: RedisService, useValue: mockRedisService },
      ],
    }).compile();

    controller = module.get<AppController>(AppController);
    jest.clearAllMocks();
  });

  describe('getUsers', () => {
    it('returns cached data on cache hit', async () => {
      const cached = { data: [{ id: 1, name: 'Alice' }], total: 1 };
      mockRedisService.get.mockResolvedValue(cached);

      const result = await controller.getUsers();

      expect(result).toEqual(cached);
      expect(mockRedisService.get).toHaveBeenCalledWith('users:all');
      expect(mockAppService.getUsers).not.toHaveBeenCalled();
    });

    it('fetches from service and caches on cache miss', async () => {
      const users = { data: [{ id: 1, name: 'Alice' }], total: 1 };
      mockRedisService.get.mockResolvedValue(null);
      mockAppService.getUsers.mockResolvedValue(users);

      const result = await controller.getUsers();

      expect(result).toEqual(users);
      expect(mockAppService.getUsers).toHaveBeenCalled();
      expect(mockRedisService.set).toHaveBeenCalledWith('users:all', users, 30);
    });
  });

  describe('getUser', () => {
    it('returns cached data on cache hit', async () => {
      const cached = { id: 1, name: 'Alice' };
      mockRedisService.get.mockResolvedValue(cached);

      const result = await controller.getUser('1');

      expect(result).toEqual(cached);
      expect(mockRedisService.get).toHaveBeenCalledWith('users:1');
      expect(mockAppService.getUser).not.toHaveBeenCalled();
    });

    it('fetches from service and caches on cache miss', async () => {
      const user = { id: 1, name: 'Alice' };
      mockRedisService.get.mockResolvedValue(null);
      mockAppService.getUser.mockResolvedValue(user);

      const result = await controller.getUser('1');

      expect(result).toEqual(user);
      expect(mockAppService.getUser).toHaveBeenCalledWith('1');
      expect(mockRedisService.set).toHaveBeenCalledWith('users:1', user, 30);
    });
  });

  describe('getTasks', () => {
    it('returns cached data on cache hit', async () => {
      const cached = { data: [{ id: 1, title: 'Task 1' }], total: 1 };
      mockRedisService.get.mockResolvedValue(cached);

      const result = await controller.getTasks();

      expect(result).toEqual(cached);
      expect(mockRedisService.get).toHaveBeenCalledWith('tasks:all');
      expect(mockAppService.getTasks).not.toHaveBeenCalled();
    });

    it('fetches from service and caches on cache miss', async () => {
      const tasks = { data: [{ id: 1, title: 'Task 1' }], total: 1 };
      mockRedisService.get.mockResolvedValue(null);
      mockAppService.getTasks.mockResolvedValue(tasks);

      const result = await controller.getTasks();

      expect(result).toEqual(tasks);
      expect(mockAppService.getTasks).toHaveBeenCalled();
      expect(mockRedisService.set).toHaveBeenCalledWith('tasks:all', tasks, 30);
    });
  });

  describe('getTask', () => {
    it('returns cached data on cache hit', async () => {
      const cached = { id: 1, title: 'Task 1' };
      mockRedisService.get.mockResolvedValue(cached);

      const result = await controller.getTask('1');

      expect(result).toEqual(cached);
      expect(mockRedisService.get).toHaveBeenCalledWith('tasks:1');
      expect(mockAppService.getTask).not.toHaveBeenCalled();
    });

    it('fetches from service and caches on cache miss', async () => {
      const task = { id: 1, title: 'Task 1' };
      mockRedisService.get.mockResolvedValue(null);
      mockAppService.getTask.mockResolvedValue(task);

      const result = await controller.getTask('1');

      expect(result).toEqual(task);
      expect(mockAppService.getTask).toHaveBeenCalledWith('1');
      expect(mockRedisService.set).toHaveBeenCalledWith('tasks:1', task, 30);
    });
  });

  describe('getUserWithTasks', () => {
    it('returns cached data on cache hit', async () => {
      const cached = { id: 1, name: 'Alice', tasks: [] };
      mockRedisService.get.mockResolvedValue(cached);

      const result = await controller.getUserWithTasks('1');

      expect(result).toEqual(cached);
      expect(mockRedisService.get).toHaveBeenCalledWith('users:1:with-tasks');
      expect(mockAppService.getUserWithTasks).not.toHaveBeenCalled();
    });

    it('fetches from service and caches on cache miss', async () => {
      const userWithTasks = {
        id: 1,
        name: 'Alice',
        tasks: [{ id: 1, title: 'Task 1' }],
      };
      mockRedisService.get.mockResolvedValue(null);
      mockAppService.getUserWithTasks.mockResolvedValue(userWithTasks);

      const result = await controller.getUserWithTasks('1');

      expect(result).toEqual(userWithTasks);
      expect(mockAppService.getUserWithTasks).toHaveBeenCalledWith('1');
      expect(mockRedisService.set).toHaveBeenCalledWith(
        'users:1:with-tasks',
        userWithTasks,
        30,
      );
    });
  });
});
