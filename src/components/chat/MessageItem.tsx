import React, { useState, useRef, useEffect } from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import type { Message } from '@/types/chat';
import { createPortal } from 'react-dom';

interface MessageItemProps {
  message: Message;
  isOwn: boolean;
  onEdit: (messageId: string, content: string) => void;
  onDelete: (messageId: string) => void;
}

export function MessageItem({ message, isOwn, onEdit, onDelete }: MessageItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const messageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (messageRef.current && !messageRef.current.contains(event.target as Node)) {
        setShowDeleteConfirm(false);
        setShowActions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTouchStart = () => {
    const timer = setTimeout(() => {
      setShowActions(true);
    }, 500); // 500ms long press
    setLongPressTimer(timer);
  };

  const handleTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handleSave = () => {
    onEdit(message.id, editContent);
    setIsEditing(false);
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };
  
  const confirmDelete = async () => {
    try {
      setIsDeleting(true);
      if (message.id) {
        await onDelete(message.id);
        setShowDeleteConfirm(false);
        setShowActions(false);
      }
    } catch (error) {
      console.error('Failed to delete message:', error);
      // Keep modal open on error
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div 
      ref={messageRef}
      className={`flex items-start gap-3 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => !showDeleteConfirm && setShowActions(false)}
    >
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-gray-700 flex-shrink-0 overflow-hidden">
        {message.avatar_url ? (
          <img
            src={message.avatar_url}
            alt={message.username || 'User'}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = `https://ui-avatars.com/api/?name=${
                encodeURIComponent(message.username || 'U')
              }&background=7C3AED&color=fff`;
            }}
          />
        ) : (
          <div className={`w-full h-full flex items-center justify-center font-medium ${
            isOwn ? 'bg-trading-accent text-gray-900' : 'bg-gray-600 text-white'
          }`}>
            {(message.username || 'U')[0].toUpperCase()}
          </div>
        )}
      </div>

      {/* Message Content */}
      <div className={`max-w-[70%] ${
        isOwn ? 'bg-trading-accent text-gray-900' : 'bg-gray-700 text-white'
      } rounded-lg px-4 py-2 relative group`}>
        {/* Message content */}
        {!isOwn && (
          <p className="text-xs text-gray-400 mb-1">{message.username || 'Unknown'}</p>
        )}
        {isEditing ? (
          <div className="space-y-2">
            <input
              type="text"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full bg-gray-800 rounded px-2 py-1 text-white"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsEditing(false)}
                className="text-xs px-2 py-1 rounded bg-gray-600 hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="text-xs px-2 py-1 rounded bg-trading-accent text-gray-900"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <p>{message.content}</p>
        )}
        <p className="text-xs mt-1 opacity-60">
          {new Date(message.created_at).toLocaleTimeString()}
          {message.edited_at && ' (edited)'}
        </p>
        {isOwn && !isEditing && (
          <div className={`absolute top-2 right-2 transition-opacity flex gap-1 ${
            showActions ? 'opacity-100' : 'opacity-0'
          }`}>
            <button
              onClick={() => setIsEditing(true)}
              className="p-1 hover:bg-gray-600/20 rounded"
            >
              <Edit2 className="w-3 h-3" />
            </button>
            <button
              onClick={handleDelete}
              className="p-1 hover:bg-gray-600/20 rounded"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setShowDeleteConfirm(false)}
          />
          <div className="relative bg-gray-800 rounded-xl p-6 max-w-sm w-full mx-4 animate-in fade-in slide-in-from-bottom-4 duration-200 border border-gray-700/50">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold mb-2">Delete Message</h3>
              <p className="text-gray-400">
                Are you sure you want to delete this message? This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2.5 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 bg-trading-danger text-white rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete Message
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}