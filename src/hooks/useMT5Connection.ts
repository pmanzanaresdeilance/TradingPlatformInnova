import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { MT5Connection } from '@/services/metaapi/core/mt5Connection';
import { logger } from '@/services/metaapi/utils/logger';
import type { MetaApiAccount } from '@/services/metaapi/core/types';

export function useMT5Connection() {
  const { user } = useAuth();
  const [account, setAccount] = useState<MetaApiAccount | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async (
    login: string,
    password: string,
    server: string,
    name: string,
    region?: string
  ) => {
    if (!user) {
      throw new Error('User must be authenticated');
    }

    try {
      setLoading(true);
      setError(null);

      const connection = new MT5Connection(import.meta.env.VITE_META_API_TOKEN);
      const connectedAccount = await connection.connect({
        login,
        name,
        password,
        server,
        region
      });

      setAccount(connectedAccount);
      logger.info('MT5 account connected successfully', {
        accountId: connectedAccount.id
      });

      return connectedAccount;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect MT5 account';
      setError(errorMessage);
      logger.error('MT5 connection failed', { error: err });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const disconnect = useCallback(async () => {
    if (!account) return;

    try {
      setLoading(true);
      setError(null);

      const connection = new MT5Connection(import.meta.env.VITE_META_API_TOKEN);
      await connection.disconnect();

      setAccount(null);
      logger.info('MT5 account disconnected successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to disconnect MT5 account';
      setError(errorMessage);
      logger.error('MT5 disconnection failed', { error: err });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [account]);

  return {
    account,
    loading,
    error,
    connect,
    disconnect,
    isConnected: account?.connectionStatus === 'CONNECTED'
  };
}