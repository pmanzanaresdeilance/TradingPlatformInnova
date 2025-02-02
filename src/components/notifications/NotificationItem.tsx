import React from 'react';
import { format } from 'date-fns';
import { Check } from 'lucide-react';
import type { Notification } from '@/hooks/useNotifications';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
}

export function NotificationItem({ notification, onMarkAsRead }: NotificationItemProps) {
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'follow':
        return '👥';
      case 'like_post':
        return '❤️';
      case 'comment_post':
        return '💬';
      case 'mention':
        return '@️';
      case 'trade_shared':
        return '📊';
      case 'class_reminder':
        return '🎓';
      case 'class_cancelled':
        return '❌';
      case 'recording_available':
        return '🎥';
      case 'achievement':
        return '🏆';
      default:
        return '📢';
    }
  };

  return (
    <div
      className={`p-4 hover:bg-gray-700/50 transition-colors ${
        notification.read === false ? 'bg-gray-700/20' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Actor Avatar */}
        {notification.actor_avatar_url ? (
          <img
            src={notification.actor_avatar_url}
            alt={notification.actor_username}
            className="w-10 h-10 rounded-full object-cover"
            onError={(e) => {
              e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                notification.actor_username || ''
              )}&background=7C3AED&color=fff`;
            }}
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
            <span className="text-lg">{getNotificationIcon(notification.type)}</span>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm">
            <span className="font-medium">{notification.actor_username}</span>{' '}
            <span className="text-gray-300">{notification.content}</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {format(new Date(notification.created_at), 'MMM d, h:mm a')}
          </p>
        </div>

        {/* Mark as Read Button */}
        {notification.read === false && (
          <button
            onClick={() => onMarkAsRead(notification.id)}
            className="shrink-0 p-1 hover:bg-gray-600 rounded-lg transition-colors"
          >
            <Check className="w-4 h-4 text-trading-accent" />
          </button>
        )}
      </div>
    </div>
  );
}