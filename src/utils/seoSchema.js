import { APP_NAME, APP_URL, OM_NUMBER, WA_NUMBER } from "../config/constants";

export function createOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: APP_NAME,
    description: "Librairie digitale en République de Guinea",
    url: APP_URL,
    logo: `${APP_URL}/logo.png`,
    image: `${APP_URL}/og-image.png`,
    telephone: `+${OM_NUMBER}`,
    contactPoint: {
      "@type": "ContactPoint",
      telephone: `+${OM_NUMBER}`,
      contactType: "customer service",
      availableLanguage: ["French"],
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: "Conakry",
      addressCountry: "GN",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: "9.6412",
      longitude: "-13.5784",
    },
    sameAs: [
      `https://wa.me/${WA_NUMBER}`,
    ],
  };
}

export function createWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: APP_NAME,
    url: APP_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${APP_URL}/catalogue?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function createStoreSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Store",
    name: APP_NAME,
    image: `${APP_URL}/og-image.png`,
    description: "Librairie numérique en Guinea - Vente de livres avec paiement Orange Money",
    url: APP_URL,
    priceRange: "GNF",
    currenciesAccepted: "GNF",
    paymentAccepted: ["Orange Money", "Mobile Money"],
    areaServed: {
      "@type": "Country",
      name: "Guinea",
    },
    hasMap: `${APP_URL}/carte`,
  };
}

export function createProductSchema(product) {
  const {
    title,
    description,
    image,
    price,
    rating,
    category,
    author,
    pages,
    isbn,
  } = product;

  return {
    "@context": "https://schema.org",
    "@type": "Book",
    name: title,
    description: description || title,
    image: image ? `${APP_URL}${image}` : `${APP_URL}/og-image.png`,
    offers: {
      "@type": "Offer",
      price: price,
      priceCurrency: "GNF",
      availability: "https://schema.org/InStock",
      validFrom: new Date().toISOString(),
    },
    ...(rating && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: rating,
        bestRating: 5,
        worstRating: 1,
        ratingCount: 1,
      },
    }),
    ...(category && { category }),
    ...(author && {
      author: { "@type": "Person", name: author },
    }),
    ...(pages && { numberOfPages: pages }),
    ...(isbn && { isbn }),
    publisher: {
      "@type": "Organization",
      name: APP_NAME,
    },
  };
}

export function createProductListSchema(products = []) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: products.map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: createProductSchema(product),
    })),
  };
}

export function createFAQSchema(faqs = []) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: {
        "@type": "Answer",
        text: answer,
      },
    })),
  };
}

export function createHowToSchema(steps = []) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "Comment commander",
    step: steps.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: step.title,
      text: step.description,
      ...(step.image && { image: step.image }),
    })),
  };
}