import React, { useState } from 'react';
import { useLikePost } from './useFeed';
import type { Post as PostType } from '@/types';

interface Props {
  post: PostType;
}

function formatCount(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(n);
}

function formatTimestamp(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const styles = {
  card: {
    backgroundColor: '#1e293b',
    borderBottom: '1px solid #334155',
    padding: '12px 16px',
    display: 'flex',
    gap: 12,
    cursor: 'pointer',
  } as React.CSSProperties,
  avatar: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    flexShrink: 0,
    objectFit: 'cover' as const,
  } as React.CSSProperties,
  body: {
    flex: 1,
    minWidth: 0,
  } as React.CSSProperties,
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
    flexWrap: 'wrap' as const,
  } as React.CSSProperties,
  name: {
    color: '#f1f5f9',
    fontWeight: 700,
    fontSize: 14,
    whiteSpace: 'nowrap' as const,
  } as React.CSSProperties,
  handle: {
    color: '#64748b',
    fontSize: 13,
    whiteSpace: 'nowrap' as const,
  } as React.CSSProperties,
  dot: {
    color: '#64748b',
    fontSize: 13,
  } as React.CSSProperties,
  time: {
    color: '#64748b',
    fontSize: 13,
  } as React.CSSProperties,
  content: {
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 1.5,
    marginBottom: 10,
    wordBreak: 'break-word' as const,
  } as React.CSSProperties,
  actions: {
    display: 'flex',
    gap: 24,
  } as React.CSSProperties,
  actionBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px 0',
    fontSize: 13,
    color: '#64748b',
    transition: 'color 0.15s',
  } as React.CSSProperties,
};

export function Post({ post }: Props) {
  const likeMutation = useLikePost();
  const [retweeted, setRetweeted] = useState(post.retweeted);
  const [localRetweets, setLocalRetweets] = useState(post.retweets);

  function handleLike() {
    likeMutation.mutate({ postId: post.id, liked: !post.liked });
  }

  function handleRetweet() {
    const next = !retweeted;
    setRetweeted(next);
    setLocalRetweets(prev => (next ? prev + 1 : prev - 1));
  }

  return (
    <div style={styles.card}>
      <img src={post.author.avatar} alt={post.author.name} style={styles.avatar} />
      <div style={styles.body}>
        <div style={styles.header}>
          <span style={styles.name}>{post.author.name}</span>
          <span style={styles.handle}>@{post.author.handle}</span>
          <span style={styles.dot}>·</span>
          <span style={styles.time}>{formatTimestamp(post.timestamp)}</span>
        </div>
        <p style={styles.content}>{post.content}</p>
        <div style={styles.actions}>
          {/* Reply */}
          <button style={styles.actionBtn} type="button">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span>{formatCount(post.replies)}</span>
          </button>

          {/* Retweet */}
          <button
            style={{
              ...styles.actionBtn,
              color: retweeted ? '#22c55e' : '#64748b',
            }}
            type="button"
            onClick={handleRetweet}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="17 1 21 5 17 9" />
              <path d="M3 11V9a4 4 0 0 1 4-4h14" />
              <polyline points="7 23 3 19 7 15" />
              <path d="M21 13v2a4 4 0 0 1-4 4H3" />
            </svg>
            <span>{formatCount(localRetweets)}</span>
          </button>

          {/* Like */}
          <button
            style={{
              ...styles.actionBtn,
              color: post.liked ? '#ef4444' : '#64748b',
            }}
            type="button"
            onClick={handleLike}
            disabled={likeMutation.isPending}
          >
            {post.liked ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#ef4444" stroke="#ef4444" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            )}
            <span>{formatCount(post.likes)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
