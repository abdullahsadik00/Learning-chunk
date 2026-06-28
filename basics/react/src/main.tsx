import React, { useState, useEffect, Suspense, lazy, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import {
    Search, X, Menu, Moon, Sun, ChevronRight, ChevronLeft,
    Clock, BookOpen, Circle, Check, CheckCircle2, Loader2,
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

// ─── Utilities ────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'react-mastery-completed';
const THEME_KEY   = 'react-mastery-theme';

function loadCompleted(): Set<string> {
    try { return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')); }
    catch { return new Set(); }
}

// ─── Badges ──────────────────────────────────────────────────────────────────

function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
    const cls: Record<Difficulty, string> = {
        Beginner:     'bg-emerald-50   text-emerald-700  border-emerald-200   dark:bg-emerald-500/10  dark:text-emerald-400  dark:border-emerald-500/20',
        Intermediate: 'bg-amber-50     text-amber-700    border-amber-200     dark:bg-amber-500/10    dark:text-amber-400    dark:border-amber-500/20',
        Advanced:     'bg-red-50       text-red-700      border-red-200       dark:bg-red-500/10      dark:text-red-400      dark:border-red-500/20',
    };
    return (
        <span className={`inline-flex items-center text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${cls[difficulty]}`}>
            {difficulty}
        </span>
    );
}

function DayBadge({ day }: { day: number }) {
    return (
        <span className="inline-flex items-center text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#EDECEB] text-[#78716C] border border-[#E4E3E0] dark:bg-[#1E1E22] dark:text-[#8C8C9A] dark:border-white/[0.07]">
            Day {day}
        </span>
    );
}

// ─── Loading ──────────────────────────────────────────────────────────────────

function LoadingSpinner() {
    return (
        <div className="flex items-center justify-center py-20">
            <Loader2 className="w-5 h-5 text-[#7C3AED] dark:text-[#A78BFA] animate-spin" />
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
    const progress = (completed.size / allModules.length) * 100;

    return (
        <>
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-20 bg-[#1C1917]/30 backdrop-blur-sm lg:hidden"
                    onClick={onClose}
                />
            )}

            <aside className={[
                'fixed inset-y-0 left-0 z-30 flex flex-col w-[244px] shrink-0',
                'bg-[#EDECEB] dark:bg-[#18181B]',
                'border-r border-[#E0DFDB] dark:border-white/[0.06]',
                'transition-transform duration-200 ease-in-out',
                'lg:static lg:translate-x-0',
                mobileOpen ? 'translate-x-0' : '-translate-x-full',
            ].join(' ')}>

                {/* ── Logo ── */}
                <div className="flex items-center gap-2.5 px-3.5 py-3.5 border-b border-[#E0DFDB] dark:border-white/[0.06] shrink-0">
                    <div className="w-7 h-7 rounded-[8px] bg-gradient-to-br from-[#FF7B54] to-[#FF3B3B] flex items-center justify-center shrink-0 shadow-sm">
                        <BookOpen className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-[#1C1917] dark:text-[#F4F3F9] leading-none">React Mastery</p>
                        <p className="text-[11px] text-[#A8A29E] dark:text-[#555560] mt-[3px]">Days 12–17</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="lg:hidden p-1.5 rounded-md hover:bg-[#E4E3E0] dark:hover:bg-[#26262A] text-[#A8A29E] transition-colors"
                        aria-label="Close sidebar"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>

                {/* ── Search ── */}
                <div className="px-3 pt-2.5 pb-2 shrink-0">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#A8A29E] dark:text-[#55555F] pointer-events-none" />
                        <input
                            type="search"
                            value={search}
                            onChange={e => onSearch(e.target.value)}
                            placeholder="Search lessons…"
                            className="w-full pl-8 pr-6 py-1.5 text-[12px] rounded-md bg-white dark:bg-[#111113] border border-[#E4E3E0] dark:border-white/[0.08] text-[#1C1917] dark:text-[#F4F3F9] placeholder-[#C4BEB8] dark:placeholder-[#3A3A42] focus:outline-none focus:border-[#7C3AED]/40 dark:focus:border-[#A78BFA]/30 focus:ring-2 focus:ring-[#7C3AED]/8 dark:focus:ring-[#A78BFA]/8 transition-all"
                        />
                        {search && (
                            <button
                                onClick={() => onSearch('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#A8A29E] hover:text-[#78716C] dark:hover:text-[#8C8C9A]"
                                aria-label="Clear search"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                </div>

                {/* ── Progress ── */}
                <div className="px-3.5 pb-2.5 shrink-0">
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] text-[#A8A29E] dark:text-[#55555F]">Progress</span>
                        <span className="text-[11px] font-medium text-[#78716C] dark:text-[#8C8C9A] tabular-nums">
                            {completed.size} / {allModules.length}
                        </span>
                    </div>
                    <div className="h-[3px] bg-[#E4E3E0] dark:bg-[#26262A] rounded-full overflow-hidden">
                        <div
                            className="h-full bg-[#7C3AED] dark:bg-[#A78BFA] rounded-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                <div className="h-px bg-[#E0DFDB] dark:bg-white/[0.06] mx-3 shrink-0" />

                {/* ── Nav ── */}
                <nav className="flex-1 overflow-y-auto py-1.5 px-2" aria-label="Curriculum lessons">
                    {filteredModules.length === 0 ? (
                        <p className="px-3 py-8 text-[12px] text-[#A8A29E] dark:text-[#55555F] text-center leading-relaxed">
                            No lessons match<br />"{search}"
                        </p>
                    ) : (
                        days.map(day => {
                            const dayMods = filteredModules.filter(m => m.day === day);
                            if (!dayMods.length) return null;
                            return (
                                <div key={day} className="mb-1">
                                    <p className="px-2 pt-2.5 pb-1 text-[9.5px] font-semibold uppercase tracking-[0.1em] text-[#C4BEB8] dark:text-[#3A3A42] select-none">
                                        Day {day}
                                    </p>
                                    {dayMods.map(m => {
                                        const isActive = m.id === activeId;
                                        const isDone   = completed.has(m.id);
                                        return (
                                            <button
                                                key={m.id}
                                                onClick={() => onSelect(m.id)}
                                                aria-current={isActive ? 'page' : undefined}
                                                className={[
                                                    'group w-full flex items-center gap-2 px-2.5 py-[6px] rounded-md text-left text-[12.5px] transition-colors',
                                                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED]/30',
                                                    isActive
                                                        ? 'bg-white dark:bg-[#26262A] text-[#5B21B6] dark:text-[#C4B5FD] font-medium shadow-[0_1px_2px_rgba(28,25,23,0.08)] dark:shadow-none'
                                                        : 'text-[#78716C] dark:text-[#8C8C9A] hover:bg-[#E8E7E3] dark:hover:bg-[#1E1E22] hover:text-[#1C1917] dark:hover:text-[#F4F3F9]',
                                                ].join(' ')}
                                            >
                                                {/* Completion / active indicator */}
                                                <span className={[
                                                    'shrink-0 w-[18px] h-[18px] flex items-center justify-center rounded-full text-[9px] font-mono transition-colors',
                                                    isDone
                                                        ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                                                        : isActive
                                                            ? 'bg-[#7C3AED]/12 dark:bg-[#A78BFA]/15 text-[#7C3AED] dark:text-[#A78BFA]'
                                                            : 'bg-[#E4E3E0] dark:bg-[#26262A] text-[#A8A29E] dark:text-[#3A3A42]',
                                                ].join(' ')}>
                                                    {isDone ? <Check className="w-2.5 h-2.5" /> : m.id}
                                                </span>

                                                {/* Label */}
                                                <span className="flex-1 leading-snug">{m.label}</span>

                                                {/* Raycast-style hover-reveal kbd chip */}
                                                <kbd className={[
                                                    'shrink-0 text-[9px] font-mono px-1 py-[1px] rounded border transition-opacity',
                                                    isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
                                                    isActive
                                                        ? 'border-[#7C3AED]/20 dark:border-[#A78BFA]/20 text-[#7C3AED] dark:text-[#A78BFA] bg-[#F3EFFF] dark:bg-[#A78BFA]/8'
                                                        : 'border-[#E4E3E0] dark:border-white/[0.08] text-[#A8A29E] dark:text-[#3A3A42] bg-[#F7F6F5] dark:bg-[#1C1C1F]',
                                                ].join(' ')}>
                                                    {m.id}
                                                </kbd>
                                            </button>
                                        );
                                    })}
                                </div>
                            );
                        })
                    )}
                </nav>

                {/* ── Footer ── */}
                <div className="px-3.5 py-2.5 border-t border-[#E0DFDB] dark:border-white/[0.06] shrink-0">
                    <p className="text-[10px] text-[#C4BEB8] dark:text-[#3A3A42]">
                        Phase 3 · React 18 · TypeScript
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
        <header className="shrink-0 flex items-center gap-3 px-4 h-11 border-b border-[#E4E3E0] dark:border-white/[0.06] bg-[#F7F6F5]/95 dark:bg-[#111113]/95 backdrop-blur-sm">
            <button
                onClick={onOpenSidebar}
                className="lg:hidden p-1.5 rounded-md hover:bg-[#EDECEB] dark:hover:bg-[#26262A] text-[#A8A29E] dark:text-[#55555F] transition-colors"
                aria-label="Open sidebar"
            >
                <Menu className="w-4 h-4" />
            </button>

            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 flex-1 min-w-0" aria-label="Breadcrumb">
                <span className="text-[12px] text-[#C4BEB8] dark:text-[#3A3A42] hidden sm:block shrink-0">React Mastery</span>
                <ChevronRight className="w-3 h-3 text-[#D8D5D0] dark:text-[#2A2A32] hidden sm:block shrink-0" />
                <span className="text-[13px] font-medium text-[#1C1917] dark:text-[#F4F3F9] truncate">{mod.label}</span>
            </nav>

            <div className="flex items-center gap-2 shrink-0">
                <DifficultyBadge difficulty={mod.difficulty} />
                <span className="hidden md:flex items-center gap-1 text-[11px] text-[#A8A29E] dark:text-[#55555F]">
                    <Clock className="w-3 h-3" />
                    {mod.readingTime}
                </span>
                <div className="w-px h-3.5 bg-[#E4E3E0] dark:bg-white/[0.08] hidden sm:block" />
                <button
                    onClick={onToggleDark}
                    className="p-1.5 rounded-md hover:bg-[#EDECEB] dark:hover:bg-[#26262A] text-[#A8A29E] dark:text-[#55555F] transition-colors"
                    aria-label={dark ? 'Light mode' : 'Dark mode'}
                >
                    {dark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
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
    const idx  = allMods.findIndex(m => m.id === mod.id);
    const prev = allMods[idx - 1];
    const next = allMods[idx + 1];
    const done = completed.has(mod.id);

    return (
        <article className="max-w-[740px] mx-auto px-6 py-9 pb-16">

            {/* ── Lesson header ── */}
            <header className="mb-8">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                    <DayBadge day={mod.day} />
                    <span className="text-[10px] font-mono text-[#C4BEB8] dark:text-[#3A3A42]">{mod.id} of {allMods.length}</span>
                    <DifficultyBadge difficulty={mod.difficulty} />
                    <span className="ml-auto flex items-center gap-1 text-[11px] text-[#A8A29E] dark:text-[#55555F]">
                        <Clock className="w-3 h-3" />
                        {mod.readingTime}
                    </span>
                </div>
                <h1
                    className="text-[28px] font-semibold text-[#1C1917] dark:text-[#F4F3F9] leading-tight mb-3"
                    style={{ letterSpacing: '-0.018em', textWrap: 'balance' } as React.CSSProperties}
                >
                    {mod.label}
                </h1>
                <p className="text-[14px] text-[#78716C] dark:text-[#8C8C9A] leading-relaxed max-w-[580px]">
                    {mod.description}
                </p>
            </header>

            {/* ── Learning objectives — Raycast left-border style ── */}
            <section className="mb-8 pl-4 border-l-2 border-[#7C3AED]/20 dark:border-[#A78BFA]/20">
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#7C3AED] dark:text-[#A78BFA] mb-3">
                    Learning Objectives
                </p>
                <ol className="space-y-2">
                    {mod.objectives.map((obj, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-[13px] text-[#78716C] dark:text-[#8C8C9A] leading-relaxed">
                            <span className="shrink-0 text-[9.5px] font-mono text-[#C4BEB8] dark:text-[#3A3A42] mt-[3px] w-5 tabular-nums">
                                {String(i + 1).padStart(2, '0')}
                            </span>
                            {obj}
                        </li>
                    ))}
                </ol>
            </section>

            {/* ── Demos separator ── */}
            <div className="flex items-center gap-3 mb-5">
                <span className="text-[9.5px] font-semibold uppercase tracking-[0.1em] text-[#C4BEB8] dark:text-[#3A3A42] shrink-0">
                    Interactive Demos
                </span>
                <div className="flex-1 h-px bg-[#E4E3E0] dark:bg-white/[0.06]" />
            </div>

            {/* ── Demo content ── */}
            {children}

            {/* ── Footer ── */}
            <footer className="mt-10 pt-6 border-t border-[#E4E3E0] dark:border-white/[0.06]">
                {/* Mark complete */}
                <button
                    onClick={onToggleComplete}
                    className={[
                        'flex items-center gap-2 text-[12.5px] font-medium px-3 py-1.5 rounded-md border transition-all mb-6',
                        done
                            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                            : 'bg-[#F7F6F5] dark:bg-[#1E1E22] text-[#78716C] dark:text-[#8C8C9A] border-[#E4E3E0] dark:border-white/[0.07] hover:bg-[#EDECEB] dark:hover:bg-[#26262A] hover:text-[#1C1917] dark:hover:text-[#F4F3F9]',
                    ].join(' ')}
                >
                    {done
                        ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        : <Circle className="w-3.5 h-3.5" />
                    }
                    {done ? 'Marked Complete' : 'Mark Complete'}
                </button>

                {/* Prev / Next */}
                <div className="grid grid-cols-2 gap-2.5">
                    {prev ? (
                        <button
                            onClick={() => onNavigate(prev.id)}
                            className="flex flex-col items-start gap-0.5 p-4 rounded-xl text-left border border-[#E4E3E0] dark:border-white/[0.07] bg-white dark:bg-[#1E1E22] hover:border-[#D0CEC9] dark:hover:border-white/[0.12] hover:shadow-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED]/30"
                        >
                            <span className="flex items-center gap-1 text-[9.5px] uppercase tracking-[0.08em] font-semibold text-[#C4BEB8] dark:text-[#3A3A42]">
                                <ChevronLeft className="w-3 h-3" />Previous
                            </span>
                            <span className="text-[12.5px] font-medium text-[#1C1917] dark:text-[#F4F3F9] leading-snug mt-0.5">{prev.label}</span>
                        </button>
                    ) : <div />}

                    {next ? (
                        <button
                            onClick={() => onNavigate(next.id)}
                            className="flex flex-col items-end gap-0.5 p-4 rounded-xl text-right border border-[#E4E3E0] dark:border-white/[0.07] bg-white dark:bg-[#1E1E22] hover:border-[#D0CEC9] dark:hover:border-white/[0.12] hover:shadow-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED]/30"
                        >
                            <span className="flex items-center gap-1 text-[9.5px] uppercase tracking-[0.08em] font-semibold text-[#C4BEB8] dark:text-[#3A3A42]">
                                Next<ChevronRight className="w-3 h-3" />
                            </span>
                            <span className="text-[12.5px] font-medium text-[#1C1917] dark:text-[#F4F3F9] leading-snug mt-0.5">{next.label}</span>
                        </button>
                    ) : (
                        <div className="flex flex-col items-end justify-center p-4 rounded-xl border border-dashed border-[#E4E3E0] dark:border-white/[0.05] text-right">
                            <span className="text-[11px] text-[#C4BEB8] dark:text-[#3A3A42] font-medium">🎓 Complete!</span>
                            <span className="text-[11px] text-[#D8D5D0] dark:text-[#2A2A32] mt-0.5">All modules done</span>
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
    const [dark, setDark] = useState<boolean>(() => {
        try { return localStorage.getItem(THEME_KEY) === 'dark'; }
        catch { return false; }   // light by default
    });
    const [search, setSearch]       = useState('');
    const [mobileOpen, setMobileOpen] = useState(false);
    const [completed, setCompleted] = useState<Set<string>>(loadCompleted);

    // Sync dark class
    useEffect(() => {
        document.documentElement.classList.toggle('dark', dark);
        try { localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light'); } catch { /* */ }
    }, [dark]);

    // Persist progress
    useEffect(() => {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...completed])); } catch { /* */ }
    }, [completed]);

    const filteredModules = MODULES.filter(m =>
        m.label.toLowerCase().includes(search.toLowerCase()) ||
        m.description.toLowerCase().includes(search.toLowerCase())
    );

    const mod  = MODULES.find(m => m.id === activeId) ?? MODULES[0];
    const Demo = mod.load;

    function navigate(id: string) {
        setActiveId(id);
        setMobileOpen(false);
        document.getElementById('lesson-scroll')?.scrollTo(0, 0);
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
        <div className="flex h-screen overflow-hidden bg-[#F7F6F5] dark:bg-[#111113] text-[#1C1917] dark:text-[#F4F3F9] font-sans antialiased">
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

            <div className="flex flex-col flex-1 overflow-hidden min-w-0">
                <TopBar
                    mod={mod}
                    dark={dark}
                    onToggleDark={() => setDark(d => !d)}
                    onOpenSidebar={() => setMobileOpen(true)}
                />
                <main
                    id="lesson-scroll"
                    className="flex-1 overflow-y-auto bg-[#F7F6F5] dark:bg-[#111113]"
                >
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
