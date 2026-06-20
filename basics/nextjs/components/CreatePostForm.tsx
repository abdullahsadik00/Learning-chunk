'use client';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { createPost } from '@/actions/posts';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      style={{
        background: pending ? '#334155' : '#6366f1',
        color: pending ? '#64748b' : '#fff',
        border: 'none',
        borderRadius: 8,
        padding: '10px 24px',
        fontSize: 14,
        fontWeight: 600,
        cursor: pending ? 'not-allowed' : 'pointer',
        transition: 'background 0.15s, color 0.15s',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      {pending && (
        <span
          style={{
            width: 14,
            height: 14,
            border: '2px solid #64748b',
            borderTopColor: '#94a3b8',
            borderRadius: '50%',
            display: 'inline-block',
            animation: 'spin 0.6s linear infinite',
          }}
        />
      )}
      {pending ? 'Creating...' : 'Create Post'}
    </button>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  color: '#94a3b8',
  marginBottom: 6,
  letterSpacing: '0.03em',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#0f172a',
  border: '1px solid #334155',
  borderRadius: 8,
  color: '#e2e8f0',
  fontSize: 14,
  padding: '10px 14px',
  boxSizing: 'border-box',
  outline: 'none',
  fontFamily: 'inherit',
};

const errorStyle: React.CSSProperties = {
  color: '#f87171',
  fontSize: 12,
  marginTop: 4,
};

export function CreatePostForm() {
  const [state, formAction] = useActionState(createPost, {});

  return (
    <div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {state.success && (
        <div
          style={{
            background: '#052e16',
            border: '1px solid #166534',
            borderRadius: 8,
            padding: '12px 16px',
            marginBottom: 20,
            color: '#4ade80',
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          ✓ {state.message}
        </div>
      )}

      <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* Title */}
        <div>
          <label htmlFor="cf-title" style={labelStyle}>
            Title
          </label>
          <input
            id="cf-title"
            name="title"
            type="text"
            placeholder="e.g. Understanding React Server Components"
            style={inputStyle}
          />
          {state.errors?.title && (
            <p style={errorStyle}>{state.errors.title[0]}</p>
          )}
        </div>

        {/* Content */}
        <div>
          <label htmlFor="cf-content" style={labelStyle}>
            Content{' '}
            <span style={{ color: '#475569', fontWeight: 400 }}>
              (min 50 chars)
            </span>
          </label>
          <textarea
            id="cf-content"
            name="content"
            rows={5}
            placeholder="Write your post content here..."
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
          />
          {state.errors?.content && (
            <p style={errorStyle}>{state.errors.content[0]}</p>
          )}
        </div>

        {/* Category */}
        <div>
          <label htmlFor="cf-category" style={labelStyle}>
            Category
          </label>
          <select
            id="cf-category"
            name="category"
            style={{ ...inputStyle, cursor: 'pointer' }}
          >
            <option value="">— Select a category —</option>
            <option value="tech">Tech</option>
            <option value="business">Business</option>
            <option value="design">Design</option>
          </select>
          {state.errors?.category && (
            <p style={errorStyle}>{state.errors.category[0]}</p>
          )}
        </div>

        <div>
          <SubmitButton />
        </div>
      </form>
    </div>
  );
}
