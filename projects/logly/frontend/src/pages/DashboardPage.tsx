import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { metricsKeys, projectKeys } from '@/lib/queryKeys';
import MetricCard from '@/components/MetricCard';
import TrendChart from '@/components/TrendChart';
import RealtimeCount from '@/components/RealtimeCount';
import type {
  Project,
  TodayMetrics,
  TrendPoint,
  PageStat,
  EventStat,
  DateRange,
} from '@/types';

const DATE_RANGE_OPTIONS: { label: string; value: DateRange }[] = [
  { label: 'Today', value: 'today' },
  { label: '7 days', value: '7d' },
  { label: '30 days', value: '30d' },
];

function dateRangeToDays(range: DateRange): number {
  if (range === '7d') return 7;
  if (range === '30d') return 30;
  return 1;
}

function TopPagesTable({ projectId }: { projectId: string }) {
  const { data: pages = [], isLoading } = useQuery({
    queryKey: metricsKeys.pages(projectId),
    queryFn: () => api.get<PageStat[]>(`/api/projects/${projectId}/metrics/pages`),
  });

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
      <h2 className="text-sm font-semibold text-slate-300 mb-4">Top pages</h2>
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-8 bg-slate-700 rounded animate-pulse" />
          ))}
        </div>
      ) : pages.length === 0 ? (
        <p className="text-sm text-slate-500 py-4 text-center">No page data yet</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500 border-b border-slate-700">
                <th className="pb-2 text-left font-medium">Page</th>
                <th className="pb-2 text-right font-medium">Views</th>
                <th className="pb-2 text-right font-medium">Visitors</th>
                <th className="pb-2 text-right font-medium">Bounce</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {pages.map((p) => (
                <tr key={p.page} className="hover:bg-slate-700/30 transition">
                  <td className="py-2 pr-4 text-slate-200 font-mono text-xs truncate max-w-[180px]">
                    {p.page}
                  </td>
                  <td className="py-2 text-right text-slate-300">
                    {p.views.toLocaleString()}
                  </td>
                  <td className="py-2 text-right text-slate-300">
                    {p.visitors.toLocaleString()}
                  </td>
                  <td className="py-2 text-right text-slate-400">
                    {p.bounceRate.toFixed(0)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function TopEventsTable({ projectId }: { projectId: string }) {
  const { data: events = [], isLoading } = useQuery({
    queryKey: metricsKeys.events(projectId),
    queryFn: () => api.get<EventStat[]>(`/api/projects/${projectId}/metrics/events`),
  });

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
      <h2 className="text-sm font-semibold text-slate-300 mb-4">Top custom events</h2>
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-8 bg-slate-700 rounded animate-pulse" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="py-4 text-center">
          <p className="text-sm text-slate-500">No custom events yet</p>
          <p className="text-xs text-slate-600 mt-1">
            Use <code className="bg-slate-900 px-1 rounded">window.logly.track()</code> to emit events
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500 border-b border-slate-700">
                <th className="pb-2 text-left font-medium">Event</th>
                <th className="pb-2 text-right font-medium">Count</th>
                <th className="pb-2 text-right font-medium">Unique users</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {events.map((ev) => (
                <tr key={ev.name} className="hover:bg-slate-700/30 transition">
                  <td className="py-2 pr-4 text-slate-200">{ev.name}</td>
                  <td className="py-2 text-right text-slate-300">
                    {ev.count.toLocaleString()}
                  </td>
                  <td className="py-2 text-right text-slate-400">
                    {ev.uniqueUsers.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { id } = useParams<{ id: string }>();
  const projectId = id!;

  const [dateRange, setDateRange] = useState<DateRange>('today');
  const days = dateRangeToDays(dateRange);

  const { data: project } = useQuery({
    queryKey: projectKeys.detail(projectId),
    queryFn: () => api.get<Project>(`/api/projects/${projectId}`),
  });

  const { data: todayMetrics, isLoading: metricsLoading } = useQuery({
    queryKey: metricsKeys.today(projectId),
    queryFn: () => api.get<TodayMetrics>(`/api/projects/${projectId}/metrics/today`),
    refetchInterval: 30_000, // Re-fetch every 30s so KPIs stay fresh
  });

  const { data: trend = [], isLoading: trendLoading } = useQuery({
    queryKey: metricsKeys.trend(projectId, days),
    queryFn: () =>
      api.get<TrendPoint[]>(`/api/projects/${projectId}/metrics/trend`, { days }),
    enabled: dateRange !== 'today',
  });

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Top nav */}
      <header className="border-b border-slate-800 sticky top-0 z-10 bg-slate-900/95 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link to="/projects" className="text-slate-500 hover:text-slate-300 transition text-sm">
              ← Projects
            </Link>
            {project ? (
              <div className="min-w-0">
                <span className="font-semibold text-white truncate block">{project.name}</span>
                <span className="text-xs text-slate-500 truncate block">{project.domain}</span>
              </div>
            ) : (
              <div className="h-5 w-32 bg-slate-700 rounded animate-pulse" />
            )}
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <RealtimeCount projectId={projectId} />

            {/* Date range selector */}
            <div className="flex rounded-lg border border-slate-700 overflow-hidden">
              {DATE_RANGE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setDateRange(opt.value)}
                  className={`px-3 py-1.5 text-xs font-medium transition ${
                    dateRange === opt.value
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <Link
              to={`/projects/${projectId}/events`}
              className="text-sm text-slate-400 hover:text-white transition"
            >
              Events
            </Link>
            <Link
              to={`/projects/${projectId}/settings`}
              className="text-sm text-slate-400 hover:text-white transition"
            >
              Settings
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Row 1: KPI metric cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Page views"
            value={todayMetrics?.views ?? 0}
            delta={todayMetrics?.viewsDelta}
            loading={metricsLoading}
          />
          <MetricCard
            label="Unique visitors"
            value={todayMetrics?.visitors ?? 0}
            delta={todayMetrics?.visitorsDelta}
            loading={metricsLoading}
          />
          <MetricCard
            label="Sessions"
            value={todayMetrics?.sessions ?? 0}
            loading={metricsLoading}
          />
          <MetricCard
            label="Bounce rate"
            value={todayMetrics?.bounceRate ?? 0}
            format="percent"
            loading={metricsLoading}
          />
        </div>

        {/* Row 2: Trend chart */}
        {dateRange !== 'today' ? (
          <TrendChart data={trend} days={days} loading={trendLoading} />
        ) : (
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
            <p className="text-sm text-slate-500 text-center py-8">
              Switch to 7d or 30d to see the trend chart
            </p>
          </div>
        )}

        {/* Row 3: Top pages + Top events */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <TopPagesTable projectId={projectId} />
          <TopEventsTable projectId={projectId} />
        </div>
      </main>
    </div>
  );
}
