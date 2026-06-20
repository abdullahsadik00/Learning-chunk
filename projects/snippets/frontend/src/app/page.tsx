import Link from 'next/link';

// Server component — no 'use client' needed.
// Renders without hitting the database, so it loads fast and is fully cacheable.
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center">
      <div className="max-w-6xl mx-auto px-6 py-24 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

        {/* ── Left: headline + CTAs ───────────────────────────────────────── */}
        <div className="space-y-8">
          <div className="space-y-4">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-900/40 border border-primary-700/50 text-primary-400 text-sm font-medium">
              Team code knowledge base
            </span>
            <h1 className="text-5xl font-bold tracking-tight text-white leading-tight">
              Your team&apos;s code{' '}
              <span className="text-primary-400">knowledge base</span>
            </h1>
            <p className="text-xl text-slate-400 leading-relaxed">
              Save, organize, and collaboratively edit code snippets with your team.
              Think GitHub Gists, but built for internal teams with real-time editing
              and fine-grained access control.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/register"
              className="inline-flex items-center justify-center px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white font-semibold rounded-lg transition-colors"
            >
              Get Started — it&apos;s free
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg transition-colors border border-slate-700"
            >
              Sign In
            </Link>
          </div>

          <div className="flex items-center gap-6 text-sm text-slate-500">
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Real-time collaboration
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Full-text search
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Version history
            </span>
          </div>
        </div>

        {/* ── Right: UI mockup preview ────────────────────────────────────── */}
        <div className="hidden lg:block">
          <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden shadow-2xl">
            {/* Window chrome */}
            <div className="flex items-center gap-2 px-4 py-3 bg-slate-800 border-b border-slate-700">
              <span className="w-3 h-3 rounded-full bg-red-500/80" />
              <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <span className="w-3 h-3 rounded-full bg-green-500/80" />
              <span className="ml-4 text-xs text-slate-500">snippets — auth/middleware.ts</span>
            </div>

            {/* Fake sidebar + editor layout */}
            <div className="flex" style={{ height: '360px' }}>
              {/* Sidebar */}
              <div className="w-48 bg-slate-950 border-r border-slate-800 p-3 space-y-1 flex-shrink-0">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2 py-1">
                  Collections
                </div>
                {[
                  { name: 'Auth Patterns', count: 8, active: true },
                  { name: 'DB Queries', count: 14, active: false },
                  { name: 'CI Scripts', count: 5, active: false },
                ].map((c) => (
                  <div
                    key={c.name}
                    className={`flex items-center justify-between px-2 py-1.5 rounded text-sm cursor-pointer ${
                      c.active
                        ? 'bg-primary-900/50 text-primary-300'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="truncate">{c.name}</span>
                    <span className="text-xs text-slate-600 ml-1">{c.count}</span>
                  </div>
                ))}
              </div>

              {/* Code preview */}
              <div className="flex-1 p-4 font-mono text-xs leading-5 overflow-hidden">
                <div className="text-slate-500">
                  <span className="text-primary-400">import</span>
                  <span className="text-slate-300"> {'{ Request, Response, NextFunction }'} </span>
                  <span className="text-primary-400">from</span>
                  <span className="text-emerald-400"> &apos;express&apos;</span>
                  <span className="text-slate-300">;</span>
                </div>
                <div className="text-slate-500">
                  <span className="text-primary-400">import</span>
                  <span className="text-slate-300"> jwt </span>
                  <span className="text-primary-400">from</span>
                  <span className="text-emerald-400"> &apos;jsonwebtoken&apos;</span>
                  <span className="text-slate-300">;</span>
                </div>
                <div className="mt-3 text-slate-500">
                  <span className="text-yellow-400">export function</span>
                  <span className="text-sky-300"> requireAuth</span>
                  <span className="text-slate-300">(</span>
                </div>
                <div className="pl-4 text-slate-400">
                  <span className="text-orange-300">req</span>
                  <span className="text-slate-300">: Request,</span>
                </div>
                <div className="pl-4 text-slate-400">
                  <span className="text-orange-300">res</span>
                  <span className="text-slate-300">: Response,</span>
                </div>
                <div className="pl-4 text-slate-400">
                  <span className="text-orange-300">next</span>
                  <span className="text-slate-300">: NextFunction,</span>
                </div>
                <div className="text-slate-300">{') {'}</div>
                <div className="pl-4 text-slate-400">
                  <span className="text-primary-400">const</span>
                  <span className="text-slate-300"> token = req.cookies</span>
                  <span className="text-slate-300">.access_token;</span>
                </div>
                <div className="pl-4 mt-1 text-slate-500">
                  <span className="text-primary-400">if</span>
                  <span className="text-slate-300"> (!token) {'{'}</span>
                </div>
                <div className="pl-8 text-slate-400">
                  <span className="text-orange-300">res</span>
                  <span className="text-slate-300">.status(</span>
                  <span className="text-amber-400">401</span>
                  <span className="text-slate-300">).json({'{ message: \'Unauthorized\' }'});</span>
                </div>
                <div className="pl-8 text-slate-400">
                  <span className="text-primary-400">return</span>
                  <span className="text-slate-300">;</span>
                </div>
                <div className="pl-4 text-slate-500">{'}'}</div>
                <div className="pl-4 mt-1 text-slate-500 text-xs">
                  <span className="text-slate-600">// verify + attach user to request</span>
                </div>
              </div>
            </div>

            {/* Status bar */}
            <div className="flex items-center justify-between px-4 py-1.5 bg-primary-700/30 border-t border-slate-800 text-xs text-slate-400">
              <span>TypeScript</span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  3 online
                </span>
                <span>Ln 12, Col 1</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
