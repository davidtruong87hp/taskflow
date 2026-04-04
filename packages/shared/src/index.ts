// Keep the shared package simple — interfaces and constants only.
// Complex infrastructure code (OpenTelemetry, logging setup) lives
// in each service to avoid module resolution complexity.

export interface ServiceConfig {
  serviceName: string;
  serviceVersion: string;
}

export const SERVICE_NAMES = {
  API_GATEWAY: 'api-gateway',
  USER_SERVICE: 'user-service',
  TASK_SERVICE: 'task-service',
} as const;
