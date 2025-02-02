import React from 'react';
import { StatCard } from '@/components/dashboard/StatCard';
import { useAuth } from '@/contexts/AuthContext';
import { LineChart, Calendar, MessageCircle, Video } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-white">
          Welcome back, {user?.email?.split('@')[0] || 'Trader'}
        </h1>
        <p className="text-gray-400 mt-2">Here's your trading overview</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Win Rate"
          value="68%"
          change="+2.5%"
          isPositive={true}
        />
        <StatCard
          title="Profit Factor"
          value="2.1"
          change="+0.3"
          isPositive={true}
        />
        <StatCard
          title="Total Trades"
          value="156"
          change="-12"
          isPositive={false}
        />
        <StatCard
          title="Active Traders"
          value="2.4k"
          change="+85"
          isPositive={true}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-trading-accent" />
            Upcoming Events
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
              <div>
                <span className="text-sm font-medium text-trading-accent">USD</span>
                <p className="text-white">NFP Report</p>
                <span className="text-sm text-gray-400">March 1, 13:30 GMT</span>
              </div>
              <span className="px-2 py-1 text-xs font-medium rounded bg-trading-danger/20 text-trading-danger">
                High Impact
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
              <div>
                <span className="text-sm font-medium text-trading-accent">EUR</span>
                <p className="text-white">ECB Rate Decision</p>
                <span className="text-sm text-gray-400">March 7, 12:45 GMT</span>
              </div>
              <span className="px-2 py-1 text-xs font-medium rounded bg-trading-danger/20 text-trading-danger">
                High Impact
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <LineChart className="w-5 h-5 text-trading-accent" />
            Latest Market Updates
          </h2>
          <div className="space-y-4">
            <div className="p-3 bg-gray-700/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-trading-accent">Market Analysis</span>
                <span className="text-xs text-gray-400">2h ago</span>
              </div>
              <p className="text-white">S&P 500 breaks key resistance level, signaling potential trend reversal</p>
            </div>
            <div className="p-3 bg-gray-700/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-trading-accent">Technical Alert</span>
                <span className="text-xs text-gray-400">4h ago</span>
              </div>
              <p className="text-white">EUR/USD forms bullish engulfing pattern at major support zone</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Video className="w-5 h-5 text-trading-accent" />
            Latest Content
          </h2>
          <div className="space-y-4">
            <div className="p-3 bg-gray-700/50 rounded-lg">
              <span className="text-xs font-medium text-trading-accent">Backtesting</span>
              <p className="text-white mt-1">Price Action Strategy Analysis</p>
              <span className="text-xs text-gray-400">Posted yesterday</span>
            </div>
            <div className="p-3 bg-gray-700/50 rounded-lg">
              <span className="text-xs font-medium text-trading-accent">Live Class</span>
              <p className="text-white mt-1">Advanced Chart Patterns</p>
              <span className="text-xs text-gray-400">Coming March 5</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-trading-accent" />
            Community Highlights
          </h2>
          <div className="space-y-4">
            <div className="p-3 bg-gray-700/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                  <span className="text-sm font-medium">JD</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">John Doe</p>
                  <span className="text-xs text-gray-400">Elite Trader</span>
                </div>
              </div>
              <p className="text-white">Shared a new trading setup for Gold</p>
            </div>
            <div className="p-3 bg-gray-700/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                  <span className="text-sm font-medium">AS</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Alice Smith</p>
                  <span className="text-xs text-gray-400">Premium Member</span>
                </div>
              </div>
              <p className="text-white">Posted analysis on EUR/USD daily timeframe</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Your Progress</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">Monthly Challenge</span>
                <span className="text-trading-accent">75%</span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full">
                <div className="h-full w-3/4 bg-trading-accent rounded-full"></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">Learning Progress</span>
                <span className="text-trading-success">60%</span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full">
                <div className="h-full w-3/5 bg-trading-success rounded-full"></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">Risk Management</span>
                <span className="text-trading-warning">45%</span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full">
                <div className="h-full w-[45%] bg-trading-warning rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}