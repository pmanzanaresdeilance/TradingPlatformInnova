import { supabase } from '@/lib/supabase';
import { logger } from '@/utils/logger';

// Cache configuration
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const cache = new Map<string, { data: any; timestamp: number }>();

export class BaseApiService {
  protected static async getCached<T>(
    key: string,
    fetchFn: () => Promise<T>
  ): Promise<T> {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      logger.debug('Cache hit', { key });
      return cached.data;
    }

    const data = await fetchFn();
    cache.set(key, { data, timestamp: Date.now() });
    return data;
  }

  protected static clearCache(key?: string) {
    if (key) {
      cache.delete(key);
    } else {
      cache.clear();
    }
  }

  protected static async executeQuery<T>(
    operation: () => Promise<{ data: T | null; error: any }>,
    errorMessage: string
  ): Promise<T> {
    try {
      const { data, error } = await operation();
      if (error) throw error;
      if (!data) throw new Error('No data returned');
      return data;
    } catch (err) {
      logger.error(errorMessage, { error: err });
      throw new Error(errorMessage);
    }
  }
}