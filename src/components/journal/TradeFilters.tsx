import React from 'react';
import { Search, Filter, X } from 'lucide-react';

interface TradeFiltersProps {
  filters: any;
  setFilters: (filters: any) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  uniqueSymbols: string[];
  uniqueTags: string[];
}

export function TradeFilters({
  filters,
  setFilters,
  searchQuery,
  setSearchQuery,
  uniqueSymbols,
  uniqueTags
}: TradeFiltersProps) {
  const clearFilters = () => {
    setFilters({});
    setSearchQuery('');
  };

  return (
    <div className="bg-gray-800 rounded-xl p-4 md:p-6 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <h2 className="text-lg md:text-xl font-semibold flex items-center gap-2">
          <Filter className="w-5 h-5 text-trading-accent" />
          Trade Filters
        </h2>
        {(Object.keys(filters).length > 0 || searchQuery) && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
            Clear Filters
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Search
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-700 rounded-lg pl-9 pr-4 py-2 text-white focus:ring-2 focus:ring-trading-accent focus:outline-none"
              placeholder="Search trades..."
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Symbol
          </label>
          <select
            value={filters.symbol || ''}
            onChange={(e) => setFilters({ ...filters, symbol: e.target.value || undefined })}
            className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-trading-accent focus:outline-none"
          >
            <option value="">All Symbols</option>
            {uniqueSymbols.map((symbol) => (
              <option key={symbol} value={symbol}>
                {symbol}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Order Type
          </label>
          <select
            value={filters.orderType || ''}
            onChange={(e) => setFilters({ ...filters, orderType: e.target.value || undefined })}
            className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-trading-accent focus:outline-none"
          >
            <option value="">All Types</option>
            <option value="buy">Buy</option>
            <option value="sell">Sell</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Status
          </label>
          <select
            value={filters.status || ''}
            onChange={(e) => setFilters({ ...filters, status: e.target.value || undefined })}
            className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-trading-accent focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {uniqueTags.length > 0 && (
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Tags
          </label>
          <div className="flex flex-wrap gap-2">
            {uniqueTags.map((tag) => (
              <button
                key={tag}
                onClick={() => {
                  const currentTags = filters.tags || [];
                  const newTags = currentTags.includes(tag)
                    ? currentTags.filter((t: string) => t !== tag)
                    : [...currentTags, tag];
                  setFilters({
                    ...filters,
                    tags: newTags.length > 0 ? newTags : undefined
                  });
                }}
                className={`px-3 py-1 rounded-full text-sm ${
                  filters.tags?.includes(tag)
                    ? 'bg-trading-accent text-gray-900'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                } transition-colors`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}