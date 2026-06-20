import styles from './BEMExample.module.css';

// ─── Button ────────────────────────────────────────────────────────────────

interface BEMButtonProps {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  icon?: string;
  children: React.ReactNode;
}

function BEMButton({ variant = 'primary', size = 'md', disabled = false, icon, children }: BEMButtonProps) {
  const classes = [
    styles.button,
    variant === 'primary'   ? styles['button--primary']   : styles['button--secondary'],
    size === 'lg'           ? styles['button--large']     : undefined,
    size === 'sm'           ? styles['button--small']     : undefined,
    disabled                ? styles['button--disabled']  : undefined,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={classes} disabled={disabled}>
      {icon && <span className={styles.button__icon}>{icon}</span>}
      <span className={styles.button__text}>{children}</span>
    </button>
  );
}

// ─── Card ──────────────────────────────────────────────────────────────────

interface BEMCardProps {
  title: string;
  body: string;
  featured?: boolean;
}

function BEMCard({ title, body, featured = false }: BEMCardProps) {
  const cardClass = [styles.card, featured ? styles['card--featured'] : undefined]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={cardClass}>
      <div className={styles.card__header}>
        <span className="font-semibold text-slate-200">{title}</span>
        {featured && (
          <span className="text-xs font-bold text-indigo-400 bg-indigo-900/50 px-2 py-0.5 rounded-full">
            Featured
          </span>
        )}
      </div>
      <div className={styles.card__body}>{body}</div>
      <div className={styles.card__footer}>
        <BEMButton variant="secondary" size="sm">Dismiss</BEMButton>
        <BEMButton variant="primary" size="sm">Action</BEMButton>
      </div>
    </div>
  );
}

// ─── Main export ───────────────────────────────────────────────────────────

export function BEMExample() {
  return (
    <div className="space-y-8">
      {/* BEM naming explanation */}
      <div className="bg-slate-900 rounded-xl p-5 border border-slate-700">
        <h4 className="text-slate-200 font-semibold mb-3">BEM Naming Convention</h4>
        <div className="font-mono text-sm space-y-2">
          <div>
            <span className="text-emerald-400">Block</span>
            <span className="text-slate-500 mx-2">→</span>
            <code className="text-slate-300">.card</code>
            <span className="text-slate-500 text-xs ml-3">standalone, reusable component</span>
          </div>
          <div>
            <span className="text-blue-400">Element</span>
            <span className="text-slate-500 mx-2">→</span>
            <code className="text-slate-300">.card__header</code>
            <span className="text-slate-500 text-xs ml-3">part of the block (double underscore)</span>
          </div>
          <div>
            <span className="text-amber-400">Modifier</span>
            <span className="text-slate-500 mx-2">→</span>
            <code className="text-slate-300">.card--featured</code>
            <span className="text-slate-500 text-xs ml-3">variant or state (double dash)</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800">
            <code className="text-indigo-400">Block__Element--Modifier</code>
            <span className="text-slate-500 mx-2">→</span>
            <code className="text-slate-300">.card__header--highlighted</code>
          </div>
        </div>
      </div>

      {/* The global scope problem */}
      <div className="bg-amber-950/40 border border-amber-800/50 rounded-xl p-5">
        <h4 className="text-amber-300 font-semibold mb-2">The Problem: Global CSS Scope</h4>
        <p className="text-slate-400 text-sm mb-3">
          Plain CSS is global. A <code className="text-slate-300">.button</code> class in{' '}
          <code className="text-slate-300">Header.css</code> can silently override{' '}
          <code className="text-slate-300">.button</code> in{' '}
          <code className="text-slate-300">Footer.css</code> depending on import order.
        </p>
        <div className="grid grid-cols-2 gap-3 font-mono text-xs">
          <div className="bg-slate-900 rounded p-3">
            <p className="text-rose-400 mb-1">Header.css</p>
            <pre className="text-slate-400">{`.button {
  color: red;   /* wins? */
}`}</pre>
          </div>
          <div className="bg-slate-900 rounded p-3">
            <p className="text-rose-400 mb-1">Footer.css</p>
            <pre className="text-slate-400">{`.button {
  color: blue;  /* wins? */
}`}</pre>
          </div>
        </div>
        <p className="text-slate-400 text-sm mt-3">
          CSS Modules solve this by locally scoping every class name — the compiled output becomes
          something like <code className="text-emerald-400">.button_a3kx9</code>, unique per file.
        </p>
      </div>

      {/* Local vs global class name */}
      <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
        <h4 className="text-slate-200 font-semibold mb-3">CSS Module: Local vs. Generated Class</h4>
        <div className="grid grid-cols-2 gap-4 font-mono text-sm">
          <div>
            <p className="text-slate-500 text-xs mb-1">Source (what you write)</p>
            <pre className="bg-slate-900 rounded p-3 text-emerald-400 text-xs">{`/* BEMExample.module.css */
.button--primary {
  background: #6366f1;
}`}</pre>
          </div>
          <div>
            <p className="text-slate-500 text-xs mb-1">Compiled (what ships)</p>
            <pre className="bg-slate-900 rounded p-3 text-blue-400 text-xs">{`/* unique hash — no clashes */
.button--primary_a3kx9 {
  background: #6366f1;
}`}</pre>
          </div>
        </div>
      </div>

      {/* Live button demo */}
      <div>
        <h4 className="text-slate-200 font-semibold mb-4">BEM Button Variants</h4>
        <div className="flex flex-wrap gap-3">
          <BEMButton variant="primary" size="sm" icon="✨">Small Primary</BEMButton>
          <BEMButton variant="primary" size="md">Medium Primary</BEMButton>
          <BEMButton variant="primary" size="lg">Large Primary</BEMButton>
          <BEMButton variant="secondary" size="md">Secondary</BEMButton>
          <BEMButton variant="primary" size="md" disabled>Disabled</BEMButton>
        </div>
      </div>

      {/* Live card demo */}
      <div>
        <h4 className="text-slate-200 font-semibold mb-4">BEM Card Variants</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <BEMCard
            title="Standard Card"
            body="This card uses BEM class composition: .card, .card__header, .card__body, .card__footer — all locally scoped by CSS Modules."
          />
          <BEMCard
            title="Featured Card"
            body="Adding .card--featured applies the modifier: a 4px indigo left border. Same block, different modifier."
            featured
          />
        </div>
      </div>
    </div>
  );
}
