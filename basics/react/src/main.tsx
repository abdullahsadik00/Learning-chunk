import React, { useState, useEffect, Suspense, lazy, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import {
    Search, X, Menu, Moon, Sun, ChevronRight, ChevronLeft,
    Clock, Target, Play, CheckCircle2, BookOpen, Circle,
    Check, Loader2,
} from 'lucide-react';
import './index.css';

// ─── Types ───────────────────────────────────────────────────────────────────

type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';

interface Mod {
    id: string;
    day: number;
    label: string;
    difficulty: Difficulty;
    readingTime: string;
    description: string;
    objectives: string[];
    load: React.LazyExoticComponent<React.ComponentType>;
}

// ─── Curriculum registry ─────────────────────────────────────────────────────

const MODULES: Mod[] = [
    {
        id: '01', day: 12,
        label: 'JSX & Components',
        difficulty: 'Beginner',
        readingTime: '20 min',
        description: 'Deep dive into JSX syntax, component composition, and rendering patterns. Understand how React transforms JSX into efficient UI trees.',
        objectives: [
            'Understand JSX as syntactic sugar for React.createElement()',
            'Build and compose functional components with typed props',
            'Master conditional rendering: &&, ternary, and early return patterns',
            'Render dynamic lists with correct key semantics',
        ],
        load: lazy(() => import('../01-jsx-and-components')),
    },
    {
        id: '02', day: 13,
        label: 'useState & useEffect',
        difficulty: 'Beginner',
        readingTime: '25 min',
        description: 'Master the two most fundamental React hooks for managing local state and synchronising side effects with the outside world.',
        objectives: [
            'Manage primitive, object, and array state with immutable updates',
            'Understand state batching and functional update patterns',
            'Write cleanup functions in useEffect to prevent memory leaks',
            'Avoid stale closures and missing dependency pitfalls',
        ],
        load: lazy(() => import('../02-hooks-useState-useEffect')),
    },
    {
        id: '03', day: 14,
        label: 'useRef · useMemo · useCallback',
        difficulty: 'Intermediate',
        readingTime: '25 min',
        description: 'Reference DOM nodes without triggering re-renders, memoize expensive computations, and stabilise function references for child components.',
        objectives: [
            'Use useRef for DOM access and mutable values that bypass renders',
            'Derive and memoize data with useMemo and a correct dependency array',
            'Stabilise event handler references with useCallback',
            'Measure and observe DOM nodes using callback refs',
        ],
        load: lazy(() => import('../03-hooks-useRef-useMemo-useCallback')),
    },
    {
        id: '04', day: 14,
        label: 'useContext · useReducer · Custom Hooks',
        difficulty: 'Intermediate',
        readingTime: '25 min',
        description: 'Share state across the component tree without prop drilling, manage complex state machines, and encapsulate reusable logic in custom hooks.',
        objectives: [
            'Provide and consume React Context correctly without performance pitfalls',
            'Model complex state transitions with useReducer and typed actions',
            'Extract stateful logic into reusable custom hooks',
            'Know when to use Context vs props vs a dedicated state library',
        ],
        load: lazy(() => import('../04-hooks-context-reducer-custom')),
    },
    {
        id: '05', day: 15,
        label: 'Virtual DOM & React Fiber',
        difficulty: 'Intermediate',
        readingTime: '20 min',
        description: "Understand how React reconciles changes through Fiber's incremental rendering and unlock concurrent features for a snappier UX.",
        objectives: [
            'Explain the Virtual DOM diffing and reconciliation algorithm',
            'Understand React Fiber architecture and its scheduling model',
            'Defer non-urgent state updates with useTransition',
            'Stabilise stale values during concurrent renders with useDeferredValue',
        ],
        load: lazy(() => import('../05-react-internals')),
    },
    {
        id: '06', day: 15,
        label: 'Error Boundaries · Portals · ForwardRef',
        difficulty: 'Intermediate',
        readingTime: '20 min',
        description: 'Handle runtime errors gracefully, render UI outside the DOM hierarchy using portals, and forward refs across component layers.',
        objectives: [
            'Implement class-based Error Boundaries with getDerivedStateFromError',
            'Render modals and tooltips at the document root with createPortal',
            'Forward refs to DOM elements using React.forwardRef',
            'Expose imperative handles to parent components with useImperativeHandle',
        ],
        load: lazy(() => import('../06-advanced-patterns')),
    },
    {
        id: '07', day: 16,
        label: 'State Management',
        difficulty: 'Intermediate',
        readingTime: '30 min',
        description: 'Scale beyond local state — advanced Context patterns, Zustand for global store management, and TanStack Query for server-state synchronisation.',
        objectives: [
            'Split context providers to prevent unnecessary subscriber re-renders',
            'Manage global UI and domain state with Zustand slices',
            'Fetch, cache, and synchronise server data with TanStack Query',
            'Choose the right tool: local, context, global, or server state',
        ],
        load: lazy(() => import('../07-state-management')),
    },
    {
        id: '08', day: 17,
        label: 'React Patterns',
        difficulty: 'Advanced',
        readingTime: '25 min',
        description: 'Master production-grade component patterns used in major libraries: compound components, render props, HOCs, and headless UI.',
        objectives: [
            'Build compound components with implicit shared state via Context',
            'Implement render prop and function-as-children patterns',
            'Write Higher-Order Components with full TypeScript generics',
            'Design headless / hook-based component APIs for maximum flexibility',
        ],
        load: lazy(() => import('../08-react-patterns')),
    },
    {
        id: '09', day: 17,
        label: 'Performance Optimisation',
        difficulty: 'Intermediate',
        readingTime: '25 min',
        description: 'Profile and optimise React applications: prevent unnecessary re-renders, split bundles, virtualise long lists, and measure with the Profiler API.',
        objectives: [
            'Prevent unnecessary re-renders with React.memo and custom comparators',
            'Split bundles on demand with React.lazy + granular Suspense boundaries',
            'Implement infinite scroll with IntersectionObserver',
            'Measure render costs with the React Profiler API and useWhyDidYouUpdate',
        ],
        load: lazy(() => import('../09-performance')),
    },
    {
        id: '10', day: 17,
        label: 'Testing Components',
        difficulty: 'Intermediate',
        readingTime: '20 min',
        description: "Test React components from the user's perspective with Testing Library, Vitest, and MSW — focusing on behaviour over implementation details.",
        objectives: [
            'Query DOM elements using accessible roles with Testing Library',
            'Fire events and simulate real user interactions with userEvent',
            'Test hooks in isolation with renderHook',
            'Intercept API calls for integration tests using MSW handlers',
        ],
        load: lazy(() => import('../10-testing')),
    },
    {
        id: '11', day: 17,
        label: 'Practice',
        difficulty: 'Advanced',
        readingTime: '45 min',
        description: '20 increasingly difficult challenges covering every topic from the curriculum — from basic toggles to drag-and-drop and undo history.',
        objectives: [
            'Implement toggle, search, and dynamic form components from scratch',
            'Build drag-and-drop list reordering with mouse event tracking',
            'Create a text editor with full Ctrl+Z undo / Ctrl+Y redo history',
            'Wire complex modal providers with async interaction patterns',
        ],
        load: lazy(() => import('../11-practice')),
    },
];

// ─── Utility ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'react-mastery-completed';

function loadCompleted(): Set<string> {
    try { return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')); }
    catch { return new Set(); }
}

// ─── Badges ──────────────────────────────────────────────────────────────────

function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
    const styles: Record<Difficulty, string> = {
        Beginner:     'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/60',
        Intermediate: 'bg-amber-50   text-amber-700   border-amber-200   dark:bg-amber-950/40   dark:text-amber-400   dark:border-amber-900/60',
        Advanced:     'bg-red-50     text-red-700     border-red-200     dark:bg-red-950/40     dark:text-red-400     dark:border-red-900/60',
    };
    return (
        <span className={`inline-flex items-center text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${styles[difficulty]}`}>
            {difficulty}
        </span>
    );
}

function DayBadge({ day }: { day: number }) {
    return (
        <span className="inline-flex items-center text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
            Day {day}
        </span>
    );
}

// ─── Loading spinner ──────────────────────────────────────────────────────────

function LoadingSpinner() {
    return (
        <div className="flex items-center justify-center py-24">
            <Loader2 className="w-7 h-7 text-blue-500 animate-spin" />
        </div>
    );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

interface SidebarProps {
    allModules: Mod[];
    filteredModules: Mod[];
    activeId: string;
    completed: Set<string>;
    search: string;
    onSearch: (s: string) => void;
    onSelect: (id: string) => void;
    mobileOpen: boolean;
    onClose: () => void;
}

function Sidebar({ allModules, filteredModules, activeId, completed, search, onSearch, onSelect, mobileOpen, onClose }: SidebarProps) {
    const days = [...new Set(allModules.map(m => m.day))];
    const progress = Math.round((completed.size / allModules.length) * 100);

    return (
        <>
            {/* Mobile backdrop */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-20 bg-black/50 backdrop-blur-sm lg:hidden"
                    onClick={onClose}
                />
            )}

            <aside
                className={[
                    'fixed inset-y-0 left-0 z-30 flex flex-col w-64 shrink-0',
                    'bg-white dark:bg-zinc-900',
                    'border-r border-zinc-200 dark:border-zinc-800',
                    'transition-transform duration-200 ease-in-out',
                    'lg:static lg:translate-x-0',
                    mobileOpen ? 'translate-x-0' : '-translate-x-full',
                ].join(' ')}
            >
                {/* Logo */}
                <div className="flex items-center gap-2.5 px-4 py-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-sm">
                        <BookOpen className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-none truncate">React Mastery</p>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">Days 12–17 · live demos</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="lg:hidden p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 dark:text-zinc-500 transition-colors"
                        aria-label="Close sidebar"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Progress */}
                <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">Progress</span>
                        <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 tabular-nums">
                            {completed.size}/{allModules.length}
                        </span>
                    </div>
                    <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    {progress === 100 && (
                        <p className="mt-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">🎉 Curriculum complete!</p>
                    )}
                </div>

                {/* Search */}
                <div className="px-3 py-2.5 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                        <input
                            type="search"
                            value={search}
                            onChange={e => onSearch(e.target.value)}
                            placeholder="Search lessons…"
                            className="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        />
                        {search && (
                            <button
                                onClick={() => onSearch('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                                aria-label="Clear search"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Nav list */}
                <nav className="flex-1 overflow-y-auto py-2" aria-label="Curriculum lessons">
                    {filteredModules.length === 0 ? (
                        <p className="px-4 py-6 text-xs text-zinc-400 dark:text-zinc-500 text-center">
                            No lessons match "{search}"
                        </p>
                    ) : (
                        days.map(day => {
                            const dayMods = filteredModules.filter(m => m.day === day);
                            if (!dayMods.length) return null;
                            return (
                                <div key={day} className="mb-1 px-2">
                                    <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-600 select-none">
                                        Day {day}
                                    </p>
                                    <div className="space-y-0.5">
                                        {dayMods.map(m => {
                                            const isActive = m.id === activeId;
                                            const isDone = completed.has(m.id);
                                            return (
                                                <button
                                                    key={m.id}
                                                    onClick={() => onSelect(m.id)}
                                                    aria-current={isActive ? 'page' : undefined}
                                                    className={[
                                                        'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
                                                        isActive
                                                            ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-medium shadow-sm'
                                                            : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-200',
                                                    ].join(' ')}
                                                >
                                                    <span
                                                        className={[
                                                            'shrink-0 w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-mono transition-colors',
                                                            isDone
                                                                ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400'
                                                                : isActive
                                                                    ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400'
                                                                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500',
                                                        ].join(' ')}
                                                    >
                                                        {isDone ? <Check className="w-3 h-3" /> : m.id}
                                                    </span>
                                                    <span className="leading-snug">{m.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </nav>

                {/* Footer */}
                <div className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-800 shrink-0">
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-600 leading-relaxed">
                        Phase 3 of SDE Learning Path · React 18 · TypeScript
                    </p>
                </div>
            </aside>
        </>
    );
}

// ─── TopBar ──────────────────────────────────────────────────────────────────

interface TopBarProps {
    mod: Mod;
    dark: boolean;
    onToggleDark: () => void;
    onOpenSidebar: () => void;
}

function TopBar({ mod, dark, onToggleDark, onOpenSidebar }: TopBarProps) {
    return (
        <header className="shrink-0 flex items-center gap-3 px-4 h-12 border-b border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm z-10">
            <button
                onClick={onOpenSidebar}
                className="lg:hidden p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 transition-colors"
                aria-label="Open sidebar"
            >
                <Menu className="w-4 h-4" />
            </button>

            {/* Breadcrumb */}
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 min-w-0 flex-1 text-sm">
                <span className="text-zinc-400 dark:text-zinc-600 hidden sm:block shrink-0">React Mastery</span>
                <ChevronRight className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-700 hidden sm:block shrink-0" />
                <span className="font-medium text-zinc-700 dark:text-zinc-200 truncate">{mod.label}</span>
            </nav>

            {/* Right controls */}
            <div className="flex items-center gap-2 shrink-0">
                <DifficultyBadge difficulty={mod.difficulty} />
                <span className="hidden md:flex items-center gap-1 text-xs text-zinc-400 dark:text-zinc-500">
                    <Clock className="w-3 h-3" />
                    {mod.readingTime}
                </span>
                <button
                    onClick={onToggleDark}
                    className="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 transition-colors"
                    aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                    {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
            </div>
        </header>
    );
}

// ─── LessonLayout ────────────────────────────────────────────────────────────

interface LessonLayoutProps {
    mod: Mod;
    allMods: Mod[];
    completed: Set<string>;
    onNavigate: (id: string) => void;
    onToggleComplete: () => void;
    children: ReactNode;
}

function LessonLayout({ mod, allMods, completed, onNavigate, onToggleComplete, children }: LessonLayoutProps) {
    const idx = allMods.findIndex(m => m.id === mod.id);
    const prev = allMods[idx - 1];
    const next = allMods[idx + 1];
    const done = completed.has(mod.id);

    return (
        <article className="max-w-3xl mx-auto px-6 py-10 pb-20">

            {/* ── Lesson header ── */}
            <header className="mb-8">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                    <DayBadge day={mod.day} />
                    <span className="text-xs text-zinc-400 dark:text-zinc-600 font-mono">Module {mod.id} of {allMods.length}</span>
                    <DifficultyBadge difficulty={mod.difficulty} />
                    <span className="flex items-center gap-1 text-xs text-zinc-400 dark:text-zinc-500 ml-auto">
                        <Clock className="w-3 h-3" />
                        {mod.readingTime}
                    </span>
                </div>
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 mb-3 leading-tight tracking-tight">
                    {mod.label}
                </h1>
                <p className="text-base text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-2xl">
                    {mod.description}
                </p>
            </header>

            {/* ── Learning objectives ── */}
            <section
                aria-label="Learning objectives"
                className="mb-8 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/60 dark:bg-blue-950/20 p-5"
            >
                <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-4">
                    <Target className="w-3.5 h-3.5" />
                    Learning Objectives
                </h2>
                <ol className="space-y-2.5">
                    {mod.objectives.map((obj, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-zinc-700 dark:text-zinc-300">
                            <span className="shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 text-[10px] font-mono font-semibold mt-0.5">
                                {i + 1}
                            </span>
                            <span className="leading-relaxed">{obj}</span>
                        </li>
                    ))}
                </ol>
            </section>

            {/* ── Interactive demos ── */}
            <section aria-label="Interactive demos" className="mb-10">
                <div className="flex items-center gap-2 mb-5">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                        <Play className="w-3.5 h-3.5" />
                        Interactive Demos
                    </div>
                    <div className="flex-1 h-px bg-zinc-100 dark:bg-zinc-800" />
                </div>
                {children}
            </section>

            {/* ── Footer actions ── */}
            <footer className="border-t border-zinc-200 dark:border-zinc-800 pt-8">
                {/* Mark complete */}
                <button
                    onClick={onToggleComplete}
                    className={[
                        'inline-flex items-center gap-2 text-sm px-4 py-2 rounded-lg font-medium transition-all mb-6 border focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500',
                        done
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/60'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-zinc-200',
                    ].join(' ')}
                >
                    {done
                        ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        : <Circle className="w-4 h-4" />
                    }
                    {done ? 'Marked as Complete' : 'Mark as Complete'}
                </button>

                {/* Prev / Next navigation */}
                <div className="grid grid-cols-2 gap-3">
                    {prev ? (
                        <button
                            onClick={() => onNavigate(prev.id)}
                            className="flex flex-col items-start gap-0.5 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-all text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        >
                            <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold text-zinc-400 dark:text-zinc-500">
                                <ChevronLeft className="w-3 h-3" />Previous
                            </span>
                            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 leading-snug">{prev.label}</span>
                        </button>
                    ) : <div />}

                    {next ? (
                        <button
                            onClick={() => onNavigate(next.id)}
                            className="flex flex-col items-end gap-0.5 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-all text-right focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        >
                            <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold text-zinc-400 dark:text-zinc-500">
                                Next<ChevronRight className="w-3 h-3" />
                            </span>
                            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 leading-snug">{next.label}</span>
                        </button>
                    ) : (
                        <div className="flex flex-col items-end gap-0.5 p-4 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 text-right">
                            <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-300 dark:text-zinc-600">🎓 Curriculum complete</span>
                            <span className="text-sm text-zinc-400 dark:text-zinc-600">You made it!</span>
                        </div>
                    )}
                </div>
            </footer>
        </article>
    );
}

// ─── App ─────────────────────────────────────────────────────────────────────

function App() {
    const [activeId, setActiveId] = useState('01');
    const [dark, setDark] = useState(() =>
        typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
    );
    const [search, setSearch] = useState('');
    const [mobileOpen, setMobileOpen] = useState(false);
    const [completed, setCompleted] = useState<Set<string>>(loadCompleted);

    // Sync dark class on html element
    useEffect(() => {
        document.documentElement.classList.toggle('dark', dark);
    }, [dark]);

    // Persist progress
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...completed]));
    }, [completed]);

    const filteredModules = MODULES.filter(m =>
        m.label.toLowerCase().includes(search.toLowerCase()) ||
        m.description.toLowerCase().includes(search.toLowerCase())
    );

    const mod = MODULES.find(m => m.id === activeId) ?? MODULES[0];
    const Demo = mod.load;

    function navigate(id: string) {
        setActiveId(id);
        setMobileOpen(false);
        // Scroll content area to top
        document.getElementById('lesson-content')?.scrollTo(0, 0);
    }

    function toggleComplete() {
        setCompleted(prev => {
            const next = new Set(prev);
            if (next.has(mod.id)) next.delete(mod.id);
            else next.add(mod.id);
            return next;
        });
    }

    return (
        <div className="flex h-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans antialiased">
            <Sidebar
                allModules={MODULES}
                filteredModules={filteredModules}
                activeId={activeId}
                completed={completed}
                search={search}
                onSearch={setSearch}
                onSelect={navigate}
                mobileOpen={mobileOpen}
                onClose={() => setMobileOpen(false)}
            />

            <div className="flex flex-col flex-1 overflow-hidden min-w-0 lg:ml-0">
                <TopBar
                    mod={mod}
                    dark={dark}
                    onToggleDark={() => setDark(d => !d)}
                    onOpenSidebar={() => setMobileOpen(true)}
                />
                <main id="lesson-content" className="flex-1 overflow-y-auto bg-zinc-50 dark:bg-zinc-950">
                    <LessonLayout
                        mod={mod}
                        allMods={MODULES}
                        completed={completed}
                        onNavigate={navigate}
                        onToggleComplete={toggleComplete}
                    >
                        <Suspense fallback={<LoadingSpinner />}>
                            <Demo />
                        </Suspense>
                    </LessonLayout>
                </main>
            </div>
        </div>
    );
}

// ─── Mount ───────────────────────────────────────────────────────────────────

createRoot(document.getElementById('root')!).render(
    <React.StrictMode><App /></React.StrictMode>
);
