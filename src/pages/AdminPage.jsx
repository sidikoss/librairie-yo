import { useMemo, useState } from "react";
import { ADMIN_PASSWORD, STORAGE_KEYS } from "../config/constants";
import { useCatalog } from "../context/CatalogContext";
import { formatGNF } from "../utils/format";

const SESSION_TTL = 2 * 60 * 60 * 1000;

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

function loadAdminSession() {
  const raw = localStorage.getItem(STORAGE_KEYS.adminSession);
  const timestamp = Number(raw || 0);
  return Boolean(timestamp && Date.now() - timestamp < SESSION_TTL);
}

function saveAdminSession() {
  localStorage.setItem(STORAGE_KEYS.adminSession, String(Date.now()));
}

function clearAdminSession() {
  localStorage.removeItem(STORAGE_KEYS.adminSession);
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

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

  const [isLoggedIn, setIsLoggedIn] = useState(loadAdminSession);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [activeTab, setActiveTab] = useState("stats");
  const [bookDraft, setBookDraft] = useState(emptyBookDraft);
  const [editingBookId, setEditingBookId] = useState("");
  const [uploadPayload, setUploadPayload] = useState(null);
  const [bookQuery, setBookQuery] = useState("");
  const [orderQuery, setOrderQuery] = useState("");
  const [promoDraft, setPromoDraft] = useState({
    code: "",
    discount: "",
    type: "percent",
    maxUses: "100",
  });
  const [savingBook, setSavingBook] = useState(false);

  const approvedOrders = useMemo(
    () => orders.filter((order) => order.status === "approved"),
    [orders],
  );
  const pendingOrders = useMemo(
    () => orders.filter((order) => order.status === "pending"),
    [orders],
  );
  const rejectedOrders = useMemo(
    () => orders.filter((order) => order.status === "rejected"),
    [orders],
  );
  const totalRevenue = useMemo(
    () => approvedOrders.reduce((sum, order) => sum + Number(order.total || 0), 0),
    [approvedOrders],
  );

  const filteredBooks = useMemo(() => {
    const query = bookQuery.toLowerCase();
    if (!query) return books;
    return books.filter(
      (book) =>
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query),
    );
  }, [books, bookQuery]);

  const filteredOrders = useMemo(() => {
    const query = orderQuery.toLowerCase();
    if (!query) return orders;
    return orders.filter(
      (order) =>
        String(order.name || "").toLowerCase().includes(query) ||
        String(order.phone || "").includes(query) ||
        String(order.referencePaiement || order.txId || "")
          .toLowerCase()
          .includes(query),
    );
  }, [orders, orderQuery]);

  const resetBookForm = () => {
    setBookDraft(emptyBookDraft);
    setEditingBookId("");
    setUploadPayload(null);
  };

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setIsLoggedIn(true);
      setLoginError("");
      saveAdminSession();
      return;
    }
    setLoginError("Mot de passe incorrect.");
  };

  const handleLogout = () => {
    clearAdminSession();
    setIsLoggedIn(false);
    setPassword("");
    setLoginError("");
  };

  const handleBookFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const fileData = await readFileAsBase64(file);
    setUploadPayload({
      fileData,
      fileName: file.name,
      fileType: file.type || "application/octet-stream",
    });
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
    setPromoDraft({
      code: "",
      discount: "",
      type: "percent",
      maxUses: "100",
    });
  };

  if (!isLoggedIn) {
    return (
      <div className="mx-auto max-w-md card-surface p-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-brand-600">
          Administration
        </p>
        <h1 className="font-heading text-2xl font-extrabold text-slate-900">
          Connexion admin
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Entrez le mot de passe pour gérer le catalogue et les commandes.
        </p>
        <input
          type="password"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            setLoginError("");
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              handleLogin();
            }
          }}
          placeholder="Mot de passe"
          className="mt-4 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-300 focus:ring"
        />
        {loginError ? <p className="mt-2 text-sm text-rose-600">{loginError}</p> : null}
        <button
          onClick={handleLogin}
          className="mt-4 w-full rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white"
        >
          Se connecter
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-600">
            Administration
          </p>
          <h1 className="font-heading text-2xl font-extrabold text-slate-900">
            Back-office Librairie YO
          </h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={refreshCatalog}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
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
        {[
          ["stats", "Stats"],
          ["books", "Catalogue"],
          ["orders", "Commandes"],
          ["promos", "Promos"],
        ].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              activeTab === id
                ? "bg-brand-600 text-white"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      {activeTab === "stats" ? (
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <article className="card-surface p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Livres</p>
            <p className="mt-1 text-2xl font-extrabold text-slate-900">{books.length}</p>
          </article>
          <article className="card-surface p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">En attente</p>
            <p className="mt-1 text-2xl font-extrabold text-amber-600">{pendingOrders.length}</p>
          </article>
          <article className="card-surface p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Approuvées</p>
            <p className="mt-1 text-2xl font-extrabold text-emerald-600">{approvedOrders.length}</p>
          </article>
          <article className="card-surface p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Revenus</p>
            <p className="mt-1 text-2xl font-extrabold text-slate-900">{formatGNF(totalRevenue)}</p>
          </article>
        </section>
      ) : null}

      {activeTab === "books" ? (
        <section className="space-y-4">
          <article className="card-surface p-4">
            <h2 className="font-heading text-lg font-bold text-slate-900">
              {editingBookId ? "Modifier un livre" : "Ajouter un livre"}
            </h2>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <input
                value={bookDraft.title}
                onChange={(event) =>
                  setBookDraft((prev) => ({ ...prev, title: event.target.value }))
                }
                placeholder="Titre"
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                value={bookDraft.author}
                onChange={(event) =>
                  setBookDraft((prev) => ({ ...prev, author: event.target.value }))
                }
                placeholder="Auteur"
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                type="number"
                value={bookDraft.pages}
                onChange={(event) =>
                  setBookDraft((prev) => ({ ...prev, pages: event.target.value }))
                }
                placeholder="Pages"
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
              <select
                value={bookDraft.category}
                onChange={(event) =>
                  setBookDraft((prev) => ({ ...prev, category: event.target.value }))
                }
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <input
                value={bookDraft.image}
                onChange={(event) =>
                  setBookDraft((prev) => ({ ...prev, image: event.target.value }))
                }
                placeholder="Image URL (optionnel)"
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm md:col-span-2"
              />
              <textarea
                value={bookDraft.description}
                onChange={(event) =>
                  setBookDraft((prev) => ({ ...prev, description: event.target.value }))
                }
                placeholder="Description"
                className="min-h-24 rounded-xl border border-slate-300 px-3 py-2 text-sm md:col-span-2"
              />
              <input
                type="number"
                step="0.1"
                min="1"
                max="5"
                value={bookDraft.rating}
                onChange={(event) =>
                  setBookDraft((prev) => ({ ...prev, rating: event.target.value }))
                }
                placeholder="Note"
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                type="number"
                min="0"
                value={bookDraft.discount}
                onChange={(event) =>
                  setBookDraft((prev) => ({ ...prev, discount: event.target.value }))
                }
                placeholder="Remise (GNF)"
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                type="number"
                min="0"
                value={bookDraft.stock}
                onChange={(event) =>
                  setBookDraft((prev) => ({ ...prev, stock: event.target.value }))
                }
                placeholder="Stock"
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                type="number"
                min="0"
                value={bookDraft.manualPrice}
                onChange={(event) =>
                  setBookDraft((prev) => ({ ...prev, manualPrice: event.target.value }))
                }
                placeholder="Override prix manuel (optionnel)"
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
              <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={bookDraft.manualPriceEnabled}
                  onChange={(event) =>
                    setBookDraft((prev) => ({
                      ...prev,
                      manualPriceEnabled: event.target.checked,
                    }))
                  }
                />
                Activer override manuel
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={bookDraft.featured}
                  onChange={(event) =>
                    setBookDraft((prev) => ({ ...prev, featured: event.target.checked }))
                  }
                />
                Mettre en avant
              </label>
              <input
                type="file"
                accept=".pdf,.epub,.txt"
                onChange={handleBookFileChange}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm md:col-span-2"
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={handleBookSubmit}
                disabled={savingBook}
                className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {savingBook ? "Sauvegarde..." : editingBookId ? "Mettre à jour" : "Ajouter"}
              </button>
              <button
                onClick={resetBookForm}
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700"
              >
                Réinitialiser
              </button>
            </div>
          </article>

          <article className="card-surface p-4">
            <input
              value={bookQuery}
              onChange={(event) => setBookQuery(event.target.value)}
              placeholder="Rechercher un livre..."
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
            <div className="mt-3 space-y-2">
              {filteredBooks.map((book) => (
                <div
                  key={book.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 p-3"
                >
                  <div>
                    <p className="font-semibold text-slate-800">{book.title}</p>
                    <p className="text-xs text-slate-500">
                      {book.author} · {book.category} · {book.pages} pages
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleBookEdit(book)}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => removeBook(book.id)}
                      className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-700"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>
      ) : null}

      {activeTab === "orders" ? (
        <section className="card-surface p-4">
          <input
            value={orderQuery}
            onChange={(event) => setOrderQuery(event.target.value)}
            placeholder="Rechercher commande (nom, téléphone, transaction)"
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
          />
          <div className="mt-3 space-y-2">
            {filteredOrders.map((order) => (
              <article key={order.fbKey} className="rounded-xl border border-slate-200 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-800">{order.name}</p>
                  <span className="text-xs text-slate-500">
                    {order.createdAt
                      ? new Date(order.createdAt).toLocaleString("fr-FR")
                      : "Date inconnue"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {order.phone} · Ref: {order.referencePaiement || order.txId || "N/A"} · Total: {formatGNF(order.total)}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                    Statut: {order.status}
                  </span>
                  {order.status === "pending" ? (
                    <>
                      <button
                        onClick={() => setOrderStatus(order.fbKey, "approved")}
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white"
                      >
                        Approuver
                      </button>
                      <button
                        onClick={() => setOrderStatus(order.fbKey, "rejected")}
                        className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white"
                      >
                        Rejeter
                      </button>
                    </>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
          <div className="mt-4 text-xs text-slate-500">
            Rejetées: {rejectedOrders.length}
          </div>
        </section>
      ) : null}

      {activeTab === "promos" ? (
        <section className="space-y-3">
          <article className="card-surface p-4">
            <h2 className="font-heading text-lg font-bold text-slate-900">
              Créer un code promo
            </h2>
            <div className="mt-3 grid gap-3 md:grid-cols-4">
              <input
                value={promoDraft.code}
                onChange={(event) =>
                  setPromoDraft((prev) => ({ ...prev, code: event.target.value.toUpperCase() }))
                }
                placeholder="Code"
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                type="number"
                value={promoDraft.discount}
                onChange={(event) =>
                  setPromoDraft((prev) => ({ ...prev, discount: event.target.value }))
                }
                placeholder="Réduction"
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
              <select
                value={promoDraft.type}
                onChange={(event) =>
                  setPromoDraft((prev) => ({ ...prev, type: event.target.value }))
                }
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="percent">% Pourcentage</option>
                <option value="fixed">Montant fixe</option>
              </select>
              <input
                type="number"
                value={promoDraft.maxUses}
                onChange={(event) =>
                  setPromoDraft((prev) => ({ ...prev, maxUses: event.target.value }))
                }
                placeholder="Utilisations max"
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <button
              onClick={handleCreatePromo}
              className="mt-3 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white"
            >
              Ajouter le code promo
            </button>
          </article>

          <article className="card-surface p-4">
            <div className="space-y-2">
              {promoCodes.map((promo) => (
                <div
                  key={promo.fbKey}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 p-3"
                >
                  <div>
                    <p className="font-semibold text-slate-800">{promo.code}</p>
                    <p className="text-xs text-slate-500">
                      {promo.type === "percent"
                        ? `${promo.discount}%`
                        : formatGNF(promo.discount)}{" "}
                      · {promo.uses || 0}/{promo.maxUses || "∞"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => togglePromo(promo)}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700"
                    >
                      {promo.active ? "Désactiver" : "Activer"}
                    </button>
                    <button
                      onClick={() => removePromo(promo.fbKey)}
                      className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-700"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>
      ) : null}
    </div>
  );
}

