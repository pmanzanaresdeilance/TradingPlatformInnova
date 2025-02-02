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
      ) as running_balance,
      -- Calculate peak balance up to this point
      MAX(SUM(t.profit_loss) OVER (
        PARTITION BY t.user_id 
        ORDER BY t.close_time
      )) OVER (
        PARTITION BY t.user_id 
        ORDER BY t.close_time
      ) as peak_balance
    FROM trades t
    WHERE t.status = 'closed'
    AND t.close_time >= start_date
  ),
  drawdown_calc AS (
    -- Calculate maximum drawdown for each trader
    SELECT 
      user_id,
      MAX(
        CASE 
          WHEN peak_balance > 0 THEN
            ((peak_balance - running_balance) / peak_balance) * 100
          ELSE 0
        END
      ) as max_drawdown_pct
    FROM closed_trades
    GROUP BY user_id
  ),
  trade_metrics AS (
    -- Calculate metrics per trader
    SELECT 
      ct.user_id,
      COUNT(*) as total_trades,
      COUNT(*) FILTER (WHERE ct.profit_loss > 0) as winning_trades,
      SUM(ct.profit_loss) as total_profit,
      COALESCE(dc.max_drawdown_pct, 0) as max_drawdown
    FROM closed_trades ct
    LEFT JOIN drawdown_calc dc ON ct.user_id = dc.user_id
    GROUP BY ct.user_id, dc.max_drawdown_pct
    HAVING COUNT(*) >= 5  -- Minimum trades requirement
  )
  SELECT 
    tm.user_id,
    u.raw_user_meta_data->>'username',
    u.raw_user_meta_data->>'avatar_url',
    ROUND(
      CASE 
        WHEN tm.max_drawdown <= 0 THEN tm.total_profit
        ELSE (tm.total_profit / (tm.max_drawdown / 100))
      END,
      2
    )::DECIMAL as profitability,
    ROUND(tm.max_drawdown, 2)::DECIMAL,
    tm.total_trades::INTEGER,
    ROUND((tm.winning_trades::DECIMAL / NULLIF(tm.total_trades, 0) * 100), 2) as win_rate,
    ROW_NUMBER() OVER (
      ORDER BY 
        CASE 
          WHEN tm.max_drawdown <= 0 THEN tm.total_profit
          ELSE (tm.total_profit / (tm.max_drawdown / 100))
        END DESC
    )::INTEGER as rank
  FROM trade_metrics tm
  JOIN auth.users u ON tm.user_id = u.id
  WHERE u.raw_user_meta_data->>'username' IS NOT NULL
  ORDER BY profitability DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_trader_rankings(text) TO authenticated;