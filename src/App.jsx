import { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set, push, remove, update } from "firebase/database";

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
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

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');`;

const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--bg:#0f0d0b;--s1:#1a1714;--s2:#231f1b;--bd:#2e2925;--gold:#c9963a;--gl:#e8b85a;--cream:#f5ead8;--text:#e8ddd0;--muted:#8a7f74;--red:#c0392b;--om:#ff6600;--green:#27ae60;}
body{background:var(--bg);color:var(--text);font-family:'DM Sans',sans-serif;min-height:100vh}
.nav{position:sticky;top:0;z-index:100;height:60px;display:flex;align-items:center;justify-content:space-between;padding:0 1.5rem;background:rgba(15,13,11,.95);backdrop-filter:blur(10px);border-bottom:1px solid var(--bd)}
.logo{font-family:'Playfair Display',serif;font-size:1.35rem;font-weight:800;color:var(--cream);cursor:pointer}
.logo em{color:var(--gold);font-style:normal}
.nav-right{display:flex;gap:.6rem;align-items:center}
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
.admin-bar{background:rgba(201,150,58,.08);border-bottom:1px solid rgba(201,150,58,.25);padding:.5rem 1.5rem;display:flex;align-items:center;justify-content:space-between;font-size:.78rem;color:var(--gold)}
.hero{text-align:center;padding:4rem 1.5rem 2.5rem;background:radial-gradient(ellipse at 50% 0%,rgba(201,150,58,.07) 0%,transparent 65%);border-bottom:1px solid var(--bd)}
.hero-tag{font-size:.7rem;letter-spacing:.3em;text-transform:uppercase;color:var(--gold);margin-bottom:.9rem}
.hero h1{font-family:'Playfair Display',serif;font-size:clamp(2.2rem,5.5vw,4rem);font-weight:800;color:var(--cream);line-height:1.1;margin-bottom:.8rem}
.hero h1 i{color:var(--gold);font-style:italic}
.hero p{color:var(--muted);font-size:.95rem;max-width:420px;margin:0 auto 1.8rem}
.search-box{max-width:380px;margin:0 auto;position:relative}
.search-box input{width:100%;background:var(--s2);border:1px solid var(--bd);color:var(--text);padding:.7rem 1rem .7rem 2.5rem;border-radius:8px;font-family:'DM Sans';font-size:.88rem;outline:none;transition:border-color .2s}
.search-box input:focus{border-color:var(--gold)}.search-box input::placeholder{color:var(--muted)}
.si{position:absolute;left:.8rem;top:50%;transform:translateY(-50%);color:var(--muted)}
.page{padding:2.5rem 1.5rem;max-width:1100px;margin:0 auto}
.grid-title{font-family:'Playfair Display',serif;font-size:1.4rem;color:var(--cream);margin-bottom:.2rem}
.grid-sub{color:var(--muted);font-size:.8rem;margin-bottom:1.8rem}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:1.3rem}
.card{background:var(--s1);border:1px solid var(--bd);border-radius:10px;overflow:hidden;transition:transform .2s,box-shadow .2s}
.card:hover{transform:translateY(-3px);box-shadow:0 10px 32px rgba(0,0,0,.5)}
.card-cover{width:100%;aspect-ratio:3/4;background:linear-gradient(135deg,var(--s2),#2a2420);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.4rem;position:relative}
.emo{font-size:2.3rem}.init{font-family:'Playfair Display',serif;font-size:1.6rem;font-weight:800;color:var(--gold);opacity:.55}
.has-file-badge{position:absolute;top:.5rem;right:.5rem;background:var(--green);color:#fff;font-size:.6rem;font-weight:700;padding:.15rem .4rem;border-radius:4px}
.card-body{padding:.85rem}
.cat{font-size:.62rem;text-transform:uppercase;letter-spacing:.15em;color:var(--gold);margin-bottom:.25rem}
.title{font-family:'Playfair Display',serif;font-size:.95rem;font-weight:700;color:var(--cream);line-height:1.25;margin-bottom:.18rem;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.author{font-size:.75rem;color:var(--muted);margin-bottom:.65rem}
.card-foot{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:.4rem}
.price{font-weight:700;color:var(--gold);font-size:1rem}
.stock-lbl{font-size:.65rem;color:var(--muted)}
.add-btn{background:var(--gold);color:#0f0d0b;border:none;border-radius:5px;padding:.3rem .65rem;font-size:.72rem;font-weight:700;cursor:pointer;transition:background .18s}
.add-btn:hover{background:var(--gl)}
.empty{text-align:center;padding:5rem 1rem;color:var(--muted)}
.overlay{position:fixed;inset:0;background:rgba(0,0,0,.78);backdrop-filter:blur(4px);z-index:200;display:flex;align-items:center;justify-content:center;padding:1rem}
.modal{background:var(--s1);border:1px solid var(--bd);border-radius:14px;padding:1.8rem;max-width:460px;width:100%;max-height:90vh;overflow-y:auto}
.modal h2{font-family:'Playfair Display',serif;font-size:1.35rem;color:var(--cream);margin-bottom:1.3rem}
.mc{float:right;background:none;border:none;color:var(--muted);cursor:pointer;font-size:1.2rem}
.fg{margin-bottom:1rem}
.fl{display:block;font-size:.72rem;color:var(--muted);margin-bottom:.3rem;text-transform:uppercase;letter-spacing:.06em}
.fi,.fs,.ft{width:100%;background:var(--s2);border:1px solid var(--bd);color:var(--text);padding:.6rem .85rem;border-radius:7px;font-family:'DM Sans';font-size:.88rem;outline:none;transition:border-color .2s}
.fi:focus,.fs:focus,.ft:focus{border-color:var(--gold)}
.ft{resize:vertical;min-height:72px}.fs option{background:var(--s2)}
.fr{display:grid;grid-template-columns:1fr 1fr;gap:.7rem}
.fa{display:flex;gap:.6rem;justify-content:flex-end;margin-top:1.4rem}
.err{color:#f08080;font-size:.78rem;margin-top:.35rem}
.upload-zone{border:2px dashed var(--bd);border-radius:8px;padding:1.2rem;text-align:center;cursor:pointer;transition:border-color .2s;position:relative}
.upload-zone:hover{border-color:var(--gold)}
.upload-zone input{position:absolute;inset:0;opacity:0;cursor:pointer}
.upload-zone .uico{font-size:1.8rem;margin-bottom:.4rem}
.upload-zone p{font-size:.8rem;color:var(--muted)}
.upload-zone strong{color:var(--gold)}
.file-ready{background:rgba(39,174,96,.1);border:1px solid rgba(39,174,96,.35);border-radius:7px;padding:.6rem .9rem;display:flex;align-items:center;gap:.6rem;font-size:.82rem;margin-top:.5rem}
.fname{flex:1;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.fsize{color:var(--muted);font-size:.72rem}
.file-remove{background:none;border:none;color:var(--muted);cursor:pointer;font-size:1rem}
.file-remove:hover{color:var(--red)}
.ai-row{display:flex;align-items:center;gap:.5rem;font-size:.76rem;color:var(--gold);margin:.3rem 0 .7rem}
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
.ci-price{color:var(--gold);font-size:.8rem}
.qty{display:flex;align-items:center;gap:.4rem;margin-top:.25rem}
.qb{background:var(--s2);border:1px solid var(--bd);color:var(--text);width:22px;height:22px;border-radius:4px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:.85rem}
.qb:hover{border-color:var(--gold);color:var(--gold)}
.rb{background:none;border:none;color:var(--muted);cursor:pointer;font-size:1rem;align-self:flex-start}
.rb:hover{color:var(--red)}
.cf{padding-top:.9rem;border-top:1px solid var(--bd)}
.ctotal{display:flex;justify-content:space-between;margin-bottom:.9rem;font-weight:600;color:var(--cream)}
.ctotal span:last-child{color:var(--gold);font-size:1.05rem}
.om-box{background:linear-gradient(135deg,#ff6600,#ff8c00);border-radius:10px;padding:.9rem 1.1rem;margin-bottom:1.1rem;display:flex;align-items:center;gap:.8rem}
.om-info{flex:1}
.om-title{font-weight:700;color:#fff;font-size:.9rem;margin-bottom:.1rem}
.om-num{font-family:'Playfair Display',serif;font-size:1.15rem;font-weight:800;color:#fff;letter-spacing:.04em}
.om-sub{font-size:.68rem;color:rgba(255,255,255,.8);margin-top:.12rem}
.om-copy{background:rgba(255,255,255,.25);border:none;border-radius:6px;padding:.35rem .65rem;font-size:.72rem;color:#fff;cursor:pointer;font-weight:600}
.om-copy:hover{background:rgba(255,255,255,.4)}
.step{display:flex;gap:.65rem;align-items:flex-start;margin-bottom:.5rem;font-size:.79rem;color:var(--muted)}
.sn{background:var(--om);color:#fff;border-radius:50%;width:19px;height:19px;font-size:.68rem;font-weight:700;flex-shrink:0;display:flex;align-items:center;justify-content:center;margin-top:.1rem}
.step strong{color:var(--text)}
hr.div{border:none;border-top:1px solid var(--bd);margin:1.1rem 0}
.dl-page{max-width:520px;margin:4rem auto;padding:0 1.5rem;text-align:center}
.dl-page h2{font-family:'Playfair Display',serif;font-size:1.8rem;color:var(--cream);margin-bottom:.5rem}
.dl-page>p{color:var(--muted);font-size:.9rem;margin-bottom:2rem}
.dl-card{background:var(--s1);border:1px solid var(--bd);border-radius:12px;padding:1.5rem;margin-bottom:1.2rem}
.dl-card h3{font-family:'Playfair Display',serif;font-size:1.1rem;color:var(--cream);margin-bottom:.3rem}
.dl-card p{font-size:.82rem;color:var(--muted);margin-bottom:1rem}
.dl-formats{display:flex;gap:.6rem;justify-content:center;flex-wrap:wrap}
.toast{position:fixed;bottom:1.8rem;left:50%;transform:translateX(-50%);background:var(--s2);border:1px solid var(--bd);color:var(--text);padding:.65rem 1.4rem;border-radius:8px;font-size:.84rem;z-index:500;animation:tin .25s ease;box-shadow:0 8px 28px rgba(0,0,0,.45);white-space:nowrap}
.toast.ok{border-color:var(--green);color:#6fcf97}
.toast.er{border-color:var(--red);color:#f08080}
@keyframes tin{from{opacity:0;transform:translateX(-50%) translateY(8px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
`;

const CATS = ["Roman","Science","Histoire","Philosophie","Manga","Religion","Développement personnel","Informatique","Jeunesse","Poésie","Biographie","Economie","Autre"];
const EMOJIS = ["📚","📖","✨","🌙","💡","🔥","⭐","🌿","🦋","🎯","💰","🌹","🗺️","⚔️","🔮","🧠","🏆","⚡","🌍","🕌"];

async function aiCat(title, author) {
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 60, messages: [{ role: "user", content: `Catégorie parmi: ${CATS.join(", ")}.\nLivre: "${title}" par ${author}.\nRéponds avec le nom exact UNIQUEMENT.` }] }) });
    const d = await r.json();
    const t = d?.content?.[0]?.text?.trim() || "";
    return CATS.find(c => t.toLowerCase().includes(c.toLowerCase())) || "Autre";
  } catch { return "Autre"; }
}
async function aiEmoji(title, cat) {
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 10, messages: [{ role: "user", content: `Parmi: ${EMOJIS.join(" ")}\nChoisis UN emoji pour "${title}" (${cat}). Réponds avec l'emoji seul.` }] }) });
    const d = await r.json();
    const t = d?.content?.[0]?.text?.trim() || "";
    return EMOJIS.find(e => t.includes(e)) || "📚";
  } catch { return "📚"; }
}

function readFileAsBase64(file) {
  return new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.onerror = rej; fr.readAsDataURL(file); });
}

export default function App() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("home");
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [modal, setModal] = useState(null);
  const [editB, setEditB] = useState(null);
  const [toast, setToast] = useState(null);
  const [purchases, setPurchases] = useState(() => { try { return JSON.parse(localStorage.getItem("yo-purchases") || "[]"); } catch { return []; } });
  const [loginPass, setLoginPass] = useState("");
  const [loginErr, setLoginErr] = useState("");
  const [checkF, setCheckF] = useState({ name: "", phone: "" });
  const [aiLoading, setAiLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [formErr, setFormErr] = useState("");
  const emptyF = { title: "", author: "", cat: "Roman", price: "", num: "", desc: "", stock: 99, emoji: "📚" };
  const [form, setForm] = useState(emptyF);

  // 🔥 Firebase real-time sync
  useEffect(() => {
    const booksRef = ref(db, "books");
    const unsub = onValue(booksRef, (snap) => {
      const data = snap.val();
      if (data) {
        const list = Object.entries(data).map(([fbKey, val]) => ({ ...val, fbKey }));
        list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setBooks(list);
      } else {
        setBooks([]);
      }
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, []);

  useEffect(() => { localStorage.setItem("yo-purchases", JSON.stringify(purchases)); }, [purchases]);

  const toast$ = (msg, type = "ok") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  const filtered = books.filter(b =>
    b.title?.toLowerCase().includes(search.toLowerCase()) ||
    b.author?.toLowerCase().includes(search.toLowerCase()) ||
    b.cat?.toLowerCase().includes(search.toLowerCase())
  );

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const cartTotal = cart.reduce((s, i) => s + i.num * i.qty, 0);

  const addCart = (b) => { setCart(p => { const ex = p.find(i => i.fbKey === b.fbKey); return ex ? p.map(i => i.fbKey === b.fbKey ? { ...i, qty: i.qty + 1 } : i) : [...p, { ...b, qty: 1 }]; }); toast$(`"${b.title}" ajouté ✓`); };
  const updQ = (fbKey, d) => setCart(p => p.map(i => i.fbKey === fbKey ? { ...i, qty: Math.max(1, i.qty + d) } : i));
  const remCart = (fbKey) => setCart(p => p.filter(i => i.fbKey !== fbKey));

  const doLogin = () => { if (loginPass === ADMIN_PASSWORD) { setIsAdmin(true); setModal(null); setLoginPass(""); setLoginErr(""); toast$("Bienvenue, mon Roi 👑"); } else setLoginErr("Mot de passe incorrect."); };

  const openAdd = () => { setForm(emptyF); setUploadedFile(null); setFormErr(""); setModal("add"); };
  const openEdit = (b) => { setEditB(b); setForm({ title: b.title, author: b.author, cat: b.cat, price: b.price, num: b.num, desc: b.desc || "", stock: b.stock, emoji: b.emoji }); setUploadedFile(null); setFormErr(""); setModal("edit"); };

  const handleBlur = async () => {
    if (modal !== "add" || !form.title.trim() || !form.author.trim() || aiLoading) return;
    setAiLoading(true);
    try { const cat = await aiCat(form.title, form.author); const emoji = await aiEmoji(form.title, cat); setForm(p => ({ ...p, cat, emoji })); } catch {}
    setAiLoading(false);
  };

  const chForm = (e) => { const { name: n, value: v } = e.target; setForm(p => { const x = { ...p, [n]: v }; if (n === "num") x.price = v ? `${Number(v).toLocaleString("fr-FR")} GNF` : ""; return x; }); };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 9 * 1024 * 1024) { toast$("Fichier trop volumineux (max 9 Mo)", "er"); return; }
    const b64 = await readFileAsBase64(file);
    setUploadedFile({ name: file.name, size: (file.size / 1024).toFixed(0) + " Ko", b64, type: file.type });
  };

  const saveBook = async () => {
    if (!form.title.trim()) { setFormErr("Titre requis."); return; }
    if (!form.author.trim()) { setFormErr("Auteur requis."); return; }
    if (!form.num || isNaN(form.num)) { setFormErr("Prix requis."); return; }
    let cat = form.cat, emoji = form.emoji;
    if (modal === "add" && !aiLoading) {
      setAiLoading(true);
      try { cat = await aiCat(form.title, form.author); emoji = await aiEmoji(form.title, cat); } catch {}
      setAiLoading(false);
    }
    const bookData = { title: form.title, author: form.author, cat, emoji, price: form.price || `${Number(form.num).toLocaleString("fr-FR")} GNF`, num: Number(form.num), desc: form.desc, stock: Number(form.stock) || 99, hasFile: uploadedFile ? true : (editB?.hasFile || false), createdAt: modal === "add" ? Date.now() : (editB?.createdAt || Date.now()) };
    if (uploadedFile) { bookData.fileData = uploadedFile.b64; bookData.fileName = uploadedFile.name; bookData.fileType = uploadedFile.type; }
    else if (modal === "edit" && editB?.fileData) { bookData.fileData = editB.fileData; bookData.fileName = editB.fileName; bookData.fileType = editB.fileType; }
    try {
      if (modal === "add") { await push(ref(db, "books"), bookData); toast$(`"${form.title}" publié · ${cat} ✓`); }
      else { await update(ref(db, `books/${editB.fbKey}`), bookData); toast$(`"${form.title}" mis à jour ✓`); }
      setModal(null);
    } catch (e) { toast$("Erreur Firebase : " + e.message, "er"); }
  };

  const delBook = (b) => { setEditB(b); setModal("del"); };
  const confirmDel = async () => { await remove(ref(db, `books/${editB.fbKey}`)); toast$("Livre supprimé", "er"); setModal(null); };

  const doCheckout = () => {
    if (!checkF.name || !checkF.phone) { toast$("Nom et téléphone requis", "er"); return; }
    const existing = new Set(purchases.map(x => x.fbKey));
    const bought = cart.filter(i => !existing.has(i.fbKey)).map(i => ({ fbKey: i.fbKey, title: i.title, emoji: i.emoji, author: i.author }));
    setPurchases(p => [...p, ...bought]);
    setCart([]); setModal(null); setCartOpen(false); setView("downloads");
  };

  const copyOM = () => { navigator.clipboard.writeText(OM_NUMBER).catch(() => {}); toast$("Numéro copié 📋"); };

  const downloadBook = (book) => { if (!book?.fileData) { toast$("Fichier non disponible", "er"); return; } const a = document.createElement("a"); a.href = book.fileData; a.download = book.fileName || book.title; a.click(); toast$("Téléchargement lancé ✓"); };
  const readOnline = (book) => { if (!book?.fileData) { toast$("Fichier non disponible", "er"); return; } const w = window.open(); if (w) { w.document.write(`<iframe src="${book.fileData}" style="width:100%;height:100%;border:none"></iframe>`); w.document.close(); } };

  return (
    <>
      <style>{FONTS}{CSS}</style>
      <nav className="nav">
        <div className="logo" onClick={() => setView("home")}>Lib<em>rairie</em> YO</div>
        <div className="nav-right">
          {purchases.length > 0 && <button className="btn btn-outline btn-sm" onClick={() => setView("downloads")}>📥 Mes livres ({purchases.length})</button>}
          {isAdmin ? (<><button className="btn btn-gold btn-sm" onClick={openAdd}>+ Ajouter</button><button className="btn btn-ghost btn-sm" onClick={() => { setIsAdmin(false); toast$("Déconnecté", "er"); }}>Quitter</button></>) : (<button className="btn btn-ghost btn-sm" onClick={() => setModal("login")}>🔐 Admin</button>)}
          <button className="cart-btn" onClick={() => setCartOpen(true)}>🛒 {cartCount > 0 && <span className="badge">{cartCount}</span>}</button>
        </div>
      </nav>
      {isAdmin && <div className="admin-bar"><span>👑 Admin · Firebase sync actif</span><button className="btn btn-gold btn-sm" onClick={openAdd}>+ Nouveau livre</button></div>}

      {view === "home" && (<>
        <section className="hero">
          <p className="hero-tag">Librairie numérique · Conakry, Guinée</p>
          <h1>Achetez. Téléchargez.<br /><i>Lisez maintenant.</i></h1>
          <p>Livres numériques livrés immédiatement après paiement Orange Money.</p>
          <div className="search-box"><span className="si">🔍</span><input placeholder="Titre, auteur, genre…" value={search} onChange={e => setSearch(e.target.value)} /></div>
        </section>
        <div className="page">
          <div className="grid-title">Catalogue</div>
          <div className="grid-sub">{filtered.length} livre{filtered.length !== 1 ? "s" : ""} disponible{filtered.length !== 1 ? "s" : ""}</div>
          {loading ? (
            <div className="loading-screen"><span className="big spin">📚</span><p>Chargement du catalogue…</p></div>
          ) : filtered.length === 0 ? (
            <div className="empty"><div style={{ fontSize: "2.8rem", marginBottom: ".8rem" }}>📭</div><p>{search ? "Aucun résultat" : "Aucun livre pour l'instant"}</p></div>
          ) : (
            <div className="grid">
              {filtered.map(b => (
                <div key={b.fbKey} className="card">
                  <div className="card-cover"><span className="emo">{b.emoji || "📚"}</span><span className="init">{b.title?.[0]}</span>{b.hasFile && <span className="has-file-badge">PDF ✓</span>}</div>
                  <div className="card-body">
                    <div className="cat">{b.cat}</div>
                    <div className="title">{b.title}</div>
                    <div className="author">{b.author}</div>
                    <div className="card-foot">
                      <div><div className="price">{b.price}</div><div className="stock-lbl">{b.hasFile ? "📥 Téléchargement immédiat" : "📦 Bientôt disponible"}</div></div>
                      <div style={{ display: "flex", flexDirection: "column", gap: ".3rem" }}>
                        <button className="add-btn" onClick={() => addCart(b)}>Acheter</button>
                        {isAdmin && <div style={{ display: "flex", gap: ".25rem" }}><button className="btn btn-ghost btn-sm" onClick={() => openEdit(b)}>✏️</button><button className="btn btn-red btn-sm" onClick={() => delBook(b)}>🗑️</button></div>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </>)}

      {view === "downloads" && (
        <div className="dl-page">
          <div style={{ fontSize: "3rem", marginBottom: ".8rem" }}>📥</div>
          <h2>Vos livres achetés</h2>
          <p>Téléchargez ou lisez directement depuis cette page.</p>
          {purchases.map(p => {
            const book = books.find(b => b.fbKey === p.fbKey);
            return (
              <div key={p.fbKey} className="dl-card">
                <div style={{ fontSize: "2rem", marginBottom: ".4rem" }}>{p.emoji || "📚"}</div>
                <h3>{p.title}</h3>
                <p>{p.author}</p>
                {book?.hasFile ? (
                  <div className="dl-formats">
                    <button className="btn btn-green" onClick={() => downloadBook(book)}>⬇️ Télécharger</button>
                    <button className="btn btn-outline" onClick={() => readOnline(book)}>👁️ Lire en ligne</button>
                  </div>
                ) : (<p style={{ color: "var(--muted)", fontSize: ".78rem" }}>⏳ Fichier pas encore disponible.</p>)}
              </div>
            );
          })}
          <button className="btn btn-ghost" style={{ marginTop: "1rem" }} onClick={() => setView("home")}>← Retour</button>
        </div>
      )}

      {cartOpen && <div className="co" onClick={() => setCartOpen(false)} />}
      <div className={`cart-side ${cartOpen ? "open" : ""}`}>
        <div className="ch"><span className="ct">Panier</span><button className="mc" onClick={() => setCartOpen(false)}>✕</button></div>
        <div className="ci-list">
          {cart.length === 0 ? <div style={{ color: "var(--muted)", textAlign: "center", marginTop: "3rem" }}><div style={{ fontSize: "2rem", marginBottom: ".5rem" }}>🛒</div>Panier vide</div>
            : cart.map(item => (
              <div key={item.fbKey} className="ci">
                <div style={{ fontSize: "1.7rem" }}>{item.emoji || "📚"}</div>
                <div className="ci-info"><div className="ci-title">{item.title}</div><div className="ci-price">{(item.num * item.qty).toLocaleString("fr-FR")} GNF</div>
                  <div className="qty"><button className="qb" onClick={() => updQ(item.fbKey, -1)}>−</button><span style={{ fontSize: ".85rem", minWidth: "18px", textAlign: "center" }}>{item.qty}</span><button className="qb" onClick={() => updQ(item.fbKey, +1)}>+</button></div>
                </div>
                <button className="rb" onClick={() => remCart(item.fbKey)}>✕</button>
              </div>
            ))}
        </div>
        {cart.length > 0 && <div className="cf"><div className="ctotal"><span>Total</span><span>{cartTotal.toLocaleString("fr-FR")} GNF</span></div><button className="btn btn-gold" style={{ width: "100%" }} onClick={() => { setCartOpen(false); setModal("checkout"); }}>Commander →</button></div>}
      </div>

      {modal && (
        <div className="overlay" onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
          {modal === "login" && (
            <div className="modal" style={{ maxWidth: 340 }}>
              <button className="mc" onClick={() => setModal(null)}>✕</button>
              <h2>🔐 Admin</h2>
              <div className="fg"><label className="fl">Mot de passe</label><input className="fi" type="password" value={loginPass} onChange={e => { setLoginPass(e.target.value); setLoginErr(""); }} onKeyDown={e => e.key === "Enter" && doLogin()} placeholder="••••••••" autoFocus />{loginErr && <div className="err">{loginErr}</div>}</div>
              <div className="fa"><button className="btn btn-ghost" onClick={() => setModal(null)}>Annuler</button><button className="btn btn-gold" onClick={doLogin}>Connexion</button></div>
            </div>
          )}
          {(modal === "add" || modal === "edit") && (
            <div className="modal">
              <button className="mc" onClick={() => setModal(null)}>✕</button>
              <h2>{modal === "add" ? "📚 Ajouter un livre" : "✏️ Modifier"}</h2>
              <div className="fg"><label className="fl">Titre *</label><input className="fi" name="title" value={form.title} onChange={chForm} onBlur={handleBlur} placeholder="Titre du livre" /></div>
              <div className="fg"><label className="fl">Auteur *</label><input className="fi" name="author" value={form.author} onChange={chForm} onBlur={handleBlur} placeholder="Nom de l'auteur" /></div>
              {aiLoading && <div className="ai-row"><span className="spin">⚙️</span> L'IA analyse…</div>}
              <div className="fr">
                <div className="fg"><label className="fl">Catégorie</label><select className="fs" name="cat" value={form.cat} onChange={chForm}>{CATS.map(c => <option key={c}>{c}</option>)}</select></div>
                <div className="fg"><label className="fl">Emoji</label><select className="fs" name="emoji" value={form.emoji} onChange={chForm}>{EMOJIS.map(e => <option key={e} value={e}>{e}</option>)}</select></div>
              </div>
              <div className="fr">
                <div className="fg"><label className="fl">Prix (GNF) *</label><input className="fi" name="num" type="number" value={form.num} onChange={chForm} placeholder="ex: 35000" /></div>
                <div className="fg"><label className="fl">Stock</label><input className="fi" name="stock" type="number" min="0" value={form.stock} onChange={chForm} /></div>
              </div>
              <div className="fg"><label className="fl">Description</label><textarea className="ft" name="desc" value={form.desc} onChange={chForm} placeholder="Résumé…" /></div>
              <div className="fg">
                <label className="fl">📁 Fichier du livre (PDF, EPUB — max 9 Mo)</label>
                {!uploadedFile ? (
                  <div className="upload-zone"><input type="file" accept=".pdf,.epub,.txt" onChange={handleFileChange} /><div className="uico">📂</div><p>Cliquez pour choisir votre fichier<br /><strong>PDF · EPUB · TXT</strong></p></div>
                ) : (
                  <div className="file-ready"><span>✅</span><span className="fname">{uploadedFile.name}</span><span className="fsize">{uploadedFile.size}</span><button className="file-remove" onClick={() => setUploadedFile(null)}>✕</button></div>
                )}
                {modal === "edit" && editB?.hasFile && !uploadedFile && <p style={{ fontSize: ".72rem", color: "var(--green)", marginTop: ".35rem" }}>✅ Fichier déjà associé.</p>}
              </div>
              {formErr && <div className="err">{formErr}</div>}
              <div className="fa"><button className="btn btn-ghost" onClick={() => setModal(null)}>Annuler</button><button className="btn btn-gold" onClick={saveBook} disabled={aiLoading}>{aiLoading ? "⏳ IA…" : modal === "add" ? "Publier" : "Enregistrer"}</button></div>
            </div>
          )}
          {modal === "del" && (
            <div className="modal" style={{ maxWidth: 360 }}>
              <h2>🗑️ Supprimer ?</h2>
              <p style={{ color: "var(--muted)", marginBottom: "1.4rem" }}>Supprimer <strong style={{ color: "var(--cream)" }}>&ldquo;{editB?.title}&rdquo;</strong> ? Irréversible.</p>
              <div className="fa"><button className="btn btn-ghost" onClick={() => setModal(null)}>Annuler</button><button className="btn btn-red" onClick={confirmDel}>Supprimer</button></div>
            </div>
          )}
          {modal === "checkout" && (
            <div className="modal">
              <button className="mc" onClick={() => setModal(null)}>✕</button>
              <h2>🛒 Commander</h2>
              <div style={{ background: "var(--s2)", border: "1px solid var(--bd)", borderRadius: 8, padding: ".7rem .9rem", marginBottom: "1.1rem" }}>
                {cart.map(i => (<div key={i.fbKey} style={{ display: "flex", justifyContent: "space-between", fontSize: ".82rem", marginBottom: ".28rem" }}><span style={{ color: "var(--text)" }}>{i.title} × {i.qty}</span><span style={{ color: "var(--gold)" }}>{(i.num * i.qty).toLocaleString("fr-FR")} GNF</span></div>))}
                <div style={{ borderTop: "1px solid var(--bd)", paddingTop: ".45rem", marginTop: ".45rem", display: "flex", justifyContent: "space-between", fontWeight: 700 }}><span>Total</span><span style={{ color: "var(--gold)" }}>{cartTotal.toLocaleString("fr-FR")} GNF</span></div>
              </div>
              <div className="om-box">
                <span style={{ fontSize: "1.8rem" }}>🟠</span>
                <div className="om-info"><div className="om-title">Orange Money</div><div className="om-num">{OM_NUMBER}</div><div className="om-sub">Envoyez {cartTotal.toLocaleString("fr-FR")} GNF</div></div>
                <button className="om-copy" onClick={copyOM}>Copier</button>
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <div className="step"><span className="sn">1</span><span>Ouvrez <strong>Orange Money</strong></span></div>
                <div className="step"><span className="sn">2</span><span>Transfert → <strong>{OM_NUMBER}</strong></span></div>
                <div className="step"><span className="sn">3</span><span>Montant : <strong>{cartTotal.toLocaleString("fr-FR")} GNF</strong></span></div>
                <div className="step"><span className="sn">4</span><span>Revenez ici et confirmez</span></div>
              </div>
              <hr className="div" />
              <div className="fg"><label className="fl">Nom complet *</label><input className="fi" value={checkF.name} onChange={e => setCheckF(p => ({ ...p, name: e.target.value }))} placeholder="Votre nom" /></div>
              <div className="fg"><label className="fl">Téléphone *</label><input className="fi" value={checkF.phone} onChange={e => setCheckF(p => ({ ...p, phone: e.target.value }))} placeholder="+224 6XX XXX XXX" /></div>
              <div className="fa"><button className="btn btn-ghost" onClick={() => setModal(null)}>Retour</button><button className="btn btn-om" onClick={doCheckout}>✅ J'ai payé — Accéder à mes livres</button></div>
            </div>
          )}
        </div>
      )}
      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}
    </>
  );
}
