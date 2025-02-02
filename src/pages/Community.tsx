import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { CommunityHeader } from '@/components/community/CommunityHeader';
import { PostFilters } from '@/components/community/PostFilters';
import { PostList } from '@/components/community/PostList';
import { Sidebar } from '@/components/community/Sidebar';
import { CommentSection } from '@/components/community/CommentSection';
import { supabase } from '@/lib/supabase';
import { NewPostModal } from '@/components/community/NewPostModal';
import { EditPostModal } from '@/components/community/EditPostModal';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { useCommunityStats } from '@/hooks/useCommunityStats';
import { PostModal } from '@/components/community/PostModal';
import type { Post } from '@/types/community';

export default function Community() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [postComments, setPostComments] = useState<Comment[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<Post | null>(null);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const { stats, topContributors, recentActivity, trendingTopics } = useCommunityStats();

  // Subscribe to real-time user metadata and post updates
  useRealtimeSubscription(
    [
      {
        table: 'users',
        schema: 'auth',
        event: 'UPDATE'
      },
      {
        table: 'community_posts',
        event: 'UPDATE'
      }
    ],
    (payload) => {
      if (payload.schema === 'auth' && payload.eventType === 'UPDATE') {
        // Update posts with new user metadata
        setPosts(prevPosts => 
          prevPosts.map(post => 
            post.user_id === payload.new.id ? {
              ...post,
              author_username: payload.new.raw_user_meta_data.username,
              author_avatar_url: payload.new.raw_user_meta_data.avatar_url
            } : post
          )
        );
      }
    }
  );

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('post_categories')
          .select('name')
          .order('name', { ascending: true });

        if (error) throw error;
        setCategories(data.map(cat => cat.name));
      } catch (err) {
        console.error('Error loading categories:', err);
        setError('Failed to load categories');
      }
    };

    loadCategories();
  }, []);

  useEffect(() => {
    const loadTrendingTopics = async () => {
      try {
        const { data: topicsData, error } = await supabase
          .rpc('get_trending_topics');

        if (error) throw error;
        if (topicsData) {
          setTrendingTopics(topicsData.map(t => ({ 
            topic: t.tag, 
            count: t.interaction_score 
          })));
        }
      } catch (err) {
        console.error('Error loading trending topics:', err);
      }
    };

    loadTrendingTopics();
    
    // Set up real-time subscription for trending topics
    const subscription = supabase
      .channel('trending_topics_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'post_tags'
        },
        () => {
          loadTrendingTopics();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const loadPosts = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: postsData, error: postsError } = await supabase
          .from('post_details')
          .select(`
            *,
            tags:post_tags(tag)
          `)
          .order('created_at', { ascending: false });

        if (postsError) throw postsError;

        // Transform the data to match our Post interface
        const transformedPosts = postsData?.map(post => ({
          ...post,
          tags: post.tags?.map((t: any) => t.tag) || []
        })) || [];

        setPosts(transformedPosts);
      } catch (err) {
        console.error('Error loading posts:', err);
        setError('Failed to load posts');
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, []);

  const filteredPosts = posts.filter(post => {
    const matchesCategory = !selectedCategory || post.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesCategory && matchesSearch;
  });

  const handleLike = async (postId: string, isLiked: boolean) => {
    if (!user) return;

    try {
      if (isLiked) {
        await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('post_likes')
          .insert({
            post_id: postId,
            user_id: user.id
          });
      }
      
      // Refresh posts to update like count
      const { data: updatedPosts, error: refreshError } = await supabase
        .from('post_details')
        .select(`
          *,
          liked_by_user:post_likes!left(user_id)
        `)
        .order('created_at', { ascending: false });

      if (updatedPosts) {
        setPosts(updatedPosts);
      }
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  const loadComments = async (postId: string) => {
    setLoading(true);
    try {
      // First get the post details to ensure we have a valid UUID
      const { data: post } = await supabase
        .from('community_posts')
        .select('id')
        .eq('id', postId)
        .single();

      if (!post) throw new Error('Invalid post ID');

      const { data } = await supabase
        .from('comment_details')
        .select(`
          id,
          content,
          user_id,
          created_at,
          likes_count,
          replies_count,
          username,
          avatar_url,
          liked_by_user
        `)
        .eq('post_id', post.id)
        .order('created_at', { ascending: true });

      if (data) {
        setPostComments(data);
      }
    } catch (err) {
      console.error('Error loading comments:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <CommunityHeader onNewPost={() => setShowNewPostModal(true)} />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            <PostFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              categories={categories}
            />

            <PostList
              posts={filteredPosts}
              onPostClick={setSelectedPost}
              onLike={handleLike}
              onEdit={setEditingPost}
              onLoadComments={loadComments}
              selectedPost={selectedPost?.id || null}
            />
          </div>

          <Sidebar
            topContributors={topContributors}
            stats={stats}
            recentActivity={recentActivity}
            trendingTopics={trendingTopics}
            onActivityClick={setSelectedActivity}
          />
        </div>
      </div>

      <NewPostModal
        isOpen={showNewPostModal}
        onClose={() => setShowNewPostModal(false)}
        onSuccess={() => {
          setShowNewPostModal(false);
          window.location.reload();
        }}
      />

      {editingPost && (
        <EditPostModal
          isOpen={true}
          onClose={() => setEditingPost(null)}
          onSuccess={() => {
            setEditingPost(null);
            window.location.reload();
          }}
          post={editingPost}
        />
      )}

      {selectedPost && (
        <PostModal
          post={selectedPost}
          isOpen={true}
          onClose={() => setSelectedPost(null)}
          onLike={handleLike}
          onEdit={(post) => {
            setEditingPost(post);
            setSelectedPost(null);
          }}
        />
      )}

      {selectedActivity && (
        <PostModal
          post={selectedActivity}
          isOpen={true}
          onClose={() => setSelectedActivity(null)}
          onLike={handleLike}
          onEdit={(post) => {
            setEditingPost(post);
            setSelectedActivity(null);
          }}
        />
      )}
    </>
  );
}