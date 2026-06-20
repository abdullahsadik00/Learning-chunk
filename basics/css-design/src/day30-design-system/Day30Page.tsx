import { TokenShowcase } from './TokenShowcase';
import { ComponentGallery, ToastContainer } from './ComponentGallery';
import { AccessibilityDemo } from './AccessibilityDemo';

// ---------------------------------------------------------------------------
// Section wrapper
// ---------------------------------------------------------------------------

interface SectionProps {
  id: string;
  badge: string;
  title: string;
  description: string;
  children: React.ReactNode;
}

function Section({ id, badge, title, description, children }: SectionProps) {
  return (
    <section id={id} className="scroll-mt-8">
      <div className="mb-8">
        <span className="text-xs font-semibold text-indigo-400 uppercase tracking-widest">{badge}</span>
        <h2 className="text-2xl font-bold text-white mt-1">{title}</h2>
        <p className="text-slate-400 text-sm mt-1.5 max-w-2xl">{description}</p>
      </div>
      {children}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Nav pills
// ---------------------------------------------------------------------------

const NAV_ITEMS = [
  { id: 'tokens',  label: 'Design Tokens' },
  { id: 'gallery', label: 'Component Gallery' },
  { id: 'a11y',   label: 'Accessibility' },
];

function PageNav() {
  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <nav className="flex flex-wrap gap-2 mb-12">
      {NAV_ITEMS.map((item) => (
        <button
          key={item.id}
          onClick={() => scrollTo(item.id)}
          className="text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 ring-1 ring-slate-700 hover:ring-slate-600 px-4 py-2 rounded-lg transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function Day30Page() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Toast container — must be mounted at page level */}
      <ToastContainer />

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-semibold text-slate-500 bg-slate-800 ring-1 ring-slate-700 px-2.5 py-1 rounded-full">
              Day 30
            </span>
            <span className="text-xs text-slate-600">Phase 6 — CSS &amp; Design</span>
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight">
            Design System
          </h1>
          <p className="text-slate-400 mt-3 text-base max-w-2xl">
            Design token visualization, a full component gallery with Badges, Alerts, Toasts,
            Modals, Tooltips, and Dropdowns — plus an accessibility-first patterns deep dive.
          </p>
        </header>

        <PageNav />

        <div className="space-y-20">
          <Section
            id="tokens"
            badge="Reference"
            title="Design Tokens"
            description="Every built-in Tailwind token: the complete color palette, typography scale, spacing, shadows, and border radii. Click any color swatch to copy its hex value."
          >
            <TokenShowcase />
          </Section>

          <div className="border-t border-slate-800" />

          <Section
            id="gallery"
            badge="Components"
            title="Component Gallery"
            description="Badge, Alert, Toast, Modal, Tooltip, and Dropdown — all interactive. Keyboard-navigable. Built with cva, clsx, and tailwind-merge."
          >
            <ComponentGallery />
          </Section>

          <div className="border-t border-slate-800" />

          <Section
            id="a11y"
            badge="Accessibility"
            title="Accessibility Patterns"
            description="WCAG-compliant focus management, color contrast ratios, ARIA attributes, keyboard navigation, and skip links — the foundations of inclusive UI."
          >
            <AccessibilityDemo />
          </Section>
        </div>

        <footer className="mt-20 pt-8 border-t border-slate-800 text-center text-xs text-slate-600">
          Day 30 · Design System · Learning-chunk Phase 6
        </footer>
      </div>
    </div>
  );
}
