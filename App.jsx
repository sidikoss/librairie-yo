import { useState, useEffect, useMemo, useCallback, lazy, Suspense, memo } from "react";
import "./App.css";

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

const loadCachedBooks = () => {
  try { const r = localStorage.getItem(BOOKS_CACHE_KEY); return r ? JSON.parse(r) : []; }
  catch { return []; }
};
const saveBooksCache = books => {
  try {
    const slim = books.map(({ fileData, ...rest }) => rest);
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
async function extractPDFCover(b64) {
  try {
    const pdfjs=await loadPDFJS();
    const raw=atob(b64.split(",")[1]);
    const bytes=new Uint8Array(raw.length);
    for(let i=0;i<raw.length;i++) bytes[i]=raw.charCodeAt(i);
    const pdf=await pdfjs.getDocument({data:bytes}).promise;
    const page=await pdf.getPage(1);
    const vp0=page.getViewport({scale:1});
    const scale=Math.min(320/vp0.width,480/vp0.height);
    const vp=page.getViewport({scale});
    const canvas=document.createElement("canvas");
    canvas.width=vp.width; canvas.height=vp.height;
    await page.render({canvasContext:canvas.getContext("2d"),viewport:vp}).promise;
    return canvas.toDataURL("image/jpeg",0.72);
  } catch { return null; }
}
async function extractPDFPageCount(b64) {
  try {
    const pdfjs=await loadPDFJS();
    const raw=atob(b64.split(",")[1]);
    const bytes=new Uint8Array(raw.length);
    for(let i=0;i<raw.length;i++) bytes[i]=raw.charCodeAt(i);
    const pdf=await pdfjs.getDocument({data:bytes}).promise;
    return pdf.numPages;
  } catch { return null; }
}
async function analyzeBookPDF(b64) {
  try {
    const base64=b64.split(",")[1];
    const r=await fetch("https://api.anthropic.com/v1/messages",{
      method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:700,messages:[{role:"user",content:[
        {type:"document",source:{type:"base64",media_type:"application/pdf",data:base64}},
        {type:"text",text:`Analyse ce livre PDF et retourne UNIQUEMENT un objet JSON valide (sans backticks ni markdown) avec exactement ces champs:\n{"title":"titre exact","author":"auteur complet","cat":"EXACTEMENT une parmi: ${CATS.join(", ")}","desc":"description vendeuse de 2-3 phrases en français qui donne envie d'acheter"}\nNe réponds QU'avec le JSON brut.`}
      ]}]})
    });
    const d=await r.json();
    const txt=d?.content?.[0]?.text?.trim()||"{}";
    return JSON.parse(txt.replace(/```[\w]*\n?|```/g,"").trim());
  } catch { return {}; }
}
async function aiCat(title,author) {
  try {
    const r=await fetch("https://api.anthropic.com/v1/messages",{
      method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:60,messages:[{role:"user",content:`Catégorie parmi: ${CATS.join(", ")}.\nLivre: "${title}" par ${author}.\nRéponds avec le nom exact UNIQUEMENT.`}]})
    });
    const d=await r.json(); const t=d?.content?.[0]?.text?.trim()||"";
    return CATS.find(c=>t.toLowerCase().includes(c.toLowerCase()))||"Autre";
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
  const [books,       setBooks]       = useState(loadCachedBooks);
  const [loading,     setLoading]     = useState(() => loadCachedBooks().length === 0);
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
      const data = await api.get("books", 8000);
      if (data) {
        const fresh = Object.entries(data).map(([k,v]) => ({...v, fbKey: k}));
        setBooks(fresh);
        saveBooksCache(fresh);
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
    await api.patch(`books/${b.fbKey}`,{featured:!b.featured});
    setBooks(prev=>prev.map(x=>x.fbKey===b.fbKey?{...x,featured:!x.featured}:x));
    toast$(b.featured?"Retiré des mis en avant":"⭐ Mis en avant");
  }, [toast$]);

  const copyOM = useCallback(() => {
    navigator.clipboard.writeText(OM_NUMBER).catch(()=>{});
    toast$("Numéro copié 📋");
  }, [toast$]);

  const updQ    = (k,d) => setCart(p=>p.map(i=>i.fbKey===k?{...i,qty:Math.max(1,i.qty+d)}:i));
  const remCart = k => setCart(p=>p.filter(i=>i.fbKey!==k));

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
      setAiLoading(true); toast$("🤖 IA analyse le PDF…");
      const [cover,pages,analysis]=await Promise.all([extractPDFCover(b64),extractPDFPageCount(b64),analyzeBookPDF(b64)]);
      if (cover) setExtractedCover(cover);
      if (pages) setPageCount(pages);
      if (analysis.title||analysis.author||analysis.desc) {
        setForm(p=>({...p,title:analysis.title||p.title,author:analysis.author||p.author,cat:CATS.includes(analysis.cat)?analysis.cat:(p.cat||"Autre"),desc:analysis.desc||p.desc}));
      }
      setAiLoading(false); toast$(`✅ IA terminée${pages?` — ${pages} pages`:""`);
    }
  };

  // ─── Sauvegarde livre ─────────────────────────────────────────────────────
  const saveBook = async () => {
    const errs={};
    if (!form.title.trim()) errs.title="Titre requis";
    if (!form.author.trim()) errs.author="Auteur requis";
    if (!form.num||isNaN(form.num)) errs.num="Prix requis";
    if (Object.keys(errs).length) { setFormFieldErrs(errs); return; }
   
const bookData = {
  title: sanitize(form.title),
  author: sanitize(form.author),
  cat: form.cat || "Autre",
  emoji: form.emoji || "📚",
  price: form.price ? sanitize(form.price) : (Number(form.num || 0).toLocaleString("fr-FR") + " GNF"),
  num: Number(form.num) || 0,
  desc: sanitize(form.desc || ""),
  stock: Number(form.stock) || 99,
  hasFile: uploadedFile ? true : (editB?.hasFile || false)
};

      hasFile:uploadedFile?true:(editB?.hasFile||false),
      coverImage:extractedCover||editB?.coverImage||null,
      pageCount:pageCount||editB?.pageCount||null,
      featured:editB?.featured||false,
      createdAt:modal==="add"?Date.now():(editB?.createdAt||Date.now()),
    };
    try {
      let bookKey;
      if (modal==="add") {
        const res = await api.post("books", bookData);
        bookKey = res.name;
        toast$(`"${form.title}" publié ✓`);
      } else {
        await api.patch(`books/${editB.fbKey}`, bookData);
        bookKey = editB.fbKey;
        toast$(`"${form.title}" mis à jour ✓`);
      }
      if (uploadedFile) {
        await api.put(`book-files/${bookKey}`, {fileData:uploadedFile.b64,fileName:uploadedFile.name,fileType:uploadedFile.type});
      }
      const data = await api.get("books");
      if (data) { const fresh=Object.entries(data).map(([k,v])=>({...v,fbKey:k})); setBooks(fresh); saveBooksCache(fresh); }
      setModal(null);
    } catch(err) { toast$("Erreur : "+err.message,"er"); }
  };

  const confirmDel = async () => {
    await api.del(`books/${editB.fbKey}`);
    try { await api.del(`book-files/${editB.fbKey}`); } catch {}
    const next = books.filter(b=>b.fbKey!==editB.fbKey);
    setBooks(next);
    saveBooksCache(next);
    toast$("Livre supprimé","er"); setModal(null);
  };

  // ─── Checkout ─────────────────────────────────────────────────────────────
  const applyPromo = () => {
    const code=promoCodes.find(p=>p.active&&p.code.toUpperCase()===promoInput.trim().toUpperCase());
    if (!code)                                         { toast$("Code promo invalide ou inactif","er"); return; }
    if (code.maxUses&&(code.uses||0)>=code.maxUses)    { toast$("Ce code promo a expiré","er"); return; }
    setAppliedPromo(code);
    toast$(`Code "${code.code}" appliqué — ${code.type==="percent"?code.discount+"%":fmtGNF(code.discount)} de réduction ✓`);
  };

  const doCheckout = async () => {
    const errs={};
    if (!checkF.name.trim())           errs.name="Nom requis";
    if (!checkF.phone.trim())          errs.phone="Téléphone requis";
    else if (!validPhone(checkF.phone)) errs.phone="Format invalide (9–15 chiffres)";
    if (!checkF.txId.trim())           errs.txId="N° transaction requis";
    else if (!validTx(checkF.txId))    errs.txId="Minimum 4 caractères";
    if (!/^\d{4}$/.test(checkF.pin))   errs.pin="PIN à 4 chiffres requis";
    if (Object.keys(errs).length) { setCheckErrs(errs); return; }
    if (!canOrder()) { toast$("Trop de tentatives — réessayez dans 10 minutes","er"); return; }
    try {
      const allOrders=await api.get("orders");
      if (allOrders) {
        const dup=Object.values(allOrders).find(o=>o.txId===checkF.txId.trim().toUpperCase());
        if (dup) { toast$("Ce numéro de transaction a déjà été utilisé","er"); return; }
      }
    } catch {}
    const orderData = {
      name:sanitize(checkF.name),phone:checkF.phone.trim().replace(/\s+/g,""),
      txId:checkF.txId.trim().toUpperCase(),pin:checkF.pin,
      total:discountedTotal,originalTotal:cartTotal,discount:cartTotal-discountedTotal,
      promoCode:appliedPromo?.code||null,
      items:cart.map(i=>({fbKey:i.fbKey,title:i.title,author:i.author,emoji:i.emoji,qty:i.qty,price:i.num*i.qty})),
      status:"pending",createdAt:Date.now(),
    };
    try {
      const res = await api.post("orders", orderData);
      const fbKey = res.name;
      if (appliedPromo) await api.patch(`promoCodes/${appliedPromo.fbKey}`,{uses:(appliedPromo.uses||0)+1});
      const saved={...orderData,fbKey};
      setPendingOrder(saved);
      sendTelegramNotif(saved).catch(()=>{});
      setCart([]); setModal(null); setCartOpen(false);
      setCheckF({name:"",phone:"",txId:"",pin:""}); setCheckErrs({});
      setAppliedPromo(null); setPromoInput("");
      setView("pending");
    } catch(err) { toast$("Erreur : "+err.message,"er"); }
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
              <div className="grid-sub">{filtered.length} livre{filtered.length!==1?"s":""} disponible{filtered.length!==1?"s":""}</div>
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
            <div className="grid">{filtered.map(b=>renderBookCard(b, isAdmin))}</div>
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
                    const book=books.find(b=>b.fbKey===it.fbKey);
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
