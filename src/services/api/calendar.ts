import { supabase } from '@/lib/supabase';
import { BaseApiService } from './base';
import type { MarketEvent } from '@/types';

export class CalendarService extends BaseApiService {
  private static readonly EVENTS_CACHE_KEY = 'market_events';
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  public static async getEconomicEvents(): Promise<MarketEvent[]> {
    return this.getCached(
      this.EVENTS_CACHE_KEY,
      async () => {
        return this.executeQuery(
          () => supabase
            .from('market_updates')
            .select('*')
            .eq('category', 'Economic Calendar')
            .order('datetime', { ascending: true }),
          'Failed to fetch economic events'
        );
      }
    );
  }

  public static async getMarketUpdates(): Promise<MarketEvent[]> {
    return this.executeQuery(
      () => supabase
        .from('market_updates')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5),
      'Failed to fetch market updates'
    );
  }
}