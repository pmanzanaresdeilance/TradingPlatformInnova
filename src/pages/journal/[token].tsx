import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Calendar, BarChart2 } from 'lucide-react';
import { DayTradesModal } from '@/components/journal/DayTradesModal';
import type { Trade } from '@/types';

export default function SharedJournal() {
  const { token } = useParams();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [ownerName, setOwnerName] = useState<string>('');

  useEffect(() => {
    const loadSharedJournal = async () => {
      try {
        setLoading(true);
        
        // Verify share token and get trades
        const { data: shareData, error: shareError } = await supabase
          .from('journal_shares')
          .select(`
            owner_id,
            owner:owner_id(
              raw_user_meta_data->>'username' as username
            )
          `)
          .eq('share_token', token)
          .single();

        if (shareError) throw shareError;
        
        setOwnerName(shareData.owner.username);

        // Get trades
        const { data: tradesData, error: tradesError } = await supabase
          .from('trades')
          .select('*')
          .eq('user_id', shareData.owner_id)
          .order('open_time', { ascending: false });

        if (tradesError) throw tradesError;
        setTrades(tradesData);

      } catch (err) {
        console.error('Error loading shared journal:', err);
        setError('Invalid or expired share link');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      loadSharedJournal();
    }
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-trading-accent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-trading-danger mb-2">{error}</h2>
          <p className="text-gray-400">This share link may be invalid or has expired.</p>
        </div>
      </div>
    );
  }

  // Calculate monthly stats
  const monthlyStats = trades.reduce((acc, trade) => {
    if (trade.profit_loss) {
      acc.totalProfit += trade.profit_loss > 0 ? trade.profit_loss : 0;
      acc.totalLoss += trade.profit_loss < 0 ? Math.abs(trade.profit_loss) : 0;
      acc.trades += 1;
      if (trade.profit_loss > 0) acc.winningTrades += 1;
    }
    return acc;
  }, { totalProfit: 0, totalLoss: 0, trades: 0, winningTrades: 0 });

  const winRate = monthlyStats.trades > 0 
    ? (monthlyStats.winningTrades / monthlyStats.trades * 100).toFixed(2)
    : '0.00';

  const profitFactor = monthlyStats.totalLoss > 0
    ? (monthlyStats.totalProfit / monthlyStats.totalLoss).toFixed(2)
    : '0.00';

  // Generate calendar days
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Group trades by date
  const tradesByDate = trades.reduce((acc, trade) => {
    const date = new Date(trade.open_time).toDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(trade);
    return acc;
  }, {} as Record<string, Trade[]>);

  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-3xl font-bold text-white">
          {ownerName}'s Trading Journal
        </h1>
        <p className="text-gray-400 mt-2">Shared trading history and performance</p>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="w-5 h-5 text-trading-accent" />
            <h2 className="text-lg font-semibold">Monthly Stats</h2>
          </div>
          <div className="text-3xl font-bold mb-2">${monthlyStats.totalProfit.toFixed(2)}</div>
          <p className="text-gray-400">From {monthlyStats.trades} trades</p>
        </div>

        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-5 h-5 text-trading-accent" />
            <h2 className="text-lg font-semibold">Win Rate</h2>
          </div>
          <div className="text-3xl font-bold mb-2">{winRate}%</div>
          <p className="text-gray-400">{monthlyStats.winningTrades} winning trades</p>
        </div>

        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <BarChart2 className="w-5 h-5 text-trading-accent" />
            <h2 className="text-lg font-semibold">Profit Factor</h2>
          </div>
          <div className="text-3xl font-bold mb-2">{profitFactor}</div>
          <p className="text-gray-400">Win/Loss ratio</p>
        </div>

        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <TrendingDown className="w-5 h-5 text-trading-accent" />
            <h2 className="text-lg font-semibold">Average Loss</h2>
          </div>
          <div className="text-3xl font-bold mb-2">
            ${monthlyStats.trades > 0 ? (monthlyStats.totalLoss / monthlyStats.trades).toFixed(2) : '0.00'}
          </div>
          <p className="text-gray-400">Per trade</p>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Trading Calendar</h2>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-lg font-medium">
              {format(currentDate, 'MMMM yyyy')}
            </span>
            <button
              onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-sm font-medium text-gray-400 py-2">
              {day}
            </div>
          ))}

          {days.map(day => {
            const dayTrades = tradesByDate[day.toDateString()] || [];
            const totalProfit = dayTrades.reduce((sum, trade) => sum + (trade.profit_loss || 0), 0);
            const hasWinningTrade = dayTrades.some(trade => trade.profit_loss > 0);
            const hasLosingTrade = dayTrades.some(trade => trade.profit_loss < 0);

            return (
              <div
                key={day.toISOString()}
                className={`
                  p-4 rounded-lg min-h-[100px]
                  ${isSameDay(day, new Date()) ? 'bg-trading-accent/10 border border-trading-accent' : 'bg-gray-700/50'}
                  ${dayTrades.length > 0 ? 'cursor-pointer hover:bg-gray-700' : ''}
                `}
                onClick={() => dayTrades.length > 0 && setSelectedDate(day)}
              >
                <div className="text-sm font-medium mb-2">{format(day, 'd')}</div>
                {dayTrades.length > 0 && (
                  <div>
                    <div className={`text-sm font-bold ${
                      totalProfit > 0 ? 'text-trading-success' : 
                      totalProfit < 0 ? 'text-trading-danger' : 'text-gray-400'
                    }`}>
                      ${totalProfit.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {dayTrades.length} trade{dayTrades.length > 1 ? 's' : ''}
                    </div>
                    <div className="flex gap-1 mt-2">
                      {hasWinningTrade && (
                        <div className="w-2 h-2 rounded-full bg-trading-success"></div>
                      )}
                      {hasLosingTrade && (
                        <div className="w-2 h-2 rounded-full bg-trading-danger"></div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {selectedDate && (
        <DayTradesModal
          isOpen={true}
          onClose={() => setSelectedDate(null)}
          date={selectedDate}
          trades={tradesByDate[selectedDate.toDateString()] || []}
          onTradeUpdate={() => {
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}