import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { communityApi, type Post, type Comment } from '@/services/community';
import { useRealtimeSubscription } from './useRealtimeSubscription';

export function useCommunity() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to real-time updates
  useRealtimeSubscription(
    [
      { table: 'community_posts', event: '*' },
      { table: 'post_likes', event: '*' },
      { table: 'post_comments', event: '*' }
    ],
    async (payload) => {
      // Refresh posts when any changes occur
      const data = await communityApi.getPosts();
      setPosts(data);
    },
    !!user
  );

  useEffect(() => {
    const loadPosts = async () => {
      try {
        setLoading(true);
        const data = await communityApi.getPosts();
        setPosts(data);
      } catch (err) {
        console.error('Failed to load posts:', err);
        setError('Failed to load posts');
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, []);

  const createPost = async (post: {
    title: string;
    content: string;
    category: string;
    trading_pair?: string;
    timeframe?: string;
    image_url?: string;
    tags: string[];
  }) => {
    try {
      const newPost = await communityApi.createPost(post);
      setPosts(prev => [newPost, ...prev]);
      return newPost;
    } catch (err) {
      console.error('Failed to create post:', err);
      throw new Error('Failed to create post');
    }
  };

  const updatePost = async (postId: string, updates: {
    title?: string;
    content?: string;
    category?: string;
    trading_pair?: string;
    timeframe?: string;
    image_url?: string;
    tags?: string[];
  }) => {
    try {
      const updatedPost = await communityApi.updatePost(postId, updates);
      setPosts(prev =>
        prev.map(post =>
          post.id === postId ? { ...post, ...updatedPost } : post
        )
      );
      return updatedPost;
    } catch (err) {
      console.error('Failed to update post:', err);
      throw new Error('Failed to update post');
    }
  };

  const deletePost = async (postId: string) => {
    try {
      await communityApi.deletePost(postId);
      setPosts(prev => prev.filter(post => post.id !== postId));
    } catch (err) {
      console.error('Failed to delete post:', err);
      throw new Error('Failed to delete post');
    }
  };

  const toggleLike = async (postId: string) => {
    try {
      const isLiked = await communityApi.toggleLike(postId);
      setPosts(prev =>
        prev.map(post =>
          post.id === postId
            ? {
                ...post,
                likes_count: post.likes_count + (isLiked ? 1 : -1),
                liked_by_user: isLiked
              }
            : post
        )
      );
    } catch (err) {
      console.error('Failed to toggle like:', err);
      throw new Error('Failed to toggle like');
    }
  };

  return {
    posts,
    loading,
    error,
    createPost,
    updatePost,
    deletePost,
    toggleLike
  };
}