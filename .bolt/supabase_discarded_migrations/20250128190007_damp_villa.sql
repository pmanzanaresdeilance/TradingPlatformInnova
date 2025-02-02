-- Calculate initial metrics for existing trades
INSERT INTO trader_metrics (
  user_id,
  total_trades,
  winning_trades,
  total_profit,
  max_drawdown,
  current_balance,
  last_calculated_at
)
SELECT
  t.user_id,
  COUNT(*),
  COUNT(*) FILTER (WHERE profit_loss > 0),
  COALESCE(SUM(profit_loss), 0),
  calculate_drawdown(t.user_id),
  COALESCE(SUM(profit_loss), 0),
  now()
FROM trades t
WHERE t.status = 'closed'
GROUP BY t.user_id
ON CONFLICT (user_id) DO UPDATE
SET
  total_trades = EXCLUDED.total_trades,
  winning_trades = EXCLUDED.winning_trades,
  total_profit = EXCLUDED.total_profit,
  max_drawdown = EXCLUDED.max_drawdown,
  current_balance = EXCLUDED.current_balance,
  last_calculated_at = EXCLUDED.last_calculated_at,
  updated_at = now();

-- Drop and recreate the trigger to ensure it's working
DROP TRIGGER IF EXISTS update_trader_metrics_trigger ON trades;

CREATE TRIGGER update_trader_metrics_trigger
  AFTER INSERT OR UPDATE OF status, profit_loss ON trades
  FOR EACH ROW
  WHEN (NEW.status = 'closed')
  EXECUTE FUNCTION update_trader_metrics();