import { useState, useEffect } from 'react';

export function DarkModeToggle() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    const stored = localStorage.getItem('theme');
    if (stored) return stored === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggle = () => setIsDark((prev) => !prev);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-100 mb-2">Dark Mode Toggle</h2>
        <p className="text-slate-400">
          Tailwind's <code className="text-indigo-400">dark:</code> prefix activates styles when the
          <code className="text-indigo-400"> &lt;html&gt;</code> element has the{' '}
          <code className="text-indigo-400">class="dark"</code> attribute.
        </p>
      </div>

      {/* Toggle Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggle}
          className="flex items-center gap-3 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-xl font-medium transition-all duration-300 border border-slate-600 hover:border-slate-500 active:scale-95"
        >
          <span className="text-xl transition-transform duration-300" style={{ transform: isDark ? 'rotate(0deg)' : 'rotate(180deg)' }}>
            {isDark ? '🌙' : '☀️'}
          </span>
          <span>{isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}</span>
        </button>
        <span className="text-slate-400 text-sm">
          Current: <span className="text-indigo-400 font-medium">{isDark ? 'dark' : 'light'}</span>
        </span>
      </div>

      {/* Sample Card showing light/dark styles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Live card — actually responds to dark mode */}
        <div>
          <p className="text-sm font-medium text-slate-400 mb-2">Live Preview (responds to toggle)</p>
          <div className="bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 border border-gray-200 dark:border-slate-700 rounded-xl p-5 transition-colors duration-300">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-lg">
                🎨
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-slate-100">Adaptive Card</h4>
                <p className="text-xs text-gray-500 dark:text-slate-400">Responds to theme toggle</p>
              </div>
            </div>
            <p className="text-gray-600 dark:text-slate-300 text-sm mb-4">
              This card uses Tailwind's <code className="bg-gray-100 dark:bg-slate-700 px-1 rounded text-indigo-600 dark:text-indigo-400">dark:</code> variants.
              No JavaScript class logic needed inside the component — it just works.
            </p>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 bg-indigo-600 dark:bg-indigo-500 text-white text-sm rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors">
                Action
              </button>
              <button className="px-3 py-1.5 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 text-sm rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>

        {/* Implementation note */}
        <div>
          <p className="text-sm font-medium text-slate-400 mb-2">Implementation Note</p>
          <div className="bg-slate-900 rounded-xl p-5 border border-slate-700 h-full">
            <p className="text-slate-300 text-sm mb-3">
              Add <code className="text-emerald-400">class='dark'</code> to the{' '}
              <code className="text-emerald-400">&lt;html&gt;</code> element.
              Tailwind's <code className="text-emerald-400">dark:</code> prefix activates.
            </p>
            <pre className="text-xs font-mono text-slate-400 bg-slate-800 rounded-lg p-3 overflow-x-auto">{`// Toggle dark mode
document.documentElement
  .classList.toggle('dark', isDark);

// Persist preference
localStorage.setItem(
  'theme',
  isDark ? 'dark' : 'light'
);`}</pre>
          </div>
        </div>
      </div>

      {/* Approach comparison */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-slate-200 mb-4">Class-based vs. Media Query</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-900 rounded-lg p-4">
            <p className="text-emerald-400 font-medium text-sm mb-2">Class-based (Tailwind default)</p>
            <pre className="text-xs font-mono text-slate-400 overflow-x-auto">{`// tailwind.config.ts
export default {
  darkMode: 'class', // <-- this
}

// Usage
<div class="bg-white dark:bg-slate-800">

// Toggle: add/remove 'dark'
// from <html> element`}</pre>
            <p className="text-slate-400 text-xs mt-2">
              User controls the toggle. State stored in <code className="text-slate-300">localStorage</code>.
            </p>
          </div>
          <div className="bg-slate-900 rounded-lg p-4">
            <p className="text-amber-400 font-medium text-sm mb-2">Media query approach</p>
            <pre className="text-xs font-mono text-slate-400 overflow-x-auto">{`// tailwind.config.ts
export default {
  darkMode: 'media', // <-- this
}

// Browser auto-activates dark:
// based on OS preference

// No JavaScript toggle needed
// But user can't override it`}</pre>
            <p className="text-slate-400 text-xs mt-2">
              Follows <code className="text-slate-300">prefers-color-scheme</code> only. No user control.
            </p>
          </div>
        </div>
      </div>

      {/* Tailwind config snippet */}
      <div className="bg-slate-900 rounded-xl p-5 border border-slate-700">
        <h4 className="text-slate-300 font-medium mb-3 text-sm">Tailwind Config (this project)</h4>
        <pre className="text-sm font-mono text-emerald-400">{`// tailwind.config.ts
export default {
  darkMode: 'class',   // class-based dark mode
  content: ['./src/**/*.{ts,tsx}'],
  // ...
}`}</pre>
      </div>
    </div>
  );
}
