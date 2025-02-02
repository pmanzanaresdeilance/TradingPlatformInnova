-- Create traders table
CREATE TABLE IF NOT EXISTS traders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  trading_style TEXT CHECK (trading_style IN ('day_trading', 'swing_trading', 'position_trading', 'scalping')),
  risk_level TEXT CHECK (risk_level IN ('conservative', 'moderate', 'aggressive')),
  experience_level TEXT CHECK (experience_level IN ('beginner', 'intermediate', 'advanced', 'professional')),
  preferred_markets TEXT[] DEFAULT ARRAY['forex'],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Create trader preferences table
CREATE TABLE IF NOT EXISTS trader_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trader_id UUID REFERENCES traders(id) ON DELETE CASCADE,
  default_position_size DECIMAL,
  default_risk_percentage DECIMAL,
  max_daily_trades INTEGER,
  preferred_sessions TEXT[] DEFAULT ARRAY['london', 'new_york'],
  trading_days TEXT[] DEFAULT ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(trader_id)
);

-- Create trading strategies table
CREATE TABLE IF NOT EXISTS trading_strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trader_id UUID REFERENCES traders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  timeframes TEXT[],
  indicators TEXT[],
  risk_reward_ratio DECIMAL,
  win_rate_target DECIMAL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add relationships to existing tables

-- Add trader_id to trading_accounts
ALTER TABLE trading_accounts
ADD COLUMN trader_id UUID REFERENCES traders(id) ON DELETE CASCADE;

-- Add strategy_id to trades
ALTER TABLE trades
ADD COLUMN strategy_id UUID REFERENCES trading_strategies(id) ON DELETE SET NULL;

-- Add trade metrics table for detailed analysis
CREATE TABLE IF NOT EXISTS trade_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id UUID REFERENCES trades(id) ON DELETE CASCADE,
  strategy_id UUID REFERENCES trading_strategies(id),
  planned_risk_reward DECIMAL,
  actual_risk_reward DECIMAL,
  deviation_from_strategy TEXT,
  psychology_notes TEXT,
  market_conditions TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(trade_id)
);

-- Enable RLS
ALTER TABLE traders ENABLE ROW LEVEL SECURITY;
ALTER TABLE trader_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_performance ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Traders table policies
CREATE POLICY "Users can view their own trader profile"
  ON traders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own trader profile"
  ON traders FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Trader preferences policies
CREATE POLICY "Users can view their own preferences"
  ON trader_preferences FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM traders
      WHERE traders.id = trader_preferences.trader_id
      AND traders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own preferences"
  ON trader_preferences FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM traders
      WHERE traders.id = trader_preferences.trader_id
      AND traders.user_id = auth.uid()
    )
  );

-- Trading strategies policies
CREATE POLICY "Users can view their own strategies"
  ON trading_strategies FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM traders
      WHERE traders.id = trading_strategies.trader_id
      AND traders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own strategies"
  ON trading_strategies FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM traders
      WHERE traders.id = trading_strategies.trader_id
      AND traders.user_id = auth.uid()
    )
  );

-- Trade performance policies
CREATE POLICY "Users can view their own trade performance"
  ON trade_performance FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trades
      WHERE trades.id = trade_performance.trade_id
      AND trades.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own trade performance"
  ON trade_performance FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trades
      WHERE trades.id = trade_performance.trade_id
      AND trades.user_id = auth.uid()
    )
  );

-- Add updated_at triggers
CREATE TRIGGER update_traders_updated_at
  BEFORE UPDATE ON traders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trader_preferences_updated_at
  BEFORE UPDATE ON trader_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trading_strategies_updated_at
  BEFORE UPDATE ON trading_strategies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trade_performance_updated_at
  BEFORE UPDATE ON trade_performance
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert demo data
INSERT INTO traders (
  id,
  user_id,
  trading_style,
  risk_level,
  experience_level,
  preferred_markets
) VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'd7bed82c-5f89-4a4e-a5f9-7f1e0b860786',
  'swing_trading',
  'moderate',
  'advanced',
  ARRAY['forex', 'indices']
);

-- Update existing trading account with trader_id
UPDATE trading_accounts
SET trader_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
WHERE user_id = 'd7bed82c-5f89-4a4e-a5f9-7f1e0b860786';

-- Insert demo trading strategy
INSERT INTO trading_strategies (
  trader_id,
  name,
  description,
  timeframes,
  indicators,
  risk_reward_ratio,
  win_rate_target
) VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'Price Action Breakout',
  'Trading breakouts from key support and resistance levels with price action confirmation',
  ARRAY['H4', 'D1'],
  ARRAY['Support/Resistance', 'Price Action', 'Volume'],
  2.5,
  65.0
);