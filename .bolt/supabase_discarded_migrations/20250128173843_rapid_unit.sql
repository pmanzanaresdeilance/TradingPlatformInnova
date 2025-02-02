-- Drop existing objects if they exist
DROP VIEW IF EXISTS notification_details;
DROP FUNCTION IF EXISTS mark_notification_as_read(UUID);
DROP FUNCTION IF EXISTS mark_all_notifications_as_read();

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