import { ButtonVariantsDemo } from './ButtonVariants';
import { FormComponentsDemo } from './FormComponents';
import { CardComponentsDemo } from './CardComponents';
import { AnimationDemo } from './AnimationDemo';

// ---------------------------------------------------------------------------
// Section wrapper
// ---------------------------------------------------------------------------

interface SectionProps {
  id: string;
  label: string;
  title: string;
  description: string;
  children: React.ReactNode;
}

function Section({ id, label, title, description, children }: SectionProps) {
  return (
    <section id={id} className="scroll-mt-8">
      <div className="mb-8">
        <span className="text-xs font-semibold text-indigo-400 uppercase tracking-widest">{label}</span>
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
  { id: 'buttons', label: 'Buttons' },
  { id: 'forms', label: 'Forms' },
  { id: 'cards', label: 'Cards' },
  { id: 'animations', label: 'Animations' },
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

export default function Day29Page() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-semibold text-slate-500 bg-slate-800 ring-1 ring-slate-700 px-2.5 py-1 rounded-full">
              Day 29
            </span>
            <span className="text-xs text-slate-600">Phase 6 — CSS &amp; Design</span>
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight">
            Tailwind Component System
          </h1>
          <p className="text-slate-400 mt-3 text-base max-w-2xl">
            Production-grade UI components built with Tailwind CSS, class-variance-authority,
            clsx, and tailwind-merge. All variants, all sizes, all states.
          </p>
        </header>

        <PageNav />

        <div className="space-y-20">
          <Section
            id="buttons"
            label="Component"
            title="Button Variants"
            description="A complete button system using cva. Every variant, every size, icon support, loading states, and full-width layout."
          >
            <ButtonVariantsDemo />
          </Section>

          <div className="border-t border-slate-800" />

          <Section
            id="forms"
            label="Component"
            title="Form Components"
            description="Input, Textarea, Select, Checkbox, Radio, and Switch — all themed to the dark slate palette. Validation states, helper text, and a live demo form."
          >
            <FormComponentsDemo />
          </Section>

          <div className="border-t border-slate-800" />

          <Section
            id="cards"
            label="Component"
            title="Card Variants"
            description="Six card patterns covering the most common product UI needs: content, media, KPIs, profiles, pricing tiers, and dismissible notifications."
          >
            <CardComponentsDemo />
          </Section>

          <div className="border-t border-slate-800" />

          <Section
            id="animations"
            label="Concept"
            title="Animation Showcase"
            description="Hover transforms, skeleton shimmer loaders, entrance animations, and infinite loops — all driven by Tailwind utility classes and custom keyframes."
          >
            <AnimationDemo />
          </Section>
        </div>

        <footer className="mt-20 pt-8 border-t border-slate-800 text-center text-xs text-slate-600">
          Day 29 · Tailwind CSS Component System · Learning-chunk Phase 6
        </footer>
      </div>
    </div>
  );
}
