import React, { useState, useEffect } from 'react';

interface Props {
  productId: string;
  price: number;
  stock: number;
}

type Status = 'idle' | 'adding' | 'added';

const styles = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 12,
  } as React.CSSProperties,
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  } as React.CSSProperties,
  stepper: {
    display: 'flex',
    alignItems: 'center',
    gap: 0,
    border: '1px solid #334155',
    borderRadius: 8,
    overflow: 'hidden',
  } as React.CSSProperties,
  stepBtn: (disabled: boolean): React.CSSProperties => ({
    width: 36,
    height: 36,
    background: '#1e293b',
    border: 'none',
    color: disabled ? '#475569' : '#cbd5e1',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: 18,
    lineHeight: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.15s',
  }),
  qtyDisplay: {
    width: 40,
    textAlign: 'center' as const,
    color: '#f1f5f9',
    fontSize: 15,
    fontWeight: 600,
    backgroundColor: '#0f172a',
    borderLeft: '1px solid #334155',
    borderRight: '1px solid #334155',
    height: 36,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  } as React.CSSProperties,
  addBtn: (status: Status, outOfStock: boolean): React.CSSProperties => ({
    flex: 1,
    height: 44,
    borderRadius: 8,
    border: 'none',
    cursor: outOfStock || status !== 'idle' ? 'not-allowed' : 'pointer',
    fontSize: 15,
    fontWeight: 700,
    letterSpacing: '0.02em',
    transition: 'background-color 0.2s, transform 0.1s',
    backgroundColor:
      outOfStock ? '#1e293b' :
      status === 'added' ? '#16a34a' :
      status === 'adding' ? '#1d4ed8' :
      '#3b82f6',
    color: outOfStock ? '#475569' : '#fff',
    transform: status === 'adding' ? 'scale(0.98)' : 'scale(1)',
  }),
  success: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    color: '#4ade80',
    fontSize: 13,
    fontWeight: 600,
  } as React.CSSProperties,
  stockLabel: {
    color: '#64748b',
    fontSize: 12,
  } as React.CSSProperties,
};

export function AddToCart({ productId: _productId, price, stock }: Props) {
  const [quantity, setQuantity] = useState(1);
  const [status, setStatus] = useState<Status>('idle');
  const outOfStock = stock === 0;

  useEffect(() => {
    if (quantity > stock && stock > 0) setQuantity(stock);
  }, [stock, quantity]);

  async function handleAddToCart() {
    if (status !== 'idle' || outOfStock) return;
    setStatus('adding');
    await new Promise(r => setTimeout(r, 800));
    setStatus('added');
    setTimeout(() => setStatus('idle'), 2000);
  }

  function decrement() {
    setQuantity(q => Math.max(1, q - 1));
  }

  function increment() {
    setQuantity(q => Math.min(stock, q + 1));
  }

  const total = (price * quantity).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  });

  return (
    <div style={styles.wrapper}>
      <div style={styles.row}>
        {/* Quantity stepper */}
        <div style={styles.stepper}>
          <button
            type="button"
            style={styles.stepBtn(quantity <= 1 || outOfStock)}
            onClick={decrement}
            disabled={quantity <= 1 || outOfStock}
            aria-label="Decrease quantity"
          >
            −
          </button>
          <div style={styles.qtyDisplay}>{quantity}</div>
          <button
            type="button"
            style={styles.stepBtn(quantity >= stock || outOfStock)}
            onClick={increment}
            disabled={quantity >= stock || outOfStock}
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>

        {/* Add to cart */}
        <button
          type="button"
          style={styles.addBtn(status, outOfStock)}
          onClick={handleAddToCart}
          disabled={outOfStock || status !== 'idle'}
        >
          {outOfStock
            ? 'Out of Stock'
            : status === 'adding'
            ? 'Adding…'
            : status === 'added'
            ? 'Added to Cart!'
            : `Add to Cart · ${total}`}
        </button>
      </div>

      {status === 'added' && (
        <div style={styles.success}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {quantity} item{quantity > 1 ? 's' : ''} added to your cart
        </div>
      )}

      {!outOfStock && (
        <div style={styles.stockLabel}>
          {stock <= 5 ? `Only ${stock} left in stock — order soon` : `${stock} in stock`}
        </div>
      )}
    </div>
  );
}
