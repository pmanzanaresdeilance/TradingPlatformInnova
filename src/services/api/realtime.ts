import { supabase } from '@/lib/supabase';
import { logger } from '@/utils/logger';
import { BaseApiService } from './base';

export class RealtimeService extends BaseApiService {
  private static subscriptions = new Map<string, () => void>();

  public static subscribe(
    table: string,
    filter: string | undefined,
    callback: (payload: any) => void
  ): () => void {
    const key = `${table}:${filter || '*'}`;

    // Unsubscribe from existing subscription
    if (this.subscriptions.has(key)) {
      this.subscriptions.get(key)?.();
    }

    const subscription = supabase
      .channel('db_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          filter
        },
        (payload) => {
          logger.debug('Realtime update received', {
            table,
            event: payload.eventType
          });
          callback(payload);
        }
      )
      .subscribe();

    const unsubscribe = () => {
      subscription.unsubscribe();
      this.subscriptions.delete(key);
    };

    this.subscriptions.set(key, unsubscribe);
    return unsubscribe;
  }

  public static unsubscribeAll() {
    this.subscriptions.forEach(unsubscribe => unsubscribe());
    this.subscriptions.clear();
  }
}