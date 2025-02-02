import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { MetaApiService } from '@/services/api/metaapi';
import { logger } from '@/utils/logger';
import type { Account } from '@/types';

interface AccountStats {
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  marginLevel: number;
  profitToday: number;
  winRate?: number;
  profitFactor?: number;
  totalTrades?: number;
}

export function useAccounts() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountStats, setAccountStats] = useState<Record<string, AccountStats>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  useEffect(() => {
    if (!user) return;

    const loadAccounts = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: accountsData, error: accountsError } = await MetaApiService.getAccounts();
        
        if (accountsError) throw accountsError;
        if (!accountsData) throw new Error('No accounts data received');

        setAccounts(accountsData);

        // Load stats for each account
        const statsPromises = accountsData.map(async (account) => {
          try {
            const { data: stats } = await MetaApiService.getAccountStats(account.id);
            return { accountId: account.id, stats };
          } catch (err) {
            logger.error('Failed to load stats for account', {
              accountId: account.id,
              error: err
            });
            return { accountId: account.id, stats: null };
          }
        });

        const statsResults = await Promise.allSettled(statsPromises);
        const newStats: Record<string, AccountStats> = {};

        statsResults.forEach((result) => {
          if (result.status === 'fulfilled' && result.value.stats) {
            newStats[result.value.accountId] = {
              balance: result.value.stats.balance || 0,
              equity: result.value.stats.equity || 0,
              margin: result.value.stats.margin || 0,
              freeMargin: result.value.stats.freeMargin || 0,
              marginLevel: result.value.stats.marginLevel || 0,
              profitToday: result.value.stats.profitToday || 0,
              winRate: result.value.stats.winRate,
              profitFactor: result.value.stats.profitFactor,
              totalTrades: result.value.stats.totalTrades
            };
          }
        });

        setAccountStats(newStats);
        setRetryCount(0); // Reset retry count on success

      } catch (err) {
        logger.error('Error loading accounts:', err);
        
        if (retryCount < MAX_RETRIES) {
          setRetryCount(prev => prev + 1);
          setTimeout(loadAccounts, 1000 * Math.pow(2, retryCount)); // Exponential backoff
        } else {
          setError('Failed to load trading accounts. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };

    loadAccounts();
  }, [user, retryCount]);

  const createAccount = async (accountData: any) => {
    try {
      setLoading(true);
      const { data, error } = await MetaApiService.createAccount(accountData);
      if (error) throw error;
      if (data) {
        setAccounts(prev => [...prev, data]);
      }
      return data;
    } catch (err) {
      logger.error('Error creating account:', err);
      throw new Error('Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const updateAccount = async (id: string, data: any) => {
    try {
      setLoading(true);
      const { data: updated, error } = await MetaApiService.updateAccount(id, data);
      if (error) throw error;
      if (updated) {
        setAccounts(prev => prev.map(acc => acc.id === id ? updated : acc));
      }
      return updated;
    } catch (err) {
      logger.error('Error updating account:', err);
      throw new Error('Failed to update account');
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async (id: string) => {
    try {
      setLoading(true);
      const { error } = await MetaApiService.deleteAccount(id);
      if (error) throw error;
      
      setAccounts(prev => prev.filter(acc => acc.id !== id));
      setAccountStats(prev => {
        const newStats = { ...prev };
        delete newStats[id];
        return newStats;
      });
    } catch (err) {
      logger.error('Error deleting account:', err);
      throw new Error('Failed to delete account');
    } finally {
      setLoading(false);
    }
  };

  return {
    accounts: accounts.map(account => ({
      ...account,
      statistics: accountStats[account.id] || {
        balance: 0,
        equity: 0,
        margin: 0,
        freeMargin: 0,
        marginLevel: 0,
        profitToday: 0
      }
    })),
    loading,
    error,
    createAccount,
    updateAccount,
    deleteAccount
  };
}