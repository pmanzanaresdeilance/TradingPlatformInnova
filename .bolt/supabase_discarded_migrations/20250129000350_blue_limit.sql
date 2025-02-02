-- Drop existing function
DROP FUNCTION IF EXISTS get_accounts_statistics(UUID[]);

-- Create updated function with proper column qualification
CREATE OR REPLACE FUNCTION get_accounts_statistics(account_ids UUID[])
RETURNS TABLE (
  account_id UUID,
  total_trades INTEGER,
  win_rate DECIMAL,
  profit_factor DECIMAL,
  max_drawdown DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  WITH trade_stats AS (
    SELECT 
      t.account_id,
      COUNT(*) as total_trades,
      COUNT(*) FILTER (WHERE t.profit_loss > 0)::DECIMAL / NULLIF(COUNT(*), 0) * 100 as win_rate,
      COALESCE(SUM(CASE WHEN t.profit_loss > 0 THEN t.profit_loss ELSE 0 END), 0) as total_wins,
      COALESCE(ABS(SUM(CASE WHEN t.profit_loss < 0 THEN t.profit_loss ELSE 0 END)), 0) as total_losses,
      COALESCE(SUM(t.profit_loss), 0) as total_profit
    FROM trades t
    WHERE t.account_id = ANY(account_ids)
    AND t.status = 'closed'
    GROUP BY t.account_id
  ),
  balance_history AS (
    SELECT 
      t.account_id,
      t.open_time,
      ta.initial_balance + SUM(t.profit_loss) OVER (
        PARTITION BY t.account_id ORDER BY t.open_time
      ) as running_balance,
      ta.initial_balance as starting_balance
    FROM trades t
    JOIN trading_accounts ta ON t.account_id = ta.id
    WHERE t.account_id = ANY(account_ids)
    AND t.status = 'closed'
  ),
  drawdown_calc AS (
    SELECT 
      bh.account_id,
      CASE 
        WHEN bh.starting_balance > 0 THEN
          100 * (bh.starting_balance - bh.running_balance) / bh.starting_balance
        ELSE 0
      END as drawdown
    FROM balance_history bh
  )
  SELECT 
    ts.account_id,
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
    COALESCE(ROUND(GREATEST(MAX(dc.drawdown), 0), 2), 0) as max_drawdown
  FROM trade_stats ts
  LEFT JOIN drawdown_calc dc ON ts.account_id = dc.account_id
  GROUP BY ts.account_id, ts.total_trades, ts.win_rate, ts.total_wins, ts.total_losses;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_accounts_statistics(UUID[]) TO authenticated;