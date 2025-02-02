import axios from 'axios';
import { logger } from '@/utils/logger';

const BASE_URL = 'https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai';
const API_TOKEN = import.meta.env.VITE_META_API_TOKEN;

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'auth-token': API_TOKEN
  }
});

interface MetaApiResponse<T> {
  data: T | null;
  error: Error | null;
}

export class MetaApiService {
  private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    try {
      const response = await api.request<T>({
        url: endpoint,
        method: options.method || 'GET',
        data: options.body ? JSON.parse(options.body as string) : undefined,
        headers: options.headers
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error('MetaAPI request failed', {
          endpoint,
          status: error.response?.status,
          data: error.response?.data
        });
        throw new Error(error.response?.data?.message || error.message);
      }
      logger.error('MetaAPI request failed', { endpoint, error });
      throw error;
    }
  }

  public static async getAccounts(): Promise<MetaApiResponse<any[]>> {
    try {
      const data = await this.request('/users/current/accounts');
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  public static async createAccount(options: {
    login: string;
    password: string;
    server: string;
    platform: 'mt4' | 'mt5';
  }): Promise<MetaApiResponse<any>> {
    try {
      const data = await this.request('/users/current/accounts', {
        method: 'POST',
        body: JSON.stringify(options)
      });
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  public static async getAccount(accountId: string): Promise<MetaApiResponse<any>> {
    try {
      const data = await this.request(`/users/current/accounts/${accountId}`);
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  public static async updateAccount(accountId: string, updates: any): Promise<MetaApiResponse<any>> {
    try {
      const data = await this.request(`/users/current/accounts/${accountId}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  public static async deleteAccount(accountId: string): Promise<MetaApiResponse<void>> {
    try {
      await this.request(`/users/current/accounts/${accountId}`, {
        method: 'DELETE'
      });
      return { data: null, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  public static async deployAccount(accountId: string): Promise<MetaApiResponse<void>> {
    try {
      await this.request(`/users/current/accounts/${accountId}/deploy`, {
        method: 'POST'
      });
      return { data: null, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  public static async undeployAccount(accountId: string): Promise<MetaApiResponse<void>> {
    try {
      await this.request(`/users/current/accounts/${accountId}/undeploy`, {
        method: 'POST'
      });
      return { data: null, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  public static async getHistoricalTrades(accountId: string, startTime: Date, endTime: Date): Promise<MetaApiResponse<any[]>> {
    try {
      const data = await this.request(`/users/current/accounts/${accountId}/historical-trades/${startTime.toISOString()}/${endTime.toISOString()}`);
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  public static async getAccountStats(accountId: string): Promise<MetaApiResponse<any>> {
    try {
      const data = await this.request(`/users/current/accounts/${accountId}/metrics`);
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }
}