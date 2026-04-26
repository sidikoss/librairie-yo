// api/_lib/rateLimiter.js
// Rate limiting middleware pour protéger les API routes contre les attaques brute-force
// 
// Utilisation dans les routes API:
// import { rateLimiter } from './_lib/rateLimiter';
// handler = rateLimiter(handler, { maxRequests: 5, windowMs: 60000 });
// OU: import { withRateLimit } from './_lib/rateLimiter';
// export default withRateLimit(handler, '/api/admin-auth');

const RATE_LIMIT_STORE = new Map();

const RATE_LIMITS = {
  '/api/admin-auth': { maxRequests: 5, windowMs: 60000 },
  '/api/orange-money-verify': { maxRequests: 10, windowMs: 60000 },
  '/api/orange-money-status': { maxRequests: 30, windowMs: 60000 },
  '/api/validate-promo': { maxRequests: 20, windowMs: 60000 },
  '/api/paycard-verify': { maxRequests: 10, windowMs: 60000 },
  default: { maxRequests: 100, windowMs: 60000 },
};

const BAN_DURATION_MS = 15 * 60 * 1000;
const MAX_BANS = 100;
const BAN_THRESHOLD = 10;

function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() 
    || req.headers['x-real-ip'] 
    || req.socket?.remoteAddress 
    || 'unknown';
}

function cleanExpiredEntries(store) {
  const now = Date.now();
  for (const [key, data] of store.entries()) {
    if (now - data.windowStart > data.windowMs) {
      store.delete(key);
    }
  }
  while (store.size > MAX_BANS) {
    const firstKey = store.keys().next().value;
    store.delete(firstKey);
  }
}

export function rateLimiter(req, res, next) {
  const ip = getClientIP(req);
  const path = req.path || '/';
  
  cleanExpiredEntries(RATE_LIMIT_STORE);

  const rateLimitConfig = RATE_LIMITS[path] || RATE_LIMITS.default;

  const banKey = `ban:${ip}`;
  const banData = RATE_LIMIT_STORE.get(banKey);
  
  if (banData && Date.now() < banData.until) {
    const remainingMs = banData.until - Date.now();
    res.setHeader('X-RateLimit-Limit', 0);
    res.setHeader('X-RateLimit-Remaining', 0);
    res.setHeader('X-RateLimit-Reset', Math.ceil(banData.until / 1000));
    res.setHeader('Retry-After', Math.ceil(remainingMs / 1000));
    return res.status(429).json({
      error: 'Trop de tentatives. Veuillez réessayer plus tard.',
      code: 'RATE_LIMITED',
      retryAfter: Math.ceil(remainingMs / 1000)
    });
  }

  const rateKey = `rate:${ip}:${path}`;
  const now = Date.now();
  let rateData = RATE_LIMIT_STORE.get(rateKey);

  if (!rateData || now - rateData.windowStart >= rateData.windowMs) {
    rateData = {
      count: 1,
      windowStart: now,
      windowMs: rateLimitConfig.windowMs,
      violations: 0
    };
  } else {
    rateData.count++;
  }

  RATE_LIMIT_STORE.set(rateKey, rateData);

  res.setHeader('X-RateLimit-Limit', rateLimitConfig.maxRequests);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, rateLimitConfig.maxRequests - rateData.count));
  res.setHeader('X-RateLimit-Reset', Math.ceil((rateData.windowStart + rateData.windowMs) / 1000));

  if (rateData.count > rateLimitConfig.maxRequests) {
    rateData.violations++;

    if (rateData.violations >= BAN_THRESHOLD) {
      RATE_LIMIT_STORE.set(banKey, {
        until: Date.now() + BAN_DURATION_MS,
        reason: 'Exceeded rate limit multiple times'
      });
      
      res.setHeader('Retry-After', Math.ceil(BAN_DURATION_MS / 1000));
      return res.status(429).json({
        error: 'Accès temporairement suspendu pour abus. Veuillez réessayer dans 15 minutes.',
        code: 'IP_BANNED',
        retryAfter: Math.ceil(BAN_DURATION_MS / 1000)
      });
    }

    const retryAfter = Math.ceil((rateData.windowStart + rateData.windowMs - now) / 1000);
    res.setHeader('Retry-After', retryAfter);
    return res.status(429).json({
      error: 'Trop de requêtes. Veuillez ralentir.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter
    });
  }

  next();
}

export function resetRateLimit(ip) {
  RATE_LIMIT_STORE.delete(`ban:${ip}`);
  for (const key of RATE_LIMIT_STORE.keys()) {
    if (key.startsWith(`rate:${ip}:`)) {
      RATE_LIMIT_STORE.delete(key);
    }
  }
}

export function getRateLimitStatus(ip) {
  const status = {
    banned: false,
    banUntil: null,
    paths: {}
  };

  const banKey = `ban:${ip}`;
  const banData = RATE_LIMIT_STORE.get(banKey);
  
  if (banData && Date.now() < banData.until) {
    status.banned = true;
    status.banUntil = banData.until;
  }

  for (const [key, data] of RATE_LIMIT_STORE.entries()) {
    if (key.startsWith(`rate:${ip}:`)) {
      const path = key.replace(`rate:${ip}:`, '');
      status.paths[path] = {
        count: data.count,
        windowStart: data.windowStart,
        violations: data.violations
      };
    }
  }

  return status;
}

export function withRateLimit(handler, route, options = {}) {
  const config = {
    maxRequests: options.maxRequests || RATE_LIMITS[route]?.maxRequests || RATE_LIMITS.default.maxRequests,
    windowMs: options.windowMs || RATE_LIMITS[route]?.windowMs || RATE_LIMITS.default.windowMs,
  };

  return async (req, res) => {
    const ip = getClientIP(req);
    cleanExpiredEntries(RATE_LIMIT_STORE);

    const banKey = `ban:${ip}`;
    const banData = RATE_LIMIT_STORE.get(banKey);

    if (banData && Date.now() < banData.until) {
      const remainingMs = banData.until - Date.now();
      res.setHeader('X-RateLimit-Limit', 0);
      res.setHeader('X-RateLimit-Remaining', 0);
      res.setHeader('X-RateLimit-Reset', Math.ceil(banData.until / 1000));
      res.setHeader('Retry-After', Math.ceil(remainingMs / 1000));
      return res.status(429).json({
        error: 'Trop de tentatives. Veuillez réessayer plus tard.',
        code: 'RATE_LIMITED',
        retryAfter: Math.ceil(remainingMs / 1000)
      });
    }

    const rateKey = `rate:${ip}:${route}`;
    const now = Date.now();
    let rateData = RATE_LIMIT_STORE.get(rateKey);

    if (!rateData || now - rateData.windowStart >= rateData.windowMs) {
      rateData = {
        count: 1,
        windowStart: now,
        windowMs: config.windowMs,
        violations: 0
      };
    } else {
      rateData.count++;
    }

    RATE_LIMIT_STORE.set(rateKey, rateData);

    res.setHeader('X-RateLimit-Limit', config.maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, config.maxRequests - rateData.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil((rateData.windowStart + config.windowMs) / 1000));

    if (rateData.count > config.maxRequests) {
      rateData.violations++;

      if (rateData.violations >= BAN_THRESHOLD) {
        RATE_LIMIT_STORE.set(banKey, {
          until: Date.now() + BAN_DURATION_MS,
          reason: 'Exceeded rate limit multiple times'
        });

        res.setHeader('Retry-After', Math.ceil(BAN_DURATION_MS / 1000));
        return res.status(429).json({
          error: 'Accès temporairement suspendu pour abus.',
          code: 'IP_BANNED',
          retryAfter: Math.ceil(BAN_DURATION_MS / 1000)
        });
      }

      const retryAfter = Math.ceil((rateData.windowStart + config.windowMs - now) / 1000);
      res.setHeader('Retry-After', retryAfter);
      return res.status(429).json({
        error: 'Trop de requêtes.',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter
      });
    }

    return handler(req, res);
  };
}