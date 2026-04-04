import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { HttpModule } from '@nestjs/axios';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { MetricsMiddleware } from './metrics.middleware';

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
  ],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply to all routes. The forRoutes('*') pattern means every
    // request goes through MetricsMiddleware before hitting any controller.
    consumer.apply(MetricsMiddleware).forRoutes('*');
  }
}
