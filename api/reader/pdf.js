import { getAdminAuth, getAdminDatabase, getAdminFirestore, getAdminStorage } from "../_lib/firebaseAdmin.js";
import { verifyPinWithOrder } from "../_lib/security.js";

const READER_RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const READER_RATE_LIMIT_MAX = Number(process.env.READER_RATE_LIMIT_MAX || 80);
const READER_ORDERS_COLLECTION = process.env.READER_ORDERS_COLLECTION || "orders";
const READER_BOOK_FILES_COLLECTION = process.env.READER_BOOK_FILES_COLLECTION || "bookFiles";
const READER_ORDER_SOURCE = String(process.env.READER_ORDER_SOURCE || "auto").toLowerCase();

const rateLimitStore =
  globalThis.__yoReaderRateLimitStore ||
  (globalThis.__yoReaderRateLimitStore = new Map());

function setSecurityHeaders(res) {
  res.setHeader("Cache-Control", "no-store, private, max-age=0, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
}

function jsonError(res, status, message) {
  setSecurityHeaders(res);
  return res.status(status).json({
    ok: false,
    error: message,
  });
}

function normalizeDigits(value) {
  return String(value || "").replace(/[^\d]/g, "");
}

function getClientIp(req) {
  const forwarded = String(req.headers["x-forwarded-for"] || "");
  const first = forwarded.split(",")[0]?.trim();
  if (first) return first;
  return String(req.socket?.remoteAddress || "unknown");
}

function applyRateLimit(key) {
  const now = Date.now();
  const existing = rateLimitStore.get(key);
  if (!existing || now > existing.resetAt) {
    const next = {
      count: 1,
      resetAt: now + READER_RATE_LIMIT_WINDOW_MS,
    };
    rateLimitStore.set(key, next);
    return { blocked: false, retryAfterSec: 0 };
  }

  existing.count += 1;
  if (existing.count > READER_RATE_LIMIT_MAX) {
    return {
      blocked: true,
      retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  return { blocked: false, retryAfterSec: 0 };
}

function safeString(value) {
  return String(value || "").trim();
}

function hasBookInOrder(order, bookId) {
  const items = Array.isArray(order?.items) ? order.items : [];
  return items.some((item) => {
    const candidateId = safeString(item?.bookId || item?.fbKey || item?.id);
    return candidateId === bookId;
  });
}

function isApprovedOrder(order) {
  return safeString(order?.status).toLowerCase() === "approved";
}

function parseGsPath(input) {
  const value = safeString(input);
  if (!value) return null;

  if (value.startsWith("gs://")) {
    const withoutPrefix = value.slice("gs://".length);
    const slashIndex = withoutPrefix.indexOf("/");
    if (slashIndex <= 0) return null;
    return {
      bucket: withoutPrefix.slice(0, slashIndex),
      objectPath: withoutPrefix.slice(slashIndex + 1),
    };
  }

  if (/^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value);

      // Firebase Storage download URL pattern:
      // /v0/b/<bucket>/o/<encoded object path>
      const match = url.pathname.match(/\/v0\/b\/([^/]+)\/o\/(.+)$/);
      if (match) {
        return {
          bucket: decodeURIComponent(match[1]),
          objectPath: decodeURIComponent(match[2]),
        };
      }
    } catch {
      return null;
    }
  }

  return {
    bucket: safeString(process.env.FIREBASE_STORAGE_BUCKET || ""),
    objectPath: value.replace(/^\/+/, ""),
  };
}

function decodeDataUrlToBuffer(dataUrl) {
  const raw = safeString(dataUrl);
  const match = raw.match(/^data:(.+?);base64,(.+)$/i);
  if (!match) {
    throw new Error("Payload data URL invalide");
  }
  return Buffer.from(match[2], "base64");
}

async function loadOrderFromRealtimeDb(orderId) {
  const db = getAdminDatabase();
  const snapshot = await db.ref(`orders/${orderId}`).once("value");
  if (!snapshot.exists()) return null;
  return {
    ...snapshot.val(),
    fbKey: orderId,
    source: "rtdb",
  };
}

async function loadOrderFromFirestore(orderId) {
  const firestore = getAdminFirestore();
  const doc = await firestore.collection(READER_ORDERS_COLLECTION).doc(orderId).get();
  if (!doc.exists) return null;
  return {
    ...doc.data(),
    fbKey: orderId,
    source: "firestore",
  };
}

async function loadOrder(orderId) {
  if (READER_ORDER_SOURCE === "firestore") {
    return loadOrderFromFirestore(orderId);
  }
  if (READER_ORDER_SOURCE === "rtdb") {
    return loadOrderFromRealtimeDb(orderId);
  }

  // auto: Firestore first, RTDB fallback.
  const firestoreOrder = await loadOrderFromFirestore(orderId).catch(() => null);
  if (firestoreOrder) return firestoreOrder;
  return loadOrderFromRealtimeDb(orderId);
}

async function loadBookFileMetaFromRealtimeDb(bookId) {
  const db = getAdminDatabase();
  const [bookFileSnapshot, legacyBookSnapshot] = await Promise.all([
    db.ref(`book-files/${bookId}`).once("value"),
    db.ref(`books/${bookId}`).once("value"),
  ]);

  return {
    ...(legacyBookSnapshot.exists() ? legacyBookSnapshot.val() : {}),
    ...(bookFileSnapshot.exists() ? bookFileSnapshot.val() : {}),
  };
}

async function loadBookFileMetaFromFirestore(bookId) {
  const firestore = getAdminFirestore();
  const doc = await firestore.collection(READER_BOOK_FILES_COLLECTION).doc(bookId).get();
  if (!doc.exists) return null;
  return doc.data();
}

async function loadBookFileMeta(bookId) {
  const [firestoreMeta, rtdbMeta] = await Promise.all([
    loadBookFileMetaFromFirestore(bookId).catch(() => null),
    loadBookFileMetaFromRealtimeDb(bookId).catch(() => null),
  ]);

  return {
    ...(rtdbMeta || {}),
    ...(firestoreMeta || {}),
  };
}

async function resolvePdfSource(bookId) {
  const meta = await loadBookFileMeta(bookId);
  const storagePath =
    safeString(meta?.storagePath) ||
    safeString(meta?.storageObjectPath) ||
    safeString(meta?.path) ||
    safeString(meta?.gsPath);

  if (storagePath) {
    const parsed = parseGsPath(storagePath);
    if (!parsed?.objectPath) {
      throw new Error("Chemin Storage invalide");
    }

    const storage = getAdminStorage();
    const bucket = parsed.bucket ? storage.bucket(parsed.bucket) : storage.bucket();
    const file = bucket.file(parsed.objectPath);
    const [exists] = await file.exists();
    if (!exists) {
      throw new Error("Fichier introuvable dans Firebase Storage");
    }

    const [buffer] = await file.download({
      validation: false,
    });

    return {
      buffer,
      fileName: safeString(meta?.fileName || `${bookId}.pdf`),
      contentType: safeString(meta?.fileType || "application/pdf"),
    };
  }

  // Fallback legacy (migration): data URL base64 stockée en base.
  if (safeString(meta?.fileData).startsWith("data:")) {
    return {
      buffer: decodeDataUrlToBuffer(meta.fileData),
      fileName: safeString(meta?.fileName || `${bookId}.pdf`),
      contentType: safeString(meta?.fileType || "application/pdf"),
    };
  }

  return null;
}

function hasLegacyMatch(order, req) {
  const orderPhone = normalizeDigits(order?.phone);
  if (!orderPhone) return false;

  const phoneHeader = normalizeDigits(req.headers["x-order-phone"]);
  const pinHeader = safeString(req.headers["x-order-pin"]);

  if (!phoneHeader || !pinHeader) return false;
  return phoneHeader === orderPhone && verifyPinWithOrder(order, pinHeader);
}

async function verifyIdToken(req) {
  const authorization = safeString(req.headers.authorization);
  if (!authorization.startsWith("Bearer ")) {
    throw new Error("Authorization manquante");
  }

  const idToken = safeString(authorization.slice(7));
  if (!idToken) {
    throw new Error("Token Firebase manquant");
  }

  return getAdminAuth().verifyIdToken(idToken, false);
}

function cleanOldRateLimits() {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  }
}

export default async function handler(req, res) {
  setSecurityHeaders(res);

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return jsonError(res, 405, "Method not allowed");
  }

  const orderId = safeString(req.query?.orderId);
  const bookId = safeString(req.query?.bookId);

  if (!orderId || !bookId) {
    return jsonError(res, 400, "Parametres orderId et bookId requis");
  }

  try {
    const decodedToken = await verifyIdToken(req);
    cleanOldRateLimits();

    const ip = getClientIp(req);
    const rateKey = `${decodedToken.uid}:${ip}`;
    const rate = applyRateLimit(rateKey);
    if (rate.blocked) {
      res.setHeader("Retry-After", String(rate.retryAfterSec));
      return jsonError(res, 429, "Trop de requetes, reessayez dans quelques instants");
    }

    const order = await loadOrder(orderId);
    if (!order) {
      return jsonError(res, 404, "Commande introuvable");
    }

    if (!isApprovedOrder(order)) {
      return jsonError(res, 403, "Commande non approuvee");
    }

    if (!hasBookInOrder(order, bookId)) {
      return jsonError(res, 403, "Livre non autorise pour cette commande");
    }

    const orderUid = safeString(order?.uid);
    const userOwnsOrder = orderUid && orderUid === decodedToken.uid;
    const legacyOwnsOrder = !orderUid && hasLegacyMatch(order, req);

    if (!userOwnsOrder && !legacyOwnsOrder) {
      return jsonError(res, 403, "Acces refuse a ce livre");
    }

    const pdfSource = await resolvePdfSource(bookId);
    if (!pdfSource?.buffer?.length) {
      return jsonError(res, 404, "Fichier PDF indisponible");
    }

    const fileName = safeString(pdfSource.fileName || `${bookId}.pdf`).replace(/"/g, "");
    const contentType = safeString(pdfSource.contentType || "application/pdf");

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Length", String(pdfSource.buffer.length));
    res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);
    return res.status(200).send(pdfSource.buffer);
  } catch (error) {
    console.error("[reader/pdf] error:", error);
    const message = safeString(error?.message);

    if (message.toLowerCase().includes("authorization")) {
      return jsonError(res, 401, "Utilisateur non authentifie");
    }

    if (message.toLowerCase().includes("id token")) {
      return jsonError(res, 401, "Token utilisateur invalide");
    }

    return jsonError(res, 500, "Impossible de charger le PDF");
  }
}
