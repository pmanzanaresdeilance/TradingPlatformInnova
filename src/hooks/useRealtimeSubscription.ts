import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface SubscriptionConfig {
  table: string;
  schema?: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  filter?: string;
}

// Improved type for payload
export interface RealtimePayload<T = any> {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: T;
  old: T | null;
  schema: string;
  table: string;
}

export function useRealtimeSubscription(
  config: SubscriptionConfig | SubscriptionConfig[],
  onEvent: (payload: RealtimePayload) => void,
  enabled: boolean = true
) {
  useEffect(() => {
    if (!enabled) return;

    const configs = Array.isArray(config) ? config : [config];
    const channels: RealtimeChannel[] = [];

    configs.forEach((cfg) => {
      const channel = supabase
        .channel(`${cfg.table}_changes`)
        .on(
          'postgres_changes',
          {
            event: cfg.event || '*',
            schema: cfg.schema || 'public',
            table: cfg.table,
            filter: cfg.filter
          },
          (payload) => {
            onEvent(payload);
          }
        )
        .subscribe();

      console.log(`Subscribed to ${cfg.table} changes`);
      channels.push(channel);
    });

    return () => {
      channels.forEach(channel => {
        console.log(`Unsubscribing from ${channel.topic}`);
        channel.unsubscribe();
      });
    };
  }, [config, onEvent, enabled]);
}