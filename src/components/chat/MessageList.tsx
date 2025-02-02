import React from 'react';
import { Message } from '@/types/chat';
import { MessageItem } from './MessageItem';

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  onEditMessage: (messageId: string, content: string) => void;
  onDeleteMessage: (messageId: string) => void;
}

export function MessageList({ 
  messages, 
  currentUserId,
  onEditMessage,
  onDeleteMessage
}: MessageListProps) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => (
        <MessageItem
          key={message.id}
          message={message}
          isOwn={message.user_id === currentUserId}
          onEdit={onEditMessage}
          onDelete={onDeleteMessage}
        />
      ))}
    </div>
  );
}