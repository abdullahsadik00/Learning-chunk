import { clsx } from 'clsx';

interface MetricCardProps {
  label: string;
  value: number;
  /** Percentage change vs previous period. Positive = growth, negative = decline. */
  delta?: number;
  format?: 'number' | 'percent';
  loading?: boolean;
}

function formatValue(value: number, format: 'number' | 'percent'): string {
  if (format === 'percent') {
    return `${value.toFixed(1)}%`;
  }
  // Format large numbers: 1234 → 1.2k, 1234567 → 1.2M
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}k`;
  }
  return value.toLocaleString();
}

function DeltaBadge({ delta }: { delta: number }) {
  const isPositive = delta > 0;
  const isNeutral = delta === 0;

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded-md',
        isNeutral && 'bg-slate-700 text-slate-400',
        isPositive && 'bg-emerald-900/60 text-emerald-300',
        !isPositive && !isNeutral && 'bg-red-950/60 text-red-300',
      )}
    >
      {isNeutral ? '—' : isPositive ? '↑' : '↓'}
      {!isNeutral && `${Math.abs(delta).toFixed(1)}%`}
    </span>
  );
}

export default function MetricCard({
  label,
  value,
  delta,
  format = 'number',
  loading = false,
}: MetricCardProps) {
  if (loading) {
    return (
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-5 animate-pulse">
        <div className="h-3 bg-slate-700 rounded w-1/2 mb-4" />
        <div className="h-8 bg-slate-700 rounded w-2/3" />
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-slate-400">{label}</p>
        {delta !== undefined && <DeltaBadge delta={delta} />}
      </div>
      <p className="mt-2 text-3xl font-bold text-white tracking-tight">
        {formatValue(value, format)}
      </p>
      {delta !== undefined && (
        <p className="mt-1 text-xs text-slate-500">vs yesterday</p>
      )}
    </div>
  );
}
