import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { HttpModule } from '@nestjs/axios';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { MetricsMiddleware } from './metrics.middleware';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { traceContextFormat } from './logger';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { APP_GUARD } from '@nestjs/core';
import { RedisService } from './redis.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TerminusModule,
    HttpModule,
    // This automatically creates a GET /metrics endpoint that exposes
    // all registered metrics in Prometheus text format. The defaultMetrics
    // option enables Node.js process metrics (memory, CPU, event loop lag)
    // for free — useful baseline data with zero extra effort.
    PrometheusModule.register({
      defaultMetrics: {
        enabled: true,
      },
    }),
    WinstonModule.forRoot({
      // The transports array defines where log output goes.
      // Console transport writes to stdout, which Kubernetes captures
      // and Promtail then ships to Loki.
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            // Add timestamp to every log record
            winston.format.timestamp(),
            // Inject OTel trace context (our custom format from above)
            traceContextFormat(),
            // Emit JSON — this is the key change from NestJS's default
            // plain-text logger. Loki receives JSON and can parse fields
            // as labels, enabling powerful filtering in Grafana.
            winston.format.json(),
          ),
        }),
      ],
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: config.get<number>('THROTTLE_TTL', 60000),
            limit: config.get<number>('THROTTLE_LIMIT', 100),
          },
        ],
        storage: new ThrottlerStorageRedisService({
          host: 'redis',
          port: 6379,
          password: config.get('REDIS_PASSWORD'),
        }),
      }),
    }),
  ],
  controllers: [AppController, HealthController],
  providers: [
    AppService,
    RedisService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply to all routes. The forRoutes('*') pattern means every
    // request goes through MetricsMiddleware before hitting any controller.
    consumer.apply(MetricsMiddleware).forRoutes('*');
  }
}
