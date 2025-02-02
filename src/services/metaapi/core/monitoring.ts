import { logger } from '../utils/logger';
import { AuditLogger, AuditEventType } from './audit';
import { HealthCheck } from '../utils/healthCheck';

interface MetricsData {
  requestCount: number;
  errorCount: number;
  avgResponseTime: number;
  lastError?: Error;
}

export class MonitoringService {
  private static instance: MonitoringService;
  private metrics: Map<string, MetricsData>;
  private auditLogger: AuditLogger;
  private healthCheck: HealthCheck;

  private constructor() {
    this.metrics = new Map();
    this.auditLogger = new AuditLogger();
    this.healthCheck = HealthCheck.getInstance();
    this.setupHealthChecks();
  }

  public static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  private setupHealthChecks(): void {
    // Add API health check
    this.healthCheck.addCheck('meta-api', async () => {
      try {
        const response = await fetch(
          'https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai/health',
          {
            method: 'HEAD',
            timeout: 5000
          }
        );
        return response.ok;
      } catch {
        return false;
      }
    });

    // Add WebSocket health check
    this.healthCheck.addCheck('websocket', async () => {
      return new Promise((resolve) => {
        const ws = new WebSocket('wss://mt-client-api-v1.agiliumtrade.agiliumtrade.ai/ws');
        const timeout = setTimeout(() => {
          ws.close();
          resolve(false);
        }, 5000);

        ws.onopen = () => {
          clearTimeout(timeout);
          ws.close();
          resolve(true);
        };

        ws.onerror = () => {
          clearTimeout(timeout);
          resolve(false);
        };
      });
    });

    // Start health checks
    this.healthCheck.start(60000); // Check every minute
  }

  public recordApiCall(endpoint: string, startTime: number): void {
    const duration = Date.now() - startTime;
    const metrics = this.getMetrics(endpoint);

    metrics.requestCount++;
    metrics.avgResponseTime = (
      (metrics.avgResponseTime * (metrics.requestCount - 1) + duration) /
      metrics.requestCount
    );

    logger.debug('API call recorded', {
      endpoint,
      duration,
      metrics
    });
  }

  public recordError(endpoint: string, error: Error): void {
    const metrics = this.getMetrics(endpoint);
    metrics.errorCount++;
    metrics.lastError = error;

    logger.error('API error recorded', {
      endpoint,
      error,
      errorCount: metrics.errorCount
    });

    // Log security-related errors to audit log
    if (error.name === 'AuthenticationError' || error.name === 'AuthorizationError') {
      this.auditLogger.logEvent({
        type: AuditEventType.SECURITY_VIOLATION,
        userId: 'system',
        metadata: {
          endpoint,
          errorType: error.name,
          message: error.message
        },
        severity: 'ERROR'
      });
    }
  }

  private getMetrics(endpoint: string): MetricsData {
    if (!this.metrics.has(endpoint)) {
      this.metrics.set(endpoint, {
        requestCount: 0,
        errorCount: 0,
        avgResponseTime: 0
      });
    }
    return this.metrics.get(endpoint)!;
  }

  public getMetricsReport(): Record<string, MetricsData> {
    const report: Record<string, MetricsData> = {};
    for (const [endpoint, metrics] of this.metrics.entries()) {
      report[endpoint] = { ...metrics };
    }
    return report;
  }

  public async checkHealth(): Promise<boolean> {
    const status = this.healthCheck.getStatus();
    const isHealthy = Array.from(status.values()).every(Boolean);

    if (!isHealthy) {
      logger.warn('Health check failed', {
        status: Object.fromEntries(status)
      });

      await this.auditLogger.logEvent({
        type: AuditEventType.CONNECTION_FAILED,
        userId: 'system',
        metadata: {
          healthStatus: Object.fromEntries(status)
        },
        severity: 'ERROR'
      });
    }

    return isHealthy;
  }

  public clearMetrics(): void {
    this.metrics.clear();
    logger.info('Metrics cleared');
  }
}