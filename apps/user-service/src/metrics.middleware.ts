import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { Counter, Histogram } from 'prom-client';

// We create these metrics once and reuse them for every request.
// Prometheus requires that metric names are unique within a registry —
// creating a new Counter on every request would throw an error.
const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  // Labels are dimensions you can filter and group by in PromQL.
  // This lets you ask "how many POST /users requests returned 404?"
  labelNames: ['method', 'route', 'status_code'],
});

const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  // These bucket boundaries define the resolution of your percentile calculations.
  // Choose values that make sense for your expected latency range.
  // Having a bucket at 0.1 (100ms) means you can meaningfully calculate p99 < 100ms.
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
});

@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Record the exact time this request arrived
    const start = process.hrtime.bigint();

    // We hook into the 'finish' event rather than wrapping next() in a try/catch,
    // because 'finish' fires after the response is fully sent to the client —
    // including after any async work your controller does.
    res.on('finish', () => {
      const durationInSeconds = Number(process.hrtime.bigint() - start) / 1e9;

      // Normalize the route to avoid high cardinality.
      // Without this, /users/1 and /users/2 would be separate label values,
      // which defeats the purpose of aggregated metrics.
      const route = req.route?.path ?? req.path;
      const labels = {
        method: req.method,
        route,
        status_code: res.statusCode.toString(),
      };

      httpRequestsTotal.inc(labels);
      httpRequestDuration.observe(labels, durationInSeconds);
    });

    next();
  }
}
