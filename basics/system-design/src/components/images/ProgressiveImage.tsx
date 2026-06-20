import React, { useState } from 'react';

interface ProgressiveImageProps {
  src: string;
  placeholder: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
}

export function ProgressiveImage({
  src,
  placeholder,
  alt,
  className,
  style,
}: ProgressiveImageProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div
      style={{ position: 'relative', overflow: 'hidden', ...style }}
      className={className}
    >
      {/* Blurred placeholder shown until full image loads */}
      <img
        src={placeholder}
        alt={alt}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          filter: loaded ? 'none' : 'blur(10px)',
          transform: loaded ? 'scale(1)' : 'scale(1.05)',
          transition: 'filter 0.4s ease, transform 0.4s ease',
        }}
      />
      {/* Full-resolution image fades in on load */}
      <img
        src={src}
        alt={alt}
        onLoad={() => setLoaded(true)}
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: loaded ? 1 : 0,
          transition: 'opacity 0.4s ease',
        }}
      />
    </div>
  );
}
