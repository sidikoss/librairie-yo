// src/components/common/LazyImage.jsx
// Composant d'image optimisé avec lazy loading et placeholder

import { useState, useRef, useEffect } from 'react';

export default function LazyImage({
  src,
  alt,
  className = '',
  width,
  height,
  loadingStrategy = 'lazy',
  placeholder = 'blur',
  onLoad,
  onError,
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(null);
  const imgRef = useRef(null);
  const observerRef = useRef(null);

  useEffect(() => {
    if (loadingStrategy === 'lazy' && 'IntersectionObserver' in window) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setCurrentSrc(src);
              observerRef.current?.disconnect();
            }
          });
        },
        {
          rootMargin: '50px 0px',
          threshold: 0.01,
        }
      );

      if (imgRef.current) {
        observerRef.current.observe(imgRef.current);
      }
    } else {
      setCurrentSrc(src);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [src, loadingStrategy]);

  const handleLoad = (e) => {
    setIsLoaded(true);
    onLoad?.(e);
  };

  const handleError = (e) => {
    setHasError(true);
    onError?.(e);
  };

  const blurPlaceholder = `data:image/svg+xml;base64,${btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${width || 300}" height="${height || 400}">
      <rect fill="#f0f0f0" width="100%" height="100%"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#999" font-size="14">
        Chargement...
      </text>
    </svg>
  `)}`;

  return (
    <div
      ref={imgRef}
      className={`relative overflow-hidden ${className}`}
      style={{ width: width || '100%', height: height || 'auto' }}
    >
      {placeholder === 'blur' && !isLoaded && !hasError && (
        <div
          className="absolute inset-0 animate-pulse bg-slate-200"
          aria-hidden="true"
        />
      )}

      {placeholder === 'shimmer' && !isLoaded && !hasError && (
        <div className="absolute inset-0 shimmer-bg" aria-hidden="true" />
      )}

      {currentSrc && !hasError ? (
        <img
          src={currentSrc}
          alt={alt}
          width={width}
          height={height}
          loading={loadingStrategy === 'lazy' ? 'lazy' : undefined}
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          className={`
            ${className}
            transition-opacity duration-500
            ${isLoaded ? 'opacity-100' : 'opacity-0'}
          `}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500">
          <span aria-hidden="true">📖</span>
        </div>
      )}
    </div>
  );
}