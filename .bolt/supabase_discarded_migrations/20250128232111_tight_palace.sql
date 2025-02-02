-- Create demo trading account
INSERT INTO trading_accounts (
  id,
  user_id,
  name,
  broker,
  account_number,
  initial_balance,
  current_balance,
  currency,
  leverage
) VALUES (
  'c7e85a9d-8d65-4c67-8b5c-9f6e3d524f11',
  '41e778bb-75fd-4c9c-a5c5-f9b431da9b38',
  'Main Trading Account',
  'IC Markets',
  'MT5-12345678',
  10000.00,
  12350.00,
  'USD',
  100
);

-- Insert demo trades
INSERT INTO trades (
  id,
  user_id,
  account_id,
  ticket_number,
  symbol,
  order_type,
  lot_size,
  entry_price,
  exit_price,
  stop_loss,
  take_profit,
  profit_loss,
  commission,
  swap,
  open_time,
  close_time,
  status,
  timeframe,
  strategy
) VALUES
  -- Winning EURUSD trade
  (
    gen_random_uuid(),
    '41e778bb-75fd-4c9c-a5c5-f9b431da9b38',
    'c7e85a9d-8d65-4c67-8b5c-9f6e3d524f11',
    1001,
    'EURUSD',
    'buy',
    1.0,
    1.0850,
    1.0950,
    1.0800,
    1.0950,
    1000.00,
    -7.00,
    -2.00,
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '4 days',
    'closed',
    'H4',
    'Price Action'
  ),
  -- Winning GBPUSD trade
  (
    gen_random_uuid(),
    '41e778bb-75fd-4c9c-a5c5-f9b431da9b38',
    'c7e85a9d-8d65-4c67-8b5c-9f6e3d524f11',
    1002,
    'GBPUSD',
    'sell',
    0.5,
    1.2650,
    1.2550,
    1.2700,
    1.2550,
    500.00,
    -5.00,
    -1.00,
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '2 days',
    'closed',
    'H4',
    'Support/Resistance'
  ),
  -- Losing USDJPY trade
  (
    gen_random_uuid(),
    '41e778bb-75fd-4c9c-a5c5-f9b431da9b38',
    'c7e85a9d-8d65-4c67-8b5c-9f6e3d524f11',
    1003,
    'USDJPY',
    'buy',
    0.8,
    147.50,
    147.20,
    147.20,
    148.00,
    -240.00,
    -6.00,
    -1.50,
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '12 hours',
    'closed',
    'H1',
    'Trend Following'
  ),
  -- Winning XAUUSD trade
  (
    gen_random_uuid(),
    '41e778bb-75fd-4c9c-a5c5-f9b431da9b38',
    'c7e85a9d-8d65-4c67-8b5c-9f6e3d524f11',
    1004,
    'XAUUSD',
    'buy',
    0.5,
    2000.00,
    2050.00,
    1980.00,
    2060.00,
    2500.00,
    -10.00,
    -3.00,
    NOW() - INTERVAL '6 days',
    NOW() - INTERVAL '5 days',
    'closed',
    'D1',
    'Breakout'
  ),
  -- Open EURUSD trade
  (
    gen_random_uuid(),
    '41e778bb-75fd-4c9c-a5c5-f9b431da9b38',
    'c7e85a9d-8d65-4c67-8b5c-9f6e3d524f11',
    1005,
    'EURUSD',
    'buy',
    1.0,
    1.0880,
    NULL,
    1.0830,
    1.0980,
    NULL,
    -7.00,
    0.00,
    NOW() - INTERVAL '6 hours',
    NULL,
    'open',
    'H4',
    'Price Action'
  );

-- Add trade notes
INSERT INTO trade_notes (
  id,
  trade_id,
  user_id,
  note_type,
  content,
  created_at
) 
SELECT 
  gen_random_uuid(),
  t.id,
  t.user_id,
  'pre_trade',
  CASE t.symbol
    WHEN 'EURUSD' THEN 'Strong bullish momentum on H4 timeframe, looking for continuation after pullback to support.'
    WHEN 'GBPUSD' THEN 'Clear bearish break of support level, expecting continuation to next support zone.'
    WHEN 'USDJPY' THEN 'Potential trend reversal signal on H1, watching for confirmation.'
    WHEN 'XAUUSD' THEN 'Gold showing strong momentum after breaking key resistance level.'
  END,
  t.open_time
FROM trades t
WHERE t.user_id = '41e778bb-75fd-4c9c-a5c5-f9b431da9b38';

-- Add trade tags
INSERT INTO trade_tags (
  id,
  trade_id,
  tag
)
SELECT 
  gen_random_uuid(),
  t.id,
  tag
FROM trades t
CROSS JOIN LATERAL (
  SELECT unnest(ARRAY[
    CASE t.symbol
      WHEN 'EURUSD' THEN 'trend_following'
      WHEN 'GBPUSD' THEN 'breakout'
      WHEN 'USDJPY' THEN 'reversal'
      WHEN 'XAUUSD' THEN 'momentum'
    END,
    t.strategy,
    t.timeframe,
    t.symbol
  ]) as tag
) tags
WHERE t.user_id = '41e778bb-75fd-4c9c-a5c5-f9b431da9b38';