import { useState, useEffect, useCallback } from "react";
import { initializeApp } from "firebase/app";
import {
  getDatabase, ref, onValue, push, remove, update, get
} from "firebase/database";

// ─────────────────────────────────────────────────────────────
// FIREBASE CONFIG
// ─────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyBwb2c9Jtc0q7Lf7WJ78HqSNZnEaXdhfk0",
  authDomain: "librairie-yo.firebaseapp.com",
  databaseURL: "https://librairie-yo-default-rtdb.firebaseio.com",
  projectId: "librairie-yo",
  storageBucket: "librairie-yo.firebasestorage.app",
  messagingSenderId: "236845017887",
  appId: "1:236845017887:web:648a67ff584b63bb9d1e2a"
};

const fbApp = initializeApp(firebaseConfig);
const db = getDatabase(fbApp);

// ─────────────────────────────────────────────────────────────
// CONSTANTES
// ─────────────────────────────────────────────────────────────
const ADMIN_PASSWORD = "papiraro2143";
const OM_NUMBER      = "224613908784";
const WA_NUMBER      = "224661862044";
const TELEGRAM_BOT_TOKEN = "VOTRE_BOT_TOKEN";
const TELEGRAM_CHAT_ID   = "VOTRE_CHAT_ID";

// ─────────────────────────────────────────────────────────────
// CACHE LIVRES
// ─────────────────────────────────────────────────────────────
const BOOKS_CACHE_KEY = "yo_books_v2";

const loadCachedBooks = () => {
  try {
    const raw = localStorage.getItem(BOOKS_CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};

const saveBooksCache = (books) => {
  try {
    const slim = books.map(({ fileData, ...rest }) => rest);
    localStorage.setItem(BOOKS_CACHE_KEY, JSON.stringify(slim));
  } catch {}
};

// ─────────────────────────────────────────────────────────────
// SÉCURITÉ
// ─────────────────────────────────────────────────────────────
const SESSION_KEY = "yo_adm_sess";
const SESSION_TTL = 7_200_000;

const saveSession  = () => localStorage.setItem(SESSION_KEY, Date.now().toString());
const loadSession  = () => { const t=parseInt(localStorage.getItem(SESSION_KEY)||"0"); return !!(t && Date.now()-t<SESSION_TTL); };
const clearSession = () => localStorage.removeItem(SESSION_KEY);

const RATE_KEY = "yo_rate";
const canOrder = () => {
  try {
    const d = JSON.parse(localStorage.getItem(RATE_KEY)||'{"c":0,"r":0}');
    if (Date.now() > d.r) { localStorage.setItem(RATE_KEY, JSON.stringify({c:1,r:Date.now()+600_000})); return true; }
    if (d.c >= 3) return false;
    localStorage.setItem(RATE_KEY, JSON.stringify({...d,c:d.c+1}));
    return true;
  } catch { return true; }
};

const WISH_KEY  = "yo_wishlist";
const loadWish  = () => { try { return JSON.parse(localStorage.getItem(WISH_KEY)||"[]"); } catch { return []; } };
const saveWish  = w  => { try { localStorage.setItem(WISH_KEY, JSON.stringify(w)); } catch {} };

// ─────────────────────────────────────────────────────────────
// CATÉGORIES
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
  {label:"Tout",           val:""},
  {label:"⭐ Favoris",     val:"__wish__"},
  {label:"🆕 Nouveautés", val:"__new__"},
  {label:"⭐ Mis en avant",val:"__feat__"},
  {label:"🎓 Étudiant",   val:"Étudiant"},
  {label:"📐 Lycéen",     val:"Lycéen"},
  {label:"💼 Entrepreneur",val:"Entrepreneur"},
  {label:"🚀 Dev perso",  val:"Développement personnel"},
  {label:"🧠 Philo",      val:"Philosophie"},
  {label:"💻 Tech",       val:"Informatique"},
  {label:"💰 Finance",    val:"Finance & Investissement"},
  {label:"📖 Roman",      val:"Roman"},
];

const SORT_OPTS = [
  {val:"new",        label:"🆕 Nouveaux"},
  {val:"old",        label:"🕐 Anciens"},
  {val:"price_asc",  label:"💰 Prix ↑"},
  {val:"price_desc", label:"💰 Prix ↓"},
  {val:"az",         label:"🔤 A–Z"},
];

const EMOJIS = ["📚","📖","✨","🌙","💡","🔥","⭐","🌿","🦋","🎯","💰","🌹","🗺️","⚔️","🔮","🧠","🏆","⚡","🌍","🕌"];

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
const isNew7d   = ts  => ts && (Date.now() - ts) < 7 * 86_400_000;
const fmtGNF    = n   => (n||0).toLocaleString("fr-FR") + " GNF";
const fmtDate   = ts  => ts ? new Date(ts).toLocaleString("fr-FR",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}) : "";
const sanitize  = str => String(str||"").replace(/[<>]/g,"").trim();
const validPhone = p  => /^\d{9,15}$/.test(p.replace(/[\s\-+()]/g,""));
const validTx    = t  => t.trim().length >= 4;

function applySort(books, sort) {
  const b = [...books];
  if (sort==="new")        return b.sort((a,c)=>(c.createdAt||0)-(a.createdAt||0));
  if (sort==="old")        return b.sort((a,c)=>(a.createdAt||0)-(c.createdAt||0));
  if (sort==="price_asc")  return b.sort((a,c)=>(a.num||0)-(c.num||0));
  if (sort==="price_desc") return b.sort((a,c)=>(c.num||0)-(a.num||0));
  if (sort==="az")         return b.sort((a,c)=>(a.title||"").localeCompare(c.title||"","fr"));
  return b;
}

function exportCSV(orders) {
  const H = ["Nom","Téléphone","Livres","Total GNF","Transaction OM","Statut","Date","Code promo","Réduction"];
  const R = orders.map(o=>[
    o.name, o.phone,
    (o.items||[]).map(i=>`${i.title} x${i.qty}`).join(" | "),
    o.total, o.txId, o.status, fmtDate(o.createdAt),
    o.promoCode||"", o.discount||""
  ]);
  const csv = [H,...R].map(r=>r.map(c=>`"${String(c||"").replace(/"/g,'""')}"`).join(",")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8;"}));
  a.download = `commandes-yo-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
}

// ─────────────────────────────────────────────────────────────
// FORMATAGE DESCRIPTION — rend le format structuré joliment
// ─────────────────────────────────────────────────────────────
function FormatDesc({ text }) {
  if (!text) return null;
  const lines = text.split('\n');
  return (
    <div style={{lineHeight:1.75}}>
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} style={{height:".45rem"}}/>;

        // Titre (première ligne non vide)
        if (i === 0 || (i <= 2 && !lines.slice(0,i).some(l=>l.trim()))) {
          return (
            <div key={i} style={{
              fontFamily:"'Playfair Display',Georgia,serif",
              fontWeight:800, fontSize:"1rem",
              color:"var(--cream)", marginBottom:".15rem"
            }}>{line}</div>
          );
        }
        // Catégorie / Par auteur
        if (line.startsWith("Catégorie :") || line.startsWith("Par ")) {
          return <div key={i} style={{color:"var(--muted)",fontSize:".76rem",marginBottom:".1rem"}}>{line}</div>;
        }
        // Points bullet
        if (line.startsWith("- ")) {
          return (
            <div key={i} style={{display:"flex",gap:".5rem",alignItems:"flex-start",marginBottom:".25rem",marginTop:".1rem"}}>
              <span style={{color:"var(--gold)",fontWeight:700,marginTop:".05rem",flexShrink:0}}>▸</span>
              <span style={{color:"var(--text)",fontSize:".84rem"}}>{line.slice(2)}</span>
            </div>
          );
        }
        // Idée clé
        if (line.startsWith("Idée clé :")) {
          return (
            <div key={i} style={{
              background:"rgba(201,150,58,.1)",
              border:"1px solid rgba(201,150,58,.25)",
              borderRadius:7, padding:".5rem .8rem",
              marginTop:".5rem", color:"var(--gold)",
              fontStyle:"italic", fontSize:".82rem",
              lineHeight:1.5
            }}>{line}</div>
          );
        }
        // Phrase accrocheuse (ligne normale après "Par...")
        return (
          <div key={i} style={{color:"var(--text)",fontSize:".86rem",marginBottom:".2rem",marginTop:".3rem"}}>
            {line}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// IA / PDF
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

// Extrait la couverture ET le nombre de pages réel du PDF
async function extractPDFInfo(b64DataUrl) {
  try {
    const pdfjs = await loadPDFJS();
    const raw = atob(b64DataUrl.split(",")[1]);
    const bytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
    const pdf = await pdfjs.getDocument({ data: bytes }).promise;
    const pageCount = pdf.numPages;
    const page = await pdf.getPage(1);
    const vp0 = page.getViewport({ scale: 1 });
    const scale = Math.min(320 / vp0.width, 480 / vp0.height);
    const vp = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = vp.width; canvas.height = vp.height;
    await page.render({ canvasContext: canvas.getContext("2d"), viewport: vp }).promise;
    const cover = canvas.toDataURL("image/jpeg", 0.72);
    return { cover, pageCount };
  } catch {
    return { cover: null, pageCount: null };
  }
}

// Analyse complète du PDF par IA → titre, auteur, catégorie, pages, description formatée
async function analyzeBookPDF(b64DataUrl) {
  try {
    const base64 = b64DataUrl.split(",")[1];
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
        messages: [{
          role: "user",
          content: [
            {
              type: "document",
              source: { type: "base64", media_type: "application/pdf", data: base64 }
            },
            {
              type: "text",
              text: `Tu es un expert libraire pour une librairie numérique africaine (Guinée/Conakry).

Analyse attentivement ce PDF (couverture + premières pages) et retourne UNIQUEMENT un objet JSON valide (sans backticks ni markdown) avec exactement ces champs :

{
  "title": "titre exact du livre",
  "author": "prénom et nom complet de l'auteur",
  "cat": "EXACTEMENT une parmi: ${CATS.join(", ")}",
  "pages": nombre_entier_de_pages_du_document,
  "desc": "description selon le format exact ci-dessous"
}

Pour le champ "desc", respecte EXACTEMENT ce format ligne par ligne :

[Titre du livre]
Catégorie : [catégorie]
Par [Auteur complet]

[Une phrase accrocheuse et vendeuse en français qui donne vraiment envie de lire ce livre]

- [Point clé 1 : bénéfice, thème ou enseignement important du livre]
- [Point clé 2 : bénéfice, thème ou enseignement important du livre]
- [Point clé 3 : bénéfice, thème ou enseignement important du livre]

Idée clé : [La leçon ou l'idée principale du livre en une phrase courte et percutante]

Règles IMPORTANTES :
- Lis la couverture et les premières pages pour extraire titre, auteur et thèmes
- Si tu connais déjà ce livre, utilise ta connaissance pour enrichir la description
- La description doit être vendeuse, humaine, et donner VRAIMENT envie d'acheter
- Tout doit être en français (traduis si nécessaire)
- Ne réponds QU'avec le JSON brut, aucun texte avant ou après, aucun markdown`
            }
          ]
        }]
      })
    });
    const d = await r.json();
    const txt = d?.content?.[0]?.text?.trim() || "{}";
    return JSON.parse(txt.replace(/```[\w]*\n?|```/g, "").trim());
  } catch (e) {
    console.error("analyzeBookPDF error:", e);
    return {};
  }
}

async function aiCat(title, author) {
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 60, messages: [{ role: "user", content: `Catégorie parmi: ${CATS.join(", ")}.\nLivre: "${title}" par ${author}.\nRéponds avec le nom exact UNIQUEMENT.` }] })
    });
    const d = await r.json();
    const t = d?.content?.[0]?.text?.trim() || "";
    return CATS.find(c => t.toLowerCase().includes(c.toLowerCase())) || "Autre";
  } catch { return "Autre"; }
}

async function sendTelegramNotif(order) {
  if (!TELEGRAM_BOT_TOKEN || TELEGRAM_BOT_TOKEN === "VOTRE_BOT_TOKEN") return;
  const msg = [`🛒 *Nouvelle commande — Librairie YO*`, ``, `👤 ${order.name}`, `📞 \`${order.phone}\``, `💰 *${fmtGNF(order.total)}*`, `🔖 TX OM : \`${order.txId}\``, ``, ...(order.promoCode ? [`🏷️ Code : ${order.promoCode} (-${fmtGNF(order.discount)})`] : []), `📚 *Livres :*`, ...(order.items || []).map(i => `  • ${i.title} ×${i.qty}`)].join("\n");
  try { await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: msg, parse_mode: "Markdown" }) }); } catch {}
}

// ─────────────────────────────────────────────────────────────
// CSS
// ─────────────────────────────────────────────────────────────
const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#0f0d0b;--s1:#1a1714;--s2:#231f1b;--bd:#2e2925;
  --gold:#c9963a;--gl:#e8b85a;--cream:#f5ead8;--text:#e8ddd0;
  --muted:#8a7f74;--red:#c0392b;--om:#ff6600;--green:#27ae60;--orange:#e67e22;
  --blue:#2980b9;--purple:#8e44ad;
}
body{background:var(--bg);color:var(--text);font-family:'DM Sans',system-ui,sans-serif;min-height:100vh}

/* ── NAV ── */
.nav{position:sticky;top:0;z-index:100;height:60px;display:flex;align-items:center;justify-content:space-between;padding:0 1.5rem;background:rgba(15,13,11,.97);backdrop-filter:blur(12px);border-bottom:1px solid var(--bd)}
.logo{font-family:'Playfair Display',Georgia,serif;font-size:1.35rem;font-weight:800;color:var(--cream);cursor:pointer;user-select:none}
.logo em{color:var(--gold);font-style:normal}
.nav-right{display:flex;gap:.4rem;align-items:center;flex-wrap:wrap}
.btn{display:inline-flex;align-items:center;gap:.35rem;padding:.42rem 1rem;border-radius:7px;border:none;font-family:'DM Sans',system-ui,sans-serif;font-size:.82rem;font-weight:500;cursor:pointer;transition:all .18s;white-space:nowrap;text-decoration:none}
.btn-gold{background:var(--gold);color:#0f0d0b;font-weight:700}.btn-gold:hover{background:var(--gl)}
.btn-ghost{background:transparent;color:var(--muted);border:1px solid var(--bd)}.btn-ghost:hover{color:var(--text);border-color:var(--muted)}
.btn-red{background:var(--red);color:#fff}.btn-red:hover{background:#a93226}
.btn-om{background:var(--om);color:#fff;font-weight:700}.btn-om:hover{background:#e85c00}
.btn-green{background:var(--green);color:#fff;font-weight:700}.btn-green:hover{background:#219a52}
.btn-outline{background:transparent;color:var(--gold);border:1px solid var(--gold)}.btn-outline:hover{background:var(--gold);color:#0f0d0b}
.btn-blue{background:var(--blue);color:#fff}.btn-blue:hover{background:#1f6498}
.btn:disabled{opacity:.45;cursor:not-allowed}
.btn-sm{padding:.28rem .65rem;font-size:.75rem}
.cart-btn{position:relative;background:var(--s2);color:var(--text);border:1px solid var(--bd);padding:.4rem .9rem;border-radius:7px;cursor:pointer;font-size:.85rem;display:flex;align-items:center;gap:.4rem;transition:all .18s}
.cart-btn:hover{border-color:var(--gold);color:var(--gold)}
.badge{background:var(--gold);color:#0f0d0b;border-radius:50%;width:17px;height:17px;font-size:.65rem;font-weight:700;display:flex;align-items:center;justify-content:center}
.admin-bar{background:rgba(201,150,58,.08);border-bottom:1px solid rgba(201,150,58,.25);padding:.5rem 1.5rem;display:flex;align-items:center;justify-content:space-between;font-size:.78rem;color:var(--gold);flex-wrap:wrap;gap:.5rem}

/* ── HERO ── */
.hero{text-align:center;padding:3.5rem 1.5rem 2rem;background:radial-gradient(ellipse at 50% 0%,rgba(201,150,58,.08) 0%,transparent 65%);border-bottom:1px solid var(--bd)}
.hero-tag{font-size:.7rem;letter-spacing:.3em;text-transform:uppercase;color:var(--gold);margin-bottom:.9rem}
.hero h1{font-family:'Playfair Display',Georgia,serif;font-size:clamp(2rem,5.5vw,3.8rem);font-weight:800;color:var(--cream);line-height:1.1;margin-bottom:.8rem}
.hero h1 i{color:var(--gold);font-style:italic}
.hero p{color:var(--muted);font-size:.92rem;max-width:420px;margin:0 auto 1.6rem}
.search-box{max-width:400px;margin:0 auto .9rem;position:relative}
.search-box input{width:100%;background:var(--s2);border:1px solid var(--bd);color:var(--text);padding:.7rem 1rem .7rem 2.5rem;border-radius:8px;font-family:'DM Sans',system-ui,sans-serif;font-size:.88rem;outline:none;transition:border-color .2s}
.search-box input:focus{border-color:var(--gold)}.search-box input::placeholder{color:var(--muted)}
.si{position:absolute;left:.8rem;top:50%;transform:translateY(-50%);color:var(--muted)}

/* ── PILLS & SORT ── */
.cat-pills{display:flex;gap:.4rem;overflow-x:auto;padding:.1rem .1rem .5rem;scrollbar-width:none;max-width:760px;margin:0 auto}
.cat-pills::-webkit-scrollbar{display:none}
.pill{background:var(--s2);border:1px solid var(--bd);color:var(--muted);padding:.25rem .7rem;border-radius:20px;font-size:.72rem;cursor:pointer;white-space:nowrap;transition:all .18s}
.pill:hover,.pill.active{background:rgba(201,150,58,.12);border-color:var(--gold);color:var(--gold)}
.sort-bar{display:flex;gap:.4rem;align-items:center;flex-wrap:wrap;margin-bottom:1.2rem}
.sort-lbl{font-size:.72rem;color:var(--muted);margin-right:.2rem}
.sort-btn{background:var(--s2);border:1px solid var(--bd);color:var(--muted);padding:.22rem .6rem;border-radius:6px;font-size:.7rem;cursor:pointer;transition:all .18s;font-family:'DM Sans',system-ui,sans-serif;white-space:nowrap}
.sort-btn.active{background:rgba(201,150,58,.12);border-color:var(--gold);color:var(--gold)}

/* ── GRID ── */
.page{padding:2rem 1.5rem;max-width:1100px;margin:0 auto}
.grid-title{font-family:'Playfair Display',Georgia,serif;font-size:1.35rem;color:var(--cream);margin-bottom:.2rem}
.grid-sub{color:var(--muted);font-size:.78rem;margin-bottom:1rem}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(185px,1fr));gap:1.2rem}

/* ── SKELETONS ── */
@keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}
.skeleton{background:linear-gradient(90deg,var(--s2) 25%,var(--bd) 50%,var(--s2) 75%);background-size:800px 100%;animation:shimmer 1.4s infinite linear;border-radius:6px}
.skeleton-card{background:var(--s1);border:1px solid var(--bd);border-radius:10px;overflow:hidden}
.skeleton-cover{aspect-ratio:3/4;width:100%}
.skeleton-body{padding:.8rem;display:flex;flex-direction:column;gap:.5rem}
.skeleton-line{height:12px}
.skeleton-line.short{width:60%}
.skeleton-line.medium{width:80%}

/* ── SYNC INDICATOR ── */
.sync-dot{width:6px;height:6px;border-radius:50%;background:var(--gold);display:inline-block;animation:pulse-dot 1s ease-in-out infinite}
@keyframes pulse-dot{0%,100%{opacity:.3}50%{opacity:1}}

/* ── FEATURED ── */
.featured-section{padding:1.5rem 1.5rem 0;max-width:1100px;margin:0 auto}
.featured-title{font-family:'Playfair Display',Georgia,serif;font-size:1.1rem;color:var(--cream);margin-bottom:1rem;display:flex;align-items:center;gap:.5rem}
.featured-scroll{display:flex;gap:1rem;overflow-x:auto;padding:.2rem .1rem 1rem;scrollbar-width:thin;scrollbar-color:var(--bd) transparent}
.featured-scroll::-webkit-scrollbar{height:4px}
.featured-scroll::-webkit-scrollbar-track{background:transparent}
.featured-scroll::-webkit-scrollbar-thumb{background:var(--bd);border-radius:2px}
.featured-card{flex-shrink:0;width:155px}

/* ── CARD ── */
.card{background:var(--s1);border:1px solid var(--bd);border-radius:10px;overflow:hidden;transition:transform .2s,box-shadow .2s;cursor:pointer}
.card:hover{transform:translateY(-3px);box-shadow:0 10px 32px rgba(0,0,0,.5)}
.card-cover{width:100%;aspect-ratio:3/4;background:linear-gradient(135deg,var(--s2),#2a2420);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.4rem;position:relative;overflow:hidden}
.card-cover-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:top}
.card-cover-overlay{position:absolute;inset:0;background:linear-gradient(to bottom,transparent 50%,rgba(0,0,0,.65) 100%)}
.emo{font-size:2.3rem;position:relative;z-index:1}
.init{font-family:'Playfair Display',Georgia,serif;font-size:1.6rem;font-weight:800;color:var(--gold);opacity:.55;position:relative;z-index:1}
.has-file-badge{position:absolute;bottom:.5rem;left:.5rem;background:var(--green);color:#fff;font-size:.58rem;font-weight:700;padding:.15rem .4rem;border-radius:4px;z-index:2;letter-spacing:.03em}
.new-badge{position:absolute;top:.5rem;left:.5rem;background:var(--om);color:#fff;font-size:.6rem;font-weight:700;padding:.15rem .45rem;border-radius:4px;z-index:2;text-transform:uppercase;letter-spacing:.04em}
.featured-badge{position:absolute;top:.5rem;left:.5rem;background:var(--gold);color:#0f0d0b;font-size:.6rem;font-weight:700;padding:.15rem .45rem;border-radius:4px;z-index:2;text-transform:uppercase}
.wish-btn{position:absolute;top:.45rem;right:.45rem;background:rgba(0,0,0,.55);border:none;border-radius:50%;width:26px;height:26px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:.82rem;z-index:3;transition:transform .18s;backdrop-filter:blur(4px)}
.wish-btn:hover{transform:scale(1.2)}
.card-body{padding:.8rem}
.cat-tag{font-size:.6rem;text-transform:uppercase;letter-spacing:.12em;color:var(--gold);margin-bottom:.22rem}
.title{font-family:'Playfair Display',Georgia,serif;font-size:.93rem;font-weight:700;color:var(--cream);line-height:1.25;margin-bottom:.18rem;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.author{font-size:.73rem;color:var(--muted);margin-bottom:.6rem}
.card-foot{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:.4rem}
.price{font-weight:700;color:var(--gold);font-size:.98rem}
.stock-lbl{font-size:.63rem;color:var(--muted)}
.add-btn{background:var(--gold);color:#0f0d0b;border:none;border-radius:5px;padding:.3rem .65rem;font-size:.72rem;font-weight:700;cursor:pointer;transition:background .18s}
.add-btn:hover{background:var(--gl)}

/* ── MODALS ── */
.overlay{position:fixed;inset:0;background:rgba(0,0,0,.8);backdrop-filter:blur(5px);z-index:200;display:flex;align-items:center;justify-content:center;padding:1rem}
.modal{background:var(--s1);border:1px solid var(--bd);border-radius:14px;padding:1.8rem;max-width:520px;width:100%;max-height:92vh;overflow-y:auto}
.modal h2{font-family:'Playfair Display',Georgia,serif;font-size:1.3rem;color:var(--cream);margin-bottom:1.2rem}
.mc{float:right;background:none;border:none;color:var(--muted);cursor:pointer;font-size:1.2rem;transition:color .18s}
.mc:hover{color:var(--text)}
.fg{margin-bottom:.9rem}
.fl{display:block;font-size:.7rem;color:var(--muted);margin-bottom:.28rem;text-transform:uppercase;letter-spacing:.06em}
.fi,.fs,.ft{width:100%;background:var(--s2);border:1px solid var(--bd);color:var(--text);padding:.58rem .82rem;border-radius:7px;font-family:'DM Sans',system-ui,sans-serif;font-size:.86rem;outline:none;transition:border-color .2s}
.fi:focus,.fs:focus,.ft:focus{border-color:var(--gold)}
.fi.err-field{border-color:var(--red)}
.ft{resize:vertical;min-height:72px}.fs option{background:var(--s2)}
.fr{display:grid;grid-template-columns:1fr 1fr;gap:.7rem}
.fa{display:flex;gap:.6rem;justify-content:flex-end;margin-top:1.3rem}
.err{color:#f08080;font-size:.76rem;margin-top:.32rem}
.field-err{color:#f08080;font-size:.72rem;margin-top:.2rem}
.upload-zone{border:2px dashed var(--bd);border-radius:8px;padding:1.2rem;text-align:center;cursor:pointer;transition:border-color .2s;position:relative}
.upload-zone:hover{border-color:var(--gold)}
.upload-zone input{position:absolute;inset:0;opacity:0;cursor:pointer}
.upload-zone .uico{font-size:1.8rem;margin-bottom:.4rem}
.upload-zone p{font-size:.78rem;color:var(--muted)}
.upload-zone strong{color:var(--gold)}
.file-ready{background:rgba(39,174,96,.1);border:1px solid rgba(39,174,96,.35);border-radius:7px;padding:.6rem .9rem;display:flex;align-items:center;gap:.6rem;font-size:.8rem;margin-top:.5rem}
.fname{flex:1;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.fsize{color:var(--muted);font-size:.7rem}
.file-remove{background:none;border:none;color:var(--muted);cursor:pointer;font-size:1rem}
.file-remove:hover{color:var(--red)}
.cover-preview{width:100%;max-height:200px;object-fit:contain;object-position:top;border-radius:6px;margin-top:.5rem;border:1px solid var(--bd)}
.ai-row{display:flex;align-items:center;gap:.5rem;font-size:.76rem;color:var(--gold);margin:.3rem 0 .6rem;background:rgba(201,150,58,.07);padding:.4rem .7rem;border-radius:6px}
.ai-analysis-box{background:rgba(201,150,58,.05);border:1px solid rgba(201,150,58,.18);border-radius:8px;padding:.8rem 1rem;margin-bottom:.9rem;font-size:.78rem;color:var(--muted)}
.promo-row{display:flex;gap:.5rem;align-items:stretch;margin-bottom:.7rem}
.promo-row .fi{margin:0}
.promo-applied{background:rgba(39,174,96,.08);border:1px solid rgba(39,174,96,.3);border-radius:7px;padding:.45rem .85rem;font-size:.8rem;color:var(--green);display:flex;align-items:center;justify-content:space-between;margin-bottom:.8rem}

/* ── PRIX HIGHLIGHT (formulaire admin) ── */
.prix-highlight{background:rgba(201,150,58,.07);border:2px solid rgba(201,150,58,.4);border-radius:9px;padding:.9rem 1rem;margin-bottom:.9rem}
.prix-highlight .fl{color:var(--gold);font-size:.75rem;font-weight:600}
.prix-highlight .fi{border-color:rgba(201,150,58,.4);font-size:1rem;font-weight:700;color:var(--gold)}
.prix-highlight .fi:focus{border-color:var(--gold);background:rgba(201,150,58,.05)}
.prix-tip{font-size:.68rem;color:var(--muted);margin-top:.3rem}

/* ── AI PROGRESS ── */
.ai-progress{background:rgba(201,150,58,.05);border:1px solid rgba(201,150,58,.2);border-radius:10px;padding:1rem 1.1rem;margin-bottom:1rem;display:flex;flex-direction:column;gap:.5rem}
.ai-progress-title{font-size:.78rem;color:var(--gold);font-weight:600;display:flex;align-items:center;gap:.5rem}
.ai-progress-steps{display:flex;flex-direction:column;gap:.3rem}
.ai-step{font-size:.72rem;color:var(--muted);display:flex;align-items:center;gap:.4rem}
.ai-step.done{color:var(--green)}
.ai-step.active{color:var(--gold)}

/* ── CART ── */
.cart-side{position:fixed;right:0;top:0;bottom:0;width:min(380px,100vw);background:var(--s1);border-left:1px solid var(--bd);z-index:300;padding:1.4rem;display:flex;flex-direction:column;transform:translateX(100%);transition:transform .28s ease}
.cart-side.open{transform:translateX(0)}
.co{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:299}
.ch{display:flex;justify-content:space-between;align-items:center;margin-bottom:1.3rem}
.ct{font-family:'Playfair Display',Georgia,serif;font-size:1.2rem;color:var(--cream)}
.ci-list{flex:1;overflow-y:auto}
.ci{display:flex;gap:.9rem;padding:.7rem 0;border-bottom:1px solid var(--bd)}
.ci-info{flex:1}
.ci-title{font-weight:500;color:var(--text);font-size:.85rem}
.ci-price{color:var(--gold);font-size:.78rem}
.qty{display:flex;align-items:center;gap:.4rem;margin-top:.25rem}
.qb{background:var(--s2);border:1px solid var(--bd);color:var(--text);width:22px;height:22px;border-radius:4px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:.85rem}
.qb:hover{border-color:var(--gold);color:var(--gold)}
.rb{background:none;border:none;color:var(--muted);cursor:pointer;font-size:1rem;align-self:flex-start}
.rb:hover{color:var(--red)}
.cf{padding-top:.9rem;border-top:1px solid var(--bd)}
.ctotal{display:flex;justify-content:space-between;margin-bottom:.9rem;font-weight:600;color:var(--cream)}
.ctotal span:last-child{color:var(--gold);font-size:1.05rem}

/* ── ORANGE MONEY ── */
.om-box{background:linear-gradient(135deg,#ff6600,#ff8c00);border-radius:10px;padding:.9rem 1.1rem;margin-bottom:1rem;display:flex;align-items:center;gap:.8rem}
.om-info{flex:1}
.om-title{font-weight:700;color:#fff;font-size:.88rem;margin-bottom:.1rem}
.om-num{font-family:'Playfair Display',Georgia,serif;font-size:1.1rem;font-weight:800;color:#fff;letter-spacing:.04em}
.om-sub{font-size:.67rem;color:rgba(255,255,255,.8);margin-top:.1rem}
.om-copy{background:rgba(255,255,255,.25);border:none;border-radius:6px;padding:.32rem .6rem;font-size:.7rem;color:#fff;cursor:pointer;font-weight:600}
.om-copy:hover{background:rgba(255,255,255,.4)}
.step{display:flex;gap:.65rem;align-items:flex-start;margin-bottom:.48rem;font-size:.78rem;color:var(--muted)}
.sn{background:var(--om);color:#fff;border-radius:50%;width:19px;height:19px;font-size:.67rem;font-weight:700;flex-shrink:0;display:flex;align-items:center;justify-content:center;margin-top:.1rem}
.step strong{color:var(--text)}

/* ── STATES / STATUS ── */
.empty{text-align:center;padding:5rem 1rem;color:var(--muted)}
.loading-screen{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:60vh;gap:1rem;color:var(--muted)}
.loading-screen .big{font-size:2.5rem}
@keyframes spin{to{transform:rotate(360deg)}}
.spin{display:inline-block;animation:spin .9s linear infinite}
.status-badge{display:inline-flex;align-items:center;gap:.3rem;padding:.18rem .55rem;border-radius:20px;font-size:.67rem;font-weight:700;text-transform:uppercase;letter-spacing:.04em}
.status-pending{background:rgba(230,126,34,.15);color:var(--orange);border:1px solid rgba(230,126,34,.3)}
.status-approved{background:rgba(39,174,96,.15);color:var(--green);border:1px solid rgba(39,174,96,.3)}
.status-rejected{background:rgba(192,57,43,.15);color:#f08080;border:1px solid rgba(192,57,43,.3)}

/* ── TOAST ── */
.toast{position:fixed;bottom:1.8rem;left:50%;transform:translateX(-50%);background:var(--s2);border:1px solid var(--bd);color:var(--text);padding:.6rem 1.3rem;border-radius:8px;font-size:.82rem;z-index:600;animation:tin .25s ease;box-shadow:0 8px 28px rgba(0,0,0,.45);white-space:nowrap;pointer-events:none}
.toast.ok{border-color:var(--green);color:#6fcf97}
.toast.er{border-color:var(--red);color:#f08080}
@keyframes tin{from{opacity:0;transform:translateX(-50%) translateY(8px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}

/* ── PENDING / CHECK ── */
.pending-page{max-width:460px;margin:3rem auto;padding:0 1.5rem;text-align:center}
.pending-page .big-icon{font-size:3.5rem;margin-bottom:.9rem}
.pending-page h2{font-family:'Playfair Display',Georgia,serif;font-size:1.8rem;color:var(--cream);margin-bottom:.6rem}
.pending-page p{color:var(--muted);font-size:.88rem;line-height:1.6;margin-bottom:1.3rem}
.info-box{background:rgba(201,150,58,.06);border:1px solid rgba(201,150,58,.2);border-radius:8px;padding:.85rem 1rem;font-size:.8rem;color:var(--muted);text-align:left;line-height:1.8;margin-bottom:1.3rem}
.info-box strong{color:var(--text)}
.pin-highlight{background:var(--s2);border:2px solid var(--gold);border-radius:8px;padding:.6rem 1rem;font-size:1.1rem;font-weight:700;color:var(--gold);letter-spacing:.2em;text-align:center;margin:.5rem 0 1rem;font-family:monospace}
.check-page{max-width:420px;margin:3rem auto;padding:0 1.5rem}
.check-page h2{font-family:'Playfair Display',Georgia,serif;font-size:1.7rem;color:var(--cream);margin-bottom:.5rem;text-align:center}
.dl-card{background:var(--s1);border:1px solid var(--bd);border-radius:12px;padding:1.3rem;margin-bottom:1.1rem}
.dl-formats{display:flex;gap:.5rem;flex-wrap:wrap}
.pin-input{letter-spacing:.3em;text-align:center;font-size:1.1rem;font-weight:700;font-family:monospace}
.copy-sum{background:var(--s2);border:1px solid var(--bd);color:var(--muted);padding:.28rem .7rem;border-radius:6px;font-size:.72rem;cursor:pointer;transition:all .18s;font-family:'DM Sans',system-ui,sans-serif}
.copy-sum:hover{border-color:var(--gold);color:var(--gold)}

/* ── ADMIN ── */
.admin-tabs{display:flex;gap:.5rem;border-bottom:1px solid var(--bd);margin-bottom:1.6rem;overflow-x:auto;scrollbar-width:none}
.admin-tabs::-webkit-scrollbar{display:none}
.tab{background:none;border:none;border-bottom:2px solid transparent;color:var(--muted);padding:.52rem .88rem;cursor:pointer;font-family:'DM Sans',system-ui,sans-serif;font-size:.82rem;font-weight:500;transition:all .18s;margin-bottom:-1px;white-space:nowrap}
.tab.active{color:var(--gold);border-bottom-color:var(--gold)}
.tab:hover:not(.active){color:var(--text)}
.order-row{background:var(--s1);border:1px solid var(--bd);border-radius:10px;padding:.95rem 1.1rem;margin-bottom:.85rem}
.order-row-head{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;margin-bottom:.55rem;flex-wrap:wrap}
.order-meta{font-size:.77rem;color:var(--muted);line-height:1.6}
.order-meta strong{color:var(--cream);font-size:.86rem}
.order-items{font-size:.77rem;color:var(--muted);margin-bottom:.65rem;line-height:1.5}
.order-tx{font-size:.73rem;background:var(--s2);border:1px solid var(--bd);border-radius:5px;padding:.22rem .55rem;color:var(--gold);font-family:monospace;display:inline-block;margin-top:.2rem}
.order-actions{display:flex;gap:.5rem;flex-wrap:wrap;margin-top:.8rem}
.search-input{width:100%;background:var(--s2);border:1px solid var(--bd);color:var(--text);padding:.58rem .82rem;border-radius:7px;font-family:'DM Sans',system-ui,sans-serif;font-size:.84rem;outline:none;margin-bottom:1.1rem;transition:border-color .2s}
.search-input:focus{border-color:var(--gold)}
.stats-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(155px,1fr));gap:.9rem;margin-bottom:1.8rem}
.stat-card{background:var(--s1);border:1px solid var(--bd);border-radius:10px;padding:1rem .9rem;text-align:center;transition:border-color .2s}
.stat-icon{font-size:1.4rem;margin-bottom:.4rem}
.stat-val{font-family:'Playfair Display',Georgia,serif;font-size:1.3rem;font-weight:700;color:var(--gold);margin-bottom:.2rem;line-height:1.1}
.stat-lbl{font-size:.68rem;color:var(--muted);text-transform:uppercase;letter-spacing:.06em}
.top-book-row{display:flex;align-items:center;gap:.8rem;padding:.6rem .9rem;background:var(--s1);border:1px solid var(--bd);border-radius:8px;margin-bottom:.6rem}
.promo-code-row{background:var(--s1);border:1px solid var(--bd);border-radius:9px;padding:.8rem 1rem;margin-bottom:.7rem;display:flex;align-items:center;gap:.8rem;flex-wrap:wrap}
.promo-code-label{font-family:monospace;font-size:1rem;font-weight:700;min-width:80px}
.promo-form{background:var(--s2);border:1px solid var(--bd);border-radius:10px;padding:1.2rem;margin-bottom:1.5rem}
.detail-cover{width:130px;flex-shrink:0;aspect-ratio:3/4;border-radius:10px;overflow:hidden;border:1px solid var(--bd);background:var(--s2);display:flex;align-items:center;justify-content:center;font-size:2.5rem}
.detail-cover img{width:100%;height:100%;object-fit:cover;object-position:top}
.detail-title{font-family:'Playfair Display',Georgia,serif;font-size:1.3rem;font-weight:800;color:var(--cream);line-height:1.2;margin-bottom:.4rem}
.detail-author{color:var(--muted);font-size:.84rem;margin-bottom:.6rem}
.detail-price{color:var(--gold);font-size:1.4rem;font-weight:700;margin-bottom:.9rem}
.detail-meta-row{display:flex;align-items:center;gap:1rem;flex-wrap:wrap;margin-bottom:.7rem}
.detail-meta-chip{display:inline-flex;align-items:center;gap:.35rem;background:var(--s2);border:1px solid var(--bd);border-radius:6px;padding:.25rem .6rem;font-size:.74rem;color:var(--muted)}
.detail-meta-chip strong{color:var(--text)}
.detail-desc-box{background:var(--s2);border-radius:10px;padding:1rem 1.1rem;margin-top:.9rem;border:1px solid var(--bd)}
.detail-desc-label{color:var(--gold);font-size:.68rem;text-transform:uppercase;letter-spacing:.12em;margin-bottom:.7rem;font-weight:600}
.wa-fab{position:fixed;bottom:1.5rem;right:1.5rem;background:#25D366;border:none;border-radius:50%;width:52px;height:52px;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 4px 20px rgba(0,0,0,.45);z-index:150;font-size:1.5rem;transition:transform .2s,box-shadow .2s;text-decoration:none}
.wa-fab:hover{transform:scale(1.1);box-shadow:0 6px 28px rgba(37,211,102,.4)}
.wa-tooltip{position:absolute;right:calc(100% + .6rem);background:var(--s1);border:1px solid var(--bd);color:var(--text);padding:.3rem .7rem;border-radius:6px;font-size:.74rem;white-space:nowrap;opacity:0;transition:opacity .2s;pointer-events:none}
.wa-fab:hover .wa-tooltip{opacity:1}
hr.div{border:none;border-top:1px solid var(--bd);margin:1rem 0}
@media(max-width:480px){
  .nav{padding:0 .9rem;height:55px}
  .nav-right{gap:.3rem}
  .btn-sm{padding:.24rem .5rem;font-size:.72rem}
  .hero{padding:2.5rem 1rem 1.5rem}
  .page{padding:1.5rem 1rem}
  .grid{grid-template-columns:repeat(auto-fill,minmax(155px,1fr));gap:.9rem}
  .fr{grid-template-columns:1fr}
}
`;

// ─────────────────────────────────────────────────────────────
// SKELETON CARD
// ─────────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="skeleton-card">
    <div className="skeleton skeleton-cover" />
    <div className="skeleton-body">
      <div className="skeleton skeleton-line short" />
      <div className="skeleton skeleton-line medium" />
      <div className="skeleton skeleton-line short" />
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ─────────────────────────────────────────────────────────────
export default function App() {
  // ── Firebase state ──
  const [books,       setBooks]       = useState(loadCachedBooks);
  const [loading,     setLoading]     = useState(() => loadCachedBooks().length === 0);
  const [syncing,     setSyncing]     = useState(true);
  const [adminOrders, setAdminOrders] = useState([]);
  const [promoCodes,  setPromoCodes]  = useState([]);

  // ── UI state ──
  const [view,        setView]        = useState("home");
  const [cart,        setCart]        = useState([]);
  const [cartOpen,    setCartOpen]    = useState(false);
  const [search,      setSearch]      = useState("");
  const [activeCat,   setActiveCat]   = useState("");
  const [sort,        setSort]        = useState("new");
  const [wishlist,    setWishlist]    = useState(loadWish);

  // ── Admin state ──
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
  const [loginPass, setLoginPass] = useState("");
  const [loginErr,  setLoginErr]  = useState("");

  // ── Book form — pages ajouté ──
  const emptyF = { title:"", author:"", cat:"Roman", price:"", num:"", desc:"", stock:99, emoji:"📚", pages:"" };
  const [form,           setForm]          = useState(emptyF);
  const [formErr,        setFormErr]       = useState("");
  const [formFieldErrs,  setFormFieldErrs] = useState({});
  const [aiLoading,      setAiLoading]     = useState(false);
  const [aiStep,         setAiStep]        = useState(""); // étape IA en cours
  const [uploadedFile,   setUploadedFile]  = useState(null);
  const [extractedCover, setExtractedCover]= useState(null);

  // ── Checkout ──
  const [checkF,       setCheckF]       = useState({ name:"", phone:"", txId:"", pin:"" });
  const [checkErrs,    setCheckErrs]    = useState({});
  const [promoInput,   setPromoInput]   = useState("");
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [pendingOrder, setPendingOrder] = useState(null);

  // ── My orders ──
  const [checkPhone,     setCheckPhone]     = useState("");
  const [checkPin,       setCheckPin]       = useState("");
  const [myOrders,       setMyOrders]       = useState(null);
  const [checkingOrders, setCheckingOrders] = useState(false);

  // ── Promo form (admin) ──
  const emptyPromo = { code:"", discount:"", type:"percent", maxUses:"100" };
  const [promoForm, setPromoForm] = useState(emptyPromo);

  // ─── Firebase: books ─────────────────────────────────────
  useEffect(() => {
    const unsub = onValue(ref(db,"books"), snap => {
      const data = snap.val();
      const fresh = data
        ? Object.entries(data).map(([k,v]) => ({ ...v, fbKey: k }))
        : [];
      setBooks(fresh);
      setLoading(false);
      setSyncing(false);
      saveBooksCache(fresh);
    }, () => { setLoading(false); setSyncing(false); });
    return () => unsub();
  }, []);

  // ─── Firebase: orders (admin only) ───────────────────────
  useEffect(() => {
    if (!isAdmin) return;
    const unsub = onValue(ref(db,"orders"), snap => {
      const data = snap.val();
      setAdminOrders(data
        ? Object.entries(data).map(([k,v])=>({...v,fbKey:k})).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0))
        : []);
    });
    return () => unsub();
  }, [isAdmin]);

  // ─── Firebase: promo codes ────────────────────────────────
  useEffect(() => {
    const unsub = onValue(ref(db,"promoCodes"), snap => {
      const data = snap.val();
      setPromoCodes(data ? Object.entries(data).map(([k,v])=>({...v,fbKey:k})) : []);
    });
    return () => unsub();
  }, []);

  // ─── Keyboard Escape ──────────────────────────────────────
  useEffect(() => {
    const h = e => { if (e.key==="Escape") { setModal(null); setCartOpen(false); } };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  // ─── Scroll to top on view change ────────────────────────
  useEffect(() => { window.scrollTo({top:0,behavior:"smooth"}); }, [view]);

  // ── helpers internes ──
  const toast$ = (msg, type="ok") => { setToast({msg,type}); setTimeout(()=>setToast(null), 3500); };

  const toggleWish = fbKey => {
    setWishlist(prev => {
      const n = prev.includes(fbKey) ? prev.filter(k=>k!==fbKey) : [...prev, fbKey];
      saveWish(n);
      return n;
    });
  };

  // ─── Catalogue filtré + trié ──────────────────────────────
  const filtered = (() => {
    const q = search.toLowerCase();
    let res = books.filter(b => {
      const matchQ = !q || b.title?.toLowerCase().includes(q) || b.author?.toLowerCase().includes(q) || b.cat?.toLowerCase().includes(q);
      let matchCat = true;
      if (activeCat === "__wish__") matchCat = wishlist.includes(b.fbKey);
      else if (activeCat === "__new__") matchCat = isNew7d(b.createdAt);
      else if (activeCat === "__feat__") matchCat = !!b.featured;
      else if (activeCat) matchCat = b.cat === activeCat;
      return matchQ && matchCat;
    });
    return applySort(res, sort);
  })();

  const featuredBooks = books.filter(b => b.featured);
  const cartCount = cart.reduce((s,i)=>s+i.qty, 0);
  const cartTotal = cart.reduce((s,i)=>s+i.num*i.qty, 0);
  const discountedTotal = (() => {
    if (!appliedPromo) return cartTotal;
    if (appliedPromo.type==="percent") return Math.round(cartTotal*(1-appliedPromo.discount/100));
    return Math.max(0, cartTotal - appliedPromo.discount);
  })();

  const pendingCount = adminOrders.filter(o=>o.status==="pending").length;

  // ─── Panier ───────────────────────────────────────────────
  const addCart = b => {
    setCart(p => { const ex=p.find(i=>i.fbKey===b.fbKey); return ex?p.map(i=>i.fbKey===b.fbKey?{...i,qty:i.qty+1}:i):[...p,{...b,qty:1}]; });
    toast$(`"${b.title}" ajouté ✓`);
  };
  const updQ    = (k,d) => setCart(p=>p.map(i=>i.fbKey===k?{...i,qty:Math.max(1,i.qty+d)}:i));
  const remCart = k => setCart(p=>p.filter(i=>i.fbKey!==k));
  const copyOM  = () => { navigator.clipboard.writeText(OM_NUMBER).catch(()=>{}); toast$("Numéro copié 📋"); };

  // ─── Admin login ──────────────────────────────────────────
  const doLogin = () => {
    if (loginPass===ADMIN_PASSWORD) {
      setIsAdmin(true); saveSession();
      setModal(null); setLoginPass(""); setLoginErr("");
      setAdminTab("stats"); setView("admin");
      toast$("Bienvenue, mon Roi 👑");
    } else {
      setLoginErr("Mot de passe incorrect.");
    }
  };

  const doLogout = () => {
    setIsAdmin(false); clearSession();
    setView("home"); toast$("Déconnecté","er");
  };

  // ─── Formulaire livre ─────────────────────────────────────
  const openAdd  = () => {
    setForm(emptyF); setUploadedFile(null); setExtractedCover(null);
    setFormErr(""); setFormFieldErrs({}); setAiStep(""); setModal("add");
  };
  const openEdit = b => {
    setEditB(b);
    setForm({
      title:b.title, author:b.author, cat:b.cat,
      price:b.price, num:b.num, desc:b.desc||"",
      stock:b.stock, emoji:b.emoji||"📚", pages:b.pages?String(b.pages):""
    });
    setUploadedFile(null); setExtractedCover(b.coverImage||null);
    setFormErr(""); setFormFieldErrs({}); setAiStep(""); setModal("edit");
  };

  const chForm = e => {
    const {name:n,value:v} = e.target;
    setForm(p => { const x={...p,[n]:v}; if(n==="num") x.price=v?`${Number(v).toLocaleString("fr-FR")} GNF`:""; return x; });
    setFormFieldErrs(p=>({...p,[n]:""}));
  };

  const handleBlur = async () => {
    if (modal!=="add"||!form.title.trim()||!form.author.trim()||aiLoading||uploadedFile) return;
    setAiLoading(true);
    try { const cat=await aiCat(form.title,form.author); setForm(p=>({...p,cat})); } catch {}
    setAiLoading(false);
  };

  // ─── Upload PDF + analyse IA complète ─────────────────────
  const handleFileChange = async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 9*1024*1024) { toast$("Fichier trop volumineux (max 9 Mo)","er"); return; }
    const b64 = await readFileAsBase64(file);
    setUploadedFile({name:file.name,size:(file.size/1024).toFixed(0)+" Ko",b64,type:file.type});

    if (file.type==="application/pdf") {
      setAiLoading(true);
      setAiStep("cover");
      toast$("🤖 IA analyse le PDF…");

      // Étape 1 : extraire couverture + compter les pages (PDF.js)
      const { cover, pageCount } = await extractPDFInfo(b64);
      if (cover) setExtractedCover(cover);
      setAiStep("analyze");

      // Étape 2 : analyse IA (titre, auteur, cat, pages, description)
      const analysis = await analyzeBookPDF(b64);

      // Remplissage automatique du formulaire
      setForm(p => ({
        ...p,
        title:  analysis.title  || p.title,
        author: analysis.author || p.author,
        cat:    CATS.includes(analysis.cat) ? analysis.cat : (p.cat || "Autre"),
        desc:   analysis.desc   || p.desc,
        // Pages : priorité à l'IA (qui connaît le vrai nbre), fallback PDF.js
        pages:  analysis.pages
          ? String(analysis.pages)
          : (pageCount ? String(pageCount) : p.pages),
      }));

      setAiLoading(false);
      setAiStep("done");
      toast$("✅ Analyse terminée — saisissez le prix pour publier");
    }
  };

  // ─── Sauvegarde livre ─────────────────────────────────────
  const saveBook = async () => {
    const errs = {};
    if (!form.title.trim())        errs.title  = "Titre requis";
    if (!form.author.trim())       errs.author = "Auteur requis";
    if (!form.num || isNaN(form.num)) errs.num = "Prix requis";
    if (Object.keys(errs).length) { setFormFieldErrs(errs); return; }

    const bookData = {
      title:  sanitize(form.title),
      author: sanitize(form.author),
      cat:    form.cat,
      emoji:  form.emoji,
      price:  form.price || `${Number(form.num).toLocaleString("fr-FR")} GNF`,
      num:    Number(form.num),
      desc:   sanitize(form.desc),
      stock:  Number(form.stock) || 99,
      pages:  form.pages ? Number(form.pages) : null,
      hasFile:     uploadedFile ? true : (editB?.hasFile || false),
      coverImage:  extractedCover || editB?.coverImage || null,
      featured:    editB?.featured || false,
      createdAt:   modal==="add" ? Date.now() : (editB?.createdAt || Date.now()),
    };

    if (uploadedFile) {
      bookData.fileData = uploadedFile.b64;
      bookData.fileName = uploadedFile.name;
      bookData.fileType = uploadedFile.type;
    } else if (modal==="edit" && editB?.fileData) {
      bookData.fileData = editB.fileData;
      bookData.fileName = editB.fileName;
      bookData.fileType = editB.fileType;
    }

    try {
      if (modal==="add") { await push(ref(db,"books"),bookData); toast$(`"${form.title}" publié ✓`); }
      else               { await update(ref(db,`books/${editB.fbKey}`),bookData); toast$(`"${form.title}" mis à jour ✓`); }
      setModal(null);
    } catch(err) { toast$("Erreur Firebase : "+err.message,"er"); }
  };

  const delBook    = b => { setEditB(b); setModal("del"); };
  const confirmDel = async () => { await remove(ref(db,`books/${editB.fbKey}`)); toast$("Livre supprimé","er"); setModal(null); };

  const toggleFeatured = async b => {
    await update(ref(db,`books/${b.fbKey}`), {featured:!b.featured});
    toast$(b.featured?"Retiré des mis en avant":"⭐ Mis en avant");
  };

  // ─── Checkout ─────────────────────────────────────────────
  const applyPromo = () => {
    const code = promoCodes.find(p => p.active && p.code.toUpperCase()===promoInput.trim().toUpperCase());
    if (!code)                              { toast$("Code promo invalide ou inactif","er"); return; }
    if (code.maxUses && (code.uses||0)>=code.maxUses) { toast$("Ce code promo a expiré","er"); return; }
    setAppliedPromo(code);
    toast$(`Code "${code.code}" appliqué ✓`);
  };

  const doCheckout = async () => {
    const errs = {};
    if (!checkF.name.trim())                    errs.name  = "Nom requis";
    if (!checkF.phone.trim())                   errs.phone = "Téléphone requis";
    else if (!validPhone(checkF.phone))         errs.phone = "Format invalide (9–15 chiffres)";
    if (!checkF.txId.trim())                    errs.txId  = "N° transaction requis";
    else if (!validTx(checkF.txId))             errs.txId  = "Minimum 4 caractères";
    if (!/^\d{4}$/.test(checkF.pin))            errs.pin   = "PIN à 4 chiffres requis";
    if (Object.keys(errs).length) { setCheckErrs(errs); return; }
    if (!canOrder()) { toast$("Trop de tentatives — réessayez dans 10 minutes","er"); return; }

    try {
      const snap = await get(ref(db,"orders"));
      const data = snap.val();
      if (data) {
        const dup = Object.values(data).find(o=>o.txId===checkF.txId.trim().toUpperCase());
        if (dup) { toast$("Ce numéro de transaction a déjà été utilisé","er"); return; }
      }
    } catch {}

    const orderData = {
      name:sanitize(checkF.name), phone:checkF.phone.trim().replace(/\s+/g,""),
      txId:checkF.txId.trim().toUpperCase(), pin:checkF.pin,
      total:discountedTotal, originalTotal:cartTotal,
      discount:cartTotal-discountedTotal,
      promoCode:appliedPromo?.code||null,
      items:cart.map(i=>({fbKey:i.fbKey,title:i.title,author:i.author,emoji:i.emoji,qty:i.qty,price:i.num*i.qty})),
      status:"pending", createdAt:Date.now(),
    };

    try {
      const newRef = await push(ref(db,"orders"), orderData);
      if (appliedPromo) {
        await update(ref(db,`promoCodes/${appliedPromo.fbKey}`), {uses:(appliedPromo.uses||0)+1});
      }
      const saved = {...orderData, fbKey:newRef.key};
      setPendingOrder(saved);
      sendTelegramNotif(saved).catch(()=>{});
      setCart([]); setModal(null); setCartOpen(false);
      setCheckF({name:"",phone:"",txId:"",pin:""}); setCheckErrs({});
      setAppliedPromo(null); setPromoInput("");
      setView("pending");
    } catch(err) { toast$("Erreur : "+err.message,"er"); }
  };

  // ─── Mes commandes ────────────────────────────────────────
  const checkMyOrders = async () => {
    const errs = {};
    if (!checkPhone.trim())        errs.phone = "Téléphone requis";
    if (!/^\d{4}$/.test(checkPin)) errs.pin   = "PIN à 4 chiffres";
    if (Object.keys(errs).length) { toast$(Object.values(errs)[0],"er"); return; }
    setCheckingOrders(true);
    try {
      const snap = await get(ref(db,"orders"));
      const data = snap.val();
      if (!data) { setMyOrders([]); setCheckingOrders(false); return; }
      const phone = checkPhone.trim().replace(/\s+/g,"");
      const found = Object.entries(data).map(([k,v])=>({...v,fbKey:k}))
        .filter(o=>o.phone.replace(/\s+/g,"")===phone && o.pin===checkPin)
        .sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
      setMyOrders(found);
      if (found.length===0) toast$("Aucune commande avec ces identifiants","er");
    } catch(err) { toast$("Erreur : "+err.message,"er"); }
    setCheckingOrders(false);
  };

  // ─── Admin: statut commande ───────────────────────────────
  const setOrderStatus = async (fbKey, status) => {
    try {
      await update(ref(db,`orders/${fbKey}`), {status, reviewedAt:Date.now()});
      toast$(status==="approved"?"✅ Commande approuvée":"❌ Commande rejetée", status==="approved"?"ok":"er");
    } catch(err) { toast$("Erreur : "+err.message,"er"); }
  };

  // ─── Admin: promo codes ───────────────────────────────────
  const addPromoCode = async () => {
    if (!promoForm.code.trim()||!promoForm.discount) { toast$("Code et réduction requis","er"); return; }
    const existing = promoCodes.find(p=>p.code.toUpperCase()===promoForm.code.trim().toUpperCase());
    if (existing) { toast$("Ce code existe déjà","er"); return; }
    await push(ref(db,"promoCodes"),{
      code:promoForm.code.trim().toUpperCase(),
      discount:Number(promoForm.discount),
      type:promoForm.type,
      maxUses:Number(promoForm.maxUses)||100,
      uses:0, active:true, createdAt:Date.now()
    });
    setPromoForm(emptyPromo); toast$("Code promo créé ✓");
  };

  const togglePromo = async p => {
    await update(ref(db,`promoCodes/${p.fbKey}`), {active:!p.active});
    toast$(p.active?"Code désactivé":"Code activé ✓");
  };

  const deletePromo = async p => {
    await remove(ref(db,`promoCodes/${p.fbKey}`));
    toast$("Code supprimé","er");
  };

  // ─── Téléchargement ──────────────────────────────────────
  const downloadBook = book => {
    if (!book?.fileData) { toast$("Fichier non disponible","er"); return; }
    const a=document.createElement("a"); a.href=book.fileData; a.download=book.fileName||book.title; a.click();
    toast$("Téléchargement lancé ✓");
  };
  const readOnline = book => {
    if (!book?.fileData) { toast$("Fichier non disponible","er"); return; }
    const w=window.open();
    if(w){w.document.write(`<iframe src="${book.fileData}" style="width:100%;height:100%;border:none"></iframe>`);w.document.close();}
  };

  const copyOrderSummary = order => {
    const txt=[`📦 Commande Librairie YO`,``,`👤 ${order.name}`,`📞 ${order.phone}`,`💰 ${fmtGNF(order.total)}`,`🔖 TX: ${order.txId}`,`📌 PIN: ${order.pin}`,``,...(order.items||[]).map(i=>`• ${i.title} ×${i.qty}`)].join("\n");
    navigator.clipboard.writeText(txt).catch(()=>{});
    toast$("Résumé copié 📋");
  };

  // ─── Stats admin ──────────────────────────────────────────
  const statsData = (() => {
    const approved = adminOrders.filter(o=>o.status==="approved");
    const pending  = adminOrders.filter(o=>o.status==="pending");
    const rejected = adminOrders.filter(o=>o.status==="rejected");
    const totalRevenue = approved.reduce((s,o)=>s+(o.total||0),0);
    const now=new Date(); const ms=new Date(now.getFullYear(),now.getMonth(),1).getTime();
    const monthRevenue = approved.filter(o=>(o.createdAt||0)>=ms).reduce((s,o)=>s+(o.total||0),0);
    const bookCounts = {};
    approved.forEach(o=>(o.items||[]).forEach(it=>{
      if (!bookCounts[it.title]) bookCounts[it.title]={title:it.title,count:0};
      bookCounts[it.title].count+=it.qty;
    }));
    const topBooks = Object.values(bookCounts).sort((a,b)=>b.count-a.count).slice(0,5);
    return {approved:approved.length,pending:pending.length,rejected:rejected.length,totalRevenue,monthRevenue,topBooks};
  })();

  const filteredOrders = adminOrders.filter(o=>{
    const q=orderSearch.toLowerCase();
    return !q||o.name?.toLowerCase().includes(q)||o.phone?.includes(q)||o.txId?.toLowerCase().includes(q);
  });
  const filteredAdminBooks = books.filter(b=>{
    const q=adminSearch.toLowerCase();
    return !q||b.title?.toLowerCase().includes(q)||b.author?.toLowerCase().includes(q);
  });

  // ─────────────────────────────────────────────────────────
  // COMPOSANT CARTE LIVRE
  // ─────────────────────────────────────────────────────────
  const BookCard = ({ b, admin }) => (
    <div className="card" onClick={() => { setDetailBook(b); setModal("detail"); }}>
      <div className="card-cover">
        {b.coverImage
          ? <><img src={b.coverImage} alt={b.title} className="card-cover-img" loading="lazy"/><div className="card-cover-overlay"/></>
          : <><span className="emo">{b.emoji||"📚"}</span><span className="init">{b.title?.[0]}</span></>}
        {b.featured && !isNew7d(b.createdAt) && <span className="featured-badge">⭐ Coup de cœur</span>}
        {isNew7d(b.createdAt) && <span className="new-badge">🆕 Nouveau</span>}
        {b.hasFile && <span className="has-file-badge">PDF ✓</span>}
        <button className="wish-btn" onClick={e=>{e.stopPropagation();toggleWish(b.fbKey);}}>
          {wishlist.includes(b.fbKey)?"❤️":"🤍"}
        </button>
      </div>
      <div className="card-body">
        <div className="cat-tag">{CAT_ICONS[b.cat]||""} {b.cat}</div>
        <div className="title">{b.title}</div>
        <div className="author">{b.author}</div>
        <div className="card-foot">
          <div>
            <div className="price">{b.price}</div>
            <div className="stock-lbl">{b.hasFile?"📥 Téléchargement immédiat":"⏳ Bientôt dispo"}</div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:".3rem"}}>
            <button className="add-btn" onClick={e=>{e.stopPropagation();addCart(b);}}>Acheter</button>
            {admin && (
              <div style={{display:"flex",gap:".25rem"}}>
                <button className="btn btn-ghost btn-sm" title="Modifier" onClick={e=>{e.stopPropagation();openEdit(b);}}>✏️</button>
                <button className="btn btn-ghost btn-sm" title={b.featured?"Retirer":"Mettre en avant"} onClick={e=>{e.stopPropagation();toggleFeatured(b);}}>
                  {b.featured?"⭐":"☆"}
                </button>
                <button className="btn btn-red btn-sm" title="Supprimer" onClick={e=>{e.stopPropagation();delBook(b);}}>🗑️</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────
  return (
    <>
      <style>{CSS}</style>

      {/* ── NAV ── */}
      <nav className="nav">
        <div className="logo" onClick={()=>setView("home")}>Lib<em>rairie</em> YO</div>
        <div className="nav-right">
          <button className="btn btn-ghost btn-sm" onClick={()=>{ setMyOrders(null); setCheckPhone(""); setCheckPin(""); setView("check"); }}>
            📦 Commandes
          </button>
          {wishlist.length>0&&(
            <button className="btn btn-ghost btn-sm" onClick={()=>{ setActiveCat("__wish__"); setSearch(""); setView("home"); }}>
              ❤️ {wishlist.length}
            </button>
          )}
          {isAdmin ? (
            <>
              <button className="btn btn-gold btn-sm" onClick={()=>{ setView("admin"); setAdminTab("stats"); }}>
                ⚙️ Admin{pendingCount>0?` (${pendingCount})`:""}
              </button>
              <button className="btn btn-ghost btn-sm" onClick={openAdd}>+ Livre</button>
              <button className="btn btn-ghost btn-sm" onClick={doLogout}>Quitter</button>
            </>
          ) : (
            <button className="btn btn-ghost btn-sm" onClick={()=>setModal("login")}>🔐</button>
          )}
          <button className="cart-btn" onClick={()=>setCartOpen(true)}>
            🛒{cartCount>0&&<span className="badge">{cartCount}</span>}
          </button>
        </div>
      </nav>

      {isAdmin&&(
        <div className="admin-bar">
          <span>👑 Admin · Firebase sync actif{pendingCount>0&&<strong style={{color:"#f08080",marginLeft:".5rem"}}>⚠️ {pendingCount} en attente</strong>}</span>
          <span style={{fontSize:".7rem",color:"var(--muted)"}}>Session expire dans 2h</span>
        </div>
      )}

      {/* ══════════════════════════════
          VUE HOME
      ══════════════════════════════ */}
      {view==="home"&&<>
        <section className="hero">
          <p className="hero-tag">Librairie numérique · Conakry, Guinée</p>
          <h1>Achetez. Téléchargez.<br/><i>Lisez maintenant.</i></h1>
          <p>Paiement Orange Money — accès activé après confirmation.</p>
          <div className="search-box">
            <span className="si">🔍</span>
            <input placeholder="Titre, auteur, genre…" value={search} onChange={e=>{ setSearch(e.target.value); setActiveCat(""); }}/>
          </div>
          <div className="cat-pills">
            {CAT_PILLS.map(p=>(
              <button key={p.val} className={`pill ${activeCat===p.val?"active":""}`}
                onClick={()=>{ setActiveCat(p.val); setSearch(""); }}>
                {p.label}
              </button>
            ))}
          </div>
        </section>

        {featuredBooks.length>0 && !search && !activeCat && (
          <div className="featured-section">
            <div className="featured-title">⭐ Coups de cœur</div>
            <div className="featured-scroll">
              {featuredBooks.map(b=>(
                <div key={b.fbKey} className="featured-card">
                  <BookCard b={b} admin={false}/>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="page">
          <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",flexWrap:"wrap",gap:".5rem",marginBottom:".6rem"}}>
            <div>
              <div className="grid-title">
                Catalogue
                {syncing && <span title="Synchronisation…" style={{marginLeft:".5rem",verticalAlign:"middle"}}><span className="sync-dot"/></span>}
              </div>
              <div className="grid-sub">{filtered.length} livre{filtered.length!==1?"s":""} disponible{filtered.length!==1?"s":""}</div>
            </div>
          </div>
          <div className="sort-bar">
            <span className="sort-lbl">Tri :</span>
            {SORT_OPTS.map(s=>(
              <button key={s.val} className={`sort-btn ${sort===s.val?"active":""}`} onClick={()=>setSort(s.val)}>
                {s.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="grid">{Array.from({length:8}).map((_,i)=><SkeletonCard key={i}/>)}</div>
          ) : filtered.length===0 ? (
            <div className="empty">
              <div style={{fontSize:"2.8rem",marginBottom:".8rem"}}>{activeCat==="__wish__"?"❤️":"📭"}</div>
              <p>{activeCat==="__wish__"?"Aucun favori pour l'instant":search||activeCat?"Aucun résultat":"Aucun livre pour l'instant"}</p>
            </div>
          ) : (
            <div className="grid">{filtered.map(b=><BookCard key={b.fbKey} b={b} admin={isAdmin}/>)}</div>
          )}
        </div>
      </>}

      {/* ══════════════════════════════
          VUE ADMIN
      ══════════════════════════════ */}
      {view==="admin"&&isAdmin&&(
        <div className="page">
          <div style={{display:"flex",alignItems:"center",gap:"1rem",marginBottom:"1.5rem",flexWrap:"wrap"}}>
            <button className="btn btn-ghost btn-sm" onClick={()=>setView("home")}>← Retour</button>
            <span style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:"1.35rem",color:"var(--cream)"}}>Administration</span>
          </div>
          <div className="admin-tabs">
            <button className={`tab ${adminTab==="stats"?"active":""}`}   onClick={()=>setAdminTab("stats")}>📊 Stats</button>
            <button className={`tab ${adminTab==="books"?"active":""}`}   onClick={()=>setAdminTab("books")}>📚 Catalogue</button>
            <button className={`tab ${adminTab==="orders"?"active":""}`}  onClick={()=>setAdminTab("orders")}>
              📦 Commandes{pendingCount>0&&<span className="badge" style={{marginLeft:".3rem"}}>{pendingCount}</span>}
            </button>
            <button className={`tab ${adminTab==="promos"?"active":""}`}  onClick={()=>setAdminTab("promos")}>🏷️ Promos</button>
          </div>

          {adminTab==="stats"&&<>
            <div className="stats-grid">
              {[
                {icon:"💰",val:fmtGNF(statsData.totalRevenue),lbl:"Revenus totaux"},
                {icon:"📅",val:fmtGNF(statsData.monthRevenue),lbl:"Ce mois-ci"},
                {icon:"📦",val:adminOrders.length,lbl:"Total commandes"},
                {icon:"⏳",val:statsData.pending,lbl:"En attente"},
                {icon:"✅",val:statsData.approved,lbl:"Approuvées"},
                {icon:"❌",val:statsData.rejected,lbl:"Rejetées"},
                {icon:"📚",val:books.length,lbl:"Livres publiés"},
                {icon:"❤️",val:books.filter(b=>b.featured).length,lbl:"Mis en avant"},
              ].map(s=>(
                <div key={s.lbl} className="stat-card">
                  <div className="stat-icon">{s.icon}</div>
                  <div className="stat-val">{s.val}</div>
                  <div className="stat-lbl">{s.lbl}</div>
                </div>
              ))}
            </div>
            {statsData.topBooks.length>0&&<>
              <div className="grid-title" style={{marginBottom:"1rem"}}>🏆 Top livres vendus</div>
              {statsData.topBooks.map((b,i)=>(
                <div key={b.title} className="top-book-row">
                  <span style={{color:"var(--gold)",fontWeight:700,fontSize:"1rem",width:20}}>#{i+1}</span>
                  <span style={{flex:1,color:"var(--text)",fontSize:".88rem"}}>{b.title}</span>
                  <span style={{color:"var(--gold)",fontWeight:700}}>{b.count} vendu{b.count>1?"s":""}</span>
                </div>
              ))}
            </>}
            {adminOrders.length>0&&(
              <div style={{marginTop:"1.5rem"}}>
                <button className="btn btn-ghost" onClick={()=>exportCSV(adminOrders)}>
                  📥 Exporter toutes les commandes (CSV)
                </button>
              </div>
            )}
          </>}

          {adminTab==="books"&&<>
            <div style={{display:"flex",gap:".7rem",marginBottom:"1.2rem",alignItems:"center",flexWrap:"wrap"}}>
              <button className="btn btn-gold" onClick={openAdd}>+ Nouveau livre</button>
              <input className="search-input" style={{flex:1,minWidth:200,marginBottom:0}} placeholder="Rechercher dans le catalogue…" value={adminSearch} onChange={e=>setAdminSearch(e.target.value)}/>
            </div>
            {filteredAdminBooks.length===0
              ?<div className="empty"><p>Aucun livre trouvé</p></div>
              :<div className="grid">{filteredAdminBooks.map(b=><BookCard key={b.fbKey} b={b} admin={true}/>)}</div>}
          </>}

          {adminTab==="orders"&&<>
            <div style={{display:"flex",gap:".7rem",marginBottom:"1rem",flexWrap:"wrap"}}>
              <input className="search-input" style={{flex:1,marginBottom:0}} placeholder="Rechercher par nom, téléphone, ID transaction…" value={orderSearch} onChange={e=>setOrderSearch(e.target.value)}/>
              <button className="btn btn-ghost btn-sm" onClick={()=>exportCSV(filteredOrders)}>📥 CSV</button>
            </div>
            {filteredOrders.length===0&&<div className="empty"><div style={{fontSize:"2rem",marginBottom:".5rem"}}>📭</div><p>Aucune commande</p></div>}
            {filteredOrders.map(order=>(
              <div key={order.fbKey} className="order-row">
                <div className="order-row-head">
                  <div className="order-meta">
                    <strong>{order.name}</strong><br/>
                    📞 {order.phone}<br/>
                    🕐 {fmtDate(order.createdAt)}
                    {order.promoCode&&<><br/>🏷️ Code : <span style={{color:"var(--gold)"}}>{order.promoCode}</span> (-{fmtGNF(order.discount||0)})</>}
                  </div>
                  <div style={{textAlign:"right"}}>
                    <span className={`status-badge status-${order.status}`}>
                      {order.status==="pending"?"⏳ En attente":order.status==="approved"?"✅ Approuvée":"❌ Rejetée"}
                    </span>
                    <div style={{marginTop:".4rem",color:"var(--gold)",fontWeight:700,fontSize:".9rem"}}>{fmtGNF(order.total)}</div>
                    {order.originalTotal&&order.originalTotal!==order.total&&(
                      <div style={{fontSize:".7rem",color:"var(--muted)",textDecoration:"line-through"}}>{fmtGNF(order.originalTotal)}</div>
                    )}
                  </div>
                </div>
                <div className="order-items">
                  {(order.items||[]).map((it,i)=>(
                    <div key={i}>{it.emoji||"📚"} {it.title} × {it.qty} — <span style={{color:"var(--gold)"}}>{fmtGNF(it.price)}</span></div>
                  ))}
                </div>
                <div><span style={{fontSize:".72rem",color:"var(--muted)"}}>ID transaction OM : </span><span className="order-tx">{order.txId}</span></div>
                {order.status==="pending"&&(
                  <div className="order-actions">
                    <button className="btn btn-green btn-sm" onClick={()=>setOrderStatus(order.fbKey,"approved")}>✅ Valider</button>
                    <button className="btn btn-red btn-sm"   onClick={()=>setOrderStatus(order.fbKey,"rejected")}>❌ Rejeter</button>
                  </div>
                )}
                {order.status!=="pending"&&order.reviewedAt&&(
                  <div style={{fontSize:".72rem",color:order.status==="approved"?"var(--green)":"#f08080",marginTop:".5rem"}}>
                    {order.status==="approved"?"✅ Validé":"❌ Rejeté"} le {fmtDate(order.reviewedAt)}
                  </div>
                )}
              </div>
            ))}
          </>}

          {adminTab==="promos"&&<>
            <div className="promo-form">
              <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:"1.1rem",color:"var(--cream)",marginBottom:"1rem"}}>🏷️ Créer un code promo</div>
              <div className="fr">
                <div className="fg">
                  <label className="fl">Code</label>
                  <input className="fi" style={{textTransform:"uppercase"}} value={promoForm.code}
                    onChange={e=>setPromoForm(p=>({...p,code:e.target.value.toUpperCase()}))} placeholder="EX: YO20"/>
                </div>
                <div className="fg">
                  <label className="fl">Réduction</label>
                  <input className="fi" type="number" value={promoForm.discount}
                    onChange={e=>setPromoForm(p=>({...p,discount:e.target.value}))} placeholder="20"/>
                </div>
              </div>
              <div className="fr">
                <div className="fg">
                  <label className="fl">Type</label>
                  <select className="fs" value={promoForm.type} onChange={e=>setPromoForm(p=>({...p,type:e.target.value}))}>
                    <option value="percent">% Pourcentage</option>
                    <option value="fixed">Montant fixe (GNF)</option>
                  </select>
                </div>
                <div className="fg">
                  <label className="fl">Utilisations max</label>
                  <input className="fi" type="number" value={promoForm.maxUses}
                    onChange={e=>setPromoForm(p=>({...p,maxUses:e.target.value}))}/>
                </div>
              </div>
              <button className="btn btn-gold" onClick={addPromoCode}>+ Créer le code</button>
            </div>
            {promoCodes.length===0&&<div className="empty"><p>Aucun code promo créé</p></div>}
            {[...promoCodes].sort((a,b)=>(b.createdAt||0)-(a.createdAt||0)).map(p=>(
              <div key={p.fbKey} className="promo-code-row">
                <div className="promo-code-label" style={{color:p.active?"var(--gold)":"var(--muted)"}}>{p.code}</div>
                <div style={{flex:1,fontSize:".8rem",color:"var(--muted)"}}>
                  {p.type==="percent"?`-${p.discount}%`:`-${fmtGNF(p.discount)}`}
                  {" · "}{p.uses||0}/{p.maxUses||"∞"} utilisations
                </div>
                <span className={`status-badge ${p.active?"status-approved":"status-rejected"}`}>
                  {p.active?"Actif":"Inactif"}
                </span>
                <div style={{display:"flex",gap:".4rem"}}>
                  <button className="btn btn-ghost btn-sm" onClick={()=>togglePromo(p)}>{p.active?"Désactiver":"Activer"}</button>
                  <button className="btn btn-red btn-sm"   onClick={()=>deletePromo(p)}>🗑️</button>
                </div>
              </div>
            ))}
          </>}
        </div>
      )}

      {/* ══════════════════════════════
          VUE PENDING
      ══════════════════════════════ */}
      {view==="pending"&&pendingOrder&&(
        <div className="pending-page">
          <div className="big-icon">⏳</div>
          <h2>Commande enregistrée !</h2>
          <p>Elle sera activée après vérification de votre paiement Orange Money.<br/>Durée habituelle : <strong style={{color:"var(--cream)"}}>quelques heures</strong>.</p>
          <div className="info-box">
            <div>👤 <strong>{pendingOrder.name}</strong></div>
            <div>📞 <strong>{pendingOrder.phone}</strong></div>
            <div>💰 <strong>{fmtGNF(pendingOrder.total)}</strong>
              {pendingOrder.discount>0&&<span style={{color:"var(--green)",fontSize:".8rem",marginLeft:".5rem"}}>(-{fmtGNF(pendingOrder.discount)})</span>}
            </div>
            <div>🔖 TX OM : <strong style={{fontFamily:"monospace"}}>{pendingOrder.txId}</strong></div>
          </div>
          <p style={{fontSize:".82rem",marginBottom:".5rem"}}>Gardez votre <strong style={{color:"var(--cream)"}}>PIN</strong> pour accéder à vos livres :</p>
          <div className="pin-highlight">📌 PIN : {pendingOrder.pin}</div>
          <div style={{display:"flex",gap:".5rem",marginBottom:"1rem"}}>
            <button className="btn btn-gold" style={{flex:1}}
              onClick={()=>{ setCheckPhone(pendingOrder.phone); setCheckPin(pendingOrder.pin); setView("check"); }}>
              📦 Voir ma commande
            </button>
            <button className="copy-sum" onClick={()=>copyOrderSummary(pendingOrder)}>📋 Copier</button>
          </div>
          <button className="btn btn-ghost" style={{width:"100%"}} onClick={()=>setView("home")}>← Retour au catalogue</button>
        </div>
      )}

      {/* ══════════════════════════════
          VUE MES COMMANDES
      ══════════════════════════════ */}
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
            <input className="fi pin-input" type="password" maxLength={4} value={checkPin}
              onChange={e=>setCheckPin(e.target.value.replace(/\D/g,""))}
              placeholder="••••" onKeyDown={e=>e.key==="Enter"&&checkMyOrders()}/>
          </div>
          <button className="btn btn-gold" style={{width:"100%",marginBottom:"1.2rem"}} onClick={checkMyOrders} disabled={checkingOrders}>
            {checkingOrders?<><span className="spin">⚙️</span> Recherche…</>:"🔍 Afficher mes commandes"}
          </button>
          {myOrders!==null&&myOrders.length===0&&(
            <div style={{textAlign:"center",color:"var(--muted)",padding:"2rem 0"}}>Aucune commande trouvée avec ces identifiants.</div>
          )}
          {(myOrders||[]).map(order=>(
            <div key={order.fbKey} className="dl-card">
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:".6rem"}}>
                <div style={{fontSize:".76rem",color:"var(--muted)"}}>{fmtDate(order.createdAt)}</div>
                <span className={`status-badge status-${order.status}`}>
                  {order.status==="pending"?"⏳ En attente":order.status==="approved"?"✅ Approuvée":"❌ Rejetée"}
                </span>
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
                    const book=books.find(b=>b.fbKey===it.fbKey);
                    return (
                      <div key={i} style={{marginBottom:".5rem"}}>
                        <div style={{fontSize:".79rem",color:"var(--text)",marginBottom:".3rem"}}>{it.emoji||"📚"} {it.title}</div>
                        {book?.hasFile
                          ?<div className="dl-formats">
                            <button className="btn btn-green btn-sm" onClick={()=>downloadBook(book)}>⬇️ Télécharger</button>
                            <button className="btn btn-outline btn-sm" onClick={()=>readOnline(book)}>👁️ Lire en ligne</button>
                          </div>
                          :<p style={{color:"var(--muted)",fontSize:".74rem"}}>⏳ Fichier pas encore disponible.</p>}
                      </div>
                    );
                  })}
                </div>
              )}
              {order.status==="rejected"&&(
                <div style={{fontSize:".77rem",color:"#f08080"}}>❌ Commande rejetée.{" "}
                  <a href={`https://wa.me/${WA_NUMBER}`} style={{color:"var(--gold)"}} target="_blank" rel="noreferrer">Contacter le support →</a>
                </div>
              )}
              {order.status==="pending"&&(
                <div style={{fontSize:".77rem",color:"var(--orange)",lineHeight:1.5}}>
                  ⏳ Paiement en cours de vérification — revenez dans quelques heures.<br/>
                  <span style={{fontSize:".7rem",color:"var(--muted)"}}>TX : {order.txId}</span>
                </div>
              )}
            </div>
          ))}
          <button className="btn btn-ghost" style={{width:"100%",marginTop:".8rem"}} onClick={()=>setView("home")}>← Retour au catalogue</button>
        </div>
      )}

      {/* ══════════════════════════════
          PANIER (sidebar)
      ══════════════════════════════ */}
      {cartOpen&&<div className="co" onClick={()=>setCartOpen(false)}/>}
      <div className={`cart-side ${cartOpen?"open":""}`}>
        <div className="ch">
          <span className="ct">Panier 🛒</span>
          <button className="mc" onClick={()=>setCartOpen(false)}>✕</button>
        </div>
        <div className="ci-list">
          {cart.length===0
            ?<div style={{color:"var(--muted)",textAlign:"center",marginTop:"3rem"}}><div style={{fontSize:"2rem",marginBottom:".5rem"}}>🛒</div>Panier vide</div>
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
        {cart.length>0&&(
          <div className="cf">
            <div className="ctotal"><span>Total</span><span>{fmtGNF(cartTotal)}</span></div>
            <button className="btn btn-gold" style={{width:"100%"}}
              onClick={()=>{ setCartOpen(false); setModal("checkout"); }}>
              Commander →
            </button>
          </div>
        )}
      </div>

      {/* ══════════════════════════════
          MODALS
      ══════════════════════════════ */}
      {modal&&(
        <div className="overlay" onClick={e=>{ if(e.target===e.currentTarget) setModal(null); }}>

          {/* ── LOGIN ── */}
          {modal==="login"&&(
            <div className="modal" style={{maxWidth:340}}>
              <button className="mc" onClick={()=>setModal(null)}>✕</button>
              <h2>🔐 Admin</h2>
              <div className="fg">
                <label className="fl">Mot de passe</label>
                <input className="fi" type="password" value={loginPass}
                  onChange={e=>{ setLoginPass(e.target.value); setLoginErr(""); }}
                  onKeyDown={e=>e.key==="Enter"&&doLogin()} placeholder="••••••••" autoFocus/>
                {loginErr&&<div className="err">{loginErr}</div>}
              </div>
              <div className="fa">
                <button className="btn btn-ghost" onClick={()=>setModal(null)}>Annuler</button>
                <button className="btn btn-gold"  onClick={doLogin}>Connexion</button>
              </div>
            </div>
          )}

          {/* ── DÉTAIL LIVRE — avec pages séparées et description formatée ── */}
          {modal==="detail"&&detailBook&&(
            <div className="modal" style={{maxWidth:560}}>
              <button className="mc" onClick={()=>setModal(null)}>✕</button>
              <div style={{display:"flex",gap:"1.2rem",marginBottom:"1rem",flexWrap:"wrap"}}>
                <div className="detail-cover">
                  {detailBook.coverImage
                    ?<img src={detailBook.coverImage} alt={detailBook.title}/>
                    :<span style={{fontSize:"2.5rem"}}>{detailBook.emoji||"📚"}</span>}
                </div>
                <div style={{flex:1,minWidth:180}}>
                  <div className="cat-tag">{CAT_ICONS[detailBook.cat]||""} {detailBook.cat}</div>
                  {isNew7d(detailBook.createdAt)&&(
                    <span style={{background:"var(--om)",color:"#fff",fontSize:".62rem",fontWeight:700,padding:".12rem .4rem",borderRadius:4,marginBottom:".5rem",display:"inline-block"}}>🆕 NOUVEAU</span>
                  )}
                  <div className="detail-title">{detailBook.title}</div>
                  <div className="detail-author">{detailBook.author}</div>
                  <div className="detail-price">{detailBook.price}</div>

                  {/* ── MÉTADONNÉES : pages + disponibilité ── */}
                  <div className="detail-meta-row">
                    {detailBook.pages && (
                      <div className="detail-meta-chip">
                        📄 <strong>{detailBook.pages.toLocaleString("fr-FR")}</strong>&nbsp;pages
                      </div>
                    )}
                    <div className="detail-meta-chip">
                      {detailBook.hasFile
                        ? <><span style={{color:"var(--green)"}}>✅</span>&nbsp;<strong>PDF disponible</strong></>
                        : <><span>⏳</span>&nbsp;Bientôt dispo</>}
                    </div>
                  </div>

                  <div style={{display:"flex",gap:".5rem",flexWrap:"wrap",marginTop:".5rem"}}>
                    <button className="btn btn-gold" onClick={()=>{ addCart(detailBook); setModal(null); }}>🛒 Acheter</button>
                    <button className="btn btn-ghost" onClick={()=>toggleWish(detailBook.fbKey)}>
                      {wishlist.includes(detailBook.fbKey)?"❤️ Favori":"🤍 Favoris"}
                    </button>
                  </div>
                </div>
              </div>

              {/* ── DESCRIPTION FORMATÉE ── */}
              {detailBook.desc&&(
                <div className="detail-desc-box">
                  <div className="detail-desc-label">📝 À propos de ce livre</div>
                  <FormatDesc text={detailBook.desc}/>
                </div>
              )}
            </div>
          )}

          {/* ── AJOUT / MODIFICATION LIVRE ── */}
          {(modal==="add"||modal==="edit")&&(
            <div className="modal">
              <button className="mc" onClick={()=>setModal(null)}>✕</button>
              <h2>{modal==="add"?"📚 Ajouter un livre":"✏️ Modifier"}</h2>

              {/* Zone upload PDF */}
              <div className="fg">
                <label className="fl">
                  📁 Fichier PDF (max 9 Mo) —{" "}
                  <span style={{color:"var(--gold)"}}>
                    {aiStep==="done"?"✅ IA a tout rempli !":"l'IA remplit tout automatiquement"}
                  </span>
                </label>
                {!uploadedFile?(
                  <div className="upload-zone">
                    <input type="file" accept=".pdf,.epub,.txt" onChange={handleFileChange}/>
                    <div className="uico">📂</div>
                    <p>Glissez ou cliquez<br/><strong>PDF · EPUB · TXT</strong></p>
                  </div>
                ):(
                  <div className="file-ready">
                    <span>✅</span>
                    <span className="fname">{uploadedFile.name}</span>
                    <span className="fsize">{uploadedFile.size}</span>
                    <button className="file-remove" onClick={()=>{ setUploadedFile(null); setExtractedCover(null); setAiStep(""); }}>✕</button>
                  </div>
                )}
                {modal==="edit"&&editB?.hasFile&&!uploadedFile&&(
                  <p style={{fontSize:".7rem",color:"var(--green)",marginTop:".3rem"}}>✅ Fichier déjà associé.</p>
                )}
              </div>

              {/* Progression IA */}
              {aiLoading&&(
                <div className="ai-progress">
                  <div className="ai-progress-title">
                    <span className="spin">⚙️</span> Analyse en cours…
                  </div>
                  <div className="ai-progress-steps">
                    <div className={`ai-step ${aiStep==="cover"?"active":aiStep==="analyze"||aiStep==="done"?"done":""}`}>
                      {aiStep==="cover"?"⏳":"✅"} Extraction de la couverture et comptage des pages
                    </div>
                    <div className={`ai-step ${aiStep==="analyze"?"active":aiStep==="done"?"done":""}`}>
                      {aiStep==="done"?"✅":aiStep==="analyze"?"⏳":"○"} Analyse IA : titre, auteur, catégorie, description
                    </div>
                  </div>
                </div>
              )}

              {/* Aperçu couverture */}
              {extractedCover&&!aiLoading&&(
                <div className="ai-analysis-box">
                  <div style={{fontSize:".74rem",color:"var(--gold)",marginBottom:".4rem"}}>📸 Couverture extraite automatiquement</div>
                  <img src={extractedCover} alt="Couverture" className="cover-preview"/>
                </div>
              )}

              {/* Champs pré-remplis */}
              <div className="fg">
                <label className="fl">Titre *</label>
                <input className={`fi ${formFieldErrs.title?"err-field":""}`} name="title" value={form.title} onChange={chForm} onBlur={handleBlur} placeholder="Titre du livre"/>
                {formFieldErrs.title&&<div className="field-err">{formFieldErrs.title}</div>}
              </div>
              <div className="fg">
                <label className="fl">Auteur *</label>
                <input className={`fi ${formFieldErrs.author?"err-field":""}`} name="author" value={form.author} onChange={chForm} onBlur={handleBlur} placeholder="Nom de l'auteur"/>
                {formFieldErrs.author&&<div className="field-err">{formFieldErrs.author}</div>}
              </div>
              <div className="fr">
                <div className="fg">
                  <label className="fl">Catégorie</label>
                  <select className="fs" name="cat" value={form.cat} onChange={chForm}>
                    {CATS.map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="fg">
                  <label className="fl">Emoji</label>
                  <select className="fs" name="emoji" value={form.emoji} onChange={chForm}>
                    {EMOJIS.map(e=><option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
              </div>

              {/* Nombre de pages (pré-rempli automatiquement) */}
              <div className="fr">
                <div className="fg">
                  <label className="fl">Nombre de pages</label>
                  <input className="fi" name="pages" type="number" min="1" value={form.pages} onChange={chForm}
                    placeholder="Ex: 320" style={{fontFamily:"monospace"}}/>
                  {form.pages&&<div style={{fontSize:".68rem",color:"var(--green)",marginTop:".2rem"}}>✅ Rempli automatiquement</div>}
                </div>
                <div className="fg">
                  <label className="fl">Stock</label>
                  <input className="fi" name="stock" type="number" min="0" value={form.stock} onChange={chForm}/>
                </div>
              </div>

              {/* Description (pré-remplie avec la formule) */}
              <div className="fg">
                <label className="fl">Description</label>
                <textarea className="ft" name="desc" value={form.desc} onChange={chForm}
                  placeholder="Sera générée automatiquement par l'IA…" style={{minHeight:160}}/>
              </div>

              {/* ── PRIX : le seul champ obligatoire à remplir manuellement ── */}
              <div className="prix-highlight">
                <label className="fl">💰 Prix (GNF) * — À vous de fixer</label>
                <input className={`fi ${formFieldErrs.num?"err-field":""}`}
                  name="num" type="number" value={form.num} onChange={chForm}
                  placeholder="Ex: 35000" autoComplete="off"
                  style={{fontSize:"1.1rem",fontWeight:700}}/>
                {form.num&&<div className="prix-tip">→ Affiché : <strong style={{color:"var(--gold)"}}>{Number(form.num).toLocaleString("fr-FR")} GNF</strong></div>}
                {formFieldErrs.num&&<div className="field-err">{formFieldErrs.num}</div>}
              </div>

              {formErr&&<div className="err">{formErr}</div>}

              <div className="fa">
                <button className="btn btn-ghost" onClick={()=>setModal(null)}>Annuler</button>
                <button className="btn btn-gold" onClick={saveBook}
                  disabled={aiLoading || !form.num}
                  title={!form.num?"Saisissez le prix pour publier":""}>
                  {aiLoading
                    ? <><span className="spin">⚙️</span> IA en cours…</>
                    : !form.num
                      ? "⚠️ Prix requis"
                      : modal==="add" ? "Publier →" : "Enregistrer →"}
                </button>
              </div>
            </div>
          )}

          {/* ── SUPPRESSION ── */}
          {modal==="del"&&(
            <div className="modal" style={{maxWidth:360}}>
              <h2>🗑️ Supprimer ?</h2>
              <p style={{color:"var(--muted)",marginBottom:"1.4rem"}}>
                Supprimer <strong style={{color:"var(--cream)"}}>&ldquo;{editB?.title}&rdquo;</strong> ? Cette action est irréversible.
              </p>
              <div className="fa">
                <button className="btn btn-ghost" onClick={()=>setModal(null)}>Annuler</button>
                <button className="btn btn-red"   onClick={confirmDel}>Supprimer</button>
              </div>
            </div>
          )}

          {/* ── CHECKOUT ── */}
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
                {appliedPromo&&(
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:".82rem",color:"var(--green)",paddingTop:".3rem"}}>
                    <span>🏷️ Code {appliedPromo.code}</span>
                    <span>-{appliedPromo.type==="percent"?appliedPromo.discount+"%":fmtGNF(appliedPromo.discount)}</span>
                  </div>
                )}
                {appliedPromo&&(
                  <div style={{display:"flex",justifyContent:"space-between",fontWeight:700,paddingTop:".3rem",borderTop:"1px solid var(--bd)",marginTop:".3rem"}}>
                    <span>Total final</span><span style={{color:"var(--gold)"}}>{fmtGNF(discountedTotal)}</span>
                  </div>
                )}
              </div>
              {!appliedPromo?(
                <div className="fg">
                  <label className="fl">Code promo (optionnel)</label>
                  <div className="promo-row">
                    <input className="fi" style={{flex:1}} value={promoInput}
                      onChange={e=>setPromoInput(e.target.value.toUpperCase())} placeholder="CODE"/>
                    <button className="btn btn-ghost" onClick={applyPromo} disabled={!promoInput.trim()}>Appliquer</button>
                  </div>
                </div>
              ):(
                <div className="promo-applied">
                  <span>🏷️ Code "{appliedPromo.code}" appliqué</span>
                  <button style={{background:"none",border:"none",color:"var(--muted)",cursor:"pointer",fontSize:".85rem"}}
                    onClick={()=>{ setAppliedPromo(null); setPromoInput(""); }}>✕</button>
                </div>
              )}
              <div className="om-box">
                <span style={{fontSize:"1.7rem"}}>🟠</span>
                <div className="om-info">
                  <div className="om-title">Orange Money</div>
                  <div className="om-num">{OM_NUMBER}</div>
                  <div className="om-sub">Envoyez {fmtGNF(discountedTotal)}</div>
                </div>
                <button className="om-copy" onClick={copyOM}>Copier</button>
              </div>
              {[["1","Ouvrez Orange Money"],["2","Transfert → "+OM_NUMBER],["3","Montant : "+fmtGNF(discountedTotal)],["4","Notez le code SMS de confirmation"],["5","Remplissez le formulaire ci-dessous"]].map(([n,t])=>(
                <div key={n} className="step"><span className="sn">{n}</span><span>{t}</span></div>
              ))}
              <hr className="div"/>
              <div className="fg">
                <label className="fl">Nom complet *</label>
                <input className={`fi ${checkErrs.name?"err-field":""}`} value={checkF.name}
                  onChange={e=>{ setCheckF(p=>({...p,name:e.target.value})); setCheckErrs(p=>({...p,name:""})); }} placeholder="Votre nom"/>
                {checkErrs.name&&<div className="field-err">{checkErrs.name}</div>}
              </div>
              <div className="fg">
                <label className="fl">Téléphone *</label>
                <input className={`fi ${checkErrs.phone?"err-field":""}`} value={checkF.phone}
                  onChange={e=>{ setCheckF(p=>({...p,phone:e.target.value})); setCheckErrs(p=>({...p,phone:""})); }} placeholder="+224 6XX XXX XXX"/>
                {checkErrs.phone&&<div className="field-err">{checkErrs.phone}</div>}
              </div>
              <div className="fg">
                <label className="fl">N° confirmation Orange Money *</label>
                <input className={`fi ${checkErrs.txId?"err-field":""}`} style={{fontFamily:"monospace",letterSpacing:".04em"}} value={checkF.txId}
                  onChange={e=>{ setCheckF(p=>({...p,txId:e.target.value})); setCheckErrs(p=>({...p,txId:""})); }} placeholder="ex: CI241203.1234.A12345"/>
                <div style={{fontSize:".68rem",color:"var(--muted)",marginTop:".25rem"}}>📱 Code reçu par SMS après le transfert</div>
                {checkErrs.txId&&<div className="field-err">{checkErrs.txId}</div>}
              </div>
              <div className="fg">
                <label className="fl">PIN secret à 4 chiffres * <span style={{color:"var(--gold)"}}>(notez-le !)</span></label>
                <input className={`fi pin-input ${checkErrs.pin?"err-field":""}`} type="password" maxLength={4} value={checkF.pin}
                  onChange={e=>{ setCheckF(p=>({...p,pin:e.target.value.replace(/\D/g,"")})); setCheckErrs(p=>({...p,pin:""})); }} placeholder="••••"/>
                <div style={{fontSize:".68rem",color:"var(--muted)",marginTop:".25rem"}}>🔒 Ce PIN + votre téléphone protègent l'accès à vos téléchargements</div>
                {checkErrs.pin&&<div className="field-err">{checkErrs.pin}</div>}
              </div>
              <div style={{background:"rgba(230,126,34,.08)",border:"1px solid rgba(230,126,34,.2)",borderRadius:7,padding:".65rem .9rem",fontSize:".74rem",color:"var(--muted)",marginBottom:".9rem"}}>
                ⚠️ <strong style={{color:"var(--text)"}}>Accès après vérification</strong> — commande activée une fois le paiement confirmé (quelques heures).
              </div>
              <div className="fa">
                <button className="btn btn-ghost" onClick={()=>setModal(null)}>Retour</button>
                <button className="btn btn-om"    onClick={doCheckout}>📤 Soumettre la commande</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── BOUTON WHATSAPP FLOTTANT ── */}
      <a href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent("Bonjour, j'ai besoin d'aide avec ma commande Librairie YO.")}`}
        className="wa-fab" target="_blank" rel="noreferrer" title="Support WhatsApp">
        <div className="wa-tooltip">💬 Support WhatsApp</div>
        💬
      </a>

      {/* ── TOAST ── */}
      {toast&&<div className={`toast ${toast.type}`}>{toast.msg}</div>}
    </>
  );
}
