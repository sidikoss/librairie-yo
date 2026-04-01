import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, push, remove, update, get } from "firebase/database";

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

const ADMIN_PASSWORD = "papiraro2143";
const OM_NUMBER = "224613908784";

// ─────────────────────────────────────────────────────────────
// 🔔 TELEGRAM — Remplis ces deux valeurs (voir guide ci-dessous)
// ─────────────────────────────────────────────────────────────
const TELEGRAM_BOT_TOKEN = "VOTRE_BOT_TOKEN"; // ex: 7123456789:AAHxxxxxxxxxxxxxxxx
const TELEGRAM_CHAT_ID   = "VOTRE_CHAT_ID";   // ex: 123456789

// ─────────────────────────────────────────────────────────────
// CATEGORIES
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
  "Roman":"📖","Science":"🔬","Histoire":"📜","Philosophie":"🧠",
  "Manga":"🎌","Religion & Spiritualité":"🕌","Développement personnel":"🚀",
  "Informatique":"💻","Jeunesse":"🌟","Poésie":"🎭","Biographie":"👤",
  "Entrepreneur":"💼","Étudiant":"🎓","Lycéen":"📐",
  "Finance & Investissement":"💰","Santé & Bien-être":"🏃",
  "Art & Créativité":"🎨","Géopolitique":"🌍","Langues":"🗣️",
  "Psychologie":"🧬","Autre":"📚"
};

const CAT_PILLS = [
  { label:"Tout", val:"" },
  { label:"🎓 Étudiant",    val:"Étudiant" },
  { label:"📐 Lycéen",      val:"Lycéen" },
  { label:"💼 Entrepreneur",val:"Entrepreneur" },
  { label:"🚀 Dev perso",   val:"Développement personnel" },
  { label:"🧠 Philo",       val:"Philosophie" },
  { label:"💻 Tech",        val:"Informatique" },
  { label:"💰 Finance",     val:"Finance & Investissement" },
  { label:"📖 Roman",       val:"Roman" },
];

const EMOJIS = ["📚","📖","✨","🌙","💡","🔥","⭐","🌿","🦋","🎯","💰","🌹","🗺️","⚔️","🔮","🧠","🏆","⚡","🌍","🕌"];

// ─────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────
const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');`;

const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#0f0d0b;--s1:#1a1714;--s2:#231f1b;--bd:#2e2925;
  --gold:#c9963a;--gl:#e8b85a;--cream:#f5ead8;--text:#e8ddd0;
  --muted:#8a7f74;--red:#c0392b;--om:#ff6600;--green:#27ae60;--orange:#e67e22;
}
body{background:var(--bg);color:var(--text);font-family:'DM Sans',sans-serif;min-height:100vh}
.nav{position:sticky;top:0;z-index:100;height:60px;display:flex;align-items:center;justify-content:space-between;padding:0 1.5rem;background:rgba(15,13,11,.95);backdrop-filter:blur(10px);border-bottom:1px solid var(--bd)}
.logo{font-family:'Playfair Display',serif;font-size:1.35rem;font-weight:800;color:var(--cream);cursor:pointer}
.logo em{color:var(--gold);font-style:normal}
.nav-right{display:flex;gap:.5rem;align-items:center;flex-wrap:wrap}
.btn{display:inline-flex;align-items:center;gap:.35rem;padding:.42rem 1rem;border-radius:7px;border:none;font-family:'DM Sans';font-size:.82rem;font-weight:500;cursor:pointer;transition:all .18s;white-space:nowrap}
.btn-gold{background:var(--gold);color:#0f0d0b;font-weight:700}.btn-gold:hover{background:var(--gl)}
.btn-ghost{background:transparent;color:var(--muted);border:1px solid var(--bd)}.btn-ghost:hover{color:var(--text);border-color:var(--muted)}
.btn-red{background:var(--red);color:#fff}.btn-red:hover{background:#a93226}
.btn-om{background:var(--om);color:#fff;font-weight:700}.btn-om:hover{background:#e85c00}
.btn-green{background:var(--green);color:#fff;font-weight:700}.btn-green:hover{background:#219a52}
.btn-outline{background:transparent;color:var(--gold);border:1px solid var(--gold)}.btn-outline:hover{background:var(--gold);color:#0f0d0b}
.btn:disabled{opacity:.45;cursor:not-allowed}
.btn-sm{padding:.28rem .65rem;font-size:.75rem}
.cart-btn{position:relative;background:var(--s2);color:var(--text);border:1px solid var(--bd);padding:.4rem .9rem;border-radius:7px;cursor:pointer;font-size:.85rem;display:flex;align-items:center;gap:.4rem;transition:all .18s}
.cart-btn:hover{border-color:var(--gold);color:var(--gold)}
.badge{background:var(--gold);color:#0f0d0b;border-radius:50%;width:17px;height:17px;font-size:.65rem;font-weight:700;display:flex;align-items:center;justify-content:center}
.admin-bar{background:rgba(201,150,58,.08);border-bottom:1px solid rgba(201,150,58,.25);padding:.5rem 1.5rem;display:flex;align-items:center;justify-content:space-between;font-size:.78rem;color:var(--gold);flex-wrap:wrap;gap:.5rem}
.hero{text-align:center;padding:3.5rem 1.5rem 2rem;background:radial-gradient(ellipse at 50% 0%,rgba(201,150,58,.07) 0%,transparent 65%);border-bottom:1px solid var(--bd)}
.hero-tag{font-size:.7rem;letter-spacing:.3em;text-transform:uppercase;color:var(--gold);margin-bottom:.9rem}
.hero h1{font-family:'Playfair Display',serif;font-size:clamp(2rem,5.5vw,3.8rem);font-weight:800;color:var(--cream);line-height:1.1;margin-bottom:.8rem}
.hero h1 i{color:var(--gold);font-style:italic}
.hero p{color:var(--muted);font-size:.92rem;max-width:420px;margin:0 auto 1.6rem}
.search-box{max-width:380px;margin:0 auto .9rem;position:relative}
.search-box input{width:100%;background:var(--s2);border:1px solid var(--bd);color:var(--text);padding:.7rem 1rem .7rem 2.5rem;border-radius:8px;font-family:'DM Sans';font-size:.88rem;outline:none;transition:border-color .2s}
.search-box input:focus{border-color:var(--gold)}.search-box input::placeholder{color:var(--muted)}
.si{position:absolute;left:.8rem;top:50%;transform:translateY(-50%);color:var(--muted)}
.cat-pills{display:flex;gap:.4rem;overflow-x:auto;padding:.1rem .1rem .5rem;scrollbar-width:none;max-width:700px;margin:0 auto}
.cat-pills::-webkit-scrollbar{display:none}
.pill{background:var(--s2);border:1px solid var(--bd);color:var(--muted);padding:.25rem .7rem;border-radius:20px;font-size:.72rem;cursor:pointer;white-space:nowrap;transition:all .18s}
.pill:hover,.pill.active{background:rgba(201,150,58,.12);border-color:var(--gold);color:var(--gold)}
.page{padding:2rem 1.5rem;max-width:1100px;margin:0 auto}
.grid-title{font-family:'Playfair Display',serif;font-size:1.35rem;color:var(--cream);margin-bottom:.2rem}
.grid-sub{color:var(--muted);font-size:.78rem;margin-bottom:1.6rem}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(185px,1fr));gap:1.2rem}
.card{background:var(--s1);border:1px solid var(--bd);border-radius:10px;overflow:hidden;transition:transform .2s,box-shadow .2s}
.card:hover{transform:translateY(-3px);box-shadow:0 10px 32px rgba(0,0,0,.5)}
.card-cover{width:100%;aspect-ratio:3/4;background:linear-gradient(135deg,var(--s2),#2a2420);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.4rem;position:relative;overflow:hidden}
.card-cover-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:top}
.card-cover-overlay{position:absolute;inset:0;background:linear-gradient(to bottom,transparent 50%,rgba(0,0,0,.65) 100%)}
.emo{font-size:2.3rem;position:relative;z-index:1}
.init{font-family:'Playfair Display',serif;font-size:1.6rem;font-weight:800;color:var(--gold);opacity:.55;position:relative;z-index:1}
.has-file-badge{position:absolute;top:.5rem;right:.5rem;background:var(--green);color:#fff;font-size:.6rem;font-weight:700;padding:.15rem .4rem;border-radius:4px;z-index:2}
.card-body{padding:.8rem}
.cat-tag{font-size:.6rem;text-transform:uppercase;letter-spacing:.12em;color:var(--gold);margin-bottom:.22rem}
.title{font-family:'Playfair Display',serif;font-size:.93rem;font-weight:700;color:var(--cream);line-height:1.25;margin-bottom:.18rem;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.author{font-size:.73rem;color:var(--muted);margin-bottom:.6rem}
.card-foot{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:.4rem}
.price{font-weight:700;color:var(--gold);font-size:.98rem}
.stock-lbl{font-size:.63rem;color:var(--muted)}
.add-btn{background:var(--gold);color:#0f0d0b;border:none;border-radius:5px;padding:.3rem .65rem;font-size:.72rem;font-weight:700;cursor:pointer;transition:background .18s}
.add-btn:hover{background:var(--gl)}
.empty{text-align:center;padding:5rem 1rem;color:var(--muted)}
.overlay{position:fixed;inset:0;background:rgba(0,0,0,.78);backdrop-filter:blur(4px);z-index:200;display:flex;align-items:center;justify-content:center;padding:1rem}
.modal{background:var(--s1);border:1px solid var(--bd);border-radius:14px;padding:1.8rem;max-width:480px;width:100%;max-height:92vh;overflow-y:auto}
.modal h2{font-family:'Playfair Display',serif;font-size:1.3rem;color:var(--cream);margin-bottom:1.2rem}
.mc{float:right;background:none;border:none;color:var(--muted);cursor:pointer;font-size:1.2rem}
.fg{margin-bottom:.9rem}
.fl{display:block;font-size:.7rem;color:var(--muted);margin-bottom:.28rem;text-transform:uppercase;letter-spacing:.06em}
.fi,.fs,.ft{width:100%;background:var(--s2);border:1px solid var(--bd);color:var(--text);padding:.58rem .82rem;border-radius:7px;font-family:'DM Sans';font-size:.86rem;outline:none;transition:border-color .2s}
.fi:focus,.fs:focus,.ft:focus{border-color:var(--gold)}
.ft{resize:vertical;min-height:72px}.fs option{background:var(--s2)}
.fr{display:grid;grid-template-columns:1fr 1fr;gap:.7rem}
.fa{display:flex;gap:.6rem;justify-content:flex-end;margin-top:1.3rem}
.err{color:#f08080;font-size:.76rem;margin-top:.32rem}
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
.ai-row{display:flex;align-items:center;gap:.5rem;font-size:.76rem;color:var(--gold);margin:.3rem 0 .6rem;background:rgba(201,150,58,.07);padding:.4rem .7rem;border-radius:6px}
@keyframes spin{to{transform:rotate(360deg)}}
.spin{display:inline-block;animation:spin .9s linear infinite}
.loading-screen{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:60vh;gap:1rem;color:var(--muted)}
.loading-screen .big{font-size:2.5rem}
.cart-side{position:fixed;right:0;top:0;bottom:0;width:min(380px,100vw);background:var(--s1);border-left:1px solid var(--bd);z-index:300;padding:1.4rem;display:flex;flex-direction:column;transform:translateX(100%);transition:transform .28s ease}
.cart-side.open{transform:translateX(0)}
.co{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:299}
.ch{display:flex;justify-content:space-between;align-items:center;margin-bottom:1.3rem}
.ct{font-family:'Playfair Display',serif;font-size:1.2rem;color:var(--cream)}
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
.om-box{background:linear-gradient(135deg,#ff6600,#ff8c00);border-radius:10px;padding:.9rem 1.1rem;margin-bottom:1rem;display:flex;align-items:center;gap:.8rem}
.om-info{flex:1}
.om-title{font-weight:700;color:#fff;font-size:.88rem;margin-bottom:.1rem}
.om-num{font-family:'Playfair Display',serif;font-size:1.1rem;font-weight:800;color:#fff;letter-spacing:.04em}
.om-sub{font-size:.67rem;color:rgba(255,255,255,.8);margin-top:.1rem}
.om-copy{background:rgba(255,255,255,.25);border:none;border-radius:6px;padding:.32rem .6rem;font-size:.7rem;color:#fff;cursor:pointer;font-weight:600}
.om-copy:hover{background:rgba(255,255,255,.4)}
.step{display:flex;gap:.65rem;align-items:flex-start;margin-bottom:.48rem;font-size:.78rem;color:var(--muted)}
.sn{background:var(--om);color:#fff;border-radius:50%;width:19px;height:19px;font-size:.67rem;font-weight:700;flex-shrink:0;display:flex;align-items:center;justify-content:center;margin-top:.1rem}
.step strong{color:var(--text)}
hr.div{border:none;border-top:1px solid var(--bd);margin:1rem 0}
.toast{position:fixed;bottom:1.8rem;left:50%;transform:translateX(-50%);background:var(--s2);border:1px solid var(--bd);color:var(--text);padding:.6rem 1.3rem;border-radius:8px;font-size:.82rem;z-index:500;animation:tin .25s ease;box-shadow:0 8px 28px rgba(0,0,0,.45);white-space:nowrap;pointer-events:none}
.toast.ok{border-color:var(--green);color:#6fcf97}
.toast.er{border-color:var(--red);color:#f08080}
@keyframes tin{from{opacity:0;transform:translateX(-50%) translateY(8px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
.status-badge{display:inline-flex;align-items:center;gap:.3rem;padding:.18rem .55rem;border-radius:20px;font-size:.67rem;font-weight:700;text-transform:uppercase;letter-spacing:.04em}
.status-pending{background:rgba(230,126,34,.15);color:var(--orange);border:1px solid rgba(230,126,34,.3)}
.status-approved{background:rgba(39,174,96,.15);color:var(--green);border:1px solid rgba(39,174,96,.3)}
.status-rejected{background:rgba(192,57,43,.15);color:#f08080;border:1px solid rgba(192,57,43,.3)}
.pending-page{max-width:460px;margin:3rem auto;padding:0 1.5rem;text-align:center}
.pending-page .big-icon{font-size:3.5rem;margin-bottom:.9rem}
.pending-page h2{font-family:'Playfair Display',serif;font-size:1.8rem;color:var(--cream);margin-bottom:.6rem}
.pending-page p{color:var(--muted);font-size:.88rem;line-height:1.6;margin-bottom:1.3rem}
.info-box{background:rgba(201,150,58,.06);border:1px solid rgba(201,150,58,.2);border-radius:8px;padding:.85rem 1rem;font-size:.8rem;color:var(--muted);text-align:left;line-height:1.8;margin-bottom:1.3rem}
.info-box strong{color:var(--text)}
.pin-highlight{background:var(--s2);border:2px solid var(--gold);border-radius:8px;padding:.6rem 1rem;font-size:1.1rem;font-weight:700;color:var(--gold);letter-spacing:.2em;text-align:center;margin:.5rem 0 1rem;font-family:monospace}
.admin-tabs{display:flex;gap:.5rem;border-bottom:1px solid var(--bd);margin-bottom:1.6rem}
.tab{background:none;border:none;border-bottom:2px solid transparent;color:var(--muted);padding:.52rem .88rem;cursor:pointer;font-family:'DM Sans';font-size:.82rem;font-weight:500;transition:all .18s;margin-bottom:-1px}
.tab.active{color:var(--gold);border-bottom-color:var(--gold)}
.tab:hover:not(.active){color:var(--text)}
.order-row{background:var(--s1);border:1px solid var(--bd);border-radius:10px;padding:.95rem 1.1rem;margin-bottom:.85rem}
.order-row-head{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;margin-bottom:.55rem;flex-wrap:wrap}
.order-meta{font-size:.77rem;color:var(--muted);line-height:1.6}
.order-meta strong{color:var(--cream);font-size:.86rem}
.order-items{font-size:.77rem;color:var(--muted);margin-bottom:.65rem;line-height:1.5}
.order-tx{font-size:.73rem;background:var(--s2);border:1px solid var(--bd);border-radius:5px;padding:.22rem .55rem;color:var(--gold);font-family:monospace;display:inline-block;margin-top:.2rem}
.order-actions{display:flex;gap:.5rem;flex-wrap:wrap;margin-top:.8rem}
.search-orders{width:100%;background:var(--s2);border:1px solid var(--bd);color:var(--text);padding:.58rem .82rem;border-radius:7px;font-family:'DM Sans';font-size:.84rem;outline:none;margin-bottom:1.1rem;transition:border-color .2s}
.search-orders:focus{border-color:var(--gold)}
.check-page{max-width:420px;margin:3rem auto;padding:0 1.5rem}
.check-page h2{font-family:'Playfair Display',serif;font-size:1.7rem;color:var(--cream);margin-bottom:.5rem;text-align:center}
.dl-card{background:var(--s1);border:1px solid var(--bd);border-radius:12px;padding:1.3rem;margin-bottom:1.1rem}
.dl-formats{display:flex;gap:.5rem;flex-wrap:wrap}
.pin-input{letter-spacing:.3em;text-align:center;font-size:1.1rem;font-weight:700;font-family:monospace}
.cover-preview{width:100%;max-height:200px;object-fit:contain;object-position:top;border-radius:6px;margin-top:.5rem;border:1px solid var(--bd)}
.ai-analysis-box{background:rgba(201,150,58,.05);border:1px solid rgba(201,150,58,.18);border-radius:8px;padding:.8rem 1rem;margin-bottom:.9rem;font-size:.78rem;color:var(--muted)}
`;

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
function readFileAsBase64(file) {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(fr.result);
    fr.onerror = rej;
    fr.readAsDataURL(file);
  });
}

function fmtDate(ts) {
  if (!ts) return "";
  return new Date(ts).toLocaleString("fr-FR", { day:"2-digit", month:"2-digit", year:"numeric", hour:"2-digit", minute:"2-digit" });
}

async function loadPDFJS() {
  if (window.pdfjsLib) return window.pdfjsLib;
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    s.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      resolve(window.pdfjsLib);
    };
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

async function extractPDFCover(b64DataUrl) {
  try {
    const pdfjs = await loadPDFJS();
    const raw = atob(b64DataUrl.split(",")[1]);
    const bytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
    const pdf = await pdfjs.getDocument({ data: bytes }).promise;
    const page = await pdf.getPage(1);
    const vp0 = page.getViewport({ scale: 1 });
    const scale = Math.min(320 / vp0.width, 480 / vp0.height);
    const vp = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = vp.width;
    canvas.height = vp.height;
    await page.render({ canvasContext: canvas.getContext("2d"), viewport: vp }).promise;
    return canvas.toDataURL("image/jpeg", 0.72);
  } catch { return null; }
}

async function analyzeBookPDF(b64DataUrl) {
  try {
    const base64 = b64DataUrl.split(",")[1];
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 700,
        messages: [{
          role: "user",
          content: [
            { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } },
            { type: "text", text: `Analyse ce livre PDF et retourne UNIQUEMENT un objet JSON valide (sans backticks ni markdown) avec exactement ces champs:
{"title":"titre exact","author":"auteur complet","cat":"EXACTEMENT une parmi: ${CATS.join(", ")}","desc":"description vendeuse de 2-3 phrases en français qui donne envie d'acheter"}
Ne réponds QU'avec le JSON brut.` }
          ]
        }]
      })
    });
    const d = await r.json();
    const txt = d?.content?.[0]?.text?.trim() || "{}";
    return JSON.parse(txt.replace(/```[\w]*\n?|```/g, "").trim());
  } catch { return {}; }
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
  const msg = [
    `🛒 *Nouvelle commande — Librairie YO*`, ``,
    `👤 ${order.name}`, `📞 \`${order.phone}\``,
    `💰 *${(order.total||0).toLocaleString("fr-FR")} GNF*`,
    `🔖 TX OM : \`${order.txId}\``, ``,
    `📚 *Livres :*`,
    ...(order.items||[]).map(i => `  • ${i.title} ×${i.qty}`),
    ``, `🔗 [Valider sur le panel admin](https://librairie-yo-gui.vercel.app/)`
  ].join("\n");
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: msg, parse_mode: "Markdown" })
    });
  } catch {}
}

// ─────────────────────────────────────────────────────────────
// APP
// ─────────────────────────────────────────────────────────────
export default function App() {
  const [books,          setBooks]          = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [view,           setView]           = useState("home");
  const [cart,           setCart]           = useState([]);
  const [cartOpen,       setCartOpen]       = useState(false);
  const [search,         setSearch]         = useState("");
  const [activeCat,      setActiveCat]      = useState("");
  const [isAdmin,        setIsAdmin]        = useState(false);
  const [adminTab,       setAdminTab]       = useState("books");
  const [modal,          setModal]          = useState(null);
  const [editB,          setEditB]          = useState(null);
  const [toast,          setToast]          = useState(null);
  const [loginPass,      setLoginPass]      = useState("");
  const [loginErr,       setLoginErr]       = useState("");
  const [checkF,         setCheckF]         = useState({ name:"", phone:"", txId:"", pin:"" });
  const [aiLoading,      setAiLoading]      = useState(false);
  const [uploadedFile,   setUploadedFile]   = useState(null);
  const [extractedCover, setExtractedCover] = useState(null);
  const [formErr,        setFormErr]        = useState("");
  const [pendingOrder,   setPendingOrder]   = useState(null);
  const [checkPhone,     setCheckPhone]     = useState("");
  const [checkPin,       setCheckPin]       = useState("");
  const [myOrders,       setMyOrders]       = useState(null);
  const [checkingOrders, setCheckingOrders] = useState(false);
  const [adminOrders,    setAdminOrders]    = useState([]);
  const [orderSearch,    setOrderSearch]    = useState("");

  const emptyF = { title:"", author:"", cat:"Roman", price:"", num:"", desc:"", stock:99, emoji:"📚" };
  const [form, setForm] = useState(emptyF);

  useEffect(() => {
    const unsub = onValue(ref(db,"books"), snap => {
      const data = snap.val();
      setBooks(data ? Object.entries(data).map(([k,v])=>({...v,fbKey:k})).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0)) : []);
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    const unsub = onValue(ref(db,"orders"), snap => {
      const data = snap.val();
      setAdminOrders(data ? Object.entries(data).map(([k,v])=>({...v,fbKey:k})).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0)) : []);
    });
    return () => unsub();
  }, [isAdmin]);

  const toast$ = (msg, type="ok") => { setToast({msg,type}); setTimeout(()=>setToast(null),3500); };

  const filtered = books.filter(b => {
    const q = search.toLowerCase();
    return (!q || b.title?.toLowerCase().includes(q) || b.author?.toLowerCase().includes(q) || b.cat?.toLowerCase().includes(q))
      && (!activeCat || b.cat === activeCat);
  });

  const cartCount = cart.reduce((s,i)=>s+i.qty,0);
  const cartTotal = cart.reduce((s,i)=>s+i.num*i.qty,0);

  const addCart = b => { setCart(p => { const ex=p.find(i=>i.fbKey===b.fbKey); return ex?p.map(i=>i.fbKey===b.fbKey?{...i,qty:i.qty+1}:i):[...p,{...b,qty:1}]; }); toast$(`"${b.title}" ajouté ✓`); };
  const updQ = (k,d) => setCart(p=>p.map(i=>i.fbKey===k?{...i,qty:Math.max(1,i.qty+d)}:i));
  const remCart = k => setCart(p=>p.filter(i=>i.fbKey!==k));

  const doLogin = () => {
    if (loginPass===ADMIN_PASSWORD) { setIsAdmin(true); setModal(null); setLoginPass(""); setLoginErr(""); toast$("Bienvenue, mon Roi 👑"); }
    else setLoginErr("Mot de passe incorrect.");
  };

  const openAdd = () => { setForm(emptyF); setUploadedFile(null); setExtractedCover(null); setFormErr(""); setModal("add"); };
  const openEdit = b => {
    setEditB(b);
    setForm({ title:b.title, author:b.author, cat:b.cat, price:b.price, num:b.num, desc:b.desc||"", stock:b.stock, emoji:b.emoji||"📚" });
    setUploadedFile(null); setExtractedCover(b.coverImage||null); setFormErr(""); setModal("edit");
  };

  const chForm = e => {
    const {name:n, value:v} = e.target;
    setForm(p => { const x={...p,[n]:v}; if(n==="num") x.price=v?`${Number(v).toLocaleString("fr-FR")} GNF`:""; return x; });
  };

  const handleBlur = async () => {
    if (modal!=="add"||!form.title.trim()||!form.author.trim()||aiLoading||uploadedFile) return;
    setAiLoading(true);
    try { const cat=await aiCat(form.title,form.author); setForm(p=>({...p,cat})); } catch {}
    setAiLoading(false);
  };

  const handleFileChange = async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 9*1024*1024) { toast$("Fichier trop volumineux (max 9 Mo)","er"); return; }
    const b64 = await readFileAsBase64(file);
    setUploadedFile({ name:file.name, size:(file.size/1024).toFixed(0)+" Ko", b64, type:file.type });

    if (file.type==="application/pdf") {
      setAiLoading(true);
      toast$("🤖 IA analyse le PDF…");
      const [cover, analysis] = await Promise.all([extractPDFCover(b64), analyzeBookPDF(b64)]);
      if (cover) setExtractedCover(cover);
      if (analysis.title||analysis.author||analysis.desc) {
        setForm(p => ({
          ...p,
          title:  analysis.title  || p.title,
          author: analysis.author || p.author,
          cat:    CATS.includes(analysis.cat) ? analysis.cat : (p.cat||"Autre"),
          desc:   analysis.desc   || p.desc,
        }));
      }
      setAiLoading(false);
      toast$("✅ IA terminée — vérifiez les champs");
    }
  };

  const saveBook = async () => {
    if (!form.title.trim()) { setFormErr("Titre requis."); return; }
    if (!form.author.trim()) { setFormErr("Auteur requis."); return; }
    if (!form.num||isNaN(form.num)) { setFormErr("Prix requis."); return; }
    const bookData = {
      title:form.title, author:form.author, cat:form.cat, emoji:form.emoji,
      price:form.price||`${Number(form.num).toLocaleString("fr-FR")} GNF`,
      num:Number(form.num), desc:form.desc, stock:Number(form.stock)||99,
      hasFile:uploadedFile?true:(editB?.hasFile||false),
      coverImage:extractedCover||editB?.coverImage||null,
      createdAt:modal==="add"?Date.now():(editB?.createdAt||Date.now()),
    };
    if (uploadedFile) { bookData.fileData=uploadedFile.b64; bookData.fileName=uploadedFile.name; bookData.fileType=uploadedFile.type; }
    else if (modal==="edit"&&editB?.fileData) { bookData.fileData=editB.fileData; bookData.fileName=editB.fileName; bookData.fileType=editB.fileType; }
    try {
      if (modal==="add") { await push(ref(db,"books"),bookData); toast$(`"${form.title}" publié ✓`); }
      else { await update(ref(db,`books/${editB.fbKey}`),bookData); toast$(`"${form.title}" mis à jour ✓`); }
      setModal(null);
    } catch(err) { toast$("Erreur Firebase : "+err.message,"er"); }
  };

  const delBook = b => { setEditB(b); setModal("del"); };
  const confirmDel = async () => { await remove(ref(db,`books/${editB.fbKey}`)); toast$("Livre supprimé","er"); setModal(null); };
  const copyOM = () => { navigator.clipboard.writeText(OM_NUMBER).catch(()=>{}); toast$("Numéro copié 📋"); };

  const doCheckout = async () => {
    if (!checkF.name.trim()) { toast$("Nom requis","er"); return; }
    if (!checkF.phone.trim()) { toast$("Téléphone requis","er"); return; }
    if (!checkF.txId.trim()||checkF.txId.trim().length<4) { toast$("N° transaction OM requis","er"); return; }
    if (!/^\d{4}$/.test(checkF.pin)) { toast$("PIN 4 chiffres requis — vous en aurez besoin !","er"); return; }

    const orderData = {
      name:checkF.name.trim(), phone:checkF.phone.trim().replace(/\s+/g,""),
      txId:checkF.txId.trim().toUpperCase(), pin:checkF.pin,
      total:cartTotal,
      items:cart.map(i=>({ fbKey:i.fbKey, title:i.title, author:i.author, emoji:i.emoji, qty:i.qty, price:i.num*i.qty })),
      status:"pending", createdAt:Date.now(),
    };
    try {
      const newRef = await push(ref(db,"orders"), orderData);
      const saved = { ...orderData, fbKey:newRef.key };
      setPendingOrder(saved);
      sendTelegramNotif(saved).catch(()=>{});
      setCart([]); setModal(null); setCartOpen(false);
      setCheckF({ name:"", phone:"", txId:"", pin:"" });
      setView("pending");
    } catch(err) { toast$("Erreur : "+err.message,"er"); }
  };

  const checkMyOrders = async () => {
    if (!checkPhone.trim()) { toast$("Entrez votre numéro","er"); return; }
    if (!/^\d{4}$/.test(checkPin)) { toast$("PIN à 4 chiffres requis","er"); return; }
    setCheckingOrders(true);
    try {
      const snap = await get(ref(db,"orders"));
      const data = snap.val();
      if (!data) { setMyOrders([]); setCheckingOrders(false); return; }
      const phone = checkPhone.trim().replace(/\s+/g,"");
      const found = Object.entries(data)
        .map(([k,v])=>({...v,fbKey:k}))
        .filter(o => o.phone.replace(/\s+/g,"")===phone && o.pin===checkPin)
        .sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
      setMyOrders(found);
      if (found.length===0) toast$("Aucune commande avec ces identifiants","er");
    } catch(err) { toast$("Erreur : "+err.message,"er"); }
    setCheckingOrders(false);
  };

  const setOrderStatus = async (fbKey, status) => {
    try {
      await update(ref(db,`orders/${fbKey}`), { status, reviewedAt:Date.now() });
      toast$(status==="approved"?"✅ Commande approuvée":"❌ Commande rejetée", status==="approved"?"ok":"er");
    } catch(err) { toast$("Erreur : "+err.message,"er"); }
  };

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

  const filteredOrders = adminOrders.filter(o => {
    const q=orderSearch.toLowerCase();
    return !q||o.name?.toLowerCase().includes(q)||o.phone?.includes(q)||o.txId?.toLowerCase().includes(q);
  });
  const pendingCount = adminOrders.filter(o=>o.status==="pending").length;

  const BookCard = ({ b, admin }) => (
    <div className="card">
      <div className="card-cover">
        {b.coverImage
          ? <><img src={b.coverImage} alt={b.title} className="card-cover-img" /><div className="card-cover-overlay" /></>
          : <><span className="emo">{b.emoji||"📚"}</span><span className="init">{b.title?.[0]}</span></>}
        {b.hasFile && <span className="has-file-badge">PDF ✓</span>}
      </div>
      <div className="card-body">
        <div className="cat-tag">{CAT_ICONS[b.cat]||""} {b.cat}</div>
        <div className="title">{b.title}</div>
        <div className="author">{b.author}</div>
        <div className="card-foot">
          <div>
            <div className="price">{b.price}</div>
            <div className="stock-lbl">{b.hasFile?"📥 Téléchargement immédiat":"📦 Bientôt disponible"}</div>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:".3rem" }}>
            <button className="add-btn" onClick={() => addCart(b)}>Acheter</button>
            {admin && <div style={{ display:"flex", gap:".25rem" }}><button className="btn btn-ghost btn-sm" onClick={()=>openEdit(b)}>✏️</button><button className="btn btn-red btn-sm" onClick={()=>delBook(b)}>🗑️</button></div>}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <style>{FONTS}{CSS}</style>

      <nav className="nav">
        <div className="logo" onClick={()=>setView("home")}>Lib<em>rairie</em> YO</div>
        <div className="nav-right">
          <button className="btn btn-ghost btn-sm" onClick={()=>{ setMyOrders(null); setCheckPhone(""); setCheckPin(""); setView("check"); }}>📦 Mes commandes</button>
          {isAdmin ? (
            <>
              <button className="btn btn-gold btn-sm" onClick={()=>{ setView("admin"); setAdminTab("orders"); }}>
                📋 Orders{pendingCount>0?` (${pendingCount})`:""}
              </button>
              <button className="btn btn-ghost btn-sm" onClick={openAdd}>+ Livre</button>
              <button className="btn btn-ghost btn-sm" onClick={()=>{ setIsAdmin(false); toast$("Déconnecté","er"); }}>Quitter</button>
            </>
          ) : (
            <button className="btn btn-ghost btn-sm" onClick={()=>setModal("login")}>🔐 Admin</button>
          )}
          <button className="cart-btn" onClick={()=>setCartOpen(true)}>
            🛒 {cartCount>0&&<span className="badge">{cartCount}</span>}
          </button>
        </div>
      </nav>

      {isAdmin && (
        <div className="admin-bar">
          <span>👑 Admin · Firebase sync actif {pendingCount>0&&<strong style={{color:"#f08080",marginLeft:".5rem"}}>⚠️ {pendingCount} en attente</strong>}</span>
        </div>
      )}

      {/* HOME */}
      {view==="home" && <>
        <section className="hero">
          <p className="hero-tag">Librairie numérique · Conakry, Guinée</p>
          <h1>Achetez. Téléchargez.<br /><i>Lisez maintenant.</i></h1>
          <p>Paiement Orange Money — accès activé après confirmation.</p>
          <div className="search-box">
            <span className="si">🔍</span>
            <input placeholder="Titre, auteur, genre…" value={search} onChange={e=>{ setSearch(e.target.value); setActiveCat(""); }} />
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
        <div className="page">
          <div className="grid-title">Catalogue</div>
          <div className="grid-sub">{filtered.length} livre{filtered.length!==1?"s":""} disponible{filtered.length!==1?"s":""}</div>
          {loading ? (
            <div className="loading-screen"><span className="big spin">📚</span><p>Chargement du catalogue…</p></div>
          ) : filtered.length===0 ? (
            <div className="empty"><div style={{fontSize:"2.8rem",marginBottom:".8rem"}}>📭</div><p>{search||activeCat?"Aucun résultat":"Aucun livre pour l'instant"}</p></div>
          ) : (
            <div className="grid">{filtered.map(b=><BookCard key={b.fbKey} b={b} admin={isAdmin} />)}</div>
          )}
        </div>
      </>}

      {/* ADMIN */}
      {view==="admin" && isAdmin && (
        <div className="page">
          <div style={{display:"flex",alignItems:"center",gap:"1rem",marginBottom:"1.5rem",flexWrap:"wrap"}}>
            <button className="btn btn-ghost btn-sm" onClick={()=>setView("home")}>← Retour</button>
            <span style={{fontFamily:"'Playfair Display',serif",fontSize:"1.35rem",color:"var(--cream)"}}>Administration</span>
          </div>
          <div className="admin-tabs">
            <button className={`tab ${adminTab==="books"?"active":""}`} onClick={()=>setAdminTab("books")}>📚 Catalogue</button>
            <button className={`tab ${adminTab==="orders"?"active":""}`} onClick={()=>setAdminTab("orders")}>
              📦 Commandes {pendingCount>0&&<span className="badge" style={{marginLeft:".3rem"}}>{pendingCount}</span>}
            </button>
          </div>

          {adminTab==="books" && <>
            <button className="btn btn-gold" onClick={openAdd} style={{marginBottom:"1.2rem"}}>+ Nouveau livre</button>
            <div className="grid">{books.map(b=><BookCard key={b.fbKey} b={b} admin={true} />)}</div>
          </>}

          {adminTab==="orders" && <>
            <input className="search-orders" placeholder="Rechercher par nom, téléphone, ID transaction…" value={orderSearch} onChange={e=>setOrderSearch(e.target.value)} />
            {filteredOrders.length===0 && <div className="empty"><div style={{fontSize:"2rem",marginBottom:".5rem"}}>📭</div><p>Aucune commande</p></div>}
            {filteredOrders.map(order=>(
              <div key={order.fbKey} className="order-row">
                <div className="order-row-head">
                  <div className="order-meta">
                    <strong>{order.name}</strong><br/>
                    📞 {order.phone}<br/>
                    🕐 {fmtDate(order.createdAt)}
                  </div>
                  <div style={{textAlign:"right"}}>
                    <span className={`status-badge status-${order.status}`}>
                      {order.status==="pending"?"⏳ En attente":order.status==="approved"?"✅ Approuvée":"❌ Rejetée"}
                    </span>
                    <div style={{marginTop:".4rem",color:"var(--gold)",fontWeight:700,fontSize:".9rem"}}>{(order.total||0).toLocaleString("fr-FR")} GNF</div>
                  </div>
                </div>
                <div className="order-items">
                  {(order.items||[]).map((it,i)=>(
                    <div key={i}>{it.emoji||"📚"} {it.title} × {it.qty} — <span style={{color:"var(--gold)"}}>{(it.price||0).toLocaleString("fr-FR")} GNF</span></div>
                  ))}
                </div>
                <div><span style={{fontSize:".72rem",color:"var(--muted)"}}>ID transaction OM : </span><span className="order-tx">{order.txId}</span></div>
                {order.status==="pending" && (
                  <div className="order-actions">
                    <button className="btn btn-green btn-sm" onClick={()=>setOrderStatus(order.fbKey,"approved")}>✅ Valider le paiement</button>
                    <button className="btn btn-red btn-sm" onClick={()=>setOrderStatus(order.fbKey,"rejected")}>❌ Rejeter</button>
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
        </div>
      )}

      {/* PAGE EN ATTENTE */}
      {view==="pending" && pendingOrder && (
        <div className="pending-page">
          <div className="big-icon">⏳</div>
          <h2>Commande enregistrée !</h2>
          <p>Elle sera activée après vérification de votre paiement Orange Money.<br/>Durée habituelle : <strong style={{color:"var(--cream)"}}>quelques heures</strong>.</p>
          <div className="info-box">
            <div>👤 <strong>{pendingOrder.name}</strong></div>
            <div>📞 <strong>{pendingOrder.phone}</strong></div>
            <div>💰 <strong>{(pendingOrder.total||0).toLocaleString("fr-FR")} GNF</strong></div>
            <div>🔖 TX OM : <strong style={{fontFamily:"monospace"}}>{pendingOrder.txId}</strong></div>
          </div>
          <p style={{fontSize:".82rem",marginBottom:".5rem"}}>Gardez votre <strong style={{color:"var(--cream)"}}>PIN</strong> pour accéder à vos livres :</p>
          <div className="pin-highlight">📌 PIN : {pendingOrder.pin}</div>
          <button className="btn btn-gold" style={{width:"100%",marginBottom:".7rem"}}
            onClick={()=>{ setCheckPhone(pendingOrder.phone); setCheckPin(pendingOrder.pin); setView("check"); }}>
            📦 Voir l'état de ma commande
          </button>
          <button className="btn btn-ghost" style={{width:"100%"}} onClick={()=>setView("home")}>← Retour au catalogue</button>
        </div>
      )}

      {/* PAGE COMMANDES CLIENT */}
      {view==="check" && (
        <div className="check-page">
          <div style={{textAlign:"center",marginBottom:"1.5rem"}}>
            <div style={{fontSize:"2.8rem",marginBottom:".7rem"}}>📦</div>
            <h2>Mes commandes</h2>
            <p style={{color:"var(--muted)",fontSize:".86rem",marginTop:".4rem"}}>Téléphone + PIN pour accéder à vos achats.</p>
          </div>
          <div className="fg"><label className="fl">Numéro de téléphone</label><input className="fi" value={checkPhone} onChange={e=>setCheckPhone(e.target.value)} placeholder="+224 6XX XXX XXX" /></div>
          <div className="fg">
            <label className="fl">PIN (4 chiffres)</label>
            <input className="fi pin-input" type="password" maxLength={4} value={checkPin} onChange={e=>setCheckPin(e.target.value.replace(/\D/g,""))} placeholder="••••" onKeyDown={e=>e.key==="Enter"&&checkMyOrders()} />
          </div>
          <button className="btn btn-gold" style={{width:"100%",marginBottom:"1.2rem"}} onClick={checkMyOrders} disabled={checkingOrders}>
            {checkingOrders?<><span className="spin">⚙️</span> Recherche…</>:"🔍 Afficher mes commandes"}
          </button>

          {myOrders!==null&&myOrders.length===0 && (
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
              <div style={{fontWeight:700,color:"var(--gold)",marginBottom:".7rem"}}>{(order.total||0).toLocaleString("fr-FR")} GNF</div>
              {order.status==="approved" ? (
                <div>
                  <div style={{fontSize:".74rem",color:"var(--green)",marginBottom:".6rem"}}>✅ Paiement confirmé — accès activé</div>
                  {(order.items||[]).map((it,i)=>{
                    const book=books.find(b=>b.fbKey===it.fbKey);
                    return (
                      <div key={i} style={{marginBottom:".5rem"}}>
                        <div style={{fontSize:".79rem",color:"var(--text)",marginBottom:".3rem"}}>{it.emoji||"📚"} {it.title}</div>
                        {book?.hasFile
                          ? <div className="dl-formats"><button className="btn btn-green btn-sm" onClick={()=>downloadBook(book)}>⬇️ Télécharger</button><button className="btn btn-outline btn-sm" onClick={()=>readOnline(book)}>👁️ Lire en ligne</button></div>
                          : <p style={{color:"var(--muted)",fontSize:".74rem"}}>⏳ Fichier pas encore disponible.</p>}
                      </div>
                    );
                  })}
                </div>
              ) : order.status==="rejected" ? (
                <div style={{fontSize:".77rem",color:"#f08080"}}>❌ Commande rejetée. <a href="https://wa.me/224661862044" style={{color:"var(--gold)"}} target="_blank" rel="noreferrer">Contacter le support</a></div>
              ) : (
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

      {/* PANIER */}
      {cartOpen&&<div className="co" onClick={()=>setCartOpen(false)} />}
      <div className={`cart-side ${cartOpen?"open":""}`}>
        <div className="ch"><span className="ct">Panier</span><button className="mc" onClick={()=>setCartOpen(false)}>✕</button></div>
        <div className="ci-list">
          {cart.length===0
            ?<div style={{color:"var(--muted)",textAlign:"center",marginTop:"3rem"}}><div style={{fontSize:"2rem",marginBottom:".5rem"}}>🛒</div>Panier vide</div>
            :cart.map(item=>(
              <div key={item.fbKey} className="ci">
                <div style={{fontSize:"1.6rem"}}>{item.emoji||"📚"}</div>
                <div className="ci-info">
                  <div className="ci-title">{item.title}</div>
                  <div className="ci-price">{(item.num*item.qty).toLocaleString("fr-FR")} GNF</div>
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
            <div className="ctotal"><span>Total</span><span>{cartTotal.toLocaleString("fr-FR")} GNF</span></div>
            <button className="btn btn-gold" style={{width:"100%"}} onClick={()=>{ setCartOpen(false); setModal("checkout"); }}>Commander →</button>
          </div>
        )}
      </div>

      {/* MODALS */}
      {modal&&(
        <div className="overlay" onClick={e=>{ if(e.target===e.currentTarget) setModal(null); }}>

          {modal==="login"&&(
            <div className="modal" style={{maxWidth:340}}>
              <button className="mc" onClick={()=>setModal(null)}>✕</button>
              <h2>🔐 Admin</h2>
              <div className="fg"><label className="fl">Mot de passe</label><input className="fi" type="password" value={loginPass} onChange={e=>{ setLoginPass(e.target.value); setLoginErr(""); }} onKeyDown={e=>e.key==="Enter"&&doLogin()} placeholder="••••••••" autoFocus />{loginErr&&<div className="err">{loginErr}</div>}</div>
              <div className="fa"><button className="btn btn-ghost" onClick={()=>setModal(null)}>Annuler</button><button className="btn btn-gold" onClick={doLogin}>Connexion</button></div>
            </div>
          )}

          {(modal==="add"||modal==="edit")&&(
            <div className="modal">
              <button className="mc" onClick={()=>setModal(null)}>✕</button>
              <h2>{modal==="add"?"📚 Ajouter un livre":"✏️ Modifier"}</h2>

              {/* PDF upload — en premier pour que l'IA auto-remplisse le reste */}
              <div className="fg">
                <label className="fl">📁 Fichier PDF / EPUB (max 9 Mo) — <span style={{color:"var(--gold)"}}>l'IA remplit tout automatiquement</span></label>
                {!uploadedFile ? (
                  <div className="upload-zone">
                    <input type="file" accept=".pdf,.epub,.txt" onChange={handleFileChange} />
                    <div className="uico">📂</div>
                    <p>Glissez ou cliquez<br/><strong>PDF · EPUB · TXT</strong></p>
                  </div>
                ) : (
                  <div className="file-ready">
                    <span>✅</span><span className="fname">{uploadedFile.name}</span><span className="fsize">{uploadedFile.size}</span>
                    <button className="file-remove" onClick={()=>{ setUploadedFile(null); setExtractedCover(null); }}>✕</button>
                  </div>
                )}
                {modal==="edit"&&editB?.hasFile&&!uploadedFile&&<p style={{fontSize:".7rem",color:"var(--green)",marginTop:".3rem"}}>✅ Fichier déjà associé.</p>}
              </div>

              {aiLoading&&<div className="ai-row"><span className="spin">⚙️</span> IA : extraction couverture + analyse titre, auteur, catégorie, description…</div>}

              {extractedCover&&!aiLoading&&(
                <div className="ai-analysis-box">
                  <div style={{fontSize:".74rem",color:"var(--gold)",marginBottom:".4rem"}}>📸 Couverture extraite de la 1ère page du PDF</div>
                  <img src={extractedCover} alt="Couverture" className="cover-preview" />
                </div>
              )}

              <div className="fg"><label className="fl">Titre *</label><input className="fi" name="title" value={form.title} onChange={chForm} onBlur={handleBlur} placeholder="Titre du livre" /></div>
              <div className="fg"><label className="fl">Auteur *</label><input className="fi" name="author" value={form.author} onChange={chForm} onBlur={handleBlur} placeholder="Nom de l'auteur" /></div>
              <div className="fr">
                <div className="fg"><label className="fl">Catégorie</label><select className="fs" name="cat" value={form.cat} onChange={chForm}>{CATS.map(c=><option key={c}>{c}</option>)}</select></div>
                <div className="fg"><label className="fl">Emoji</label><select className="fs" name="emoji" value={form.emoji} onChange={chForm}>{EMOJIS.map(e=><option key={e} value={e}>{e}</option>)}</select></div>
              </div>
              <div className="fr">
                <div className="fg"><label className="fl">Prix (GNF) *</label><input className="fi" name="num" type="number" value={form.num} onChange={chForm} placeholder="ex: 35000" /></div>
                <div className="fg"><label className="fl">Stock</label><input className="fi" name="stock" type="number" min="0" value={form.stock} onChange={chForm} /></div>
              </div>
              <div className="fg"><label className="fl">Description</label><textarea className="ft" name="desc" value={form.desc} onChange={chForm} placeholder="Résumé…" /></div>

              {formErr&&<div className="err">{formErr}</div>}
              <div className="fa">
                <button className="btn btn-ghost" onClick={()=>setModal(null)}>Annuler</button>
                <button className="btn btn-gold" onClick={saveBook} disabled={aiLoading}>{aiLoading?"⏳ IA…":modal==="add"?"Publier":"Enregistrer"}</button>
              </div>
            </div>
          )}

          {modal==="del"&&(
            <div className="modal" style={{maxWidth:360}}>
              <h2>🗑️ Supprimer ?</h2>
              <p style={{color:"var(--muted)",marginBottom:"1.4rem"}}>Supprimer <strong style={{color:"var(--cream)"}}>&ldquo;{editB?.title}&rdquo;</strong> ? Irréversible.</p>
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
                    <span style={{color:"var(--gold)"}}>{(i.num*i.qty).toLocaleString("fr-FR")} GNF</span>
                  </div>
                ))}
                <div style={{borderTop:"1px solid var(--bd)",paddingTop:".4rem",marginTop:".4rem",display:"flex",justifyContent:"space-between",fontWeight:700}}>
                  <span>Total</span><span style={{color:"var(--gold)"}}>{cartTotal.toLocaleString("fr-FR")} GNF</span>
                </div>
              </div>
              <div className="om-box">
                <span style={{fontSize:"1.7rem"}}>🟠</span>
                <div className="om-info"><div className="om-title">Orange Money</div><div className="om-num">{OM_NUMBER}</div><div className="om-sub">Envoyez {cartTotal.toLocaleString("fr-FR")} GNF</div></div>
                <button className="om-copy" onClick={copyOM}>Copier</button>
              </div>
              <div style={{marginBottom:"1rem"}}>
                {[["1","Ouvrez Orange Money"],["2","Transfert → "+OM_NUMBER],["3","Montant : "+cartTotal.toLocaleString("fr-FR")+" GNF"],["4","Notez le code SMS de confirmation"],["5","Remplissez le formulaire ci-dessous"]].map(([n,t])=>(
                  <div key={n} className="step"><span className="sn">{n}</span><span>{t}</span></div>
                ))}
              </div>
              <hr className="div" />
              <div className="fg"><label className="fl">Nom complet *</label><input className="fi" value={checkF.name} onChange={e=>setCheckF(p=>({...p,name:e.target.value}))} placeholder="Votre nom" /></div>
              <div className="fg"><label className="fl">Téléphone *</label><input className="fi" value={checkF.phone} onChange={e=>setCheckF(p=>({...p,phone:e.target.value}))} placeholder="+224 6XX XXX XXX" /></div>
              <div className="fg">
                <label className="fl">N° confirmation Orange Money *</label>
                <input className="fi" style={{fontFamily:"monospace",letterSpacing:".04em"}} value={checkF.txId} onChange={e=>setCheckF(p=>({...p,txId:e.target.value}))} placeholder="ex: CI241203.1234.A12345" />
                <div style={{fontSize:".68rem",color:"var(--muted)",marginTop:".25rem"}}>📱 Code reçu par SMS après le transfert</div>
              </div>
              <div className="fg">
                <label className="fl">Créez un PIN secret à 4 chiffres * <span style={{color:"var(--gold)"}}>(notez-le !)</span></label>
                <input className="fi pin-input" type="password" maxLength={4} value={checkF.pin} onChange={e=>setCheckF(p=>({...p,pin:e.target.value.replace(/\D/g,"")}))} placeholder="••••" />
                <div style={{fontSize:".68rem",color:"var(--muted)",marginTop:".25rem"}}>🔒 Ce PIN + votre téléphone protègent l'accès à vos téléchargements</div>
              </div>
              <div style={{background:"rgba(230,126,34,.08)",border:"1px solid rgba(230,126,34,.2)",borderRadius:7,padding:".65rem .9rem",fontSize:".74rem",color:"var(--muted)",marginBottom:".9rem"}}>
                ⚠️ <strong style={{color:"var(--text)"}}>Accès après vérification</strong> — commande activée une fois le paiement confirmé (quelques heures).
              </div>
              <div className="fa">
                <button className="btn btn-ghost" onClick={()=>setModal(null)}>Retour</button>
                <button className="btn btn-om" onClick={doCheckout}>📤 Soumettre la commande</button>
              </div>
            </div>
          )}
        </div>
      )}

      {toast&&<div className={`toast ${toast.type}`}>{toast.msg}</div>}
    </>
  );
}
