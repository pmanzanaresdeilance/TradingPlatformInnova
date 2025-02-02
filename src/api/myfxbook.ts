import { supabase } from '@/lib/supabase';

export interface MyfxbookResponse<T> {
  data: T | null;
  error: Error | null;
}

export interface MyfxbookAccount {
  id: string;
  name: string;
  accountId: string;
  gain: number;
  absGain: number;
  daily: number;
  monthly: number;
  withdrawals: number;
  deposits: number;
  interest: number;
  profit: number;
  balance: number;
  drawdown: number;
  equity: number;
  equityPercent: number;
  demo: boolean;
  lastUpdateDate: string;
  creationDate: string;
  firstTradeDate: string;
  tracking: boolean;
  profitFactor: number;
  pips: number;
  winningPips: number;
  losingPips: number;
  longPositions: number;
  shortPositions: number;
  wonTrades: number;
  lostTrades: number;
  totalTrades: number;
  winningRate: number;
  commission: number;
}

export interface MyfxbookTrade {
  id: string;
  openTime: string;
  closeTime: string;
  symbol: string;
  action: 'Buy' | 'Sell';
  pips: number;
  profit: number;
  size: number;
  openPrice: number;
  closePrice: number;
  commission: number;
  swap: number;
  comment: string;
}

const MYFXBOOK_API_URL = 'https://www.myfxbook.com/api';

export const myfxbookApi = {
  async login(email: string, password: string): Promise<MyfxbookResponse<string>> {
    try {
      const response = await fetch(`${MYFXBOOK_API_URL}/login.json`, {
        method: 'POST',
        body: new URLSearchParams({
          email,
          password
        })
      });

      const data = await response.json();
      if (!data.error) {
        return {
          data: data.session,
          error: null
        };
      }

      throw new Error(data.message);
    } catch (error) {
      return {
        data: null,
        error: error as Error
      };
    }
  },

  async getAccounts(session: string): Promise<MyfxbookResponse<MyfxbookAccount[]>> {
    try {
      const response = await fetch(`${MYFXBOOK_API_URL}/get-my-accounts.json?session=${session}`);
      const data = await response.json();

      if (!data.error) {
        return {
          data: data.accounts,
          error: null
        };
      }

      throw new Error(data.message);
    } catch (error) {
      return {
        data: null,
        error: error as Error
      };
    }
  },

  async getTrades(session: string, accountId: string): Promise<MyfxbookResponse<MyfxbookTrade[]>> {
    try {
      const response = await fetch(
        `${MYFXBOOK_API_URL}/get-history.json?session=${session}&id=${accountId}`
      );
      const data = await response.json();

      if (!data.error) {
        return {
          data: data.history,
          error: null
        };
      }

      throw new Error(data.message);
    } catch (error) {
      return {
        data: null,
        error: error as Error
      };
    }
  },

  async getDailyGain(session: string, accountId: string): Promise<MyfxbookResponse<any>> {
    try {
      const response = await fetch(
        `${MYFXBOOK_API_URL}/get-daily-gain.json?session=${session}&id=${accountId}`
      );
      const data = await response.json();

      if (!data.error) {
        return {
          data: data.dailyGain,
          error: null
        };
      }

      throw new Error(data.message);
    } catch (error) {
      return {
        data: null,
        error: error as Error
      };
    }
  },

  async getDataDaily(session: string, accountId: string): Promise<MyfxbookResponse<any>> {
    try {
      const response = await fetch(
        `${MYFXBOOK_API_URL}/get-data-daily.json?session=${session}&id=${accountId}`
      );
      const data = await response.json();

      if (!data.error) {
        return {
          data: data.dataDaily,
          error: null
        };
      }

      throw new Error(data.message);
    } catch (error) {
      return {
        data: null,
        error: error as Error
      };
    }
  }
};