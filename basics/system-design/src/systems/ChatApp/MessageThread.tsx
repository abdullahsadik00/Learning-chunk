import React, { useEffect, useRef } from 'react';
import type { Message, User } from '@/types';
import { MessageBubble } from './MessageBubble';

interface MessageThreadProps {
  messages: Message[];
  currentUserId: string;
  participants: User[];
}

function isSameDay(a: string, b: string): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

function formatDateLabel(timestamp: string): string {
  const d = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (isSameDay(timestamp, today.toISOString())) return 'Today';
  if (isSameDay(timestamp, yesterday.toISOString())) return 'Yesterday';
  return d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
}

export function MessageThread({ messages, currentUserId, participants }: MessageThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const userScrolledUp = useRef(false);

  // Detect if user has scrolled up
  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    userScrolledUp.current = el.scrollTop + el.clientHeight < el.scrollHeight - 100;
  };

  // Auto-scroll to bottom on new messages, unless user has scrolled up
  useEffect(() => {
    if (!userScrolledUp.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Scroll to bottom on initial mount
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'instant' });
  }, []);

  const participantMap = new Map<string, User>(participants.map(u => [u.id, u]));

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        // Scrollbar styling
        scrollbarWidth: 'thin',
        scrollbarColor: '#334155 transparent',
      }}
    >
      {/*
       * NOTE: Virtualization with @tanstack/react-virtual would be added here
       * when conversation history exceeds ~1000 messages. For typical chat
       * sessions this DOM approach is perfectly adequate and keeps scroll-to-bottom
       * logic simple.
       */}
      {messages.map((msg, i) => {
        const isOwn = msg.authorId === currentUserId;
        const author = participantMap.get(msg.authorId);
        const authorName = author?.name ?? 'Unknown';

        // Show author name when the previous message was from a different author
        const prevMsg = messages[i - 1];
        const showAuthor = !isOwn && (i === 0 || prevMsg.authorId !== msg.authorId);

        // Show date separator when day changes
        const showDateSep =
          i === 0 ||
          !isSameDay(messages[i - 1].timestamp, msg.timestamp);

        return (
          <React.Fragment key={msg.id}>
            {showDateSep && (
              <div
                style={{
                  alignItems: 'center',
                  display: 'flex',
                  gap: 12,
                  margin: '12px 0 8px',
                }}
              >
                <div style={{ flex: 1, height: 1, background: '#1e293b' }} />
                <span style={{ color: '#475569', fontSize: 12, whiteSpace: 'nowrap' }}>
                  {formatDateLabel(msg.timestamp)}
                </span>
                <div style={{ flex: 1, height: 1, background: '#1e293b' }} />
              </div>
            )}
            <MessageBubble
              message={msg}
              isOwn={isOwn}
              authorName={authorName}
              showAuthor={showAuthor}
            />
          </React.Fragment>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
