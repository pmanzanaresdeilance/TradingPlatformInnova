import React from 'react';
import { Trade } from '@/services/mt';
import { BarChart2, TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface TradeAnalyticsProps {
  trades: Trade[];
}

export function TradeAnalytics({ trades }: TradeAnalyticsProps) {
  const closedTrades = trades.filter(trade => trade.status === 'closed');
  
  const stats = closedTrades.reduce((acc, trade) => {
    if (trade.profit_loss !== undefined) {
      acc.totalTrades++;
      if (trade.profit_loss > 0) {
        acc.winningTrades++;
        acc.totalProfit += trade.profit_loss;
      } else {
        acc.totalLoss += Math.abs(trade.profit_loss);
      }
    }
    return acc;
  }, {
    totalTrades: 0,
    winningTrades: 0,
    totalProfit: 0,
    totalLoss: 0
  });

  const winRate = stats.totalTrades > 0
    ? ((stats.winningTrades / stats.totalTrades) * 100).toFixed(1)
    : '0.0';

  const profitFactor = stats.totalLoss > 0
    ? (stats.totalProfit / stats.totalLoss).toFixed(2)
    : '0.00';

  const averageRR = closedTrades.reduce((acc, trade) => {
    if (trade.metrics?.risk_reward_ratio) {
      return acc + trade.metrics.risk_reward_ratio;
    }
    return acc;
  }, 0) / closedTrades.length || 0;

  return (
    <div className="bg-gray-800 rounded-xl p-4 md:p-6 mb-6">
      <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6 flex items-center gap-2">
        <BarChart2 className="w-5 h-5 text-trading-accent" />
        Performance Analytics
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <div className="p-3 md:p-4 bg-gray-700/50 rounded-lg">
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <Activity className="w-4 h-4" />
            Win Rate
          </div>
          <div className="text-xl md:text-2xl font-bold">{winRate}%</div>
          <p className="text-xs md:text-sm text-gray-400">
            {stats.winningTrades} of {stats.totalTrades} trades
          </p>
        </div>

        <div className="p-3 md:p-4 bg-gray-700/50 rounded-lg">
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <TrendingUp className="w-4 h-4" />
            Profit Factor
          </div>
          <div className="text-xl md:text-2xl font-bold">{profitFactor}</div>
          <p className="text-xs md:text-sm text-gray-400">Profit/Loss ratio</p>
        </div>

        <div className="p-3 md:p-4 bg-gray-700/50 rounded-lg">
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <TrendingDown className="w-4 h-4" />
            Average R:R
          </div>
          <div className="text-xl md:text-2xl font-bold">{averageRR.toFixed(2)}</div>
          <p className="text-xs md:text-sm text-gray-400">Risk/Reward ratio</p>
        </div>

        <div className="p-3 md:p-4 bg-gray-700/50 rounded-lg">
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <BarChart2 className="w-4 h-4" />
            Net P/L
          </div>
          <div className="text-xl md:text-2xl font-bold">
            ${(stats.totalProfit - stats.totalLoss).toFixed(2)}
          </div>
          <p className="text-xs md:text-sm text-gray-400">Total profit/loss</p>
        </div>
      </div>
    </div>
  );
}