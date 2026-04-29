import {
  APP_NAME,
  APP_URL,
  SUPPORT_EMAIL,
  WA_NUMBER,
  OM_NUMBER,
} from "../config/constants";

function normalizePhone(value) {
  const digits = String(value || "").replace(/[^\d]/g, "");
  if (!digits) return "";
  if (digits.startsWith("224")) return `+${digits}`;
  if (digits.startsWith("0")) return `+224${digits.slice(1)}`;
  return `+${digits}`;
}

export function createOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: APP_NAME,
    url: APP_URL,
    email: SUPPORT_EMAIL,
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        telephone: normalizePhone(WA_NUMBER),
        availableLanguage: ["French"],
      },
      {
        "@type": "ContactPoint",
        contactType: "payments",
        telephone: normalizePhone(OM_NUMBER),
        availableLanguage: ["French"],
      },
    ],
  };
}

export function createWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: APP_NAME,
    url: APP_URL,
    inLanguage: "fr",
  };
}

export function createStoreSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "BookStore",
    name: APP_NAME,
    url: APP_URL,
    paymentAccepted: ["Orange Money"],
    areaServed: "GN",
  };
}

export function createProductSchema(product = {}) {
  const price = Number(product.price || 0);

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name || product.title || "Livre",
    description: product.description || "",
    image: product.image || product.cover || "",
    brand: {
      "@type": "Brand",
      name: APP_NAME,
    },
    offers: {
      "@type": "Offer",
      priceCurrency: product.priceCurrency || "GNF",
      price: price > 0 ? price : 0,
      availability: "https://schema.org/InStock",
      url: product.url || APP_URL,
    },
  };
}
