import React from 'react';
import { Building2, Wallet, DollarSign, Percent, ChevronRight, Trash2, Edit2 } from 'lucide-react';
import type { MetatraderAccount } from 'metaapi.cloud-sdk';

interface MTAccountCardProps {
  account: MetatraderAccount;
  onEdit: () => void;
  onDelete: () => void;
  onViewTrades: () => void;
  statistics?: {
    balance: number;
    equity: number;
    margin: number;
    freeMargin: number;
    marginLevel: number;
    profitToday: number;
    winRate?: number;
    profitFactor?: number;
    totalTrades?: number;
  };
}

export function MTAccountCard({
  account,
  onEdit,
  onDelete,
  onViewTrades,
  statistics
}: MTAccountCardProps) {
  const isConnected = account.state === 'DEPLOYED' && 
    account.connectionStatus === 'CONNECTED';

  const stats = statistics || {
    balance: 0,
    equity: 0,
    margin: 0,
    freeMargin: 0,
    marginLevel: 0,
    profitToday: 0
  };

  return (
    <div className="bg-gray-800 rounded-xl overflow-hidden hover:shadow-xl hover:shadow-trading-accent/10 transition-all transform hover:-translate-y-1">
      {/* Account Header */}
      <div className="p-6 bg-gradient-to-br from-gray-800 via-gray-800 to-gray-700/50 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-trading-accent/20 to-trading-accent/5 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-trading-accent" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{account.name}</h3>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-trading-success' : 'bg-trading-danger'
                }`} />
                <p className="text-sm text-gray-400">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
            >
              <Edit2 className="w-4 h-4 text-gray-400 hover:text-white" />
            </button>
            <button
              onClick={onDelete}
              className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4 text-gray-400 hover:text-trading-danger" />
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Account Number</span>
            <span>{account.login}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Server</span>
            <span>{account.server}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Platform</span>
            <span>{account.platform?.toUpperCase() || 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* Account Stats */}
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-sm text-gray-400">Balance</span>
            <p className="text-xl font-bold">${stats.balance.toFixed(2)}</p>
          </div>
          <div>
            <span className="text-sm text-gray-400">Equity</span>
            <p className="text-xl font-bold">${stats.equity.toFixed(2)}</p>
          </div>
          <div>
            <span className="text-sm text-gray-400">Margin</span>
            <p className="text-xl font-bold">${stats.margin.toFixed(2)}</p>
          </div>
          <div>
            <span className="text-sm text-gray-400">Free Margin</span>
            <p className="text-xl font-bold">${stats.freeMargin.toFixed(2)}</p>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-400">Margin Level</span>
            <span className={stats.marginLevel < 100 ? 'text-trading-danger' : 'text-trading-success'}>
              {stats.marginLevel.toFixed(2)}%
            </span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full">
            <div
              className={`h-full rounded-full ${
                stats.marginLevel < 100 ? 'bg-trading-danger' : 'bg-trading-success'
              }`}
              style={{ width: `${Math.min(stats.marginLevel, 100)}%` }}
            />
          </div>
        </div>

        {/* Additional Stats */}
        {stats.winRate !== undefined && (
          <div className="pt-4 border-t border-gray-700">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <span className="text-sm text-gray-400">Win Rate</span>
                <p className="text-lg font-bold text-trading-success">
                  {stats.winRate.toFixed(1)}%
                </p>
              </div>
              {stats.profitFactor !== undefined && (
                <div>
                  <span className="text-sm text-gray-400">Profit Factor</span>
                  <p className="text-lg font-bold text-trading-accent">
                    {stats.profitFactor.toFixed(2)}
                  </p>
                </div>
              )}
              {stats.totalTrades !== undefined && (
                <div>
                  <span className="text-sm text-gray-400">Total Trades</span>
                  <p className="text-lg font-bold">
                    {stats.totalTrades}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-400">Today's P/L</span>
            <span className={`font-medium ${
              stats.profitToday > 0 ? 'text-trading-success' : 
              stats.profitToday < 0 ? 'text-trading-danger' : 'text-gray-400'
            }`}>
              ${stats.profitToday.toFixed(2)}
            </span>
          </div>
        </div>

        <button
          onClick={onViewTrades}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-trading-accent to-cyan-400 text-gray-900 rounded-xl font-medium mt-6 transform transition-all duration-300 hover:translate-y-[-2px] hover:shadow-lg hover:shadow-trading-accent/20 active:translate-y-[1px]"
        >
          View Trades
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}