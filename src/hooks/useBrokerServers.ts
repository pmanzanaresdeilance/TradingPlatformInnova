import { useState, useEffect } from 'react';
import { ServerDiscovery } from '@/services/metaapi/brokers/serverDiscovery';
import type { BrokerServer } from '@/services/metaapi/brokers/types';

export function useBrokerServers(
  brokerName: string,
  platform: 'mt4' | 'mt5' = 'mt5',
  region?: string
) {
  const [servers, setServers] = useState<BrokerServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadServers = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await ServerDiscovery.getBrokerServers(brokerName, platform, region);
        setServers(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load broker servers');
      } finally {
        setLoading(false);
      }
    };

    if (brokerName) {
      loadServers();
    }
  }, [brokerName, platform, region]);

  const validateServer = async (server: string): Promise<boolean> => {
    return ServerDiscovery.validateServer(server, platform);
  };

  return {
    servers,
    loading,
    error,
    validateServer
  };
}