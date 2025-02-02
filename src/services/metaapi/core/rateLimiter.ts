import { logger } from '../utils/logger';

export class RateLimiter {
  private readonly maxRequests: number = 10;
  private readonly timeWindow: number = 1000; // 1 second
  private requests: number[] = [];

  public async acquire(): Promise<void> {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.timeWindow);

    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = this.timeWindow - (now - oldestRequest);
      
      logger.warn('Rate limit exceeded, waiting', { waitTime });
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return this.acquire();
    }

    this.requests.push(now);
  }
}