-- Drop existing function
DROP FUNCTION IF EXISTS get_trader_rankings(text);

-- Create improved trader rankings function with better error handling
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
  WITH closed_trades AS (
    -- Get all closed trades within the time period
    SELECT 
      t.user_id,
      t.profit_loss,
      t.close_time,
      -- Calculate running balance for drawdown
      SUM(t.profit_loss) OVER (
        PARTITION BY t.user_id 
        ORDER BY t.close_time
      ) as running_balance
    FROM trades t
    WHERE t.status = 'closed'
    AND t.close_time >= start_date
  ),
  trade_metrics AS (
    -- Calculate metrics per trader
    SELECT 
      ct.user_id,
      COUNT(*) as total_trades,
      COUNT(*) FILTER (WHERE ct.profit_loss > 0) as winning_trades,
      SUM(ct.profit_loss) as total_profit,
      ABS(MIN(ct.running_balance)) as max_drawdown
    FROM closed_trades ct
    GROUP BY ct.user_id
    HAVING COUNT(*) >= 5  -- Minimum trades requirement
  ),
  trader_stats AS (
    -- Calculate final statistics
    SELECT 
      tm.user_id,
      u.raw_user_meta_data->>'username' as username,
      u.raw_user_meta_data->>'avatar_url' as avatar_url,
      tm.total_trades,
      tm.winning_trades::DECIMAL / NULLIF(tm.total_trades, 0) * 100 as win_rate,
      tm.total_profit,
      CASE 
        WHEN tm.max_drawdown <= 0 THEN 0.01  -- Avoid division by zero
        ELSE tm.max_drawdown
      END as max_drawdown
    FROM trade_metrics tm
    JOIN auth.users u ON tm.user_id = u.id
  )
  SELECT 
    ts.user_id,
    ts.username,
    ts.avatar_url,
    ROUND((ts.total_profit / ts.max_drawdown * 100)::DECIMAL, 2) as profitability,
    ROUND(ts.max_drawdown::DECIMAL, 2) as max_drawdown,
    ts.total_trades::INTEGER,
    ROUND(ts.win_rate::DECIMAL, 2) as win_rate,
    ROW_NUMBER() OVER (
      ORDER BY (ts.total_profit / ts.max_drawdown) DESC
    )::INTEGER as rank
  FROM trader_stats ts
  WHERE ts.username IS NOT NULL  -- Ensure we have valid users
  ORDER BY profitability DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_trader_rankings(text) TO authenticated;