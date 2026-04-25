// api/_lib/securityHeaders.js
// Middleware pour les headers de sécurité HTTP
// À appliquer sur toutes les réponses API

export const SECURITY_HEADERS = {
  // Prévenir le MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // Empêcher le clickjacking
  'X-Frame-Options': 'DENY',
  
  // Protection XSS (pour API, on utilise DENY car pas de contenu user)
  'X-XSS-Protection': '1; mode=block',
  
  // Referrer Policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Permissions Policy (limiter les fonctionnalités)
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  
  // Content Security Policy (stricte pour API)
  'Content-Security-Policy': [
    "default-src 'none'",
    "script-src 'none'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://*.firebaseio.com https://*.vercel.app",
    "frame-ancestors 'none'",
  ].join('; '),
  
  // Strict Transport Security (1 an)
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  
  // Cache-Control pour données sensibles
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
};

export function applySecurityHeaders(res) {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    res.setHeader(key, value);
  }
  return res;
}

export function securityHeadersMiddleware(req, res, next) {
  applySecurityHeaders(res);
  next();
}