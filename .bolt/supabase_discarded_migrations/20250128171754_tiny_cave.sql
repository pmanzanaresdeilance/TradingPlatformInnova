-- Create notifications table for live classes
CREATE TABLE IF NOT EXISTS class_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES live_classes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('registration', 'reminder', 'cancellation', 'recording_available')),
  sent_at TIMESTAMPTZ DEFAULT now(),
  email_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE class_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own notifications"
  ON class_notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Function to create notification
CREATE OR REPLACE FUNCTION create_class_notification(
  p_class_id UUID,
  p_user_id UUID,
  p_type TEXT
)
RETURNS void AS $$
BEGIN
  INSERT INTO class_notifications (class_id, user_id, type)
  VALUES (p_class_id, p_user_id, p_type);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle registration notifications
CREATE OR REPLACE FUNCTION handle_registration_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Create notification for student
  PERFORM create_class_notification(NEW.class_id, NEW.user_id, 'registration');
  
  -- Create notification for instructor
  PERFORM create_class_notification(
    NEW.class_id,
    (SELECT instructor_id FROM live_classes WHERE id = NEW.class_id),
    'registration'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle recording notifications
CREATE OR REPLACE FUNCTION handle_recording_notification()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.recording_url IS NOT NULL AND OLD.recording_url IS NULL THEN
    -- Notify all registered students
    INSERT INTO class_notifications (class_id, user_id, type)
    SELECT 
      NEW.id,
      cr.user_id,
      'recording_available'
    FROM class_registrations cr
    WHERE cr.class_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
CREATE TRIGGER on_class_registration
  AFTER INSERT ON class_registrations
  FOR EACH ROW
  EXECUTE FUNCTION handle_registration_notification();

CREATE TRIGGER on_recording_available
  AFTER UPDATE ON live_classes
  FOR EACH ROW
  EXECUTE FUNCTION handle_recording_notification();

-- Grant permissions
GRANT EXECUTE ON FUNCTION create_class_notification(UUID, UUID, TEXT) TO authenticated;