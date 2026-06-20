'use client';
import { useState } from 'react';

export function ClientCounter() {
  const [count, setCount] = useState(0);
  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        alignItems: 'center',
        padding: 16,
        background: '#1e293b',
        borderRadius: 8,
      }}
    >
      <button
        onClick={() => setCount((c) => c - 1)}
        style={{
          padding: '6px 14px',
          background: '#334155',
          color: '#e2e8f0',
          border: 'none',
          borderRadius: 6,
          cursor: 'pointer',
          fontSize: 18,
        }}
      >
        −
      </button>
      <span
        style={{
          fontSize: 24,
          fontWeight: 700,
          minWidth: 40,
          textAlign: 'center',
          color: '#f8fafc',
        }}
      >
        {count}
      </span>
      <button
        onClick={() => setCount((c) => c + 1)}
        style={{
          padding: '6px 14px',
          background: '#6366f1',
          color: 'white',
          border: 'none',
          borderRadius: 6,
          cursor: 'pointer',
          fontSize: 18,
        }}
      >
        +
      </button>
      <span style={{ color: '#64748b', fontSize: 13 }}>
        Client Component — state survives re-renders
      </span>
    </div>
  );
}
