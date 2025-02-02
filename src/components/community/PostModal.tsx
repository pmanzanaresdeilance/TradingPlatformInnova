import React, { useState, useEffect } from 'react';
import { X, Heart, MessageSquare, Share2, User, Edit2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { CommentSection } from './CommentSection';
import { supabase } from '@/lib/supabase';
import { Comment } from '@/types/community';

interface Post {
  id: string;
  user_id: string;
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

interface PostModalProps {
  post: Post;
  isOpen: boolean;
  onClose: () => void;
  onLike: (postId: string, isLiked: boolean) => Promise<void>;
  onEdit?: (post: Post) => void;
}

export function PostModal({ post, isOpen, onClose, onLike, onEdit }: PostModalProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);

  // Ensure tags is always an array
  const tags = post.tags || [];

  useEffect(() => {
    if (isOpen) {
      loadComments();
    }
  }, [isOpen, post.id]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('comment_details')
        .select('*')
        .eq('post_id', post.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading comments:', error);
        return;
      }
      
      setComments(data || []);
    } catch (err) {
      console.error('Error loading comments:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-gray-800 w-full max-w-[95vw] h-[90vh] flex overflow-hidden rounded-xl mx-4">
        {/* Left side - Image */}
        <div className="w-[80%] bg-gray-900 flex items-center justify-center">
          {post.image_url ? (
            <div className="relative w-full h-full">
              <img
                src={post.image_url}
                alt="Post content"
                className="absolute inset-0 w-full h-full object-contain bg-gray-900"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-gray-900/10" />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full w-full bg-gray-800/50">
              <p className="text-gray-400">No image available</p>
            </div>
          )}
        </div>

        {/* Right side - Content & Comments */}
        <div className="w-[20%] flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {post.author_avatar_url ? (
                <img
                  src={post.author_avatar_url}
                  alt={post.author_username}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                  <User className="w-6 h-6 text-gray-400" />
                </div>
              )}
              <div>
                <p className="font-medium">{post.author_username}</p>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  {post.trading_pair && (
                    <span className="text-trading-accent text-xs">{post.trading_pair}</span>
                  )}
                  {post.timeframe && <span className="text-xs">{post.timeframe}</span>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {(user?.id === post.user_id || user?.user_metadata?.role === 'admin') && (
                <button
                  onClick={() => onEdit?.(post)}
                  className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4 text-gray-400 hover:text-white" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-3 border-b border-gray-700">
            <h2 className="text-lg font-semibold mb-3">{post.title}</h2>
            <p className="text-gray-300 mb-3 text-sm">{post.content}</p>
            
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 bg-gray-700 rounded-lg text-xs text-gray-300"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            <div className="text-xs text-gray-400">
              {format(new Date(post.created_at), 'MMM d, yyyy h:mm a')}
            </div>
          </div>

          {/* Interactions */}
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center gap-6">
              <button 
                onClick={() => onLike(post.id, post.liked_by_user)}
                className={`flex items-center gap-2 hover:opacity-70 transition-all ${
                  post.liked_by_user ? 'text-trading-accent' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Heart className={`w-5 h-5 ${
                  post.liked_by_user ? 'fill-trading-accent text-trading-accent' : ''
                }`} />
                <span className="text-sm font-medium">
                  {post.likes_count > 0 && post.likes_count.toLocaleString()}
                </span>
              </button>
              <button 
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <MessageSquare className="w-5 h-5" />
                <span className="text-sm font-medium">
                  {post.comments_count > 0 && post.comments_count.toLocaleString()}
                </span>
              </button>
              <button className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                <Share2 className="w-4 h-4" />
                Share
              </button>
            </div>
          </div>

          {/* Comments */}
          <div className="flex-1 overflow-y-auto p-4">
            <CommentSection
              postId={post.id}
              comments={comments}
              onCommentAdded={loadComments}
            />
          </div>
        </div>
      </div>
    </div>
  );
}