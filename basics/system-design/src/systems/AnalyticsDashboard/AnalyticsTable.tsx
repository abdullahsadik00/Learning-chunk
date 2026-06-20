import React, { useState, useMemo, useCallback } from 'react';
import type { SaleRow } from './mockMetrics';

interface Column {
  key: keyof SaleRow;
  header: string;
  sortable: boolean;
  render?: (v: unknown) => string;
}

const COLUMNS: Column[] = [
  { key: 'product', header: 'Product', sortable: true },
  {
    key: 'revenue',
    header: 'Revenue',
    sortable: true,
    render: (v: unknown) => `$${(v as number).toLocaleString()}`,
  },
  { key: 'units', header: 'Units', sortable: true },
  { key: 'region', header: 'Region', sortable: true },
  { key: 'date', header: 'Date', sortable: true },
];

const PAGE_SIZE = 10;

function rowMatchesFilter(row: SaleRow, filter: string): boolean {
  const q = filter.toLowerCase();
  return (
    row.product.toLowerCase().includes(q) ||
    row.region.toLowerCase().includes(q) ||
    row.date.includes(q) ||
    row.revenue.toString().includes(q) ||
    row.units.toString().includes(q)
  );
}

function exportToCSV(rows: SaleRow[]): void {
  const headers = ['ID', 'Product', 'Revenue', 'Units', 'Region', 'Date'];
  const lines = [
    headers.join(','),
    ...rows.map(r =>
      [r.id, r.product, r.revenue, r.units, r.region, r.date].join(',')
    ),
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'sales-data.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export function AnalyticsTable({ data }: { data: SaleRow[] }) {
  const [sortKey, setSortKey] = useState<keyof SaleRow>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);

  const handleSort = useCallback((key: keyof SaleRow) => {
    setSortKey(prev => {
      if (prev === key) {
        setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
        return prev;
      }
      setSortDir('asc');
      return key;
    });
    setPage(1);
  }, []);

  const filtered = useMemo(
    () => (filter ? data.filter(r => rowMatchesFilter(r, filter)) : data),
    [data, filter]
  );

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const cmp =
        typeof av === 'number' && typeof bv === 'number'
          ? av - bv
          : String(av).localeCompare(String(bv));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilter(e.target.value);
    setPage(1);
  };

  const arrowFor = (key: keyof SaleRow) => {
    if (sortKey !== key) return ' ↕';
    return sortDir === 'asc' ? ' ↑' : ' ↓';
  };

  return (
    <div style={{ background: '#0f172a', borderRadius: 12, padding: 24, marginTop: 24 }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <input
          value={filter}
          onChange={handleFilterChange}
          placeholder="Search products, regions…"
          style={{
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: 8,
            color: '#f1f5f9',
            padding: '8px 12px',
            fontSize: 14,
            width: 260,
            outline: 'none',
          }}
        />
        <button
          onClick={() => exportToCSV(sorted)}
          style={{
            background: '#6366f1',
            border: 'none',
            borderRadius: 8,
            color: '#fff',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
            padding: '8px 16px',
          }}
        >
          Export CSV
        </button>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr>
              {COLUMNS.map(col => (
                <th
                  key={col.key}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                  style={{
                    color: '#94a3b8',
                    cursor: col.sortable ? 'pointer' : 'default',
                    fontWeight: 600,
                    padding: '10px 12px',
                    textAlign: 'left',
                    borderBottom: '1px solid #1e293b',
                    whiteSpace: 'nowrap',
                    userSelect: 'none',
                  }}
                >
                  {col.header}
                  {col.sortable && (
                    <span style={{ opacity: sortKey === col.key ? 1 : 0.4 }}>
                      {arrowFor(col.key)}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td
                  colSpan={COLUMNS.length}
                  style={{ color: '#64748b', padding: '24px 12px', textAlign: 'center' }}
                >
                  No results found.
                </td>
              </tr>
            ) : (
              pageRows.map((row, i) => (
                <tr
                  key={row.id}
                  style={{
                    background: i % 2 === 0 ? '#0f172a' : '#111827',
                    transition: 'background 0.15s',
                  }}
                >
                  {COLUMNS.map(col => {
                    const raw = row[col.key];
                    const display = col.render ? col.render(raw) : String(raw);
                    return (
                      <td
                        key={col.key}
                        style={{
                          color: '#e2e8f0',
                          padding: '10px 12px',
                          borderBottom: '1px solid #1e293b',
                        }}
                      >
                        {display}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          justifyContent: 'flex-end',
          marginTop: 16,
          fontSize: 13,
          color: '#94a3b8',
        }}
      >
        <span>
          {sorted.length} row{sorted.length !== 1 ? 's' : ''}
        </span>
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={safePage === 1}
          style={{
            background: safePage === 1 ? '#1e293b' : '#334155',
            border: 'none',
            borderRadius: 6,
            color: safePage === 1 ? '#475569' : '#f1f5f9',
            cursor: safePage === 1 ? 'default' : 'pointer',
            padding: '6px 12px',
            fontSize: 13,
          }}
        >
          Previous
        </button>
        <span>
          Page {safePage} of {totalPages}
        </span>
        <button
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          disabled={safePage === totalPages}
          style={{
            background: safePage === totalPages ? '#1e293b' : '#334155',
            border: 'none',
            borderRadius: 6,
            color: safePage === totalPages ? '#475569' : '#f1f5f9',
            cursor: safePage === totalPages ? 'default' : 'pointer',
            padding: '6px 12px',
            fontSize: 13,
          }}
        >
          Next
        </button>
      </div>
    </div>
  );
}
