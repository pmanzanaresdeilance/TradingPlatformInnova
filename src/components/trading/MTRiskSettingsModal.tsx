import React, { useState } from 'react';
import { AlertTriangle, Loader2, Percent, DollarSign } from 'lucide-react';
import { RiskManager } from '@/services/metaapi';

interface MTRiskSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: any) => Promise<void>;
  currentSettings: {
    maxDrawdown: number;
    maxExposurePerPair: number;
    minEquity: number;
    marginCallLevel: number;
  };
}

export function MTRiskSettingsModal({
  isOpen,
  onClose,
  onSave,
  currentSettings
}: MTRiskSettingsModalProps) {
  const [settings, setSettings] = useState(currentSettings);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await onSave(settings);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-6">Risk Management Settings</h2>

        {error && (
          <div className="mb-6 p-4 bg-trading-danger/10 border border-trading-danger/20 rounded-lg flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-trading-danger shrink-0" />
            <p className="text-sm text-trading-danger">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Maximum Drawdown
            </label>
            <div className="relative">
              <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={settings.maxDrawdown * 100}
                onChange={(e) => setSettings({
                  ...settings,
                  maxDrawdown: parseFloat(e.target.value) / 100
                })}
                className="w-full bg-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:ring-2 focus:ring-trading-accent focus:outline-none"
              />
            </div>
            <p className="mt-1 text-xs text-gray-400">
              Maximum allowed drawdown as percentage of account balance
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Maximum Exposure per Pair
            </label>
            <div className="relative">
              <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={settings.maxExposurePerPair * 100}
                onChange={(e) => setSettings({
                  ...settings,
                  maxExposurePerPair: parseFloat(e.target.value) / 100
                })}
                className="w-full bg-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:ring-2 focus:ring-trading-accent focus:outline-none"
              />
            </div>
            <p className="mt-1 text-xs text-gray-400">
              Maximum exposure allowed per currency pair
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Minimum Equity
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="number"
                min="0"
                step="1"
                value={settings.minEquity}
                onChange={(e) => setSettings({
                  ...settings,
                  minEquity: parseInt(e.target.value)
                })}
                className="w-full bg-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:ring-2 focus:ring-trading-accent focus:outline-none"
              />
            </div>
            <p className="mt-1 text-xs text-gray-400">
              Minimum equity required to maintain positions
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Margin Call Level
            </label>
            <div className="relative">
              <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                value={settings.marginCallLevel * 100}
                onChange={(e) => setSettings({
                  ...settings,
                  marginCallLevel: parseFloat(e.target.value) / 100
                })}
                className="w-full bg-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:ring-2 focus:ring-trading-accent focus:outline-none"
              />
            </div>
            <p className="mt-1 text-xs text-gray-400">
              Margin level at which to trigger margin call alerts
            </p>
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-trading-accent text-gray-900 rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Settings'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}