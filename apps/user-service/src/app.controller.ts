import { Controller, Get, Param } from '@nestjs/common';
import { AppService } from './app.service';

@Controller('users')
export class AppController {
  constructor(private readonly appService: AppService) {}

  // Returns a list of all users.
  // In a real app this would query a database — for now we return
  // hardcoded data so we can focus on the infrastructure wiring.
  @Get()
  async findAll() {
    return this.appService.findAll();
  }

  // Returns a single user by ID.
  // The @Param decorator extracts the :id segment from the URL path.
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.appService.findOne(id);
  }
}
