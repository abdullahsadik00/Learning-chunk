import { useRef, useEffect } from 'react';

const badgeStyles: Record<string, string> = {
  blue: 'bg-blue-100 text-blue-700',
  green: 'bg-green-100 text-green-700',
  yellow: 'bg-yellow-100 text-yellow-800',
  orange: 'bg-orange-100 text-orange-700',
  red: 'bg-red-100 text-red-700',
  purple: 'bg-purple-100 text-purple-700',
  gray: 'bg-gray-100 text-gray-600',
  pink: 'bg-pink-100 text-pink-700',
};

interface DemoPanelProps {
  title: string;
  description: string;
  children: React.ReactNode;
  log?: string[];
  onReset?: () => void;
  badge?: string;
  badgeColor?: keyof typeof badgeStyles;
  code?: string;
}

export default function DemoPanel({
  title,
  description,
  children,
  log,
  onReset,
  badge,
  badgeColor = 'blue',
  code,
}: DemoPanelProps) {
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current && log && log.length > 0) {
      logRef.current.scrollTop = 0;
    }
  }, [log]);

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-6">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-3">
          {badge && (
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badgeStyles[badgeColor]}`}>
              {badge}
            </span>
          )}
          <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
        </div>
        {onReset && (
          <button
            onClick={onReset}
            className="text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-200 px-2 py-1 rounded-md transition-colors"
          >
            Reset
          </button>
        )}
      </div>

      {/* Description */}
      <p className="px-5 py-3 text-sm text-gray-600 border-b border-gray-100">{description}</p>

      {/* Body: demo + log side by side */}
      <div className={`flex ${log ? 'divide-x divide-gray-200' : ''}`}>
        <div className="flex-1 p-5 min-w-0">{children}</div>
        {log && (
          <div className="w-72 flex-shrink-0 flex flex-col">
            <div className="px-3 py-2 bg-gray-800 text-gray-400 text-xs font-mono border-b border-gray-700 flex items-center justify-between">
              <span>log</span>
              <span className="text-gray-500">{log.length} entries</span>
            </div>
            <div
              ref={logRef}
              className="flex-1 bg-gray-900 p-3 overflow-y-auto font-mono text-xs text-green-400 space-y-1 max-h-64"
              style={{ minHeight: '120px' }}
            >
              {log.length === 0 ? (
                <span className="text-gray-600 italic">waiting…</span>
              ) : (
                log.map((entry, i) => (
                  <div key={i} className="leading-relaxed">
                    {entry}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Optional code hint */}
      {code && (
        <div className="border-t border-gray-100 px-5 py-3 bg-gray-50">
          <pre className="text-xs text-gray-700 font-mono overflow-x-auto whitespace-pre-wrap">{code}</pre>
        </div>
      )}
    </div>
  );
}
