import { useState, useEffect, useMemo, useCallback, lazy, Suspense, memo } from "react";
import "./App.css";
import { BOOTSTRAP_BOOKS } from "./catalogBootstrap";

// AdminPanel chargé uniquement quand l'admin se connecte
// → pas dans le bundle initial des visiteurs
const AdminPanel = lazy(() => import("./AdminPanel"));

// ─────────────────────────────────────────────────────────────
// CONSTANTES
// ─────────────────────────────────────────────────────────────
const ADMIN_PASSWORD     = "papiraro2143";
const OM_NUMBER          = "224613908784";
const WA_NUMBER          = "224661862044";
const TELEGRAM_BOT_TOKEN = "VOTRE_BOT_TOKEN";
const TELEGRAM_CHAT_ID   = "VOTRE_CHAT_ID";
const DB = "https://librairie-yo-default-rtdb.firebaseio.com";
const CATALOG_PATH = "catalog";
const INITIAL_VISIBLE_BOOKS = 12;
const VISIBLE_BOOKS_STEP = 12;

// ─────────────────────────────────────────────────────────────
// REST API — zéro Firebase SDK (bundle x2.5 plus léger)
// ─────────────────────────────────────────────────────────────
const api = {
  get: async (path, ms = 8000) => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms);
    try {
      const r = await fetch(`${DB}/${path}.json`, { signal: ctrl.signal });
      clearTimeout(t);
      if (!r.ok) return null;
      return await r.json();
    } catch { clearTimeout(t); return null; }
  },
  post: async (path, data) => {
    const r = await fetch(`${DB}/${path}.json`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return r.json();
  },
  patch: async (path, data) => {
    const r = await fetch(`${DB}/${path}.json`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return r.json();
  },
  put: async (path, data) => {
    const r = await fetch(`${DB}/${path}.json`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return r.json();
  },
  del: async (path) => { await fetch(`${DB}/${path}.json`, { method: "DELETE" }); }
};

// ─────────────────────────────────────────────────────────────
// CACHE LIVRES — localStorage → rendu INSTANTANÉ
// ─────────────────────────────────────────────────────────────
const BOOKS_CACHE_KEY = "yo_books_v3";

const normalizeBook = (book, fallbackKey = null) => {
  if (!book || typeof book !== "object") return null;
  const normalized = {
    fbKey: book.fbKey || fallbackKey || null,
    title: String(book.title || "").trim(),
    author: String(book.author || "").trim(),
    cat: book.cat || "Autre",
    emoji: book.emoji || "📚",
    price: String(book.price || `${Number(book.num || 0).toLocaleString("fr-FR")} GNF`),
    num: Number(book.num) || 0,
    desc: String(book.desc || "").trim(),
    stock: Number(book.stock) || 99,
    hasFile: !!book.hasFile,
    featured: !!book.featured,
    createdAt: Number(book.createdAt) || 0,
    pageCount: Number(book.pageCount) || null,
    coverImage: typeof book.coverImage === "string" && !book.coverImage.startsWith("data:") ? book.coverImage : null,
  };
  if (!normalized.fbKey) delete normalized.fbKey;
  if (!normalized.desc) delete normalized.desc;
  if (!normalized.coverImage) delete normalized.coverImage;
  return normalized;
};

const mapCatalogData = data => {
  if (!data || typeof data !== "object") return [];
  return Object.entries(data)
    .map(([k, v]) => normalizeBook({ ...v, fbKey: k }, k))
    .filter(Boolean);
};

const loadBootstrapBooks = () => BOOTSTRAP_BOOKS.map(b => normalizeBook(b, b.fbKey)).filter(Boolean);

const loadCachedBooks = () => {
  try {
    const raw = localStorage.getItem(BOOKS_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(b => normalizeBook(b, b.fbKey)).filter(Boolean);
  }
  catch { return []; }
};

const getInitialBooks = () => {
  const cached = loadCachedBooks();
  if (cached.length > 0) return cached;
  return loadBootstrapBooks();
};

const saveBooksCache = books => {
  try {
    const slim = books.map(b => normalizeBook(b, b.fbKey)).filter(Boolean);
    localStorage.setItem(BOOKS_CACHE_KEY, JSON.stringify(slim));
  } catch {}
};

// ─────────────────────────────────────────────────────────────
// SESSION / RATE LIMIT / WISHLIST
// ─────────────────────────────────────────────────────────────
const SESSION_KEY = "yo_adm_sess";
const SESSION_TTL = 7_200_000;
const saveSession  = () => localStorage.setItem(SESSION_KEY, Date.now().toString());
const loadSession  = () => { const t = parseInt(localStorage.getItem(SESSION_KEY)||"0"); return !!(t && Date.now()-t < SESSION_TTL); };
const clearSession = () => localStorage.removeItem(SESSION_KEY);

const RATE_KEY = "yo_rate";
const canOrder = () => {
  try {
    const d = JSON.parse(localStorage.getItem(RATE_KEY)||'{"c":0,"r":0}');
    if (Date.now() > d.r) { localStorage.setItem(RATE_KEY, JSON.stringify({c:1,r:Date.now()+600_000})); return true; }
    if (d.c >= 3) return false;
    localStorage.setItem(RATE_KEY, JSON.stringify({...d,c:d.c+1})); return true;
  } catch { return true; }
};

const WISH_KEY = "yo_wishlist";
const loadWish = () => { try { return JSON.parse(localStorage.getItem(WISH_KEY)||"[]"); } catch { return []; } };
const saveWish = w => { try { localStorage.setItem(WISH_KEY, JSON.stringify(w)); } catch {} };

// ─────────────────────────────────────────────────────────────
// CATÉGORIES & CONFIG
// ─────────────────────────────────────────────────────────────
const CATS = [
  "Roman","Science","Histoire","Philosophie","Manga",
  "Religion & Spiritualité","Développement personnel","Informatique",
  "Jeunesse","Poésie","Biographie","Entrepreneur",
  "Étudiant","Lycéen","Finance & Investissement",
  "Santé & Bien-être","Art & Créativité","Géopolitique",
  "Langues","Psychologie","Autre"
];
const CAT_ICONS = {
  "Roman":"📖","Science":"🔬","Histoire":"📜","Philosophie":"🧠","Manga":"🎌",
  "Religion & Spiritualité":"🕌","Développement personnel":"🚀","Informatique":"💻",
  "Jeunesse":"🌟","Poésie":"🎭","Biographie":"👤","Entrepreneur":"💼",
  "Étudiant":"🎓","Lycéen":"📐","Finance & Investissement":"💰","Santé & Bien-être":"🏃",
  "Art & Créativité":"🎨","Géopolitique":"🌍","Langues":"🗣️","Psychologie":"🧬","Autre":"📚"
};
const CAT_PILLS = [
  {label:"Tout",val:""},{label:"⭐ Favoris",val:"__wish__"},{label:"🆕 Nouveautés",val:"__new__"},
  {label:"⭐ Mis en avant",val:"__feat__"},{label:"🎓 Étudiant",val:"Étudiant"},
  {label:"📐 Lycéen",val:"Lycéen"},{label:"💼 Entrepreneur",val:"Entrepreneur"},
  {label:"🚀 Dev perso",val:"Développement personnel"},{label:"🧠 Philo",val:"Philosophie"},
  {label:"💻 Tech",val:"Informatique"},{label:"💰 Finance",val:"Finance & Investissement"},
  {label:"📖 Roman",val:"Roman"},
];
const SORT_OPTS = [
  {val:"new",label:"🆕 Nouveaux"},{val:"old",label:"🕐 Anciens"},
  {val:"price_asc",label:"💰 Prix ↑"},{val:"price_desc",label:"💰 Prix ↓"},{val:"az",label:"🔤 A–Z"},
];
const EMOJIS = ["📚","📖","✨","🌙","💡","🔥","⭐","🌿","🦋","🎯","💰","🌹","🗺️","⚔️","🔮","🧠","🏆","⚡","🌍","🕌"];

// ─────────────────────────────────────────────────────────────
// HELPERS (stables — définis hors composant, pas recréés)
// ─────────────────────────────────────────────────────────────
const isNew7d    = ts  => ts && (Date.now()-ts) < 7*86_400_000;
const fmtGNF     = n   => (n||0).toLocaleString("fr-FR")+" GNF";
const fmtDate    = ts  => ts ? new Date(ts).toLocaleString("fr-FR",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}) : "";
const sanitize   = str => String(str||"").replace(/[<>]/g,"").trim();
const validPhone = p   => /^\d{9,15}$/.test(p.replace(/[\s\-+()]/g,""));
const validTx    = t   => t.trim().length >= 4;

function applySort(books, sort) {
  const b = [...books];
  if (sort==="new")        return b.sort((a,c)=>(c.createdAt||0)-(a.createdAt||0));
  if (sort==="old")        return b.sort((a,c)=>(a.createdAt||0)-(c.createdAt||0));
  if (sort==="price_asc")  return b.sort((a,c)=>(a.num||0)-(c.num||0));
  if (sort==="price_desc") return b.sort((a,c)=>(c.num||0)-(a.num||0));
  if (sort==="az")         return b.sort((a,c)=>(a.title||"").localeCompare(c.title||"","fr"));
  return b;
}

// ─────────────────────────────────────────────────────────────
// PDF.JS — chargé à la demande (admin uniquement)
// ─────────────────────────────────────────────────────────────
function readFileAsBase64(file) {
  return new Promise((res,rej)=>{ const fr=new FileReader(); fr.onload=()=>res(fr.result); fr.onerror=rej; fr.readAsDataURL(file); });
}
async function loadPDFJS() {
  if (window.pdfjsLib) return window.pdfjsLib;
  return new Promise((resolve,reject)=>{
    const s=document.createElement("script");
    s.src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    s.onload=()=>{ window.pdfjsLib.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"; resolve(window.pdfjsLib); };
    s.onerror=reject; document.head.appendChild(s);
  });
}
function pdfBytesFromBase64(b64) {
  const payload = String(b64 || "").split(",")[1] || "";
  const raw = atob(payload);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}
function foldText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanLine(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}
async function extractPDFCover(b64) {
  try {
    const pdfjs = await loadPDFJS();
    const bytes = pdfBytesFromBase64(b64);
    const pdf = await pdfjs.getDocument({ data: bytes }).promise;
    const page = await pdf.getPage(1);
    const vp0 = page.getViewport({ scale: 1 });
    const scale = Math.min(320 / vp0.width, 480 / vp0.height);
    const vp = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = vp.width; canvas.height = vp.height;
    await page.render({ canvasContext: canvas.getContext("2d"), viewport: vp }).promise;
    return canvas.toDataURL("image/jpeg", 0.72);
  } catch { return null; }
}
async function extractPDFPageCount(b64) {
  try {
    const pdfjs = await loadPDFJS();
    const bytes = pdfBytesFromBase64(b64);
    const pdf = await pdfjs.getDocument({ data: bytes }).promise;
    return pdf.numPages;
  } catch { return null; }
}
async function extractPDFFirstPageText(b64) {
  try {
    const pdfjs = await loadPDFJS();
    const bytes = pdfBytesFromBase64(b64);
    const pdf = await pdfjs.getDocument({ data: bytes }).promise;
    const page = await pdf.getPage(1);
    const tc = await page.getTextContent();
    const chunks = [];
    for (const item of (tc?.items || [])) {
      if (item?.str) chunks.push(item.str);
      if (item?.hasEOL) chunks.push("\n");
    }
    return chunks.join(" ").replace(/[ \t]+\n/g, "\n").replace(/\n[ \t]+/g, "\n").trim();
  } catch { return ""; }
}

function parsePdfCoverHints(firstPageText, fallbackName = "") {
  const fallbackTitle = cleanLine(
    String(fallbackName || "")
      .replace(/\.[^.]+$/, "")
      .replace(/[_-]+/g, " ")
      .replace(/\d{2,}/g, " ")
  );

  const lines = String(firstPageText || "")
    .split(/\r?\n/)
    .map(cleanLine)
    .filter(Boolean)
    .filter(line => line.length >= 3 && line.length <= 120)
    .slice(0, 16);

  const title = lines.find(line =>
    !/^(par|by|de)\s+/i.test(line) &&
    !/(isbn|copyright|all rights reserved|www\.|http)/i.test(line)
  ) || fallbackTitle || "";

  const byline = lines.find(line => /^(par|by|de)\s+/i.test(line))
    || lines.find(line => /^(auteur|author)\s*[:\-]/i.test(line))
    || "";

  let author = byline
    .replace(/^(par|by|de)\s+/i, "")
    .replace(/^(auteur|author)\s*[:\-]\s*/i, "")
    .trim();

  if (!author) {
    author = lines.find(line => {
      const words = line.split(" ").filter(Boolean);
      if (words.length < 2 || words.length > 5) return false;
      if (line.length > 60) return false;
      return /^[A-Za-zÀ-ÖØ-öø-ÿ'`.-]+(?: [A-Za-zÀ-ÖØ-öø-ÿ'`.-]+)+$/.test(line);
    }) || "";
  }

  return { title: cleanLine(title), author: cleanLine(author), firstPageText: String(firstPageText || "") };
}

async function fetchJSONWithTimeout(url, ms = 7000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function toBookCandidate(source, raw = {}) {
  return {
    source,
    title: cleanLine(raw.title),
    author: cleanLine(raw.author),
    categories: Array.isArray(raw.categories) ? raw.categories.map(cleanLine).filter(Boolean) : [],
    pageCount: Number(raw.pageCount) || null,
    description: cleanLine(raw.description || ""),
  };
}

function scoreCandidate(candidate, titleHint, authorHint) {
  const tHint = foldText(titleHint);
  const aHint = foldText(authorHint);
  const tCand = foldText(candidate?.title);
  const aCand = foldText(candidate?.author);
  let score = 0;

  if (tHint && tCand) {
    if (tHint === tCand) score += 65;
    else if (tCand.includes(tHint) || tHint.includes(tCand)) score += 40;
    else {
      const tokens = tHint.split(" ").filter(t => t.length > 3);
      const overlap = tokens.filter(t => tCand.includes(t)).length;
      score += overlap * 8;
    }
  }

  if (aHint && aCand) {
    if (aHint === aCand) score += 30;
    else if (aCand.includes(aHint) || aHint.includes(aCand)) score += 20;
    else {
      const tokens = aHint.split(" ").filter(t => t.length > 2);
      const overlap = tokens.filter(t => aCand.includes(t)).length;
      score += overlap * 5;
    }
  }

  if (candidate?.description) score += 4;
  if (candidate?.categories?.length) score += 4;
  if (candidate?.pageCount) score += 2;
  if (candidate?.source === "google") score += 1;
  return score;
}

function pickBestCandidate(candidates, titleHint, authorHint) {
  const list = (candidates || [])
    .filter(c => c?.title)
    .map(c => ({ ...c, _score: scoreCandidate(c, titleHint, authorHint) }))
    .sort((a, b) => b._score - a._score);
  return list[0] || null;
}

async function searchGoogleBooks(titleHint, authorHint) {
  const q = [];
  if (titleHint) q.push(`intitle:${titleHint}`);
  if (authorHint) q.push(`inauthor:${authorHint}`);
  if (!q.length) return [];

  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q.join(" "))}&maxResults=8&projection=lite&printType=books`;
  const data = await fetchJSONWithTimeout(url, 8000);
  const items = Array.isArray(data?.items) ? data.items : [];
  return items.map(item => {
    const info = item?.volumeInfo || {};
    return toBookCandidate("google", {
      title: info.title || "",
      author: Array.isArray(info.authors) ? info.authors[0] : "",
      categories: info.categories || [],
      pageCount: info.pageCount,
      description: info.description || "",
    });
  });
}

async function searchOpenLibrary(titleHint, authorHint) {
  const params = [];
  if (titleHint) params.push(`title=${encodeURIComponent(titleHint)}`);
  if (authorHint) params.push(`author=${encodeURIComponent(authorHint)}`);
  params.push("limit=8");
  const url = `https://openlibrary.org/search.json?${params.join("&")}`;
  const data = await fetchJSONWithTimeout(url, 8000);
  const docs = Array.isArray(data?.docs) ? data.docs : [];
  return docs.map(doc => toBookCandidate("openlibrary", {
    title: doc?.title || "",
    author: Array.isArray(doc?.author_name) ? doc.author_name[0] : "",
    categories: Array.isArray(doc?.subject) ? doc.subject.slice(0, 6) : [],
    pageCount: doc?.number_of_pages_median || null,
    description: "",
  }));
}

async function searchBookMetadata(titleHint, authorHint) {
  const safeTitle = cleanLine(titleHint);
  const safeAuthor = cleanLine(authorHint);
  if (!safeTitle && !safeAuthor) return null;

  const [google, openLibrary] = await Promise.all([
    searchGoogleBooks(safeTitle, safeAuthor),
    searchOpenLibrary(safeTitle, safeAuthor)
  ]);

  return pickBestCandidate([...google, ...openLibrary], safeTitle, safeAuthor);
}

function detectBookCategory({ title = "", author = "", categories = [], description = "", firstPageText = "" }) {
  const catBy = idx => CATS[idx] || "Autre";
  const corpus = foldText([title, author, categories.join(" "), description, firstPageText].join(" "));

  const direct = (categories || [])
    .map(c => foldText(c))
    .find(c => c && CATS.some(cat => c.includes(foldText(cat)) || foldText(cat).includes(c)));
  if (direct) {
    const exact = CATS.find(cat => direct.includes(foldText(cat)) || foldText(cat).includes(direct));
    if (exact) return exact;
  }

  const rules = [
    { cat: catBy(4), words: ["manga", "anime", "shonen", "shojo", "seinen", "manhwa"] },
    { cat: catBy(7), words: ["informatique", "programmation", "developpeur", "code", "python", "javascript", "algorithm", "machine learning", "data", "cyber", "computer"] },
    { cat: catBy(14), words: ["finance", "investissement", "investir", "bourse", "trading", "economie", "argent", "capital"] },
    { cat: catBy(19), words: ["psychologie", "emotion", "mental", "comportement", "cognitif", "therapie"] },
    { cat: catBy(6), words: ["developpement personnel", "motivation", "habitude", "discipline", "leadership", "mindset"] },
    { cat: catBy(11), words: ["entrepreneur", "startup", "business", "entreprise", "marketing", "vente", "strategie"] },
    { cat: catBy(5), words: ["religion", "spiritualite", "islam", "coran", "bible", "foi", "theologie"] },
    { cat: catBy(17), words: ["geopolitique", "diplomatie", "geostrategie", "relations internationales", "conflit"] },
    { cat: catBy(2), words: ["histoire", "historique", "guerre mondiale", "empire", "civilisation"] },
    { cat: catBy(3), words: ["philosophie", "ethique", "metaphysique", "stoic", "existential"] },
    { cat: catBy(1), words: ["science", "physique", "chimie", "biologie", "mathematique", "astronomie"] },
    { cat: catBy(12), words: ["etudiant", "universite", "memoire", "cours", "td", "partiel"] },
    { cat: catBy(13), words: ["lycee", "lyceen", "bac", "terminale", "premiere", "seconde"] },
    { cat: catBy(18), words: ["langue", "anglais", "francais", "grammaire", "vocabulaire", "traduction"] },
    { cat: catBy(15), words: ["sante", "bien etre", "nutrition", "sport", "medecine"] },
    { cat: catBy(16), words: ["art", "creativite", "dessin", "design", "musique", "peinture"] },
    { cat: catBy(10), words: ["biographie", "memoire", "autobiographie", "parcours", "temoignage"] },
    { cat: catBy(8), words: ["jeunesse", "enfant", "adolescent", "conte", "scolaire"] },
    { cat: catBy(9), words: ["poesie", "poeme", "vers", "sonnet"] },
    { cat: catBy(0), words: ["roman", "fiction", "nouvelle", "litterature"] },
  ];

  for (const rule of rules) {
    if (rule.words.some(word => corpus.includes(word))) return rule.cat;
  }
  return catBy(20);
}

function buildBookDescription({ title, author, cat, firstPageText, onlineDescription, onlineCategories, pageCount }) {
  const safeTitle = cleanLine(title) || "Titre a confirmer";
  const safeAuthor = cleanLine(author) || "Auteur a confirmer";
  const safeCat = cleanLine(cat) || "Autre";
  const cleanDesc = cleanLine(onlineDescription);
  const firstSentence = cleanDesc ? `${cleanDesc.split(/[.!?]+/)[0].trim()}.` : "";

  const hook = firstSentence || `Un ouvrage ${safeCat.toLowerCase()} qui capte l'attention des les premieres pages.`;
  const points = [];
  if (pageCount) points.push(`${pageCount} pages pour progresser avec une structure claire.`);
  if (Array.isArray(onlineCategories) && onlineCategories.length) {
    points.push(`Themes abordes: ${onlineCategories.slice(0, 2).map(cleanLine).filter(Boolean).join(", ")}.`);
  }

  const preview = cleanLine(firstPageText).split(" ").slice(0, 14).join(" ");
  if (preview) points.push(`Apercu de la premiere page: ${preview}${preview.endsWith(".") ? "" : "..."} `);

  const defaults = [
    "Contenu pratique avec des idees applicables rapidement.",
    "Lecture utile pour apprendre, reviser et passer a l'action.",
    "Presentation claire pour garder l'essentiel sans perdre de temps.",
  ];
  for (const fallback of defaults) {
    if (points.length >= 3) break;
    points.push(fallback);
  }

  const idea = firstSentence
    ? firstSentence.replace(/[.!?]+$/, "")
    : `${safeTitle} propose une idee directrice claire a mettre en pratique.`;

  return [
    `[${safeTitle}]`,
    `Catégorie : ${safeCat}`,
    `Par ${safeAuthor}`,
    hook,
    `- ${points[0]}`,
    `- ${points[1]}`,
    `- ${points[2]}`,
    `Idée clé : ${idea}`,
  ].join("\n");
}
async function analyzeBookPDF(b64, fileName = "") {
  try {
    const firstPageText = await extractPDFFirstPageText(b64);
    const hints = parsePdfCoverHints(firstPageText, fileName);
    const online = await searchBookMetadata(hints.title, hints.author);

    const title = cleanLine(
      online?.title ||
      hints.title ||
      String(fileName || "").replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ")
    );
    const author = cleanLine(online?.author || hints.author || "");
    const cat = detectBookCategory({
      title,
      author,
      categories: online?.categories || [],
      description: online?.description || "",
      firstPageText,
    });

    return {
      title,
      author,
      cat,
      pageCount: online?.pageCount || null,
      desc: buildBookDescription({
        title,
        author,
        cat,
        firstPageText,
        onlineDescription: online?.description || "",
        onlineCategories: online?.categories || [],
        pageCount: online?.pageCount || null,
      }),
    };
  } catch { return {}; }
}
async function aiCat(title,author) {
  try {
    const online = await searchBookMetadata(title, author);
    return detectBookCategory({
      title,
      author,
      categories: online?.categories || [],
      description: online?.description || "",
      firstPageText: "",
    });
  } catch { return "Autre"; }
}
async function sendTelegramNotif(order) {
  if (!TELEGRAM_BOT_TOKEN||TELEGRAM_BOT_TOKEN==="VOTRE_BOT_TOKEN") return;
  const msg=[`🛒 *Nouvelle commande — Librairie YO*`,``,`👤 ${order.name}`,`📞 \`${order.phone}\``,`💰 *${fmtGNF(order.total)}*`,`🔖 TX OM : \`${order.txId}\``,``,...(order.promoCode?[`🏷️ Code : ${order.promoCode} (-${fmtGNF(order.discount)})`]:[]),`📚 *Livres :*`,...(order.items||[]).map(i=>`  • ${i.title} ×${i.qty}`)].join("\n");
  try { await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({chat_id:TELEGRAM_CHAT_ID,text:msg,parse_mode:"Markdown"})}); } catch {}
}

// ─────────────────────────────────────────────────────────────
// SKELETON CARD
// ─────────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="skeleton-card">
    <div className="skeleton skeleton-cover"/>
    <div className="skeleton-body">
      <div className="skeleton skeleton-line short"/>
      <div className="skeleton skeleton-line medium"/>
      <div className="skeleton skeleton-line short"/>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────
// BOOK CARD — mémoïsée : ne se re-render que si ses props changent
// ─────────────────────────────────────────────────────────────
const BookCard = memo(function BookCard({ b, admin, wished, onAddCart, onToggleWish, onOpenDetail, onEdit, onDelete, onToggleFeatured }) {
  return (
    <div className="card" onClick={()=>onOpenDetail(b)}>
      <div className="card-cover">
        {b.coverImage
          ?<><img src={b.coverImage} alt={b.title} className="card-cover-img" loading="lazy"/><div className="card-cover-overlay"/></>
          :<><span className="emo">{b.emoji||"📚"}</span><span className="init">{b.title?.[0]}</span></>}
        {b.featured&&!isNew7d(b.createdAt)&&<span className="featured-badge">⭐ Coup de cœur</span>}
        {isNew7d(b.createdAt)&&<span className="new-badge">🆕 Nouveau</span>}
        {b.hasFile&&<span className="has-file-badge">PDF ✓</span>}
        <button className="wish-btn" onClick={e=>{e.stopPropagation();onToggleWish(b.fbKey);}}>
          {wished?"❤️":"🤍"}
        </button>
      </div>
      <div className="card-body">
        <div className="cat-tag">{CAT_ICONS[b.cat]||""} {b.cat}</div>
        <div className="title">{b.title}</div>
        <div className="author">{b.author}</div>
        {b.pageCount&&<div className="pages-info"><span>📄</span><span>{b.pageCount} pages</span></div>}
        <div className="card-foot">
          <div>
            <div className="price">{b.price}</div>
            <div className="stock-lbl">{b.hasFile?"📥 Téléchargement immédiat":"⏳ Bientôt dispo"}</div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:".3rem"}}>
            <button className="add-btn" onClick={e=>{e.stopPropagation();onAddCart(b);}}>Acheter</button>
            {admin&&(
              <div style={{display:"flex",gap:".25rem"}}>
                <button className="btn btn-ghost btn-sm" onClick={e=>{e.stopPropagation();onEdit(b);}}>✏️</button>
                <button className="btn btn-ghost btn-sm" onClick={e=>{e.stopPropagation();onToggleFeatured(b);}}>{b.featured?"⭐":"☆"}</button>
                <button className="btn btn-red btn-sm"   onClick={e=>{e.stopPropagation();onDelete(b);}}>🗑️</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

// ─────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ─────────────────────────────────────────────────────────────
export default function App() {
  // ── State livres ──
  const [books,       setBooks]       = useState(getInitialBooks);
  const [loading,     setLoading]     = useState(() => getInitialBooks().length === 0);
  const [syncing,     setSyncing]     = useState(true);
  const [adminOrders, setAdminOrders] = useState([]);
  const [promoCodes,  setPromoCodes]  = useState([]);

  // ── UI ──
  const [view,        setView]        = useState("home");
  const [cart,        setCart]        = useState([]);
  const [cartOpen,    setCartOpen]    = useState(false);
  const [search,      setSearch]      = useState("");
  const [activeCat,   setActiveCat]   = useState("");
  const [sort,        setSort]        = useState("new");
  const [visibleCount,setVisibleCount]= useState(INITIAL_VISIBLE_BOOKS);
  const [wishlist,    setWishlist]    = useState(loadWish);

  // ── Admin ──
  const [isAdmin,     setIsAdmin]     = useState(loadSession);
  const [adminTab,    setAdminTab]    = useState("stats");
  const [adminSearch, setAdminSearch] = useState("");
  const [orderSearch, setOrderSearch] = useState("");

  // ── Modals ──
  const [modal,       setModal]       = useState(null);
  const [detailBook,  setDetailBook]  = useState(null);
  const [editB,       setEditB]       = useState(null);
  const [toast,       setToast]       = useState(null);

  // ── Login ──
  const [loginPass,   setLoginPass]   = useState("");
  const [loginErr,    setLoginErr]    = useState("");

  // ── Book form ──
  const emptyF = { title:"", author:"", cat:"Roman", price:"", num:"", desc:"", stock:99, emoji:"📚" };
  const [form,           setForm]           = useState(emptyF);
  const [formErr,        setFormErr]        = useState("");
  const [formFieldErrs,  setFormFieldErrs]  = useState({});
  const [aiLoading,      setAiLoading]      = useState(false);
  const [uploadedFile,   setUploadedFile]   = useState(null);
  const [extractedCover, setExtractedCover] = useState(null);
  const [pageCount,      setPageCount]      = useState(null);

  // ── Checkout ──
  const [checkF,       setCheckF]       = useState({name:"",phone:"",txId:"",pin:""});
  const [checkErrs,    setCheckErrs]    = useState({});
  const [promoInput,   setPromoInput]   = useState("");
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [pendingOrder, setPendingOrder] = useState(null);

  // ── Mes commandes ──
  const [checkPhone,     setCheckPhone]     = useState("");
  const [checkPin,       setCheckPin]       = useState("");
  const [myOrders,       setMyOrders]       = useState(null);
  const [checkingOrders, setCheckingOrders] = useState(false);

  // ── Download ──
  const [downloadingKey, setDownloadingKey] = useState(null);

  // ── Promo form ──
  const emptyPromo = {code:"",discount:"",type:"percent",maxUses:"100"};
  const [promoForm, setPromoForm] = useState(emptyPromo);

  // ─── CHARGEMENT LIVRES ────────────────────────────────────────────────────
  useEffect(() => {
    const sync = async () => {
      const data = await api.get(CATALOG_PATH, 8000);
      if (data) {
        const fresh = mapCatalogData(data);
        if (fresh.length > 0) {
          setBooks(fresh);
          saveBooksCache(fresh);
        }
      }
      setLoading(false);
      setSyncing(false);
    };
    sync();
  }, []);

  // ─── CODES PROMO ──────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      const data = await api.get("promoCodes");
      if (data) setPromoCodes(Object.entries(data).map(([k,v]) => ({...v, fbKey: k})));
    };
    load();
  }, []);

  // ─── ADMIN COMMANDES — polling REST toutes les 5s ────────────────────────
  useEffect(() => {
    if (!isAdmin) return;
    const poll = async () => {
      const data = await api.get("orders", 10000);
      if (data) setAdminOrders(Object.entries(data).map(([k,v])=>({...v,fbKey:k})).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0)));
    };
    poll();
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, [isAdmin]);

  // ─── POLLING STATUT CLIENT — toutes les 30s ──────────────────────────────
  useEffect(() => {
    if (view !== "check" || !myOrders || !myOrders.some(o => o.status === "pending")) return;
    const poll = async () => {
      const data = await api.get("orders", 10000);
      if (!data || !checkPhone || !checkPin) return;
      const phone = checkPhone.trim().replace(/\s+/g,"");
      const found = Object.entries(data).map(([k,v])=>({...v,fbKey:k}))
        .filter(o=>o.phone.replace(/\s+/g,"")===phone && o.pin===checkPin)
        .sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
      setMyOrders(found);
    };
    const interval = setInterval(poll, 30000);
    return () => clearInterval(interval);
  }, [view, myOrders, checkPhone, checkPin]);

  // ─── Keyboard ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const h = e => { if (e.key==="Escape") { setModal(null); setCartOpen(false); } };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  useEffect(() => { window.scrollTo({top:0,behavior:"smooth"}); }, [view]);
  useEffect(() => { setVisibleCount(INITIAL_VISIBLE_BOOKS); }, [search, activeCat, sort]);

  // ─────────────────────────────────────────────────────────────
  // VALEURS MÉMOÏSÉES — recalculées seulement quand leurs
  // dépendances changent (pas à chaque frappe au clavier)
  // ─────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let res = books.filter(b => {
      const matchQ = !q || b.title?.toLowerCase().includes(q) || b.author?.toLowerCase().includes(q) || b.cat?.toLowerCase().includes(q);
      let matchCat = true;
      if (activeCat==="__wish__")  matchCat = wishlist.includes(b.fbKey);
      else if (activeCat==="__new__")  matchCat = isNew7d(b.createdAt);
      else if (activeCat==="__feat__") matchCat = !!b.featured;
      else if (activeCat) matchCat = b.cat===activeCat;
      return matchQ && matchCat;
    });
    return applySort(res, sort);
  }, [books, search, activeCat, sort, wishlist]);
  const visibleBooks = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);
  const hasMoreBooks = visibleBooks.length < filtered.length;

  const featuredBooks = useMemo(() => books.filter(b => b.featured), [books]);

  const cartTotal = useMemo(
    () => cart.reduce((s,i)=>s+i.num*i.qty, 0),
    [cart]
  );
  const discountedTotal = useMemo(() => {
    if (!appliedPromo) return cartTotal;
    if (appliedPromo.type==="percent") return Math.round(cartTotal*(1-appliedPromo.discount/100));
    return Math.max(0, cartTotal-appliedPromo.discount);
  }, [cartTotal, appliedPromo]);

  const cartCount = useMemo(() => cart.reduce((s,i)=>s+i.qty, 0), [cart]);

  const pendingCount = useMemo(
    () => adminOrders.filter(o=>o.status==="pending").length,
    [adminOrders]
  );

  const statsData = useMemo(() => {
    const approved=adminOrders.filter(o=>o.status==="approved");
    const pending=adminOrders.filter(o=>o.status==="pending");
    const rejected=adminOrders.filter(o=>o.status==="rejected");
    const totalRevenue=approved.reduce((s,o)=>s+(o.total||0),0);
    const now=new Date(); const ms=new Date(now.getFullYear(),now.getMonth(),1).getTime();
    const monthRevenue=approved.filter(o=>(o.createdAt||0)>=ms).reduce((s,o)=>s+(o.total||0),0);
    const bookCounts={};
    approved.forEach(o=>(o.items||[]).forEach(it=>{if(!bookCounts[it.title])bookCounts[it.title]={title:it.title,count:0};bookCounts[it.title].count+=it.qty;}));
    const topBooks=Object.values(bookCounts).sort((a,b)=>b.count-a.count).slice(0,5);
    return {approved:approved.length,pending:pending.length,rejected:rejected.length,totalRevenue,monthRevenue,topBooks};
  }, [adminOrders]);

  const filteredOrders = useMemo(() => {
    const q=orderSearch.toLowerCase();
    return adminOrders.filter(o=>!q||o.name?.toLowerCase().includes(q)||o.phone?.includes(q)||o.txId?.toLowerCase().includes(q));
  }, [adminOrders, orderSearch]);

  const filteredAdminBooks = useMemo(() => {
    const q=adminSearch.toLowerCase();
    return books.filter(b=>!q||b.title?.toLowerCase().includes(q)||b.author?.toLowerCase().includes(q));
  }, [books, adminSearch]);

  // ─────────────────────────────────────────────────────────────
  // CALLBACKS STABLES — useCallback évite les re-renders des
  // BookCard mémoïsées quand App se re-render
  // ─────────────────────────────────────────────────────────────
  const toast$ = useCallback((msg, type="ok") => {
    setToast({msg,type});
    setTimeout(()=>setToast(null), 3500);
  }, []);

  const toggleWish = useCallback(fbKey => {
    setWishlist(prev => {
      const n = prev.includes(fbKey) ? prev.filter(k=>k!==fbKey) : [...prev, fbKey];
      saveWish(n);
      return n;
    });
  }, []);

  const addCart = useCallback(b => {
    setCart(p=>{const ex=p.find(i=>i.fbKey===b.fbKey); return ex?p.map(i=>i.fbKey===b.fbKey?{...i,qty:i.qty+1}:i):[...p,{...b,qty:1}];});
    toast$(`"${b.title}" ajouté ✓`);
  }, [toast$]);

  const openDetail = useCallback(b => { setDetailBook(b); setModal("detail"); }, []);

  const openEdit = useCallback(b => {
    setEditB(b);
    setForm({title:b.title,author:b.author,cat:b.cat,price:b.price,num:b.num,desc:b.desc||"",stock:b.stock,emoji:b.emoji||"📚"});
    setUploadedFile(null); setExtractedCover(b.coverImage||null); setPageCount(b.pageCount||null);
    setFormErr(""); setFormFieldErrs({}); setModal("edit");
  }, []);

  const delBook = useCallback(b => { setEditB(b); setModal("del"); }, []);

  const toggleFeatured = useCallback(async b => {
    const nextFeatured = !b.featured;
    await api.patch(`books/${b.fbKey}`, { featured: nextFeatured });
    await api.patch(`${CATALOG_PATH}/${b.fbKey}`, { featured: nextFeatured });
    setBooks(prev => {
      const next = prev.map(x => x.fbKey === b.fbKey ? { ...x, featured: nextFeatured } : x);
      saveBooksCache(next);
      return next;
    });
    toast$(b.featured?"Retiré des mis en avant":"⭐ Mis en avant");
  }, [toast$]);

  const copyOM = useCallback(() => {
    navigator.clipboard.writeText(OM_NUMBER).catch(()=>{});
    toast$("Numéro copié 📋");
  }, [toast$]);

  const updQ    = (k,d) => setCart(p=>p.map(i=>i.fbKey===k?{...i,qty:Math.max(1,i.qty+d)}:i));
  const remCart = k => setCart(p=>p.filter(i=>i.fbKey!==k));

  const applyPromo = () => {
    const code = promoInput.trim().toUpperCase();
    if (!code) return;
    const promo = promoCodes.find(p => p.code?.toUpperCase() === code);
    if (!promo || !promo.active) { toast$("Code promo invalide", "er"); return; }
    if ((Number(promo.maxUses) || 0) > 0 && (Number(promo.uses) || 0) >= Number(promo.maxUses)) {
      toast$("Code promo épuisé", "er");
      return;
    }
    setAppliedPromo({
      fbKey: promo.fbKey,
      code: promo.code,
      type: promo.type === "fixed" ? "fixed" : "percent",
      discount: Number(promo.discount) || 0,
    });
    toast$(`Code ${promo.code} appliqué ✓`);
  };

  const doCheckout = async () => {
    if (cart.length === 0) { toast$("Panier vide", "er"); return; }
    if (!canOrder()) { toast$("Trop de tentatives. Réessayez dans 10 minutes.", "er"); return; }

    const errs = {};
    const cleanName = sanitize(checkF.name);
    const cleanPhone = checkF.phone.trim().replace(/\s+/g, "");
    const cleanTxId = sanitize(checkF.txId);
    const cleanPin = checkF.pin.replace(/\D/g, "");
    if (!cleanName) errs.name = "Nom requis";
    if (!validPhone(cleanPhone)) errs.phone = "Téléphone invalide";
    if (!validTx(cleanTxId)) errs.txId = "N° de confirmation invalide";
    if (!/^\d{4}$/.test(cleanPin)) errs.pin = "PIN à 4 chiffres";
    if (Object.keys(errs).length) { setCheckErrs(errs); toast$(Object.values(errs)[0], "er"); return; }

    const order = {
      name: cleanName,
      phone: cleanPhone,
      txId: cleanTxId,
      pin: cleanPin,
      status: "pending",
      createdAt: Date.now(),
      items: cart.map(i => ({
        fbKey: i.fbKey,
        title: i.title,
        qty: i.qty,
        price: i.num * i.qty,
        emoji: i.emoji || "📚",
      })),
      originalTotal: cartTotal,
      total: discountedTotal,
      promoCode: appliedPromo?.code || "",
      discount: Math.max(0, cartTotal - discountedTotal),
    };

    try {
      const res = await api.post("orders", order);
      const fbKey = res?.name || `order-${Date.now()}`;
      const orderWithKey = { ...order, fbKey };

      if (appliedPromo?.fbKey) {
        const current = promoCodes.find(p => p.fbKey === appliedPromo.fbKey);
        if (current) {
          const nextUses = (Number(current.uses) || 0) + 1;
          await api.patch(`promoCodes/${appliedPromo.fbKey}`, { uses: nextUses });
          setPromoCodes(prev => prev.map(p => p.fbKey === appliedPromo.fbKey ? { ...p, uses: nextUses } : p));
        }
      }

      await sendTelegramNotif(orderWithKey);

      setPendingOrder(orderWithKey);
      setModal(null);
      setCart([]);
      setCartOpen(false);
      setAppliedPromo(null);
      setPromoInput("");
      setCheckErrs({});
      setCheckF({ name: "", phone: "", txId: "", pin: "" });
      setView("pending");
      toast$("Commande envoyée ✓");
    } catch (err) {
      toast$("Erreur commande : " + (err?.message || "inconnue"), "er");
    }
  };

  // ─── Admin login ──────────────────────────────────────────────────────────
  const doLogin = () => {
    if (loginPass===ADMIN_PASSWORD) {
      setIsAdmin(true); saveSession(); setModal(null); setLoginPass(""); setLoginErr("");
      setAdminTab("stats"); setView("admin"); toast$("Bienvenue, mon Roi 👑");
    } else { setLoginErr("Mot de passe incorrect."); }
  };
  const doLogout = () => { setIsAdmin(false); clearSession(); setView("home"); toast$("Déconnecté","er"); };

  // ─── Formulaire livre ─────────────────────────────────────────────────────
  const openAdd = () => { setForm(emptyF); setUploadedFile(null); setExtractedCover(null); setPageCount(null); setFormErr(""); setFormFieldErrs({}); setModal("add"); };

  const chForm = e => {
    const {name:n,value:v}=e.target;
    setForm(p=>{const x={...p,[n]:v}; if(n==="num") x.price=v?`${Number(v).toLocaleString("fr-FR")} GNF`:""; return x;});
    setFormFieldErrs(p=>({...p,[n]:""}));
  };
  const handleBlur = async () => {
    if (modal!=="add"||!form.title.trim()||!form.author.trim()||aiLoading||uploadedFile) return;
    setAiLoading(true);
    try { const cat=await aiCat(form.title,form.author); setForm(p=>({...p,cat})); } catch {}
    setAiLoading(false);
  };
  const handleFileChange = async e => {
    const file=e.target.files?.[0]; if (!file) return;
    if (file.size>9*1024*1024) { toast$("Fichier trop volumineux (max 9 Mo)","er"); return; }
    const b64=await readFileAsBase64(file);
    setUploadedFile({name:file.name,size:(file.size/1024).toFixed(0)+" Ko",b64,type:file.type});
    if (file.type==="application/pdf") {
      setAiLoading(true); toast$("Analyse PDF + internet en cours...");
      const [cover,pages,analysis]=await Promise.all([extractPDFCover(b64),extractPDFPageCount(b64),analyzeBookPDF(b64,file.name)]);
      const finalPages = pages || analysis?.pageCount || null;
      if (cover) setExtractedCover(cover);
      if (finalPages) setPageCount(finalPages);
      if (analysis.title||analysis.author||analysis.desc||analysis.cat) {
        setForm(p=>({...p,title:analysis.title||p.title,author:analysis.author||p.author,cat:CATS.includes(analysis.cat)?analysis.cat:(p.cat||"Autre"),desc:analysis.desc||p.desc}));
      }
      setAiLoading(false); toast$(`Analyse terminee${finalPages ? ` - ${finalPages} pages` : ""}`);
    }
  };
// ─── Sauvegarde livre ─────────────────────────────────────────────────────
const saveBook = async () => {
  const errs = {};
  if (!form.title.trim()) errs.title = "Titre requis";
  if (!form.author.trim()) errs.author = "Auteur requis";
  if (!form.num || isNaN(form.num)) errs.num = "Prix requis";
  if (Object.keys(errs).length) { setFormFieldErrs(errs); return; }

  // Calcul sécurisé du prix
  const computedPrice = form.price 
    ? sanitize(form.price) 
    : Number(form.num || 0).toLocaleString("fr-FR") + " GNF";

  // Préparation de bookData
  const bookData = {
    title: sanitize(form.title),
    author: sanitize(form.author),
    cat: form.cat || "Autre",
    emoji: form.emoji || "📚",
    price: computedPrice,
    num: Number(form.num) || 0,
    desc: sanitize(form.desc || ""),
    stock: Number(form.stock) || 99,
    hasFile: uploadedFile ? true : (editB?.hasFile || false),
    coverImage: extractedCover || editB?.coverImage || null,
    pageCount: pageCount || editB?.pageCount || null,
    featured: editB?.featured || false,
    createdAt: modal === "add" ? Date.now() : (editB?.createdAt || Date.now())
  };

  try {
    let bookKey;
    if (modal === "add") {
      const res = await api.post("books", bookData);
      bookKey = res.name;
      toast$(`"${form.title}" publié ✓`);
    } else {
      await api.patch(`books/${editB.fbKey}`, bookData);
      bookKey = editB.fbKey;
      toast$(`"${form.title}" mis à jour ✓`);
    }

    if (uploadedFile) {
      await api.put(`book-files/${bookKey}`, {
        fileData: uploadedFile.b64,
        fileName: uploadedFile.name,
        fileType: uploadedFile.type
      });
    }

    await api.put(`${CATALOG_PATH}/${bookKey}`, normalizeBook({ ...bookData, fbKey: bookKey }, bookKey));

    const data = await api.get(CATALOG_PATH);
    if (data) {
      const fresh = mapCatalogData(data);
      setBooks(fresh);
      saveBooksCache(fresh);
    }

    setModal(null);
  } catch (err) {
    toast$("Erreur : " + err.message, "er");
  }
};
const confirmDel = async () => {
  try {
    await api.del(`books/${editB.fbKey}`);
    try { await api.del(`${CATALOG_PATH}/${editB.fbKey}`); } catch {}
    try { await api.del(`book-files/${editB.fbKey}`); } catch {}
    const next = books.filter(b => b.fbKey !== editB.fbKey);
    setBooks(next);
    saveBooksCache(next);
    toast$("Livre supprimé", "er");
    setModal(null);
  } catch(err) {
    console.error(err);
    toast$("Erreur suppression : " + err.message, "er");
  }
};

  // ─── Mes commandes ────────────────────────────────────────────────────────
  const checkMyOrders = async () => {
    const errs={};
    if (!checkPhone.trim())       errs.phone="Téléphone requis";
    if (!/^\d{4}$/.test(checkPin)) errs.pin="PIN à 4 chiffres";
    if (Object.keys(errs).length) { toast$(Object.values(errs)[0],"er"); return; }
    setCheckingOrders(true);
    try {
      const data=await api.get("orders");
      if (!data) { setMyOrders([]); setCheckingOrders(false); return; }
      const phone=checkPhone.trim().replace(/\s+/g,"");
      const found=Object.entries(data).map(([k,v])=>({...v,fbKey:k}))
        .filter(o=>o.phone.replace(/\s+/g,"")===phone&&o.pin===checkPin)
        .sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
      setMyOrders(found);
      if (found.length===0) toast$("Aucune commande avec ces identifiants","er");
    } catch(err) { toast$("Erreur : "+err.message,"er"); }
    setCheckingOrders(false);
  };

  // ─── Admin actions ────────────────────────────────────────────────────────
  const setOrderStatus = async (fbKey, status) => {
    await api.patch(`orders/${fbKey}`,{status,reviewedAt:Date.now()});
    setAdminOrders(prev=>prev.map(o=>o.fbKey===fbKey?{...o,status,reviewedAt:Date.now()}:o));
    toast$(status==="approved"?"✅ Commande approuvée":"❌ Commande rejetée",status==="approved"?"ok":"er");
  };
  const addPromoCode = async () => {
    if (!promoForm.code.trim()||!promoForm.discount) { toast$("Code et réduction requis","er"); return; }
    if (promoCodes.find(p=>p.code.toUpperCase()===promoForm.code.trim().toUpperCase())) { toast$("Ce code existe déjà","er"); return; }
    await api.post("promoCodes",{code:promoForm.code.trim().toUpperCase(),discount:Number(promoForm.discount),type:promoForm.type,maxUses:Number(promoForm.maxUses)||100,uses:0,active:true,createdAt:Date.now()});
    const data=await api.get("promoCodes");
    if (data) setPromoCodes(Object.entries(data).map(([k,v])=>({...v,fbKey:k})));
    setPromoForm(emptyPromo); toast$("Code promo créé ✓");
  };
  const togglePromo = async p => {
    await api.patch(`promoCodes/${p.fbKey}`,{active:!p.active});
    setPromoCodes(prev=>prev.map(x=>x.fbKey===p.fbKey?{...x,active:!x.active}:x));
    toast$(p.active?"Code désactivé":"Code activé ✓");
  };
  const deletePromo = async p => {
    await api.del(`promoCodes/${p.fbKey}`);
    setPromoCodes(prev=>prev.filter(x=>x.fbKey!==p.fbKey));
    toast$("Code supprimé","er");
  };

  // ─── Téléchargement ───────────────────────────────────────────────────────
  const downloadBook = async book => {
    setDownloadingKey(book.fbKey);
    try {
      let snap=await api.get(`book-files/${book.fbKey}`);
      if (!snap) snap=await api.get(`books/${book.fbKey}`);
      if (snap?.fileData) {
        const a=document.createElement("a"); a.href=snap.fileData; a.download=snap.fileName||book.title; a.click();
        toast$("Téléchargement lancé ✓");
      } else { toast$("Fichier non disponible pour le moment","er"); }
    } catch { toast$("Erreur lors du téléchargement","er"); }
    setDownloadingKey(null);
  };
  const readOnline = async book => {
    setDownloadingKey(book.fbKey);
    try {
      let snap=await api.get(`book-files/${book.fbKey}`);
      if (!snap) snap=await api.get(`books/${book.fbKey}`);
      if (snap?.fileData) {
        const w=window.open(); if(w){w.document.write(`<iframe src="${snap.fileData}" style="width:100%;height:100%;border:none"></iframe>`);w.document.close();}
      } else { toast$("Fichier non disponible pour le moment","er"); }
    } catch { toast$("Erreur lors du chargement","er"); }
    setDownloadingKey(null);
  };

  const copyOrderSummary = order => {
    const txt=[`📦 Commande Librairie YO`,``,`👤 ${order.name}`,`📞 ${order.phone}`,`💰 ${fmtGNF(order.total)}`,`🔖 TX: ${order.txId}`,`📌 PIN: ${order.pin}`,``,...(order.items||[]).map(i=>`• ${i.title} ×${i.qty}`)].join("\n");
    navigator.clipboard.writeText(txt).catch(()=>{}); toast$("Résumé copié 📋");
  };

  // ─── BookCard avec callbacks stables (pour React.memo) ────────────────────
  const renderBookCard = useCallback((b, admin=false) => (
    <BookCard
      key={b.fbKey}
      b={b}
      admin={admin}
      wished={wishlist.includes(b.fbKey)}
      onAddCart={addCart}
      onToggleWish={toggleWish}
      onOpenDetail={openDetail}
      onEdit={openEdit}
      onDelete={delBook}
      onToggleFeatured={toggleFeatured}
    />
  ), [wishlist, addCart, toggleWish, openDetail, openEdit, delBook, toggleFeatured]);

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────
  return (
    <>
      {/* NAV */}
      <nav className="nav">
        <div className="logo" onClick={()=>setView("home")}>Lib<em>rairie</em> YO</div>
        <div className="nav-right">
          <button className="btn btn-ghost btn-sm" onClick={()=>{setMyOrders(null);setCheckPhone("");setCheckPin("");setView("check");}}>📦 Commandes</button>
          {wishlist.length>0&&<button className="btn btn-ghost btn-sm" onClick={()=>{setActiveCat("__wish__");setSearch("");setView("home");}}>❤️ {wishlist.length}</button>}
          {isAdmin?(
            <>
              <button className="btn btn-gold btn-sm" onClick={()=>{setView("admin");setAdminTab("stats");}}>⚙️ Admin{pendingCount>0?` (${pendingCount})`:""}</button>
              <button className="btn btn-ghost btn-sm" onClick={openAdd}>+ Livre</button>
              <button className="btn btn-ghost btn-sm" onClick={doLogout}>Quitter</button>
            </>
          ):(
            <button className="btn btn-ghost btn-sm" onClick={()=>setModal("login")}>🔐</button>
          )}
          <button className="cart-btn" onClick={()=>setCartOpen(true)}>🛒{cartCount>0&&<span className="badge">{cartCount}</span>}</button>
        </div>
      </nav>

      {isAdmin&&(
        <div className="admin-bar">
          <span>👑 Admin · REST polling actif{pendingCount>0&&<strong style={{color:"#f08080",marginLeft:".5rem"}}>⚠️ {pendingCount} en attente</strong>}</span>
          <span style={{fontSize:".7rem",color:"var(--muted)"}}>Session expire dans 2h · mise à jour auto toutes les 5s</span>
        </div>
      )}

      {/* ══ HOME ══ */}
      {view==="home"&&<>
        <section className="hero">
          <p className="hero-tag">Librairie numérique · Conakry, Guinée</p>
          <h1>Achetez. Téléchargez.<br/><i>Lisez maintenant.</i></h1>
          <p>Paiement Orange Money — accès activé après confirmation.</p>
          <div className="search-box">
            <span className="si">🔍</span>
            <input placeholder="Titre, auteur, genre…" value={search} onChange={e=>{setSearch(e.target.value);setActiveCat("");}}/>
          </div>
          <div className="cat-pills">
            {CAT_PILLS.map(p=>(
              <button key={p.val} className={`pill ${activeCat===p.val?"active":""}`} onClick={()=>{setActiveCat(p.val);setSearch("");}}>
                {p.label}
              </button>
            ))}
          </div>
        </section>

        {featuredBooks.length>0&&!search&&!activeCat&&(
          <div className="featured-section">
            <div className="featured-title">⭐ Coups de cœur</div>
            <div className="featured-scroll">
              {featuredBooks.map(b=><div key={b.fbKey} className="featured-card">{renderBookCard(b,false)}</div>)}
            </div>
          </div>
        )}

        <div className="page">
          <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",flexWrap:"wrap",gap:".5rem",marginBottom:".6rem"}}>
            <div>
              <div className="grid-title">
                Catalogue
                {syncing&&<span className="sync-dot" title="Synchronisation…"/>}
              </div>
              <div className="grid-sub">{visibleBooks.length} / {filtered.length} livre{filtered.length!==1?"s":""} affiché{visibleBooks.length!==1?"s":""}</div>
            </div>
          </div>
          <div className="sort-bar">
            <span className="sort-lbl">Tri :</span>
            {SORT_OPTS.map(s=><button key={s.val} className={`sort-btn ${sort===s.val?"active":""}`} onClick={()=>setSort(s.val)}>{s.label}</button>)}
          </div>
          {loading?(
            <div className="grid">{Array.from({length:8}).map((_,i)=><SkeletonCard key={i}/>)}</div>
          ):filtered.length===0?(
            <div className="empty">
              <div style={{fontSize:"2.8rem",marginBottom:".8rem"}}>{activeCat==="__wish__"?"❤️":"📭"}</div>
              <p>{activeCat==="__wish__"?"Aucun favori pour l'instant":search||activeCat?"Aucun résultat":"Aucun livre pour l'instant"}</p>
            </div>
          ):(
            <>
              <div className="grid">{visibleBooks.map(b=>renderBookCard(b, isAdmin))}</div>
              {hasMoreBooks&&(
                <div style={{display:"flex",justifyContent:"center",marginTop:"1.1rem"}}>
                  <button className="btn btn-ghost" onClick={()=>setVisibleCount(c=>c+VISIBLE_BOOKS_STEP)}>
                    Charger plus
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </>}

      {/* ══ ADMIN — chargé uniquement si admin connecté ══ */}
      {view==="admin"&&isAdmin&&(
        <Suspense fallback={
          <div style={{textAlign:"center",padding:"4rem",color:"var(--muted)"}}>
            <span className="spin">⚙️</span> Chargement…
          </div>
        }>
          <AdminPanel
            books={books}
            adminOrders={adminOrders}
            promoCodes={promoCodes}
            adminTab={adminTab}
            setAdminTab={setAdminTab}
            adminSearch={adminSearch}
            setAdminSearch={setAdminSearch}
            orderSearch={orderSearch}
            setOrderSearch={setOrderSearch}
            pendingCount={pendingCount}
            statsData={statsData}
            filteredAdminBooks={filteredAdminBooks}
            filteredOrders={filteredOrders}
            onAddBook={openAdd}
            onSetOrderStatus={setOrderStatus}
            onAddPromo={addPromoCode}
            onTogglePromo={togglePromo}
            onDeletePromo={deletePromo}
            promoForm={promoForm}
            setPromoForm={setPromoForm}
            onClose={()=>setView("home")}
            BookCard={({b, admin})=>renderBookCard(b, admin)}
          />
        </Suspense>
      )}

      {/* ══ PENDING ══ */}
      {view==="pending"&&pendingOrder&&(
        <div className="pending-page">
          <div className="big-icon">⏳</div>
          <h2>Commande enregistrée !</h2>
          <p>Elle sera activée après vérification de votre paiement Orange Money.<br/>Durée habituelle : <strong style={{color:"var(--cream)"}}>quelques heures</strong>.</p>
          <div className="info-box">
            <div>👤 <strong>{pendingOrder.name}</strong></div>
            <div>📞 <strong>{pendingOrder.phone}</strong></div>
            <div>💰 <strong>{fmtGNF(pendingOrder.total)}</strong>{pendingOrder.discount>0&&<span style={{color:"var(--green)",fontSize:".8rem",marginLeft:".5rem"}}>(-{fmtGNF(pendingOrder.discount)})</span>}</div>
            <div>🔖 TX OM : <strong style={{fontFamily:"monospace"}}>{pendingOrder.txId}</strong></div>
          </div>
          <p style={{fontSize:".82rem",marginBottom:".5rem"}}>Gardez votre <strong style={{color:"var(--cream)"}}>PIN</strong> pour accéder à vos livres :</p>
          <div className="pin-highlight">📌 PIN : {pendingOrder.pin}</div>
          <div style={{display:"flex",gap:".5rem",marginBottom:"1rem"}}>
            <button className="btn btn-gold" style={{flex:1}} onClick={()=>{setCheckPhone(pendingOrder.phone);setCheckPin(pendingOrder.pin);setView("check");}}>📦 Voir ma commande</button>
            <button className="copy-sum" onClick={()=>copyOrderSummary(pendingOrder)}>📋 Copier</button>
          </div>
          <button className="btn btn-ghost" style={{width:"100%"}} onClick={()=>setView("home")}>← Retour au catalogue</button>
        </div>
      )}

      {/* ══ MES COMMANDES ══ */}
      {view==="check"&&(
        <div className="check-page">
          <div style={{textAlign:"center",marginBottom:"1.5rem"}}>
            <div style={{fontSize:"2.8rem",marginBottom:".7rem"}}>📦</div>
            <h2>Mes commandes</h2>
            <p style={{color:"var(--muted)",fontSize:".86rem",marginTop:".4rem"}}>Téléphone + PIN pour accéder à vos achats.</p>
          </div>
          <div className="fg"><label className="fl">Numéro de téléphone</label><input className="fi" value={checkPhone} onChange={e=>setCheckPhone(e.target.value)} placeholder="+224 6XX XXX XXX"/></div>
          <div className="fg">
            <label className="fl">PIN (4 chiffres)</label>
            <input className="fi pin-input" type="password" maxLength={4} value={checkPin} onChange={e=>setCheckPin(e.target.value.replace(/\D/g,""))} placeholder="••••" onKeyDown={e=>e.key==="Enter"&&checkMyOrders()}/>
          </div>
          <button className="btn btn-gold" style={{width:"100%",marginBottom:"1.2rem"}} onClick={checkMyOrders} disabled={checkingOrders}>
            {checkingOrders?<><span className="spin">⚙️</span> Recherche…</>:"🔍 Afficher mes commandes"}
          </button>
          {myOrders?.some(o=>o.status==="pending")&&(
            <div style={{background:"rgba(201,150,58,.06)",border:"1px solid rgba(201,150,58,.2)",borderRadius:7,padding:".5rem .9rem",fontSize:".74rem",color:"var(--muted)",marginBottom:"1rem",display:"flex",alignItems:"center",gap:".5rem"}}>
              <span className="live-dot" style={{width:6,height:6,borderRadius:"50%",background:"var(--gold)",animation:"pulse-dot 1s ease-in-out infinite",display:"inline-block"}}/>
              Mise à jour automatique toutes les 30 secondes
            </div>
          )}
          {myOrders!==null&&myOrders.length===0&&<div style={{textAlign:"center",color:"var(--muted)",padding:"2rem 0"}}>Aucune commande trouvée avec ces identifiants.</div>}
          {(myOrders||[]).map(order=>(
            <div key={order.fbKey} className="dl-card">
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:".6rem"}}>
                <div style={{fontSize:".76rem",color:"var(--muted)"}}>{fmtDate(order.createdAt)}</div>
                <span className={`status-badge status-${order.status}`}>{order.status==="pending"?"⏳ En attente":order.status==="approved"?"✅ Approuvée":"❌ Rejetée"}</span>
              </div>
              <div style={{fontSize:".8rem",color:"var(--muted)",marginBottom:".7rem",lineHeight:1.5}}>
                {(order.items||[]).map((it,i)=><div key={i}>{it.emoji||"📚"} <strong style={{color:"var(--text)"}}>{it.title}</strong></div>)}
              </div>
              <div style={{fontWeight:700,color:"var(--gold)",marginBottom:".7rem"}}>
                {fmtGNF(order.total)}
                {order.promoCode&&<span style={{fontSize:".72rem",color:"var(--green)",marginLeft:".5rem"}}>🏷️ -{fmtGNF(order.discount||0)}</span>}
              </div>
              {order.status==="approved"&&(
                <div>
                  <div style={{fontSize:".74rem",color:"var(--green)",marginBottom:".6rem"}}>✅ Paiement confirmé — accès activé</div>
                  {(order.items||[]).map((it,i)=>{
                    const book=books.find(b=>b.fbKey===it.fbKey) || { fbKey: it.fbKey, title: it.title, emoji: it.emoji || "📚", hasFile: true };
                    const isDling=downloadingKey===it.fbKey;
                    return (
                      <div key={i} style={{marginBottom:".5rem"}}>
                        <div style={{fontSize:".79rem",color:"var(--text)",marginBottom:".3rem"}}>{it.emoji||"📚"} {it.title}</div>
                        {book?.hasFile
                          ?isDling?<div className="dl-spinner"><span className="spin">⚙️</span> Chargement…</div>
                            :<div className="dl-formats">
                              <button className="btn btn-green btn-sm" onClick={()=>downloadBook(book)}>⬇️ Télécharger</button>
                              <button className="btn btn-outline btn-sm" onClick={()=>readOnline(book)}>👁️ Lire en ligne</button>
                            </div>
                          :<p style={{color:"var(--muted)",fontSize:".74rem"}}>⏳ Fichier pas encore disponible.</p>}
                      </div>
                    );
                  })}
                </div>
              )}
              {order.status==="rejected"&&<div style={{fontSize:".77rem",color:"#f08080"}}>❌ Commande rejetée.{" "}<a href={`https://wa.me/${WA_NUMBER}`} style={{color:"var(--gold)"}} target="_blank" rel="noreferrer">Contacter le support →</a></div>}
              {order.status==="pending"&&<div style={{fontSize:".77rem",color:"var(--orange)",lineHeight:1.5}}>⏳ Paiement en cours de vérification — revenez dans quelques heures.<br/><span style={{fontSize:".7rem",color:"var(--muted)"}}>TX : {order.txId}</span></div>}
            </div>
          ))}
          <button className="btn btn-ghost" style={{width:"100%",marginTop:".8rem"}} onClick={()=>setView("home")}>← Retour au catalogue</button>
        </div>
      )}

      {/* ══ PANIER ══ */}
      {cartOpen&&<div className="co" onClick={()=>setCartOpen(false)}/>}
      <div className={`cart-side ${cartOpen?"open":""}`}>
        <div className="ch"><span className="ct">Panier 🛒</span><button className="mc" onClick={()=>setCartOpen(false)}>✕</button></div>
        <div className="ci-list">
          {cart.length===0?<div style={{color:"var(--muted)",textAlign:"center",marginTop:"3rem"}}><div style={{fontSize:"2rem",marginBottom:".5rem"}}>🛒</div>Panier vide</div>
            :cart.map(item=>(
              <div key={item.fbKey} className="ci">
                <div style={{fontSize:"1.6rem"}}>{item.emoji||"📚"}</div>
                <div className="ci-info">
                  <div className="ci-title">{item.title}</div>
                  <div className="ci-price">{fmtGNF(item.num*item.qty)}</div>
                  <div className="qty">
                    <button className="qb" onClick={()=>updQ(item.fbKey,-1)}>−</button>
                    <span style={{fontSize:".85rem",minWidth:"18px",textAlign:"center"}}>{item.qty}</span>
                    <button className="qb" onClick={()=>updQ(item.fbKey,+1)}>+</button>
                  </div>
                </div>
                <button className="rb" onClick={()=>remCart(item.fbKey)}>✕</button>
              </div>
            ))}
        </div>
        {cart.length>0&&<div className="cf"><div className="ctotal"><span>Total</span><span>{fmtGNF(cartTotal)}</span></div><button className="btn btn-gold" style={{width:"100%"}} onClick={()=>{setCartOpen(false);setModal("checkout");}}>Commander →</button></div>}
      </div>

      {/* ══ MODALS ══ */}
      {modal&&(
        <div className="overlay" onClick={e=>{if(e.target===e.currentTarget)setModal(null);}}>
          {modal==="login"&&(
            <div className="modal" style={{maxWidth:340}}>
              <button className="mc" onClick={()=>setModal(null)}>✕</button>
              <h2>🔐 Admin</h2>
              <div className="fg">
                <label className="fl">Mot de passe</label>
                <input className="fi" type="password" value={loginPass} onChange={e=>{setLoginPass(e.target.value);setLoginErr("");}} onKeyDown={e=>e.key==="Enter"&&doLogin()} placeholder="••••••••" autoFocus/>
                {loginErr&&<div className="err">{loginErr}</div>}
              </div>
              <div className="fa"><button className="btn btn-ghost" onClick={()=>setModal(null)}>Annuler</button><button className="btn btn-gold" onClick={doLogin}>Connexion</button></div>
            </div>
          )}

          {modal==="detail"&&detailBook&&(
            <div className="modal" style={{maxWidth:560}}>
              <button className="mc" onClick={()=>setModal(null)}>✕</button>
              <div style={{display:"flex",gap:"1.2rem",marginBottom:"1rem",flexWrap:"wrap"}}>
                <div className="detail-cover">
                  {detailBook.coverImage?<img src={detailBook.coverImage} alt={detailBook.title}/>:<span style={{fontSize:"2.5rem"}}>{detailBook.emoji||"📚"}</span>}
                </div>
                <div style={{flex:1,minWidth:180}}>
                  <div className="cat-tag">{CAT_ICONS[detailBook.cat]||""} {detailBook.cat}</div>
                  {isNew7d(detailBook.createdAt)&&<span style={{background:"var(--om)",color:"#fff",fontSize:".62rem",fontWeight:700,padding:".12rem .4rem",borderRadius:4,marginBottom:".5rem",display:"inline-block"}}>🆕 NOUVEAU</span>}
                  <div className="detail-title">{detailBook.title}</div>
                  <div className="detail-author">{detailBook.author}</div>
                  {detailBook.pageCount&&<div className="detail-pages"><span>📄</span><span>{detailBook.pageCount} pages</span></div>}
                  <div className="detail-price">{detailBook.price}</div>
                  <div style={{display:"flex",gap:".5rem",flexWrap:"wrap"}}>
                    <button className="btn btn-gold" onClick={()=>{addCart(detailBook);setModal(null);}}>🛒 Acheter</button>
                    <button className="btn btn-ghost" onClick={()=>toggleWish(detailBook.fbKey)}>{wishlist.includes(detailBook.fbKey)?"❤️ Favori":"🤍 Favoris"}</button>
                  </div>
                </div>
              </div>
              {detailBook.desc&&<div className="detail-desc"><div style={{color:"var(--gold)",fontSize:".7rem",textTransform:"uppercase",letterSpacing:".1em",marginBottom:".5rem"}}>Description</div>{detailBook.desc}</div>}
              <div style={{marginTop:".9rem",fontSize:".75rem",color:"var(--muted)"}}>{detailBook.hasFile?<span style={{color:"var(--green)"}}>✅ PDF disponible — téléchargement immédiat après confirmation</span>:<span>⏳ Fichier en cours d'ajout</span>}</div>
            </div>
          )}

          {(modal==="add"||modal==="edit")&&(
            <div className="modal">
              <button className="mc" onClick={()=>setModal(null)}>✕</button>
              <h2>{modal==="add"?"📚 Ajouter un livre":"✏️ Modifier"}</h2>
              <div className="fg">
                <label className="fl">📁 Fichier PDF / EPUB (max 9 Mo) — <span style={{color:"var(--gold)"}}>l'IA remplit tout automatiquement</span></label>
                {!uploadedFile?(
                  <div className="upload-zone"><input type="file" accept=".pdf,.epub,.txt" onChange={handleFileChange}/><div className="uico">📂</div><p>Glissez ou cliquez<br/><strong>PDF · EPUB · TXT</strong></p></div>
                ):(
                  <div className="file-ready">
                    <span>✅</span><span className="fname">{uploadedFile.name}</span><span className="fsize">{uploadedFile.size}</span>
                    {pageCount&&<span style={{color:"var(--gold)",fontSize:".72rem",fontWeight:600}}>📄 {pageCount} p.</span>}
                    <button className="file-remove" onClick={()=>{setUploadedFile(null);setExtractedCover(null);setPageCount(null);}}>✕</button>
                  </div>
                )}
                {modal==="edit"&&editB?.hasFile&&!uploadedFile&&<p style={{fontSize:".7rem",color:"var(--green)",marginTop:".3rem"}}>✅ Fichier déjà associé{editB?.pageCount?` — ${editB.pageCount} pages`:""}</p>}
              </div>
              {aiLoading&&<div className="ai-row"><span className="spin">⚙️</span> IA : extraction couverture + pages + analyse…</div>}
              {extractedCover&&!aiLoading&&<div className="ai-analysis-box"><div style={{fontSize:".74rem",color:"var(--gold)",marginBottom:".4rem"}}>📸 Couverture extraite</div><img src={extractedCover} alt="Couverture" className="cover-preview"/></div>}
              <div className="fg"><label className="fl">Titre *</label><input className={`fi ${formFieldErrs.title?"err-field":""}`} name="title" value={form.title} onChange={chForm} onBlur={handleBlur} placeholder="Titre du livre"/>{formFieldErrs.title&&<div className="field-err">{formFieldErrs.title}</div>}</div>
              <div className="fg"><label className="fl">Auteur *</label><input className={`fi ${formFieldErrs.author?"err-field":""}`} name="author" value={form.author} onChange={chForm} onBlur={handleBlur} placeholder="Nom de l'auteur"/>{formFieldErrs.author&&<div className="field-err">{formFieldErrs.author}</div>}</div>
              <div className="fr">
                <div className="fg"><label className="fl">Catégorie</label><select className="fs" name="cat" value={form.cat} onChange={chForm}>{CATS.map(c=><option key={c}>{c}</option>)}</select></div>
                <div className="fg"><label className="fl">Emoji</label><select className="fs" name="emoji" value={form.emoji} onChange={chForm}>{EMOJIS.map(e=><option key={e} value={e}>{e}</option>)}</select></div>
              </div>
              <div className="fr">
                <div className="fg"><label className="fl">Prix (GNF) *</label><input className={`fi ${formFieldErrs.num?"err-field":""}`} name="num" type="number" value={form.num} onChange={chForm} placeholder="ex: 35000"/>{formFieldErrs.num&&<div className="field-err">{formFieldErrs.num}</div>}</div>
                <div className="fg"><label className="fl">Stock</label><input className="fi" name="stock" type="number" min="0" value={form.stock} onChange={chForm}/></div>
              </div>
              <div className="fg"><label className="fl">Description</label><textarea className="ft" name="desc" value={form.desc} onChange={chForm} placeholder="Résumé…"/></div>
              {formErr&&<div className="err">{formErr}</div>}
              <div className="fa"><button className="btn btn-ghost" onClick={()=>setModal(null)}>Annuler</button><button className="btn btn-gold" onClick={saveBook} disabled={aiLoading}>{aiLoading?"⏳ IA…":modal==="add"?"Publier":"Enregistrer"}</button></div>
            </div>
          )}

          {modal==="del"&&(
            <div className="modal" style={{maxWidth:360}}>
              <h2>🗑️ Supprimer ?</h2>
              <p style={{color:"var(--muted)",marginBottom:"1.4rem"}}>Supprimer <strong style={{color:"var(--cream)"}}>&ldquo;{editB?.title}&rdquo;</strong> ? Cette action est irréversible.</p>
              <div className="fa"><button className="btn btn-ghost" onClick={()=>setModal(null)}>Annuler</button><button className="btn btn-red" onClick={confirmDel}>Supprimer</button></div>
            </div>
          )}

          {modal==="checkout"&&(
            <div className="modal">
              <button className="mc" onClick={()=>setModal(null)}>✕</button>
              <h2>🛒 Commander</h2>
              <div style={{background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:8,padding:".7rem .9rem",marginBottom:"1rem"}}>
                {cart.map(i=>(
                  <div key={i.fbKey} style={{display:"flex",justifyContent:"space-between",fontSize:".8rem",marginBottom:".25rem"}}>
                    <span style={{color:"var(--text)"}}>{i.title} × {i.qty}</span>
                    <span style={{color:"var(--gold)"}}>{fmtGNF(i.num*i.qty)}</span>
                  </div>
                ))}
                <div style={{borderTop:"1px solid var(--bd)",paddingTop:".4rem",marginTop:".4rem",display:"flex",justifyContent:"space-between",fontWeight:700}}>
                  <span>Sous-total</span><span style={{color:"var(--gold)"}}>{fmtGNF(cartTotal)}</span>
                </div>
                {appliedPromo&&<><div style={{display:"flex",justifyContent:"space-between",fontSize:".82rem",color:"var(--green)",paddingTop:".3rem"}}><span>🏷️ Code {appliedPromo.code}</span><span>-{appliedPromo.type==="percent"?appliedPromo.discount+"%":fmtGNF(appliedPromo.discount)}</span></div>
                <div style={{display:"flex",justifyContent:"space-between",fontWeight:700,paddingTop:".3rem",borderTop:"1px solid var(--bd)",marginTop:".3rem"}}><span>Total final</span><span style={{color:"var(--gold)"}}>{fmtGNF(discountedTotal)}</span></div></>}
              </div>
              {!appliedPromo?(
                <div className="fg"><label className="fl">Code promo (optionnel)</label><div className="promo-row"><input className="fi" style={{flex:1}} value={promoInput} onChange={e=>setPromoInput(e.target.value.toUpperCase())} placeholder="CODE"/><button className="btn btn-ghost" onClick={applyPromo} disabled={!promoInput.trim()}>Appliquer</button></div></div>
              ):(
                <div className="promo-applied"><span>🏷️ Code "{appliedPromo.code}" appliqué</span><button style={{background:"none",border:"none",color:"var(--muted)",cursor:"pointer",fontSize:".85rem"}} onClick={()=>{setAppliedPromo(null);setPromoInput("");}}>✕</button></div>
              )}
              <div className="om-box">
                <span style={{fontSize:"1.7rem"}}>🟠</span>
                <div className="om-info"><div className="om-title">Orange Money</div><div className="om-num">{OM_NUMBER}</div><div className="om-sub">Envoyez {fmtGNF(discountedTotal)}</div></div>
                <button className="om-copy" onClick={copyOM}>Copier</button>
              </div>
              {[["1","Ouvrez Orange Money"],["2","Transfert → "+OM_NUMBER],["3","Montant : "+fmtGNF(discountedTotal)],["4","Notez le code SMS de confirmation"],["5","Remplissez le formulaire ci-dessous"]].map(([n,t])=>(
                <div key={n} className="step"><span className="sn">{n}</span><span>{t}</span></div>
              ))}
              <hr className="div"/>
              <div className="fg"><label className="fl">Nom complet *</label><input className={`fi ${checkErrs.name?"err-field":""}`} value={checkF.name} onChange={e=>{setCheckF(p=>({...p,name:e.target.value}));setCheckErrs(p=>({...p,name:""}));}} placeholder="Votre nom"/>{checkErrs.name&&<div className="field-err">{checkErrs.name}</div>}</div>
              <div className="fg"><label className="fl">Téléphone *</label><input className={`fi ${checkErrs.phone?"err-field":""}`} value={checkF.phone} onChange={e=>{setCheckF(p=>({...p,phone:e.target.value}));setCheckErrs(p=>({...p,phone:""}));}} placeholder="+224 6XX XXX XXX"/>{checkErrs.phone&&<div className="field-err">{checkErrs.phone}</div>}</div>
              <div className="fg"><label className="fl">N° confirmation Orange Money *</label><input className={`fi ${checkErrs.txId?"err-field":""}`} style={{fontFamily:"monospace",letterSpacing:".04em"}} value={checkF.txId} onChange={e=>{setCheckF(p=>({...p,txId:e.target.value}));setCheckErrs(p=>({...p,txId:""}));}} placeholder="ex: CI241203.1234.A12345"/><div style={{fontSize:".68rem",color:"var(--muted)",marginTop:".25rem"}}>📱 Code reçu par SMS après le transfert</div>{checkErrs.txId&&<div className="field-err">{checkErrs.txId}</div>}</div>
              <div className="fg"><label className="fl">PIN secret à 4 chiffres * <span style={{color:"var(--gold)"}}>(notez-le !)</span></label><input className={`fi pin-input ${checkErrs.pin?"err-field":""}`} type="password" maxLength={4} value={checkF.pin} onChange={e=>{setCheckF(p=>({...p,pin:e.target.value.replace(/\D/g,"")}));setCheckErrs(p=>({...p,pin:""}));}} placeholder="••••"/><div style={{fontSize:".68rem",color:"var(--muted)",marginTop:".25rem"}}>🔒 Ce PIN + votre téléphone protègent l'accès à vos téléchargements</div>{checkErrs.pin&&<div className="field-err">{checkErrs.pin}</div>}</div>
              <div style={{background:"rgba(230,126,34,.08)",border:"1px solid rgba(230,126,34,.2)",borderRadius:7,padding:".65rem .9rem",fontSize:".74rem",color:"var(--muted)",marginBottom:".9rem"}}>⚠️ <strong style={{color:"var(--text)"}}>Accès après vérification</strong> — commande activée une fois le paiement confirmé (quelques heures).</div>
              <div className="fa"><button className="btn btn-ghost" onClick={()=>setModal(null)}>Retour</button><button className="btn btn-om" onClick={doCheckout}>📤 Soumettre la commande</button></div>
            </div>
          )}
        </div>
      )}

      {/* WA FAB */}
      <a href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent("Bonjour, j'ai besoin d'aide avec ma commande Librairie YO.")}`} className="wa-fab" target="_blank" rel="noreferrer" title="Support WhatsApp">
        <div className="wa-tooltip">💬 Support WhatsApp</div>💬
      </a>

      {/* TOAST */}
      {toast&&<div className={`toast ${toast.type}`}>{toast.msg}</div>}
    </>
  );
}
