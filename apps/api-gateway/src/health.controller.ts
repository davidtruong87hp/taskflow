import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(private health: HealthCheckService) {}

  @Get()
  @HealthCheck()
  check() {
    // For now, an empty indicators array means "if the process is running
    // and responding to HTTP, report healthy." Later we'll add database
    // connectivity checks, memory threshold checks, and more.
    return this.health.check([]);
  }
}
