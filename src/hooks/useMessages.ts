import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { fetchMessages, sendSupportMessage, createNewChat, deleteMessage, updateMessageStatus } from '@/services/support';
import type { SupportMessage } from '@/types';

export function useMessages(activeChat: string | null, isSupport: boolean) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<SupportMessage | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeChat || !user) return;

    const loadMessages = async () => {
      setLoadingMessages(true);
      setError(null);
      try {
        const data = await fetchMessages(activeChat, isSupport);
        setMessages(data);
      } catch (err) {
        console.error('Error loading messages:', err);
        setError('Failed to load messages');
      } finally {
        setLoadingMessages(false);
      }
    };

    loadMessages();

    // Subscribe to message changes
    const subscription = supabase
      .channel('messages_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_messages',
          filter: `chat_id=eq.${activeChat}`
        },
        handleMessageChange
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [activeChat, user, isSupport]);

  const handleMessageChange = (payload: any) => {
    if (payload.eventType === 'INSERT') {
      setMessages(prev => [...prev, payload.new]);
    } else if (payload.eventType === 'UPDATE') {
      setMessages(prev =>
        prev.map(msg =>
          msg.id === payload.new.id ? payload.new : msg
        )
      );
    } else if (payload.eventType === 'DELETE') {
      setMessages(prev =>
        prev.filter(msg => msg.id !== payload.old.id)
      );
    }
  };

  const sendMessage = async (content: string, replyToId?: string) => {
    if (!user) throw new Error('Must be logged in to send messages');
    if (!content.trim()) throw new Error('Message cannot be empty');
    if (!activeChat && !content.trim()) throw new Error('Must have active chat or message content');

    let chatId = activeChat;

    try {
      // Create new chat if needed
      if (!chatId) {
        const newChatId = await createNewChat(user.id, content);
        setActiveChat(newChatId);
        chatId = newChatId;
      }

      const newMessage = await sendSupportMessage(
        chatId,
        user.id,
        content,
        isSupport,
        replyToId
      );

      setMessages(prev => [...prev, newMessage]);
      return newMessage;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to send message');
      console.error('Failed to send message:', error);
      throw error;
    }
  };

  const deleteMessageById = async (messageId: string) => {
    if (!isSupport) throw new Error('Only support agents can delete messages');

    try {
      await deleteMessage(messageId);
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    } catch (err) {
      throw new Error('Failed to delete message');
    }
  };

  const selectMessage = (message: SupportMessage) => {
    setSelectedMessage(message);
  };
  const updateStatus = async (messageId: string, status: 'sent' | 'delivered' | 'read') => {
    try {
      await updateMessageStatus(messageId, status);
    } catch (err) {
      console.error('Failed to update message status:', err);
    }
  };

  return {
    messages,
    loadingMessages,
    selectedMessage,
    sendMessage,
    deleteMessage: deleteMessageById,
    selectMessage,
    updateStatus,
    error
  };
}