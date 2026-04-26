const RATE_LIMIT_STORAGE_KEY = "yo_rate_limits";

function getRateLimitStore() {
  try {
    const stored = localStorage.getItem(RATE_LIMIT_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveRateLimitStore(store) {
  try {
    localStorage.setItem(RATE_LIMIT_STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Ignore if storage full
  }
}

export function checkRateLimit(key, maxAttempts = 5, windowMs = 60 * 1000) {
  const store = getRateLimitStore();
  const now = Date.now();
  const record = store[key];
  
  if (!record) {
    store[key] = { attempts: 1, firstAttempt: now, lastAttempt: now };
    saveRateLimitStore(store);
    return { allowed: true, remaining: maxAttempts - 1 };
  }
  
  if (now - record.firstAttempt > windowMs) {
    store[key] = { attempts: 1, firstAttempt: now, lastAttempt: now };
    saveRateLimitStore(store);
    return { allowed: true, remaining: maxAttempts - 1 };
  }
  
  if (record.attempts >= maxAttempts) {
    return { 
      allowed: false, 
      remaining: 0,
      retryAfter: Math.ceil((record.firstAttempt + windowMs - now) / 1000),
    };
  }
  
  record.attempts++;
  record.lastAttempt = now;
  saveRateLimitStore(store);
  
  return { 
    allowed: true, 
    remaining: maxAttempts - record.attempts 
  };
}

export function resetRateLimit(key) {
  const store = getRateLimitStore();
  delete store[key];
  saveRateLimitStore(store);
}

export function clearAllRateLimits() {
  localStorage.removeItem(RATE_LIMIT_STORAGE_KEY);
}

export const RATE_LIMITS = {
  checkout: { maxAttempts: 5, windowMs: 15 * 60 * 1000 },
  login: { maxAttempts: 3, windowMs: 5 * 60 * 1000 },
  order: { maxAttempts: 10, windowMs: 60 * 1000 },
  api: { maxAttempts: 20, windowMs: 60 * 1000 },
};