-- User Followers Table
CREATE TABLE IF NOT EXISTS user_followers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

-- User Notifications Table
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
  reference_id UUID, -- Can reference a post, comment, trade, etc.
  reference_type TEXT, -- Type of the referenced content (post, comment, trade, etc.)
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for followers
CREATE POLICY "Anyone can read followers"
  ON user_followers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage their follows"
  ON user_followers
  FOR ALL
  TO authenticated
  USING (auth.uid() = follower_id);

-- RLS Policies for notifications
CREATE POLICY "Users can read their own notifications"
  ON user_notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Function to create notification
CREATE OR REPLACE FUNCTION create_user_notification(
  p_user_id UUID,
  p_actor_id UUID,
  p_type TEXT,
  p_content TEXT,
  p_reference_id UUID DEFAULT NULL,
  p_reference_type TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO user_notifications (
    user_id,
    actor_id,
    type,
    content,
    reference_id,
    reference_type
  )
  VALUES (
    p_user_id,
    p_actor_id,
    p_type,
    p_content,
    p_reference_id,
    p_reference_type
  )
  RETURNING id INTO notification_id;

  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle follow notifications
CREATE OR REPLACE FUNCTION handle_follow_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Create notification for the user being followed
  PERFORM create_user_notification(
    NEW.following_id,
    NEW.follower_id,
    'follow',
    (
      SELECT raw_user_meta_data->>'username' 
      FROM auth.users 
      WHERE id = NEW.follower_id
    ) || ' started following you'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle post like notifications
CREATE OR REPLACE FUNCTION handle_post_like_notification()
RETURNS TRIGGER AS $$
DECLARE
  post_author_id UUID;
BEGIN
  -- Get post author
  SELECT user_id INTO post_author_id
  FROM community_posts
  WHERE id = NEW.post_id;

  -- Don't notify if user likes their own post
  IF post_author_id != NEW.user_id THEN
    PERFORM create_user_notification(
      post_author_id,
      NEW.user_id,
      'like_post',
      (
        SELECT raw_user_meta_data->>'username' 
        FROM auth.users 
        WHERE id = NEW.user_id
      ) || ' liked your post',
      NEW.post_id,
      'post'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle post comment notifications
CREATE OR REPLACE FUNCTION handle_post_comment_notification()
RETURNS TRIGGER AS $$
DECLARE
  post_author_id UUID;
BEGIN
  -- Get post author
  SELECT user_id INTO post_author_id
  FROM community_posts
  WHERE id = NEW.post_id;

  -- Don't notify if user comments on their own post
  IF post_author_id != NEW.user_id THEN
    PERFORM create_user_notification(
      post_author_id,
      NEW.user_id,
      'comment_post',
      (
        SELECT raw_user_meta_data->>'username' 
        FROM auth.users 
        WHERE id = NEW.user_id
      ) || ' commented on your post',
      NEW.post_id,
      'post'
    );
  END IF;

  -- Handle mentions in comment
  FOR mentioned_username IN
    SELECT DISTINCT substring(mention from 2)
    FROM regexp_matches(NEW.content, '@([A-Za-z0-9_]+)', 'g') as mention
  LOOP
    PERFORM create_user_notification(
      (
        SELECT id FROM auth.users
        WHERE raw_user_meta_data->>'username' = mentioned_username
        LIMIT 1
      ),
      NEW.user_id,
      'mention',
      (
        SELECT raw_user_meta_data->>'username' 
        FROM auth.users 
        WHERE id = NEW.user_id
      ) || ' mentioned you in a comment',
      NEW.id,
      'comment'
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
CREATE TRIGGER on_follow
  AFTER INSERT ON user_followers
  FOR EACH ROW
  EXECUTE FUNCTION handle_follow_notification();

CREATE TRIGGER on_post_like
  AFTER INSERT ON post_likes
  FOR EACH ROW
  EXECUTE FUNCTION handle_post_like_notification();

CREATE TRIGGER on_post_comment
  AFTER INSERT ON post_comments
  FOR EACH ROW
  EXECUTE FUNCTION handle_post_comment_notification();

-- Grant permissions
GRANT EXECUTE ON FUNCTION create_user_notification(UUID, UUID, TEXT, TEXT, UUID, TEXT) TO authenticated;