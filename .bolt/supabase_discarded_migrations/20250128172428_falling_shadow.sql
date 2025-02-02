-- Drop existing views if they exist
DROP VIEW IF EXISTS notification_details;
DROP VIEW IF EXISTS user_metadata;

-- Create view for user metadata
CREATE OR REPLACE VIEW user_metadata AS
SELECT 
  id,
  raw_user_meta_data->>'username' as username,
  raw_user_meta_data->>'avatar_url' as avatar_url
FROM auth.users;

-- Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (
    type IN (
      'follow',
      'like_post',
      'comment_post',
      'mention',
      'trade_shared',
      'class_reminder',
      'class_cancelled',
      'recording_available',
      'achievement'
    )
  ),
  content TEXT NOT NULL,
  reference_id UUID,
  reference_type TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create view for notifications with actor details
CREATE OR REPLACE VIEW notification_details AS
SELECT 
  n.*,
  a.username as actor_username,
  a.avatar_url as actor_avatar_url
FROM user_notifications n
LEFT JOIN user_metadata a ON n.actor_id = a.id;

-- Enable RLS
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can read their own notifications"
  ON user_notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON user_notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_actor_id ON user_notifications(actor_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_created_at ON user_notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_user_notifications_read ON user_notifications(read);

-- Add updated_at trigger
DROP TRIGGER IF EXISTS update_user_notifications_updated_at ON user_notifications;
CREATE TRIGGER update_user_notifications_updated_at
  BEFORE UPDATE ON user_notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT SELECT ON user_metadata TO authenticated;
GRANT SELECT ON notification_details TO authenticated;

-- Insert sample notifications
INSERT INTO user_notifications (user_id, actor_id, type, content)
SELECT 
  id as user_id,
  'e9b6c8a1-d7f2-4b3c-9e4d-8f5a6c2b3d1e' as actor_id,
  'follow' as type,
  'started following you' as content
FROM auth.users
WHERE id = 'd7bed82c-5f89-4a4e-a5f9-7f1e0b860786'
ON CONFLICT DO NOTHING;

INSERT INTO user_notifications (user_id, actor_id, type, content)
SELECT
  id as user_id,
  'a1b2c3d4-e5f6-4a5b-8c9d-1a2b3c4d5e6f' as actor_id,
  'like_post' as type,
  'liked your post about EURUSD analysis' as content
FROM auth.users
WHERE id = 'd7bed82c-5f89-4a4e-a5f9-7f1e0b860786'
ON CONFLICT DO NOTHING;