import React from 'react';
import { Trade } from '@/services/mt';
import { PieChart, Clock } from 'lucide-react';

interface TradeDistributionProps {
  trades: Trade[];
}

export function TradeDistribution({ trades }: TradeDistributionProps) {
  const closedTrades = trades.filter(trade => trade.status === 'closed');

  // Calculate symbol distribution
  const symbolStats = closedTrades.reduce((acc, trade) => {
    acc[trade.symbol] = acc[trade.symbol] || {
      total: 0,
      wins: 0,
      volume: 0,
    };
    acc[trade.symbol].total++;
    if (trade.profit_loss > 0) {
      acc[trade.symbol].wins++;
    }
    acc[trade.symbol].volume += trade.lot_size;
    return acc;
  }, {} as Record<string, { total: number; wins: number; volume: number }>);

  // Calculate time distribution
  const timeStats = closedTrades.reduce((acc, trade) => {
    const hour = new Date(trade.open_time).getHours();
    const session = hour >= 0 && hour < 8 ? 'Asian'
      : hour >= 8 && hour < 16 ? 'London'
      : 'New York';
    
    acc[session] = acc[session] || {
      total: 0,
      wins: 0,
    };
    acc[session].total++;
    if (trade.profit_loss > 0) {
      acc[session].wins++;
    }
    return acc;
  }, {} as Record<string, { total: number; wins: number }>);

  return (
    <div className="bg-gray-800 rounded-xl p-4 md:p-6 mb-6">
      <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6 flex items-center gap-2">
        <PieChart className="w-5 h-5 text-trading-accent" />
        Trade Distribution
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <div>
          <h3 className="text-base md:text-lg font-medium mb-4 flex items-center gap-2">
            Symbol Performance
          </h3>
          <div className="space-y-3">
            {Object.entries(symbolStats)
              .sort((a, b) => b[1].total - a[1].total)
              .map(([symbol, stats]) => (
                <div key={symbol} className="bg-gray-700/50 rounded-lg p-3 md:p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{symbol}</span>
                    <span className="text-xs md:text-sm text-gray-400">
                      {stats.total} trades
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-xs md:text-sm mb-1">
                        <span className="text-gray-400">Win Rate</span>
                        <span className="text-trading-accent">
                          {((stats.wins / stats.total) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-2 bg-gray-700 rounded-full">
                        <div
                          className="h-full bg-trading-accent rounded-full"
                          style={{
                            width: `${(stats.wins / stats.total) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex justify-between text-xs md:text-sm text-gray-400">
                      <span>Volume</span>
                      <span>{stats.volume.toFixed(2)} lots</span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div>
          <h3 className="text-base md:text-lg font-medium mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Session Performance
          </h3>
          <div className="space-y-3">
            {Object.entries(timeStats)
              .sort((a, b) => b[1].total - a[1].total)
              .map(([session, stats]) => (
                <div key={session} className="bg-gray-700/50 rounded-lg p-3 md:p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{session} Session</span>
                    <span className="text-xs md:text-sm text-gray-400">
                      {stats.total} trades
                    </span>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs md:text-sm mb-1">
                      <span className="text-gray-400">Win Rate</span>
                      <span className="text-trading-accent">
                        {((stats.wins / stats.total) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full">
                      <div
                        className="h-full bg-trading-accent rounded-full"
                        style={{
                          width: `${(stats.wins / stats.total) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}