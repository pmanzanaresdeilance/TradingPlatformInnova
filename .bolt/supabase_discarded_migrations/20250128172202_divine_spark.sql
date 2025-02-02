-- Create notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  notify_on_follow BOOLEAN DEFAULT true,
  notify_on_like BOOLEAN DEFAULT true,
  notify_on_comment BOOLEAN DEFAULT true,
  notify_on_mention BOOLEAN DEFAULT true,
  notify_on_trade_share BOOLEAN DEFAULT true,
  notify_on_class_reminder BOOLEAN DEFAULT true,
  notify_on_achievement BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notification preferences
CREATE POLICY "Users can manage their notification preferences"
  ON notification_preferences
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to initialize notification preferences
CREATE OR REPLACE FUNCTION initialize_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to initialize preferences for new users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION initialize_notification_preferences();

-- Function to check notification preferences
CREATE OR REPLACE FUNCTION should_notify(
  user_id UUID,
  notification_type TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  preferences RECORD;
BEGIN
  SELECT * INTO preferences
  FROM notification_preferences
  WHERE notification_preferences.user_id = should_notify.user_id;

  IF NOT FOUND THEN
    RETURN true; -- Default to true if no preferences set
  END IF;

  RETURN CASE notification_type
    WHEN 'follow' THEN preferences.notify_on_follow
    WHEN 'like_post' THEN preferences.notify_on_like
    WHEN 'comment_post' THEN preferences.notify_on_comment
    WHEN 'mention' THEN preferences.notify_on_mention
    WHEN 'trade_shared' THEN preferences.notify_on_trade_share
    WHEN 'class_reminder' THEN preferences.notify_on_class_reminder
    WHEN 'achievement' THEN preferences.notify_on_achievement
    ELSE true
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO count
  FROM user_notifications
  WHERE user_notifications.user_id = get_unread_notification_count.user_id
  AND read = false;
  
  RETURN count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark notifications as read
CREATE OR REPLACE FUNCTION mark_notifications_as_read(
  p_user_id UUID,
  p_notification_ids UUID[] DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  IF p_notification_ids IS NULL THEN
    -- Mark all notifications as read
    UPDATE user_notifications
    SET read = true
    WHERE user_id = p_user_id
    AND read = false;
  ELSE
    -- Mark specific notifications as read
    UPDATE user_notifications
    SET read = true
    WHERE user_id = p_user_id
    AND id = ANY(p_notification_ids)
    AND read = false;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get follower stats
CREATE OR REPLACE FUNCTION get_follower_stats(user_id UUID)
RETURNS json AS $$
DECLARE
  follower_count INTEGER;
  following_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO follower_count
  FROM user_followers
  WHERE following_id = user_id;

  SELECT COUNT(*) INTO following_count
  FROM user_followers
  WHERE follower_id = user_id;

  RETURN json_build_object(
    'followers', follower_count,
    'following', following_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION should_notify(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_notification_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_notifications_as_read(UUID, UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION get_follower_stats(UUID) TO authenticated;