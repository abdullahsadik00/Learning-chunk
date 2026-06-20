import React, { useState } from 'react';
import { useFeed } from './useFeed';
import { VirtualizedFeed } from './VirtualizedFeed';
import type { FeedFilters } from './types';

const styles = {
  wrapper: {
    maxWidth: 600,
    margin: '0 auto',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  } as React.CSSProperties,
  header: {
    backgroundColor: '#0f172a',
    borderBottom: '1px solid #334155',
    position: 'sticky' as const,
    top: 0,
    zIndex: 10,
  } as React.CSSProperties,
  title: {
    color: '#f1f5f9',
    fontSize: 18,
    fontWeight: 700,
    padding: '12px 16px 0',
  } as React.CSSProperties,
  tabs: {
    display: 'flex',
  } as React.CSSProperties,
  tab: (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: '12px 0',
    background: 'none',
    border: 'none',
    borderBottom: active ? '2px solid #3b82f6' : '2px solid transparent',
    color: active ? '#f1f5f9' : '#64748b',
    fontWeight: active ? 700 : 400,
    fontSize: 14,
    cursor: 'pointer',
    transition: 'color 0.15s, border-color 0.15s',
  }),
  meta: {
    color: '#64748b',
    fontSize: 12,
    padding: '8px 16px',
    backgroundColor: '#0f172a',
  } as React.CSSProperties,
  skeleton: {
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    borderRadius: 8,
    overflow: 'hidden',
  } as React.CSSProperties,
  skeletonItem: {
    display: 'flex',
    gap: 12,
    padding: '12px 16px',
    borderBottom: '1px solid #334155',
  } as React.CSSProperties,
  skeletonAvatar: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    backgroundColor: '#334155',
    flexShrink: 0,
  } as React.CSSProperties,
  skeletonLines: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
  } as React.CSSProperties,
  skeletonLine: (width: string): React.CSSProperties => ({
    height: 12,
    borderRadius: 6,
    backgroundColor: '#334155',
    width,
  }),
  error: {
    color: '#f87171',
    padding: 16,
    textAlign: 'center' as const,
    fontSize: 14,
  } as React.CSSProperties,
};

function LoadingSkeleton() {
  return (
    <div style={styles.skeleton}>
      {[1, 2, 3].map(i => (
        <div key={i} style={styles.skeletonItem}>
          <div style={styles.skeletonAvatar} />
          <div style={styles.skeletonLines}>
            <div style={styles.skeletonLine('40%')} />
            <div style={styles.skeletonLine('90%')} />
            <div style={styles.skeletonLine('75%')} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TwitterFeedDemo() {
  const [activeTab, setActiveTab] = useState<FeedFilters['tab']>('for-you');
  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = useFeed();

  const allPosts = data?.pages.flatMap(p => p.posts) ?? [];

  return (
    <div style={styles.wrapper}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>

      <div style={styles.header}>
        <div style={styles.title}>Home</div>
        <div style={styles.tabs}>
          <button
            style={styles.tab(activeTab === 'for-you')}
            onClick={() => setActiveTab('for-you')}
          >
            For You
          </button>
          <button
            style={styles.tab(activeTab === 'following')}
            onClick={() => setActiveTab('following')}
          >
            Following
          </button>
        </div>
      </div>

      {!isLoading && (
        <div style={styles.meta}>{allPosts.length} posts loaded</div>
      )}

      {isLoading && <LoadingSkeleton />}

      {isError && (
        <div style={styles.error}>Failed to load feed. Please try again.</div>
      )}

      {!isLoading && !isError && (
        <VirtualizedFeed
          posts={allPosts}
          fetchNextPage={fetchNextPage}
          hasNextPage={!!hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
        />
      )}
    </div>
  );
}

export default TwitterFeedDemo;
