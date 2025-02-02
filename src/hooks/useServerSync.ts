import { useState, useCallback } from 'react';
import { ServerService } from '@/services/metaapi/brokers/serverService';
import { logger } from '@/services/metaapi/utils/logger';

export function useServerSync() {
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    added: number;
    updated: number;
    removed: number;
    errors: number;
  } | null>(null);

  const sync = useCallback(async () => {
    if (syncing) return;

    setSyncing(true);
    setError(null);

    try {
      logger.info('Starting manual server sync');
      const syncStats = await ServerService.syncServers();
      setStats(syncStats);
      setLastSync(new Date());
      logger.info('Manual server sync completed', { stats: syncStats });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Server sync failed';
      setError(errorMessage);
      logger.error('Manual server sync failed', { error: err });
    } finally {
      setSyncing(false);
    }
  }, [syncing]);

  return {
    sync,
    syncing,
    lastSync,
    error,
    stats
  };
}