import React from 'react';
import { format } from 'date-fns';
import { TrendingUp, TrendingDown, Clock, DollarSign } from 'lucide-react';
import type { MetatraderPosition, MetatraderOrder } from 'metaapi.cloud-sdk';

interface MTTradesListProps {
  positions: MetatraderPosition[];
  history: MetatraderOrder[];
  onModifyPosition: (positionId: string) => void;
  onClosePosition: (positionId: string) => void;
}

export function MTTradesList({
  positions,
  history,
  onModifyPosition,
  onClosePosition
}: MTTradesListProps) {
  return (
    <div className="space-y-6">
      {/* Open Positions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Open Positions</h2>
        <div className="bg-gray-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-700/50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    Symbol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    Volume
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    Open Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    S/L
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    T/P
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    Profit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {positions.map((position) => (
                  <tr key={position.id} className="hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-medium">{position.symbol}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 ${
                        position.type === 'POSITION_TYPE_BUY' 
                          ? 'text-trading-success' 
                          : 'text-trading-danger'
                      }`}>
                        {position.type === 'POSITION_TYPE_BUY' ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                        {position.type === 'POSITION_TYPE_BUY' ? 'Buy' : 'Sell'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {position.volume.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {position.openPrice.toFixed(5)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {position.stopLoss?.toFixed(5) || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {position.takeProfit?.toFixed(5) || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`font-medium ${
                        position.profit > 0 ? 'text-trading-success' :
                        position.profit < 0 ? 'text-trading-danger' :
                        'text-gray-400'
                      }`}>
                        ${position.profit.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onModifyPosition(position.id)}
                          className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors text-sm"
                        >
                          Modify
                        </button>
                        <button
                          onClick={() => onClosePosition(position.id)}
                          className="px-3 py-1 bg-trading-danger text-white rounded hover:bg-opacity-90 transition-colors text-sm"
                        >
                          Close
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {positions.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-400">
                      No open positions
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Trade History */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Trade History</h2>
        <div className="bg-gray-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-700/50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    Symbol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    Volume
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    Profit
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {history.map((trade) => (
                  <tr key={trade.id} className="hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {format(new Date(trade.openTime), 'MMM d, HH:mm')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-medium">{trade.symbol}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 ${
                        trade.type.includes('BUY') 
                          ? 'text-trading-success' 
                          : 'text-trading-danger'
                      }`}>
                        {trade.type.includes('BUY') ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                        {trade.type.includes('BUY') ? 'Buy' : 'Sell'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {trade.volume.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {trade.openPrice.toFixed(5)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`font-medium ${
                        trade.profit > 0 ? 'text-trading-success' :
                        trade.profit < 0 ? 'text-trading-danger' :
                        'text-gray-400'
                      }`}>
                        ${trade.profit.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))}
                {history.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                      No trade history
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}