import { memo,lazy, Suspense } from "react";
import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";
import { APP_NAME, APP_URL, OM_NUMBER, WA_NUMBER } from "../../config/constants";
import { createOrganizationSchema, createWebSiteSchema, createStoreSchema, createProductSchema } from "../../utils/seoSchema";

const SEO = memo(function SEO({
  title,
  description,
  image,
  type = "website",
  product,
  article,
  author,
  publishedTime,
  modifiedTime,
  category,
  tags = [],
  noIndex = false,
  noFollow = false,
  canonical,
  schema,
}) {
  const location = useLocation();
  const defaultTitle = APP_NAME;
  const defaultDescription = "Votre librairie numérique en République de Guinea - Achetez des livres avec paiement Orange Money - Livraison rapide";
  const defaultImage = `${APP_URL}/og-image.png`;
  const defaultUrl = `${APP_URL}${location.pathname}`;

  const pageTitle = title ? `${title} | ${defaultTitle}` : defaultTitle;
  const pageDescription = description || defaultDescription;
  const pageImage = image || defaultImage;
  const pageUrl = canonical || defaultUrl;

  const robots = [
    noIndex ? "noindex" : "index",
    noFollow ? "nofollow" : "follow",
  ].join(", ");

  const schemas = [
    createOrganizationSchema(),
    createWebSiteSchema(),
    createStoreSchema(),
  ];

  if (product) {
    schemas.push(createProductSchema(product));
  }

  if (article) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: title,
      description: pageDescription,
      image: pageImage,
      datePublished: publishedTime,
      dateModified: modifiedTime,
      author: {
        "@type": "Person",
        name: author || APP_NAME,
      },
      publisher: {
        "@type": "Organization",
        name: APP_NAME,
        logo: `${APP_URL}/logo.png`,
      },
    });
  }

  if (schema) {
    schemas.push(schema);
  }

  return (
    <>
      <Helmet>
        <html lang="fr" />
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="keywords" content={["librairie", "livres", "Guinea", "Conakry", "Orange Money", "ebook", ...tags].join(", ")} />
        <meta name="robots" content={robots} />
        <meta name="author" content={APP_NAME} />
        <meta name="publisher" content={APP_NAME} />
        <meta name="language" content="FR" />
        <meta name="revisit-after" content="7 days" />
        <meta name="geo.region" content="GN" />
        <meta name="geo.placename" content="Conakry" />
        <meta name="geo.position" content="9.6412;-13.5784" />

        <link rel="canonical" href={pageUrl} />
        <link rel="alternate" hreflang="fr" href={pageUrl} />
        <link rel="alternate" href={pageUrl} hrefLang="x-default" />

        <meta property="og:locale" content="fr_FR" />
        <meta property="og:locale:alternate" content="en_US" />
        <meta property="og:type" content={type} />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:site_name" content={APP_NAME} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:image" content={pageImage} />
        <meta property="og:image:alt" content={pageTitle} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:secure_url" content={pageImage} />

        {type === "article" && (
          <>
            <meta property="article:published_time" content={publishedTime} />
            <meta property="article:modified_time" content={modifiedTime} />
            <meta property="article:author" content={author || APP_NAME} />
            <meta property="article:section" content={category} />
            {tags.map((tag) => (
              <meta key={tag} property="article:tag" content={tag} />
            ))}
          </>
        )}

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content={`@${APP_NAME.replace(/\s/g, "")}`} />
        <meta name="twitter:creator" content={`@${APP_NAME.replace(/\s/g, "")}`} />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={pageImage} />
        <meta name="twitter:image:alt" content={pageTitle} />
        <meta name="twitter:label1" content="Prix" />
        <meta name="twitter:data1" content={product?.price ? `${product.price} GNF` : ""} />

        <meta name="theme-color" content="#0891b2" />
        <meta name="msapplication-TileColor" content="#0891b2" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content={APP_NAME} />

        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content={APP_NAME} />
        <meta name="msapplication-starturl" content={APP_URL} />

        <script type="application/ld+json">
          {JSON.stringify(schemas)}
        </script>
      </Helmet>
    </>
  );
});

const SEOProduct = memo(function SEOProduct({ product }) {
  return (
    <SEO
      type="product"
      title={product.title}
      description={product.description}
      image={product.cover}
      product={product}
    />
  );
});

const SEOArticle = memo(function SEOArticle({ title, description, image, author, publishedTime, modifiedTime, category, tags }) {
  return (
    <SEO
      type="article"
      title={title}
      description={description}
      image={image}
      author={author}
      publishedTime={publishedTime}
      modifiedTime={modifiedTime}
      category={category}
      tags={tags}
    />
  );
});

const SEOBreadcrumb = memo(function SEOBreadcrumb({ items }) {
  const schema = {
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
    <script type="application/ld+json">
      {JSON.stringify(schema)}
    </script>
  );
});

const SEOCanonic = memo(function SEOCanonic({ url }) {
  return <link rel="canonical" href={url} />;
});

export default SEO;
export { SEOProduct, SEOArticle, SEOBreadcrumb, SEOCanonic };