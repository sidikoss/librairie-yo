export const SITEMAP_CONFIG = {
  baseUrl: "https://librairie-yo-gui.vercel.app",
  Changefreq: {
    always: "always",
    hourly: "hourly",
    daily: "daily",
    weekly: "weekly",
    monthly: "monthly",
    yearly: "yearly",
    never: "never",
  },
  Priority: {
    critical: 1.0,
    high: 0.8,
    medium: 0.6,
    low: 0.4,
    none: 0.0,
  },
};

export const STATIC_PAGES = [
  {
    loc: "/",
    changefreq: SITEMAP_CONFIG.Changefreq.daily,
    priority: SITEMAP_CONFIG.Priority.critical,
    lastmod: new Date().toISOString().split("T")[0],
  },
  {
    loc: "/catalogue",
    changefreq: SITEMAP_CONFIG.Changefreq.daily,
    priority: SITEMAP_CONFIG.Priority.high,
    lastmod: new Date().toISOString().split("T")[0],
  },
  {
    loc: "/panier",
    changefreq: SITEMAP_CONFIG.Changefreq.weekly,
    priority: SITEMAP_CONFIG.Priority.medium,
  },
  {
    loc: "/checkout",
    changefreq: SITEMAP_CONFIG.Changefreq.weekly,
    priority: SITEMAP_CONFIG.Priority.medium,
  },
  {
    loc: "/favoris",
    changefreq: SITEMAP_CONFIG.Changefreq.weekly,
    priority: SITEMAP_CONFIG.Priority.low,
  },
  {
    loc: "/commandes",
    changefreq: SITEMAP_CONFIG.Changefreq.weekly,
    priority: SITEMAP_CONFIG.Priority.low,
  },
];

export function generateRobotsTxt(sitemapUrl = "https://librairie-yo-gui.vercel.app/sitemap.xml") {
  return `
User-agent: *
Allow: /
Disallow: /admin
Disallow: /api

# Sitemap
Sitemap: ${sitemapUrl}

# Crawl-delay
Crawl-delay: 1
`.trim();
}

export function generateStaticPagesXml(pages = STATIC_PAGES) {
  const pagesXml = pages
    .map(
      (page) => `
  <url>
    <loc>${SITEMAP_CONFIG.baseUrl}${page.loc}</loc>
    <lastmod>${page.lastmod || new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pagesXml}
</urlset>`;
}

export function generateImageSitemap(images = []) {
  const imagesXml = images
    .map(
      (image) => `
  <image:Image>
    <image:loc>${image.loc}</image:loc>
    <image:title>${image.title}</image:title>
    ${image.caption ? `<image:caption>${image.caption}</image:caption>` : ""}
    ${image.geoLocation ? `<image:geoLocation>${image.geoLocation}</image:geoLocation>` : ""}
  </image:Image>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${imagesXml}
</urlset>`;
}