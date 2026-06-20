'use client';

import { useState } from 'react';

interface CodeBlockProps {
  code: string;
  language?: string;
}

export function CodeBlock({ code, language = 'tsx' }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', margin: '16px 0' }}>
      {/* Header bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#161b22',
          padding: '8px 16px',
          borderBottom: '1px solid #30363d',
        }}
      >
        <span style={{ fontSize: 12, color: '#6e7681', fontFamily: 'monospace' }}>
          {language}
        </span>
        <button
          onClick={handleCopy}
          style={{
            background: copied ? '#10b981' : '#21262d',
            border: '1px solid #30363d',
            borderRadius: 6,
            color: copied ? '#fff' : '#8b949e',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 600,
            padding: '4px 12px',
            transition: 'background 0.15s, color 0.15s',
          }}
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      {/* Code area */}
      <pre
        style={{
          background: '#0d1117',
          margin: 0,
          padding: '20px 24px',
          overflowX: 'auto',
          fontSize: 13,
          lineHeight: 1.7,
          color: '#c9d1d9',
          fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', monospace",
        }}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}
