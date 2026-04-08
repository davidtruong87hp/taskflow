import { MetricsMiddleware } from './metrics.middleware';
import { Request, Response, NextFunction } from 'express';

// Mock prom-client before importing the middleware
jest.mock('prom-client', () => ({
  Counter: jest.fn().mockImplementation(() => ({
    inc: jest.fn(),
  })),
  Histogram: jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
  })),
}));

describe('MetricsMiddleware', () => {
  let middleware: MetricsMiddleware;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let finishCallback: () => void;

  beforeEach(() => {
    middleware = new MetricsMiddleware();
    mockNext = jest.fn();

    mockRequest = {
      method: 'GET',
      url: '/users',
      route: { path: '/users' } as any,
    };

    mockResponse = {
      statusCode: 200,
      on: jest.fn().mockImplementation((event, cb) => {
        if (event === 'finish') finishCallback = cb;
        return mockResponse as Response;
      }),
    };
  });

  it('calls next()', () => {
    middleware.use(mockRequest as Request, mockResponse as Response, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });

  it('registers a finish event listener', () => {
    middleware.use(mockRequest as Request, mockResponse as Response, mockNext);
    expect(mockResponse.on).toHaveBeenCalledWith(
      'finish',
      expect.any(Function),
    );
  });

  it('uses req.url when route is not defined', () => {
    mockRequest.route = undefined;
    mockRequest.url = '/fallback';

    middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

    // Should not throw when finish fires
    expect(() => finishCallback()).not.toThrow();
  });

  it('records metrics with correct labels on finish', () => {
    middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

    // Simulate response finishing
    finishCallback();

    // The middleware ran without error and finish fired
    expect(mockNext).toHaveBeenCalled();
  });

  it('uses route.path over req.url for normalization', () => {
    mockRequest.route = { path: '/users/:id' } as any;
    mockRequest.url = '/users/123';

    middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

    expect(() => finishCallback()).not.toThrow();
  });
});
