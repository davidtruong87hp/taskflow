import { Controller, Get, Param, Logger } from '@nestjs/common';
import { AppService } from './app.service';
import { RedisService } from './redis.service';

@Controller()
export class AppController {
  // NestJS's dependency injection provides a Logger instance scoped
  // to this controller. When you've replaced the default logger with
  // Winston (via useLogger in main.ts), this Logger automatically
  // routes through Winston — so these calls will produce structured
  // JSON with trace IDs injected automatically.
  private readonly logger = new Logger(AppController.name);

  constructor(
    private readonly appService: AppService,
    private readonly redis: RedisService,
  ) {}

  @Get('users')
  async getUsers() {
    const cached = await this.redis.get('users:all');

    if (cached) {
      this.logger.log('Cache hit: users:all');
      return cached;
    }
    this.logger.log('Cache miss: fetching all users');

    const result = await this.appService.getUsers();
    await this.redis.set('users:all', result, 30);

    return result;
  }

  @Get('users/:id')
  async getUser(@Param('id') id: string) {
    const cached = await this.redis.get(`users:${id}`);
    if (cached) return cached;

    const result = await this.appService.getUser(id);
    await this.redis.set(`users:${id}`, result, 30);

    return result;
  }

  @Get('tasks')
  async getTasks() {
    const cached = await this.redis.get('tasks:all');
    if (cached) return cached;

    const result = await this.appService.getTasks();
    await this.redis.set('tasks:all', result, 30);

    return result;
  }

  @Get('tasks/:id')
  async getTask(@Param('id') id: string) {
    const cached = await this.redis.get(`tasks:${id}`);
    if (cached) return cached;

    const result = await this.appService.getTask(id);
    await this.redis.set(`tasks:${id}`, result, 30);

    return result;
  }

  // This is the showcase endpoint — one call, data from two services.
  @Get('users/:id/with-tasks')
  async getUserWithTasks(@Param('id') id: string) {
    // This log call happens during an active OTel span, so Winston's
    // traceContextFormat will find trace.getActiveSpan() returning
    // the current request's span, and inject its traceId into the
    // JSON log record automatically.
    const cached = await this.redis.get(`users:${id}:with-tasks`);
    if (cached) return cached;

    this.logger.log(`Fetching user ${id} with tasks`);

    const result = await this.appService.getUserWithTasks(id);
    await this.redis.set(`users:${id}:with-tasks`, result, 30);

    this.logger.log(
      `Successfully fetched user ${id} with ${result.tasks?.length ?? 0} tasks`,
    );

    return result;
  }
}
