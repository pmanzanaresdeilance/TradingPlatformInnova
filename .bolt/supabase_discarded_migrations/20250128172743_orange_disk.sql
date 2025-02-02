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

-- Create view for notifications with actor details
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
  a.username as actor_username,
  a.avatar_url as actor_avatar_url
FROM user_notifications n
LEFT JOIN auth.users a ON n.actor_id = a.id;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read notification details" ON notification_details;

-- Create RLS policies for notification details view
ALTER VIEW notification_details OWNER TO authenticated;

-- Grant necessary permissions
GRANT SELECT ON notification_details TO authenticated;
GRANT SELECT ON user_metadata TO authenticated;
GRANT UPDATE ON user_notifications TO authenticated;

-- Ensure RLS is enabled
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

-- Recreate RLS policies for user_notifications
DROP POLICY IF EXISTS "Users can read their own notifications" ON user_notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON user_notifications;

CREATE POLICY "Users can read their own notifications"
  ON user_notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON user_notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create function to get notifications
CREATE OR REPLACE FUNCTION get_user_notifications(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  actor_id UUID,
  type TEXT,
  content TEXT,
  reference_id UUID,
  reference_type TEXT,
  read BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  actor_username TEXT,
  actor_avatar_url TEXT
) AS $$
BEGIN
  RETURN QUERY
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
  LEFT JOIN auth.users a ON n.actor_id = a.id
  WHERE n.user_id = p_user_id
  ORDER BY n.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_notifications(UUID) TO authenticated;