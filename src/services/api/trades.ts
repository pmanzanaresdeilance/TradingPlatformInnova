import { supabase } from '@/lib/supabase';
import { BaseApiService } from './base';
import type { Trade } from '@/types';

export class TradesService extends BaseApiService {
  private static readonly TRADES_CACHE_KEY = 'user_trades';

  public static async getUserTrades(userId: string): Promise<Trade[]> {
    return this.getCached(
      `${this.TRADES_CACHE_KEY}:${userId}`,
      async () => {
        return this.executeQuery(
          () => supabase
            .from('trades')
            .select(`
              *,
              metrics:trade_metrics (
                risk_amount,
                reward_amount,
                risk_reward_ratio,
                win_loss
              ),
              tags:trade_tags (
                tag
              ),
              notes:trade_notes (
                id,
                note_type,
                content,
                screenshot_url,
                created_at
              )
            `)
            .eq('user_id', userId)
            .order('open_time', { ascending: false }),
          'Failed to fetch user trades'
        );
      }
    );
  }

  public static async addTrade(trade: Partial<Trade>): Promise<Trade> {
    const result = await this.executeQuery(
      () => supabase
        .from('trades')
        .insert(trade)
        .select()
        .single(),
      'Failed to add trade'
    );

    this.clearCache(this.TRADES_CACHE_KEY);
    return result;
  }

  public static async updateTrade(tradeId: string, updates: Partial<Trade>): Promise<Trade> {
    const result = await this.executeQuery(
      () => supabase
        .from('trades')
        .update(updates)
        .eq('id', tradeId)
        .select()
        .single(),
      'Failed to update trade'
    );

    this.clearCache(this.TRADES_CACHE_KEY);
    return result;
  }
}