import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BASE_URL = "https://librairie-yo-gui.vercel.app";

const PAGES = [
  { url: "/", priority: "1.0", changefreq: "daily", lastmod: new Date().toISOString().split("T")[0] },
  { url: "/catalogue", priority: "0.9", changefreq: "daily" },
  { url: "/panier", priority: "0.7", changefreq: "weekly" },
  { url: "/checkout", priority: "0.6", changefreq: "weekly" },
  { url: "/favoris", priority: "0.6", changefreq: "weekly" },
  { url: "/commandes", priority: "0.6", changefreq: "weekly" },
  { url: "/lecture", priority: "0.5", changefreq: "monthly" },
];

const BOOKS = [
  { id: "book-1", title: "Introduction à la programmation", category: "Informatique", updatedAt: new Date().toISOString() },
  { id: "book-2", title: "Guide du développement web", category: "Informatique", updatedAt: new Date().toISOString() },
  { id: "book-3", title: "Les bases de données", category: "Informatique", updatedAt: new Date().toISOString() },
  { id: "book-4", title: "Roman: L'Afrique unity", category: "Roman", updatedAt: new Date().toISOString() },
  { id: "book-5", title: "Histoire de la Guinée", category: "Histoire", updatedAt: new Date().toISOString() },
  { id: "book-6", title: "Philosophie moderne", category: "Philosophie", updatedAt: new Date().toISOString() },
];

const CATEGORIES = [
  "Roman", "Science", "Histoire", "Philosophie", "Manga", "Religion-Spiritualite",
  "Developpement-personnel", "Informatique", "Jeunesse", "Poésie", "Biographie",
  "Entrepreneur", "Etudiant", "Lyceen", "Finance-Investissement", "Sante-Bien-etre",
];

function generateStaticPagesXml() {
  const pages = PAGES.map(page => `
  <url>
    <loc>${BASE_URL}${page.url}</loc>
    <lastmod>${page.lastmod || new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages}
</urlset>`;
}

function generateBooksSitemap() {
  const books = BOOKS.map(book => `
  <url>
    <loc>${BASE_URL}/catalogue?id=${book.id}</loc>
    <lastmod>${book.updatedAt.split("T")[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
    <xhtml:link rel="alternate" hreflang="fr" href="${BASE_URL}/catalogue?id=${book.id}"/>
  </url>`).join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
xmlns:xhtml="http://www.w3.org/1999/xhtml">
${books}
</urlset>`;
}

function generateCategoriesSitemap() {
  const categories = CATEGORIES.map(cat => `
  <url>
    <loc>${BASE_URL}/catalogue?categorie=${cat}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`).join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${categories}
</urlset>`;
}

function generateIndexSitemap() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${BASE_URL}/sitemap-pages.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${BASE_URL}/sitemap-books.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${BASE_URL}/sitemap-categories.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>
</sitemapindex>`;
}

function generateRobotsTxt() {
  return `User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin
Disallow: /*404*

# Sitemaps
Sitemap: ${BASE_URL}/sitemap-index.xml
Sitemap: ${BASE_URL}/sitemap-pages.xml

# Crawl-delay
Crawl-delay: 1

# Host
Host: ${BASE_URL}
`.trim();
}

const distDir = join(__dirname, "dist");
if (!existsSync(distDir)) {
  mkdirSync(distDir, { recursive: true });
}

console.log("Generating sitemaps...");

writeFileSync(join(distDir, "sitemap-pages.xml"), generateStaticPagesXml());
writeFileSync(join(distDir, "sitemap-books.xml"), generateBooksSitemap());
writeFileSync(join(distDir, "sitemap-categories.xml"), generateCategoriesSitemap());
writeFileSync(join(distDir, "sitemap-index.xml"), generateIndexSitemap());
writeFileSync(join(distDir, "robots.txt"), generateRobotsTxt());

console.log("Sitemaps generated successfully!");
console.log("- sitemap-pages.xml");
console.log("- sitemap-books.xml");
console.log("- sitemap-categories.xml");
console.log("- sitemap-index.xml");
console.log("- robots.txt");