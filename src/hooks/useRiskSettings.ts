import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { RiskManager } from '@/services/metaapi';
import type { RiskSettings } from '@/services/metaapi/risk/types';
import { logger } from '@/services/metaapi/utils/logger';

export function useRiskSettings(accountId: string | null) {
  const { user } = useAuth();
  const [settings, setSettings] = useState<RiskSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const riskManager = new RiskManager();

  useEffect(() => {
    if (!user || !accountId) return;

    const loadSettings = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await riskManager.getSettings(accountId);
        setSettings(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load risk settings';
        setError(errorMessage);
        logger.error('Error loading risk settings', { error: err, accountId });
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [user, accountId]);

  const updateSettings = async (newSettings: Partial<RiskSettings>) => {
    if (!user || !accountId) return;

    try {
      setLoading(true);
      setError(null);
      const updatedSettings = await riskManager.saveSettings(accountId, newSettings);
      setSettings(updatedSettings);
      return updatedSettings;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update risk settings';
      setError(errorMessage);
      logger.error('Error updating risk settings', { error: err, accountId });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const checkRiskLimits = async (
    equity: number,
    margin: number,
    positions: any[]
  ) => {
    if (!accountId) return null;

    try {
      return await riskManager.checkRiskLimits(accountId, equity, margin, positions);
    } catch (err) {
      logger.error('Error checking risk limits', { error: err, accountId });
      throw err;
    }
  };

  const calculatePositionSize = async (
    symbol: string,
    stopLoss: number,
    entryPrice: number,
    equity: number
  ) => {
    if (!accountId) return null;

    try {
      return await riskManager.calculatePositionSize(
        accountId,
        symbol,
        stopLoss,
        entryPrice,
        equity
      );
    } catch (err) {
      logger.error('Error calculating position size', { error: err, accountId });
      throw err;
    }
  };

  return {
    settings,
    loading,
    error,
    updateSettings,
    checkRiskLimits,
    calculatePositionSize
  };
}