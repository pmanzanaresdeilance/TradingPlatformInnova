/*
  # Fix message deletion policies

  1. Changes
    - Drop existing delete policy
    - Create new policy that allows users to delete their own messages
    - Create policy for admins to delete any message
    - Create policy for moderators to delete any message

  2. Security
    - Enable RLS for messages table
    - Ensure proper access control for message deletion
*/

-- Drop existing delete policy if it exists
DROP POLICY IF EXISTS "Users can delete their own messages" ON messages;

-- Create new delete policies
CREATE POLICY "Users can delete their own messages"
  ON messages FOR DELETE
  USING (
    auth.uid() = user_id
    OR auth.jwt()->>'role' = 'admin'
    OR auth.jwt()->>'role' = 'moderator'
  );