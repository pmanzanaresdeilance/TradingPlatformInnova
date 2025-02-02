-- Function to get account statistics
CREATE OR REPLACE FUNCTION get_account_statistics(account_id UUID)
RETURNS TABLE (
  total_trades INTEGER,
  win_rate DECIMAL,
  profit_factor DECIMAL,
  max_drawdown DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  WITH trade_stats AS (
    SELECT 
      COUNT(*) as total_trades,
      COUNT(*) FILTER (WHERE profit_loss > 0)::DECIMAL / NULLIF(COUNT(*), 0) * 100 as win_rate,
      COALESCE(SUM(CASE WHEN profit_loss > 0 THEN profit_loss ELSE 0 END), 0) as total_wins,
      COALESCE(ABS(SUM(CASE WHEN profit_loss < 0 THEN profit_loss ELSE 0 END)), 0) as total_losses,
      COALESCE(SUM(profit_loss), 0) as total_profit
    FROM trades
    WHERE account_id = get_account_statistics.account_id
    AND status = 'closed'
  ),
  drawdown_calc AS (
    SELECT 
      100 * (MAX(running_balance) OVER (ORDER BY open_time) - running_balance) 
      / NULLIF(MAX(running_balance) OVER (ORDER BY open_time), 0) as drawdown
    FROM (
      SELECT 
        open_time,
        SUM(profit_loss) OVER (ORDER BY open_time) as running_balance
      FROM trades
      WHERE account_id = get_account_statistics.account_id
      AND status = 'closed'
    ) balance_history
  )
  SELECT 
    ts.total_trades::INTEGER,
    ROUND(ts.win_rate, 2),
    CASE 
      WHEN ts.total_losses = 0 THEN 
        CASE 
          WHEN ts.total_wins > 0 THEN 999.99
          ELSE 0
        END
      ELSE ROUND((ts.total_wins / ts.total_losses)::DECIMAL, 2)
    END as profit_factor,
    COALESCE(ROUND(MAX(dc.drawdown), 2), 0) as max_drawdown
  FROM trade_stats ts
  CROSS JOIN drawdown_calc dc;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_account_statistics(UUID) TO authenticated;