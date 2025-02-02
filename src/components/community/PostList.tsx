import React from 'react';
import { Post } from '@/types/community';
import { PostCard } from './PostCard';

interface PostListProps {
  posts: Post[];
  onPostClick: (post: Post) => void;
  onLike: (postId: string, isLiked: boolean) => Promise<void>;
  onEdit: (post: Post) => void;
  onLoadComments: (postId: string) => Promise<void>;
  selectedPost: string | null;
}

export function PostList({
  posts,
  onPostClick,
  onLike,
  onEdit,
  onLoadComments,
  selectedPost
}: PostListProps) {
  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          onClick={() => onPostClick(post)}
          onLike={onLike}
          onEdit={onEdit}
          onLoadComments={onLoadComments}
          isSelected={selectedPost === post.id}
        />
      ))}
    </div>
  );
}