/*
  # Add unique constraint to meta_api_accounts

  1. Changes
    - Add unique constraint on meta_api_account_id column
    - Add index for faster lookups

  2. Security
    - No changes to RLS policies
*/

-- Add unique constraint to meta_api_account_id
ALTER TABLE meta_api_accounts
ADD CONSTRAINT meta_api_accounts_meta_api_account_id_key UNIQUE (meta_api_account_id);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_meta_api_accounts_meta_api_account_id 
ON meta_api_accounts(meta_api_account_id);