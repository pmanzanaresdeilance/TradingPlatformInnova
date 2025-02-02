export interface User {
  id: string;
  email: string;
  username: string;
  avatar_url?: string;
  created_at: string;
  subscription_tier: 'free' | 'premium' | 'elite';
}

export interface TradingStats {
  user_id: string;
  win_rate: number;
  profit_factor: number;
  total_trades: number;
  successful_trades: number;
  failed_trades: number;
  average_profit: number;
  average_loss: number;
  updated_at: string;
}

export interface ForexEvent {
  title: string;
  date: string;
  time: string;
  currency: string;
  impact: 'low' | 'medium' | 'high';
  forecast?: string;
  previous?: string;
  actual?: string;
}

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
  volume_analysis?: string;
  chart_images?: string[];
  created_at: string;
}

export interface MarketEvent {
  id: string;
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  datetime: string;
  currency: string;
}

export interface ChartAnalysis {
  id: string;
  user_id: string;
  title: string;
  description: string;
  chart_image_url: string;
  created_at: string;
  updated_at: string;
  status: 'pending' | 'reviewed' | 'completed';
  feedback?: string;
}