import { CSSVariablesDemo } from './CSSVariablesDemo';
import { DarkModeToggle } from './DarkModeToggle';
import { BreakpointVisualizer } from './BreakpointVisualizer';
import { ResponsiveCard } from './ResponsiveCard';

interface SectionProps {
  number: number;
  title: string;
  description: string;
  children: React.ReactNode;
}

function Section({ number, title, description, children }: SectionProps) {
  return (
    <section className="space-y-6">
      <div className="flex items-start gap-4">
        <span className="flex-shrink-0 w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg">
          {number}
        </span>
        <div>
          <h2 className="text-xl font-bold text-slate-100">{title}</h2>
          <p className="text-slate-400 text-sm mt-0.5">{description}</p>
        </div>
      </div>
      <div className="ml-14">{children}</div>
    </section>
  );
}

export default function Day27Page() {
  return (
    <div className="space-y-16">
      {/* Page header */}
      <div className="border-b border-slate-700 pb-8">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-xs font-bold text-indigo-400 bg-indigo-900/50 px-3 py-1 rounded-full uppercase tracking-widest">
            Day 27
          </span>
          <span className="text-xs text-slate-500">Phase 3 — CSS Mastery</span>
        </div>
        <h1 className="text-3xl font-bold text-slate-100 mb-2">
          Responsive Design & CSS Variables
        </h1>
        <p className="text-slate-400 max-w-2xl">
          Deep dive into responsive design patterns, CSS custom properties, dark mode implementation,
          and Tailwind's breakpoint system. All demos are interactive and update in real time.
        </p>
      </div>

      {/* Section 1 — CSS Variables */}
      <Section
        number={1}
        title="CSS Custom Properties"
        description="Live demo of CSS variables — change values in the controls and watch the preview update instantly."
      >
        <CSSVariablesDemo />
      </Section>

      <div className="border-t border-slate-800" />

      {/* Section 2 — Dark Mode */}
      <Section
        number={2}
        title="Dark Mode with Tailwind"
        description="Class-based dark mode using Tailwind's dark: prefix. Toggle persists to localStorage."
      >
        <DarkModeToggle />
      </Section>

      <div className="border-t border-slate-800" />

      {/* Section 3 — Breakpoints */}
      <Section
        number={3}
        title="Breakpoint Visualizer"
        description="Live breakpoint indicator — resize the window to see which Tailwind breakpoint is active."
      >
        <BreakpointVisualizer />
      </Section>

      <div className="border-t border-slate-800" />

      {/* Section 4 — Responsive Card */}
      <Section
        number={4}
        title="Responsive Card Component"
        description="A blog post card that adapts layout from mobile-stacked to desktop side-by-side using sm:, md:, lg: prefixes."
      >
        <ResponsiveCard />
      </Section>
    </div>
  );
}
