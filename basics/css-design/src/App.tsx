import React, { Suspense, useState } from 'react';

const Day26Page = React.lazy(() => import('./day26-layout/Day26Page'));
const Day27Page = React.lazy(() => import('./day27-responsive/Day27Page'));
const Day28Page = React.lazy(() => import('./day28-architecture/Day28Page'));
const Day29Page = React.lazy(() => import('./day29-tailwind/Day29Page'));
const Day30Page = React.lazy(() => import('./day30-design-system/Day30Page'));

const tabs = [
  { id: 'day26', label: 'Day 26', subtitle: 'Layout', Component: Day26Page },
  { id: 'day27', label: 'Day 27', subtitle: 'Responsive', Component: Day27Page },
  { id: 'day28', label: 'Day 28', subtitle: 'Architecture', Component: Day28Page },
  { id: 'day29', label: 'Day 29', subtitle: 'Tailwind', Component: Day29Page },
  { id: 'day30', label: 'Day 30', subtitle: 'Design System', Component: Day30Page },
] as const;

type TabId = (typeof tabs)[number]['id'];

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('day26');

  const activeEntry = tabs.find((t) => t.id === activeTab)!;
  const { Component: ActivePage } = activeEntry;

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 bg-slate-900 flex flex-col py-6 border-r border-slate-800">
        <div className="px-4 mb-8">
          <h1 className="text-white font-bold text-lg leading-tight">CSS Design</h1>
          <p className="text-slate-400 text-xs mt-1">Interactive Demos</p>
        </div>

        <nav className="flex flex-col gap-1 px-2">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={[
                  'w-full text-left px-3 py-3 rounded-md transition-colors',
                  isActive
                    ? 'bg-slate-800 border-l-4 border-indigo-500 pl-2 text-white'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border-l-4 border-transparent pl-2',
                ].join(' ')}
              >
                <span className="block text-sm font-semibold">{tab.label}</span>
                <span className="block text-xs text-slate-500 mt-0.5">{tab.subtitle}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-slate-950">
        <Suspense
          fallback={
            <div className="flex h-full items-center justify-center">
              <span className="text-slate-400 text-sm">Loading...</span>
            </div>
          }
        >
          <ActivePage />
        </Suspense>
      </main>
    </div>
  );
}
