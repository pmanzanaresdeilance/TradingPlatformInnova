import { BrokerServer } from './types';
import { logger } from '../utils/logger';

export class ServerCache {
  private static instance: ServerCache;
  private cache: Map<string, { data: BrokerServer[]; timestamp: number }>;
  private readonly TTL: number = 30 * 24 * 60 * 60 * 1000; // 30 days

  private constructor() {
    this.cache = new Map();
  }

  public static getInstance(): ServerCache {
    if (!ServerCache.instance) {
      ServerCache.instance = new ServerCache();
    }
    return ServerCache.instance;
  }

  public set(key: string, servers: BrokerServer[]): void {
    this.cache.set(key, {
      data: servers,
      timestamp: Date.now()
    });
    logger.debug('Cache updated', { key, serversCount: servers.length });
  }

  public get(key: string): BrokerServer[] | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.TTL) {
      logger.debug('Cache expired', { key });
      this.cache.delete(key);
      return null;
    }

    logger.debug('Cache hit', { key });
    return cached.data;
  }

  public clear(): void {
    this.cache.clear();
    logger.info('Cache cleared');
  }

  public getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}