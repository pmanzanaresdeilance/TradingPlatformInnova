import React from 'react';
import { useFollowers } from '@/hooks/useFollowers';
import { User, Loader2 } from 'lucide-react';
import { FollowButton } from './FollowButton';

interface FollowersListProps {
  userId: string;
  type: 'followers' | 'following';
}

export function FollowersList({ userId, type }: FollowersListProps) {
  const { followers, following, loading, error } = useFollowers();
  const users = type === 'followers' ? followers : following;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-trading-accent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-trading-danger">
        {error}
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        No {type} yet
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {users.map((user) => (
        <div
          key={user.id}
          className="flex items-center justify-between p-4 bg-gray-700/50 rounded-xl hover:bg-gray-700 transition-colors"
        >
          <div className="flex items-center gap-3">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.username}
                className="w-12 h-12 rounded-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    user.username
                  )}&background=7C3AED&color=fff`;
                }}
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center">
                <User className="w-6 h-6 text-gray-400" />
              </div>
            )}
            <div>
              <h3 className="font-medium">{user.username}</h3>
              <p className="text-sm text-gray-400">
                Following since {new Date(user.following_since).toLocaleDateString()}
              </p>
            </div>
          </div>

          <FollowButton
            userId={user.id}
            username={user.username}
          />
        </div>
      ))}
    </div>
  );
}