// src/components/common/ResourceHints.jsx
// Composant pour précharger les ressources critiques
// À inclure dans RootLayout pour les performances

import { useEffect } from 'react';

const CRITICAL_ROUTES = ['/catalogue', '/checkout', '/panier'];

export function PreloadHints() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const preloadLinks = [
      { href: '/favicon.png', as: 'image', type: 'image/png' },
      { href: '/pwa-192x192.png', as: 'image', type: 'image/png' },
      { href: '/og-image.png', as: 'image', type: 'image/png' },
    ];

    preloadLinks.forEach(({ href, as, type }) => {
      if (!document.querySelector(`link[href="${href}"]`)) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = href;
        link.as = as;
        if (type) link.type = type;
        document.head.appendChild(link);
      }
    });

    const fontLinks = [
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
    ];

    fontLinks.forEach((href) => {
      if (!document.querySelector(`link[href="${href}"]`)) {
        const link = document.createElement('link');
        link.rel = 'preconnect';
        link.href = href;
        link.crossOrigin = 'anonymous';
        document.head.appendChild(link);
      }
    });
  }, []);

  return null;
}

export function PrefetchRoutes({ currentPath }) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const routesToPrefetch = CRITICAL_ROUTES.filter(route => !currentPath.startsWith(route));

    routesToPrefetch.forEach(route => {
      if (!document.querySelector(`link[rel="prefetch"][href="${route}"]`)) {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = route;
        link.as = 'document';
        document.head.appendChild(link);
      }
    });
  }, [currentPath]);

  return null;
}

export function DNSPrefetch() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const dnsPrefetchLinks = [
      'https://librairie-yo-default-rtdb.firebaseio.com',
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
    ];

    dnsPrefetchLinks.forEach(href => {
      if (!document.querySelector(`link[rel="dns-prefetch"][href="${href}"]`)) {
        const link = document.createElement('link');
        link.rel = 'dns-prefetch';
        link.href = href;
        document.head.appendChild(link);
      }
    });
  }, []);

  return null;
}

export function PreloadCriticalFonts() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const criticalFonts = [
      {
        href: 'https://fonts.gstatic.com/s/bevietnampro/v16/pxiNypIBvelH9I8w.woff2',
        as: 'font',
        type: 'font/woff2',
        crossOrigin: 'anonymous',
      },
      {
        href: 'https://fonts.gstatic.com/s/sora/v15/uNMvANu7Wn_tMF.woff2',
        as: 'font',
        type: 'font/woff2',
        crossOrigin: 'anonymous',
      },
    ];

    criticalFonts.forEach(({ href, as, type, crossOrigin }) => {
      if (!document.querySelector(`link[href="${href}"]`)) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = href;
        link.as = as;
        if (type) link.type = type;
        if (crossOrigin) link.crossOrigin = crossOrigin;
        document.head.appendChild(link);
      }
    });
  }, []);

  return null;
}