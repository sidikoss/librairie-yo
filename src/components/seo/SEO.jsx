import { Helmet } from "react-helmet-async";
import { APP_NAME } from "../../config/constants";

export default function SEO({ 
  title, 
  description, 
  keywords, 
  image = "/og-image.png", 
  url = "https://librairie-yo.vercel.app",
  noIndex = false,
  schema = null
}) {
  const fullTitle = title ? `${title} | ${APP_NAME}` : APP_NAME;
  const defaultDescription = "Librairie digitale en Guinée. Achetez des livres de qualité avec paiement Orange Money, PayCard et livraison rapide.";
  const metaDescription = description || defaultDescription;

  const defaultSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": APP_NAME,
    "url": "https://librairie-yo.vercel.app",
    "description": "Librairie digitale en Guinée. Vente de livres avec paiement Orange Money et livraison rapide.",
    "publisher": {
      "@type": "Organization",
      "name": APP_NAME,
      "logo": {
        "@type": "ImageObject",
        "url": "/og-image.png"
      }
    }
  };

  const jsonLd = schema || defaultSchema;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <link rel="canonical" href={url} />
      <meta name="title" content={fullTitle} />
      <meta name="description" content={metaDescription} />
      {keywords && <meta name="keywords" content={keywords} />}
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={image} />
      <meta property="og:locale" content="fr_GN" />
      <meta property="og:site_name" content={APP_NAME} />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={metaDescription} />
      <meta property="twitter:image" content={image} />
      
      {/* Mobile & PWA tags */}
      <meta name="theme-color" content="#1e40af" />

      {/* JSON-LD Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(jsonLd)}
      </script>
    </Helmet>
  );
}
