// src/services/firebaseApi.js
// API Firebase avec caching et optimisation des performances

import { FIREBASE_DB_URL } from "../config/constants";
import { validateApiPath } from "../utils/apiSecurity";

const CACHE = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_CACHE_SIZE = 50;

function buildUrl(path) {
  return `${FIREBASE_DB_URL}/${path}.json`;
}

async function parseJsonSafe(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function getCached(key) {
  const cached = CACHE.get(key);
  if (!cached) return null;

  if (Date.now() - cached.timestamp > CACHE_TTL_MS) {
    CACHE.delete(key);
    return null;
  }

  return cached.data;
}

function setCache(key, data) {
  if (CACHE.size >= MAX_CACHE_SIZE) {
    const firstKey = CACHE.keys().next().value;
    CACHE.delete(firstKey);
  }
  CACHE.set(key, { data, timestamp: Date.now() });
}

function clearCache() {
  CACHE.clear();
}

async function request(path, options = {}, timeoutMs = 10000) {
  const pathValidation = validateApiPath(path);
  if (!pathValidation.valid) {
    console.warn("[Firebase] Invalid path:", pathValidation.error);
    return null;
  }
  
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  const method = options.method || "GET";
  const cacheKey = `${method}:${path}`;
  const cacheEnabled = options.cache !== false && method === "GET";
  const cacheDuration = options.cacheDuration || CACHE_TTL_MS;

  if (cacheEnabled && cacheEnabled !== false) {
    const cached = CACHE.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < cacheDuration) {
      clearTimeout(timer);
      return cached.data;
    }
  }

  try {
    const response = await fetch(buildUrl(path), {
      ...options,
      signal: ctrl.signal,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });

    const payload = await parseJsonSafe(response);
    if (!response.ok) {
      const serverError =
        typeof payload?.error === "string" ? payload.error : "Erreur inconnue";
      const silentStatuses = Array.isArray(options.silentStatuses)
        ? options.silentStatuses
        : [];
      if (!silentStatuses.includes(response.status)) {
        console.warn(
          `[Firebase] ${method} /${path} failed (${response.status}): ${serverError}`,
        );
      }
      return null;
    }

    if (cacheEnabled && payload !== null) {
      setCache(cacheKey, payload);
    }

    return payload;
  } catch (err) {
    if (err.name === 'AbortError') {
      console.warn(`[Firebase] ${method} /${path}: Request aborted`);
    } else {
      console.error(`[Firebase] ${method} /${path}:`, err.message || err);
    }
    
    if (options.fallbackToCache) {
      const cached = CACHE.get(cacheKey);
      if (cached) {
        console.log(`[Firebase] Using cached data for /${path}`);
        return cached.data;
      }
    }
    
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export const firebaseApi = {
  get(path, timeoutMs = 10000, requestOptions = {}) {
    return request(path, { method: "GET", ...requestOptions }, timeoutMs);
  },

  getStale(path, timeoutMs = 10000, requestOptions = {}) {
    const cached = getCached(path);
    const resultPromise = request(path, { method: "GET", cache: true, ...requestOptions }, timeoutMs);
    
    if (cached) {
      return Promise.resolve(cached).then(stale => {
        resultPromise.then(fresh => {
          if (fresh !== stale) {
            console.log(`[Firebase] Cache invalidated for /${path}`);
          }
        });
        return stale;
      });
    }
    
    return resultPromise;
  },

  getNoCache(path, timeoutMs = 10000, requestOptions = {}) {
    return request(path, { method: "GET", cache: false, ...requestOptions }, timeoutMs);
  },

  post(path, data) {
    return request(path, { method: "POST", body: JSON.stringify(data), cache: false });
  },

  patch(path, data) {
    return request(path, { method: "PATCH", body: JSON.stringify(data), cache: false });
  },

  put(path, data) {
    return request(path, { method: "PUT", body: JSON.stringify(data), cache: false });
  },

  del(path) {
    return request(path, { method: "DELETE", cache: false });
  },

  invalidate(path) {
    const keysToDelete = [];
    CACHE.forEach((_, key) => {
      if (key.includes(path)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => CACHE.delete(key));
  },

  clearCache,

  getCacheStats() {
    return {
      size: CACHE.size,
      maxSize: MAX_CACHE_SIZE,
      entries: Array.from(CACHE.keys()),
    };
  },
};