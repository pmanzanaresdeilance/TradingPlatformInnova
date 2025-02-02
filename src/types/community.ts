export interface Post {
  id: string;
  user_id: string;
  title: string;
  content: string;
  category: string;
  trading_pair?: string;
  timeframe?: string;
  image_url?: string;
  author_username: string;
  author_avatar_url?: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
  liked_by_user: boolean;
  tags: string[];
}

export interface Comment {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  likes_count: number;
  replies_count: number;
  user: {
    username: string;
    avatar_url?: string;
  };
  liked_by_user?: boolean;
}

export interface TrendingTopic {
  topic: string;
  count: number;
}