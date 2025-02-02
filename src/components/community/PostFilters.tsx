import React from 'react';
import { Filter, Search } from 'lucide-react';

interface PostFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  categories: string[];
}

export function PostFilters({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories
}: PostFiltersProps) {
  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-gray-700 rounded-lg pl-10 pr-4 py-2 text-white focus:ring-2 focus:ring-trading-accent focus:outline-none"
            />
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-gray-400" />
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => onCategoryChange(
                  selectedCategory === category ? null : category
                )}
                className={`px-3 py-1 rounded-full text-sm ${
                  selectedCategory === category
                    ? 'bg-trading-accent text-gray-900'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                } transition-colors`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}