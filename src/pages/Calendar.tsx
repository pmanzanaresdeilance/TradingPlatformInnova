import React, { useState } from 'react';
import { CalendarHeader } from '@/components/calendar/CalendarHeader';
import { CalendarTable } from '@/components/calendar/CalendarTable';
import { useForexEvents } from '@/hooks/useForexEvents';
import { Calendar as CalendarIcon, Filter, X } from 'lucide-react';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

export default function Calendar() {
  const { events, loading, error, lastUpdated, refresh } = useForexEvents();
  const [dateRange, setDateRange] = useState<'day' | 'week' | 'month'>('day');
  const [selectedCurrencies, setSelectedCurrencies] = useState<string[]>([]);
  const [customStartDate, setCustomStartDate] = useState<Date | null>(null);
  const [customEndDate, setCustomEndDate] = useState<Date | null>(null);

  // Get unique currencies from events
  const uniqueCurrencies = Array.from(new Set(events.map(event => event.currency))).sort();

  // Calculate date range
  const getDateRange = () => {
    const now = new Date();
    if (customStartDate && customEndDate) {
      return {
        start: startOfDay(customStartDate),
        end: endOfDay(customEndDate)
      };
    }

    switch (dateRange) {
      case 'week':
        return {
          start: startOfWeek(now, { weekStartsOn: 1 }),
          end: endOfWeek(now, { weekStartsOn: 1 })
        };
      case 'month':
        return {
          start: startOfMonth(now),
          end: endOfMonth(now)
        };
      default:
        return {
          start: startOfDay(now),
          end: endOfDay(now)
        };
    }
  };

  // Filter events based on date range and selected currencies
  const filteredEvents = events.filter(event => {
    const eventDate = new Date(event.date + ' ' + event.time);
    const { start, end } = getDateRange();
    const withinDateRange = isWithinInterval(eventDate, { start, end });
    const matchesCurrency = selectedCurrencies.length === 0 || selectedCurrencies.includes(event.currency);
    return withinDateRange && matchesCurrency;
  });

  if (loading && events.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-trading-accent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CalendarHeader lastUpdated={lastUpdated} onRefresh={refresh} />

      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-gray-800 rounded-xl p-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Date Range Selection */}
          <div className="flex-1 space-y-4">
            <h3 className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" /> Date Range
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setDateRange('day');
                  setCustomStartDate(null);
                  setCustomEndDate(null);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  dateRange === 'day' && !customStartDate
                    ? 'bg-trading-accent text-gray-900'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => {
                  setDateRange('week');
                  setCustomStartDate(null);
                  setCustomEndDate(null);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  dateRange === 'week' && !customStartDate
                    ? 'bg-trading-accent text-gray-900'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                This Week
              </button>
              <button
                onClick={() => {
                  setDateRange('month');
                  setCustomStartDate(null);
                  setCustomEndDate(null);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  dateRange === 'month' && !customStartDate
                    ? 'bg-trading-accent text-gray-900'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                This Month
              </button>
            </div>

            {/* Custom Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Start Date</label>
                <input
                  type="date"
                  value={customStartDate?.toISOString().split('T')[0] || ''}
                  onChange={(e) => {
                    const date = e.target.value ? new Date(e.target.value) : null;
                    setCustomStartDate(date);
                    if (date) setDateRange('custom');
                  }}
                  className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-trading-accent focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">End Date</label>
                <input
                  type="date"
                  value={customEndDate?.toISOString().split('T')[0] || ''}
                  onChange={(e) => {
                    const date = e.target.value ? new Date(e.target.value) : null;
                    setCustomEndDate(date);
                    if (date) setDateRange('custom');
                  }}
                  min={customStartDate?.toISOString().split('T')[0]}
                  className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-trading-accent focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Currency Selection */}
          <div className="flex-1 space-y-4">
            <h3 className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <Filter className="w-4 h-4" /> Currencies
            </h3>
            <div className="flex flex-wrap gap-2">
              {uniqueCurrencies.map((currency) => (
                <button
                  key={currency}
                  onClick={() => {
                    setSelectedCurrencies(prev =>
                      prev.includes(currency)
                        ? prev.filter(c => c !== currency)
                        : [...prev, currency]
                    );
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedCurrencies.includes(currency)
                      ? 'bg-trading-accent text-gray-900'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {currency}
                </button>
              ))}
              {selectedCurrencies.length > 0 && (
                <button
                  onClick={() => setSelectedCurrencies([])}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <CalendarTable events={filteredEvents} />
    </div>
  );
}