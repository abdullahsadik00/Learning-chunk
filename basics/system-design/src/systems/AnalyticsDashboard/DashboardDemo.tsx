import React from 'react';
import { useMetrics } from './useMetrics';
import { KPICard } from './KPICard';
import { SparklineChart } from './SparklineChart';
import { AnalyticsTable } from './AnalyticsTable';
import { SALES_DATA } from './mockMetrics';

const SPARKLINE_COLORS = ['#10b981', '#6366f1', '#ef4444', '#f59e0b'];

export function DashboardDemo() {
  const { metrics, isLive, toggle } = useMetrics(3000);

  return (
    <div
      style={{
        background: '#0f172a',
        minHeight: '100vh',
        padding: '32px 40px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: '#f1f5f9',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 32,
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#f8fafc' }}>
            Live Dashboard
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: '#64748b' }}>
            Real-time analytics — updates every 3 seconds
          </p>
        </div>
        <button
          onClick={toggle}
          style={{
            background: isLive ? '#10b981' : '#ef4444',
            border: 'none',
            borderRadius: 8,
            color: '#fff',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 600,
            padding: '10px 20px',
            transition: 'background 0.2s',
          }}
        >
          {isLive ? '⏸ Pause' : '▶ Resume'}
        </button>
      </div>

      {/* KPI Row */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 20,
          marginBottom: 8,
        }}
      >
        {metrics.map((metric, i) => (
          <div
            key={metric.label}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              flex: '1 1 200px',
            }}
          >
            <KPICard metric={metric} />
            <div style={{ paddingLeft: 8 }}>
              <SparklineChart
                data={metric.history}
                color={SPARKLINE_COLORS[i % SPARKLINE_COLORS.length]}
                width={160}
                height={44}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Live indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: isLive ? '#10b981' : '#64748b',
            display: 'inline-block',
            boxShadow: isLive ? '0 0 6px #10b981' : 'none',
          }}
        />
        <span style={{ fontSize: 12, color: '#64748b' }}>
          {isLive ? 'Live' : 'Paused'}
        </span>
      </div>

      {/* Sales Table */}
      <AnalyticsTable data={SALES_DATA} />
    </div>
  );
}

export default DashboardDemo;
