import { useState } from 'react';

type ColumnOption = '1' | '2' | '3' | '4' | '5' | 'auto-fill';
type RowOption = 'auto' | '2' | '3';
type GapValue = '0' | '8px' | '16px' | '24px';
type ItemCount = 6 | 8 | 12;

interface SelectFieldProps<T extends string> {
  label: string;
  value: T;
  options: T[];
  onChange: (v: T) => void;
}

function SelectField<T extends string>({ label, value, options, onChange }: SelectFieldProps<T>) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-slate-400 font-medium">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </label>
  );
}

function computeGridTemplateColumns(columns: ColumnOption): string {
  if (columns === 'auto-fill') return 'repeat(auto-fill, minmax(80px, 1fr))';
  return `repeat(${columns}, minmax(0, 1fr))`;
}

function computeGridTemplateRows(rows: RowOption): string {
  if (rows === 'auto') return 'auto';
  return `repeat(${rows}, minmax(60px, auto))`;
}

export function GridPlayground() {
  const [columns, setColumns] = useState<ColumnOption>('3');
  const [rows, setRows] = useState<RowOption>('auto');
  const [gap, setGap] = useState<GapValue>('8px');
  const [itemCount, setItemCount] = useState<ItemCount>(6);

  const gridTemplateColumns = computeGridTemplateColumns(columns);
  const gridTemplateRows = computeGridTemplateRows(rows);

  const cssCode = `.grid-container {
  display: grid;
  grid-template-columns: ${gridTemplateColumns};${rows !== 'auto' ? `\n  grid-template-rows: ${gridTemplateRows};` : ''}
  gap: ${gap};
}

/* Cells 1 and 7 span 2 columns */
.cell-1, .cell-7 { grid-column: span 2; }`;

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap gap-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
        <SelectField
          label="grid-template-columns"
          value={columns}
          options={['1', '2', '3', '4', '5', 'auto-fill']}
          onChange={setColumns}
        />
        <SelectField
          label="grid-template-rows"
          value={rows}
          options={['auto', '2', '3']}
          onChange={setRows}
        />
        <SelectField
          label="gap"
          value={gap}
          options={['0', '8px', '16px', '24px']}
          onChange={setGap}
        />

        {/* Item count picker */}
        <label className="flex flex-col gap-1">
          <span className="text-xs text-slate-400 font-medium">item count</span>
          <select
            value={itemCount}
            onChange={(e) => setItemCount(Number(e.target.value) as ItemCount)}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {([6, 8, 12] as ItemCount[]).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Grid container */}
      <div
        className="border-2 border-dashed border-slate-600 rounded-lg p-2 bg-slate-900/50 min-h-40"
        style={{
          display: 'grid',
          gridTemplateColumns,
          gridTemplateRows: rows !== 'auto' ? gridTemplateRows : undefined,
          gap,
        }}
      >
        {Array.from({ length: itemCount }, (_, i) => {
          const cellNumber = i + 1;
          const isSpanning = cellNumber === 1 || cellNumber === 7;
          return (
            <div
              key={cellNumber}
              className="bg-indigo-500/20 border border-indigo-500 rounded text-indigo-300 text-xs font-bold flex items-center justify-center min-h-12"
              style={isSpanning ? { gridColumn: 'span 2' } : undefined}
            >
              {cellNumber}
              {isSpanning && (
                <span className="ml-1 text-indigo-400 font-normal text-xs">(span 2)</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Generated CSS */}
      <pre className="bg-slate-900 border border-slate-700 rounded-lg p-4 text-emerald-400 text-sm overflow-x-auto">
        {cssCode}
      </pre>
    </div>
  );
}
