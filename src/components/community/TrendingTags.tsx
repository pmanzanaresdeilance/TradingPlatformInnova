import React from 'react';
import { TrendingUp } from 'lucide-react';
import { HashtagLink } from './HashtagLink';

interface TrendingTagsProps {
  tags: { topic: string; count: number }[];
}

export function TrendingTags({ tags }: TrendingTagsProps) {
  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-trading-accent" />
        Trending Topics
      </h2>
      {tags && tags.length > 0 ? (
        <div className="space-y-3">
          {tags.map(({ topic, count }) => (
            <div
              key={topic}
              className="w-full p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between gap-2">
                <HashtagLink tag={topic} />
                {count > 0 && (
                  <span className="text-sm text-gray-400 shrink-0">{count} posts</span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-400 py-4">
          No trending topics yet
        </div>
      )}
    </div>
  );
}