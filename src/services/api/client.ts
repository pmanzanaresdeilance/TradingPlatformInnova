import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { logger } from '@/utils/logger';

const BASE_URL = import.meta.env.VITE_SUPABASE_URL;
const API_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

interface RequestConfig extends AxiosRequestConfig {
  params?: Record<string, string>;
  cache?: boolean;
}

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ApiClient {
  private static cache = new Map<string, { data: any; timestamp: number }>();
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private static axiosInstance: AxiosInstance;

  static {
    // Initialize axios instance with default config
    this.axiosInstance = axios.create({
      baseURL: BASE_URL,
      headers: {
        'Content-Type': 'application/json',
        'apikey': API_KEY
      }
    });
  }

  private static async request<T>(endpoint: string, config: RequestConfig = {}): Promise<T> {
    const { params, cache = false, ...requestConfig } = config;

    // Check cache
    const cacheKey = `${endpoint}-${JSON.stringify(params)}-${JSON.stringify(requestConfig)}`;
    if (cache) {
      const cached = this.getFromCache<T>(cacheKey);
      if (cached) return cached;
    }

    try {
      const response = await this.axiosInstance.request<T>({
        url: endpoint,
        params,
        ...requestConfig
      });

      const data = response.data;

      // Cache successful responses
      if (cache) {
        this.setCache(cacheKey, data);
      }

      return data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new ApiError(
          error.response?.status || 500,
          error.response?.data || error.message
        );
      }
      throw error;
    } catch (error) {
      logger.error('API request failed', { endpoint, error });
      throw error;
    }
  }

  private static getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  private static setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  public static clearCache(): void {
    this.cache.clear();
  }

  // API Methods
  public static async getAccounts() {
    return this.request('/rest/v1/meta_api_accounts', {
      method: 'GET',
      cache: true
    });
  }

  public static async createAccount(data: any) {
    return this.request('/rest/v1/meta_api_accounts', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  public static async updateAccount(id: string, data: any) {
    return this.request(`/rest/v1/meta_api_accounts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  public static async deleteAccount(id: string) {
    return this.request(`/rest/v1/meta_api_accounts/${id}`, {
      method: 'DELETE'
    });
  }

  public static async getTrades(accountId: string) {
    return this.request('/rest/v1/trades', {
      method: 'GET',
      params: { account_id: accountId },
      cache: true
    });
  }

  public static async getAccountStats(accountId: string) {
    return this.request(`/rest/v1/account_stats/${accountId}`, {
      method: 'GET',
      cache: true
    });
  }
}