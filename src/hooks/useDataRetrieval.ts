import { useState, useEffect } from 'react';
import { logger } from '@/utils/logger';

interface UseDataRetrievalOptions {
  fetchFn: () => Promise<any>;
  dependencies?: any[];
  onError?: (error: Error) => void;
  transform?: (data: any) => any;
}

export function useDataRetrieval<T>({
  fetchFn,
  dependencies = [],
  onError,
  transform
}: UseDataRetrievalOptions) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const result = await fetchFn();
        
        if (!mounted) return;

        const transformedData = transform ? transform(result) : result;
        setData(transformedData);

      } catch (err) {
        logger.error('Data retrieval failed', { error: err });
        
        const error = err instanceof Error ? err : new Error('Failed to load data');
        setError(error);
        onError?.(error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, dependencies);

  return { data, loading, error, refresh: () => setLoading(true) };
}