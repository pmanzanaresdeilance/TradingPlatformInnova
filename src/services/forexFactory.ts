import { ForexEvent } from '@/types';

export async function fetchForexFactoryEvents(): Promise<ForexEvent[]> {
  // Simulated data for development - in production this would fetch from your backend
  return [
    {
      title: 'NFP (Non-Farm Payrolls)',
      date: '2024-03-01',
      time: '13:30',
      currency: 'USD',
      impact: 'high',
      forecast: '180K',
      previous: '216K'
    },
    {
      title: 'Interest Rate Decision',
      date: '2024-03-07',
      time: '12:45',
      currency: 'EUR',
      impact: 'high',
      forecast: '4.50%',
      previous: '4.50%'
    },
    // Add more simulated events...
  ];
}