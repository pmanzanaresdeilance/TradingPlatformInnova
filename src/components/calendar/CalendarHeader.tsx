import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

interface CalendarHeaderProps {
  lastUpdated: Date;
  onRefresh: () => void;
}

export function CalendarHeader({ lastUpdated, onRefresh }: CalendarHeaderProps) {
  return (
    <header className="flex justify-between items-center">
      <div>
        <h1 className="text-3xl font-bold text-white">Economic Calendar</h1>
        <p className="text-gray-400 mt-2">
          Data provided by Forex Factory • Last updated: {format(lastUpdated, 'HH:mm:ss')}
        </p>
      </div>
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-4 text-sm">
          <span className="flex items-center text-trading-danger">
            <AlertTriangle className="w-4 h-4 mr-1" /> High Impact
          </span>
          <span className="flex items-center text-trading-warning">
            <AlertTriangle className="w-4 h-4 mr-1" /> Medium Impact
          </span>
          <span className="flex items-center text-trading-success">
            <AlertTriangle className="w-4 h-4 mr-1" /> Low Impact
          </span>
        </div>
        <button
          onClick={onRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>
    </header>
  );
}