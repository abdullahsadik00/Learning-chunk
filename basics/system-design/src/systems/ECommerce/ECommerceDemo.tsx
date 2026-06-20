import React, { useState } from 'react';
import { ProductGallery } from './ProductGallery';
import { ProductVariantSelector } from './ProductVariantSelector';
import { AddToCart } from './AddToCart';
import { ReviewsSection } from './ReviewsSection';
import { MOCK_PRODUCT, MOCK_REVIEWS } from './mockProduct';
import type { SelectedVariants } from './types';

const styles = {
  page: {
    maxWidth: 1000,
    margin: '0 auto',
    padding: '24px 16px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    color: '#f1f5f9',
    backgroundColor: '#0f172a',
    minHeight: '100vh',
  } as React.CSSProperties,
  breadcrumb: {
    color: '#64748b',
    fontSize: 13,
    marginBottom: 20,
  } as React.CSSProperties,
  breadcrumbLink: {
    color: '#3b82f6',
    textDecoration: 'none',
    cursor: 'pointer',
  } as React.CSSProperties,
  layout: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 40,
    alignItems: 'start',
  } as React.CSSProperties,
  rightCol: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 20,
  } as React.CSSProperties,
  categoryBadge: {
    display: 'inline-block',
    backgroundColor: 'rgba(59,130,246,0.12)',
    color: '#60a5fa',
    fontSize: 12,
    fontWeight: 600,
    padding: '3px 10px',
    borderRadius: 20,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  } as React.CSSProperties,
  productName: {
    fontSize: 24,
    fontWeight: 800,
    color: '#f1f5f9',
    lineHeight: 1.3,
    margin: 0,
  } as React.CSSProperties,
  ratingRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  } as React.CSSProperties,
  stars: {
    color: '#fbbf24',
    fontSize: 15,
    letterSpacing: 1,
  } as React.CSSProperties,
  ratingScore: {
    color: '#f1f5f9',
    fontWeight: 700,
    fontSize: 14,
  } as React.CSSProperties,
  reviewCount: {
    color: '#64748b',
    fontSize: 13,
  } as React.CSSProperties,
  price: {
    fontSize: 32,
    fontWeight: 800,
    color: '#f1f5f9',
  } as React.CSSProperties,
  divider: {
    border: 'none',
    borderTop: '1px solid #1e293b',
    margin: 0,
  } as React.CSSProperties,
  description: {
    color: '#94a3b8',
    fontSize: 14,
    lineHeight: 1.7,
    margin: 0,
  } as React.CSSProperties,
  sectionLabel: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    marginBottom: 8,
  } as React.CSSProperties,
};

function StarDisplay({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.5;
  return (
    <span style={styles.stars}>
      {Array.from({ length: 5 }, (_, i) => {
        if (i < full) return '★';
        if (i === full && hasHalf) return '½';
        return '☆';
      }).join('')}
    </span>
  );
}

export function ECommerceDemo() {
  const initialSelected: SelectedVariants = {};
  MOCK_PRODUCT.variants.forEach(v => {
    initialSelected[v.name] = v.options[0];
  });

  const [selectedVariants, setSelectedVariants] = useState<SelectedVariants>(initialSelected);

  function handleVariantChange(variantName: string, option: string) {
    setSelectedVariants(prev => ({ ...prev, [variantName]: option }));
  }

  const formattedPrice = MOCK_PRODUCT.price.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  });

  return (
    <div style={styles.page}>
      {/* Breadcrumb */}
      <nav style={styles.breadcrumb}>
        <span style={styles.breadcrumbLink}>Home</span>
        {' / '}
        <span style={styles.breadcrumbLink}>{MOCK_PRODUCT.category}</span>
        {' / '}
        <span>{MOCK_PRODUCT.name}</span>
      </nav>

      {/* Main product layout */}
      <div style={styles.layout}>
        {/* Left: Gallery */}
        <ProductGallery images={MOCK_PRODUCT.images} />

        {/* Right: Details */}
        <div style={styles.rightCol}>
          <span style={styles.categoryBadge}>{MOCK_PRODUCT.category}</span>

          <h1 style={styles.productName}>{MOCK_PRODUCT.name}</h1>

          <div style={styles.ratingRow}>
            <StarDisplay rating={MOCK_PRODUCT.rating} />
            <span style={styles.ratingScore}>{MOCK_PRODUCT.rating}</span>
            <span style={styles.reviewCount}>({MOCK_PRODUCT.reviewCount.toLocaleString()} reviews)</span>
          </div>

          <div style={styles.price}>{formattedPrice}</div>

          <hr style={styles.divider} />

          <p style={styles.description}>{MOCK_PRODUCT.description}</p>

          <hr style={styles.divider} />

          <div>
            <div style={styles.sectionLabel}>Options</div>
            <ProductVariantSelector
              variants={MOCK_PRODUCT.variants}
              selected={selectedVariants}
              onChange={handleVariantChange}
            />
          </div>

          <hr style={styles.divider} />

          <AddToCart
            productId={MOCK_PRODUCT.id}
            price={MOCK_PRODUCT.price}
            stock={MOCK_PRODUCT.stock}
          />
        </div>
      </div>

      {/* Reviews below */}
      <ReviewsSection reviews={MOCK_REVIEWS} />
    </div>
  );
}

export default ECommerceDemo;
