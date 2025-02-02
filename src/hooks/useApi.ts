import { useState, useCallback } from 'react';
import { logger } from '@/utils/logger';

interface ApiHookOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

export function useApi<T>(
  apiFunction: (...args: any[]) => Promise<T>,
  options: ApiHookOptions = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async (...args: any[]) => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiFunction(...args);
      setData(result);
      options.onSuccess?.(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An error occurred');
      setError(error);
      options.onError?.(error);
      logger.error('API call failed', { error, args });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [apiFunction, options]);

  return {
    data,
    loading,
    error,
    execute
  };
}