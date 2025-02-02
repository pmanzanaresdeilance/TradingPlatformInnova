import React from 'react';
import { CalendarIcon, Clock, TrendingUp, AlertTriangle } from 'lucide-react';
import { ForexEvent } from '@/types';
import { getImpactColor } from '@/utils/calendar';

interface CalendarTableProps {
  events: ForexEvent[];
}

export function CalendarTable({ events }: CalendarTableProps) {
  return (
    <div className="bg-gray-800 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-900">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                <div className="flex items-center">
                  <CalendarIcon className="w-4 h-4 mr-2" /> Date/Time
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Currency
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Event
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Impact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                <div className="flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2" /> Forecast
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Previous
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Actual
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {events.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                  No economic events scheduled for this period.
                </td>
              </tr>
            ) : (
              events.map((event, index) => (
                <tr key={index} className="hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2 text-gray-400" />
                      <div>
                        <div className="text-sm font-medium text-white">{event.date}</div>
                        <div className="text-sm text-gray-400">{event.time}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium rounded bg-gray-700">
                      {event.currency}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-white">{event.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <AlertTriangle className={`w-5 h-5 ${getImpactColor(event.impact)}`} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    {event.forecast || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    {event.previous || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {event.actual ? (
                      <span className={`text-sm font-medium ${
                        parseFloat(event.actual) > parseFloat(event.previous || '0')
                          ? 'text-trading-success'
                          : parseFloat(event.actual) < parseFloat(event.previous || '0')
                          ? 'text-trading-danger'
                          : 'text-gray-400'
                      }`}>
                        {event.actual}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}