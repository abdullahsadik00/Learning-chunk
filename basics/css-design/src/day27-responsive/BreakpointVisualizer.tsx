import { useState, useEffect } from 'react';

type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const BREAKPOINTS: { name: Breakpoint; min: number; max: number | null; prefix: string; device: string; color: string }[] = [
  { name: 'xs',  min: 0,    max: 639,  prefix: '(none)', device: 'Small phone',   color: 'bg-rose-500' },
  { name: 'sm',  min: 640,  max: 767,  prefix: 'sm:',    device: 'Large phone',   color: 'bg-orange-500' },
  { name: 'md',  min: 768,  max: 1023, prefix: 'md:',    device: 'Tablet',        color: 'bg-amber-500' },
  { name: 'lg',  min: 1024, max: 1279, prefix: 'lg:',    device: 'Laptop',        color: 'bg-emerald-500' },
  { name: 'xl',  min: 1280, max: 1535, prefix: 'xl:',    device: 'Desktop',       color: 'bg-blue-500' },
  { name: '2xl', min: 1536, max: null, prefix: '2xl:',   device: 'Wide screen',   color: 'bg-violet-500' },
];

const BADGE_COLORS: Record<Breakpoint, string> = {
  xs:  'bg-rose-500/20 text-rose-300 border-rose-500/40',
  sm:  'bg-orange-500/20 text-orange-300 border-orange-500/40',
  md:  'bg-amber-500/20 text-amber-300 border-amber-500/40',
  lg:  'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  xl:  'bg-blue-500/20 text-blue-300 border-blue-500/40',
  '2xl': 'bg-violet-500/20 text-violet-300 border-violet-500/40',
};

function useBreakpoint(): Breakpoint {
  const getBreakpoint = (width: number): Breakpoint => {
    if (width >= 1536) return '2xl';
    if (width >= 1280) return 'xl';
    if (width >= 1024) return 'lg';
    if (width >= 768)  return 'md';
    if (width >= 640)  return 'sm';
    return 'xs';
  };

  const [breakpoint, setBreakpoint] = useState<Breakpoint>(() =>
    getBreakpoint(window.innerWidth)
  );

  useEffect(() => {
    const handler = () => setBreakpoint(getBreakpoint(window.innerWidth));
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return breakpoint;
}

export function BreakpointVisualizer() {
  const current = useBreakpoint();
  const currentBp = BREAKPOINTS.find((bp) => bp.name === current)!;

  const rangeLabel = currentBp.max
    ? `${currentBp.min}px – ${currentBp.max}px`
    : `${currentBp.min}px+`;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-100 mb-2">Breakpoint Visualizer</h2>
        <p className="text-slate-400">
          Resize the browser window to see the active Tailwind breakpoint update in real time.
          Tailwind uses a <strong className="text-slate-300">mobile-first</strong> approach — unprefixed
          classes apply at all sizes, prefixed classes override at that breakpoint and up.
        </p>
      </div>

      {/* Current breakpoint badge */}
      <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-2xl border text-2xl font-bold ${BADGE_COLORS[current]}`}>
        <span>{current}</span>
        <span className="text-base font-normal opacity-70">—</span>
        <span className="text-base font-normal">{rangeLabel}</span>
        <span className="text-sm font-normal opacity-60">· {currentBp.device}</span>
      </div>

      {/* Horizontal bar */}
      <div>
        <p className="text-sm text-slate-400 mb-3">All breakpoints</p>
        <div className="flex rounded-xl overflow-hidden border border-slate-700 h-10">
          {BREAKPOINTS.map((bp) => (
            <div
              key={bp.name}
              title={`${bp.name}: ${bp.min}px${bp.max ? `–${bp.max}px` : '+'}`}
              className={`flex-1 flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                bp.name === current
                  ? `${bp.color} text-white`
                  : 'bg-slate-800 text-slate-500'
              }`}
            >
              {bp.prefix === '(none)' ? 'xs' : bp.prefix}
            </div>
          ))}
        </div>
      </div>

      {/* Breakpoint table */}
      <div className="overflow-x-auto rounded-xl border border-slate-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-800 text-slate-400">
              <th className="px-4 py-3 text-left font-medium">Breakpoint</th>
              <th className="px-4 py-3 text-left font-medium">Min Width</th>
              <th className="px-4 py-3 text-left font-medium">Tailwind Prefix</th>
              <th className="px-4 py-3 text-left font-medium">Typical Device</th>
            </tr>
          </thead>
          <tbody>
            {BREAKPOINTS.map((bp, i) => (
              <tr
                key={bp.name}
                className={`border-t border-slate-700 transition-colors ${
                  bp.name === current
                    ? 'bg-indigo-950/60'
                    : i % 2 === 0 ? 'bg-slate-900' : 'bg-slate-850'
                }`}
              >
                <td className="px-4 py-3">
                  <span className={`font-bold ${bp.name === current ? 'text-indigo-300' : 'text-slate-300'}`}>
                    {bp.name === current ? `→ ${bp.name}` : bp.name}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-slate-400">
                  {bp.min === 0 ? '0px' : `${bp.min}px`}
                </td>
                <td className="px-4 py-3">
                  <code className="text-emerald-400">{bp.prefix}</code>
                </td>
                <td className="px-4 py-3 text-slate-400">{bp.device}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Responsive Grid Demo */}
      <div>
        <h3 className="text-lg font-semibold text-slate-200 mb-2">Responsive Grid Demo</h3>
        <p className="text-slate-400 text-sm mb-4">
          Uses <code className="text-indigo-400">grid-cols-1 sm:grid-cols-2 md:grid-cols-3</code>.
          Resize the window to watch the grid adapt.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }, (_, i) => (
            <div
              key={i}
              className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-center hover:border-indigo-500 transition-colors"
            >
              <div className="text-2xl mb-2">{['🃏', '🎴', '🀄', '🎲', '🎯', '🎳'][i]}</div>
              <p className="text-slate-300 font-medium text-sm">Card {i + 1}</p>
              <p className="text-slate-500 text-xs mt-1">
                <span className="sm:hidden">1-col layout</span>
                <span className="hidden sm:inline md:hidden">2-col layout</span>
                <span className="hidden md:inline">3-col layout</span>
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
