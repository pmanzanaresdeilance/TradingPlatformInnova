import { useState, useEffect, useCallback } from 'react';
import { ForexEvent } from '@/types';

export function useForexEvents(refreshInterval = 5 * 60 * 1000) {
  const [events, setEvents] = useState<ForexEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Add a proxy or use your backend to handle the request
      const response = await fetch('/api/calendar/events');
      if (!response.ok) {
        throw new Error('Failed to fetch economic events');
      }

      const data = await response.json();

      // Transform data to match ForexEvent type
      const transformedEvents: ForexEvent[] = data.map((event: any) => {
        // Parse date and time
        const eventDate = new Date(event.date);
        
        return {
          title: event.title,
          date: eventDate.toLocaleDateString(),
          time: event.time || eventDate.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          }),
          currency: event.country,
          impact: event.impact?.toLowerCase() || 'low',
          forecast: event.forecast || null,
          previous: event.previous || null,
          actual: event.actual || null
        };
      });

      // Sort events by date and time
      transformedEvents.sort((a, b) => {
        const dateA = new Date(`${a.date} ${a.time}`);
        const dateB = new Date(`${b.date} ${b.time}`);
        return dateA.getTime() - dateB.getTime();
      });

      setEvents(transformedEvents);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to load economic events:', err);
      // Provide more user-friendly error message
      setError('Unable to load economic events at this time. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
    const interval = setInterval(loadEvents, refreshInterval);
    return () => clearInterval(interval);
  }, [loadEvents, refreshInterval]);

  return {
    events,
    loading,
    error,
    lastUpdated,
    refresh: loadEvents
  };
}