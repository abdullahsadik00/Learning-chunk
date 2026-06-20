import React, { useState, useCallback } from 'react';
import type { Message } from '@/types';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  authorName: string;
  showAuthor: boolean;
}

const STATUS_ICONS: Record<string, string> = {
  sending: '○',
  sent: '✓',
  delivered: '✓✓',
  read: '✓✓',
};

function formatTime(timestamp: string): string {
  const d = new Date(timestamp);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

const EMOJI_OPTIONS = ['👍', '❤️', '😂'];

export function MessageBubble({ message, isOwn, authorName, showAuthor }: MessageBubbleProps) {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [reactions, setReactions] = useState<string[]>([]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  }, []);

  const handleAddReaction = useCallback((emoji: string) => {
    setReactions(prev => [...prev, emoji]);
    setContextMenu(null);
  }, []);

  const handleDismissMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const bubbleBg = isOwn ? '#3b82f6' : '#1e293b';
  const bubbleBorder = isOwn ? 'none' : '1px solid #334155';

  return (
    <>
      {/* Invisible overlay to dismiss context menu */}
      {contextMenu && (
        <div
          onClick={handleDismissMenu}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10,
          }}
        />
      )}

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: isOwn ? 'flex-end' : 'flex-start',
          marginBottom: 4,
        }}
      >
        {/* Author name */}
        {showAuthor && !isOwn && (
          <span
            style={{
              color: '#94a3b8',
              fontSize: 12,
              fontWeight: 600,
              marginBottom: 2,
              paddingLeft: 4,
            }}
          >
            {authorName}
          </span>
        )}

        {/* Bubble */}
        <div
          onContextMenu={handleContextMenu}
          style={{
            background: bubbleBg,
            border: bubbleBorder,
            borderRadius: isOwn ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
            color: '#f1f5f9',
            cursor: 'default',
            fontSize: 14,
            lineHeight: 1.5,
            maxWidth: '68%',
            padding: '10px 14px',
            position: 'relative',
            userSelect: 'text',
            wordBreak: 'break-word',
          }}
        >
          {message.content}

          {/* Timestamp + status */}
          <div
            style={{
              alignItems: 'center',
              display: 'flex',
              gap: 4,
              justifyContent: 'flex-end',
              marginTop: 4,
            }}
          >
            <span style={{ color: isOwn ? 'rgba(255,255,255,0.6)' : '#64748b', fontSize: 11 }}>
              {formatTime(message.timestamp)}
            </span>
            {isOwn && (
              <span
                style={{
                  color: message.status === 'read' ? '#60a5fa' : 'rgba(255,255,255,0.6)',
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                {STATUS_ICONS[message.status]}
              </span>
            )}
          </div>
        </div>

        {/* Reactions */}
        {reactions.length > 0 && (
          <div
            style={{
              display: 'flex',
              gap: 4,
              marginTop: 4,
              flexWrap: 'wrap',
              justifyContent: isOwn ? 'flex-end' : 'flex-start',
            }}
          >
            {reactions.map((emoji, i) => (
              <span
                key={i}
                style={{
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: 12,
                  fontSize: 14,
                  padding: '2px 8px',
                }}
              >
                {emoji}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Context menu */}
      {contextMenu && (
        <div
          style={{
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: 10,
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            display: 'flex',
            gap: 4,
            left: contextMenu.x,
            padding: 8,
            position: 'fixed',
            top: contextMenu.y,
            zIndex: 20,
          }}
        >
          {EMOJI_OPTIONS.map(emoji => (
            <button
              key={emoji}
              onClick={() => handleAddReaction(emoji)}
              style={{
                background: 'transparent',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 20,
                padding: '4px 8px',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = '#334155';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
