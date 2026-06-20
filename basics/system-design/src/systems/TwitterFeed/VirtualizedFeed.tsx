import React, { useEffect, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Post } from './Post';
import type { Post as PostType } from '@/types';

interface Props {
  posts: PostType[];
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
}

export function VirtualizedFeed({ posts, fetchNextPage, hasNextPage, isFetchingNextPage }: Props) {
  const parentRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: posts.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 140,
    overscan: 5,
  });

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage();
      },
      { rootMargin: '200px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  return (
    <div
      ref={parentRef}
      style={{ overflow: 'auto', height: '70vh', border: '1px solid #334155', borderRadius: 8 }}
    >
      <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
        {virtualizer.getVirtualItems().map(vItem => (
          <div
            key={vItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${vItem.start}px)`,
            }}
          >
            <Post post={posts[vItem.index]} />
          </div>
        ))}
      </div>
      <div ref={sentinelRef} style={{ padding: 16, textAlign: 'center', color: '#64748b' }}>
        {isFetchingNextPage ? 'Loading more…' : hasNextPage ? '' : 'All caught up ✓'}
      </div>
    </div>
  );
}
