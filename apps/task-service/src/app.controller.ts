import { Controller, Get, Param } from '@nestjs/common';
import { AppService } from './app.service';

@Controller('tasks')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  findAll() {
    return this.appService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.appService.findOne(id);
  }

  // This endpoint lets the gateway ask "what tasks belong to user X?"
  // It's a common pattern — services expose query endpoints that other
  // services use to fulfill composite requests.
  @Get('user/:userId')
  findByUser(@Param('userId') userId: string) {
    return this.appService.findByUser(userId);
  }
}
