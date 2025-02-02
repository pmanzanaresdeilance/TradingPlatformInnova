import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export interface RankingStats {
  user_id: string;
  username: string;
  avatar_url?: string;
  profitability: number;
  max_drawdown: number;
  total_trades: number;
  win_rate: number;
  rank: number;
}

export function useRankings() {
  const { user } = useAuth();
  const [rankings, setRankings] = useState<RankingStats[]>([]);
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'year'>('week');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: rankingsError } = await supabase.rpc(
          'get_trader_rankings',
          { time_period: timeframe }
        );

        if (rankingsError) {
          console.error('RPC Error:', rankingsError);
          throw rankingsError;
        }

        console.log('Rankings data:', data);
        setRankings(data || []);

      } catch (err) {
        console.error('Error fetching rankings:', err);
        setError('Failed to load rankings');
      } finally {
        setLoading(false);
      }
    };

    fetchRankings();

    // Set up real-time subscription for rankings updates
    const subscription = supabase
      .channel('trades_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'trades'
      }, (payload) => {
        console.log('Trade change detected:', payload);
        fetchRankings();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [timeframe, user]);

  const userRank = rankings.find(r => r.user_id === user?.id)?.rank || null;
  const topTrader = rankings[0] || null;

  return { 
    traders: rankings, 
    topTrader, 
    userRank, 
    loading, 
    error,
    timeframe,
    setTimeframe
  };
}