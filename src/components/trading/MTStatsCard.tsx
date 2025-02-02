import React from 'react';
import { TrendingUp, TrendingDown, BarChart2, Activity } from 'lucide-react';
import { MetricsCalculator } from '@/services/metaapi';

interface MTStatsCardProps {
  accountId: string;
  trades: any[];
  timeframe: string;
}

export function MTStatsCard({ accountId, trades, timeframe }: MTStatsCardProps) {
  const calculator = new MetricsCalculator();
  const winRate = calculator.calculateWinRate(trades);
  const profitFactor = calculator.calculateProfitFactor(trades);

  const returns = trades.map(trade => trade.profit_loss / trade.lot_size);
  const sharpeRatio = calculator.calculateSharpeRatio(returns);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="bg-gray-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="w-5 h-5 text-trading-accent" />
          <h2 className="text-lg font-semibold">Win Rate</h2>
        </div>
        <div className="text-3xl font-bold mb-2">{winRate.toFixed(1)}%</div>
        <p className="text-gray-400">Last {timeframe}</p>
      </div>

      <div className="bg-gray-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <BarChart2 className="w-5 h-5 text-trading-accent" />
          <h2 className="text-lg font-semibold">Profit Factor</h2>
        </div>
        <div className="text-3xl font-bold mb-2">{profitFactor.toFixed(2)}</div>
        <p className="text-gray-400">Profit/Loss ratio</p>
      </div>

      <div className="bg-gray-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Activity className="w-5 h-5 text-trading-accent" />
          <h2 className="text-lg font-semibold">Sharpe Ratio</h2>
        </div>
        <div className="text-3xl font-bold mb-2">{sharpeRatio.toFixed(2)}</div>
        <p className="text-gray-400">Risk-adjusted return</p>
      </div>

      <div className="bg-gray-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <TrendingDown className="w-5 h-5 text-trading-accent" />
          <h2 className="text-lg font-semibold">Total Trades</h2>
        </div>
        <div className="text-3xl font-bold mb-2">{trades.length}</div>
        <p className="text-gray-400">All positions</p>
      </div>
    </div>
  );
}