import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // Suppress NestJS's built-in logger during bootstrap,
    // before our Winston logger is ready
    bufferLogs: true,
  });

  // Replace NestJS's default logger with our Winston instance.
  // From this point on, all NestJS framework logs (route mappings,
  // application started, etc.) go through Winston and get trace context.
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);

  await app.listen(port);
  console.log(`api-gateway is running on port ${port}`);
}
bootstrap();
