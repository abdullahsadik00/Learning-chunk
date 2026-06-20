import type { Metric, TableRow } from '@/types';

export const INITIAL_METRICS: Metric[] = [
  {
    label: 'Revenue',
    value: 124_500,
    delta: 12.3,
    unit: '$',
    trend: 'up',
    history: [
      108_200, 112_400, 105_900, 118_700, 121_300, 109_800, 115_600,
      122_100, 117_400, 119_900, 113_200, 125_800, 110_700, 116_300,
      120_500, 107_900, 123_400, 114_600, 118_200, 121_800,
    ],
  },
  {
    label: 'Users',
    value: 8_420,
    delta: 5.1,
    unit: '',
    trend: 'up',
    history: [
      7_120, 7_450, 7_230, 7_890, 8_010, 7_670, 7_340,
      8_200, 7_560, 7_980, 8_110, 7_720, 8_350, 7_440,
      7_810, 8_090, 7_630, 8_270, 7_950, 8_180,
    ],
  },
  {
    label: 'Churn Rate',
    value: 2.4,
    delta: -0.3,
    unit: '%',
    trend: 'down',
    history: [
      3.1, 2.9, 3.4, 2.7, 3.2, 2.8, 3.0,
      2.5, 3.3, 2.6, 2.9, 3.1, 2.4, 2.8,
      3.0, 2.7, 2.5, 3.2, 2.6, 2.9,
    ],
  },
  {
    label: 'Avg Session',
    value: 4.2,
    delta: 0.0,
    unit: 'min',
    trend: 'flat',
    history: [
      3.8, 4.5, 3.6, 5.1, 4.0, 4.7, 3.9,
      5.3, 4.2, 3.7, 4.9, 4.1, 5.0, 3.8,
      4.4, 5.2, 3.9, 4.6, 4.3, 4.8,
    ],
  },
];

export function simulateMetricUpdate(metrics: Metric[]): Metric[] {
  return metrics.map(m => ({
    ...m,
    value: m.value * (1 + (Math.random() - 0.48) * 0.02),
    history: [...m.history.slice(1), m.value],
  }));
}

export interface SaleRow extends TableRow {
  id: string;
  product: string;
  revenue: number;
  units: number;
  region: string;
  date: string;
}

export const SALES_DATA: SaleRow[] = Array.from({ length: 100 }, (_, i) => ({
  id: `sale-${i + 1}`,
  product: ['Headphones', 'Speaker', 'Keyboard', 'Mouse'][i % 4],
  revenue: Math.floor(Math.random() * 10_000) + 500,
  units: Math.floor(Math.random() * 100) + 1,
  region: ['North', 'South', 'East', 'West'][i % 4],
  date: new Date(2026, 0, (i % 28) + 1).toISOString().split('T')[0],
}));
