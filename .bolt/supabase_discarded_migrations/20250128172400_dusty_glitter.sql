@@ .. @@
 -- Drop existing notifications table if it exists
 DROP TABLE IF EXISTS user_notifications CASCADE;
 
+-- Create view for user metadata
+CREATE OR REPLACE VIEW user_metadata AS
+SELECT 
+  id,
+  raw_user_meta_data->>'username' as username,
+  raw_user_meta_data->>'avatar_url' as avatar_url
+FROM auth.users;
+
 -- Create notifications table
 CREATE TABLE IF NOT EXISTS user_notifications (
   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
@@ .. @@
 CREATE INDEX idx_user_notifications_created_at ON user_notifications(created_at);
 CREATE INDEX idx_user_notifications_read ON user_notifications(read);
 
+-- Create view for notifications with actor details
+CREATE OR REPLACE VIEW notification_details AS
+SELECT 
+  n.*,
+  a.username as actor_username,
+  a.avatar_url as actor_avatar_url
+FROM user_notifications n
+LEFT JOIN user_metadata a ON n.actor_id = a.id;
+
+-- Grant access to views
+GRANT SELECT ON user_metadata TO authenticated;
+GRANT SELECT ON notification_details TO authenticated;
+
 -- Add updated_at trigger
 CREATE TRIGGER update_user_notifications_updated_at
   BEFORE UPDATE ON user_notifications