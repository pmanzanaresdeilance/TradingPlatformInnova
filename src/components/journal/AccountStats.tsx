import React from 'react';
import { TrendingUp, TrendingDown, BarChart2, DollarSign, Percent, Target, Activity } from 'lucide-react';

interface AccountStatsProps {
  initialBalance: number;
  currentBalance: number;
  currency: string;
  statistics?: {
    total_trades: number;
    win_rate: number;
    profit_factor: number;
    max_drawdown: number;
  };
}

export function AccountStats({ 
  initialBalance,
  currentBalance,
  currency,
  statistics
}: AccountStatsProps) {
  const totalReturn = ((currentBalance - initialBalance) / initialBalance) * 100;
  const winRate = statistics?.win_rate || 0;
  const profitFactor = statistics?.profit_factor || 0;
  const maxDrawdown = statistics?.max_drawdown || 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      <div className="bg-gray-800 rounded-xl p-6 relative overflow-hidden group hover:bg-gray-800/80 transition-colors">
        <div className="absolute -right-6 -top-6 w-24 h-24 bg-trading-accent/5 rounded-full group-hover:scale-150 transition-transform duration-500" />
        <div className="relative">
          <div className="flex items-center gap-2 text-gray-400 mb-2 md:mb-3">
            <DollarSign className="w-5 h-5 text-trading-accent" />
            <span className="font-medium">Total Return</span>
          </div>
          <div className={`text-xl md:text-2xl font-bold mb-1 ${
            totalReturn >= 0 ? 'text-trading-success' : 'text-trading-danger'
          }`}>
            {totalReturn.toFixed(2)}%
          </div>
          <p className="text-xs md:text-sm text-gray-400">
            {currency} {currentBalance.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
          </p>
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl p-6 relative overflow-hidden group hover:bg-gray-800/80 transition-colors">
        <div className="absolute -right-6 -top-6 w-24 h-24 bg-trading-success/5 rounded-full group-hover:scale-150 transition-transform duration-500" />
        <div className="relative">
          <div className="flex items-center gap-2 text-gray-400 mb-2 md:mb-3">
            <Target className="w-5 h-5 text-trading-success" />
            <span className="font-medium">Win Rate</span>
          </div>
          <div className="text-xl md:text-2xl font-bold text-trading-success mb-1">
            {winRate}%
          </div>
          <p className="text-xs md:text-sm text-gray-400">
            {statistics?.total_trades || 0} trades
          </p>
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl p-6 relative overflow-hidden group hover:bg-gray-800/80 transition-colors">
        <div className="absolute -right-6 -top-6 w-24 h-24 bg-trading-accent/5 rounded-full group-hover:scale-150 transition-transform duration-500" />
        <div className="relative">
          <div className="flex items-center gap-2 text-gray-400 mb-2 md:mb-3">
            <Activity className="w-5 h-5 text-trading-accent" />
            <span className="font-medium">Profit Factor</span>
          </div>
          <div className="text-xl md:text-2xl font-bold text-trading-accent mb-1">
            {profitFactor}
          </div>
          <p className="text-xs md:text-sm text-gray-400">Profit/Loss ratio</p>
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl p-6 relative overflow-hidden group hover:bg-gray-800/80 transition-colors">
        <div className="absolute -right-6 -top-6 w-24 h-24 bg-trading-danger/5 rounded-full group-hover:scale-150 transition-transform duration-500" />
        <div className="relative">
          <div className="flex items-center gap-2 text-gray-400 mb-2 md:mb-3">
            <Percent className="w-5 h-5 text-trading-danger" />
            <span className="font-medium">Max Drawdown</span>
          </div>
          <div className="text-xl md:text-2xl font-bold text-trading-danger mb-1">
            {maxDrawdown}%
          </div>
          <p className="text-xs md:text-sm text-gray-400">Peak to trough</p>
        </div>
      </div>
    </div>
  );
}