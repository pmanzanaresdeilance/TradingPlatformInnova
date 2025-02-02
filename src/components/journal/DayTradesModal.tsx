import React, { useState } from 'react';
import { format } from 'date-fns';
import { Edit2, X, TrendingUp, TrendingDown, Clock, DollarSign, Loader2 } from 'lucide-react';
import { Trade } from '@/types';
import { supabase } from '@/lib/supabase';

interface DayTradesModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date;
  trades: Trade[];
  onTradeUpdate: () => void;
}

export function DayTradesModal({ isOpen, onClose, date, trades, onTradeUpdate }: DayTradesModalProps) {
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const totalProfit = trades.reduce((sum, trade) => sum + (trade.profit_loss || 0), 0);
  const winningTrades = trades.filter(trade => trade.profit_loss > 0).length;
  const winRate = trades.length > 0 ? (winningTrades / trades.length * 100).toFixed(1) : '0.0';

  const handleSave = async (trade: Trade) => {
    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('trades')
        .update({
          symbol: trade.symbol,
          order_type: trade.order_type,
          lot_size: trade.lot_size,
          entry_price: trade.entry_price,
          exit_price: trade.exit_price,
          stop_loss: trade.stop_loss,
          take_profit: trade.take_profit,
          profit_loss: trade.profit_loss,
          status: trade.status,
          close_time: trade.close_time
        })
        .eq('id', trade.id);

      if (updateError) throw updateError;

      setEditingTrade(null);
      onTradeUpdate();
    } catch (err) {
      console.error('Failed to update trade:', err);
      setError('Failed to update trade. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-gray-800 rounded-xl p-4 md:p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-bold">{format(date, 'MMMM d, yyyy')}</h2>
            <p className="text-sm md:text-base text-gray-400">{trades.length} trades</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-700/50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <DollarSign className="w-4 h-4" />
              Total P/L
            </div>
            <div className={`text-lg md:text-xl font-bold ${
              totalProfit > 0 ? 'text-trading-success' : 
              totalProfit < 0 ? 'text-trading-danger' : 'text-gray-400'
            }`}>
              ${totalProfit.toFixed(2)}
            </div>
          </div>

          <div className="bg-gray-700/50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <TrendingUp className="w-4 h-4" />
              Win Rate
            </div>
            <div className="text-lg md:text-xl font-bold text-trading-accent">
              {winRate}%
            </div>
          </div>

          <div className="bg-gray-700/50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <Clock className="w-4 h-4" />
              Trades
            </div>
            <div className="text-lg md:text-xl font-bold">
              {winningTrades}/{trades.length}
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-trading-danger/10 border border-trading-danger/20 rounded-lg">
            <p className="text-sm text-trading-danger">{error}</p>
          </div>
        )}

        {/* Trades List */}
        <div className="space-y-3 md:space-y-4">
          {trades.map(trade => (
            <div key={trade.id} className="bg-gray-700/50 rounded-lg p-4">
              {editingTrade?.id === trade.id ? (
                <form onSubmit={(e) => {
                  e.preventDefault();
                  handleSave(editingTrade);
                }}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">
                        Symbol
                      </label>
                      <input
                        type="text"
                        value={editingTrade.symbol}
                        onChange={(e) => setEditingTrade({
                          ...editingTrade,
                          symbol: e.target.value.toUpperCase()
                        })}
                        className="w-full bg-gray-700 rounded-lg px-3 py-2 text-sm md:text-base text-white focus:ring-2 focus:ring-trading-accent focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">
                        Type
                      </label>
                      <select
                        value={editingTrade.order_type}
                        onChange={(e) => setEditingTrade({
                          ...editingTrade,
                          order_type: e.target.value as 'buy' | 'sell'
                        })}
                        className="w-full bg-gray-700 rounded-lg px-3 py-2 text-sm md:text-base text-white focus:ring-2 focus:ring-trading-accent focus:outline-none"
                      >
                        <option value="buy">Buy</option>
                        <option value="sell">Sell</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">
                        Lot Size
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={editingTrade.lot_size}
                        onChange={(e) => setEditingTrade({
                          ...editingTrade,
                          lot_size: parseFloat(e.target.value)
                        })}
                        className="w-full bg-gray-700 rounded-lg px-3 py-2 text-sm md:text-base text-white focus:ring-2 focus:ring-trading-accent focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">
                        Entry Price
                      </label>
                      <input
                        type="number"
                        step="0.00001"
                        value={editingTrade.entry_price}
                        onChange={(e) => setEditingTrade({
                          ...editingTrade,
                          entry_price: parseFloat(e.target.value)
                        })}
                        className="w-full bg-gray-700 rounded-lg px-3 py-2 text-sm md:text-base text-white focus:ring-2 focus:ring-trading-accent focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">
                        Exit Price
                      </label>
                      <input
                        type="number"
                        step="0.00001"
                        value={editingTrade.exit_price || ''}
                        onChange={(e) => setEditingTrade({
                          ...editingTrade,
                          exit_price: e.target.value ? parseFloat(e.target.value) : null
                        })}
                        className="w-full bg-gray-700 rounded-lg px-3 py-2 text-sm md:text-base text-white focus:ring-2 focus:ring-trading-accent focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">
                        Stop Loss
                      </label>
                      <input
                        type="number"
                        step="0.00001"
                        value={editingTrade.stop_loss || ''}
                        onChange={(e) => setEditingTrade({
                          ...editingTrade,
                          stop_loss: e.target.value ? parseFloat(e.target.value) : null
                        })}
                        className="w-full bg-gray-700 rounded-lg px-3 py-2 text-sm md:text-base text-white focus:ring-2 focus:ring-trading-accent focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">
                        Take Profit
                      </label>
                      <input
                        type="number"
                        step="0.00001"
                        value={editingTrade.take_profit || ''}
                        onChange={(e) => setEditingTrade({
                          ...editingTrade,
                          take_profit: e.target.value ? parseFloat(e.target.value) : null
                        })}
                        className="w-full bg-gray-700 rounded-lg px-3 py-2 text-sm md:text-base text-white focus:ring-2 focus:ring-trading-accent focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">
                        Profit/Loss
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={editingTrade.profit_loss || ''}
                        onChange={(e) => setEditingTrade({
                          ...editingTrade,
                          profit_loss: e.target.value ? parseFloat(e.target.value) : null
                        })}
                        className="w-full bg-gray-700 rounded-lg px-3 py-2 text-sm md:text-base text-white focus:ring-2 focus:ring-trading-accent focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setEditingTrade(null)}
                      className="px-3 md:px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm md:text-base"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-3 md:px-4 py-2 bg-trading-accent text-gray-900 rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm md:text-base"
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
                </form>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className={`text-xs md:text-sm font-medium px-2 py-1 rounded ${
                        trade.order_type === 'buy' ? 'bg-trading-success/20 text-trading-success' :
                        'bg-trading-danger/20 text-trading-danger'
                      }`}>
                        {trade.order_type.toUpperCase()}
                      </span>
                      <span className="text-xs md:text-sm font-medium text-trading-accent">
                        {trade.symbol}
                      </span>
                      <span className="text-xs md:text-sm text-gray-400">
                        {trade.lot_size} lots
                      </span>
                    </div>
                    <button
                      onClick={() => setEditingTrade(trade)}
                      className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <span className="text-xs md:text-sm text-gray-400">Entry Price</span>
                      <p className="text-sm md:text-base font-medium">{trade.entry_price}</p>
                    </div>
                    <div>
                      <span className="text-xs md:text-sm text-gray-400">Exit Price</span>
                      <p className="text-sm md:text-base font-medium">{trade.exit_price || '-'}</p>
                    </div>
                    <div>
                      <span className="text-xs md:text-sm text-gray-400">Stop Loss</span>
                      <p className="text-sm md:text-base font-medium">{trade.stop_loss || '-'}</p>
                    </div>
                    <div>
                      <span className="text-xs md:text-sm text-gray-400">Take Profit</span>
                      <p className="text-sm md:text-base font-medium">{trade.take_profit || '-'}</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-600">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div>
                          <span className="text-xs md:text-sm text-gray-400">P/L</span>
                          <p className={`font-medium ${
                            trade.profit_loss > 0 ? 'text-trading-success' :
                            trade.profit_loss < 0 ? 'text-trading-danger' : 'text-gray-400'
                          }`}>
                            ${trade.profit_loss?.toFixed(2) || '0.00'}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs md:text-sm text-gray-400">Status</span>
                          <p className="text-sm md:text-base font-medium">{trade.status}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs md:text-sm text-gray-400">Time</span>
                        <p className="text-sm md:text-base font-medium">
                          {format(new Date(trade.open_time), 'HH:mm:ss')}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}