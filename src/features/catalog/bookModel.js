import { CATEGORIES, PRICING_CONFIG } from "../../config/constants";
import { clamp, formatGNF } from "../../utils/format";

export function computeDynamicPrice(
  pages,
  config = PRICING_CONFIG,
) {
  const safePages = Math.max(1, Number(pages || 1));
  const computed =
    config.base + (safePages / config.pageDivider) * config.factor;

  return Math.round(computed);
}

function parsePrice(raw) {
  if (typeof raw === "number") return raw;
  if (!raw) return 0;
  const numeric = String(raw).replace(/[^\d]/g, "");
  return Number(numeric || 0);
}

function ensureCategory(value) {
  if (!value) return "Autre";
  return CATEGORIES.includes(value) ? value : "Autre";
}

export function normalizeBook(rawBook, approvedSalesCount = 0) {
  const pages = Number(rawBook?.pages ?? rawBook?.pageCount ?? 120) || 120;
  const manualPrice = parsePrice(rawBook?.manualPrice);
  const manualPriceEnabled = Boolean(rawBook?.manualPriceEnabled);
  const dynamicPrice = computeDynamicPrice(pages);
  const effectivePrice =
    manualPriceEnabled && manualPrice > 0 ? manualPrice : dynamicPrice;
  const createdAt = Number(rawBook?.createdAt || Date.now());
  const discount = Number(rawBook?.discount || 0);
  const rawSalesCount = Number(rawBook?.salesCount || 0);
  const salesCount = Math.max(rawSalesCount, approvedSalesCount);
  const rating = clamp(Number(rawBook?.rating || 4.6), 1, 5);

  return {
    id: rawBook?.id || rawBook?.fbKey,
    fbKey: rawBook?.fbKey || rawBook?.id,
    title: rawBook?.title || "Livre sans titre",
    author: rawBook?.author || "Auteur inconnu",
    price: effectivePrice,
    pages,
    category: ensureCategory(rawBook?.category || rawBook?.cat),
    image: rawBook?.image || rawBook?.coverImage || "",
    rating,
    salesCount,
    isNew: Boolean(rawBook?.isNew) || Date.now() - createdAt < 14 * 86_400_000,
    isPopular: Boolean(rawBook?.isPopular) || salesCount >= 10 || Boolean(rawBook?.featured),
    discount,
    description: rawBook?.description || rawBook?.desc || "",
    hasFile: Boolean(rawBook?.hasFile || rawBook?.fileData),
    emoji: rawBook?.emoji || "📚",
    stock: Number(rawBook?.stock ?? 99),
    createdAt,
    featured: Boolean(rawBook?.featured),
    manualPrice: manualPrice || null,
    manualPriceEnabled,
  };
}

export function serializeBookToFirebase(bookInput, previousBook = null) {
  const pages = Number(bookInput.pages || previousBook?.pages || 120);
  const dynamicPrice = computeDynamicPrice(pages);
  const manualPrice = Number(bookInput.manualPrice || 0);
  const manualPriceEnabled = Boolean(bookInput.manualPriceEnabled);
  const finalPrice =
    manualPriceEnabled && manualPrice > 0 ? manualPrice : dynamicPrice;

  return {
    title: bookInput.title,
    author: bookInput.author,
    cat: bookInput.category,
    category: bookInput.category,
    coverImage: bookInput.image || "",
    image: bookInput.image || "",
    desc: bookInput.description || "",
    description: bookInput.description || "",
    emoji: bookInput.emoji || "📚",
    pageCount: pages,
    pages,
    num: finalPrice,
    price: formatGNF(finalPrice),
    manualPrice: manualPrice || null,
    manualPriceEnabled,
    rating: Number(bookInput.rating || 4.6),
    discount: Number(bookInput.discount || 0),
    salesCount: Number(bookInput.salesCount || previousBook?.salesCount || 0),
    stock: Number(bookInput.stock || 99),
    featured: Boolean(bookInput.featured),
    isNew: Boolean(bookInput.isNew),
    isPopular: Boolean(bookInput.isPopular),
    hasFile: Boolean(bookInput.hasFile || previousBook?.hasFile),
    createdAt: previousBook?.createdAt || Date.now(),
    updatedAt: Date.now(),
  };
}

export function getBookDisplayPrice(book) {
  const base = Number(book.price || 0);
  const discount = Number(book.discount || 0);
  if (discount <= 0) return base;
  return Math.max(0, base - discount);
}
