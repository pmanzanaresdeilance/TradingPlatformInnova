import React, { useState, useEffect } from 'react';
import { useAccountProvisioning } from '@/hooks/useAccountProvisioning';
import { Loader2, AlertTriangle, Check, Settings2 } from 'lucide-react';

interface MTFeatureSettingsProps {
  accountId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function MTFeatureSettings({
  accountId,
  isOpen,
  onClose
}: MTFeatureSettingsProps) {
  const {
    features,
    loading,
    error,
    loadFeatures,
    enableFeatures
  } = useAccountProvisioning(accountId);

  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadFeatures();
    }
  }, [isOpen, loadFeatures]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);

    try {
      await enableFeatures(selectedFeatures);
      onClose();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save features');
    } finally {
      setSaving(false);
    }
  };

  const availableFeatures = [
    {
      id: 'copyTrading',
      name: 'Copy Trading',
      description: 'Enable copy trading functionality'
    },
    {
      id: 'riskManagement',
      name: 'Risk Management',
      description: 'Advanced risk management features'
    },
    {
      id: 'expertAdvisors',
      name: 'Expert Advisors',
      description: 'Support for automated trading'
    },
    {
      id: 'marketData',
      name: 'Market Data',
      description: 'Real-time market data access'
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-trading-accent/10 flex items-center justify-center">
            <Settings2 className="w-6 h-6 text-trading-accent" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Account Features</h2>
            <p className="text-gray-400">Enable or disable trading features</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-trading-danger/10 border border-trading-danger/20 rounded-lg flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-trading-danger shrink-0" />
            <p className="text-sm text-trading-danger">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-trading-accent" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              {availableFeatures.map((feature) => (
                <label
                  key={feature.id}
                  className="flex items-start gap-3 p-3 bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedFeatures.includes(feature.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedFeatures([...selectedFeatures, feature.id]);
                      } else {
                        setSelectedFeatures(
                          selectedFeatures.filter(f => f !== feature.id)
                        );
                      }
                    }}
                    className="mt-1 rounded bg-gray-600 border-gray-500 text-trading-accent focus:ring-trading-accent"
                  />
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {feature.name}
                      {features.includes(feature.id) && (
                        <span className="text-xs bg-trading-success/20 text-trading-success px-2 py-0.5 rounded-full">
                          Enabled
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400">{feature.description}</p>
                  </div>
                </label>
              ))}
            </div>

            {saveError && (
              <div className="p-4 bg-trading-danger/10 border border-trading-danger/20 rounded-lg">
                <p className="text-sm text-trading-danger">{saveError}</p>
              </div>
            )}

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
                disabled={saving || selectedFeatures.length === 0}
                className="px-6 py-2 bg-trading-accent text-gray-900 rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}