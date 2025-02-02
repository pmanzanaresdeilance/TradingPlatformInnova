-- Live Classes Table
CREATE TABLE IF NOT EXISTS live_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  instructor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time TIME NOT NULL,
  duration INTEGER NOT NULL, -- in minutes
  zoom_link TEXT NOT NULL,
  recording_url TEXT,
  thumbnail_url TEXT,
  attendees INTEGER DEFAULT 0,
  max_attendees INTEGER NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('Beginner', 'Intermediate', 'Advanced')),
  required_membership TEXT NOT NULL DEFAULT 'free' CHECK (required_membership IN ('free', 'premium', 'elite')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Class Registrations Table
CREATE TABLE IF NOT EXISTS class_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES live_classes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(class_id, user_id)
);

-- Enable RLS
ALTER TABLE live_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_registrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for live_classes
CREATE POLICY "Anyone can view live classes"
  ON live_classes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only instructors can create classes"
  ON live_classes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND (
        raw_user_meta_data->>'role' = 'instructor' OR
        raw_user_meta_data->>'role' = 'admin'
      )
    )
  );

CREATE POLICY "Only instructors can update their classes"
  ON live_classes FOR UPDATE
  TO authenticated
  USING (
    instructor_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Only instructors can delete their classes"
  ON live_classes FOR DELETE
  TO authenticated
  USING (
    instructor_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- RLS Policies for class_registrations
CREATE POLICY "Users can view their registrations"
  ON class_registrations FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM live_classes
      WHERE live_classes.id = class_id
      AND live_classes.instructor_id = auth.uid()
    )
  );

CREATE POLICY "Users can register for classes"
  ON class_registrations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can cancel their registrations"
  ON class_registrations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to check if user can access class based on membership
CREATE OR REPLACE FUNCTION can_access_class(class_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_membership TEXT;
  class_required_membership TEXT;
BEGIN
  -- Get user's membership level
  SELECT raw_user_meta_data->>'subscription_tier'
  INTO user_membership
  FROM auth.users
  WHERE id = user_id;

  -- Get class required membership
  SELECT required_membership
  INTO class_required_membership
  FROM live_classes
  WHERE id = class_id;

  -- Check access based on membership level
  RETURN CASE
    WHEN user_membership = 'elite' THEN true
    WHEN user_membership = 'premium' AND class_required_membership IN ('free', 'premium') THEN true
    WHEN user_membership = 'free' AND class_required_membership = 'free' THEN true
    ELSE false
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment attendees count
CREATE OR REPLACE FUNCTION increment_class_attendees()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE live_classes
  SET attendees = attendees + 1
  WHERE id = NEW.class_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement attendees count
CREATE OR REPLACE FUNCTION decrement_class_attendees()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE live_classes
  SET attendees = attendees - 1
  WHERE id = OLD.class_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for attendee count
CREATE TRIGGER increment_attendees
  AFTER INSERT ON class_registrations
  FOR EACH ROW
  EXECUTE FUNCTION increment_class_attendees();

CREATE TRIGGER decrement_attendees
  AFTER DELETE ON class_registrations
  FOR EACH ROW
  EXECUTE FUNCTION decrement_class_attendees();

-- Add updated_at trigger
CREATE TRIGGER update_live_classes_updated_at
  BEFORE UPDATE ON live_classes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION can_access_class(UUID, UUID) TO authenticated;