import { supabase } from '@/lib/supabase';

export interface MT5Response<T> {
  data: T | null;
  error: Error | null;
}

export interface MT5Account {
  id: string;
  login: string;
  server: string;
  platform: 'mt5';
  state: 'connected' | 'disconnected' | 'error';
}

export interface MT5Trade {
  ticket: number;
  symbol: string;
  type: 'buy' | 'sell';
  volume: number;
  openPrice: number;
  closePrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  profit?: number;
  commission: number;
  swap: number;
  openTime: string;
  closeTime?: string;
}

const MT5_API_URL = 'http://localhost:5000/api';

export const mt5Api = {
  async connect(login: string, password: string, server: string): Promise<MT5Response<MT5Account>> {
    try {
      const response = await fetch(`${MT5_API_URL}/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          login,
          password,
          server
        })
      });

      if (!response.ok) {
        throw new Error('Failed to connect to MT5');
      }

      const data = await response.json();
      return {
        data: {
          id: data.id,
          login,
          server,
          platform: 'mt5',
          state: 'connected'
        },
        error: null
      };
    } catch (error) {
      return {
        data: null,
        error: error as Error
      };
    }
  },

  async getTrades(accountId: string): Promise<MT5Response<MT5Trade[]>> {
    try {
      const response = await fetch(`${MT5_API_URL}/trades/${accountId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch trades');
      }

      const data = await response.json();
      return {
        data: data.trades.map((trade: any) => ({
          ticket: trade.ticket,
          symbol: trade.symbol,
          type: trade.type.toLowerCase(),
          volume: trade.volume,
          openPrice: trade.openPrice,
          closePrice: trade.closePrice,
          stopLoss: trade.sl,
          takeProfit: trade.tp,
          profit: trade.profit,
          commission: trade.commission,
          swap: trade.swap,
          openTime: trade.openTime,
          closeTime: trade.closeTime
        })),
        error: null
      };
    } catch (error) {
      return {
        data: null,
        error: error as Error
      };
    }
  },

  async getPositions(accountId: string): Promise<MT5Response<MT5Trade[]>> {
    try {
      const response = await fetch(`${MT5_API_URL}/positions/${accountId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch positions');
      }

      const data = await response.json();
      return {
        data: data.positions.map((pos: any) => ({
          ticket: pos.ticket,
          symbol: pos.symbol,
          type: pos.type.toLowerCase(),
          volume: pos.volume,
          openPrice: pos.openPrice,
          stopLoss: pos.sl,
          takeProfit: pos.tp,
          profit: pos.profit,
          commission: pos.commission,
          swap: pos.swap,
          openTime: pos.openTime
        })),
        error: null
      };
    } catch (error) {
      return {
        data: null,
        error: error as Error
      };
    }
  },

  async placeOrder(
    accountId: string,
    symbol: string,
    type: 'buy' | 'sell',
    volume: number,
    stopLoss?: number,
    takeProfit?: number
  ): Promise<MT5Response<any>> {
    try {
      const response = await fetch(`${MT5_API_URL}/order/${accountId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbol,
          type,
          volume,
          stopLoss,
          takeProfit
        })
      });

      if (!response.ok) {
        throw new Error('Failed to place order');
      }

      const data = await response.json();
      return {
        data,
        error: null
      };
    } catch (error) {
      return {
        data: null,
        error: error as Error
      };
    }
  },

  async modifyPosition(
    accountId: string,
    ticket: number,
    stopLoss?: number,
    takeProfit?: number
  ): Promise<MT5Response<any>> {
    try {
      const response = await fetch(`${MT5_API_URL}/position/${accountId}/${ticket}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stopLoss,
          takeProfit
        })
      });

      if (!response.ok) {
        throw new Error('Failed to modify position');
      }

      const data = await response.json();
      return {
        data,
        error: null
      };
    } catch (error) {
      return {
        data: null,
        error: error as Error
      };
    }
  },

  async closePosition(accountId: string, ticket: number): Promise<MT5Response<any>> {
    try {
      const response = await fetch(`${MT5_API_URL}/position/${accountId}/${ticket}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to close position');
      }

      const data = await response.json();
      return {
        data,
        error: null
      };
    } catch (error) {
      return {
        data: null,
        error: error as Error
      };
    }
  }
};