/*
  # Fix Message Details View

  1. Changes
    - Drop existing view if exists
    - Create message_details view with proper columns
    - Add indexes for better performance

  2. Security
    - Enable RLS on the view
    - Add appropriate policies
*/

-- Drop existing view if it exists
DROP VIEW IF EXISTS message_details;

-- Create messages table if it doesn't exist (safeguard)
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  room_id uuid REFERENCES chat_rooms(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  edited_at timestamptz,
  recipient_id uuid REFERENCES auth.users(id)
);

-- Create the message_details view
CREATE OR REPLACE VIEW message_details AS
SELECT 
  m.id,
  m.content,
  m.user_id,
  m.room_id,
  m.created_at,
  m.edited_at,
  m.recipient_id,
  u.raw_user_meta_data->>'username' as username,
  u.raw_user_meta_data->>'avatar_url' as avatar_url,
  r.type as room_type,
  r.is_private
FROM messages m
LEFT JOIN auth.users u ON m.user_id = u.id
LEFT JOIN chat_rooms r ON m.room_id = r.id;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_room_id ON messages(room_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for messages
CREATE POLICY "Users can view messages in their rooms"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chat_rooms r
      LEFT JOIN room_members rm ON r.id = rm.room_id
      WHERE r.id = messages.room_id
      AND (
        NOT r.is_private 
        OR r.created_by = auth.uid()
        OR rm.user_id = auth.uid()
      )
    )
    OR recipient_id = auth.uid()
    OR user_id = auth.uid()
  );

-- Update the Support component to handle messages correctly