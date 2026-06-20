import { useState } from 'react';

export function BoxModelDemo() {
  const [margin, setMargin] = useState(20);
  const [padding, setPadding] = useState(20);
  const [borderWidth, setBorderWidth] = useState(4);

  const contentWidth = 120;
  const contentHeight = 60;

  const contentBoxTotal = contentWidth + padding * 2 + borderWidth * 2 + margin * 2;
  const borderBoxTotal = contentWidth + margin * 2; // border-box keeps element at declared size

  return (
    <div className="space-y-8">
      {/* Sliders */}
      <div className="flex flex-wrap gap-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
        <label className="flex flex-col gap-1 flex-1 min-w-32">
          <span className="text-xs text-slate-400 font-medium">
            margin: <span className="text-white">{margin}px</span>
          </span>
          <input
            type="range"
            min={0}
            max={40}
            value={margin}
            onChange={(e) => setMargin(Number(e.target.value))}
            className="accent-indigo-500"
          />
        </label>
        <label className="flex flex-col gap-1 flex-1 min-w-32">
          <span className="text-xs text-slate-400 font-medium">
            padding: <span className="text-white">{padding}px</span>
          </span>
          <input
            type="range"
            min={0}
            max={40}
            value={padding}
            onChange={(e) => setPadding(Number(e.target.value))}
            className="accent-amber-500"
          />
        </label>
        <label className="flex flex-col gap-1 flex-1 min-w-32">
          <span className="text-xs text-slate-400 font-medium">
            border-width: <span className="text-white">{borderWidth}px</span>
          </span>
          <input
            type="range"
            min={1}
            max={20}
            value={borderWidth}
            onChange={(e) => setBorderWidth(Number(e.target.value))}
            className="accent-rose-500"
          />
        </label>
      </div>

      {/* Box model diagram */}
      <div className="flex justify-center">
        {/* Margin layer */}
        <div
          className="relative bg-slate-700/30 border-2 border-dashed border-slate-500 rounded flex items-center justify-center"
          style={{ padding: margin }}
        >
          <span className="absolute top-1 left-2 text-xs text-slate-400 font-mono">
            margin: {margin}px
          </span>

          {/* Border layer */}
          <div
            className="relative bg-rose-500/10 rounded flex items-center justify-center"
            style={{
              borderWidth,
              borderStyle: 'solid',
              borderColor: 'rgb(244 63 94)',
              padding,
            }}
          >
            <span className="absolute top-1 left-2 text-xs text-rose-400 font-mono">
              border: {borderWidth}px
            </span>

            {/* Padding layer */}
            <div
              className="relative bg-amber-500/20 rounded flex items-center justify-center"
              style={{ padding: 0 }}
            >
              <span className="absolute -top-5 left-0 text-xs text-amber-400 font-mono whitespace-nowrap">
                padding: {padding}px
              </span>

              {/* Content */}
              <div
                className="bg-indigo-600 rounded flex items-center justify-center text-white text-xs font-bold"
                style={{ width: contentWidth, height: contentHeight }}
              >
                content
                <br />
                <span className="font-normal text-indigo-200">
                  {contentWidth}×{contentHeight}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* box-sizing comparison */}
      <div>
        <h3 className="text-white font-semibold mb-3 text-sm">
          box-sizing: content-box vs border-box{' '}
          <span className="text-slate-400 font-normal">(both declared width: 200px, padding: 20px)</span>
        </h3>
        <div className="flex flex-wrap gap-8 items-start">
          {/* content-box */}
          <div className="flex flex-col gap-2">
            <span className="text-xs text-slate-400 font-mono">box-sizing: content-box</span>
            <div
              className="bg-rose-500/20 border-2 border-rose-500 rounded flex items-center justify-center text-rose-300 text-xs font-mono"
              style={{
                width: 200,
                padding: 20,
                boxSizing: 'content-box',
              }}
            >
              200px content
            </div>
            <span className="text-xs text-slate-400">
              Total width:{' '}
              <span className="text-rose-400 font-bold">{200 + 20 * 2 + 2 * 2}px</span>{' '}
              (200 + 40 padding + 4 border)
            </span>
          </div>

          {/* border-box */}
          <div className="flex flex-col gap-2">
            <span className="text-xs text-slate-400 font-mono">box-sizing: border-box</span>
            <div
              className="bg-emerald-500/20 border-2 border-emerald-500 rounded flex items-center justify-center text-emerald-300 text-xs font-mono"
              style={{
                width: 200,
                padding: 20,
                boxSizing: 'border-box',
              }}
            >
              200px total
            </div>
            <span className="text-xs text-slate-400">
              Total width: <span className="text-emerald-400 font-bold">200px</span>{' '}
              (padding + border included)
            </span>
          </div>
        </div>
        <p className="mt-4 text-xs text-slate-500">
          content-box total: {contentBoxTotal}px &nbsp;|&nbsp; border-box total: {borderBoxTotal}px
        </p>
      </div>
    </div>
  );
}
