import { memo } from "react";
import { Link } from "react-router-dom";

const BreadcrumbItem = memo(function BreadcrumbItem({ item, index, isLast }) {
  const content = item.url ? (
    <Link
      to={item.url}
      className="text-zinc-500 hover:text-brand-600 dark:text-zinc-400 dark:hover:text-brand-400 transition-colors"
    >
      {item.label}
    </Link>
  ) : (
    <span className="text-zinc-900 dark:text-white font-medium">{item.label}</span>
  );

  return (
    <li className="flex items-center">
      {content}
      {!isLast && (
        <span className="mx-2 text-zinc-400" aria-hidden="true">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </span>
      )}
    </li>
  );
});

const Breadcrumb = memo(function Breadcrumb({ items = [], className = "" }) {
  if (!items || items.length === 0) return null;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      ...(item.url && { item: item.url }),
    })),
  };

  return (
    <>
      <nav
        aria-label="Breadcrumb"
        className={`text-sm ${className}`}
      >
        <ol className="flex flex-wrap items-center gap-1">
          <li className="flex items-center">
            <Link
              to="/"
              className="text-zinc-500 hover:text-brand-600 dark:text-zinc-400 dark:hover:text-brand-400 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="sr-only">Accueil</span>
            </Link>
          </li>
          {items.map((item, index) => (
            <BreadcrumbItem
              key={item.label + index}
              item={item}
              index={index}
              isLast={index === items.length - 1}
            />
          ))}
        </ol>
      </nav>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
    </>
  );
});

export default Breadcrumb;