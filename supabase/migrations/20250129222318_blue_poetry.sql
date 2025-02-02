/*
  # Enable real-time functionality for chat

  1. Changes
    - Enable real-time for messages table
    - Enable real-time for chat_rooms table
    - Add publication for real-time changes
*/

-- Enable real-time for required tables
ALTER TABLE messages REPLICA IDENTITY FULL;
ALTER TABLE chat_rooms REPLICA IDENTITY FULL;

-- Create publication for real-time changes
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE messages, chat_rooms;