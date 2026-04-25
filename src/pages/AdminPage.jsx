// src/pages/AdminPage.jsx
// Auth déplacée côté serveur — le mot de passe n'est plus dans le bundle JS.

import { useMemo, useState } from "react";
import { STORAGE_KEYS } from "../config/constants";
import { useCatalog } from "../context/CatalogContext";
import { formatGNF } from "../utils/format";

const SESSION_TTL = 2 * 60 * 60 * 1000; // 2 h (doit correspondre à l'API)

const SESSION_KEY = STORAGE_KEYS.adminSession;

const emptyBookDraft = {
  title: "",
  author: "",
  pages: 120,
  category: "Roman",
  image: "",
  description: "",
  rating: 4.6,
  discount: 0,
  stock: 99,
  featured: false,
  manualPrice: "",
  manualPriceEnabled: false,
};

// ── Session helpers ──────────────────────────────────────────────────────────

function loadAdminSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const { token, ts } = JSON.parse(raw);
    if (!token || !ts || Date.now() - ts >= SESSION_TTL) return null;
    return token;
  } catch {
    return null;
  }
}

function saveAdminSession(token) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ token, ts: Date.now() }));
}

function clearAdminSession() {
  localStorage.removeItem(SESSION_KEY);
}

// ── Server auth ──────────────────────────────────────────────────────────────

async function loginWithPassword(password) {
  const res = await fetch("/api/admin-auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    throw new Error(data.error || "Mot de passe incorrect");
  }
  return data.token;
}

// ── File helper ──────────────────────────────────────────────────────────────

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ── Component ────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const {
    books,
    orders,
    promoCodes,
    categories,
    upsertBook,
    removeBook,
    setOrderStatus,
    addPromo,
    togglePromo,
    removePromo,
    refreshCatalog,
    syncing,
  } = useCatalog();

  // Auth state
  const [adminToken, setAdminToken] = useState(() => loadAdminSession());
  const isLoggedIn = Boolean(adminToken);
  const [password, setPassword]     = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginBusy, setLoginBusy]   = useState(false);

  // UI state
  const [activeTab, setActiveTab]       = useState("stats");
  const [bookDraft, setBookDraft]       = useState(emptyBookDraft);
  const [editingBookId, setEditingBookId] = useState("");
  const [uploadPayload, setUploadPayload] = useState(null);
  const [bookQuery, setBookQuery]       = useState("");
  const [orderQuery, setOrderQuery]     = useState("");
  const [promoDraft, setPromoDraft]     = useState({
    code: "", discount: "", type: "percent", maxUses: "100",
  });
  const [savingBook, setSavingBook] = useState(false);

  // ── Derived data ─────────────────────────────────────────────────────────

  const approvedOrders = useMemo(
    () => orders.filter((o) => o.status === "approved"), [orders],
  );
  const pendingOrders = useMemo(
    () => orders.filter((o) => o.status === "pending"), [orders],
  );
  const rejectedOrders = useMemo(
    () => orders.filter((o) => o.status === "rejected"), [orders],
  );
  const totalRevenue = useMemo(
    () => approvedOrders.reduce((s, o) => s + Number(o.total || 0), 0),
    [approvedOrders],
  );

  const filteredBooks = useMemo(() => {
    const q = bookQuery.toLowerCase();
    if (!q) return books;
    return books.filter(
      (b) => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q),
    );
  }, [books, bookQuery]);

  const filteredOrders = useMemo(() => {
    const q = orderQuery.toLowerCase();
    if (!q) return orders;
    return orders.filter(
      (o) =>
        String(o.name || "").toLowerCase().includes(q) ||
        String(o.phone || "").includes(q) ||
        String(o.referencePaiement || o.txId || "").toLowerCase().includes(q),
    );
  }, [orders, orderQuery]);

  // ── Auth handlers ─────────────────────────────────────────────────────────

  const handleLogin = async () => {
    setLoginError("");
    setLoginBusy(true);
    try {
      const token = await loginWithPassword(password);
      saveAdminSession(token);
      setAdminToken(token);
      setPassword("");
    } catch (err) {
      setLoginError(err.message || "Erreur de connexion");
    } finally {
      setLoginBusy(false);
    }
  };

  const handleLogout = () => {
    clearAdminSession();
    setAdminToken(null);
    setPassword("");
    setLoginError("");
  };

  // ── Book handlers ─────────────────────────────────────────────────────────

  const resetBookForm = () => {
    setBookDraft(emptyBookDraft);
    setEditingBookId("");
    setUploadPayload(null);
  };

  const handleBookFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const fileData = await readFileAsBase64(file);
    setUploadPayload({ fileData, fileName: file.name, fileType: file.type || "application/octet-stream" });
  };

  const handleBookSubmit = async () => {
    if (!bookDraft.title.trim() || !bookDraft.author.trim()) return;
    setSavingBook(true);
    try {
      await upsertBook({
        draft: {
          ...bookDraft,
          pages: Number(bookDraft.pages || 120),
          rating: Number(bookDraft.rating || 4.6),
          discount: Number(bookDraft.discount || 0),
          stock: Number(bookDraft.stock || 99),
          manualPrice: Number(bookDraft.manualPrice || 0),
          manualPriceEnabled: Boolean(bookDraft.manualPriceEnabled),
        },
        filePayload: uploadPayload,
        bookId: editingBookId || null,
      });
      resetBookForm();
    } finally {
      setSavingBook(false);
    }
  };

  const handleBookEdit = (book) => {
    setEditingBookId(book.id);
    setBookDraft({
      title: book.title,
      author: book.author,
      pages: book.pages,
      category: book.category,
      image: book.image || "",
      description: book.description || "",
      rating: book.rating,
      discount: book.discount || 0,
      stock: book.stock || 99,
      featured: Boolean(book.featured),
      manualPrice: book.manualPrice || "",
      manualPriceEnabled: Boolean(book.manualPriceEnabled),
    });
    setUploadPayload(null);
  };

  const handleCreatePromo = async () => {
    if (!promoDraft.code || !promoDraft.discount) return;
    await addPromo(promoDraft);
    setPromoDraft({ code: "", discount: "", type: "percent", maxUses: "100" });
  };

  // ── Login screen ──────────────────────────────────────────────────────────

  if (!isLoggedIn) {
    return (
      <div className="mx-auto max-w-md card-surface p-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-brand-600">
          Administration
        </p>
        <h1 className="font-heading text-2xl font-extrabold text-zinc-900">
          Connexion admin
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          Entrez le mot de passe pour gérer le catalogue et les commandes.
        </p>
        <input
          type="password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setLoginError(""); }}
          onKeyDown={(e) => e.key === "Enter" && !loginBusy && handleLogin()}
          placeholder="Mot de passe"
          className="mt-4 w-full rounded-xl border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm outline-none ring-brand-300 focus:ring"
          autoComplete="current-password"
        />
        {loginError && (
          <p className="mt-2 text-sm text-rose-600">{loginError}</p>
        )}
        <button
          onClick={handleLogin}
          disabled={loginBusy}
          className="mt-4 w-full rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loginBusy ? "Vérification..." : "Se connecter"}
        </button>
      </div>
    );
  }

  // ── Admin dashboard ───────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-600">
            Administration
          </p>
          <h1 className="font-heading text-2xl font-extrabold text-zinc-900">
            Back-office Librairie YO
          </h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={refreshCatalog}
            className="rounded-xl border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            {syncing ? "Sync..." : "Synchroniser"}
          </button>
          <button
            onClick={handleLogout}
            className="rounded-xl border border-rose-200 px-4 py-2 text-sm font-medium text-rose-700"
          >
            Déconnexion
          </button>
        </div>
      </header>

      <nav className="flex flex-wrap gap-2">
        {[["stats","Stats"],["books","Catalogue"],["orders","Commandes"],["promos","Promos"]].map(
          ([id, label]) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                activeTab === id ? "bg-brand-600 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600"
              }`}
            >
              {label}
            </button>
          )
        )}
      </nav>

      {/* ── STATS ── */}
      {activeTab === "stats" && (
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Livres",       value: books.length,           color: "text-zinc-900" },
            { label: "En attente",   value: pendingOrders.length,   color: "text-amber-600" },
            { label: "Approuvées",   value: approvedOrders.length,  color: "text-emerald-600" },
            { label: "Revenus",      value: formatGNF(totalRevenue), color: "text-zinc-900" },
          ].map(({ label, value, color }) => (
            <article key={label} className="card-surface p-4">
              <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{label}</p>
              <p className={`mt-1 text-2xl font-extrabold ${color}`}>{value}</p>
            </article>
          ))}
        </section>
      )}

      {/* ── BOOKS ── */}
      {activeTab === "books" && (
        <section className="space-y-4">
          <article className="card-surface p-4">
            <h2 className="font-heading text-lg font-bold text-zinc-900">
              {editingBookId ? "Modifier un livre" : "Ajouter un livre"}
            </h2>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {[
                { value: bookDraft.title,  key: "title",  placeholder: "Titre" },
                { value: bookDraft.author, key: "author", placeholder: "Auteur" },
              ].map(({ value, key, placeholder }) => (
                <input
                  key={key}
                  value={value}
                  onChange={(e) => setBookDraft((p) => ({ ...p, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="rounded-xl border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm"
                />
              ))}
              <input type="number" value={bookDraft.pages}
                onChange={(e) => setBookDraft((p) => ({ ...p, pages: e.target.value }))}
                placeholder="Pages" className="rounded-xl border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm"
              />
              <select value={bookDraft.category}
                onChange={(e) => setBookDraft((p) => ({ ...p, category: e.target.value }))}
                className="rounded-xl border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm"
              >
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <input value={bookDraft.image}
                onChange={(e) => setBookDraft((p) => ({ ...p, image: e.target.value }))}
                placeholder="Image URL (optionnel)"
                className="rounded-xl border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm md:col-span-2"
              />
              <textarea value={bookDraft.description}
                onChange={(e) => setBookDraft((p) => ({ ...p, description: e.target.value }))}
                placeholder="Description"
                className="min-h-24 rounded-xl border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm md:col-span-2"
              />
              <input type="number" step="0.1" min="1" max="5" value={bookDraft.rating}
                onChange={(e) => setBookDraft((p) => ({ ...p, rating: e.target.value }))}
                placeholder="Note" className="rounded-xl border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm"
              />
              <input type="number" min="0" value={bookDraft.discount}
                onChange={(e) => setBookDraft((p) => ({ ...p, discount: e.target.value }))}
                placeholder="Remise (GNF)" className="rounded-xl border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm"
              />
              <input type="number" min="0" value={bookDraft.stock}
                onChange={(e) => setBookDraft((p) => ({ ...p, stock: e.target.value }))}
                placeholder="Stock" className="rounded-xl border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm"
              />
              <input type="number" min="0" value={bookDraft.manualPrice}
                onChange={(e) => setBookDraft((p) => ({ ...p, manualPrice: e.target.value }))}
                placeholder="Override prix manuel (optionnel)"
                className="rounded-xl border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm"
              />
              <label className="inline-flex items-center gap-2 text-sm text-zinc-600">
                <input type="checkbox" checked={bookDraft.manualPriceEnabled}
                  onChange={(e) => setBookDraft((p) => ({ ...p, manualPriceEnabled: e.target.checked }))}
                /> Activer override manuel
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-zinc-600">
                <input type="checkbox" checked={bookDraft.featured}
                  onChange={(e) => setBookDraft((p) => ({ ...p, featured: e.target.checked }))}
                /> Mettre en avant
              </label>
              <input type="file" accept=".pdf,.epub,.txt"
                onChange={handleBookFileChange}
                className="rounded-xl border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm md:col-span-2"
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={handleBookSubmit} disabled={savingBook}
                className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {savingBook ? "Sauvegarde..." : editingBookId ? "Mettre à jour" : "Ajouter"}
              </button>
              <button onClick={resetBookForm}
                className="rounded-xl border border-zinc-300 dark:border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >Réinitialiser</button>
            </div>
          </article>

          <article className="card-surface p-4">
            <input value={bookQuery} onChange={(e) => setBookQuery(e.target.value)}
              placeholder="Rechercher un livre..."
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm"
            />
            <div className="mt-3 space-y-2">
              {filteredBooks.map((book) => (
                <div key={book.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 p-3"
                >
                  <div>
                    <p className="font-semibold text-slate-800">{book.title}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {book.author} · {book.category} · {book.pages} pages
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleBookEdit(book)}
                      className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300"
                    >Modifier</button>
                    <button onClick={() => { if (window.confirm("Êtes-vous sûr de vouloir supprimer ce livre ? Cette action est irréversible.")) removeBook(book.id); }}
                      className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-700"
                    >Supprimer</button>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>
      )}

      {/* ── ORDERS ── */}
      {activeTab === "orders" && (
        <section className="card-surface p-4">
          <input value={orderQuery} onChange={(e) => setOrderQuery(e.target.value)}
            placeholder="Rechercher commande (nom, téléphone, transaction)"
            className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm"
          />
          <div className="mt-3 space-y-2">
            {filteredOrders.map((order) => (
              <article key={order.fbKey} className="rounded-xl border border-slate-200 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-800">{order.name}</p>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    {order.createdAt ? new Date(order.createdAt).toLocaleString("fr-FR") : "Date inconnue"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {order.phone} · Ref: {order.referencePaiement || order.txId || "N/A"} · Total: {formatGNF(order.total)}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 py-1 text-xs font-medium text-zinc-600">
                    Statut: {order.status}
                  </span>
                  {order.status === "pending" && (
                    <>
                      <button onClick={() => setOrderStatus(order.fbKey, "approved")}
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white"
                      >Approuver</button>
                      <button onClick={() => setOrderStatus(order.fbKey, "rejected")}
                        className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white"
                      >Rejeter</button>
                    </>
                  )}
                </div>
              </article>
            ))}
          </div>
          <div className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">
            Rejetées: {rejectedOrders.length}
          </div>
        </section>
      )}

      {/* ── PROMOS ── */}
      {activeTab === "promos" && (
        <section className="space-y-3">
          <article className="card-surface p-4">
            <h2 className="font-heading text-lg font-bold text-zinc-900">
              Créer un code promo
            </h2>
            <div className="mt-3 grid gap-3 md:grid-cols-4">
              <input value={promoDraft.code}
                onChange={(e) => setPromoDraft((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
                placeholder="Code"
                className="rounded-xl border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm"
              />
              <input type="number" value={promoDraft.discount}
                onChange={(e) => setPromoDraft((p) => ({ ...p, discount: e.target.value }))}
                placeholder="Réduction"
                className="rounded-xl border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm"
              />
              <select value={promoDraft.type}
                onChange={(e) => setPromoDraft((p) => ({ ...p, type: e.target.value }))}
                className="rounded-xl border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm"
              >
                <option value="percent">% Pourcentage</option>
                <option value="fixed">Montant fixe</option>
              </select>
              <input type="number" value={promoDraft.maxUses}
                onChange={(e) => setPromoDraft((p) => ({ ...p, maxUses: e.target.value }))}
                placeholder="Utilisations max"
                className="rounded-xl border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm"
              />
            </div>
            <button onClick={handleCreatePromo}
              className="mt-3 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white"
            >Ajouter le code promo</button>
          </article>

          <article className="card-surface p-4">
            <div className="space-y-2">
              {promoCodes.map((promo) => (
                <div key={promo.fbKey}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 p-3"
                >
                  <div>
                    <p className="font-semibold text-slate-800">{promo.code}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {promo.type === "percent" ? `${promo.discount}%` : formatGNF(promo.discount)}
                      {" · "}{promo.uses || 0}/{promo.maxUses || "∞"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => togglePromo(promo)}
                      className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300"
                    >{promo.active ? "Désactiver" : "Activer"}</button>
                    <button onClick={() => removePromo(promo.fbKey)}
                      className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-700"
                    >Supprimer</button>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>
      )}
    </div>
  );
}
