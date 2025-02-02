-- Drop existing function
DROP FUNCTION IF EXISTS get_trader_rankings(text);

-- Create improved trader rankings function
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
  WITH trade_metrics AS (
    -- Calculate basic metrics per trader
    SELECT 
      t.user_id,
      COUNT(*) as total_trades,
      COUNT(*) FILTER (WHERE t.profit_loss > 0) as winning_trades,
      SUM(t.profit_loss) as total_profit,
      MIN(
        SUM(t.profit_loss) OVER (
          PARTITION BY t.user_id 
          ORDER BY t.close_time
          ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        )
      ) as max_drawdown_amount
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
    ROUND(
      CASE 
        WHEN ABS(tm.max_drawdown_amount) <= 0 THEN tm.total_profit
        ELSE (tm.total_profit / ABS(tm.max_drawdown_amount)) * 100
      END,
      2
    )::DECIMAL as profitability,
    ROUND(ABS(tm.max_drawdown_amount), 2)::DECIMAL,
    tm.total_trades::INTEGER,
    ROUND((tm.winning_trades::DECIMAL / NULLIF(tm.total_trades, 0) * 100), 2) as win_rate,
    ROW_NUMBER() OVER (
      ORDER BY 
        CASE 
          WHEN ABS(tm.max_drawdown_amount) <= 0 THEN tm.total_profit
          ELSE (tm.total_profit / ABS(tm.max_drawdown_amount)) * 100
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