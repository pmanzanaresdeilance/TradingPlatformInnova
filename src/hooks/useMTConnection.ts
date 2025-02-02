import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { MetaApiService } from '@/services/api/metaapi';
import { MetaStats } from 'metaapi.cloud-sdk';
import { logger } from '@/utils/logger';

interface AccountStats {
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  marginLevel: number;
  profitToday: number;
}

export function useMTConnection() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [accountStats, setAccountStats] = useState<Record<string, AccountStats>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [historicalTrades, setHistoricalTrades] = useState<any[]>([]);
  const [tradeStats, setTradeStats] = useState<any>(null);
  const [metaStats, setMetaStats] = useState<MetaStats | null>(null);

  const loadAccounts = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Load all accounts in a single call
      const { data, error: accountsError } = await MetaApiService.getAccounts();
      
      if (accountsError) throw accountsError;
      if (data) {
        setAccounts(data);

        // Load stats for all accounts in parallel
        const validAccounts = data.filter(account => account.id);
        const statsPromises = validAccounts.map(account => 
          MetaApiService.getAccountStats(account.id)
            .then(({ data: stats }) => ({ 
              accountId: account.id, 
              metaApiAccountId: account.meta_api_account_id,
              stats 
            }))
            .catch(err => {
              logger.error('Error getting account stats', {
                accountId: account.id,
                metaApiAccountId: account.meta_api_account_id,
                error: err
              });
              return null;
            })
        );

        const results = await Promise.all(statsPromises);
        const newStats = results.reduce((acc, result) => {
          if (result && result.stats) {
            acc[result.accountId] = {
              balance: result.stats.balance || 0,
              equity: result.stats.equity || 0,
              margin: result.stats.margin || 0,
              freeMargin: result.stats.freeMargin || 0,
              marginLevel: result.stats.marginLevel || 0,
              profitToday: result.stats.profit || 0
            };
          }
          return acc;
        }, {});

        setAccountStats(newStats);
      }
    } catch (err) {
      logger.error('Failed to load accounts', { error: err });
      setError('Failed to load trading accounts');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const loadHistoricalTrades = useCallback(async (accountId: string) => {
    try {
      setLoading(true);
      setError(null);
      setError(null);
      
      // Initialize MetaStats if not already done
      if (!metaStats) {
        try {
          const stats = new MetaStats(import.meta.env.VITE_META_API_TOKEN, {
            domain: META_API_CONFIG.domain,
            requestTimeout: META_API_CONFIG.requestTimeout
          });
          setMetaStats(stats);
        } catch (initError) {
          logger.error('Failed to initialize MetaStats', { error: initError });
          throw new Error('Failed to initialize MetaStats client');
        }
      }

      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); // Last 30 days

      try {
        // Get metrics and trades using MetaStats
        const metrics = await metaStats!.getMetrics(accountId, {
          name: 'tradingMetrics',
          startTime: startDate.toISOString(),
          endTime: endDate.toISOString(),
          includePositions: true
        });

        const trades = await metaStats!.getAccountTrades(
          accountId,
          startDate.toISOString(),
          endDate.toISOString()
        );

        setHistoricalTrades(trades || []);
        setTradeStats(metrics || {});

        logger.info('Historical data loaded', {
          accountId,
          tradesCount: trades?.length || 0,
          hasMetrics: !!metrics
        });
      } catch (apiError) {
        logger.error('MetaStats API error', { error: apiError });
        throw new Error('Failed to fetch data from MetaStats API');
      }
    } catch (err) {
      logger.error('Failed to load historical trades', { error: err });
      setError(err instanceof Error ? err.message : 'Failed to load trading history');
    } finally {
      setLoading(false);
    }
  }, [metaStats]);

  useEffect(() => {
    if (!user) return;
    loadAccounts();
  }, [user, loadAccounts]);

  const createAccount = async (options: {
    login: string;
    password: string;
    server: string;
    platform: 'mt4' | 'mt5';
  }) => {
    try {
      const { data, error } = await MetaApiService.createAccount(options);
      if (error) throw error;
      if (data) {
        setAccounts(prev => [...prev, data]);
      }
      return data;
    } catch (err) {
      logger.error('Failed to create account', { error: err });
      throw new Error('Failed to create trading account');
    }
  };

  return {
    accounts,
    accountStats,
    historicalTrades,
    tradeStats,
    loading,
    error,
    createAccount,
    loadHistoricalTrades
  };
}