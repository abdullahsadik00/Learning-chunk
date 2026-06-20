import React, { useState, useEffect, useCallback } from 'react';

interface Props {
  images: string[];
}

const styles = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 12,
  } as React.CSSProperties,
  mainContainer: {
    position: 'relative' as const,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    overflow: 'hidden',
    aspectRatio: '3/2',
  } as React.CSSProperties,
  mainImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
    display: 'block',
  } as React.CSSProperties,
  arrowBtn: (side: 'left' | 'right'): React.CSSProperties => ({
    position: 'absolute',
    top: '50%',
    [side]: 12,
    transform: 'translateY(-50%)',
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    border: '1px solid #334155',
    borderRadius: '50%',
    width: 36,
    height: 36,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#f1f5f9',
    backdropFilter: 'blur(4px)',
    transition: 'background-color 0.15s',
  }),
  counter: {
    position: 'absolute' as const,
    bottom: 10,
    right: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    color: '#cbd5e1',
    fontSize: 12,
    padding: '2px 8px',
    borderRadius: 12,
    backdropFilter: 'blur(4px)',
  } as React.CSSProperties,
  thumbnails: {
    display: 'flex',
    gap: 8,
    overflowX: 'auto' as const,
  } as React.CSSProperties,
  thumb: (active: boolean): React.CSSProperties => ({
    width: 64,
    height: 48,
    borderRadius: 6,
    overflow: 'hidden',
    flexShrink: 0,
    cursor: 'pointer',
    border: active ? '2px solid #3b82f6' : '2px solid transparent',
    opacity: active ? 1 : 0.6,
    transition: 'border-color 0.15s, opacity 0.15s',
  }),
  thumbImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
    display: 'block',
  } as React.CSSProperties,
};

export function ProductGallery({ images }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);

  const prev = useCallback(() => {
    setActiveIndex(i => (i === 0 ? images.length - 1 : i - 1));
  }, [images.length]);

  const next = useCallback(() => {
    setActiveIndex(i => (i === images.length - 1 ? 0 : i + 1));
  }, [images.length]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [prev, next]);

  return (
    <div style={styles.wrapper}>
      <div style={styles.mainContainer}>
        <img
          src={images[activeIndex]}
          alt={`Product image ${activeIndex + 1}`}
          style={styles.mainImage}
        />
        <button style={styles.arrowBtn('left')} onClick={prev} type="button" aria-label="Previous image">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <button style={styles.arrowBtn('right')} onClick={next} type="button" aria-label="Next image">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
        <div style={styles.counter}>
          {activeIndex + 1} / {images.length}
        </div>
      </div>

      <div style={styles.thumbnails}>
        {images.map((src, i) => (
          <div
            key={src}
            style={styles.thumb(i === activeIndex)}
            onClick={() => setActiveIndex(i)}
            role="button"
            tabIndex={0}
            aria-label={`View image ${i + 1}`}
            onKeyDown={e => e.key === 'Enter' && setActiveIndex(i)}
          >
            <img src={src} alt={`Thumbnail ${i + 1}`} style={styles.thumbImg} />
          </div>
        ))}
      </div>
    </div>
  );
}
