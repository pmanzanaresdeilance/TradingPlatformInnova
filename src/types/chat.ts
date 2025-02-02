export interface Message {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  edited_at?: string;
  room_id: string;
  username: string;
  avatar_url?: string;
}

export interface ChatRoom {
  id: string;
  name: string;
  description?: string;
  created_by: string;
  created_at: string;
  is_private: boolean;
  members: string[];
}