import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Send, Loader2, ChevronDown, Edit2, Trash2, Plus, Users, Settings } from 'lucide-react';
import type { Message, ChatRoom } from '@/types/chat';
import { MessageList } from '@/components/chat/MessageList';

export default function Support() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [channels, setChannels] = useState<any[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [privateChats, setPrivateChats] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [showNewRoomModal, setShowNewRoomModal] = useState(false);
  const [showRoomSettings, setShowRoomSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load initial messages
  const loadMessages = async () => {
    if (!user || (!selectedChannel && !selectedChat)) return;
    
    try {
      setLoading(true);
      let query = supabase
        .from('message_details')
        .select('*')
        .order('created_at', { ascending: true });

      if (selectedChannel) {
        query = query.eq('room_id', selectedChannel);
      } else if (selectedChat) {
        query = query.eq('recipient_id', selectedChat);
      }

      const { data, error } = await query;
      if (error) throw error;

      setMessages(data || []);
    } catch (err) {
      console.error('Error loading messages:', err);
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user || (!selectedChannel && !selectedChat)) return;

    // Load initial messages
    loadMessages();

    // Set up real-time subscription
    const channel = supabase.channel('messages')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: selectedChannel 
          ? `room_id=eq.${selectedChannel}` : 
          selectedChat 
            ? `recipient_id=eq.${selectedChat}` : 
            undefined
      }, async (payload) => {
        console.log('Received message update:', payload);

        if (payload.eventType === 'INSERT') {
          const { data: messageData } = await supabase
            .from('message_details')
            .select('*')
            .eq('id', payload.new.id)
            .single();

          if (messageData) {
            console.log('Adding new message:', messageData);
            setMessages(prev => [...prev, messageData]);
            scrollToBottom();
          }
        } else if (payload.eventType === 'UPDATE') {
          const { data: messageData } = await supabase
            .from('message_details')
            .select('*')
            .eq('id', payload.new.id)
            .single();

          if (messageData) {
            console.log('Updating message:', messageData);
            setMessages(prev => prev.map(msg =>
              msg.id === messageData.id ? messageData : msg
            ));
          }
        } else if (payload.eventType === 'DELETE' && payload.old) {
          setMessages(prev => prev.filter(msg => msg.id !== payload.old.id));
        }
        scrollToBottom();
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user?.id, selectedChannel, selectedChat]);

  const loadChannels = async () => {
    try {
      const { data: channelsData, error: channelsError } = await supabase
        .from('chat_rooms')
        .select('*')
        .order('created_at', { ascending: true });

      if (channelsError) throw channelsError;
      setChannels(channelsData || []);

      // Select first channel by default if none selected
      if (channelsData?.length > 0 && !selectedChannel) {
        setSelectedChannel(channelsData[0].id);
      }
    } catch (err) {
      console.error('Error loading channels:', err);
    }
  };

  const canEditMessage = (message: Message) => {
    return user?.id === message.user_id;
  };

  const handleEditMessage = async (messageId: string, newContent: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ 
          content: newContent,
          edited_at: new Date().toISOString()
        })
        .eq('id', messageId);

      if (error) throw error;
      setEditingMessage(null);
      setEditContent('');
    } catch (err) {
      console.error('Error editing message:', err);
      setError('Failed to edit message');
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      // First find the message to be deleted
      const messageToDelete = messages.find(m => m.id === messageId);
      if (!messageToDelete) {
        throw new Error('Message not found');
      }

      // Optimistically remove the message from the UI
      setMessages(prev => prev.filter(m => m.id !== messageId));

      const { error } = await supabase
        .from('messages')
        .delete()
        .match({ id: messageId, user_id: user?.id });

      if (error) {
        // If deletion fails, restore the message
        setMessages(prev => [...prev, messageToDelete]);
        throw new Error('Failed to delete message');
      }
    } catch (err) {
      console.error('Error deleting message:', err);
      throw err;
    }
  };

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  const scrollToBottom = () => {
    if (messagesEndRef.current && messages.length > 0) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end'
      });
    }
  };

  // Load channels when user changes
  useEffect(() => {
    if (user) {
      loadChannels();
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newMessage.trim()) return;
    
    const messageContent = newMessage.trim();
    setNewMessage(''); // Clear input immediately for better UX

    try {
      const messageData = {
        content: messageContent,
        user_id: user.id,
        room_id: selectedChannel,
        recipient_id: selectedChat
      };

      console.log('Sending message:', messageData);
      const { error } = await supabase
        .from('messages')
        .insert(messageData);

      if (error) {
        setNewMessage(messageContent); // Restore message if error
        console.error('Error sending message:', error);
        throw error;
      }

      setError(null);
    } catch (err) {
      setNewMessage(messageContent); // Restore message if error
      console.error('Error sending message:', err);
      setError('Failed to send message');
    }
  };

  if (!user) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-medium text-gray-300 mb-2">Please sign in to access support</h2>
          <p className="text-gray-400">You need to be logged in to chat with our support team.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <header className="p-4 border-b border-gray-800 bg-gray-900/50 backdrop-blur-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Chat</h1>
            <p className="text-gray-400">
              {selectedChannel ? 'Channel: ' : selectedChat ? 'Private chat with: ' : 'Select a channel'}
              <span className="text-trading-accent">
                {selectedChannel 
                  ? channels.find(c => c.id === selectedChannel)?.name 
                  : selectedChat ? privateChats.find(c => c.id === selectedChat)?.username
                  : ''}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowNewRoomModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-trading-accent text-gray-900 rounded-lg hover:bg-opacity-90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Room
            </button>
            {selectedChannel && (
              <button
                onClick={() => setShowRoomSettings(true)}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>
            )}
            <select
              value={selectedChannel || ''}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedChannel(value || null);
                setSelectedChat(null);
              }}
              className="bg-gray-800 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-trading-accent focus:outline-none"
            >
              <option value="">Select Channel</option>
              {channels.map(channel => (
                <option key={channel.id} value={channel.id}>
                  {channel.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>
      
      {loading ? (
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin text-trading-accent" />
        </div>
      ) : !selectedChannel && !selectedChat ? (
        <div className="flex items-center justify-center h-full text-gray-400">
          Select a channel to start chatting
        </div>
      ) : messages.length === 0 ? (
        <div className="flex items-center justify-center h-full text-gray-400">
          No messages yet. Start the conversation!
        </div>
      ) : (
        <MessageList
          messages={messages}
          currentUserId={user?.id || ''}
          onEditMessage={handleEditMessage}
          onDeleteMessage={handleDeleteMessage}
        />
      )}
      <div ref={messagesEndRef} />

      {/* Message Input */}
      {(selectedChannel || selectedChat) && (
        <form
          onSubmit={handleSubmit}
          className="p-4 border-t border-gray-800 bg-gray-900/50 backdrop-blur-lg"
        >
          {error && (
            <p className="text-sm text-trading-danger mb-2">{error}</p>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 bg-gray-800 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-trading-accent focus:outline-none"
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="px-4 py-2 bg-trading-accent text-gray-900 rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>
      )}

      {/* New Room Modal */}
      {showNewRoomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowNewRoomModal(false)} />
          <div className="relative bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Create New Room</h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const formData = new FormData(form);
              
              try {
                const { error } = await supabase
                  .from('chat_rooms')
                  .insert({
                    name: formData.get('name') as string,
                    description: formData.get('description') as string,
                    is_private: formData.get('isPrivate') === 'true',
                    created_by: user?.id,
                    type: formData.get('type') === 'channel' ? 'channel' : 'private'
                  });

                if (error) throw error;
                setShowNewRoomModal(false);
              } catch (err) {
                console.error('Error creating room:', err);
                setError('Failed to create room');
              }
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Room Name
                  </label>
                  <input
                    name="name"
                    type="text"
                    required
                    className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-trading-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-trading-accent focus:outline-none"
                    rows={3}
                  />
                </div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="isPrivate"
                    value="true"
                    className="rounded bg-gray-700 border-gray-600 text-trading-accent focus:ring-trading-accent"
                  />
                  <span className="text-sm text-gray-400">Private Room</span>
                </label>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Room Type
                  </label>
                  <select
                    name="type"
                    className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-trading-accent focus:outline-none"
                    defaultValue="private"
                  >
                    <option value="private">Private Group</option>
                    <option value="channel">Channel</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowNewRoomModal(false)}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-trading-accent text-gray-900 rounded-lg hover:bg-opacity-90 transition-colors"
                >
                  Create Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Room Settings Modal */}
      {showRoomSettings && selectedChannel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowRoomSettings(false)} />
          <div className="relative bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Room Settings</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Members</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {channels.find(c => c.id === selectedChannel)?.members?.map((memberId: string) => (
                    <div key={memberId} className="flex items-center justify-between p-2 bg-gray-700/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gray-600" />
                        <span>{memberId}</span>
                      </div>
                      <button className="text-trading-danger hover:text-trading-danger/80">
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => {
                    // Add member logic
                  }}
                  className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  <Users className="w-4 h-4" />
                  Add Member
                </button>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => setShowRoomSettings(false)}
                  className="px-4 py-2 bg-trading-accent text-gray-900 rounded-lg hover:bg-opacity-90 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}