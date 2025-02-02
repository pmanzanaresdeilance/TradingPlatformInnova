import { supabase } from '@/lib/supabase';
import { ApiClient } from './client';
import { logger } from '@/utils/logger';

interface DataServiceOptions {
  tableName: string;
  externalApiEndpoint: string;
  transformResponse?: (data: any) => any;
  cacheTime?: number;
}

export class DataService {
  private static cache = new Map<string, { data: any; timestamp: number }>();
  private static readonly DEFAULT_CACHE_TIME = 5 * 60 * 1000; // 5 minutes

  constructor(private options: DataServiceOptions) {}

  public async getData<T>(filters: Record<string, any> = {}): Promise<T[]> {
    try {
      // First try to get from database
      const dbData = await this.getFromDatabase<T>(filters);
      
      if (dbData && dbData.length > 0) {
        logger.info('Data retrieved from database', {
          table: this.options.tableName,
          count: dbData.length
        });
        return dbData;
      }

      // If no data in database, fetch from external API
      const apiData = await this.getFromExternalApi<T>();
      
      if (apiData && apiData.length > 0) {
        // Store in database
        await this.storeInDatabase(apiData);
        
        logger.info('Data retrieved from API and stored in database', {
          table: this.options.tableName,
          count: apiData.length
        });
        return apiData;
      }

      return [];
    } catch (error) {
      logger.error('Error retrieving data', {
        error,
        table: this.options.tableName
      });
      throw error;
    }
  }

  private async getFromDatabase<T>(filters: Record<string, any>): Promise<T[]> {
    try {
      let query = supabase
        .from(this.options.tableName)
        .select('*');

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          query = query.eq(key, value);
        }
      });

      const { data, error } = await query;

      if (error) throw error;
      return data as T[];
    } catch (error) {
      logger.error('Database query failed', {
        error,
        table: this.options.tableName
      });
      throw error;
    }
  }

  private async getFromExternalApi<T>(): Promise<T[]> {
    try {
      const cacheKey = this.options.externalApiEndpoint;
      const cached = this.getFromCache<T>(cacheKey);
      
      if (cached) {
        return cached;
      }

      const data = await ApiClient.request<T[]>(this.options.externalApiEndpoint);
      
      if (this.options.transformResponse) {
        const transformedData = this.options.transformResponse(data);
        this.setCache(cacheKey, transformedData);
        return transformedData;
      }

      this.setCache(cacheKey, data);
      return data;
    } catch (error) {
      logger.error('External API request failed', {
        error,
        endpoint: this.options.externalApiEndpoint
      });
      throw error;
    }
  }

  private async storeInDatabase(data: any[]): Promise<void> {
    try {
      const { error } = await supabase
        .from(this.options.tableName)
        .upsert(
          data.map(item => ({
            ...item,
            updated_at: new Date().toISOString()
          }))
        );

      if (error) throw error;
    } catch (error) {
      logger.error('Failed to store data in database', {
        error,
        table: this.options.tableName
      });
      throw error;
    }
  }

  private getFromCache<T>(key: string): T[] | null {
    const cached = DataService.cache.get(key);
    if (!cached) return null;

    const cacheTime = this.options.cacheTime || DataService.DEFAULT_CACHE_TIME;
    if (Date.now() - cached.timestamp > cacheTime) {
      DataService.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  private setCache(key: string, data: any): void {
    DataService.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  public clearCache(): void {
    DataService.cache.clear();
  }
}