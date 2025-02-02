import { supabase } from '@/lib/supabase';

export interface Post {
  id: string;
  user_id: string;
  title: string;
  content: string;
  category: string;
  trading_pair?: string;
  timeframe?: string;
  image_url?: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
  tags: string[];
  user: {
    username: string;
    avatar_url?: string;
  };
  liked_by_user?: boolean;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user: {
    username: string;
    avatar_url?: string;
  };
}

export const communityApi = {
  async getPosts(options: {
    category?: string;
    search?: string;
    userId?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    let query = supabase
      .from('community_posts')
      .select(`
        *,
        tags:post_tags(tag),
        user:user_id(
          username:raw_user_meta_data->>'username',
          avatar_url:raw_user_meta_data->>'avatar_url'
        ),
        liked_by_user:post_likes!inner(user_id)
      `)
      .order('created_at', { ascending: false });

    if (options.category) {
      query = query.eq('category', options.category);
    }

    if (options.search) {
      query = query.or(`title.ilike.%${options.search}%,content.ilike.%${options.search}%`);
    }

    if (options.userId) {
      query = query.eq('user_id', options.userId);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data as Post[];
  },

  async createPost(post: {
    title: string;
    content: string;
    category: string;
    trading_pair?: string;
    timeframe?: string;
    image_url?: string;
    tags: string[];
  }) {
    const { data: postData, error: postError } = await supabase
      .from('community_posts')
      .insert({
        title: post.title,
        content: post.content,
        category: post.category,
        trading_pair: post.trading_pair,
        timeframe: post.timeframe,
        image_url: post.image_url
      })
      .select()
      .single();

    if (postError) throw postError;

    if (post.tags.length > 0) {
      const { error: tagsError } = await supabase
        .from('post_tags')
        .insert(
          post.tags.map(tag => ({
            post_id: postData.id,
            tag
          }))
        );

      if (tagsError) throw tagsError;
    }

    return postData;
  },

  async updatePost(postId: string, updates: {
    title?: string;
    content?: string;
    category?: string;
    trading_pair?: string;
    timeframe?: string;
    image_url?: string;
    tags?: string[];
  }) {
    const { data: postData, error: postError } = await supabase
      .from('community_posts')
      .update({
        title: updates.title,
        content: updates.content,
        category: updates.category,
        trading_pair: updates.trading_pair,
        timeframe: updates.timeframe,
        image_url: updates.image_url
      })
      .eq('id', postId)
      .select()
      .single();

    if (postError) throw postError;

    if (updates.tags) {
      // Delete existing tags
      await supabase
        .from('post_tags')
        .delete()
        .eq('post_id', postId);

      // Insert new tags
      if (updates.tags.length > 0) {
        const { error: tagsError } = await supabase
          .from('post_tags')
          .insert(
            updates.tags.map(tag => ({
              post_id: postId,
              tag
            }))
          );

        if (tagsError) throw tagsError;
      }
    }

    return postData;
  },

  async deletePost(postId: string) {
    const { error } = await supabase
      .from('community_posts')
      .delete()
      .eq('id', postId);

    if (error) throw error;
  },

  async toggleLike(postId: string) {
    const { data: existingLike } = await supabase
      .from('post_likes')
      .select()
      .eq('post_id', postId)
      .maybeSingle();

    if (existingLike) {
      const { error } = await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', postId);

      if (error) throw error;
      return false;
    } else {
      const { error } = await supabase
        .from('post_likes')
        .insert({ post_id: postId });

      if (error) throw error;
      return true;
    }
  },

  async getComments(postId: string) {
    const { data, error } = await supabase
      .from('post_comments')
      .select(`
        *,
        user:user_id(
          username:raw_user_meta_data->>'username',
          avatar_url:raw_user_meta_data->>'avatar_url'
        )
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data as Comment[];
  },

  async addComment(postId: string, content: string) {
    const { data, error } = await supabase
      .from('post_comments')
      .insert({
        post_id: postId,
        content
      })
      .select(`
        *,
        user:user_id(
          username:raw_user_meta_data->>'username',
          avatar_url:raw_user_meta_data->>'avatar_url'
        )
      `)
      .single();

    if (error) throw error;
    return data as Comment;
  },

  async updateComment(commentId: string, content: string) {
    const { data, error } = await supabase
      .from('post_comments')
      .update({ content })
      .eq('id', commentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteComment(commentId: string) {
    const { error } = await supabase
      .from('post_comments')
      .delete()
      .eq('id', commentId);

    if (error) throw error;
  }
};