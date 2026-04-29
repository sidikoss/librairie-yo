/**
 * SEO Schema utilities (simplified)
 */

export function createOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Librairie YO",
  };
}

export function createWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Librairie YO",
  };
}

export function createStoreSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "BookStore",
    "name": "Librairie YO",
  };
}

export function createProductSchema(product) {
  if (!product) return null;
  return {
    "@context": "https://schema.org",
    "@type": "Book",
    "name": product.title,
    "author": product.author,
    "offers": {
      "@type": "Offer",
      "price": product.price,
      "priceCurrency": "GNF",
    },
  };
}
