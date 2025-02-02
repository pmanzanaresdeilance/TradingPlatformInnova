import React from 'react';
import { UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { useFollowers } from '@/hooks/useFollowers';

interface FollowButtonProps {
  userId: string;
  username: string;
  onSuccess?: () => void;
}

export function FollowButton({ userId, username, onSuccess }: FollowButtonProps) {
  const { isFollowing, followUser, unfollowUser } = useFollowers();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggleFollow = async () => {
    try {
      setLoading(true);
      setError(null);

      if (isFollowing(userId)) {
        await unfollowUser(userId);
      } else {
        await followUser(userId);
      }

      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update follow status');
    } finally {
      setLoading(false);
    }
  };

  const following = isFollowing(userId);

  return (
    <>
      <button
        onClick={handleToggleFollow}
        disabled={loading}
        className={`
          px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors
          ${following
            ? 'bg-gray-700 text-white hover:bg-trading-danger hover:text-white'
            : 'bg-trading-accent text-gray-900 hover:bg-opacity-90'
          }
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : following ? (
          <UserMinus className="w-4 h-4" />
        ) : (
          <UserPlus className="w-4 h-4" />
        )}
        {following ? 'Following' : 'Follow'}
      </button>

      {error && (
        <p className="text-sm text-trading-danger mt-2">{error}</p>
      )}
    </>
  );
}