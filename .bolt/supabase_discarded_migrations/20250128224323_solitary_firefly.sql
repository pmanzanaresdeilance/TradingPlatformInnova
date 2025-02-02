-- Insert demo trading accounts for Wily
INSERT INTO trading_accounts (
  user_id,
  name,
  broker,
  account_number,
  initial_balance,
  current_balance,
  currency,
  leverage
) VALUES
  (
    (SELECT id FROM auth.users WHERE email = 'pmanzanares@deilance.com'),
    'Main Trading Account',
    'IC Markets',
    'MT5-12345678',
    10000.00,
    12500.00,
    'USD',
    100
  ),
  (
    (SELECT id FROM auth.users WHERE email = 'pmanzanares@deilance.com'),
    'Swing Trading',
    'Pepperstone',
    'MT5-87654321',
    5000.00,
    5800.00,
    'USD',
    200
  );

-- Insert demo trades for Wily's accounts
WITH account_ids AS (
  SELECT id, user_id
  FROM trading_accounts
  WHERE user_id = (SELECT id FROM auth.users WHERE email = 'pmanzanares@deilance.com')
  LIMIT 1
)
INSERT INTO trades (
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
  status
)
SELECT
  a.user_id,
  a.id as account_id,
  -- Generate unique ticket numbers
  1000000 + row_number() over () as ticket_number,
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
  status
FROM account_ids a
CROSS JOIN (VALUES
  (
    'EURUSD', 'buy', 1.0, 1.0850, 1.0950, 1.0800, 1.0950, 1000.00, -7.00, -2.00,
    NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days', 'closed'
  ),
  (
    'GBPUSD', 'sell', 0.5, 1.2650, 1.2550, 1.2700, 1.2550, 500.00, -5.00, -1.00,
    NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days', 'closed'
  ),
  (
    'USDJPY', 'buy', 0.8, 147.50, 147.80, 147.20, 148.00, -240.00, -6.00, -1.50,
    NOW() - INTERVAL '1 day', NOW() - INTERVAL '12 hours', 'closed'
  ),
  (
    'XAUUSD', 'buy', 2.0, 2000.00, 2050.00, 1980.00, 2060.00, 10000.00, -15.00, -5.00,
    NOW() - INTERVAL '6 days', NOW() - INTERVAL '5 days', 'closed'
  ),
  (
    'EURUSD', 'sell', 3.0, 1.0950, 1.0850, 1.1000, 1.0800, -3000.00, -20.00, -8.00,
    NOW() - INTERVAL '4 days', NOW() - INTERVAL '3 days', 'closed'
  ),
  (
    'US30', 'buy', 1.5, 35000, 35500, 34800, 35600, 7500.00, -25.00, -10.00,
    NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day', 'closed'
  ),
  (
    'EURUSD', 'buy', 1.0, 1.0880, NULL, 1.0830, 1.0980, NULL, 0, 0,
    NOW() - INTERVAL '6 hours', NULL, 'open'
  ),
  (
    'XAUUSD', 'sell', 1.5, 2040.00, NULL, 2060.00, 2000.00, NULL, 0, 0,
    NOW() - INTERVAL '4 hours', NULL, 'open'
  )
) as t(
  symbol, order_type, lot_size, entry_price, exit_price, stop_loss, take_profit,
  profit_loss, commission, swap, open_time, close_time, status
);