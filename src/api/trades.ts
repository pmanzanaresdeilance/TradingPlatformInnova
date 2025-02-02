import { supabase } from '@/lib/supabase';
import type { Trade } from '@/types';

export interface TradeResponse<T> {
  data: T | null;
  error: Error | null;
}

export const tradesApi = {
  async getUserTrades(userId: string): Promise<TradeResponse<Trade[]>> {
    try {
      const { data, error } = await supabase
        .from('trades')
        .select(`
          *,
          mt_connection:mt_connection_id (
            account_number,
            server,
            platform
          ),
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
        .order('open_time', { ascending: false });

      if (error) throw error;

      return {
        data: data as Trade[],
        error: null
      };
    } catch (error) {
      return {
        data: null,
        error: error as Error
      };
    }
  },

  async addTradeNote(
    tradeId: string,
    userId: string,
    noteType: 'pre_trade' | 'post_trade' | 'analysis',
    content: string,
    screenshotUrl?: string
  ): Promise<TradeResponse<any>> {
    try {
      const { data, error } = await supabase
        .from('trade_notes')
        .insert({
          trade_id: tradeId,
          user_id: userId,
          note_type: noteType,
          content,
          screenshot_url: screenshotUrl
        })
        .select()
        .single();

      if (error) throw error;

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