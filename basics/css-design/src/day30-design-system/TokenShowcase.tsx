import { useState } from 'react';
import { clsx } from 'clsx';

// ---------------------------------------------------------------------------
// Color palette data
// ---------------------------------------------------------------------------

const COLOR_SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;

const COLORS = [
  'slate', 'gray', 'zinc', 'neutral', 'stone',
  'red', 'orange', 'amber', 'yellow', 'lime',
  'green', 'emerald', 'teal', 'cyan', 'sky',
  'blue', 'indigo', 'violet', 'purple', 'fuchsia',
  'pink', 'rose',
] as const;

// Tailwind CSS color hex values (v3 palette)
const COLOR_HEX: Record<string, Record<number, string>> = {
  slate:   { 50:'#f8fafc',100:'#f1f5f9',200:'#e2e8f0',300:'#cbd5e1',400:'#94a3b8',500:'#64748b',600:'#475569',700:'#334155',800:'#1e293b',900:'#0f172a',950:'#020617' },
  gray:    { 50:'#f9fafb',100:'#f3f4f6',200:'#e5e7eb',300:'#d1d5db',400:'#9ca3af',500:'#6b7280',600:'#4b5563',700:'#374151',800:'#1f2937',900:'#111827',950:'#030712' },
  zinc:    { 50:'#fafafa',100:'#f4f4f5',200:'#e4e4e7',300:'#d4d4d8',400:'#a1a1aa',500:'#71717a',600:'#52525b',700:'#3f3f46',800:'#27272a',900:'#18181b',950:'#09090b' },
  neutral: { 50:'#fafafa',100:'#f5f5f5',200:'#e5e5e5',300:'#d4d4d4',400:'#a3a3a3',500:'#737373',600:'#525252',700:'#404040',800:'#262626',900:'#171717',950:'#0a0a0a' },
  stone:   { 50:'#fafaf9',100:'#f5f5f4',200:'#e7e5e4',300:'#d6d3d1',400:'#a8a29e',500:'#78716c',600:'#57534e',700:'#44403c',800:'#292524',900:'#1c1917',950:'#0c0a09' },
  red:     { 50:'#fef2f2',100:'#fee2e2',200:'#fecaca',300:'#fca5a5',400:'#f87171',500:'#ef4444',600:'#dc2626',700:'#b91c1c',800:'#991b1b',900:'#7f1d1d',950:'#450a0a' },
  orange:  { 50:'#fff7ed',100:'#ffedd5',200:'#fed7aa',300:'#fdba74',400:'#fb923c',500:'#f97316',600:'#ea580c',700:'#c2410c',800:'#9a3412',900:'#7c2d12',950:'#431407' },
  amber:   { 50:'#fffbeb',100:'#fef3c7',200:'#fde68a',300:'#fcd34d',400:'#fbbf24',500:'#f59e0b',600:'#d97706',700:'#b45309',800:'#92400e',900:'#78350f',950:'#451a03' },
  yellow:  { 50:'#fefce8',100:'#fef9c3',200:'#fef08a',300:'#fde047',400:'#facc15',500:'#eab308',600:'#ca8a04',700:'#a16207',800:'#854d0e',900:'#713f12',950:'#422006' },
  lime:    { 50:'#f7fee7',100:'#ecfccb',200:'#d9f99d',300:'#bef264',400:'#a3e635',500:'#84cc16',600:'#65a30d',700:'#4d7c0f',800:'#3f6212',900:'#365314',950:'#1a2e05' },
  green:   { 50:'#f0fdf4',100:'#dcfce7',200:'#bbf7d0',300:'#86efac',400:'#4ade80',500:'#22c55e',600:'#16a34a',700:'#15803d',800:'#166534',900:'#14532d',950:'#052e16' },
  emerald: { 50:'#ecfdf5',100:'#d1fae5',200:'#a7f3d0',300:'#6ee7b7',400:'#34d399',500:'#10b981',600:'#059669',700:'#047857',800:'#065f46',900:'#064e3b',950:'#022c22' },
  teal:    { 50:'#f0fdfa',100:'#ccfbf1',200:'#99f6e4',300:'#5eead4',400:'#2dd4bf',500:'#14b8a6',600:'#0d9488',700:'#0f766e',800:'#115e59',900:'#134e4a',950:'#042f2e' },
  cyan:    { 50:'#ecfeff',100:'#cffafe',200:'#a5f3fc',300:'#67e8f9',400:'#22d3ee',500:'#06b6d4',600:'#0891b2',700:'#0e7490',800:'#155e75',900:'#164e63',950:'#083344' },
  sky:     { 50:'#f0f9ff',100:'#e0f2fe',200:'#bae6fd',300:'#7dd3fc',400:'#38bdf8',500:'#0ea5e9',600:'#0284c7',700:'#0369a1',800:'#075985',900:'#0c4a6e',950:'#082f49' },
  blue:    { 50:'#eff6ff',100:'#dbeafe',200:'#bfdbfe',300:'#93c5fd',400:'#60a5fa',500:'#3b82f6',600:'#2563eb',700:'#1d4ed8',800:'#1e40af',900:'#1e3a8a',950:'#172554' },
  indigo:  { 50:'#eef2ff',100:'#e0e7ff',200:'#c7d2fe',300:'#a5b4fc',400:'#818cf8',500:'#6366f1',600:'#4f46e5',700:'#4338ca',800:'#3730a3',900:'#312e81',950:'#1e1b4b' },
  violet:  { 50:'#f5f3ff',100:'#ede9fe',200:'#ddd6fe',300:'#c4b5fd',400:'#a78bfa',500:'#8b5cf6',600:'#7c3aed',700:'#6d28d9',800:'#5b21b6',900:'#4c1d95',950:'#2e1065' },
  purple:  { 50:'#faf5ff',100:'#f3e8ff',200:'#e9d5ff',300:'#d8b4fe',400:'#c084fc',500:'#a855f7',600:'#9333ea',700:'#7e22ce',800:'#6b21a8',900:'#581c87',950:'#3b0764' },
  fuchsia: { 50:'#fdf4ff',100:'#fae8ff',200:'#f5d0fe',300:'#f0abfc',400:'#e879f9',500:'#d946ef',600:'#c026d3',700:'#a21caf',800:'#86198f',900:'#701a75',950:'#4a044e' },
  pink:    { 50:'#fdf2f8',100:'#fce7f3',200:'#fbcfe8',300:'#f9a8d4',400:'#f472b6',500:'#ec4899',600:'#db2777',700:'#be185d',800:'#9d174d',900:'#831843',950:'#500724' },
  rose:    { 50:'#fff1f2',100:'#ffe4e6',200:'#fecdd3',300:'#fda4af',400:'#fb7185',500:'#f43f5e',600:'#e11d48',700:'#be123c',800:'#9f1239',900:'#881337',950:'#4c0519' },
};

// ---------------------------------------------------------------------------
// Color palette section
// ---------------------------------------------------------------------------

function ColorSwatch({ color, shade, hex }: { color: string; shade: number; hex: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(hex).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const isDark = shade >= 500;

  return (
    <button
      onClick={copy}
      title={`${color}-${shade}: ${hex}`}
      className="group relative flex-1 min-w-0 h-10 rounded transition-transform hover:scale-110 hover:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-1"
      style={{ backgroundColor: hex }}
    >
      {/* Tooltip */}
      <span
        className={clsx(
          'pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded text-[10px] font-mono whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-20',
          isDark ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'
        )}
      >
        {copied ? 'Copied!' : hex}
      </span>
    </button>
  );
}

function ColorPaletteSection() {
  return (
    <div className="space-y-1.5">
      {/* Shade labels */}
      <div className="flex gap-0.5 pl-20">
        {COLOR_SHADES.map((s) => (
          <div key={s} className="flex-1 min-w-0 text-center text-[9px] text-slate-500 font-mono">{s}</div>
        ))}
      </div>
      {COLORS.map((color) => (
        <div key={color} className="flex items-center gap-2">
          <span className="w-16 text-right text-xs text-slate-400 font-mono shrink-0 capitalize">{color}</span>
          <div className="flex gap-0.5 flex-1">
            {COLOR_SHADES.map((shade) => (
              <ColorSwatch
                key={shade}
                color={color}
                shade={shade}
                hex={COLOR_HEX[color]?.[shade] ?? '#000'}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Typography section
// ---------------------------------------------------------------------------

const TEXT_SIZES = [
  { cls: 'text-xs',   label: 'text-xs',   px: '12px' },
  { cls: 'text-sm',   label: 'text-sm',   px: '14px' },
  { cls: 'text-base', label: 'text-base', px: '16px' },
  { cls: 'text-lg',   label: 'text-lg',   px: '18px' },
  { cls: 'text-xl',   label: 'text-xl',   px: '20px' },
  { cls: 'text-2xl',  label: 'text-2xl',  px: '24px' },
  { cls: 'text-3xl',  label: 'text-3xl',  px: '30px' },
  { cls: 'text-4xl',  label: 'text-4xl',  px: '36px' },
  { cls: 'text-5xl',  label: 'text-5xl',  px: '48px' },
  { cls: 'text-6xl',  label: 'text-6xl',  px: '60px' },
  { cls: 'text-7xl',  label: 'text-7xl',  px: '72px' },
  { cls: 'text-8xl',  label: 'text-8xl',  px: '96px' },
  { cls: 'text-9xl',  label: 'text-9xl',  px: '128px' },
];

const FONT_WEIGHTS = [
  { cls: 'font-thin',       label: 'font-thin',       num: '100' },
  { cls: 'font-extralight', label: 'font-extralight',  num: '200' },
  { cls: 'font-light',      label: 'font-light',       num: '300' },
  { cls: 'font-normal',     label: 'font-normal',      num: '400' },
  { cls: 'font-medium',     label: 'font-medium',      num: '500' },
  { cls: 'font-semibold',   label: 'font-semibold',    num: '600' },
  { cls: 'font-bold',       label: 'font-bold',        num: '700' },
  { cls: 'font-extrabold',  label: 'font-extrabold',   num: '800' },
  { cls: 'font-black',      label: 'font-black',       num: '900' },
];

function TypographySection() {
  return (
    <div className="space-y-8">
      {/* Type scale */}
      <div>
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Type scale</h4>
        <div className="space-y-2 overflow-x-auto">
          {TEXT_SIZES.map(({ cls, label, px }) => (
            <div key={cls} className="flex items-baseline gap-4 min-w-0">
              <div className="w-20 shrink-0 text-right">
                <span className="text-[10px] font-mono text-indigo-400">{label}</span>
                <span className="block text-[9px] text-slate-600">{px}</span>
              </div>
              <p className={clsx(cls, 'text-white leading-none whitespace-nowrap')}>
                The quick brown fox
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Font weights */}
      <div>
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Font weight</h4>
        <div className="space-y-1.5">
          {FONT_WEIGHTS.map(({ cls, label, num }) => (
            <div key={cls} className="flex items-center gap-4">
              <div className="w-32 shrink-0 text-right">
                <span className="text-[10px] font-mono text-indigo-400">{label}</span>
                <span className="block text-[9px] text-slate-600">{num}</span>
              </div>
              <p className={clsx(cls, 'text-white text-lg')}>The quick brown fox</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Spacing section
// ---------------------------------------------------------------------------

const SPACING_STEPS = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60, 64];
const PX_PER_REM = 4; // Tailwind: 1 unit = 0.25rem = 4px

function SpacingSection() {
  return (
    <div className="space-y-1 overflow-x-auto">
      {SPACING_STEPS.map((step) => {
        const px = step * PX_PER_REM;
        const barWidth = Math.min(px, 320);
        return (
          <div key={step} className="flex items-center gap-3">
            <span className="w-12 shrink-0 text-right text-[10px] font-mono text-indigo-400">p-{step}</span>
            <div
              className="h-4 bg-indigo-600 rounded-sm min-w-[2px] shrink-0"
              style={{ width: Math.max(barWidth, 2) }}
            />
            <span className="text-[10px] text-slate-500">{px}px</span>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shadow section
// ---------------------------------------------------------------------------

const SHADOWS = [
  { cls: 'shadow-sm',   label: 'shadow-sm' },
  { cls: 'shadow',      label: 'shadow' },
  { cls: 'shadow-md',   label: 'shadow-md' },
  { cls: 'shadow-lg',   label: 'shadow-lg' },
  { cls: 'shadow-xl',   label: 'shadow-xl' },
  { cls: 'shadow-2xl',  label: 'shadow-2xl' },
];

function ShadowSection() {
  return (
    <div className="flex flex-wrap gap-8">
      {SHADOWS.map(({ cls, label }) => (
        <div key={cls} className="flex flex-col items-center gap-3">
          <div className={clsx('h-20 w-28 bg-white rounded-xl', cls)} />
          <span className="text-[10px] font-mono text-slate-400">{label}</span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Border radius section
// ---------------------------------------------------------------------------

const RADII = [
  { cls: 'rounded-none',  label: 'rounded-none',  value: '0px' },
  { cls: 'rounded-sm',    label: 'rounded-sm',    value: '2px' },
  { cls: 'rounded',       label: 'rounded',       value: '4px' },
  { cls: 'rounded-md',    label: 'rounded-md',    value: '6px' },
  { cls: 'rounded-lg',    label: 'rounded-lg',    value: '8px' },
  { cls: 'rounded-xl',    label: 'rounded-xl',    value: '12px' },
  { cls: 'rounded-2xl',   label: 'rounded-2xl',   value: '16px' },
  { cls: 'rounded-3xl',   label: 'rounded-3xl',   value: '24px' },
  { cls: 'rounded-full',  label: 'rounded-full',  value: '9999px' },
];

function BorderRadiusSection() {
  return (
    <div className="flex flex-wrap gap-6">
      {RADII.map(({ cls, label, value }) => (
        <div key={cls} className="flex flex-col items-center gap-2">
          <div className={clsx('h-14 w-14 bg-indigo-500', cls)} />
          <span className="text-[10px] font-mono text-slate-400 text-center">{label}</span>
          <span className="text-[9px] text-slate-600">{value}</span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

const SECTIONS = [
  { id: 'colors',   label: 'Color palette', component: <ColorPaletteSection /> },
  { id: 'typo',     label: 'Typography scale', component: <TypographySection /> },
  { id: 'spacing',  label: 'Spacing scale', component: <SpacingSection /> },
  { id: 'shadows',  label: 'Shadow scale', component: <ShadowSection /> },
  { id: 'radii',    label: 'Border radius', component: <BorderRadiusSection /> },
];

export function TokenShowcase() {
  const [active, setActive] = useState('colors');

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5 border-b border-slate-800 pb-4">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => setActive(s.id)}
            className={clsx(
              'text-xs font-medium px-3 py-1.5 rounded-lg transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
              active === s.id
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Active section */}
      <div className="animate-fade-in">
        {active === 'colors' && (
          <div>
            <p className="text-xs text-slate-500 mb-4">Click any swatch to copy its hex value.</p>
            <ColorPaletteSection />
          </div>
        )}
        {active === 'typo' && <TypographySection />}
        {active === 'spacing' && (
          <div>
            <p className="text-xs text-slate-500 mb-4">1 spacing unit = 0.25rem = 4px. Bar widths are capped at 320px for display.</p>
            <SpacingSection />
          </div>
        )}
        {active === 'shadows' && (
          <div>
            <p className="text-xs text-slate-500 mb-6">Shadows rendered on white backgrounds to show depth clearly.</p>
            <ShadowSection />
          </div>
        )}
        {active === 'radii' && <BorderRadiusSection />}
      </div>
    </div>
  );
}
