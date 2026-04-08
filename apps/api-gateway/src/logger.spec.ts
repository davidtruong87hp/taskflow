import { traceContextFormat } from './logger';
import { trace, Span, SpanContext } from '@opentelemetry/api';

jest.mock('@opentelemetry/api', () => ({
  trace: {
    getActiveSpan: jest.fn(),
    isSpanContextValid: jest.fn(),
  },
}));

describe('traceContextFormat', () => {
  const mockSpanContext: SpanContext = {
    traceId: 'abc123def456abc123def456abc12345',
    spanId: 'abc123def456abc1',
    traceFlags: 1,
  };

  const mockSpan = {
    spanContext: jest.fn().mockReturnValue(mockSpanContext),
  } as unknown as Span;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('injects traceId and spanId when active span exists', () => {
    (trace.getActiveSpan as jest.Mock).mockReturnValue(mockSpan);
    (trace.isSpanContextValid as jest.Mock).mockReturnValue(true);

    const formatter = traceContextFormat();
    const info = { level: 'info', message: 'test' };
    const result = formatter.transform(info);

    expect(result).toMatchObject({
      level: 'info',
      message: 'test',
      traceId: mockSpanContext.traceId,
      spanId: mockSpanContext.spanId,
    });
  });

  it('does not inject trace context when no active span', () => {
    (trace.getActiveSpan as jest.Mock).mockReturnValue(undefined);

    const formatter = traceContextFormat();
    const info = { level: 'info', message: 'test' };
    const result = formatter.transform(info);

    expect(result).not.toHaveProperty('traceId');
    expect(result).not.toHaveProperty('spanId');
  });

  it('does not inject trace context when span context is invalid', () => {
    (trace.getActiveSpan as jest.Mock).mockReturnValue(mockSpan);
    (trace.isSpanContextValid as jest.Mock).mockReturnValue(false);

    const formatter = traceContextFormat();
    const info = { level: 'info', message: 'test' };
    const result = formatter.transform(info);

    expect(result).not.toHaveProperty('traceId');
    expect(result).not.toHaveProperty('spanId');
  });

  it('returns the info object unchanged when no span', () => {
    (trace.getActiveSpan as jest.Mock).mockReturnValue(null);

    const formatter = traceContextFormat();
    const info = { level: 'warn', message: 'warning msg' };
    const result = formatter.transform(info);

    expect(result).toEqual(info);
  });
});
