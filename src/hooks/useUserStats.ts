import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchUserStats } from '@/services/dashboard';
import { TradingStats } from '@/types';

export function useUserStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<TradingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const loadStats = async () => {
      try {
        setLoading(true);
        const data = await fetchUserStats(user.id);
        setStats(data);
      } catch (err) {
        setError('Failed to load trading statistics');
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [user]);

  return { stats, loading, error };
}