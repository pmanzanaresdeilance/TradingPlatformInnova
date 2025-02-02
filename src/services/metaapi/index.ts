export { MetaApiClient } from './core/client';
export { WebSocketClient } from './core/websocket';
export { RiskManager } from './risk/riskManager';
export { MetricsCalculator } from './stats/metricsCalculator';
export { HealthCheck } from './utils/healthCheck';
export { logger } from './utils/logger';

export type { 
  MetaApiConfig,
  MetaApiAccount,
  CreateAccountOptions 
} from './core/types';