-- Add account_id to trade_metrics table
ALTER TABLE trade_metrics
ADD COLUMN account_id UUID REFERENCES trading_accounts(id) ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_trade_metrics_account_id ON trade_metrics(account_id);

-- Update RLS policy to include account-based access
CREATE POLICY "Users can view trade metrics for their accounts"
  ON trade_metrics
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trading_accounts
      WHERE trading_accounts.id = trade_metrics.account_id
      AND trading_accounts.user_id = auth.uid()
    )
  );

-- Function to calculate account metrics
CREATE OR REPLACE FUNCTION calculate_account_metrics(p_account_id UUID)
RETURNS void AS $$
DECLARE
  v_trade RECORD;
  v_peak_balance DECIMAL := 0;
  v_current_balance DECIMAL := 0;
  v_max_drawdown DECIMAL := 0;
  v_initial_balance DECIMAL;
BEGIN
  -- Get account's initial balance
  SELECT initial_balance INTO v_initial_balance
  FROM trading_accounts
  WHERE id = p_account_id;

  v_current_balance := v_initial_balance;
  v_peak_balance := v_initial_balance;

  -- Process each trade chronologically
  FOR v_trade IN (
    SELECT profit_loss, open_time
    FROM trades
    WHERE account_id = p_account_id
    AND status = 'closed'
    ORDER BY open_time ASC
  ) LOOP
    -- Update current balance
    v_current_balance := v_current_balance + COALESCE(v_trade.profit_loss, 0);
    
    -- Update peak balance if current balance is higher
    IF v_current_balance > v_peak_balance THEN
      v_peak_balance := v_current_balance;
    END IF;

    -- Calculate drawdown and update max drawdown if needed
    IF v_peak_balance > 0 THEN
      v_max_drawdown := GREATEST(
        v_max_drawdown,
        ((v_peak_balance - v_current_balance) / v_peak_balance) * 100
      );
    END IF;
  END LOOP;

  -- Update or insert metrics
  INSERT INTO trade_metrics (
    account_id,
    risk_amount,
    reward_amount,
    max_drawdown
  ) VALUES (
    p_account_id,
    v_initial_balance * 0.02, -- Default 2% risk per trade
    v_current_balance - v_initial_balance,
    v_max_drawdown
  )
  ON CONFLICT (account_id) DO UPDATE
  SET
    reward_amount = EXCLUDED.reward_amount,
    max_drawdown = EXCLUDED.max_drawdown,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update metrics when trades change
CREATE OR REPLACE FUNCTION update_account_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate metrics for the affected account
  PERFORM calculate_account_metrics(NEW.account_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on trades table
CREATE TRIGGER update_account_metrics_trigger
  AFTER INSERT OR UPDATE OF status, profit_loss ON trades
  FOR EACH ROW
  WHEN (NEW.status = 'closed')
  EXECUTE FUNCTION update_account_metrics();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION calculate_account_metrics(UUID) TO authenticated;

-- Calculate initial metrics for existing accounts
DO $$
DECLARE
  v_account RECORD;
BEGIN
  FOR v_account IN (SELECT id FROM trading_accounts) LOOP
    PERFORM calculate_account_metrics(v_account.id);
  END LOOP;
END $$;