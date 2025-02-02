import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { debounce } from '@/utils/debounce';

export interface TypingStatus {
  user_id: string;
  is_typing: boolean;
  last_updated: string;
}

export function useTyping(activeChat: string | null) {
  const { user } = useAuth();
  const [typingUsers, setTypingUsers] = useState<TypingStatus[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  // Debounced function to update typing status
  const updateTypingStatus = debounce(async (chatId: string, isTyping: boolean) => {
    if (!user) return;
    
    try {
      // First try to update existing record
      const { error } = await supabase
        .from('chat_typing_status')
        .update({
          chat_id: chatId,
          user_id: user.id,
          is_typing: isTyping,
          last_updated: new Date().toISOString()
        })
        .eq('chat_id', chatId)
        .eq('user_id', user.id);

      // If no record exists, insert new one
      if (error) {
        const { error: insertError } = await supabase
          .from('chat_typing_status')
          .insert({
            chat_id: chatId,
            user_id: user.id,
            is_typing: isTyping,
            last_updated: new Date().toISOString()
          });

        if (insertError) throw insertError;
      }
    } catch (err) {
      console.error('Failed to update typing status:', err);
    }
  }, 500);

  useEffect(() => {
    if (!activeChat) return;

    const subscription = supabase
      .channel('typing_status')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_typing_status',
          filter: `chat_id=eq.${activeChat}`
        },
        (payload) => {
          setTypingUsers(prev => {
            const newStatus = payload.new as TypingStatus;
            const filtered = prev.filter(s => s.user_id !== newStatus.user_id);
            return [...filtered, newStatus];
          });
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [activeChat]);

  const handleTyping = (chatId: string) => {
    if (!isTyping) {
      setIsTyping(true);
      updateTypingStatus(chatId, true);
    }
  };

  const handleStopTyping = (chatId: string) => {
    if (isTyping) {
      setIsTyping(false);
      updateTypingStatus(chatId, false);
    }
  };

  return {
    typingUsers,
    handleTyping,
    handleStopTyping
  };
}