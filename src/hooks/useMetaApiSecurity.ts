import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { SecurityManager } from '@/services/metaapi/core/security';
import { logger } from '@/services/metaapi/utils/logger';

export function useMetaApiSecurity() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const securityManager = SecurityManager.getInstance();

  const encryptCredentials = useCallback(async (credentials: {
    login: string;
    password: string;
    server: string;
  }) => {
    if (!user) throw new Error('User must be authenticated');

    try {
      setLoading(true);
      setError(null);
      return await securityManager.encryptCredentials(credentials);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to encrypt credentials';
      setError(errorMessage);
      logger.error('Credential encryption failed', { error: err });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const validateApiKey = useCallback(async (apiKey: string) => {
    try {
      setLoading(true);
      setError(null);
      return await securityManager.validateApiKey(apiKey);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to validate API key';
      setError(errorMessage);
      logger.error('API key validation failed', { error: err });
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    encryptCredentials,
    validateApiKey,
    loading,
    error
  };
}