import { FIREBASE_DB_URL } from "../config/constants";

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

async function request(path, options = {}, timeoutMs = 10000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  const method = options.method || "GET";

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
      if (response.status === 401 || response.status === 403) {
        throw new Error("Accès refusé (Firebase Rules). Vérifiez l'authentification.");
      }
      const serverError = typeof payload?.error === "string" ? payload.error : `Erreur ${response.status}`;
      throw new Error(serverError);
    }

    return payload;
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error("La requête a expiré (Délai dépassé).");
    }
    console.error(`[Firebase] ${method} /${path}:`, err.message || err);
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export const firebaseApi = {
  get(path, timeoutMs, requestOptions = {}) {
    return request(path, { method: "GET", ...requestOptions }, timeoutMs);
  },
  post(path, data) {
    return request(path, { method: "POST", body: JSON.stringify(data) });
  },
  patch(path, data) {
    return request(path, { method: "PATCH", body: JSON.stringify(data) });
  },
  put(path, data) {
    return request(path, { method: "PUT", body: JSON.stringify(data) });
  },
  del(path) {
    return request(path, { method: "DELETE" });
  },
};
