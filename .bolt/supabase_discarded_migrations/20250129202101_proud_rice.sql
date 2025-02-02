/*
  # Add channels and private messages support
  
  1. New Tables
    - channels table for group chats
    - channel_members for managing channel participants
    - private_messages for direct messages between users
  
  2. Security
    - Enable RLS on all tables
    - Policies for proper access control
    
  3. Views
    - Enhanced message details view with channel information
*/

-- Create channels table
CREATE TABLE IF NOT EXISTS channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  is_private boolean DEFAULT false,
  created_by uuid REFERENCES auth.users NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create channel members table
CREATE TABLE IF NOT EXISTS channel_members (
  channel_id uuid REFERENCES channels ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  role text DEFAULT 'member',
  joined_at timestamptz DEFAULT now(),
  PRIMARY KEY (channel_id, user_id)
);

-- Add channel_id to messages table
ALTER TABLE messages ADD COLUMN IF NOT EXISTS channel_id uuid REFERENCES channels ON DELETE CASCADE;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS recipient_id uuid REFERENCES auth.users;

-- Add constraint to ensure message is either in a channel or private
ALTER TABLE messages ADD CONSTRAINT message_target_check 
  CHECK ((channel_id IS NOT NULL AND recipient_id IS NULL) OR 
         (channel_id IS NULL AND recipient_id IS NOT NULL AND room_id = 'private'));

-- Enable RLS
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_members ENABLE ROW LEVEL SECURITY;

-- Channel policies
CREATE POLICY "Anyone can view public channels"
  ON channels
  FOR SELECT
  USING (NOT is_private OR EXISTS (
    SELECT 1 FROM channel_members 
    WHERE channel_id = channels.id AND user_id = auth.uid()
  ));

CREATE POLICY "Authenticated users can create channels"
  ON channels
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Channel creators can update their channels"
  ON channels
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Channel creators can delete their channels"
  ON channels
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Channel members policies
CREATE POLICY "Members can view channel members"
  ON channel_members
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM channel_members 
    WHERE channel_id = channel_members.channel_id 
    AND user_id = auth.uid()
  ));

CREATE POLICY "Channel creators can manage members"
  ON channel_members
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM channels 
    WHERE id = channel_members.channel_id 
    AND created_by = auth.uid()
  ));

-- Update message policies for channels and private messages
DROP POLICY IF EXISTS "Anyone can read messages" ON messages;
CREATE POLICY "Users can read channel messages"
  ON messages
  FOR SELECT
  USING (
    (channel_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM channel_members 
      WHERE channel_id = messages.channel_id 
      AND user_id = auth.uid()
    )) OR
    (recipient_id = auth.uid() OR user_id = auth.uid())
  );

-- Update message details view
DROP VIEW IF EXISTS message_details;
CREATE VIEW message_details AS
SELECT 
  m.*,
  u.raw_user_meta_data->>'username' as username,
  u.raw_user_meta_data->>'avatar_url' as avatar_url,
  c.name as channel_name,
  c.is_private as channel_is_private,
  CASE 
    WHEN m.recipient_id IS NOT NULL THEN 'private'
    ELSE 'channel'
  END as message_type
FROM messages m
LEFT JOIN auth.users u ON m.user_id = u.id
LEFT JOIN channels c ON m.channel_id = c.id;

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE channels;
ALTER PUBLICATION supabase_realtime ADD TABLE channel_members;