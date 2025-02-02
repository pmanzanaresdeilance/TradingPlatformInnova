-- Drop existing function if it exists
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
  WITH trade_stats AS (
    SELECT 
      t.user_id,
      COUNT(*) as trades_count,
      COUNT(*) FILTER (WHERE t.profit_loss > 0)::DECIMAL / NULLIF(COUNT(*), 0) * 100 as win_rate,
      COALESCE(SUM(t.profit_loss), 0) as total_profit,
      ABS(MIN(
        SUM(t.profit_loss) OVER (
          PARTITION BY t.user_id 
          ORDER BY t.close_time
          ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        )
      )) as max_drawdown
    FROM trades t
    WHERE t.status = 'closed'
    AND t.close_time >= start_date
    GROUP BY t.user_id
    HAVING COUNT(*) >= 10  -- Minimum trades requirement
  )
  SELECT 
    ts.user_id,
    u.raw_user_meta_data->>'username',
    u.raw_user_meta_data->>'avatar_url',
    ROUND(
      CASE 
        WHEN ts.max_drawdown = 0 THEN ts.total_profit
        ELSE (ts.total_profit / NULLIF(ts.max_drawdown, 0)) * 100
      END,
      2
    )::DECIMAL as profitability,
    ROUND(ts.max_drawdown, 2)::DECIMAL,
    ts.trades_count::INTEGER,
    ROUND(ts.win_rate, 2)::DECIMAL,
    ROW_NUMBER() OVER (
      ORDER BY 
        CASE 
          WHEN ts.max_drawdown = 0 THEN ts.total_profit
          ELSE (ts.total_profit / NULLIF(ts.max_drawdown, 0)) * 100
        END DESC
    )::INTEGER as rank
  FROM trade_stats ts
  JOIN auth.users u ON ts.user_id = u.id
  ORDER BY profitability DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_trader_rankings(text) TO authenticated;