import React, { useEffect, useRef, useState } from 'react';
import type { Metric } from '@/types';

function formatValue(value: number, unit?: string): string {
  if (unit === '$') {
    return value >= 1000 ? `$${(value / 1000).toFixed(1)}k` : `$${value.toFixed(0)}`;
  }
  if (unit === '%') return `${value.toFixed(1)}%`;
  if (unit === 'min') return `${value.toFixed(1)}m`;
  return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toFixed(0);
}

export function KPICard({ metric }: { metric: Metric }) {
  const prevRef = useRef(metric.value);
  const [displayValue, setDisplayValue] = useState(metric.value);

  useEffect(() => {
    const start = prevRef.current;
    const end = metric.value;
    const duration = 600;
    const startTime = performance.now();

    function step(now: number) {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplayValue(start + (end - start) * eased);
      if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
    prevRef.current = end;
  }, [metric.value]);

  const trendColor =
    metric.trend === 'up' ? '#10b981' :
    metric.trend === 'down' ? '#ef4444' :
    '#64748b';

  const deltaSign = metric.delta > 0 ? '+' : '';

  return (
    <div
      style={{
        background: '#1e293b',
        border: '1px solid #334155',
        borderRadius: 12,
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        minWidth: 180,
      }}
    >
      <span style={{ color: '#94a3b8', fontSize: 13, fontWeight: 500 }}>
        {metric.label}
      </span>
      <span style={{ color: '#f1f5f9', fontSize: 28, fontWeight: 700 }}>
        {formatValue(displayValue, metric.unit)}
      </span>
      <span style={{ color: trendColor, fontSize: 13 }}>
        {deltaSign}{metric.delta.toFixed(1)}{metric.unit === '%' ? 'pp' : '%'} vs last period
      </span>
    </div>
  );
}
