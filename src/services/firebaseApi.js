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
      const serverError =
        typeof payload?.error === "string" ? payload.error : "Erreur inconnue";
      console.warn(
        `[Firebase] ${method} /${path} failed (${response.status}): ${serverError}`,
      );
      return null;
    }

    return payload;
  } catch (err) {
    console.error(`[Firebase] ${method} /${path}:`, err.message || err);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export const firebaseApi = {
  get(path, timeoutMs) {
    return request(path, { method: "GET" }, timeoutMs);
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
