import React from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';

interface NotificationBellProps {
  onClick: () => void;
}

export function NotificationBell({ onClick }: NotificationBellProps) {
  const { unreadCount } = useNotifications();

  return (
    <button
      onClick={onClick}
      className="p-2 rounded-lg hover:bg-gray-800 transition-colors relative group"
    >
      <Bell className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-trading-accent text-gray-900 rounded-full text-xs font-medium flex items-center justify-center">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
}