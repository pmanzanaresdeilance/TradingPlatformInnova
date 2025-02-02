import React, { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Play, Clock, BookOpen, BarChart2, Lock, Filter, Search } from 'lucide-react';
import { useBacktestingVideos } from '@/hooks/useBacktestingVideos';
import { supabase } from '@/lib/supabase';

export default function Backtesting() {
  const { user } = useAuth();
  const { videos, stats, loading, error, refreshVideos } = useBacktestingVideos();
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');

  const canAccessVideo = (requiredMembership: string) => {
    const membershipLevels = { free: 0, premium: 1, elite: 2 };
    return membershipLevels[user?.subscription_tier || 'free'] >= membershipLevels[requiredMembership];
  };

  const handleVideoPlay = useCallback(async (videoId: string) => {
    try {
      await supabase.rpc('increment_video_views', { video_id: videoId });
      // Wait a bit before refreshing to ensure the view count is updated
      setTimeout(refreshVideos, 500);
    } catch (err) {
      console.error('Failed to increment views:', err);
    }
  }, [refreshVideos]);

  const filteredVideos = videos.filter(video => {
    const matchesCategory = !selectedCategory || video.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categories = Array.from(new Set(videos.map(v => v.category)));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-trading-accent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-white">Backtesting Videos</h1>
        <p className="text-gray-400 mt-2">Learn from historical market scenarios</p>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
        <div className="bg-gray-800 rounded-xl p-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-trading-accent/20 to-trading-accent/5 flex items-center justify-center mb-4 transform transition-all duration-300 hover:scale-110 hover:rotate-3">
            <Play className="w-6 h-6 text-trading-accent" />
          </div>
          <h2 className="text-lg font-semibold mb-2">Available Videos</h2>
          <div className="text-center">
            <div className="text-3xl font-bold mb-2">{stats.totalScenarios}</div>
            <p className="text-gray-400">This month</p>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-trading-accent/20 to-trading-accent/5 flex items-center justify-center mb-4 transform transition-all duration-300 hover:scale-110 hover:rotate-3">
            <Clock className="w-6 h-6 text-trading-accent" />
          </div>
          <h2 className="text-lg font-semibold mb-2">Content Duration</h2>
          <div className="text-center">
            <div className="text-3xl font-bold mb-2">{stats.totalHours}</div>
            <p className="text-gray-400">Total duration</p>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-trading-accent/20 to-trading-accent/5 flex items-center justify-center mb-4 transform transition-all duration-300 hover:scale-110 hover:rotate-3">
            <BookOpen className="w-6 h-6 text-trading-accent" />
          </div>
          <h2 className="text-lg font-semibold mb-2">Categories</h2>
          <div className="text-center">
            <div className="text-3xl font-bold mb-2">{stats.totalCategories}</div>
            <p className="text-gray-400">Trading topics</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 rounded-xl p-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search videos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:ring-2 focus:ring-trading-accent focus:outline-none"
              />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="w-4 h-4 text-gray-400" />
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(
                    selectedCategory === category ? null : category
                  )}
                  className={`px-3 py-1 rounded-full text-sm ${
                    selectedCategory === category
                      ? 'bg-trading-accent text-gray-900'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  } transition-colors`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
        {filteredVideos.map((video) => (
          <div key={video.id} className="bg-gray-800 rounded-xl overflow-hidden group hover:shadow-xl hover:shadow-trading-accent/10 transition-all transform hover:-translate-y-1">
            <div className="relative">
              <img
                src={video.thumbnail_url}
                alt={video.title}
                className="w-full h-56 object-cover transform transition-transform duration-300 group-hover:scale-105"
              />
              <span className="absolute bottom-2 right-2 bg-black/80 text-white px-2 py-1 rounded text-sm font-medium">
                {video.duration}
              </span>
              {!canAccessVideo(video.required_membership) && (
                <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-trading-accent/20 flex items-center justify-center mx-auto mb-4">
                      <Lock className="w-8 h-8 text-trading-accent" />
                    </div>
                    <p className="text-white font-medium">
                      {video.required_membership.charAt(0).toUpperCase() + video.required_membership.slice(1)} Required
                    </p>
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium text-trading-accent">{video.category}</span>
                <span className={`text-xs font-medium px-2 py-1 rounded ${
                  video.required_membership === 'elite' ? 'bg-purple-500/20 text-purple-500' :
                  video.required_membership === 'premium' ? 'bg-yellow-500/20 text-yellow-500' :
                  'bg-green-500/20 text-green-500'
                }`}>
                  {video.required_membership.charAt(0).toUpperCase() + video.required_membership.slice(1)}
                </span>
              </div>
              <h3 className="text-lg font-semibold mb-3 group-hover:text-trading-accent transition-colors">{video.title}</h3>
              <p className="text-gray-400 text-sm mb-4 line-clamp-2">{video.description}</p>
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <BarChart2 className="w-4 h-4" />
                  {video.views > 0 ? `${video.views.toLocaleString()} views` : 'No views yet'}
                </div>
                {canAccessVideo(video.required_membership) ? (
                  <button
                    onClick={() => handleVideoPlay(video.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-trading-accent to-cyan-400 text-gray-900 rounded-lg text-sm font-medium transform transition-all duration-300 hover:translate-y-[-2px] hover:shadow-lg hover:shadow-trading-accent/20 active:translate-y-[1px]"
                  >
                    <Play className="w-4 h-4" /> Watch Now
                  </button>
                ) : (
                  <button className="px-4 py-2 bg-gray-700/50 text-gray-400 rounded-lg text-sm font-medium cursor-not-allowed border border-gray-600/50">
                    Upgrade Required
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {videos.length === 0 && (
          <div className="col-span-3 flex flex-col items-center justify-center py-16">
            <Play className="w-16 h-16 text-gray-500 mb-4 animate-pulse" />
            <h3 className="text-xl font-medium text-gray-300 mb-2">No Videos Available</h3>
            <p className="text-gray-400">Check back later for new backtesting content</p>
          </div>
        )}
      </div>
    </div>
  );
}