/*
  # MetaAPI Integration Schema

  1. New Tables
    - `meta_api_accounts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `meta_api_account_id` (text)
      - `name` (text)
      - `login` (text)
      - `server` (text)
      - `platform` (text)
      - `state` (text)
      - `connection_status` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `meta_api_risk_settings`
      - `id` (uuid, primary key)
      - `account_id` (uuid, references meta_api_accounts)
      - `max_drawdown` (numeric)
      - `max_exposure_per_pair` (numeric)
      - `min_equity` (numeric)
      - `margin_call_level` (numeric)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for proper access control
*/

-- Create meta_api_accounts table
CREATE TABLE meta_api_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  meta_api_account_id text NOT NULL,
  name text NOT NULL,
  login text NOT NULL,
  server text NOT NULL,
  platform text NOT NULL CHECK (platform IN ('mt4', 'mt5')),
  state text NOT NULL DEFAULT 'CREATED',
  connection_status text NOT NULL DEFAULT 'DISCONNECTED',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, meta_api_account_id)
);

-- Create meta_api_risk_settings table
CREATE TABLE meta_api_risk_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES meta_api_accounts(id) ON DELETE CASCADE NOT NULL,
  max_drawdown numeric NOT NULL DEFAULT 0.1,
  max_exposure_per_pair numeric NOT NULL DEFAULT 0.05,
  min_equity numeric NOT NULL DEFAULT 100,
  margin_call_level numeric NOT NULL DEFAULT 0.5,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(account_id)
);

-- Create indexes
CREATE INDEX idx_meta_api_accounts_user_id ON meta_api_accounts(user_id);
CREATE INDEX idx_meta_api_accounts_status ON meta_api_accounts(state, connection_status);
CREATE INDEX idx_meta_api_risk_settings_account_id ON meta_api_risk_settings(account_id);

-- Enable RLS
ALTER TABLE meta_api_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE meta_api_risk_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for meta_api_accounts
CREATE POLICY "Users can view their own accounts"
  ON meta_api_accounts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own accounts"
  ON meta_api_accounts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own accounts"
  ON meta_api_accounts
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own accounts"
  ON meta_api_accounts
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create RLS policies for meta_api_risk_settings
CREATE POLICY "Users can view risk settings for their accounts"
  ON meta_api_risk_settings
  FOR SELECT
  USING (
    account_id IN (
      SELECT id FROM meta_api_accounts WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create risk settings for their accounts"
  ON meta_api_risk_settings
  FOR INSERT
  WITH CHECK (
    account_id IN (
      SELECT id FROM meta_api_accounts WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update risk settings for their accounts"
  ON meta_api_risk_settings
  FOR UPDATE
  USING (
    account_id IN (
      SELECT id FROM meta_api_accounts WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    account_id IN (
      SELECT id FROM meta_api_accounts WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete risk settings for their accounts"
  ON meta_api_risk_settings
  FOR DELETE
  USING (
    account_id IN (
      SELECT id FROM meta_api_accounts WHERE user_id = auth.uid()
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_meta_api_accounts_updated_at
  BEFORE UPDATE ON meta_api_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meta_api_risk_settings_updated_at
  BEFORE UPDATE ON meta_api_risk_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();