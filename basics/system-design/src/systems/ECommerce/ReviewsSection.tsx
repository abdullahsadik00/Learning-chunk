import React, { useState, useEffect, useRef } from 'react';
import type { Review } from '@/types';

interface Props {
  reviews: Review[];
}

function Stars({ rating }: { rating: number }) {
  return (
    <span style={{ color: '#fbbf24', fontSize: 14, letterSpacing: 1 }}>
      {Array.from({ length: 5 }, (_, i) => (i < rating ? '★' : '☆')).join('')}
    </span>
  );
}

function RatingBar({ star, count, total }: { star: number; count: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((count / total) * 100);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
      <span style={{ color: '#94a3b8', fontSize: 12, width: 16, textAlign: 'right' }}>{star}</span>
      <span style={{ color: '#fbbf24', fontSize: 11 }}>★</span>
      <div style={{ flex: 1, height: 6, backgroundColor: '#1e293b', borderRadius: 3, overflow: 'hidden' }}>
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            backgroundColor: '#fbbf24',
            borderRadius: 3,
            transition: 'width 0.6s ease',
          }}
        />
      </div>
      <span style={{ color: '#64748b', fontSize: 11, width: 28 }}>{pct}%</span>
    </div>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

const styles = {
  section: {
    marginTop: 32,
  } as React.CSSProperties,
  heading: {
    color: '#f1f5f9',
    fontSize: 18,
    fontWeight: 700,
    marginBottom: 16,
  } as React.CSSProperties,
  summary: {
    display: 'flex',
    gap: 32,
    marginBottom: 24,
    padding: 20,
    backgroundColor: '#1e293b',
    borderRadius: 10,
    border: '1px solid #334155',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
  } as React.CSSProperties,
  avgScore: {
    fontSize: 48,
    fontWeight: 800,
    color: '#f1f5f9',
    lineHeight: 1,
  } as React.CSSProperties,
  avgStars: {
    marginTop: 4,
  } as React.CSSProperties,
  totalLabel: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 2,
  } as React.CSSProperties,
  bars: {
    flex: 1,
    minWidth: 180,
  } as React.CSSProperties,
  reviewCard: {
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
  } as React.CSSProperties,
  cardHeader: {
    display: 'flex',
    gap: 10,
    alignItems: 'flex-start',
    marginBottom: 8,
  } as React.CSSProperties,
  avatar: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    objectFit: 'cover' as const,
    flexShrink: 0,
  } as React.CSSProperties,
  authorName: {
    color: '#f1f5f9',
    fontWeight: 600,
    fontSize: 14,
  } as React.CSSProperties,
  cardMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  } as React.CSSProperties,
  dateText: {
    color: '#64748b',
    fontSize: 12,
  } as React.CSSProperties,
  content: {
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 1.6,
  } as React.CSSProperties,
  helpful: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 8,
  } as React.CSSProperties,
  placeholder: {
    padding: 32,
    textAlign: 'center' as const,
    color: '#64748b',
    fontSize: 14,
    backgroundColor: '#1e293b',
    borderRadius: 10,
    border: '1px dashed #334155',
    cursor: 'pointer',
  } as React.CSSProperties,
};

export function ReviewsSection({ reviews }: Props) {
  const [visible, setVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { rootMargin: '100px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  const distribution = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
  }));

  return (
    <div ref={containerRef} style={styles.section}>
      <h2 style={styles.heading}>Customer Reviews</h2>

      {!visible ? (
        <div style={styles.placeholder} onClick={() => setVisible(true)} role="button" tabIndex={0}>
          Scroll to load {reviews.length} reviews…
        </div>
      ) : (
        <>
          {/* Summary bar */}
          <div style={styles.summary}>
            <div>
              <div style={styles.avgScore}>{avg.toFixed(1)}</div>
              <div style={styles.avgStars}><Stars rating={Math.round(avg)} /></div>
              <div style={styles.totalLabel}>{reviews.length} reviews</div>
            </div>
            <div style={styles.bars}>
              {distribution.map(({ star, count }) => (
                <RatingBar key={star} star={star} count={count} total={reviews.length} />
              ))}
            </div>
          </div>

          {/* Review cards */}
          {reviews.map(review => (
            <div key={review.id} style={styles.reviewCard}>
              <div style={styles.cardHeader}>
                <img src={review.avatar} alt={review.author} style={styles.avatar} />
                <div>
                  <div style={styles.authorName}>{review.author}</div>
                  <div style={styles.cardMeta}>
                    <Stars rating={review.rating} />
                    <span style={styles.dateText}>{formatDate(review.createdAt)}</span>
                  </div>
                </div>
              </div>
              <p style={styles.content}>{review.content}</p>
              <div style={styles.helpful}>{review.helpful} people found this helpful</div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
