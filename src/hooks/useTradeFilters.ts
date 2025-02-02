import { useState, useCallback } from 'react';
import { Trade } from '@/services/mt';

interface TradeFilters {
  symbol?: string;
  orderType?: 'buy' | 'sell';
  status?: 'open' | 'closed' | 'cancelled';
  dateRange?: {
    start: Date;
    end: Date;
  };
  profitRange?: {
    min: number;
    max: number;
  };
  tags?: string[];
}

export function useTradeFilters(trades: Trade[]) {
  const [filters, setFilters] = useState<TradeFilters>({});
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTrades = useCallback(() => {
    return trades.filter(trade => {
      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const searchable = [
          trade.symbol,
          trade.ticket_number.toString(),
          trade.strategy,
          ...(trade.tags || [])
        ].map(s => s?.toLowerCase());
        
        if (!searchable.some(s => s?.includes(query))) {
          return false;
        }
      }

      // Symbol filter
      if (filters.symbol && trade.symbol !== filters.symbol) {
        return false;
      }

      // Order type filter
      if (filters.orderType && trade.order_type !== filters.orderType) {
        return false;
      }

      // Status filter
      if (filters.status && trade.status !== filters.status) {
        return false;
      }

      // Date range filter
      if (filters.dateRange) {
        const tradeDate = new Date(trade.open_time);
        if (
          tradeDate < filters.dateRange.start ||
          tradeDate > filters.dateRange.end
        ) {
          return false;
        }
      }

      // Profit range filter
      if (filters.profitRange && trade.profit_loss !== undefined) {
        if (
          trade.profit_loss < filters.profitRange.min ||
          trade.profit_loss > filters.profitRange.max
        ) {
          return false;
        }
      }

      // Tags filter
      if (filters.tags && filters.tags.length > 0) {
        if (!trade.tags || !filters.tags.some(tag => trade.tags?.includes(tag))) {
          return false;
        }
      }

      return true;
    });
  }, [trades, filters, searchQuery]);

  const uniqueSymbols = [...new Set(trades.map(trade => trade.symbol))];
  const uniqueTags = [...new Set(trades.flatMap(trade => trade.tags || []))];

  return {
    filters,
    setFilters,
    searchQuery,
    setSearchQuery,
    filteredTrades: filteredTrades(),
    uniqueSymbols,
    uniqueTags
  };
}