-- Create demo traders if they don't exist
INSERT INTO auth.users (id, email, raw_user_meta_data)
VALUES
  (
    'b8f3c8d2-e7f4-4b5a-9c6d-1a2b3c4d5e6f',
    'john.smith@example.com',
    jsonb_build_object(
      'username', 'JohnSmith',
      'avatar_url', 'https://ui-avatars.com/api/?name=John+Smith&background=7C3AED&color=fff',
      'subscription_tier', 'premium'
    )
  ),
  (
    'c9e4d8f3-g6h5-4i7j-8k9l-2m3n4o5p6q7',
    'emma.wilson@example.com',
    jsonb_build_object(
      'username', 'EmmaWilson',
      'avatar_url', 'https://ui-avatars.com/api/?name=Emma+Wilson&background=7C3AED&color=fff',
      'subscription_tier', 'elite'
    )
  ),
  (
    'd7e8f9g0-h1i2-3j4k-5l6m-7n8o9p0q1r',
    'david.chen@example.com',
    jsonb_build_object(
      'username', 'DavidChen',
      'avatar_url', 'https://ui-avatars.com/api/?name=David+Chen&background=7C3AED&color=fff',
      'subscription_tier', 'premium'
    )
  )
ON CONFLICT (id) DO NOTHING;

-- Insert demo trades for each trader
INSERT INTO trades (
  user_id,
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
VALUES
  -- John Smith (Consistent Trader)
  (
    'b8f3c8d2-e7f4-4b5a-9c6d-1a2b3c4d5e6f',
    5001,
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
    NOW() - INTERVAL '6 days',
    NOW() - INTERVAL '5 days',
    'closed'
  ),
  (
    'b8f3c8d2-e7f4-4b5a-9c6d-1a2b3c4d5e6f',
    5002,
    'GBPUSD',
    'sell',
    0.8,
    1.2700,
    1.2600,
    1.2750,
    1.2600,
    800.00,
    -6.00,
    -1.50,
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '4 days',
    'closed'
  ),
  (
    'b8f3c8d2-e7f4-4b5a-9c6d-1a2b3c4d5e6f',
    5003,
    'USDJPY',
    'buy',
    1.2,
    147.50,
    148.00,
    147.20,
    148.20,
    600.00,
    -8.00,
    -2.50,
    NOW() - INTERVAL '4 days',
    NOW() - INTERVAL '3 days',
    'closed'
  ),
  (
    'b8f3c8d2-e7f4-4b5a-9c6d-1a2b3c4d5e6f',
    5004,
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
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '2 days',
    'closed'
  ),
  (
    'b8f3c8d2-e7f4-4b5a-9c6d-1a2b3c4d5e6f',
    5005,
    'EURUSD',
    'sell',
    1.5,
    1.0950,
    1.0850,
    1.1000,
    1.0800,
    1500.00,
    -9.00,
    -2.50,
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '1 day',
    'closed'
  ),

  -- Emma Wilson (Aggressive Trader)
  (
    'c9e4d8f3-g6h5-4i7j-8k9l-2m3n4o5p6q7',
    6001,
    'XAUUSD',
    'buy',
    2.0,
    2000.00,
    2050.00,
    1980.00,
    2060.00,
    10000.00,
    -15.00,
    -5.00,
    NOW() - INTERVAL '6 days',
    NOW() - INTERVAL '5 days',
    'closed'
  ),
  (
    'c9e4d8f3-g6h5-4i7j-8k9l-2m3n4o5p6q7',
    6002,
    'EURUSD',
    'sell',
    3.0,
    1.0950,
    1.0850,
    1.1000,
    1.0800,
    3000.00,
    -20.00,
    -8.00,
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '4 days',
    'closed'
  ),
  (
    'c9e4d8f3-g6h5-4i7j-8k9l-2m3n4o5p6q7',
    6003,
    'US30',
    'buy',
    1.5,
    35000,
    35500,
    34800,
    35600,
    7500.00,
    -25.00,
    -10.00,
    NOW() - INTERVAL '4 days',
    NOW() - INTERVAL '3 days',
    'closed'
  ),
  (
    'c9e4d8f3-g6h5-4i7j-8k9l-2m3n4o5p6q7',
    6004,
    'GBPUSD',
    'sell',
    2.5,
    1.2700,
    1.2600,
    1.2750,
    1.2550,
    2500.00,
    -18.00,
    -7.00,
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '2 days',
    'closed'
  ),
  (
    'c9e4d8f3-g6h5-4i7j-8k9l-2m3n4o5p6q7',
    6005,
    'USDJPY',
    'buy',
    2.0,
    147.50,
    148.00,
    147.20,
    148.50,
    1000.00,
    -15.00,
    -5.00,
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '1 day',
    'closed'
  ),

  -- David Chen (Conservative Trader)
  (
    'd7e8f9g0-h1i2-3j4k-5l6m-7n8o9p0q1r',
    7001,
    'EURUSD',
    'buy',
    0.5,
    1.0850,
    1.0900,
    1.0830,
    1.0920,
    250.00,
    -4.00,
    -1.00,
    NOW() - INTERVAL '6 days',
    NOW() - INTERVAL '5 days',
    'closed'
  ),
  (
    'd7e8f9g0-h1i2-3j4k-5l6m-7n8o9p0q1r',
    7002,
    'GBPUSD',
    'sell',
    0.3,
    1.2700,
    1.2650,
    1.2730,
    1.2630,
    150.00,
    -3.00,
    -0.75,
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '4 days',
    'closed'
  ),
  (
    'd7e8f9g0-h1i2-3j4k-5l6m-7n8o9p0q1r',
    7003,
    'USDJPY',
    'buy',
    0.4,
    147.00,
    147.50,
    146.80,
    147.80,
    200.00,
    -3.50,
    -1.00,
    NOW() - INTERVAL '4 days',
    NOW() - INTERVAL '3 days',
    'closed'
  ),
  (
    'd7e8f9g0-h1i2-3j4k-5l6m-7n8o9p0q1r',
    7004,
    'XAUUSD',
    'sell',
    0.2,
    2050.00,
    2030.00,
    2070.00,
    2020.00,
    400.00,
    -5.00,
    -1.50,
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '2 days',
    'closed'
  ),
  (
    'd7e8f9g0-h1i2-3j4k-5l6m-7n8o9p0q1r',
    7005,
    'EURUSD',
    'buy',
    0.6,
    1.0880,
    1.0920,
    1.0850,
    1.0950,
    240.00,
    -4.50,
    -1.25,
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '1 day',
    'closed'
  );

-- Insert some open trades
INSERT INTO trades (
  user_id,
  ticket_number,
  symbol,
  order_type,
  lot_size,
  entry_price,
  stop_loss,
  take_profit,
  open_time,
  status
)
VALUES
  (
    'b8f3c8d2-e7f4-4b5a-9c6d-1a2b3c4d5e6f',
    5006,
    'EURUSD',
    'buy',
    1.0,
    1.0880,
    1.0830,
    1.0980,
    NOW() - INTERVAL '6 hours',
    'open'
  ),
  (
    'c9e4d8f3-g6h5-4i7j-8k9l-2m3n4o5p6q7',
    6006,
    'XAUUSD',
    'sell',
    1.5,
    2040.00,
    2060.00,
    2000.00,
    NOW() - INTERVAL '4 hours',
    'open'
  ),
  (
    'd7e8f9g0-h1i2-3j4k-5l6m-7n8o9p0q1r',
    7006,
    'GBPUSD',
    'buy',
    0.4,
    1.2680,
    1.2650,
    1.2730,
    NOW() - INTERVAL '2 hours',
    'open'
  );