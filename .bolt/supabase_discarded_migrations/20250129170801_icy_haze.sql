-- Create backtesting categories table
CREATE TABLE IF NOT EXISTS backtesting_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create backtesting videos table
CREATE TABLE IF NOT EXISTS backtesting_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  duration TEXT NOT NULL,
  thumbnail_url TEXT,
  fxreplay_link TEXT NOT NULL,
  category TEXT NOT NULL,
  views INTEGER DEFAULT 0,
  required_membership TEXT NOT NULL DEFAULT 'free',
  is_published BOOLEAN DEFAULT true,
  instructor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT valid_membership CHECK (required_membership IN ('free', 'premium', 'elite'))
);

-- Create backtesting comments table
CREATE TABLE IF NOT EXISTS backtesting_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID REFERENCES backtesting_videos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create backtesting progress table
CREATE TABLE IF NOT EXISTS backtesting_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID REFERENCES backtesting_videos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  progress_seconds INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  last_watched_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(video_id, user_id)
);

-- Enable RLS
ALTER TABLE backtesting_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE backtesting_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE backtesting_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE backtesting_progress ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view categories" ON backtesting_categories;
DROP POLICY IF EXISTS "Only instructors can manage categories" ON backtesting_categories;
DROP POLICY IF EXISTS "Users can view videos based on membership" ON backtesting_videos;
DROP POLICY IF EXISTS "Only instructors can manage videos" ON backtesting_videos;
DROP POLICY IF EXISTS "Anyone can view comments" ON backtesting_comments;
DROP POLICY IF EXISTS "Users can create comments" ON backtesting_comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON backtesting_comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON backtesting_comments;
DROP POLICY IF EXISTS "Users can view their own progress" ON backtesting_progress;
DROP POLICY IF EXISTS "Users can manage their own progress" ON backtesting_progress;

-- Create RLS policies
CREATE POLICY "Anyone can view categories"
  ON backtesting_categories
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only instructors can manage categories"
  ON backtesting_categories
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users
      WHERE raw_user_meta_data->>'role' IN ('admin', 'instructor')
    )
  );

CREATE POLICY "Users can view videos based on membership"
  ON backtesting_videos
  FOR SELECT
  TO authenticated
  USING (
    CASE 
      WHEN auth.uid() IN (
        SELECT id FROM auth.users
        WHERE raw_user_meta_data->>'role' IN ('admin', 'instructor')
      ) THEN true
      WHEN EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = auth.uid()
        AND (
          CASE raw_user_meta_data->>'subscription_tier'
            WHEN 'elite' THEN true
            WHEN 'premium' THEN required_membership IN ('free', 'premium')
            ELSE required_membership = 'free'
          END
        )
      ) AND is_published = true THEN true
      ELSE false
    END
  );

CREATE POLICY "Only instructors can manage videos"
  ON backtesting_videos
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users
      WHERE raw_user_meta_data->>'role' IN ('admin', 'instructor')
    )
  );

CREATE POLICY "Anyone can view comments"
  ON backtesting_comments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create comments"
  ON backtesting_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
  ON backtesting_comments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON backtesting_comments
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own progress"
  ON backtesting_progress
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own progress"
  ON backtesting_progress
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Create view for backtesting video details
CREATE OR REPLACE VIEW backtesting_video_details AS
SELECT 
  v.*,
  c.name as category_name,
  u.raw_user_meta_data->>'username' as instructor_username,
  u.raw_user_meta_data->>'avatar_url' as instructor_avatar_url,
  COALESCE(p.total_progress, 0) as total_progress,
  COALESCE(p.total_completed, 0) as total_completed
FROM backtesting_videos v
LEFT JOIN backtesting_categories c ON v.category = c.name
LEFT JOIN auth.users u ON v.instructor_id = u.id
LEFT JOIN (
  SELECT 
    video_id,
    COUNT(DISTINCT user_id) as total_progress,
    COUNT(DISTINCT CASE WHEN completed THEN user_id END) as total_completed
  FROM backtesting_progress
  GROUP BY video_id
) p ON v.id = p.video_id;

-- Insert sample categories
INSERT INTO backtesting_categories (name, description) VALUES
  ('Price Action', 'Learn price action trading strategies through historical examples'),
  ('Support & Resistance', 'Master support and resistance trading with real market scenarios'),
  ('Trend Trading', 'Study trend following strategies with past market movements'),
  ('Breakout Trading', 'Analyze historical breakout patterns and setups'),
  ('Risk Management', 'Real examples of proper risk management in action')
ON CONFLICT (name) DO NOTHING;

-- Grant necessary permissions
GRANT SELECT ON backtesting_video_details TO authenticated;