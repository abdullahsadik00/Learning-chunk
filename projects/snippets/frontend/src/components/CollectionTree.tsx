'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { collectionKeys } from '@/lib/queryKeys';
import type { CollectionWithSnippets } from '@/types';

function FolderIcon({ open }: { open: boolean }) {
  return open ? (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
    </svg>
  ) : (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-3 h-3 flex-shrink-0 transition-transform text-slate-500 ${open ? 'rotate-90' : ''}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

interface CollectionNodeProps {
  collection: CollectionWithSnippets;
  activeSnippetId: string | undefined;
}

function CollectionNode({ collection, activeSnippetId }: CollectionNodeProps) {
  const [isOpen, setIsOpen] = useState(
    // Auto-expand the collection that contains the active snippet
    collection.snippets.some((s) => s.id === activeSnippetId),
  );

  const hasSnippets = collection.snippets.length > 0;

  return (
    <div>
      {/* Collection header */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-md transition-colors group"
        aria-expanded={isOpen}
      >
        <ChevronIcon open={isOpen} />
        <FolderIcon open={isOpen} />
        <span className="flex-1 text-left truncate font-medium">{collection.name}</span>
        {collection.snippetCount !== undefined && collection.snippetCount > 0 && (
          <span className="text-xs text-slate-600 group-hover:text-slate-500 tabular-nums">
            {collection.snippetCount}
          </span>
        )}
      </button>

      {/* Snippet list (expanded) */}
      {isOpen && (
        <div className="ml-4 border-l border-slate-800 pl-2 mt-0.5 space-y-0.5">
          {!hasSnippets && (
            <p className="px-3 py-1.5 text-xs text-slate-600 italic">No snippets</p>
          )}

          {collection.snippets.map((snippet) => {
            const isActive = snippet.id === activeSnippetId;
            return (
              <Link
                key={snippet.id}
                href={`/snippets/${snippet.id}`}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs transition-colors truncate ${
                  isActive
                    ? 'bg-primary-900/50 text-primary-300 font-medium'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
                }`}
              >
                <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                <span className="truncate">{snippet.title}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function CollectionTree() {
  const pathname = usePathname();
  const params = useParams<{ id?: string }>();

  // Derive active snippet ID from the URL — /snippets/[id]
  const activeSnippetId = pathname.startsWith('/snippets/') ? params.id : undefined;

  const { data: collections, isLoading, error } = useQuery({
    queryKey: collectionKeys.list(),
    queryFn: () => api.get<CollectionWithSnippets[]>('/api/collections'),
  });

  if (isLoading) {
    return (
      <div className="px-3 py-2 space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-7 bg-slate-800 rounded-md animate-pulse" style={{ width: `${60 + i * 10}%` }} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-3 py-2">
        <p className="text-xs text-red-400">Failed to load collections.</p>
      </div>
    );
  }

  if (!collections || collections.length === 0) {
    return (
      <div className="px-3 py-4 text-center space-y-2">
        <p className="text-xs text-slate-600">No collections yet.</p>
        <Link
          href="/snippets/new-collection"
          className="text-xs text-primary-500 hover:text-primary-400"
        >
          Create one
        </Link>
      </div>
    );
  }

  return (
    <nav aria-label="Collections" className="px-2 space-y-0.5">
      <div className="px-3 py-1.5 mb-1">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Collections
        </p>
      </div>
      {collections.map((collection) => (
        <CollectionNode
          key={collection.id}
          collection={collection}
          activeSnippetId={activeSnippetId}
        />
      ))}
    </nav>
  );
}
