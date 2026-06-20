'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { CollectionTree } from '@/components/CollectionTree';
import type { User } from '@/types';

export default function SnippetsLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, setUser, setLoading } = useAuthStore();
  const [isVerifying, setIsVerifying] = useState(!user);

  useEffect(() => {
    // If we already have a user in the store (from persisted state), verify it
    // is still a live session by calling /api/auth/me. This also re-hydrates
    // the in-memory access token via the silent refresh in api.ts.
    if (!user) {
      setLoading(true);
      api
        .get<User>('/api/auth/me')
        .then((me) => {
          setUser(me);
        })
        .catch(() => {
          // Session is gone — redirect to login
          router.replace('/login');
        })
        .finally(() => {
          setLoading(false);
          setIsVerifying(false);
        });
    } else {
      // User already in store — still confirm the session is live in the background.
      // We don't block rendering for this case; a failure will redirect on next API call.
      setIsVerifying(false);
    }
  }, [user, setUser, setLoading, router]);

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400">
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading…
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className="w-64 flex-shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col">
        {/* Logo / workspace header */}
        <div className="px-4 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-primary-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <span className="font-semibold text-white">Snippets</span>
          </div>
        </div>

        {/* Collection tree fills remaining sidebar space */}
        <div className="flex-1 overflow-y-auto py-2">
          <CollectionTree />
        </div>

        {/* User info at bottom */}
        {user && (
          <div className="px-4 py-3 border-t border-slate-800 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-primary-700 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate">{user.name}</p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
          </div>
        )}
      </aside>

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
