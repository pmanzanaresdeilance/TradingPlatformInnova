import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { TrendingTags } from '@/components/community/TrendingTags';
import { Loader2 } from 'lucide-react';
import { formatTextWithHashtags } from '@/components/community/HashtagLink';

interface Post {
  id: string;
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

export default function TagExplore() {
  const { tag } = useParams<{ tag: string }>();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [relatedTags, setRelatedTags] = useState<{ topic: string; count: number }[]>([]);

  useEffect(() => {
    const loadTaggedPosts = async () => {
      try {
        setLoading(true);
        
        // Get posts with this tag
        const { data: postsData, error: postsError } = await supabase
          .from('post_details')
          .select(`
            *,
            tags:post_tags(tag)
          `)
          .eq('tags.tag', tag)
          .order('created_at', { ascending: false });

        if (postsError) throw postsError;
        setPosts(postsData?.map(post => ({
          ...post,
          tags: post.tags?.map((t: any) => t.tag) || []
        })) || []);

        // Get related tags
        const { data: tagsData, error: tagsError } = await supabase
          .rpc('get_related_tags', { target_tag: tag })
          .limit(5);

        if (tagsError) throw tagsError;
        setRelatedTags(tagsData?.map(t => ({
          topic: t.related_tag,
          count: t.common_posts
        })) || []);

      } catch (err) {
        console.error('Error loading tagged posts:', err);
        setError('Failed to load posts');
      } finally {
        setLoading(false);
      }
    };

    if (tag) {
      loadTaggedPosts();
    }
  }, [tag]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-12 h-12 animate-spin text-trading-accent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-trading-danger/10 border border-trading-danger/20 rounded-lg">
        <p className="text-sm text-trading-danger">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-white">#{tag}</h1>
        <p className="text-gray-400 mt-2">{posts.length} posts</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          {posts.map((post) => (
            <div key={post.id} className="bg-gray-800 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="shrink-0">
                  {post.author_avatar_url ? (
                    <img
                      src={post.author_avatar_url}
                      alt={post.author_username}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center">
                      <span className="text-lg font-medium">
                        {post.author_username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-medium">{post.author_username}</span>
                    <span className="text-sm text-gray-400">
                      {new Date(post.created_at).toLocaleDateString()}
                    </span>
                    {post.trading_pair && (
                      <span className="text-sm font-medium text-trading-accent">
                        {post.trading_pair}
                      </span>
                    )}
                    {post.timeframe && (
                      <span className="text-sm text-gray-400">
                        {post.timeframe}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-medium mb-2">{post.title}</h3>
                  {post.image_url && (
                    <img
                      src={post.image_url}
                      alt="Trading chart"
                      className="w-full h-64 object-cover rounded-lg mb-4"
                    />
                  )}
                  <div className="text-gray-300 mb-4">
                    {formatTextWithHashtags(post.content)}
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-gray-700 rounded-lg text-sm text-gray-300"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {posts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400">No posts found with #{tag}</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <TrendingTags tags={relatedTags} />
        </div>
      </div>
    </div>
  );
}