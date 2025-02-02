import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export interface BacktestingVideo {
  id: string;
  title: string;
  description: string;
  duration: string;
  thumbnail_url: string;
  video_url: string;
  views: number;
  category: string;
  required_membership: 'free' | 'premium' | 'elite';
  instructor_id: string;
  instructor_username?: string;
  instructor_avatar_url?: string;
  is_published: boolean;
  created_at: string;
}

export interface BacktestingStats {
  totalScenarios: number;
  totalHours: number;
  totalCategories: number;
}

export function useBacktestingVideos() {
  const { user } = useAuth();
  const [videos, setVideos] = useState<BacktestingVideo[]>([]);
  const [stats, setStats] = useState<BacktestingStats>({
    totalScenarios: 0,
    totalHours: 0,
    totalCategories: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isInstructor = user?.user_metadata?.role === 'instructor' || user?.user_metadata?.role === 'admin';

  useEffect(() => {
    const loadVideos = async () => {
      try {
        setLoading(true);
        let query = supabase
          .from('backtesting_video_details')
          .select('*')
          .order('created_at', { ascending: false });

        // Only show published videos for non-instructors
        if (!isInstructor) {
          query = query.eq('is_published', true);
        }

        const { data: videosData, error: videosError } = await query;

        if (videosError) throw videosError;

        // Calculate stats from the videos data
        const totalScenarios = videosData?.length || 0;
        const totalHours = videosData?.reduce((acc, video) => {
          const [minutes] = video.duration.split(':').map(Number);
          return acc + (minutes / 60);
        }, 0) || 0;
        const categories = new Set(videosData?.map(video => video.category?.name).filter(Boolean));
        const totalCategories = categories.size;

        setVideos(videosData?.map(video => ({
          ...video,
          category: video.category_name || 'Uncategorized'
        })) || []);

        setStats({
          totalScenarios,
          totalHours: Math.ceil(totalHours),
          totalCategories
        });
      } catch (err) {
        console.error('Failed to load backtesting videos:', err);
        setError('Failed to load backtesting videos');
      } finally {
        setLoading(false);
      }
    };

    loadVideos();
  }, [user, isInstructor]);

  const addVideo = async (videoData: Partial<BacktestingVideo>) => {
    if (!user || !isInstructor) throw new Error('Unauthorized');

    const { data, error } = await supabase
      .from('backtesting_videos')
      .insert({
        ...videoData,
        instructor_id: user.id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const updateVideo = async (videoId: string, updates: Partial<BacktestingVideo>) => {
    if (!user || !isInstructor) throw new Error('Unauthorized');

    const { data, error } = await supabase
      .from('backtesting_videos')
      .update(updates)
      .eq('id', videoId)
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const deleteVideo = async (videoId: string) => {
    if (!user || !isInstructor) throw new Error('Unauthorized');

    const { error } = await supabase
      .from('backtesting_videos')
      .delete()
      .eq('id', videoId);

    if (error) throw error;
  };

  const updateProgress = async (videoId: string, progressSeconds: number, completed: boolean) => {
    if (!user) throw new Error('Must be logged in');

    const { error } = await supabase
      .from('backtesting_progress')
      .upsert({
        video_id: videoId,
        user_id: user.id,
        progress_seconds: progressSeconds,
        completed,
        last_watched_at: new Date().toISOString()
      });

    if (error) throw error;
  };

  return {
    videos,
    stats,
    loading,
    error,
    isInstructor,
    addVideo,
    updateVideo,
    deleteVideo,
    updateProgress
  };
}