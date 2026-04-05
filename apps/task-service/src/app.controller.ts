import { Controller, Get, Param } from '@nestjs/common';
import { AppService } from './app.service';

@Controller('tasks')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  async findAll() {
    return this.appService.findAll();
  }

  // This endpoint lets the gateway ask "what tasks belong to user X?"
  // It's a common pattern — services expose query endpoints that other
  // services use to fulfill composite requests.
  @Get('user/:userId')
  async findByUser(@Param('userId') userId: string) {
    return this.appService.findByUser(userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.appService.findOne(id);
  }
}
