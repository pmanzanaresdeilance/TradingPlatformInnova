-- Drop existing functions
DROP FUNCTION IF EXISTS get_trader_rankings(text);
DROP FUNCTION IF EXISTS calculate_drawdown(UUID);

-- Function to calculate running balance
CREATE OR REPLACE FUNCTION calculate_running_balance(user_id UUID, start_date TIMESTAMPTZ)
RETURNS TABLE (
  balance DECIMAL,
  trade_date TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    SUM(t.profit_loss) OVER (ORDER BY t.close_time) as balance,
    t.close_time as trade_date
  FROM trades t
  WHERE t.user_id = calculate_running_balance.user_id
  AND t.status = 'closed'
  AND t.close_time >= start_date
  ORDER BY t.close_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate maximum drawdown
CREATE OR REPLACE FUNCTION calculate_max_drawdown(user_id UUID, start_date TIMESTAMPTZ)
RETURNS DECIMAL AS $$
DECLARE
  peak DECIMAL := 0;
  drawdown DECIMAL := 0;
  max_dd DECIMAL := 0;
  balance_record RECORD;
BEGIN
  FOR balance_record IN SELECT * FROM calculate_running_balance(user_id, start_date) LOOP
    -- Update peak if current balance is higher
    IF balance_record.balance > peak THEN
      peak := balance_record.balance;
    END IF;

    -- Calculate current drawdown
    IF peak > 0 THEN
      drawdown := ((peak - balance_record.balance) / peak) * 100;
      -- Update max drawdown if current drawdown is larger
      IF drawdown > max_dd THEN
        max_dd := drawdown;
      END IF;
    END IF;
  END LOOP;

  RETURN max_dd;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate win rate
CREATE OR REPLACE FUNCTION calculate_win_rate(user_id UUID, start_date TIMESTAMPTZ)
RETURNS DECIMAL AS $$
DECLARE
  total_trades INTEGER;
  winning_trades INTEGER;
BEGIN
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE profit_loss > 0)
  INTO total_trades, winning_trades
  FROM trades
  WHERE trades.user_id = calculate_win_rate.user_id
  AND status = 'closed'
  AND close_time >= start_date;

  RETURN CASE 
    WHEN total_trades > 0 THEN
      (winning_trades::DECIMAL / total_trades) * 100
    ELSE 0
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate profitability score
CREATE OR REPLACE FUNCTION calculate_profitability(
  total_profit DECIMAL,
  max_drawdown DECIMAL
)
RETURNS DECIMAL AS $$
BEGIN
  RETURN CASE 
    WHEN max_drawdown <= 0 THEN total_profit
    ELSE (total_profit / (max_drawdown / 100))
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Main function to get trader rankings
CREATE OR REPLACE FUNCTION get_trader_rankings(time_period text)
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  avatar_url TEXT,
  profitability DECIMAL,
  max_drawdown DECIMAL,
  total_trades INTEGER,
  win_rate DECIMAL,
  rank INTEGER
) AS $$
DECLARE
  start_date TIMESTAMPTZ;
BEGIN
  -- Set time period
  start_date := CASE time_period
    WHEN 'week' THEN NOW() - INTERVAL '7 days'
    WHEN 'month' THEN NOW() - INTERVAL '30 days'
    WHEN 'year' THEN NOW() - INTERVAL '365 days'
    ELSE NOW() - INTERVAL '30 days'
  END;

  RETURN QUERY
  WITH trader_metrics AS (
    -- Get basic trade metrics
    SELECT 
      t.user_id,
      COUNT(*) as total_trades,
      SUM(t.profit_loss) as total_profit,
      calculate_max_drawdown(t.user_id, start_date) as max_drawdown,
      calculate_win_rate(t.user_id, start_date) as win_rate
    FROM trades t
    WHERE t.status = 'closed'
    AND t.close_time >= start_date
    GROUP BY t.user_id
    HAVING COUNT(*) >= 5  -- Minimum trades requirement
  )
  SELECT 
    tm.user_id,
    u.raw_user_meta_data->>'username',
    u.raw_user_meta_data->>'avatar_url',
    ROUND(calculate_profitability(tm.total_profit, tm.max_drawdown), 2)::DECIMAL,
    ROUND(tm.max_drawdown, 2)::DECIMAL,
    tm.total_trades::INTEGER,
    ROUND(tm.win_rate, 2)::DECIMAL,
    ROW_NUMBER() OVER (
      ORDER BY calculate_profitability(tm.total_profit, tm.max_drawdown) DESC
    )::INTEGER
  FROM trader_metrics tm
  JOIN auth.users u ON tm.user_id = u.id
  WHERE u.raw_user_meta_data->>'username' IS NOT NULL
  ORDER BY profitability DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION calculate_running_balance(UUID, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_max_drawdown(UUID, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_win_rate(UUID, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_profitability(DECIMAL, DECIMAL) TO authenticated;
GRANT EXECUTE ON FUNCTION get_trader_rankings(text) TO authenticated;