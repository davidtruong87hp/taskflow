import { Controller, Get, Param } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('users')
  getUsers() {
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
  getUserWithTasks(@Param('id') id: string) {
    return this.appService.getUserWithTasks(id);
  }
}
