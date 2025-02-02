-- Drop existing function
DROP FUNCTION IF EXISTS get_account_statistics(UUID);

-- Create improved account statistics function
CREATE OR REPLACE FUNCTION get_account_statistics(p_account_id UUID)
RETURNS JSON AS $$
DECLARE
  account_stats JSON;
BEGIN
  WITH trade_stats AS (
    SELECT
      COUNT(*) as total_trades,
      COUNT(*) FILTER (WHERE t.profit_loss > 0) as winning_trades,
      COALESCE(SUM(t.profit_loss), 0) as total_profit,
      calculate_account_drawdown(p_account_id) as max_drawdown,
      COALESCE(
        SUM(CASE WHEN t.profit_loss > 0 THEN t.profit_loss ELSE 0 END) /
        NULLIF(ABS(SUM(CASE WHEN t.profit_loss < 0 THEN t.profit_loss ELSE 0 END)), 0),
        0
      ) as profit_factor
    FROM trades t
    WHERE t.account_id = p_account_id
    AND t.status = 'closed'
  )
  SELECT json_build_object(
    'total_trades', total_trades,
    'win_rate', CASE 
      WHEN total_trades > 0 THEN 
        ROUND((winning_trades::DECIMAL / total_trades * 100)::DECIMAL, 2)
      ELSE 0
    END,
    'total_profit', total_profit,
    'max_drawdown', ROUND(max_drawdown::DECIMAL, 2),
    'profit_factor', ROUND(profit_factor::DECIMAL, 2)
  )
  INTO account_stats
  FROM trade_stats;

  RETURN account_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_account_statistics(UUID) TO authenticated;