import { logger } from '../utils/logger';
import { ValidationError } from './errors';
import { CACHE_CONFIG } from '../config';

interface ProvisioningResponse<T> {
  data: T | null;
  error: Error | null;
}

export class ProvisioningService {
  private static instance: ProvisioningService;
  private cache: Map<string, { data: any; timestamp: number }>;
  private baseUrl: string;
  private token: string;

  private constructor(token: string) {
    this.token = token;
    this.baseUrl = 'https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai';
    this.cache = new Map();
  }

  public static getInstance(token: string): ProvisioningService {
    if (!ProvisioningService.instance || ProvisioningService.instance.token !== token) {
      ProvisioningService.instance = new ProvisioningService(token);
    }
    return ProvisioningService.instance;
  }

  public async enableAccountFeatures(accountId: string, features: string[]): Promise<ProvisioningResponse<any>> {
    try {
      // Validate input
      if (!accountId) {
        throw new ValidationError('Account ID is required');
      }
      if (!Array.isArray(features) || features.length === 0) {
        throw new ValidationError('At least one feature must be specified');
      }

      // Make API request
      const response = await fetch(
        `${this.baseUrl}/users/current/accounts/${accountId}/enable-account-features`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'auth-token': this.token
          },
          body: JSON.stringify({ features })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to enable account features');
      }

      const data = await response.json();
      logger.info('Account features enabled successfully', {
        accountId,
        features
      });

      return { data, error: null };
    } catch (error) {
      logger.error('Failed to enable account features', { error, accountId });
      return {
        data: null,
        error: error as Error
      };
    }
  }

  public async getAccountFeatures(accountId: string): Promise<ProvisioningResponse<string[]>> {
    try {
      // Check cache first
      const cacheKey = `features_${accountId}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return { data: cached, error: null };
      }

      // Make API request
      const response = await fetch(
        `${this.baseUrl}/users/current/accounts/${accountId}/features`,
        {
          headers: {
            'auth-token': this.token
          }
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to get account features');
      }

      const data = await response.json();
      
      // Update cache
      this.setInCache(cacheKey, data.features);

      return { data: data.features, error: null };
    } catch (error) {
      logger.error('Failed to get account features', { error, accountId });
      return {
        data: null,
        error: error as Error
      };
    }
  }

  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > CACHE_CONFIG.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  private setInCache<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
}