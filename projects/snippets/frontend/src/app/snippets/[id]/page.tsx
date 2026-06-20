'use client';

import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { snippetKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/stores/authStore';
import type { Comment, Language, SnippetWithComments } from '@/types';

// Monaco must be loaded client-side — it references `window`.
const Editor = dynamic(() => import('@/components/Editor').then((m) => m.Editor), {
  ssr: false,
  loading: () => (
    <div className="h-64 bg-slate-900 rounded-lg border border-slate-800 animate-pulse" />
  ),
});

const LANGUAGE_COLORS: Record<Language, string> = {
  typescript: 'bg-blue-900/50 text-blue-300 border-blue-700/50',
  javascript: 'bg-yellow-900/50 text-yellow-300 border-yellow-700/50',
  python:     'bg-green-900/50 text-green-300 border-green-700/50',
  rust:       'bg-orange-900/50 text-orange-300 border-orange-700/50',
  go:         'bg-sky-900/50 text-sky-300 border-sky-700/50',
  sql:        'bg-violet-900/50 text-violet-300 border-violet-700/50',
  bash:       'bg-slate-800 text-slate-300 border-slate-600',
  json:       'bg-amber-900/50 text-amber-300 border-amber-700/50',
  markdown:   'bg-slate-800 text-slate-300 border-slate-600',
  plain:      'bg-slate-800 text-slate-400 border-slate-600',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function CommentThread({ snippetId }: { snippetId: string }) {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState('');

  const { data: comments } = useQuery({
    queryKey: snippetKeys.comments(snippetId),
    queryFn: () => api.get<Comment[]>(`/api/snippets/${snippetId}/comments`),
  });

  const addComment = useMutation({
    mutationFn: (content: string) =>
      api.post<Comment>(`/api/snippets/${snippetId}/comments`, { content }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: snippetKeys.comments(snippetId) });
      setNewComment('');
    },
  });

  const resolveComment = useMutation({
    mutationFn: (commentId: string) =>
      api.patch<Comment>(`/api/snippets/${snippetId}/comments/${commentId}`, { resolved: true }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: snippetKeys.comments(snippetId) });
    },
  });

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
        Comments
      </h2>

      <div className="space-y-3">
        {comments?.map((c) => (
          <div
            key={c.id}
            className={`p-4 rounded-lg border ${
              c.resolved
                ? 'bg-slate-900/50 border-slate-800 opacity-60'
                : 'bg-slate-900 border-slate-800'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-full bg-primary-700 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                  {c.user.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium text-slate-300 truncate">{c.user.name}</span>
                {c.lineStart !== undefined && (
                  <span className="text-xs text-slate-500 font-mono">
                    L{c.lineStart}{c.lineEnd !== undefined && c.lineEnd !== c.lineStart ? `–${c.lineEnd}` : ''}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-slate-600">{formatDate(c.createdAt)}</span>
                {!c.resolved && user && (
                  <button
                    onClick={() => resolveComment.mutate(c.id)}
                    className="text-xs text-slate-500 hover:text-emerald-400 transition-colors"
                    aria-label="Mark resolved"
                  >
                    Resolve
                  </button>
                )}
              </div>
            </div>
            <p className="mt-2 text-sm text-slate-300 whitespace-pre-wrap">{c.content}</p>
          </div>
        ))}

        {(!comments || comments.length === 0) && (
          <p className="text-sm text-slate-600 py-4">No comments yet.</p>
        )}
      </div>

      {/* Add comment */}
      {user && (
        <div className="space-y-2">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment…"
            rows={3}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition resize-none"
          />
          <div className="flex justify-end">
            <button
              disabled={!newComment.trim() || addComment.isPending}
              onClick={() => {
                if (newComment.trim()) {
                  addComment.mutate(newComment.trim());
                }
              }}
              className="px-4 py-1.5 bg-primary-600 hover:bg-primary-500 disabled:bg-primary-800 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
            >
              {addComment.isPending ? 'Posting…' : 'Comment'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SnippetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');

  const { data: snippet, isLoading, error } = useQuery({
    queryKey: snippetKeys.detail(id),
    queryFn: () => api.get<SnippetWithComments>(`/api/snippets/${id}`),
    enabled: !!id,
  });

  const saveSnippet = useMutation({
    mutationFn: (content: string) =>
      api.patch<SnippetWithComments>(`/api/snippets/${id}`, { content }),
    onSuccess: (updated) => {
      queryClient.setQueryData(snippetKeys.detail(id), updated);
      setIsEditing(false);
    },
  });

  if (isLoading) {
    return (
      <div className="p-8 space-y-6 max-w-4xl mx-auto">
        <div className="h-8 w-64 bg-slate-800 rounded animate-pulse" />
        <div className="h-4 w-96 bg-slate-800 rounded animate-pulse" />
        <div className="h-64 bg-slate-800 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (error || !snippet) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-400">Failed to load snippet. It may not exist or you don&apos;t have access.</p>
      </div>
    );
  }

  const langClass = LANGUAGE_COLORS[snippet.language] ?? LANGUAGE_COLORS.plain;

  function handleEditClick() {
    setEditContent(snippet!.content);
    setIsEditing(true);
  }

  function handleSave() {
    saveSnippet.mutate(editContent);
  }

  function handleCancelEdit() {
    setIsEditing(false);
    setEditContent('');
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-bold text-white leading-tight">{snippet.title}</h1>
          <div className="flex items-center gap-2 flex-shrink-0">
            {!isEditing && user && (
              <button
                onClick={handleEditClick}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg transition-colors border border-slate-700"
              >
                Edit
              </button>
            )}
            {isEditing && (
              <>
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 text-sm font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saveSnippet.isPending}
                  className="px-4 py-1.5 bg-primary-600 hover:bg-primary-500 disabled:bg-primary-800 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  {saveSnippet.isPending ? 'Saving…' : 'Save'}
                </button>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <span className={`px-2.5 py-0.5 text-xs font-mono font-semibold rounded-md border ${langClass}`}>
            {snippet.language}
          </span>
          <span className="text-xs text-slate-500">Updated {formatDate(snippet.updatedAt)}</span>
          <span className="text-xs text-slate-500">Created {formatDate(snippet.createdAt)}</span>
        </div>

        {snippet.description && (
          <p className="text-slate-400 text-sm leading-relaxed">{snippet.description}</p>
        )}

        {saveSnippet.error && (
          <div role="alert" className="px-4 py-3 bg-red-950/50 border border-red-800/60 rounded-lg text-red-400 text-sm">
            {saveSnippet.error instanceof Error
              ? saveSnippet.error.message
              : 'Failed to save. Please try again.'}
          </div>
        )}
      </div>

      {/* Editor */}
      <div className="rounded-xl overflow-hidden border border-slate-800">
        <Editor
          value={isEditing ? editContent : snippet.content}
          language={snippet.language}
          onChange={isEditing ? setEditContent : undefined}
          readOnly={!isEditing}
          height="480px"
        />
      </div>

      {/* Comments */}
      <CommentThread snippetId={id} />
    </div>
  );
}
