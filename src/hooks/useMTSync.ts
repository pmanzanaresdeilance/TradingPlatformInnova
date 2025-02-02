import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { MetaApiClient } from '@/services/metaapi';

export function useMTSync(accountId?: string) {
  const { user } = useAuth();
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sync = useCallback(async () => {
    if (!accountId || !user) return;

    setSyncing(true);
    setError(null);

    try {
      const client = MetaApiClient.getInstance(import.meta.env.VITE_META_API_TOKEN);
      const account = await client.getAccount(accountId);
      await account.deploy();
      await account.connect();
      setLastSync(new Date());
    } catch (err) {
      console.error('Sync failed:', err);
      setError('Failed to sync trades. Please try again.');
    } finally {
      setSyncing(false);
    }
  }, [accountId, user]);

  return {
    sync,
    syncing,
    lastSync,
    error
  };
}