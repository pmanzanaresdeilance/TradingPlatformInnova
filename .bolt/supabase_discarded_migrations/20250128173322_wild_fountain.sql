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

-- Create notification details view
CREATE OR REPLACE VIEW notification_details AS
SELECT 
  n.id,
  n.user_id,
  n.actor_id,
  n.type,
  n.content,
  n.reference_id,
  n.reference_type,
  n.read,
  n.created_at,
  n.updated_at,
  a.raw_user_meta_data->>'username' as actor_username,
  a.raw_user_meta_data->>'avatar_url' as actor_avatar_url
FROM user_notifications n
LEFT JOIN auth.users a ON n.actor_id = a.id;

-- Grant access to the view
GRANT SELECT ON notification_details TO authenticated;

-- Create function to mark notifications as read
CREATE OR REPLACE FUNCTION mark_notification_as_read(notification_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE user_notifications
  SET read = true,
      updated_at = now()
  WHERE id = notification_id
  AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to mark all notifications as read
CREATE OR REPLACE FUNCTION mark_all_notifications_as_read()
RETURNS void AS $$
BEGIN
  UPDATE user_notifications
  SET read = true,
      updated_at = now()
  WHERE user_id = auth.uid()
  AND read = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION mark_notification_as_read(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_all_notifications_as_read() TO authenticated;