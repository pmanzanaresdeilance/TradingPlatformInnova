import React from 'react';
import { RefreshCw, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

interface SyncStatusProps {
  status: 'connected' | 'disconnected' | 'error';
  lastSync?: Date;
  error?: string;
  onSync: () => void;
  syncing: boolean;
}

export function SyncStatus({ status, lastSync, error, onSync, syncing }: SyncStatusProps) {
  return (
    <div className="bg-gray-800 rounded-xl p-6 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {status === 'connected' && (
            <div className="w-3 h-3 bg-trading-success rounded-full" />
          )}
          {status === 'disconnected' && (
            <div className="w-3 h-3 bg-gray-500 rounded-full" />
          )}
          {status === 'error' && (
            <div className="w-3 h-3 bg-trading-danger rounded-full" />
          )}
          <div>
            <h3 className="font-medium">MetaTrader Connection</h3>
            <p className="text-sm text-gray-400">
              {status === 'connected' && 'Connected and syncing'}
              {status === 'disconnected' && 'Not connected'}
              {status === 'error' && 'Connection error'}
            </p>
          </div>
        </div>

        <button
          onClick={onSync}
          disabled={status !== 'connected' || syncing}
          className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing...' : 'Sync Now'}
        </button>
      </div>

      {lastSync && status === 'connected' && (
        <div className="flex items-center gap-2 mt-4 text-sm text-gray-400">
          <CheckCircle2 className="w-4 h-4 text-trading-success" />
          Last synced: {lastSync.toLocaleString()}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 mt-4 text-sm text-trading-danger">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}
    </div>
  );
}