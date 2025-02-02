import React from 'react';
import { Link } from 'react-router-dom';

interface HashtagLinkProps {
  tag: string;
  className?: string;
}

export function HashtagLink({ tag, className = '' }: HashtagLinkProps) {
  const formattedTag = tag.startsWith('#') ? tag.slice(1) : tag;
  
  return (
    <Link 
      to={`/community/tags/${formattedTag}`}
      className={`text-trading-accent hover:underline ${className}`}
    >
      #{formattedTag}
    </Link>
  );
}

export function formatTextWithHashtags(text: string) {
  const hashtagRegex = /#(\w+)/g;
  const parts = text.split(hashtagRegex);

  return parts.map((part, i) => {
    if (i % 2 === 1) {
      return <HashtagLink key={i} tag={part} />;
    }
    return part;
  });
}