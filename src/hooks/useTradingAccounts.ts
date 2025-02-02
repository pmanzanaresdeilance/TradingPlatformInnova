import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export interface TradingAccount {
  id: string;
  user_id: string;
  name: string;
  broker: string;
  account_number: string;
  initial_balance: number;
  current_balance: number;
  currency: string;
  leverage: number;
  created_at: string;
  updated_at: string;
}

export interface AccountStatistics {
  total_trades: number;
  win_rate: number;
  profit_factor: number;
  max_drawdown: number;
}

export function useTradingAccounts() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [statistics, setStatistics] = useState<Record<string, AccountStatistics>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load accounts when user changes
  useEffect(() => {
    if (!user) return;

    const loadAccounts = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: accountsError } = await supabase
          .from('trading_accounts')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (accountsError) {
          console.error('Error loading accounts:', accountsError);
          throw accountsError;
        }

        setAccounts(data || []);

        // Load all account statistics in a single call
        if (data && data.length > 0) {
          const accountIds = data.map((account) => account.id);
          const { data: statsData, error: statsError } = await supabase.rpc(
            'get_accounts_statistics',
            { p_account_ids: accountIds }
          );

          if (statsError) {
            console.error('Error loading account statistics:', statsError);
          } else if (statsData) {
            const stats = statsData.reduce(
              (acc, stat) => ({
                ...acc,
                [stat.account_id]: {
                  total_trades: stat.total_trades,
                  win_rate: stat.win_rate,
                  profit_factor: stat.profit_factor,
                  max_drawdown: stat.max_drawdown,
                },
              }),
              {}
            );
            setStatistics(stats);
          }
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Failed to load trading accounts';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadAccounts();

    // Set up real-time subscription
    const channel = supabase
      .channel('trading_accounts_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trading_accounts',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          // Handle different types of changes
          if (payload.eventType === 'INSERT') {
            const newAccount = payload.new as TradingAccount;
            setAccounts((prev) => [...prev, newAccount]);

            // Load statistics for new account
            const { data: accountStats } = await supabase.rpc(
              'get_account_statistics',
              { p_account_id: newAccount.id }
            );
            if (accountStats) {
              setStatistics((prev) => ({
                ...prev,
                [newAccount.id]: accountStats,
              }));
            }
          } else if (payload.eventType === 'UPDATE') {
            setAccounts((prev) =>
              prev.map((account) =>
                account.id === payload.new.id
                  ? { ...account, ...payload.new }
                  : account
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setAccounts((prev) =>
              prev.filter((account) => account.id !== payload.old.id)
            );
            setStatistics((prev) => {
              const newStats = { ...prev };
              delete newStats[payload.old.id];
              return newStats;
            });
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user]);

  const addAccount = async (
    accountData: Omit<TradingAccount, 'id' | 'created_at' | 'updated_at'>
  ) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('trading_accounts')
        .insert({
          ...accountData,
          user_id: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      setAccounts((prev) => [...prev, data]);
      return data;
    } catch (err) {
      console.error('Error adding trading account:', err);
      throw new Error('Failed to add trading account');
    } finally {
      setLoading(false);
    }
  };

  const updateAccount = async (
    accountId: string,
    updates: Partial<Omit<TradingAccount, 'id' | 'created_at' | 'updated_at'>>
  ) => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user) throw new Error('Must be logged in to update account');

      const { data, error } = await supabase
        .from('trading_accounts')
        .update(updates)
        .eq('id', accountId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setAccounts((prev) =>
        prev.map((account) =>
          account.id === accountId ? { ...account, ...updates } : account
        )
      );

      return data;
    } catch (err) {
      console.error('Error updating trading account:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async (accountId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user) throw new Error('Must be logged in to delete account');

      const { error } = await supabase
        .from('trading_accounts')
        .delete()
        .eq('id', accountId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      setAccounts((prev) => prev.filter((account) => account.id !== accountId));

      // Clear statistics for deleted account
      setStatistics((prev) => {
        const newStats = { ...prev };
        delete newStats[accountId];
        return newStats;
      });
    } catch (err) {
      console.error('Error deleting trading account:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    accounts,
    selectedAccount,
    setSelectedAccount,
    statistics,
    loading,
    error,
    addAccount,
    updateAccount,
    deleteAccount
  };
}