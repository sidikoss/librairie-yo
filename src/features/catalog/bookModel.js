import { PRICING_CONFIG } from "../../config/constants";

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toBoolean(value) {
  return value === true || value === "true" || value === 1 || value === "1";
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function computeDynamicPrice(pagesInput) {
  const pages = Math.max(0, Math.round(toNumber(pagesInput, 0)));
  const {
    basePrice,
    firstTierMaxPages,
    extraTierPages,
    extraTierPrice,
    maxPrice,
  } = PRICING_CONFIG;

  if (pages <= firstTierMaxPages) {
    return basePrice;
  }

  const extraPages = pages - firstTierMaxPages;
  const tiers = Math.ceil(extraPages / extraTierPages);
  const computed = basePrice + tiers * extraTierPrice;
  return Math.min(computed, maxPrice);
}

export function normalizeBook(rawBook = {}, syncedSalesCount = null) {
  const pages = Math.max(1, Math.round(toNumber(rawBook.pages, 120)));
  const dynamicPrice = computeDynamicPrice(pages);
  const manualPrice = Math.max(0, Math.round(toNumber(rawBook.manualPrice, 0)));
  const manualPriceEnabled = toBoolean(rawBook.manualPriceEnabled);
  const explicitPrice = Math.max(0, Math.round(toNumber(rawBook.price, dynamicPrice)));

  const price = manualPriceEnabled
    ? (manualPrice || dynamicPrice)
    : explicitPrice;

  const createdAt = Math.round(toNumber(rawBook.createdAt, Date.now()));
  const salesCount = Number.isFinite(Number(syncedSalesCount))
    ? Math.max(0, Math.round(Number(syncedSalesCount)))
    : Math.max(0, Math.round(toNumber(rawBook.salesCount, 0)));

  const normalizedRating = clamp(toNumber(rawBook.rating, 4.6), 0, 5);
  const normalizedDiscount = Math.max(0, Math.round(toNumber(rawBook.discount, 0)));

  return {
    id: String(rawBook.id || rawBook.fbKey || ""),
    fbKey: String(rawBook.fbKey || rawBook.id || ""),
    title: String(rawBook.title || "Livre sans titre").trim() || "Livre sans titre",
    author: String(rawBook.author || "Auteur inconnu").trim() || "Auteur inconnu",
    description: String(rawBook.description || "").trim(),
    category: String(rawBook.category || "Autre").trim() || "Autre",
    pages,
    manualPrice,
    manualPriceEnabled,
    price,
    image: String(rawBook.image || "").trim(),
    fileData: rawBook.fileData || null,
    fileName: rawBook.fileName || "",
    fileType: rawBook.fileType || "",
    discount: normalizedDiscount,
    rating: Number(normalizedRating.toFixed(1)),
    stock: Math.max(0, Math.round(toNumber(rawBook.stock, 99))),
    featured: toBoolean(rawBook.featured),
    isNew: typeof rawBook.isNew === "boolean"
      ? rawBook.isNew
      : Date.now() - createdAt < 30 * 24 * 60 * 60 * 1000,
    isPopular: typeof rawBook.isPopular === "boolean"
      ? rawBook.isPopular
      : salesCount >= 10,
    salesCount,
    createdAt,
    updatedAt: Math.round(toNumber(rawBook.updatedAt, createdAt)),
    emoji: String(rawBook.emoji || "").trim(),
  };
}

export function serializeBookToFirebase(draft = {}, currentBook = null) {
  const base = currentBook || {};
  const pages = Math.max(1, Math.round(toNumber(draft.pages, toNumber(base.pages, 120))));
  const manualPriceEnabled = toBoolean(
    draft.manualPriceEnabled ?? base.manualPriceEnabled,
  );
  const manualPrice = Math.max(
    0,
    Math.round(toNumber(draft.manualPrice, toNumber(base.manualPrice, 0))),
  );

  const computedPrice = manualPriceEnabled
    ? (manualPrice || computeDynamicPrice(pages))
    : computeDynamicPrice(pages);

  const createdAt = Math.round(toNumber(base.createdAt, Date.now()));

  return {
    title: String(draft.title ?? base.title ?? "").trim(),
    author: String(draft.author ?? base.author ?? "").trim(),
    description: String(draft.description ?? base.description ?? "").trim(),
    category: String(draft.category ?? base.category ?? "Autre").trim() || "Autre",
    pages,
    image: String(draft.image ?? base.image ?? "").trim(),
    rating: clamp(toNumber(draft.rating, toNumber(base.rating, 4.6)), 0, 5),
    discount: Math.max(0, Math.round(toNumber(draft.discount, toNumber(base.discount, 0)))),
    stock: Math.max(0, Math.round(toNumber(draft.stock, toNumber(base.stock, 99)))),
    featured: toBoolean(draft.featured ?? base.featured),
    manualPrice,
    manualPriceEnabled,
    price: computedPrice,
    salesCount: Math.max(0, Math.round(toNumber(base.salesCount, 0))),
    createdAt,
    updatedAt: Date.now(),
  };
}
