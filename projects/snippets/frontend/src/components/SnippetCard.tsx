'use client';

import Link from 'next/link';
import type { Language, Snippet } from '@/types';

interface SnippetCardProps {
  snippet: Snippet;
  collectionName?: string;
}

const LANGUAGE_BADGE: Record<Language, string> = {
  typescript: 'bg-blue-900/50 text-blue-300 border-blue-700/50',
  javascript: 'bg-yellow-900/50 text-yellow-300 border-yellow-700/50',
  python:     'bg-green-900/50 text-green-300 border-green-700/50',
  rust:       'bg-orange-900/50 text-orange-300 border-orange-700/50',
  go:         'bg-sky-900/50 text-sky-300 border-sky-700/50',
  sql:        'bg-violet-900/50 text-violet-300 border-violet-700/50',
  bash:       'bg-slate-700 text-slate-300 border-slate-600',
  json:       'bg-amber-900/50 text-amber-300 border-amber-700/50',
  markdown:   'bg-slate-700 text-slate-300 border-slate-600',
  plain:      'bg-slate-700 text-slate-400 border-slate-600',
};

function formatRelativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Returns the first `n` lines of a string, trimming trailing blank lines.
 */
function firstLines(content: string, n: number): string {
  return content
    .split('\n')
    .slice(0, n)
    .join('\n');
}

export function SnippetCard({ snippet, collectionName }: SnippetCardProps) {
  const badgeClass = LANGUAGE_BADGE[snippet.language] ?? LANGUAGE_BADGE.plain;
  const preview = firstLines(snippet.content, 3);

  return (
    <Link
      href={`/snippets/${snippet.id}`}
      className="block bg-slate-900 hover:bg-slate-800/80 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors group"
    >
      <div className="p-4 space-y-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 space-y-0.5">
            <h3 className="font-semibold text-slate-200 group-hover:text-white truncate">
              {snippet.title}
            </h3>
            {collectionName && (
              <p className="text-xs text-slate-500 truncate">{collectionName}</p>
            )}
          </div>
          <span
            className={`flex-shrink-0 px-2 py-0.5 text-xs font-mono font-semibold rounded border ${badgeClass}`}
          >
            {snippet.language}
          </span>
        </div>

        {/* Code preview — first 3 lines, not syntax-highlighted to keep the card fast */}
        <div className="rounded-md bg-slate-950 border border-slate-800 overflow-hidden">
          <pre className="p-3 text-xs text-slate-400 font-mono leading-5 whitespace-pre overflow-hidden">
            <code>{preview || ' '}</code>
          </pre>
        </div>

        {/* Description */}
        {snippet.description && (
          <p className="text-xs text-slate-500 line-clamp-1 leading-relaxed">
            {snippet.description}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-slate-600 pt-0.5">
          <span>Updated {formatRelativeDate(snippet.updatedAt)}</span>
          <svg
            className="w-3.5 h-3.5 text-slate-700 group-hover:text-slate-500 transition-colors"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );
}
