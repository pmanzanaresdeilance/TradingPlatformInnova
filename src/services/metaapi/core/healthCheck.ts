import { logger } from '../utils/logger';

interface HealthStatus {
  isHealthy: boolean;
  lastCheck: Date;
  error?: string;
}

export class ConnectionHealthCheck {
  private static instance: ConnectionHealthCheck;
  private healthStatus: Map<string, HealthStatus>;
  private checkInterval: NodeJS.Timeout;
  private readonly CHECK_INTERVAL = 30000; // 30 seconds

  private constructor() {
    this.healthStatus = new Map();
    this.checkInterval = setInterval(() => this.checkAll(), this.CHECK_INTERVAL);
  }

  public static getInstance(): ConnectionHealthCheck {
    if (!ConnectionHealthCheck.instance) {
      ConnectionHealthCheck.instance = new ConnectionHealthCheck();
    }
    return ConnectionHealthCheck.instance;
  }

  public async checkConnection(accountId: string, connection: any): Promise<boolean> {
    try {
      // Perform basic health check
      const isConnected = connection.connected;
      const isSynchronized = connection.synchronized;
      
      const status: HealthStatus = {
        isHealthy: isConnected && isSynchronized,
        lastCheck: new Date()
      };

      if (!status.isHealthy) {
        status.error = `Connection issues: ${!isConnected ? 'disconnected' : 'not synchronized'}`;
        logger.warn('Connection health check failed', {
          accountId,
          status
        });
      }

      this.healthStatus.set(accountId, status);
      return status.isHealthy;
    } catch (error) {
      logger.error('Health check failed', { error, accountId });
      this.healthStatus.set(accountId, {
        isHealthy: false,
        lastCheck: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }

  private async checkAll(): Promise<void> {
    for (const [accountId, status] of this.healthStatus.entries()) {
      if (Date.now() - status.lastCheck.getTime() > this.CHECK_INTERVAL) {
        logger.info('Running scheduled health check', { accountId });
        await this.checkConnection(accountId, null);
      }
    }
  }

  public getStatus(accountId: string): HealthStatus | undefined {
    return this.healthStatus.get(accountId);
  }

  public destroy(): void {
    clearInterval(this.checkInterval);
    this.healthStatus.clear();
  }
}