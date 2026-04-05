import { Controller, Get, Param, Logger } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  // NestJS's dependency injection provides a Logger instance scoped
  // to this controller. When you've replaced the default logger with
  // Winston (via useLogger in main.ts), this Logger automatically
  // routes through Winston — so these calls will produce structured
  // JSON with trace IDs injected automatically.
  private readonly logger = new Logger(AppController.name);

  constructor(private readonly appService: AppService) {}

  @Get('users')
  getUsers() {
    this.logger.log('Fetching all users');
    return this.appService.getUsers();
  }

  @Get('users/:id')
  getUser(@Param('id') id: string) {
    return this.appService.getUser(id);
  }

  @Get('tasks')
  getTasks() {
    return this.appService.getTasks();
  }

  @Get('tasks/:id')
  getTask(@Param('id') id: string) {
    return this.appService.getTask(id);
  }

  // This is the showcase endpoint — one call, data from two services.
  @Get('users/:id/with-tasks')
  async getUserWithTasks(@Param('id') id: string) {
    // This log call happens during an active OTel span, so Winston's
    // traceContextFormat will find trace.getActiveSpan() returning
    // the current request's span, and inject its traceId into the
    // JSON log record automatically.
    this.logger.log(`Fetching user ${id} with tasks`);
    const result = await this.appService.getUserWithTasks(id);
    this.logger.log(
      `Successfully fetched user ${id} with ${result.tasks?.length ?? 0} tasks`,
    );
    return result;
  }
}
