import { memo, useState, useEffect, useRef } from "react";

const LazyImage = memo(function LazyImage({
  src,
  alt,
  className,
  placeholder = "blur",
  threshold = 0.1,
  rootMargin = "50px",
  onLoad,
  onError,
  ...props
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  const getPlaceholder = () => {
    if (placeholder === "blur") {
      return (
        <div className="absolute inset-0 bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
      );
    }
    if (placeholder === "color") {
      return (
        <div className="absolute inset-0 bg-brand-100 dark:bg-brand-900/30" />
      );
    }
    return null;
  };

  return (
    <div
      ref={imgRef}
      className={`relative overflow-hidden ${className}`}
    >
      {!isLoaded && !hasError && getPlaceholder()}
      {(isLoaded || hasError) && (
        <img
          src={hasError ? "/placeholder.png" : src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
          {...props}
        />
      )}
    </div>
  );
});

const Image = memo(function Image({
  src,
  alt,
  className,
  loading = "lazy",
  decoding = "async",
  onLoad,
  onError,
  ...props
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  return (
    <div className={`relative ${className}`}>
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
      )}
      <img
        src={hasError ? "/placeholder.png" : src}
        alt={alt}
        loading={loading}
        decoding={decoding}
        onLoad={handleLoad}
        onError={handleError}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
        {...props}
      />
    </div>
  );
});

const ResponsiveImage = memo(function ResponsiveImage({
  srcSet,
  sizes,
  alt,
  defaultSrc,
  className,
  ...props
}) {
  return (
    <picture>
      {srcSet.map(({ src, width, media }) => (
        <source key={width} srcSet={src} media={media} />
      ))}
      <img
        src={defaultSrc}
        alt={alt}
        loading="lazy"
        decoding="async"
        sizes={sizes}
        className={className}
        {...props}
      />
    </picture>
  );
});

export { LazyImage, Image, ResponsiveImage };
export default LazyImage;