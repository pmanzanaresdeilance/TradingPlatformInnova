-- Create trading accounts table
CREATE TABLE IF NOT EXISTS trading_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  broker TEXT NOT NULL,
  account_number TEXT NOT NULL,
  initial_balance DECIMAL NOT NULL,
  current_balance DECIMAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  leverage INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, account_number)
);

-- Enable RLS
ALTER TABLE trading_accounts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their trading accounts"
  ON trading_accounts
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Add account_id to trades table if it doesn't exist
ALTER TABLE trades
ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES trading_accounts(id) ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_trades_account_id ON trades(account_id);

-- Function to update account balance
CREATE OR REPLACE FUNCTION update_account_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Update account balance when trade is closed
    IF NEW.status = 'closed' THEN
      UPDATE trading_accounts
      SET current_balance = current_balance + NEW.profit_loss,
          updated_at = now()
      WHERE id = NEW.account_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for balance updates
CREATE TRIGGER update_account_balance_trigger
  AFTER INSERT OR UPDATE OF status, profit_loss ON trades
  FOR EACH ROW
  EXECUTE FUNCTION update_account_balance();

-- Function to calculate account drawdown
CREATE OR REPLACE FUNCTION calculate_account_drawdown(account_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  initial_balance DECIMAL;
  peak_balance DECIMAL;
  current_drawdown DECIMAL;
  max_drawdown DECIMAL := 0;
  trade RECORD;
BEGIN
  -- Get initial balance
  SELECT initial_balance INTO initial_balance
  FROM trading_accounts
  WHERE id = calculate_account_drawdown.account_id;

  -- Start with initial balance as peak
  peak_balance := initial_balance;

  -- Calculate running balance and track max drawdown
  FOR trade IN (
    SELECT profit_loss
    FROM trades
    WHERE trades.account_id = calculate_account_drawdown.account_id
    AND status = 'closed'
    ORDER BY close_time ASC
  ) LOOP
    initial_balance := initial_balance + trade.profit_loss;
    
    -- Update peak if current balance is higher
    IF initial_balance > peak_balance THEN
      peak_balance := initial_balance;
    END IF;

    -- Calculate current drawdown as percentage
    IF peak_balance > 0 THEN
      current_drawdown := ((peak_balance - initial_balance) / peak_balance) * 100;
      -- Update max drawdown if current drawdown is larger
      IF current_drawdown > max_drawdown THEN
        max_drawdown := current_drawdown;
      END IF;
    END IF;
  END LOOP;

  RETURN max_drawdown;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get account statistics
CREATE OR REPLACE FUNCTION get_account_statistics(account_id UUID)
RETURNS JSON AS $$
DECLARE
  account_stats JSON;
BEGIN
  WITH trade_stats AS (
    SELECT
      COUNT(*) as total_trades,
      COUNT(*) FILTER (WHERE profit_loss > 0) as winning_trades,
      COALESCE(SUM(profit_loss), 0) as total_profit,
      calculate_account_drawdown(account_id) as max_drawdown
    FROM trades
    WHERE trades.account_id = get_account_statistics.account_id
    AND status = 'closed'
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
    'profit_factor', CASE 
      WHEN ABS(SUM(CASE WHEN profit_loss < 0 THEN profit_loss ELSE 0 END)) > 0 THEN
        ROUND((SUM(CASE WHEN profit_loss > 0 THEN profit_loss ELSE 0 END) / 
        ABS(SUM(CASE WHEN profit_loss < 0 THEN profit_loss ELSE 0 END)))::DECIMAL, 2)
      ELSE 0
    END
  )
  INTO account_stats
  FROM trade_stats;

  RETURN account_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION calculate_account_drawdown(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_account_statistics(UUID) TO authenticated;

-- Insert sample trading accounts
INSERT INTO trading_accounts (
  user_id,
  name,
  broker,
  account_number,
  initial_balance,
  current_balance,
  currency,
  leverage
) VALUES
  (
    'd7bed82c-5f89-4a4e-a5f9-7f1e0b860786',
    'Main Trading Account',
    'IC Markets',
    '12345678',
    10000.00,
    10000.00,
    'USD',
    100
  ),
  (
    'e9b6c8a1-d7f2-4b3c-9e4d-8f5a6c2b3d1e',
    'Demo Account',
    'FTMO',
    '87654321',
    100000.00,
    100000.00,
    'USD',
    100
  )
ON CONFLICT DO NOTHING;