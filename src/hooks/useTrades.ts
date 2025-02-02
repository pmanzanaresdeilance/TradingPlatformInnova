import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useRealtimeSubscription } from './useRealtimeSubscription';
import { Trade } from '@/types';

interface TradeResponse<T> {
  data: T | null;
  error: Error | null;
}

export function useTrades() {
  const { user } = useAuth();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to real-time updates for trades and related tables
  useRealtimeSubscription(
    [
      { table: 'trades', event: '*', filter: user ? `user_id=eq.${user.id}` : undefined },
      { table: 'trade_metrics', event: '*' },
      { table: 'trade_tags', event: '*' },
      { table: 'trade_notes', event: '*' }
    ],
    async () => {
      await loadTrades();
    },
    !!user
  );

  // Reset trades when user changes
  useEffect(() => {
    if (!user) {
      setTrades([]);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const loadTrades = async () => {
      try {
        setLoading(true);
        setTrades([]); // Reset trades before loading
        const { data, error } = await supabase
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
          .eq('user_id', user.id)
          .order('open_time', { ascending: false });

        if (error) throw error;
        // Only set trades if we got valid data back
        if (data && Array.isArray(data)) {
          setTrades(data);
        } else {
          setTrades([]);
        }
      } catch (err) {
        console.error('Failed to load trades:', err);
        setError('Failed to load trades');
      } finally {
        setLoading(false);
      }
    };

    loadTrades(); 
  }, [user]);

  const addNote = async (
    tradeId: string,
    noteType: 'pre_trade' | 'post_trade' | 'analysis',
    content: string,
    screenshotUrl?: string
  ) => {
    if (!user) throw new Error('Must be logged in to add notes');

    try {
      const { data, error } = await supabase
        .from('trade_notes')
        .insert({
          trade_id: tradeId,
          user_id: user.id,
          note_type: noteType,
          content,
          screenshot_url: screenshotUrl
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Failed to add trade note:', err);
      throw new Error('Failed to add trade note');
    }
  };

  return {
    trades,
    loading,
    error,
    addNote
  };
}