import React, { useRef, useState, useCallback, useEffect } from 'react';

interface MessageComposerProps {
  onSend: (content: string) => void;
  onTyping: () => void;
}

const COMMON_EMOJIS = ['😀', '❤️', '👍', '😂', '🎉', '🔥', '💯', '✅'];

function useDebounced(fn: () => void, delay: number) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  return useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(fn, delay);
  }, [fn, delay]);
}

export function MessageComposer({ onSend, onTyping }: MessageComposerProps) {
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const debouncedTyping = useDebounced(onTyping, 500);

  // Auto-resize textarea up to 5 lines
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const lineHeight = 22;
    const maxHeight = lineHeight * 5 + 20; // 5 lines + padding
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
  }, [text]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    debouncedTyping();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText('');
    setShowEmoji(false);
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const insertEmoji = (emoji: string) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const next = text.slice(0, start) + emoji + text.slice(end);
    setText(next);
    // Restore cursor after emoji
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + emoji.length, start + emoji.length);
    });
  };

  return (
    <div
      style={{
        background: '#0f172a',
        borderTop: '1px solid #1e293b',
        padding: '12px 16px',
        position: 'relative',
      }}
    >
      {/* Emoji picker */}
      {showEmoji && (
        <div
          style={{
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: 12,
            bottom: '100%',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 4,
            left: 16,
            marginBottom: 8,
            padding: 10,
            position: 'absolute',
            width: 220,
          }}
        >
          {COMMON_EMOJIS.map(emoji => (
            <button
              key={emoji}
              onClick={() => insertEmoji(emoji)}
              style={{
                background: 'transparent',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 22,
                padding: '4px 6px',
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

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
        {/* Emoji toggle */}
        <button
          onClick={() => setShowEmoji(v => !v)}
          title="Emoji"
          style={{
            background: showEmoji ? '#334155' : 'transparent',
            border: '1px solid #334155',
            borderRadius: 8,
            color: '#94a3b8',
            cursor: 'pointer',
            flexShrink: 0,
            fontSize: 18,
            height: 40,
            width: 40,
            transition: 'background 0.15s',
          }}
        >
          😀
        </button>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message… (Enter to send, Shift+Enter for newline)"
          rows={1}
          style={{
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: 10,
            color: '#f1f5f9',
            flex: 1,
            fontSize: 14,
            lineHeight: '22px',
            outline: 'none',
            padding: '9px 12px',
            resize: 'none',
            transition: 'border-color 0.15s',
            overflowY: 'auto',
          }}
          onFocus={e => { e.currentTarget.style.borderColor = '#6366f1'; }}
          onBlur={e => { e.currentTarget.style.borderColor = '#334155'; }}
        />

        {/* Send button */}
        <button
          onClick={submit}
          disabled={!text.trim()}
          title="Send"
          style={{
            alignItems: 'center',
            background: text.trim() ? '#6366f1' : '#1e293b',
            border: 'none',
            borderRadius: 8,
            color: text.trim() ? '#fff' : '#475569',
            cursor: text.trim() ? 'pointer' : 'default',
            display: 'flex',
            flexShrink: 0,
            fontSize: 16,
            height: 40,
            justifyContent: 'center',
            transition: 'background 0.15s, color 0.15s',
            width: 40,
          }}
        >
          ➤
        </button>
      </div>

      <p style={{ color: '#475569', fontSize: 11, margin: '6px 0 0', paddingLeft: 48 }}>
        Enter to send · Shift+Enter for newline · Right-click a message for reactions
      </p>
    </div>
  );
}
