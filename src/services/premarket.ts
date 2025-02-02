import { supabase } from '@/lib/supabase';

export interface PremarketAnalysis {
  id: string;
  symbol: string;
  timeframe: string;
  trend: 'bullish' | 'bearish' | 'neutral';
  key_levels: {
    support: number[];
    resistance: number[];
    pivot: number;
  };
  analysis: string;
  sentiment_score: number;
  volume_analysis: string;
  created_at: string;
}

export interface PremarketUpdate {
  id: string;
  title: string;
  content: string;
  category: string;
  impact: 'low' | 'medium' | 'high';
  source: string;
  created_at: string;
}

export interface PremarketEvent {
  id: string;
  title: string;
  description: string;
  datetime: string;
  currency: string;
  impact: 'low' | 'medium' | 'high';
  previous_value: string;
  forecast_value: string;
  actual_value?: string;
}

export async function getPremarketAnalysis() {
  const { data, error } = await supabase
    .from('premarket_analysis')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getPremarketUpdates() {
  const { data, error } = await supabase
    .from('premarket_updates')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getPremarketEvents() {
  const { data, error } = await supabase
    .from('premarket_events')
    .select('*')
    .order('datetime', { ascending: true });

  if (error) throw error;
  return data;
}