import { useEffect, useCallback } from 'react';
import { mtBridge } from '@/services/mtBridge';

export function useMTBridge(connectionId: string | undefined) {
  useEffect(() => {
    if (!connectionId) return;

    mtBridge.connect(connectionId);

    return () => {
      mtBridge.disconnect();
    };
  }, [connectionId]);

  const requestSync = useCallback(() => {
    mtBridge.requestSync();
  }, []);

  return { requestSync };
}