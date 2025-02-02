import React from 'react';
import { Heart, MessageSquare, Share2, User, Edit2, Clock, Link2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import type { Post } from '@/types/community';
import { HashtagLink } from './HashtagLink';

interface PostCardProps {
  post: Post;
  onClick: () => void;
  onLike: (postId: string, isLiked: boolean) => Promise<void>;
  onEdit: (post: Post) => void;
  onLoadComments: (postId: string) => Promise<void>;
  isSelected: boolean;
}

export function PostCard({
  post,
  onClick,
  onLike,
  onEdit,
  onLoadComments,
  isSelected
}: PostCardProps) {
  const { user } = useAuth();

  const handleClick = () => {
    onLoadComments(post.id);
    onClick();
  };

  return (
    <div 
      className={`bg-gray-800 rounded-xl overflow-hidden transition-all duration-200 hover:shadow-lg ${
        isSelected ? 'ring-2 ring-trading-accent' : ''
      }`}
    >
      {/* Image Section */}
      {/* Content Section */}
      <div className="p-6">
        {/* Author Info */}
        <div className="flex items-center gap-3 mb-4">
          {post.author_avatar_url ? (
            <img
              src={post.author_avatar_url}
              alt={post.author_username}
              className="w-12 h-12 rounded-full object-cover ring-2 ring-trading-accent/20"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
              <User className="w-5 h-5 text-gray-400" />
            </div>
          )}
          <div>
            <div className="font-semibold">{post.author_username}</div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              {post.trading_pair && (
                <span className="text-trading-accent font-medium">{post.trading_pair}</span>
              )}
              {post.timeframe && (
                <span>• {post.timeframe}</span>
              )}
              <span>• {format(new Date(post.created_at), 'MMM d')}</span>
            </div>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold mb-3 hover:text-trading-accent transition-colors cursor-pointer"
            onClick={handleClick}>
          {post.title}
        </h3>

        {/* Image */}
        {post.image_url && (
          <div 
            className="relative -mx-6 mb-4 cursor-pointer"
            onClick={handleClick}
          >
            <img
              src={post.image_url}
              alt="Trading chart"
              className="w-full object-cover transition-transform duration-300 hover:scale-[1.02]"
            />
          </div>
        )}

        {/* Post Content */}
        <div 
          className="space-y-4 cursor-pointer"
          onClick={handleClick}
        >
          <p className="text-gray-300 line-clamp-2 text-sm">{post.content}</p>

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {post.tags.filter(Boolean).map((tag) => (
                <HashtagLink 
                  key={tag} 
                  tag={tag}
                  className="text-sm hover:underline"
                />
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-700">
          <div className="flex items-center gap-6">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onLike(post.id, post.liked_by_user);
              }}
              className={`flex items-center gap-2 hover:opacity-80 transition-all ${
                post.liked_by_user ? 'text-trading-accent' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Heart className={`w-5 h-5 transition-transform hover:scale-110 ${
                post.liked_by_user ? 'fill-trading-accent text-trading-accent' : ''
              }`} />
              <span className="text-sm font-medium">
                {post.likes_count > 0 && post.likes_count.toLocaleString()}
              </span>
            </button>
            <button 
              onClick={handleClick}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <MessageSquare className="w-5 h-5 transition-transform hover:scale-110" />
              <span className="text-sm font-medium">
                {post.comments_count > 0 && post.comments_count.toLocaleString()}
              </span>
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                // Handle share
                navigator.clipboard.writeText(window.location.href);
              }}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <Share2 className="w-4 h-4 transition-transform hover:scale-110" />
              <span className="text-sm">Share</span>
            </button>
          </div>
          {(user?.id === post.user_id || user?.user_metadata?.role === 'admin') && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(post);
              }}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Edit2 className="w-4 h-4 text-gray-400 hover:text-white" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}