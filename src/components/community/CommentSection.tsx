import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Heart, MessageCircle, MoreVertical, Trash2, Send, Edit2 } from 'lucide-react';
import { format } from 'date-fns';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';

interface Comment {
  id: string;
  content: string;
  user_id: string;
  edited_at?: string;
  editor_username?: string;
  created_at: string;
  likes_count: number;
  replies_count: number;
  user: {
    username: string;
    avatar_url?: string;
  };
  liked_by_user?: boolean;
}

interface CommentSectionProps {
  postId: string;
  comments: Comment[];
  onCommentAdded: () => void;
}

export function CommentSection({ postId, comments, onCommentAdded }: CommentSectionProps) {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [showReplies, setShowReplies] = useState<Record<string, boolean>>({});
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [loading, setLoading] = useState(false);

  // Subscribe to real-time user metadata updates
  useRealtimeSubscription(
    {
      table: 'users',
      schema: 'auth',
      event: 'UPDATE'
    },
    (payload) => {
      // Update comments with new user metadata
      setComments(prevComments => 
        prevComments.map(comment => 
          comment.user_id === payload.new.id ? {
            ...comment,
            username: payload.new.raw_user_meta_data.username,
            avatar_url: payload.new.raw_user_meta_data.avatar_url
          } : comment
        )
      );
    }
  );

  const getDefaultAvatar = (username: string) => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=7C3AED&color=fff`;
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    setLoading(true);
    try {
      const { error: insertError } = await supabase
        .from('post_comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content: newComment.trim()
        });

      if (insertError) throw insertError;

      setNewComment('');
      onCommentAdded();
    } catch (err) {
      console.error('Error adding comment:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReply = async (commentId: string) => {
    if (!user || !replyContent.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('comment_replies')
        .insert({
          comment_id: commentId,
          user_id: user.id,
          content: replyContent.trim()
        });

      if (error) throw error;

      setReplyContent('');
      setReplyingTo(null);
      onCommentAdded();
    } catch (err) {
      console.error('Error adding reply:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!user || !editContent.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('post_comments')
        .update({ content: editContent.trim() })
        .eq('id', commentId);

      if (error) throw error;

      setEditingComment(null);
      setEditContent('');
      onCommentAdded();
    } catch (err) {
      console.error('Error updating comment:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLikeComment = async (commentId: string, isLiked: boolean) => {
    if (!user) return;

    setLoading(true);
    try {
      if (isLiked) {
        const { error } = await supabase
          .from('comment_likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('comment_likes')
          .insert({
            comment_id: commentId,
            user_id: user.id
          });

        if (error) throw error;
      }

      onCommentAdded();
    } catch (err) {
      console.error('Error toggling like:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('post_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
      onCommentAdded();
    } catch (err) {
      console.error('Error deleting comment:', err);
    }
  };

  const toggleReplies = (commentId: string) => {
    setShowReplies(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  const isModeratorOrAdmin = user?.user_metadata?.role === 'admin' || user?.user_metadata?.role === 'moderator';

  return (
    <div className="space-y-6">
      {/* Comment Form */}
      <form onSubmit={handleSubmitComment} className="flex gap-3">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Añade un comentario..."
          className="flex-1 bg-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-trading-accent focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading || !newComment.trim()}
          className="px-4 py-2 bg-trading-accent text-gray-900 rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>

      {/* Comments List */}
      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="bg-gray-700/50 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                {comment.avatar_url ? (
                  <img
                    src={comment.avatar_url}
                    alt={comment.username}
                    className="w-8 h-8 rounded-full object-cover bg-gray-700"
                    onError={(e) => {
                      e.currentTarget.src = getDefaultAvatar(comment.username);
                    }}
                  />
                ) : (
                  <img
                    src={getDefaultAvatar(comment.username)}
                    alt={comment.username}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                )}
                <div>
                  <p className="font-medium">{comment.username}</p>
                  <p className="text-sm text-gray-400">
                    {format(new Date(comment.created_at), 'MMM d, h:mm a')}{' '}
                    {comment.edited_at && (
                      <span className="text-gray-500">
                        • edited by {comment.editor_username || 'unknown'}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {(user?.id === comment.user_id || isModeratorOrAdmin) && (
                  <button
                    onClick={() => {
                      setEditingComment(comment.id);
                      setEditContent(comment.content);
                    }}
                    className="p-1 hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4 text-gray-400 hover:text-white" />
                  </button>
                )}
                {(user?.id === comment.user_id || isModeratorOrAdmin) && (
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    className="p-1 hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-gray-400 hover:text-trading-danger" />
                  </button>
                )}
                <button className="p-1 hover:bg-gray-600 rounded-lg transition-colors">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>

            {editingComment === comment.id ? (
              <div className="mt-2">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full bg-gray-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-trading-accent focus:outline-none"
                  rows={3}
                />
                <div className="flex justify-end gap-2 mt-2">
                  <button
                    onClick={() => {
                      setEditingComment(null);
                      setEditContent('');
                    }}
                    className="px-3 py-1 text-sm bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => handleEditComment(comment.id)}
                    disabled={loading}
                    className="px-3 py-1 text-sm bg-trading-accent text-gray-900 rounded-lg hover:bg-opacity-90 transition-colors"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="mt-2 text-gray-200">{comment.content}</p>
                {comment.edited_at && (
                  <p className="text-xs text-gray-500 mt-1">
                    editado {format(new Date(comment.edited_at), 'MMM d, h:mm a')}
                    {comment.editor_username && ` por ${comment.editor_username}`}
                  </p>
                )}
              </div>
            )}

            <div className="flex items-center gap-4 mt-3">
              <button
                onClick={() => handleLikeComment(comment.id, comment.liked_by_user)}
                className={`flex items-center gap-1 text-sm hover:opacity-70 transition-all ${
                  comment.liked_by_user ? 'text-trading-accent' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Heart
                  className={`w-4 h-4 ${
                    comment.liked_by_user ? 'fill-trading-accent text-trading-accent' : ''
                  }`}
                />
                <span className="font-medium">
                  {comment.likes_count > 0 && comment.likes_count.toLocaleString()}
                </span>
              </button>

              <button
                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                className="flex items-center gap-1 text-sm text-gray-400 hover:text-white hover:opacity-70 transition-all"
              >
                <MessageCircle className="w-4 h-4" />
                <span className="font-medium">
                  {comment.replies_count > 0 && comment.replies_count.toLocaleString()}
                </span>
              </button>
            </div>

            {/* Reply Form */}
            {replyingTo === comment.id && (
              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Escribe una respuesta..."
                  className="flex-1 bg-gray-700 rounded-lg px-3 py-1.5 text-sm text-white focus:ring-2 focus:ring-trading-accent focus:outline-none"
                />
                <button
                  onClick={() => handleSubmitReply(comment.id)}
                  disabled={loading || !replyContent.trim()}
                  className="px-3 py-1.5 bg-trading-accent text-gray-900 rounded-lg text-sm hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Responder
                </button>
              </div>
            )}

            {/* Show/Hide Replies */}
            {comment.replies_count > 0 && (
              <button
                onClick={() => toggleReplies(comment.id)}
                className="mt-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                {showReplies[comment.id] ? 'Ocultar respuestas' : `Ver ${comment.replies_count} respuestas`}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}