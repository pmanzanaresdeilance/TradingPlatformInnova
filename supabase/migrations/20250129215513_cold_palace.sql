/*
  # Fix Messages Table and View

  1. Changes
    - Drop existing view and table
    - Create messages table with proper foreign key relationships
    - Create message_details view
    - Add proper indexes and RLS policies

  2. Security
    - Enable RLS
    - Add policies for message access based on user_id and room_id
*/

-- Drop existing objects
DROP VIEW IF EXISTS message_details CASCADE;
DROP TABLE IF EXISTS messages CASCADE;

-- Create messages table with proper relationships
CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  room_id uuid NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  recipient_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  edited_at timestamptz
);

-- Create indexes
CREATE INDEX idx_messages_user_id ON messages(user_id);
CREATE INDEX idx_messages_room_id ON messages(room_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_messages_recipient_id ON messages(recipient_id);

-- Create view for message details
CREATE VIEW message_details AS
SELECT 
  m.id,
  m.content,
  m.user_id,
  m.room_id,
  m.recipient_id,
  m.created_at,
  m.edited_at,
  u.raw_user_meta_data->>'username' as username,
  u.raw_user_meta_data->>'avatar_url' as avatar_url,
  r.type as room_type,
  r.is_private
FROM messages m
JOIN auth.users u ON m.user_id = u.id
JOIN chat_rooms r ON m.room_id = r.id;

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view messages in their rooms"
  ON messages FOR SELECT
  USING (
    room_id IN (
      SELECT id FROM chat_rooms 
      WHERE NOT is_private 
      OR created_by = auth.uid()
    )
    OR recipient_id = auth.uid()
    OR user_id = auth.uid()
  );

CREATE POLICY "Users can insert their own messages"
  ON messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own messages"
  ON messages FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages"
  ON messages FOR DELETE
  USING (auth.uid() = user_id);