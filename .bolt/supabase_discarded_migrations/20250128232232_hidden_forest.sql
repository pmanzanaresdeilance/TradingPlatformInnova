-- Create function to calculate trade metrics
CREATE OR REPLACE FUNCTION calculate_trade_metrics(trade_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO trade_metrics (
    trade_id,
    risk_amount,
    reward_amount
  )
  SELECT
    id,
    CASE
      WHEN stop_loss IS NOT NULL AND entry_price IS NOT NULL
      THEN ABS(entry_price - stop_loss) * lot_size * 100000
      ELSE NULL
    END as risk_amount,
    CASE
      WHEN status = 'closed' AND exit_price IS NOT NULL
      THEN (exit_price - entry_price) * lot_size * 100000 *
        CASE order_type
          WHEN 'buy' THEN 1
          WHEN 'sell' THEN -1
        END
      ELSE NULL
    END as reward_amount
  FROM trades
  WHERE id = trade_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger function for trade metrics
CREATE OR REPLACE FUNCTION update_trade_metrics()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM calculate_trade_metrics(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for trade metrics
CREATE TRIGGER calculate_metrics_on_trade_update
  AFTER INSERT OR UPDATE ON trades
  FOR EACH ROW
  EXECUTE FUNCTION update_trade_metrics();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION calculate_trade_metrics(UUID) TO authenticated;