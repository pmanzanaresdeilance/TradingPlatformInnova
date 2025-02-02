import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export interface Follower {
  id: string;
  username: string;
  avatar_url?: string;
  following_since: string;
}

export function useFollowers() {
  const { user } = useAuth();
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [following, setFollowing] = useState<Follower[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const loadFollowers = async () => {
      try {
        setLoading(true);
        
        // Get followers
        const { data: followersData, error: followersError } = await supabase
          .from('user_followers')
          .select(`
            id,
            follower:follower_id (
              raw_user_meta_data->>'username' as username,
              raw_user_meta_data->>'avatar_url' as avatar_url
            ),
            created_at
          `)
          .eq('following_id', user.id);

        if (followersError) throw followersError;

        // Get following
        const { data: followingData, error: followingError } = await supabase
          .from('user_followers')
          .select(`
            id,
            following:following_id (
              raw_user_meta_data->>'username' as username,
              raw_user_meta_data->>'avatar_url' as avatar_url
            ),
            created_at
          `)
          .eq('follower_id', user.id);

        if (followingError) throw followingError;

        setFollowers(
          followersData.map(f => ({
            id: f.follower.id,
            username: f.follower.username,
            avatar_url: f.follower.avatar_url,
            following_since: f.created_at
          }))
        );

        setFollowing(
          followingData.map(f => ({
            id: f.following.id,
            username: f.following.username,
            avatar_url: f.following.avatar_url,
            following_since: f.created_at
          }))
        );
      } catch (err) {
        console.error('Error loading followers:', err);
        setError('Failed to load followers');
      } finally {
        setLoading(false);
      }
    };

    loadFollowers();

    // Set up real-time subscription
    const subscription = supabase
      .channel('followers')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_followers',
          filter: `follower_id=eq.${user.id},following_id=eq.${user.id}`
        },
        () => {
          loadFollowers();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const followUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('user_followers')
        .insert({
          follower_id: user?.id,
          following_id: userId
        });

      if (error) throw error;
    } catch (err) {
      console.error('Error following user:', err);
      throw new Error('Failed to follow user');
    }
  };

  const unfollowUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('user_followers')
        .delete()
        .eq('follower_id', user?.id)
        .eq('following_id', userId);

      if (error) throw error;
    } catch (err) {
      console.error('Error unfollowing user:', err);
      throw new Error('Failed to unfollow user');
    }
  };

  const isFollowing = (userId: string) => {
    return following.some(f => f.id === userId);
  };

  return {
    followers,
    following,
    loading,
    error,
    followUser,
    unfollowUser,
    isFollowing
  };
}