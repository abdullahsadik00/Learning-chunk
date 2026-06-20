import clsx from 'clsx';

// ─── Types ─────────────────────────────────────────────────────────────────

interface ButtonProps {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  icon?: string;
  children: React.ReactNode;
}

interface CardProps {
  title: string;
  body: string;
  featured?: boolean;
}

// ─── Button — Tailwind version ─────────────────────────────────────────────

function TailwindButton({ variant = 'primary', size = 'md', disabled = false, icon, children }: ButtonProps) {
  return (
    <button
      disabled={disabled}
      className={clsx(
        // Base styles — shared by all variants
        'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900',

        // Variant — color intent
        variant === 'primary' && 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95',
        variant === 'secondary' && 'bg-slate-700 text-slate-200 hover:bg-slate-600 border border-slate-600 active:scale-95',

        // Size — spatial scale
        size === 'sm' && 'px-3 py-1.5 text-sm',
        size === 'md' && 'px-4 py-2 text-base',
        size === 'lg' && 'px-6 py-3 text-lg rounded-xl',

        // State
        disabled && 'opacity-45 cursor-not-allowed pointer-events-none',
      )}
    >
      {icon && <span className="w-[1.125em] h-[1.125em] inline-flex items-center justify-center">{icon}</span>}
      <span className="whitespace-nowrap">{children}</span>
    </button>
  );
}

// ─── Card — Tailwind version ───────────────────────────────────────────────

function TailwindCard({ title, body, featured = false }: CardProps) {
  return (
    <div
      className={clsx(
        'bg-slate-800 border rounded-2xl overflow-hidden transition-all duration-200',
        'hover:border-indigo-500 hover:shadow-[0_0_0_1px_rgba(99,102,241,0.2)]',
        featured ? 'border-l-4 border-l-indigo-500 border-slate-700' : 'border-slate-700',
      )}
    >
      {/* No .card__header class needed — just utility classes */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900/70 border-b border-slate-700">
        <span className="font-semibold text-slate-200">{title}</span>
        {featured && (
          <span className="text-xs font-bold text-indigo-400 bg-indigo-900/50 px-2 py-0.5 rounded-full">
            Featured
          </span>
        )}
      </div>

      <div className="px-5 py-4 text-slate-400 text-[0.9375rem] leading-relaxed">{body}</div>

      <div className="flex items-center justify-end gap-2 px-5 py-3 bg-slate-900/70 border-t border-slate-700">
        <TailwindButton variant="secondary" size="sm">Dismiss</TailwindButton>
        <TailwindButton variant="primary" size="sm">Action</TailwindButton>
      </div>
    </div>
  );
}

// ─── Main export ───────────────────────────────────────────────────────────

export function TailwindExample() {
  return (
    <div className="space-y-8">
      {/* clsx explanation */}
      <div className="bg-slate-900 rounded-xl p-5 border border-slate-700">
        <h4 className="text-slate-200 font-semibold mb-3">
          Conditional Classes with <code className="text-indigo-400">clsx</code>
        </h4>
        <p className="text-slate-400 text-sm mb-4">
          <code className="text-indigo-400">clsx</code> merges class strings and conditionally includes
          them. Falsy values (<code className="text-slate-300">false</code>,{' '}
          <code className="text-slate-300">undefined</code>) are filtered out automatically — no
          <code className="text-slate-300"> "undefined"</code> strings in the DOM.
        </p>
        <pre className="bg-slate-800 rounded-lg p-4 text-sm font-mono text-emerald-400 overflow-x-auto">{`import clsx from 'clsx';

function Button({ variant = 'primary', size = 'md', children }) {
  return (
    <button className={clsx(
      // Always applied
      'inline-flex items-center font-medium rounded-lg transition-colors',

      // Variant — one branch is truthy
      variant === 'primary'   && 'bg-indigo-600 text-white hover:bg-indigo-700',
      variant === 'secondary' && 'bg-slate-700 text-slate-200 hover:bg-slate-600',

      // Size — one branch is truthy
      size === 'sm' && 'px-3 py-1.5 text-sm',
      size === 'md' && 'px-4 py-2 text-base',
      size === 'lg' && 'px-6 py-3 text-lg',
    )}>
      {children}
    </button>
  );
}`}</pre>
      </div>

      {/* No naming needed */}
      <div className="bg-emerald-950/40 border border-emerald-800/50 rounded-xl p-5">
        <h4 className="text-emerald-300 font-semibold mb-2">Tailwind Eliminates Naming</h4>
        <p className="text-slate-400 text-sm mb-3">
          With Tailwind, there's no <code className="text-slate-300">.card__header</code> to name —
          you describe the style directly on the element. No separate CSS file, no risk of name
          collisions, no specificity wars.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
          <div className="bg-slate-900 rounded p-3">
            <p className="text-rose-400 mb-2">BEM — two files to maintain</p>
            <pre className="text-slate-400">{`/* card.module.css */
.card__header {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid ...;
  background: ...;
}

/* Card.tsx */
<div className={styles.card__header}>
  {title}
</div>`}</pre>
          </div>
          <div className="bg-slate-900 rounded p-3">
            <p className="text-emerald-400 mb-2">Tailwind — co-located, one place</p>
            <pre className="text-slate-400">{`/* Card.tsx — no .css file */
<div className="
  px-5 py-3.5
  border-b border-slate-700
  bg-slate-900/70
">
  {title}
</div>`}</pre>
          </div>
        </div>
      </div>

      {/* Button demo */}
      <div>
        <h4 className="text-slate-200 font-semibold mb-4">Tailwind Button Variants</h4>
        <div className="flex flex-wrap gap-3">
          <TailwindButton variant="primary" size="sm" icon="✨">Small Primary</TailwindButton>
          <TailwindButton variant="primary" size="md">Medium Primary</TailwindButton>
          <TailwindButton variant="primary" size="lg">Large Primary</TailwindButton>
          <TailwindButton variant="secondary" size="md">Secondary</TailwindButton>
          <TailwindButton variant="primary" size="md" disabled>Disabled</TailwindButton>
        </div>
      </div>

      {/* Card demo */}
      <div>
        <h4 className="text-slate-200 font-semibold mb-4">Tailwind Card Variants</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TailwindCard
            title="Standard Card"
            body="Built entirely with Tailwind utilities. No CSS file, no class names to invent. The styles live right next to the markup."
          />
          <TailwindCard
            title="Featured Card"
            body="The featured modifier is a conditional clsx expression — border-l-4 border-l-indigo-500 — applied when featured is true."
            featured
          />
        </div>
      </div>
    </div>
  );
}
