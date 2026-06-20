import { clsx } from 'clsx';
import { useState, useRef, useEffect, useId } from 'react';

// ============================================================================
// 1. Focus management
// ============================================================================

function FocusManagementSection() {
  const targetRef = useRef<HTMLButtonElement>(null);
  const [moved, setMoved] = useState(false);

  function moveFocus() {
    targetRef.current?.focus();
    setMoved(true);
    setTimeout(() => setMoved(false), 1500);
  }

  return (
    <div className="space-y-5">
      <p className="text-xs text-slate-400">
        Focus rings must be visible for keyboard users. Tailwind&apos;s{' '}
        <code className="text-indigo-400 font-mono text-[11px] bg-slate-900 px-1 py-0.5 rounded">focus-visible:</code>{' '}
        modifier shows rings only when navigating by keyboard — not on mouse click.
      </p>

      {/* Focus ring showcase */}
      <div className="flex flex-wrap gap-3">
        <button className="text-sm px-4 py-2 rounded-lg bg-indigo-600 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 transition-shadow">
          Indigo ring
        </button>
        <button className="text-sm px-4 py-2 rounded-lg bg-slate-700 text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 transition-shadow">
          Slate ring
        </button>
        <button className="text-sm px-4 py-2 rounded-lg border border-slate-600 text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 transition-shadow">
          Emerald ring
        </button>
        <input
          type="text"
          placeholder="Input focus ring"
          className="text-sm px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
        />
      </div>

      {/* Programmatic focus */}
      <div className="flex items-center gap-4 p-4 bg-slate-900 rounded-xl ring-1 ring-slate-700">
        <button
          onClick={moveFocus}
          className="text-sm bg-slate-700 hover:bg-slate-600 text-slate-200 px-4 py-2 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          Move focus →
        </button>
        <button
          ref={targetRef}
          className={clsx(
            'text-sm px-4 py-2 rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900',
            moved
              ? 'bg-indigo-600 text-white scale-105'
              : 'bg-slate-800 text-slate-300 ring-1 ring-slate-700'
          )}
        >
          Target element
        </button>
        <span className="text-xs text-slate-500">
          Focus moves programmatically via <code className="text-indigo-400 font-mono">ref.current?.focus()</code>
        </span>
      </div>

      {/* Tab order hint */}
      <p className="text-xs text-slate-500">
        Tab through the buttons above to see focus rings in action. Only keyboard navigation triggers the ring.
      </p>
    </div>
  );
}

// ============================================================================
// 2. Color contrast
// ============================================================================

interface ContrastPairProps {
  bg: string;
  text: string;
  bgLabel: string;
  textLabel: string;
  ratio: string;
  level: 'AAA' | 'AA' | 'FAIL';
  sample: string;
}

function ContrastPair({ bg, text, bgLabel, textLabel, ratio, level, sample }: ContrastPairProps) {
  return (
    <div className="rounded-xl overflow-hidden ring-1 ring-slate-700">
      {/* Preview */}
      <div className="px-5 py-6 flex items-center" style={{ backgroundColor: bg }}>
        <p className="text-lg font-semibold" style={{ color: text }}>
          {sample}
        </p>
      </div>
      {/* Info */}
      <div className="bg-slate-800 px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-400 font-mono">{bgLabel}</p>
          <p className="text-xs text-slate-400 font-mono">{textLabel}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400">Ratio: <span className="text-white font-semibold">{ratio}</span></p>
          <span
            className={clsx('text-[10px] font-bold px-2 py-0.5 rounded-full', {
              'bg-emerald-600/20 text-emerald-400': level === 'AAA',
              'bg-blue-600/20 text-blue-400': level === 'AA',
              'bg-rose-600/20 text-rose-400': level === 'FAIL',
            })}
          >
            {level}
          </span>
        </div>
      </div>
    </div>
  );
}

function ColorContrastSection() {
  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-400">
        WCAG 2.1 requires 4.5:1 for normal text (AA) and 7:1 for AAA. Large text (18pt+) needs 3:1 (AA).
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <ContrastPair bg="#1e293b" text="#f1f5f9" bgLabel="bg: slate-800" textLabel="text: slate-100" ratio="13.1:1" level="AAA" sample="Aa The quick fox" />
        <ContrastPair bg="#312e81" text="#e0e7ff" bgLabel="bg: indigo-900" textLabel="text: indigo-100" ratio="9.8:1" level="AAA" sample="Aa The quick fox" />
        <ContrastPair bg="#065f46" text="#d1fae5" bgLabel="bg: emerald-800" textLabel="text: emerald-100" ratio="8.2:1" level="AAA" sample="Aa The quick fox" />
        <ContrastPair bg="#4f46e5" text="#ffffff" bgLabel="bg: indigo-600" textLabel="text: white" ratio="4.5:1" level="AA" sample="Aa The quick fox" />
        <ContrastPair bg="#6366f1" text="#c7d2fe" bgLabel="bg: indigo-500" textLabel="text: indigo-200" ratio="3.1:1" level="FAIL" sample="Aa The quick fox" />
        <ContrastPair bg="#e2e8f0" text="#94a3b8" bgLabel="bg: slate-200" textLabel="text: slate-400" ratio="2.0:1" level="FAIL" sample="Aa The quick fox" />
      </div>
    </div>
  );
}

// ============================================================================
// 3. ARIA labels
// ============================================================================

function AriaLabelsSection() {
  const [expanded, setExpanded] = useState(false);
  const menuId = useId();

  return (
    <div className="space-y-6">
      {/* Icon-only buttons */}
      <div>
        <p className="text-xs text-slate-500 mb-3">Icon-only buttons with <code className="text-indigo-400 font-mono text-[11px]">aria-label</code> — screen readers announce the label, not the icon.</p>
        <div className="flex gap-3">
          {[
            { label: 'Add new item', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /> },
            { label: 'Delete item', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /> },
            { label: 'Share', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /> },
            { label: 'Download', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /> },
          ].map(({ label, icon }) => (
            <button
              key={label}
              aria-label={label}
              title={label}
              className="h-9 w-9 rounded-lg bg-slate-800 hover:bg-slate-700 ring-1 ring-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {icon}
              </svg>
            </button>
          ))}
        </div>
      </div>

      {/* sr-only text */}
      <div>
        <p className="text-xs text-slate-500 mb-3">
          <code className="text-indigo-400 font-mono text-[11px]">sr-only</code> hides text visually but keeps it in the accessibility tree.
        </p>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full">
            <span className="h-2 w-2 bg-emerald-400 rounded-full animate-pulse" aria-hidden="true" />
            <span className="sr-only">Status:</span>
            Active
          </span>
          <code className="text-[10px] text-slate-500 font-mono">{`<span className="sr-only">Status:</span>`}</code>
        </div>
      </div>

      {/* aria-expanded dropdown */}
      <div>
        <p className="text-xs text-slate-500 mb-3">
          <code className="text-indigo-400 font-mono text-[11px]">aria-expanded</code> and <code className="text-indigo-400 font-mono text-[11px]">aria-controls</code> link trigger to panel for screen readers.
        </p>
        <div className="space-y-2">
          <button
            aria-expanded={expanded}
            aria-controls={menuId}
            onClick={() => setExpanded((e) => !e)}
            className="inline-flex items-center gap-2 text-sm bg-slate-800 ring-1 ring-slate-700 text-slate-300 px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            Account menu
            <svg className={clsx('h-4 w-4 transition-transform', expanded && 'rotate-180')} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
            <span className="sr-only">({expanded ? 'expanded' : 'collapsed'})</span>
          </button>
          {expanded && (
            <div id={menuId} role="menu" className="bg-slate-800 ring-1 ring-slate-700 rounded-xl py-1 w-48 animate-slide-up">
              {['Profile', 'Settings', 'Sign out'].map((item) => (
                <button key={item} role="menuitem" className="w-full text-left text-sm text-slate-300 hover:bg-slate-700 px-3 py-2 transition-colors focus-visible:outline-none focus-visible:bg-slate-700">
                  {item}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 4. Keyboard navigation
// ============================================================================

const MENU_ITEMS = ['Dashboard', 'Projects', 'Team', 'Billing', 'Settings'];

function KeyboardNavSection() {
  const [activeIdx, setActiveIdx] = useState(0);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(e: React.KeyboardEvent, idx: number) {
    let next = idx;
    if (e.key === 'ArrowDown') { e.preventDefault(); next = (idx + 1) % MENU_ITEMS.length; }
    else if (e.key === 'ArrowUp') { e.preventDefault(); next = (idx - 1 + MENU_ITEMS.length) % MENU_ITEMS.length; }
    else if (e.key === 'Home') { e.preventDefault(); next = 0; }
    else if (e.key === 'End') { e.preventDefault(); next = MENU_ITEMS.length - 1; }
    else return;
    setActiveIdx(next);
    itemRefs.current[next]?.focus();
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-400">
        Use <kbd className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded border border-slate-600">↑</kbd>{' '}
        <kbd className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded border border-slate-600">↓</kbd>{' '}
        <kbd className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded border border-slate-600">Home</kbd>{' '}
        <kbd className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded border border-slate-600">End</kbd>{' '}
        to navigate the menu. Focus the first item to start.
      </p>

      <nav
        role="menu"
        aria-label="Main navigation"
        className="bg-slate-800 ring-1 ring-slate-700 rounded-xl overflow-hidden divide-y divide-slate-700/50 w-56"
      >
        {MENU_ITEMS.map((item, idx) => (
          <button
            key={item}
            role="menuitem"
            ref={(el) => { itemRefs.current[idx] = el; }}
            tabIndex={idx === 0 ? 0 : -1}
            onKeyDown={(e) => onKeyDown(e, idx)}
            onClick={() => setActiveIdx(idx)}
            aria-current={activeIdx === idx ? 'page' : undefined}
            className={clsx(
              'w-full flex items-center justify-between text-sm px-4 py-2.5 transition-colors focus-visible:outline-none focus-visible:bg-indigo-600/20',
              activeIdx === idx
                ? 'bg-indigo-600/10 text-indigo-400 font-medium'
                : 'text-slate-300 hover:bg-slate-700 hover:text-white'
            )}
          >
            {item}
            {activeIdx === idx && (
              <span className="text-[10px] text-indigo-400 font-mono">active</span>
            )}
          </button>
        ))}
      </nav>

      <div className="flex flex-wrap gap-2 items-center">
        <p className="text-xs text-slate-500">Keyboard shortcuts:</p>
        {[
          ['⌘K', 'Command palette'],
          ['⌘/', 'Search'],
          ['G then D', 'Go to dashboard'],
        ].map(([shortcut, desc]) => (
          <span key={shortcut} className="inline-flex items-center gap-1.5 text-xs text-slate-400">
            <kbd className="bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded text-[10px] border border-slate-600 font-mono">
              {shortcut}
            </kbd>
            <span className="text-slate-500">{desc}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// 5. Skip links
// ============================================================================

function SkipLinksSection() {
  const mainId = useId();

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-400">
        Skip links let keyboard users jump past repeated navigation. They are visually hidden until focused — Tab into the box below to reveal it.
      </p>

      {/* Simulated page with skip link */}
      <div className="bg-slate-900 ring-1 ring-slate-700 rounded-xl overflow-hidden">
        {/* Skip link — only visible on focus */}
        <a
          href={`#${mainId}`}
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-indigo-600 focus:text-white focus:text-sm focus:font-medium focus:px-4 focus:py-2 focus:rounded-lg focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-slate-900"
        >
          Skip to main content
        </a>

        {/* Simulated nav */}
        <nav className="flex gap-4 px-5 py-3 border-b border-slate-700 bg-slate-800">
          {['Home', 'About', 'Blog', 'Contact'].map((link) => (
            <a key={link} href="#" className="text-xs text-slate-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:text-indigo-400">
              {link}
            </a>
          ))}
        </nav>

        {/* Main content */}
        <main id={mainId} tabIndex={-1} className="px-5 py-4 focus-visible:outline-none">
          <p className="text-sm text-slate-400">
            <span className="text-slate-300 font-medium">Main content area.</span>{' '}
            The skip link above jumps focus here, bypassing the navigation bar. Tab into the nav bar above to trigger it.
          </p>
        </main>
      </div>

      <pre className="bg-slate-900 rounded-lg p-3 text-xs font-mono text-slate-300 overflow-x-auto">
{`<a
  href="#main"
  className="sr-only focus:not-sr-only focus:absolute
             focus:top-4 focus:left-4 focus:z-50
             focus:bg-indigo-600 focus:text-white
             focus:px-4 focus:py-2 focus:rounded-lg"
>
  Skip to main content
</a>`}
      </pre>
    </div>
  );
}

// ============================================================================
// Main export
// ============================================================================

interface DemoSectionProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

function DemoSection({ title, description, children }: DemoSectionProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-white">{title}</h3>
        <p className="text-xs text-slate-500 mt-0.5">{description}</p>
      </div>
      <div className="bg-slate-800/50 ring-1 ring-slate-700 rounded-xl p-5">
        {children}
      </div>
    </div>
  );
}

export function AccessibilityDemo() {
  return (
    <div className="space-y-10">
      <DemoSection
        title="1. Focus management"
        description="Visible focus indicators, focus-visible modifier, and programmatic focus movement."
      >
        <FocusManagementSection />
      </DemoSection>

      <DemoSection
        title="2. Color contrast (WCAG)"
        description="Text / background pairs with their contrast ratios. Green = passes AA or AAA. Red = fails."
      >
        <ColorContrastSection />
      </DemoSection>

      <DemoSection
        title="3. ARIA attributes"
        description="aria-label on icon buttons, sr-only for screen-reader-only text, aria-expanded on expandable controls."
      >
        <AriaLabelsSection />
      </DemoSection>

      <DemoSection
        title="4. Keyboard navigation"
        description="A menu with full arrow-key, Home, and End support. Role, aria-current, and tabIndex managed correctly."
      >
        <KeyboardNavSection />
      </DemoSection>

      <DemoSection
        title="5. Skip links"
        description="A visually hidden link that appears on focus, allowing keyboard users to bypass repeated navigation."
      >
        <SkipLinksSection />
      </DemoSection>
    </div>
  );
}
