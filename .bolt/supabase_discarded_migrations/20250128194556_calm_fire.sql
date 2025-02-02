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