/**
 * Librairie YO - FAQ Page Schema
 * @module utils/seoFaq
 * @description Schemas SEO pour rich snippets
 */

import { APP_NAME, APP_URL } from "../config/constants";

export function createHowToBuySchema() {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "Comment acheter sur Librairie YO",
    description: "Guide paso a paso pour commander vos livres",
    image: `${APP_URL}/og-image.png`,
    step: [
      {
        "@type": "HowToStep",
        name: "Parcourir le catalogue",
        text: "Naviguez vers /catalogue et utilisez les filtres pour trouver votre livre.",
        url: `${APP_URL}/catalogue`,
      },
      {
        "@type": "HowToStep",
        name: "Ajouter au panier",
        text: "Cliquez sur 'Ajouter au panier' pour le livre souhaité.",
        url: `${APP_URL}/catalogue`,
      },
      {
        "@type": "HowToStep",
        name: "Finaliser la commande",
        text: " Allez vers /panier puis /checkout.",
        url: `${APP_URL}/checkout`,
      },
      {
        "@type": "HowToStep",
        name: "Paiement",
        text: "Payez via Orange Money ou WhatsApp.",
        url: `${APP_URL}/checkout`,
      },
    ],
  };
}

export function createAuthorSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: APP_NAME,
    description: "Librairie numérique en République de Guinea",
    url: APP_URL,
    sameAs: [
      `https://wa.me/224613908784`,
    ],
    worksFor: {
      "@type": "Organization",
      name: APP_NAME,
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: "Conakry",
      addressCountry: "GN",
    },
  };
}

export function createQAggregateSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "QAPage",
    mainEntity: {
      "@type": "Question",
      name: "Comment commander un livre?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Parcourez le catalogue, ajoutez le livre au panier, puis finalisez via WhatsApp ou Orange Money.",
      },
    },
  };
}

export function createEventSchema(event) {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.description,
    startDate: event.startsAt,
    endDate: event.endsAt,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
    location: {
      "@type": "VirtualLocation",
      url: APP_URL,
    },
    offers: {
      "@type": "Offer",
      price: event.discount,
      priceCurrency: "GNF",
      availability: "https://schema.org/InStock",
    },
    organizer: {
      "@type": "Organization",
      name: APP_NAME,
      url: APP_URL,
    },
  };
}

export function createCourseSchema(course) {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: course.description,
    provider: {
      "@type": "Organization",
      name: APP_NAME,
    },
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "online",
      courseWorkload: `PT${course.hours}H`,
    },
  };
}

export function createSoftwareSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Librairie YO",
    applicationCategory: "Shopping",
    operatingSystem: "Web, Android, iOS",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "GNF",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.5",
      ratingCount: "150",
    },
  };
}

export default {
  createHowToBuySchema,
  createAuthorSchema,
  createQAggregateSchema,
  createEventSchema,
  createCourseSchema,
  createSoftwareSchema,
};