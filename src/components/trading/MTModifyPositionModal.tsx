import React, { useState } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import type { MetatraderPosition } from 'metaapi.cloud-sdk';

interface MTModifyPositionModalProps {
  isOpen: boolean;
  onClose: () => void;
  position: MetatraderPosition;
  onModify: (positionId: string, stopLoss?: number, takeProfit?: number) => Promise<void>;
}

export function MTModifyPositionModal({
  isOpen,
  onClose,
  position,
  onModify
}: MTModifyPositionModalProps) {
  const [stopLoss, setStopLoss] = useState(position.stopLoss?.toString() || '');
  const [takeProfit, setTakeProfit] = useState(position.takeProfit?.toString() || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await onModify(
        position.id,
        stopLoss ? parseFloat(stopLoss) : undefined,
        takeProfit ? parseFloat(takeProfit) : undefined
      );
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to modify position');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-6">Modify Position</h2>

        {error && (
          <div className="mb-6 p-4 bg-trading-danger/10 border border-trading-danger/20 rounded-lg flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-trading-danger shrink-0" />
            <p className="text-sm text-trading-danger">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-400">Symbol</span>
              <span className="text-sm font-medium text-trading-accent">
                {position.symbol}
              </span>
            </div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-400">Open Price</span>
              <span className="text-sm font-medium">
                {position.openPrice.toFixed(5)}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Stop Loss
            </label>
            <input
              type="number"
              step="0.00001"
              value={stopLoss}
              onChange={(e) => setStopLoss(e.target.value)}
              className="w-full bg-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-trading-accent focus:outline-none"
              placeholder="Enter stop loss price"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Take Profit
            </label>
            <input
              type="number"
              step="0.00001"
              value={takeProfit}
              onChange={(e) => setTakeProfit(e.target.value)}
              className="w-full bg-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-trading-accent focus:outline-none"
              placeholder="Enter take profit price"
            />
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 bg-trading-accent text-gray-900 rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}