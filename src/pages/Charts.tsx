import React, { useState } from 'react';
import { ExternalLink, Lock, AlertTriangle } from 'lucide-react';
import { TradingViewWidget } from '@/components/charts/TradingViewWidget';

export default function Charts() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  if (!isAuthenticated) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-3xl font-bold text-white">Charts & Analysis</h1>
          <p className="text-gray-400 mt-2">Professional charting powered by TradingView</p>
        </header>

        <div className="bg-gray-800 rounded-xl p-8 max-w-2xl mx-auto text-center">
          <Lock className="w-12 h-12 text-trading-accent mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Login Required</h2>
          <p className="text-gray-400 mb-6">
            Please log in to access professional trading charts and analysis tools.
          </p>
          <button
            onClick={handleLogin}
            className="px-6 py-3 bg-trading-accent text-gray-900 rounded-lg font-semibold hover:bg-opacity-90 transition-colors"
          >
            Login to Access Charts
          </button>
        </div>

        <div className="bg-gray-800/50 rounded-xl p-6 mt-6 max-w-2xl mx-auto">
          <div className="flex items-center gap-2 text-trading-warning mb-4">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="font-semibold">Premium Features</h3>
          </div>
          <ul className="space-y-3 text-gray-400">
            <li>• Real-time market data and advanced charting tools</li>
            <li>• Multiple timeframes and technical indicators</li>
            <li>• Save custom layouts and trading templates</li>
            <li>• Access to a global trading community</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <header className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Charts & Analysis</h1>
          <p className="text-gray-400 mt-2">Professional charting powered by TradingView</p>
        </div>
        <a
          href="https://www.tradingview.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-trading-accent hover:text-trading-accent/80 transition-colors"
        >
          <span>Open in TradingView</span>
          <ExternalLink className="w-4 h-4" />
        </a>
      </header>

      <div className="flex-1 bg-gray-800 rounded-xl overflow-hidden">
        <TradingViewWidget />
      </div>
    </div>
  );
}