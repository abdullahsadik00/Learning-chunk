import { useState } from 'react';

interface CssRule {
  selector: string;
  specificity: [number, number, number]; // [id, class, element]
  colorName: string;
  colorClass: string;
  colorHex: string;
}

const BASE_RULES: CssRule[] = [
  {
    selector: 'div',
    specificity: [0, 0, 1],
    colorName: 'blue',
    colorClass: 'text-blue-400',
    colorHex: '#60a5fa',
  },
  {
    selector: '.card',
    specificity: [0, 1, 0],
    colorName: 'green',
    colorClass: 'text-emerald-400',
    colorHex: '#34d399',
  },
  {
    selector: 'div.card',
    specificity: [0, 1, 1],
    colorName: 'orange',
    colorClass: 'text-amber-400',
    colorHex: '#fbbf24',
  },
  {
    selector: '#hero.card',
    specificity: [1, 1, 0],
    colorName: 'red',
    colorClass: 'text-rose-400',
    colorHex: '#fb7185',
  },
];

function specificityScore([id, cls, el]: [number, number, number]): number {
  return id * 100 + cls * 10 + el;
}

function specificityDisplay([id, cls, el]: [number, number, number]): string {
  return `${id}-${cls}-${el}`;
}

export function CascadeDemo() {
  const [importantOnRule1, setImportantOnRule1] = useState(false);

  // Determine winning rule
  let winningIndex = 3; // highest specificity by default
  if (importantOnRule1) winningIndex = 0; // !important overrides everything

  const winnerColor = BASE_RULES[winningIndex].colorHex;

  return (
    <div className="space-y-8">
      {/* Toggle */}
      <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={importantOnRule1}
            onChange={(e) => setImportantOnRule1(e.target.checked)}
            className="w-4 h-4 accent-indigo-500"
          />
          <span className="text-sm text-slate-300">
            Add <code className="bg-slate-700 px-1 rounded text-rose-400 text-xs">!important</code>{' '}
            to Rule 1 (<code className="text-blue-400 text-xs">div</code>)
          </span>
        </label>
        {importantOnRule1 && (
          <span className="text-xs text-amber-400 ml-auto">
            !important overrides all specificity rules
          </span>
        )}
      </div>

      {/* Rules grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {BASE_RULES.map((rule, i) => {
          const isWinner = i === winningIndex;
          const score = specificityScore(rule.specificity);
          const isRule1WithImportant = i === 0 && importantOnRule1;

          return (
            <div
              key={rule.selector}
              className={[
                'rounded-lg border p-4 transition-all',
                isWinner
                  ? 'border-indigo-500 bg-slate-800 ring-2 ring-indigo-500/40'
                  : 'border-slate-700 bg-slate-800/40 opacity-60',
              ].join(' ')}
            >
              <div className="flex items-start justify-between mb-2">
                <code className="text-sm font-bold text-slate-200">{rule.selector}</code>
                {isWinner && (
                  <span className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full">
                    WINS
                  </span>
                )}
              </div>

              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 w-24">Specificity:</span>
                  <span className="font-mono text-slate-300">
                    {specificityDisplay(rule.specificity)}
                  </span>
                  <span className="text-slate-500">(score: {score})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 w-24">color:</span>
                  <span className={`font-bold ${rule.colorClass}`}>{rule.colorName}</span>
                  {isRule1WithImportant && (
                    <span className="text-rose-400 font-mono">!important</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 w-24">id / class / el:</span>
                  <div className="flex gap-1">
                    {(['id', 'class', 'element'] as const).map((kind, ki) => (
                      <span
                        key={kind}
                        className={[
                          'px-1.5 py-0.5 rounded font-mono',
                          rule.specificity[ki] > 0
                            ? 'bg-indigo-600/40 text-indigo-300'
                            : 'bg-slate-700 text-slate-500',
                        ].join(' ')}
                      >
                        {kind[0]}:{rule.specificity[ki]}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Live preview element */}
      <div className="p-4 bg-slate-900 rounded-lg border border-slate-700">
        <p className="text-xs text-slate-500 mb-3">Live preview — the element as rendered:</p>
        <div
          className="text-lg font-bold p-4 bg-slate-800 rounded border border-slate-700 transition-colors"
          style={{ color: winnerColor }}
          id="hero"
        >
          div#hero.card — color is{' '}
          <span style={{ color: winnerColor }}>{BASE_RULES[winningIndex].colorName}</span>
          {importantOnRule1 && (
            <span className="ml-2 text-sm font-normal text-slate-400">
              (via <code className="text-rose-400">!important</code> on Rule 1)
            </span>
          )}
        </div>
      </div>

      {/* Inheritance demo */}
      <div>
        <h3 className="text-white font-semibold mb-3 text-sm">CSS Inheritance</h3>
        <div className="p-4 bg-slate-900 rounded-lg border border-slate-700">
          <p className="text-xs text-slate-500 mb-3">
            Parent has <code className="text-indigo-400">color: indigo; font-size: 18px; border: 2px solid red; padding: 16px</code>
          </p>
          <div
            className="p-4 rounded border-2 border-rose-500"
            style={{ color: '#818cf8', fontSize: 18 }}
          >
            <p className="font-bold mb-3">Parent div (color + font-size set here)</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Inheriting child */}
              <div className="bg-slate-800 rounded p-3">
                <p className="text-xs text-emerald-400 font-mono mb-1">Child A — no styles</p>
                <p>
                  This text inherits <strong>color</strong> and <strong>font-size</strong> from
                  parent (both are inherited CSS properties).
                </p>
                <p className="text-xs text-slate-500 mt-2">border and padding: NOT inherited</p>
              </div>

              {/* Override child */}
              <div className="bg-slate-800 rounded p-3" style={{ color: '#f472b6', fontSize: 14 }}>
                <p className="text-xs text-rose-400 font-mono mb-1">Child B — overrides both</p>
                <p>
                  color: pink; font-size: 14px — these override the parent&apos;s inherited values.
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  Cascade picks the child&apos;s own rule (higher specificity on same element).
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
