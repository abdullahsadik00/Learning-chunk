import { useState } from 'react';

type FlexDirection = 'row' | 'row-reverse' | 'column' | 'column-reverse';
type FlexWrap = 'nowrap' | 'wrap' | 'wrap-reverse';
type JustifyContent =
  | 'flex-start'
  | 'flex-end'
  | 'center'
  | 'space-between'
  | 'space-around'
  | 'space-evenly';
type AlignItems = 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
type GapValue = '0' | '8px' | '16px' | '24px';

interface BoxConfig {
  label: string;
  width: number;
  bgClass: string;
}

const BOXES: BoxConfig[] = [
  { label: 'Box 1', width: 60, bgClass: 'bg-indigo-500' },
  { label: 'Box 2', width: 80, bgClass: 'bg-emerald-500' },
  { label: 'Box 3', width: 50, bgClass: 'bg-rose-500' },
  { label: 'Box 4', width: 90, bgClass: 'bg-amber-500' },
  { label: 'Box 5', width: 70, bgClass: 'bg-purple-500' },
];

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

export function FlexboxPlayground() {
  const [flexDirection, setFlexDirection] = useState<FlexDirection>('row');
  const [flexWrap, setFlexWrap] = useState<FlexWrap>('wrap');
  const [justifyContent, setJustifyContent] = useState<JustifyContent>('flex-start');
  const [alignItems, setAlignItems] = useState<AlignItems>('center');
  const [gap, setGap] = useState<GapValue>('8px');

  const cssCode = `.container {
  display: flex;
  flex-direction: ${flexDirection};
  flex-wrap: ${flexWrap};
  justify-content: ${justifyContent};
  align-items: ${alignItems};
  gap: ${gap};
}`;

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap gap-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
        <SelectField
          label="flex-direction"
          value={flexDirection}
          options={['row', 'row-reverse', 'column', 'column-reverse']}
          onChange={setFlexDirection}
        />
        <SelectField
          label="flex-wrap"
          value={flexWrap}
          options={['nowrap', 'wrap', 'wrap-reverse']}
          onChange={setFlexWrap}
        />
        <SelectField
          label="justify-content"
          value={justifyContent}
          options={[
            'flex-start',
            'flex-end',
            'center',
            'space-between',
            'space-around',
            'space-evenly',
          ]}
          onChange={setJustifyContent}
        />
        <SelectField
          label="align-items"
          value={alignItems}
          options={['flex-start', 'flex-end', 'center', 'stretch', 'baseline']}
          onChange={setAlignItems}
        />
        <SelectField
          label="gap"
          value={gap}
          options={['0', '8px', '16px', '24px']}
          onChange={setGap}
        />
      </div>

      {/* Flex container */}
      <div
        className="h-64 border-2 border-dashed border-slate-600 rounded-lg p-2 bg-slate-900/50"
        style={{
          display: 'flex',
          flexDirection,
          flexWrap,
          justifyContent,
          alignItems,
          gap,
        }}
      >
        {BOXES.map((box) => (
          <div
            key={box.label}
            className={`${box.bgClass} rounded text-white text-xs font-bold flex items-center justify-center shrink-0`}
            style={{ width: box.width, height: 48 }}
          >
            {box.label}
          </div>
        ))}
      </div>

      {/* Generated CSS */}
      <pre className="bg-slate-900 border border-slate-700 rounded-lg p-4 text-emerald-400 text-sm overflow-x-auto">
        {cssCode}
      </pre>
    </div>
  );
}
