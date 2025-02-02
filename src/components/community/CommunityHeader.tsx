import React from 'react';
import { Plus } from 'lucide-react';

interface CommunityHeaderProps {
  onNewPost: () => void;
}

export function CommunityHeader({ onNewPost }: CommunityHeaderProps) {
  return (
    <header className="flex justify-between items-center">
      <div>
        <h1 className="text-3xl font-bold text-white">Trading Community</h1>
        <p className="text-gray-400 mt-2">Share insights and learn from fellow traders</p>
      </div>
      <button
        onClick={onNewPost}
        className="flex items-center gap-2 px-4 py-2 bg-trading-accent text-gray-900 rounded-lg hover:bg-opacity-90 transition-colors"
      >
        <Plus className="w-4 h-4" />
        New Post
      </button>
    </header>
  );
}