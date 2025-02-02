import React from 'react';
import { Award, BarChart2, Clock, User } from 'lucide-react';
import { TrendingTags } from './TrendingTags';

interface SidebarProps {
  topContributors: {
    username: string;
    avatar_url?: string;
    post_count: number;
    rank: number;
  }[];
  stats: {
    activeMembers: number;
    postsToday: number;
    responseRate: number;
  };
  recentActivity: {
    id: string;
    user_id: string;
    username: string;
    title: string;
    created_at: string;
  }[];
  trendingTopics: { topic: string; count: number }[];
  onActivityClick: (activity: any) => void;
}

export function Sidebar({
  topContributors,
  stats,
  recentActivity,
  trendingTopics,
  onActivityClick
}: SidebarProps) {
  return (
    <div className="space-y-6">
      {/* Top Contributors */}
      <div className="bg-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-trading-accent" />
          Top Contributors
        </h2>
        <div className="space-y-4">
          {topContributors.map((contributor) => (
            <div key={contributor.username} className="flex items-center gap-3">
              {contributor.avatar_url ? (
                <img
                  src={contributor.avatar_url}
                  alt={contributor.username}
                  className="w-10 h-10 rounded-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      contributor.username
                    )}&background=7C3AED&color=fff`;
                  }}
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-400" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{contributor.username}</p>
                <p className="text-sm text-gray-400">{contributor.post_count} posts</p>
              </div>
              <div className="shrink-0">
                <div className="px-2 py-1 bg-trading-accent/10 text-trading-accent rounded text-sm">
                  #{contributor.rank}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trending Topics */}
      <TrendingTags tags={trendingTopics} />

      {/* Community Stats */}
      <div className="bg-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-trading-accent" />
          Community Stats
        </h2>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Active Members</span>
              <span>{stats.activeMembers}</span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full">
              <div 
                className="h-full bg-trading-accent rounded-full"
                style={{ width: `${Math.min((stats.activeMembers / 1000) * 100, 100)}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Posts Today</span>
              <span>{stats.postsToday}</span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full">
              <div 
                className="h-full bg-trading-success rounded-full"
                style={{ width: `${Math.min((stats.postsToday / 100) * 100, 100)}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Response Rate</span>
              <span>{stats.responseRate}%</span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full">
              <div 
                className="h-full bg-trading-warning rounded-full"
                style={{ width: `${stats.responseRate}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-trading-accent" />
          Recent Activity
        </h2>
        <div className="space-y-4">
          {recentActivity.map((activity, index) => (
            <div 
              key={`${activity.id}-${index}`}
              className="flex items-center gap-3 cursor-pointer hover:bg-gray-700/50 p-2 rounded-lg transition-colors"
              onClick={() => onActivityClick(activity)}
            >
              <div className="w-2 h-2 rounded-full bg-trading-accent" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-300 truncate">
                  <span className="font-medium">{activity.username}</span>
                  {' shared '}
                  <span className="text-trading-accent">{activity.title}</span>
                </p>
              </div>
            </div>
          ))}
          {recentActivity.length === 0 && (
            <p className="text-sm text-gray-400 text-center">No recent activity</p>
          )}
        </div>
      </div>
    </div>
  );
}