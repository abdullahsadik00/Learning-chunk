'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { api } from '@/lib/api';
import { collectionKeys, snippetKeys } from '@/lib/queryKeys';
import { SnippetCard } from '@/components/SnippetCard';
import type { Collection, Snippet } from '@/types';

function EmptyState() {
  return (
    <div className="text-center py-24 space-y-4">
      <div className="w-16 h-16 mx-auto rounded-full bg-slate-800 flex items-center justify-center">
        <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-slate-300">No snippets yet</h3>
      <p className="text-slate-500 text-sm max-w-xs mx-auto">
        Create a collection and add your first snippet to get started.
      </p>
    </div>
  );
}

export default function SnippetsPage() {
  const { data: collections, isLoading: collectionsLoading } = useQuery({
    queryKey: collectionKeys.list(),
    queryFn: () => api.get<Collection[]>('/api/collections'),
  });

  // Load recent snippets across all collections (last 12)
  const { data: recentSnippets, isLoading: snippetsLoading } = useQuery({
    queryKey: snippetKeys.all,
    queryFn: () => api.get<Snippet[]>('/api/snippets?limit=12&sort=updated'),
  });

  const isLoading = collectionsLoading || snippetsLoading;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-10">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Snippets</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {collections?.length ?? 0} collection{collections?.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/snippets/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Snippet
        </Link>
      </div>

      {/* Collections summary */}
      {!collectionsLoading && collections && collections.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
            Collections
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {collections.map((col) => (
              <Link
                key={col.id}
                href={`/snippets?collection=${col.id}`}
                className="p-4 bg-slate-900 hover:bg-slate-800 rounded-xl border border-slate-800 hover:border-slate-700 transition group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 min-w-0">
                    <h3 className="font-medium text-slate-200 group-hover:text-white truncate">
                      {col.name}
                    </h3>
                    {col.description && (
                      <p className="text-xs text-slate-500 line-clamp-1">{col.description}</p>
                    )}
                  </div>
                  {col.snippetCount !== undefined && (
                    <span className="flex-shrink-0 px-2 py-0.5 bg-slate-800 rounded text-xs text-slate-400 group-hover:bg-slate-700">
                      {col.snippetCount}
                    </span>
                  )}
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-600">
                  {col.isPublic ? (
                    <>
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 004 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                      </svg>
                      Public
                    </>
                  ) : (
                    <>
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Private
                    </>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Recent snippets */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
          Recent snippets
        </h2>

        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-40 bg-slate-900 rounded-xl border border-slate-800 animate-pulse"
              />
            ))}
          </div>
        )}

        {!isLoading && (!recentSnippets || recentSnippets.length === 0) && (
          <EmptyState />
        )}

        {!isLoading && recentSnippets && recentSnippets.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {recentSnippets.map((snippet) => {
              const collection = collections?.find((c) => c.id === snippet.collectionId);
              return (
                <SnippetCard
                  key={snippet.id}
                  snippet={snippet}
                  collectionName={collection?.name}
                />
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
