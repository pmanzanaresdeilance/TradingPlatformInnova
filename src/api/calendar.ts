import { supabase } from '@/lib/supabase';
import type { MarketEvent } from '@/types';

export interface CalendarResponse<T> {
  data: T | null;
  error: Error | null;
}

export const calendarApi = {
  async getEconomicEvents(): Promise<CalendarResponse<MarketEvent[]>> {
    try {
      const { data, error } = await supabase
        .from('market_updates')
        .select('*')
        .eq('category', 'Economic Calendar')
        .order('datetime', { ascending: true });

      if (error) throw error;

      return {
        data: data as MarketEvent[],
        error: null
      };
    } catch (error) {
      return {
        data: null,
        error: error as Error
      };
    }
  },

  async getMarketUpdates(): Promise<CalendarResponse<MarketEvent[]>> {
    try {
      const { data, error } = await supabase
        .from('market_updates')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      return {
        data: data as MarketEvent[],
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