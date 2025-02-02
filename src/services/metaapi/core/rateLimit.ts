import { RateLimitError } from './errors';
import { logger } from '../utils/logger';

interface RateLimitConfig {
  maxRequests: number;
  interval: number;
  retryAfter?: number;
}

export class RateLimiter {
  private requests: number[] = [];
  private readonly config: RateLimitConfig;

  constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = {
      maxRequests: config.maxRequests || 60,
      interval: config.interval || 60000, // 1 minute
      retryAfter: config.retryAfter || 5000 // 5 seconds
    };
  }

  public async acquire(): Promise<void> {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.config.interval);

    if (this.requests.length >= this.config.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = this.config.interval - (now - oldestRequest);
      
      logger.warn('Rate limit exceeded', {
        currentRequests: this.requests.length,
        maxRequests: this.config.maxRequests,
        waitTime
      });

      throw new RateLimitError(
        `Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds.`,
        { retryAfter: this.config.retryAfter }
      );
    }

    this.requests.push(now);
  }

  public async executeWithRateLimit<T>(
    operation: () => Promise<T>,
    retryAttempts: number = 3
  ): Promise<T> {
    for (let attempt = 1; attempt <= retryAttempts; attempt++) {
      try {
        await this.acquire();
        return await operation();
      } catch (error) {
        if (error instanceof RateLimitError && attempt < retryAttempts) {
          logger.warn('Rate limit hit, retrying', {
            attempt,
            maxAttempts: retryAttempts
          });
          
          await new Promise(resolve => 
            setTimeout(resolve, this.config.retryAfter! * attempt)
          );
          continue;
        }
        throw error;
      }
    }

    throw new Error('Max retry attempts reached');
  }

  public getRemainingRequests(): number {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.config.interval);
    return this.config.maxRequests - this.requests.length;
  }
}