import React, { useCallback } from 'react';
import { useChatStore } from './useChatStore';
import { useOfflineSupport } from './useOfflineSupport';
import { MessageThread } from './MessageThread';
import { MessageComposer } from './MessageComposer';
import type { Message } from '@/types';

function uuid(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function formatConvTime(timestamp: string): string {
  const d = new Date(timestamp);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

export function ChatDemo() {
  const {
    conversations,
    activeConversationId,
    currentUserId,
    typingUsers,
    setActiveConversation,
    addMessage,
    updateMessageStatus,
    setTyping,
  } = useChatStore();

  const activeConv = conversations.find(c => c.id === activeConversationId) ?? null;

  // Offline support — on sync replay queued messages into active conversation
  const handleSync = useCallback(
    (messages: Message[]) => {
      messages.forEach(msg => {
        addMessage(msg.conversationId, { ...msg, status: 'sent' });
      });
    },
    [addMessage]
  );

  const { isOnline, queuedCount, enqueue } = useOfflineSupport(handleSync);

  const handleSend = useCallback(
    (content: string) => {
      if (!activeConversationId) return;

      const message: Message = {
        id: uuid(),
        conversationId: activeConversationId,
        authorId: currentUserId,
        content,
        timestamp: new Date().toISOString(),
        status: 'sending',
      };

      if (!isOnline) {
        enqueue(message);
        return;
      }

      addMessage(activeConversationId, message);

      // Simulate delivery lifecycle
      setTimeout(() => updateMessageStatus(message.id, 'sent'), 500);
      setTimeout(() => updateMessageStatus(message.id, 'delivered'), 1300);
      setTimeout(() => updateMessageStatus(message.id, 'read'), 2800);
    },
    [activeConversationId, currentUserId, isOnline, enqueue, addMessage, updateMessageStatus]
  );

  const handleTyping = useCallback(() => {
    if (!activeConversationId) return;
    setTyping(activeConversationId, currentUserId, true);
    // Auto-clear typing indicator after 2s of inactivity
    setTimeout(() => {
      setTyping(activeConversationId, currentUserId, false);
    }, 2000);
  }, [activeConversationId, currentUserId, setTyping]);

  // Typing indicator: other users typing in the active conversation
  const typingInConv = activeConversationId
    ? typingUsers[activeConversationId] ?? {}
    : {};
  const typingNames = activeConv?.participants
    .filter(p => typingInConv[p.id])
    .map(p => p.name.split(' ')[0]) ?? [];

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        background: '#0f172a',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: '#f1f5f9',
        overflow: 'hidden',
      }}
    >
      {/* Offline banner */}
      {!isOnline && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            background: '#92400e',
            color: '#fef3c7',
            fontSize: 13,
            fontWeight: 600,
            padding: '8px 16px',
            textAlign: 'center',
            zIndex: 100,
          }}
        >
          You're offline — messages queued ({queuedCount})
        </div>
      )}

      {/* Sidebar */}
      <div
        style={{
          width: 300,
          borderRight: '1px solid #1e293b',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          paddingTop: !isOnline ? 36 : 0,
        }}
      >
        {/* Sidebar header */}
        <div
          style={{
            padding: '20px 16px 12px',
            borderBottom: '1px solid #1e293b',
          }}
        >
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#f8fafc' }}>
            Messages
          </h2>
        </div>

        {/* Conversation list */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {conversations.map(conv => {
            const isActive = conv.id === activeConversationId;
            const otherParticipants = conv.participants.filter(p => p.id !== currentUserId);
            const displayName =
              otherParticipants.length > 0
                ? otherParticipants.map(p => p.name).join(', ')
                : 'You';
            const lastMsg = conv.messages[conv.messages.length - 1];
            const preview = lastMsg
              ? lastMsg.authorId === currentUserId
                ? `You: ${lastMsg.content}`
                : lastMsg.content
              : 'No messages yet';

            return (
              <button
                key={conv.id}
                onClick={() => setActiveConversation(conv.id)}
                style={{
                  alignItems: 'center',
                  background: isActive ? '#1e293b' : 'transparent',
                  border: 'none',
                  borderLeft: isActive ? '3px solid #6366f1' : '3px solid transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  gap: 12,
                  padding: '12px 16px',
                  textAlign: 'left',
                  width: '100%',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => {
                  if (!isActive)
                    (e.currentTarget as HTMLButtonElement).style.background = '#111827';
                }}
                onMouseLeave={e => {
                  if (!isActive)
                    (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                }}
              >
                {/* Avatar */}
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: '#334155',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 16,
                    fontWeight: 700,
                    color: '#94a3b8',
                    overflow: 'hidden',
                  }}
                >
                  {otherParticipants[0]?.name[0] ?? '?'}
                </div>

                {/* Text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                    }}
                  >
                    <span
                      style={{
                        color: '#f1f5f9',
                        fontSize: 14,
                        fontWeight: 600,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: 140,
                      }}
                    >
                      {displayName}
                    </span>
                    {lastMsg && (
                      <span style={{ color: '#475569', fontSize: 11, flexShrink: 0 }}>
                        {formatConvTime(lastMsg.timestamp)}
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      color: '#64748b',
                      fontSize: 13,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      marginTop: 2,
                    }}
                  >
                    {preview}
                  </div>
                </div>

                {/* Unread badge */}
                {conv.unreadCount > 0 && (
                  <div
                    style={{
                      background: '#6366f1',
                      borderRadius: '50%',
                      color: '#fff',
                      flexShrink: 0,
                      fontSize: 11,
                      fontWeight: 700,
                      height: 20,
                      lineHeight: '20px',
                      minWidth: 20,
                      textAlign: 'center',
                      padding: '0 4px',
                    }}
                  >
                    {conv.unreadCount}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main chat area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          paddingTop: !isOnline ? 36 : 0,
        }}
      >
        {activeConv ? (
          <>
            {/* Conversation header */}
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid #1e293b',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: '#334155',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 15,
                  fontWeight: 700,
                  color: '#94a3b8',
                }}
              >
                {activeConv.participants.filter(p => p.id !== currentUserId)[0]?.name[0] ?? '?'}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#f8fafc' }}>
                  {activeConv.participants
                    .filter(p => p.id !== currentUserId)
                    .map(p => p.name)
                    .join(', ') || 'You'}
                </div>
                <div style={{ fontSize: 12, color: '#10b981' }}>Online</div>
              </div>
            </div>

            {/* Message thread */}
            <MessageThread
              messages={activeConv.messages}
              currentUserId={currentUserId}
              participants={activeConv.participants}
            />

            {/* Typing indicator */}
            <div style={{ minHeight: 24, padding: '0 20px 4px' }}>
              {typingNames.length > 0 && (
                <span style={{ color: '#64748b', fontSize: 13, fontStyle: 'italic' }}>
                  {typingNames.join(', ')} {typingNames.length === 1 ? 'is' : 'are'} typing…
                </span>
              )}
            </div>

            {/* Composer */}
            <MessageComposer onSend={handleSend} onTyping={handleTyping} />
          </>
        ) : (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#475569',
              fontSize: 15,
            }}
          >
            Select a conversation to start chatting
          </div>
        )}
      </div>
    </div>
  );
}

export default ChatDemo;
