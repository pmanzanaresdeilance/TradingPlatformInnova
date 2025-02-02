-- Drop chat-related tables
DROP TABLE IF EXISTS chat_typing_status CASCADE;
DROP TABLE IF EXISTS support_messages CASCADE;
DROP TABLE IF EXISTS support_chats CASCADE;
DROP TABLE IF EXISTS faqs CASCADE;

-- Drop chat-related functions
DROP FUNCTION IF EXISTS update_chat_last_message CASCADE;
DROP FUNCTION IF EXISTS mark_notification_as_read CASCADE;
DROP FUNCTION IF EXISTS mark_all_notifications_as_read CASCADE;