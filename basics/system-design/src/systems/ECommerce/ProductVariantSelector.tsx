import React from 'react';
import type { ProductVariant } from '@/types';

interface Props {
  variants: ProductVariant[];
  selected: Record<string, string>;
  onChange: (variantName: string, option: string) => void;
}

// 'Navy Blue' + 'On-Ear' together are treated as out-of-stock for demo purposes
function isOutOfStock(variantName: string, option: string, selected: Record<string, string>): boolean {
  if (variantName === 'Color' && option === 'Navy Blue' && selected['Style'] === 'On-Ear') return true;
  if (variantName === 'Style' && option === 'On-Ear' && selected['Color'] === 'Navy Blue') return true;
  return false;
}

const styles = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 16,
  } as React.CSSProperties,
  row: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
  } as React.CSSProperties,
  label: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  } as React.CSSProperties,
  selectedValue: {
    color: '#f1f5f9',
    fontSize: 13,
    fontWeight: 500,
  } as React.CSSProperties,
  optionGroup: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 8,
  } as React.CSSProperties,
  optionBtn: (active: boolean, oos: boolean): React.CSSProperties => ({
    padding: '6px 14px',
    borderRadius: 6,
    border: active ? '2px solid #3b82f6' : '2px solid #334155',
    backgroundColor: active ? 'rgba(59,130,246,0.12)' : '#1e293b',
    color: oos ? '#475569' : active ? '#93c5fd' : '#cbd5e1',
    fontSize: 13,
    fontWeight: active ? 600 : 400,
    cursor: oos ? 'not-allowed' : 'pointer',
    textDecoration: oos ? 'line-through' : 'none',
    transition: 'border-color 0.15s, background-color 0.15s, color 0.15s',
    position: 'relative' as const,
  }),
};

export function ProductVariantSelector({ variants, selected, onChange }: Props) {
  return (
    <div style={styles.wrapper}>
      {variants.map(variant => (
        <div key={variant.id} style={styles.row}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'baseline' }}>
            <span style={styles.label}>{variant.name}:</span>
            {selected[variant.name] && (
              <span style={styles.selectedValue}>{selected[variant.name]}</span>
            )}
          </div>
          <div style={styles.optionGroup}>
            {variant.options.map(option => {
              const active = selected[variant.name] === option;
              const oos = isOutOfStock(variant.name, option, selected);
              return (
                <button
                  key={option}
                  type="button"
                  style={styles.optionBtn(active, oos)}
                  disabled={oos}
                  onClick={() => !oos && onChange(variant.name, option)}
                  title={oos ? 'Out of stock' : undefined}
                >
                  {option}
                  {oos && (
                    <span
                      style={{
                        marginLeft: 4,
                        fontSize: 10,
                        color: '#ef4444',
                        fontWeight: 600,
                        textDecoration: 'none',
                      }}
                    >
                      OOS
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
