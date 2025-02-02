import { logger } from '../utils/logger';
import type { MetatraderConnection } from 'metaapi.cloud-sdk';

interface PooledConnection {
  connection: MetatraderConnection;
  lastUsed: number;
  isConnected: boolean;
}

export class ConnectionPool {
  private static instance: ConnectionPool;
  private pool: Map<string, PooledConnection>;
  private readonly maxIdleTime = 5 * 60 * 1000; // 5 minutes
  private cleanupInterval: NodeJS.Timeout;

  private constructor() {
    this.pool = new Map();
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  public static getInstance(): ConnectionPool {
    if (!ConnectionPool.instance) {
      ConnectionPool.instance = new ConnectionPool();
    }
    return ConnectionPool.instance;
  }

  public async getConnection(accountId: string, createFn: () => Promise<MetatraderConnection>): Promise<MetatraderConnection> {
    const pooled = this.pool.get(accountId);

    if (pooled && pooled.isConnected) {
      pooled.lastUsed = Date.now();
      return pooled.connection;
    }

    try {
      const connection = await createFn();
      this.pool.set(accountId, {
        connection,
        lastUsed: Date.now(),
        isConnected: true
      });
      return connection;
    } catch (error) {
      logger.error('Failed to create connection', { error, accountId });
      throw error;
    }
  }

  public async releaseConnection(accountId: string): Promise<void> {
    const pooled = this.pool.get(accountId);
    if (pooled) {
      try {
        await pooled.connection.disconnect();
        this.pool.delete(accountId);
      } catch (error) {
        logger.error('Failed to release connection', { error, accountId });
      }
    }
  }

  private async cleanup(): Promise<void> {
    const now = Date.now();
    for (const [accountId, pooled] of this.pool.entries()) {
      if (now - pooled.lastUsed > this.maxIdleTime) {
        await this.releaseConnection(accountId);
      }
    }
  }

  public destroy(): void {
    clearInterval(this.cleanupInterval);
    this.pool.clear();
  }
}