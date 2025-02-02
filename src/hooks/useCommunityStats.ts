import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRealtimeSubscription } from './useRealtimeSubscription';

interface CommunityStats {
  activeMembers: number;
  postsToday: number;
  responseRate: number;
}

interface TopContributor {
  id: string;
  username: string;
  avatar_url?: string;
  post_count: number;
  rank: number;
}

interface RecentActivity {
  id: string;
  user_id: string;
  username: string;
  activity_type: 'post' | 'comment' | 'like';
  post_id: string;
  created_at: string;
}

export function useCommunityStats() {
  const [stats, setStats] = useState<CommunityStats>({
    activeMembers: 0,
    postsToday: 0,
    responseRate: 0
  });
  const [topContributors, setTopContributors] = useState<TopContributor[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [trendingTopics, setTrendingTopics] = useState<{ topic: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to real-time updates
  useRealtimeSubscription(
    [
      { table: 'community_posts', event: '*' },
      { table: 'post_comments', event: '*' },
      { table: 'post_likes', event: '*' },
      { table: 'post_tags', event: '*' }
    ],
    () => {
      // Refresh stats when any activity occurs
      loadStats();
    }
  );

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get community stats
      const { data: statsData } = await supabase.rpc('get_community_stats');
      if (statsData) {
        setStats(statsData);
      }

      // Get top contributors
      const { data: contributors } = await supabase
        .from('top_contributors_view')
        .select('*');

      if (contributors) {
        setTopContributors(contributors);
      }

      // Get recent activity
      const { data: activity } = await supabase
        .from('recent_activity_view')
        .select(`
          id,
          user_id,
          username,
          title,
          created_at
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (activity) {
        setRecentActivity(activity);
      }
      
      // Get trending topics
      const { data: topics, error: topicsError } = await supabase
        .rpc('get_trending_topics');

      if (topicsError) throw topicsError;
      
      if (topics) {
        setTrendingTopics(
          topics
            .filter(t => t.tag) // Filter out null tags
            .map(t => ({
              topic: t.tag,
              count: t.post_count || 0
            }))
        );
      }

    } catch (err) {
      console.error('Error loading community stats:', err);
      setError('Failed to load community stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  return {
    stats,
    topContributors,
    recentActivity,
    trendingTopics,
    loading,
    error,
    refresh: loadStats
  };
}