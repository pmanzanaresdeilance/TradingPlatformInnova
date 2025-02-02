import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ProvisioningService } from '@/services/metaapi/core/provisioning';
import { logger } from '@/services/metaapi/utils/logger';

export function useAccountProvisioning(accountId: string | null) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [features, setFeatures] = useState<string[]>([]);

  const loadFeatures = useCallback(async () => {
    if (!user || !accountId) return;

    try {
      setLoading(true);
      setError(null);

      const service = ProvisioningService.getInstance(
        import.meta.env.VITE_META_API_TOKEN
      );
      const { data, error: apiError } = await service.getAccountFeatures(accountId);

      if (apiError) throw apiError;
      if (data) setFeatures(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load account features';
      setError(errorMessage);
      logger.error('Error loading account features', { error: err, accountId });
    } finally {
      setLoading(false);
    }
  }, [user, accountId]);

  const enableFeatures = useCallback(async (featuresToEnable: string[]) => {
    if (!user || !accountId) return;

    try {
      setLoading(true);
      setError(null);

      const service = ProvisioningService.getInstance(
        import.meta.env.VITE_META_API_TOKEN
      );
      const { error: apiError } = await service.enableAccountFeatures(
        accountId,
        featuresToEnable
      );

      if (apiError) throw apiError;

      // Refresh features list
      await loadFeatures();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to enable features';
      setError(errorMessage);
      logger.error('Error enabling account features', {
        error: err,
        accountId,
        features: featuresToEnable
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user, accountId, loadFeatures]);

  return {
    features,
    loading,
    error,
    loadFeatures,
    enableFeatures
  };
}