import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from './app.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of } from 'rxjs';
import { AxiosResponse } from 'axios';

const mockHttpService = {
  get: jest.fn(),
};

const mockConfigService = {
  get: jest.fn((key: string) => {
    const config: Record<string, string> = {
      USER_SERVICE_URL: 'http://user-service:4002',
      TASK_SERVICE_URL: 'http://task-service:4001',
    };
    return config[key];
  }),
};

const mockAxiosResponse = <T>(data: T): AxiosResponse<T> => ({
  data,
  status: 200,
  statusText: 'OK',
  headers: {},
  config: {} as any,
});

describe('AppService', () => {
  let service: AppService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppService,
        { provide: HttpService, useValue: mockHttpService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AppService>(AppService);
    jest.clearAllMocks();
  });

  describe('getUsers', () => {
    it('fetches users from user-service', async () => {
      const users = { data: [{ id: 1, name: 'Alice' }], total: 1 };
      mockHttpService.get.mockReturnValue(of(mockAxiosResponse(users)));

      const result = await service.getUsers();

      expect(result).toEqual(users);
      expect(mockHttpService.get).toHaveBeenCalledWith(
        'http://user-service:4002/users',
      );
    });
  });

  describe('getUser', () => {
    it('fetches a single user by id', async () => {
      const user = { id: 1, name: 'Alice' };
      mockHttpService.get.mockReturnValue(of(mockAxiosResponse(user)));

      const result = await service.getUser('1');

      expect(result).toEqual(user);
      expect(mockHttpService.get).toHaveBeenCalledWith(
        'http://user-service:4002/users/1',
      );
    });
  });

  describe('getTasks', () => {
    it('fetches tasks from task-service', async () => {
      const tasks = { data: [{ id: 1, title: 'Task 1' }], total: 1 };
      mockHttpService.get.mockReturnValue(of(mockAxiosResponse(tasks)));

      const result = await service.getTasks();

      expect(result).toEqual(tasks);
      expect(mockHttpService.get).toHaveBeenCalledWith(
        'http://task-service:4001/tasks',
      );
    });
  });

  describe('getTask', () => {
    it('fetches a single task by id', async () => {
      const task = { id: 1, title: 'Task 1' };
      mockHttpService.get.mockReturnValue(of(mockAxiosResponse(task)));

      const result = await service.getTask('1');

      expect(result).toEqual(task);
      expect(mockHttpService.get).toHaveBeenCalledWith(
        'http://task-service:4001/tasks/1',
      );
    });
  });

  describe('getUserWithTasks', () => {
    it('fetches user and tasks in parallel and merges them', async () => {
      const user = { id: 1, name: 'Alice', email: 'alice@taskflow.dev' };
      const tasks = { data: [{ id: 1, title: 'Task 1', userId: 1 }] };

      mockHttpService.get
        .mockReturnValueOnce(of(mockAxiosResponse(user)))
        .mockReturnValueOnce(of(mockAxiosResponse(tasks)));

      const result = await service.getUserWithTasks('1');

      expect(result).toEqual({
        id: 1,
        name: 'Alice',
        email: 'alice@taskflow.dev',
        tasks: tasks.data,
      });
      expect(mockHttpService.get).toHaveBeenCalledTimes(2);
      expect(mockHttpService.get).toHaveBeenCalledWith(
        'http://user-service:4002/users/1',
      );
      expect(mockHttpService.get).toHaveBeenCalledWith(
        'http://task-service:4001/tasks/user/1',
      );
    });
  });
});
