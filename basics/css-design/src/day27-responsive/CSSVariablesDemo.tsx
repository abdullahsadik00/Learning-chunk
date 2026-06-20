import React, { useState } from 'react';

export function CSSVariablesDemo() {
  const [primaryColor, setPrimaryColor] = useState('#6366f1');
  const [secondaryColor, setSecondaryColor] = useState('#10b981');
  const [borderRadius, setBorderRadius] = useState(8);
  const [fontSize, setFontSize] = useState(16);

  const cssVarBlock = `:root {
  --primary: ${primaryColor};
  --secondary: ${secondaryColor};
  --radius: ${borderRadius}px;
  --font-size: ${fontSize}px;
}`;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-100 mb-2">CSS Custom Properties (Variables)</h2>
        <p className="text-slate-400">
          CSS variables are inherited and cascade. Changing a value on a parent updates all children
          that reference it — no JavaScript class toggling needed.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Controls Panel */}
        <div className="bg-slate-800 rounded-xl p-6 space-y-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-slate-200">Controls</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Primary Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer border border-slate-600 bg-slate-700"
                />
                <span className="text-slate-300 font-mono text-sm">{primaryColor}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Secondary Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer border border-slate-600 bg-slate-700"
                />
                <span className="text-slate-300 font-mono text-sm">{secondaryColor}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Border Radius: <span className="text-indigo-400">{borderRadius}px</span>
              </label>
              <input
                type="range"
                min={0}
                max={24}
                value={borderRadius}
                onChange={(e) => setBorderRadius(Number(e.target.value))}
                className="w-full accent-indigo-500"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>0px</span>
                <span>24px</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Font Size: <span className="text-indigo-400">{fontSize}px</span>
              </label>
              <input
                type="range"
                min={12}
                max={24}
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-full accent-indigo-500"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>12px</span>
                <span>24px</span>
              </div>
            </div>
          </div>
        </div>

        {/* Preview Panel */}
        <div
          className="bg-slate-800 rounded-xl p-6 border border-slate-700 flex flex-col gap-4"
          style={{
            '--primary': primaryColor,
            '--secondary': secondaryColor,
            '--radius': `${borderRadius}px`,
            '--font-size': `${fontSize}px`,
          } as React.CSSProperties}
        >
          <h3 className="text-lg font-semibold text-slate-200">Live Preview</h3>

          {/* Card using CSS variables */}
          <div
            className="p-5 border"
            style={{
              backgroundColor: `color-mix(in srgb, var(--primary) 15%, #1e293b)`,
              borderColor: `color-mix(in srgb, var(--primary) 40%, transparent)`,
              borderRadius: 'var(--radius)',
              fontSize: 'var(--font-size)',
            }}
          >
            <h4
              className="font-bold mb-2"
              style={{ color: 'var(--primary)' }}
            >
              Dynamic Card Title
            </h4>
            <p className="text-slate-300 mb-4" style={{ fontSize: 'var(--font-size)' }}>
              This card's colors, radius, and font size are all driven by CSS custom properties.
              Try changing the controls on the left!
            </p>
            <div className="flex gap-3 flex-wrap">
              <button
                className="font-medium text-white transition-opacity hover:opacity-80"
                style={{
                  backgroundColor: 'var(--secondary)',
                  borderRadius: 'var(--radius)',
                  padding: '0.5em 1.25em',
                  fontSize: 'var(--font-size)',
                }}
              >
                Primary Action
              </button>
              <button
                className="font-medium transition-opacity hover:opacity-80"
                style={{
                  backgroundColor: 'transparent',
                  border: `2px solid var(--secondary)`,
                  color: 'var(--secondary)',
                  borderRadius: 'var(--radius)',
                  padding: '0.5em 1.25em',
                  fontSize: 'var(--font-size)',
                }}
              >
                Secondary
              </button>
            </div>
          </div>

          {/* Badge row */}
          <div className="flex gap-2 flex-wrap">
            {['Design', 'CSS', 'Variables'].map((tag) => (
              <span
                key={tag}
                className="font-medium"
                style={{
                  backgroundColor: `color-mix(in srgb, var(--primary) 25%, transparent)`,
                  color: 'var(--primary)',
                  borderRadius: 'calc(var(--radius) / 1.5)',
                  padding: '0.2em 0.75em',
                  fontSize: 'calc(var(--font-size) * 0.8)',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Generated CSS block */}
      <div className="bg-slate-900 rounded-xl p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-slate-200 mb-3">Generated CSS</h3>
        <pre className="text-emerald-400 font-mono text-sm overflow-x-auto whitespace-pre">
          {cssVarBlock}
        </pre>
      </div>

      {/* Concept note */}
      <div className="bg-indigo-950 border border-indigo-800 rounded-xl p-5">
        <h4 className="font-semibold text-indigo-300 mb-2">Key Concepts</h4>
        <ul className="space-y-1 text-slate-300 text-sm list-disc list-inside">
          <li>Declared with <code className="text-indigo-400">--name: value</code> syntax</li>
          <li>Accessed with <code className="text-indigo-400">var(--name)</code></li>
          <li>Scoped to the element and its descendants (cascade-aware)</li>
          <li>Can be updated at runtime with JavaScript — no class toggling needed</li>
          <li>Fully supported in all modern browsers (no IE)</li>
        </ul>
      </div>
    </div>
  );
}
