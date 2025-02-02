import React, { useState, useEffect } from 'react';
import { Trophy, TrendingUp, Users, Award, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface TraderRanking {
  user_id: string;
  username: string;
  avatar_url?: string;
  profitability: number;
  max_drawdown: number;
  total_trades: number;
  win_rate: number;
  rank: number;
}

export default function Rankings() {
  const { user } = useAuth();
  const [rankings, setRankings] = useState<any[]>([]);
  const [userRank, setUserRank] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    const loadRankings = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase.rpc('get_trader_rankings', {
          time_period: timeframe
        });

        if (error) throw error;

        setRankings(data || []);

        if (user) {
          const userRanking = data?.find((r: any) => r.user_id === user.id);
          setUserRank(userRanking || null);
        }
      } catch (err) {
        console.error('Error loading rankings:', err);
        setError('Failed to load rankings');
      } finally {
        setLoading(false);
      }
    };

    loadRankings();
  }, [timeframe, user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-12 h-12 animate-spin text-trading-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-white">Trader Rankings</h1>
        <p className="text-gray-400 mt-2">Top performers in our trading community</p>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Trophy className="w-5 h-5 text-trading-accent" />
            <h2 className="text-lg font-semibold">Top Trader</h2>
          </div>
          <div className="text-center">
            {rankings[0] && (
              <>
                <div className="w-20 h-20 rounded-full bg-gray-700 mx-auto mb-4 flex items-center justify-center overflow-hidden">
                  {rankings[0].avatar_url ? (
                    <img
                      src={rankings[0].avatar_url}
                      alt={rankings[0].username}
                      className="w-full h-full rounded-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          rankings[0].username
                        )}&background=7C3AED&color=fff`;
                      }}
                    />
                  ) : (
                    <span className="text-2xl font-bold">
                      {rankings[0].username.substring(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-semibold">{rankings[0].username}</h3>
                <p className="text-trading-accent mt-1">
                  {parseFloat(rankings[0].profitability).toFixed(2)}% profit
                </p>
              </>
            )}
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-5 h-5 text-trading-accent" />
            <h2 className="text-lg font-semibold">Best Win Rate</h2>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold mb-2">
              {rankings[0] ? `${parseFloat(rankings[0].win_rate).toFixed(1)}%` : '0%'}
            </div>
            <p className="text-gray-400">Last {timeframe}</p>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-5 h-5 text-trading-accent" />
            <h2 className="text-lg font-semibold">Your Rank</h2>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold mb-2">
              #{userRank ? userRank.rank : '-'}
            </div>
            <p className="text-gray-400">Global position</p>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Award className="w-5 h-5 text-trading-accent" />
            <h2 className="text-lg font-semibold">Lowest Drawdown</h2>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold mb-2">
              {rankings[0] ? `${Math.abs(parseFloat(rankings[0].max_drawdown)).toFixed(2)}%` : '0%'}
            </div>
            <p className="text-gray-400">Best risk management</p>
          </div>
        </div>
      </div>

      {/* Time Period Filter */}
      <div className="bg-gray-800 rounded-xl p-6 mb-6">
        <div className="flex items-center gap-4">
          <span className="text-gray-400">Time Period:</span>
          <div className="flex gap-2">
            {(['week', 'month', 'year'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setTimeframe(period)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  timeframe === period
                    ? 'bg-trading-accent text-gray-900'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Rankings Table */}
      <div className="bg-gray-800 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold">Leaderboard</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-700/50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Trader
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Profitability
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Max Drawdown
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Win Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Total Trades
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {rankings.map((trader) => (
                <tr
                  key={trader.user_id}
                  className={`hover:bg-gray-700/50 ${
                    trader.user_id === user?.id ? 'bg-trading-accent/10' : ''
                  }`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className={`
                        w-8 h-8 rounded-full flex items-center justify-center font-bold
                        ${trader.rank === 1 ? 'bg-yellow-500' : 
                          trader.rank === 2 ? 'bg-gray-400' :
                          trader.rank === 3 ? 'bg-amber-700' : 'bg-gray-700'}
                      `}>
                        {trader.rank}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {trader.avatar_url ? (
                        <img
                          src={trader.avatar_url}
                          alt={trader.username}
                          className="w-8 h-8 rounded-full object-cover bg-gray-700"
                          onError={(e) => {
                            e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              trader.username
                            )}&background=7C3AED&color=fff`;
                          }}
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                          <span className="text-sm font-medium">
                            {trader.username.substring(0, 2).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="text-sm font-medium text-white ml-3">{trader.username}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm ${
                      trader.profitability > 0 ? 'text-trading-success' : 
                      trader.profitability < 0 ? 'text-trading-danger' : 'text-gray-400'
                    }`}> 
                      {parseFloat(trader.profitability) > 0 ? '+' : ''}{parseFloat(trader.profitability).toFixed(2)}%
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-trading-danger">
                      {Math.abs(parseFloat(trader.max_drawdown)).toFixed(2)}%
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-white">{parseFloat(trader.win_rate).toFixed(1)}%</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-white">{trader.total_trades}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}