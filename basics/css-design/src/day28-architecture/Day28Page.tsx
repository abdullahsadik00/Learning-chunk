import { BEMExample } from './BEMExample';
import { TailwindExample } from './TailwindExample';

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

// ─── Comparison table data ──────────────────────────────────────────────────

const CRITERIA = [
  { label: 'Global scope',    bem: '⚠️ risk', modules: '✅ local', cssInJs: '✅ local',  tailwind: '✅ none' },
  { label: 'Type safety',     bem: '❌ none', modules: '⚠️ partial', cssInJs: '✅ full', tailwind: '⚠️ partial' },
  { label: 'File size',       bem: '⚠️ grows', modules: '⚠️ grows', cssInJs: '⚠️ runtime', tailwind: '✅ purged' },
  { label: 'Co-location',     bem: '❌ split', modules: '⚠️ 2 files', cssInJs: '✅ same', tailwind: '✅ same' },
  { label: 'Learning curve',  bem: '✅ low',  modules: '✅ low',    cssInJs: '⚠️ medium', tailwind: '⚠️ medium' },
  { label: 'Bundle impact',   bem: '❌ all CSS', modules: '❌ all CSS', cssInJs: '⚠️ JS+CSS', tailwind: '✅ atomic' },
];

const COL_HEADERS = ['Criterion', 'BEM', 'CSS Modules', 'CSS-in-JS', 'Tailwind'];

export default function Day28Page() {
  return (
    <div className="space-y-16">
      {/* Page header */}
      <div className="border-b border-slate-700 pb-8">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-xs font-bold text-indigo-400 bg-indigo-900/50 px-3 py-1 rounded-full uppercase tracking-widest">
            Day 28
          </span>
          <span className="text-xs text-slate-500">Phase 3 — CSS Mastery</span>
        </div>
        <h1 className="text-3xl font-bold text-slate-100 mb-2">CSS Architecture</h1>
        <p className="text-slate-400 max-w-2xl">
          Compare the major CSS methodologies: BEM with CSS Modules for locally-scoped class names,
          Tailwind for co-located utility classes, and a head-to-head methodology comparison.
        </p>
      </div>

      {/* Section 1 — BEM + CSS Modules */}
      <Section
        number={1}
        title="BEM + CSS Modules"
        description="Block__Element--Modifier naming combined with CSS Modules for local scope — no global class collisions."
      >
        <BEMExample />
      </Section>

      <div className="border-t border-slate-800" />

      {/* Section 2 — Tailwind */}
      <Section
        number={2}
        title="Tailwind Utility Classes"
        description="The same components rebuilt with Tailwind — no class naming, no separate CSS files, conditional classes via clsx."
      >
        <TailwindExample />
      </Section>

      <div className="border-t border-slate-800" />

      {/* Section 3 — Comparison table */}
      <Section
        number={3}
        title="Methodology Comparison"
        description="BEM vs CSS Modules vs CSS-in-JS vs Tailwind — a practical trade-off matrix."
      >
        <div className="overflow-x-auto rounded-xl border border-slate-700">
          <table className="w-full text-sm min-w-[540px]">
            <thead>
              <tr className="bg-slate-800">
                {COL_HEADERS.map((h, i) => (
                  <th
                    key={h}
                    className={`px-5 py-3 text-left font-semibold ${i === 0 ? 'text-slate-400' : 'text-indigo-300'}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CRITERIA.map((row, i) => (
                <tr
                  key={row.label}
                  className={`border-t border-slate-700 ${i % 2 === 0 ? 'bg-slate-900' : 'bg-slate-900/60'}`}
                >
                  <td className="px-5 py-3 font-medium text-slate-300">{row.label}</td>
                  <td className="px-5 py-3 text-slate-400">{row.bem}</td>
                  <td className="px-5 py-3 text-slate-400">{row.modules}</td>
                  <td className="px-5 py-3 text-slate-400">{row.cssInJs}</td>
                  <td className="px-5 py-3 text-slate-400">{row.tailwind}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-4 text-sm text-slate-400">
          <span>✅ Strong advantage</span>
          <span>⚠️ Neutral / trade-off</span>
          <span>❌ Disadvantage</span>
        </div>

        {/* Summary note */}
        <div className="bg-indigo-950 border border-indigo-800 rounded-xl p-5 mt-4">
          <h4 className="font-semibold text-indigo-300 mb-2">Practical Guidance</h4>
          <ul className="space-y-1.5 text-slate-300 text-sm list-disc list-inside">
            <li><strong>BEM</strong> — great for plain HTML/CSS projects or design systems with clear component ownership.</li>
            <li><strong>CSS Modules</strong> — the sweet spot for React apps that need local scope without runtime cost.</li>
            <li><strong>CSS-in-JS</strong> (styled-components, Emotion) — best when you need full TypeScript prop-to-style mapping.</li>
            <li><strong>Tailwind</strong> — fastest for shipping UIs; relies on discipline and a design token system to stay consistent at scale.</li>
          </ul>
        </div>
      </Section>
    </div>
  );
}
