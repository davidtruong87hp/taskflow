import { format, Logform } from 'winston';
import { trace } from '@opentelemetry/api';

// Adding the explicit return type annotation tells TypeScript exactly
// what this function returns, so it doesn't try to infer the complex
// internal Winston type and fail.
export const traceContextFormat = format(
  (info: Logform.TransformableInfo): Logform.TransformableInfo => {
    const activeSpan = trace.getActiveSpan();

    if (activeSpan) {
      const spanContext = activeSpan.spanContext();
      if (spanContext && trace.isSpanContextValid(spanContext)) {
        info.traceId = spanContext.traceId;
        info.spanId = spanContext.spanId;
      }
    }

    return info;
  },
);
