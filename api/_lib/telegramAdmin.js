const DEFAULT_FIREBASE_DB_URL = "https://librairie-yo-default-rtdb.firebaseio.com";
const MAX_LIST_CARDS = 20;

function getConfig() {
  const firebaseDbUrl = String(
    process.env.FIREBASE_DB_URL || DEFAULT_FIREBASE_DB_URL,
  ).replace(/\/+$/, "");

  return {
    firebaseDbUrl,
    telegramBotToken: String(process.env.TELEGRAM_BOT_TOKEN || ""),
    telegramAdminChatId: String(process.env.TELEGRAM_ADMIN_CHAT_ID || ""),
    telegramWebhookSecret: String(process.env.TELEGRAM_WEBHOOK_SECRET || ""),
  };
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatGNF(value) {
  const safe = Number(value || 0);
  return `${safe.toLocaleString("fr-FR")} GNF`;
}

function statusLabel(status) {
  if (status === "approved") return "Approuvee";
  if (status === "rejected") return "Rejetee";
  return "En attente";
}

function statusBadge(status) {
  if (status === "approved") return "[OK]";
  if (status === "rejected") return "[NO]";
  return "[WAIT]";
}

function firebaseUrl(config, path) {
  return `${config.firebaseDbUrl}/${path}.json`;
}

async function firebaseRequest(config, path, options = {}) {
  const response = await fetch(firebaseUrl(config, path), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const bodyText = await response.text();
    throw new Error(
      `Firebase ${options.method || "GET"} ${path} failed: ${response.status} ${bodyText}`,
    );
  }

  return response.json();
}

function normalizeOrders(rawData) {
  if (!rawData || typeof rawData !== "object") return [];

  return Object.entries(rawData)
    .map(([fbKey, value]) => ({ ...(value || {}), fbKey }))
    .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
}

async function getOrders(config) {
  const raw = await firebaseRequest(config, "orders");
  return normalizeOrders(raw);
}

async function getOrderById(config, orderId) {
  if (!orderId) return null;
  const data = await firebaseRequest(config, `orders/${orderId}`);
  if (!data || typeof data !== "object") return null;
  return { ...data, fbKey: orderId };
}

async function patchOrderStatus(config, orderId, status) {
  return firebaseRequest(config, `orders/${orderId}`, {
    method: "PATCH",
    body: JSON.stringify({
      status,
      reviewedAt: Date.now(),
    }),
  });
}

async function telegramRequest(config, method, payload) {
  if (!config.telegramBotToken) {
    throw new Error("Missing TELEGRAM_BOT_TOKEN");
  }

  const response = await fetch(
    `https://api.telegram.org/bot${config.telegramBotToken}/${method}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload || {}),
    },
  );

  const data = await response.json();
  if (!response.ok || !data?.ok) {
    throw new Error(
      `Telegram ${method} failed: ${response.status} ${JSON.stringify(data)}`,
    );
  }
  return data;
}

function normalizeForSearch(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function getOrderSearchBlob(order) {
  return normalizeForSearch(
    [
      order?.fbKey,
      order?.name,
      order?.phone,
      order?.referencePaiement,
      order?.txId,
      order?.status,
    ]
      .filter(Boolean)
      .join(" "),
  );
}

function filterOrdersBySearchTerm(orders, rawTerm) {
  const term = normalizeForSearch(rawTerm);
  if (!term) return [];

  const tokens = term.split(/\s+/).filter(Boolean);
  if (!tokens.length) return [];

  return orders.filter((order) => {
    const blob = getOrderSearchBlob(order);
    return tokens.every((token) => blob.includes(token));
  });
}

function parseCommandText(text) {
  const raw = String(text || "").trim();
  if (!raw.startsWith("/")) return null;

  const [head, ...rest] = raw.split(/\s+/);
  const command = head.slice(1).split("@")[0].toLowerCase();
  return {
    command,
    args: rest.join(" ").trim(),
  };
}

function parseLimit(args, fallback = 10, max = MAX_LIST_CARDS) {
  const firstArg = String(args || "").split(/\s+/)[0];
  const value = Number(firstArg);
  if (!Number.isFinite(value)) return fallback;
  const clamped = Math.max(1, Math.floor(value));
  return Math.min(clamped, max);
}

function firstArg(args) {
  return String(args || "").trim().split(/\s+/)[0] || "";
}

function buildOrderText(order) {
  const orderId = order?.fbKey || "N/A";
  const customerName = escapeHtml(order?.name || "Client");
  const phone = escapeHtml(order?.phone || "N/A");
  const total = formatGNF(order?.total || 0);
  const reference = escapeHtml(order?.referencePaiement || order?.txId || "N/A");
  const createdAt = order?.createdAt
    ? new Date(order.createdAt).toLocaleString("fr-FR")
    : "Date inconnue";
  const status = order?.status || "pending";
  const items = Array.isArray(order?.items) ? order.items : [];
  const itemLines = items.slice(0, 6).map((item) => {
    const title = escapeHtml(item?.title || "Livre");
    const qty = Number(item?.qty || 1);
    const lineTotal = formatGNF(item?.price || 0);
    return `- ${title} x${qty} (${lineTotal})`;
  });

  const hasMoreItems = items.length > itemLines.length;
  if (hasMoreItems) {
    itemLines.push(`- ... ${items.length - itemLines.length} autre(s) livre(s)`);
  }

  return [
    `<b>Commande #${escapeHtml(orderId)}</b>`,
    `${statusBadge(status)} <b>${escapeHtml(statusLabel(status))}</b>`,
    "",
    `<b>Client:</b> ${customerName}`,
    `<b>Telephone:</b> +${phone}`,
    `<b>Reference:</b> ${reference}`,
    `<b>Total:</b> ${escapeHtml(total)}`,
    `<b>Date:</b> ${escapeHtml(createdAt)}`,
    "",
    "<b>Articles:</b>",
    ...(itemLines.length ? itemLines : ["- Aucun article"]),
  ].join("\n");
}

function buildOrderKeyboard(orderId, status) {
  if (!orderId) return undefined;

  const rows = [];
  if (status === "pending") {
    rows.push([
      {
        text: "Approve",
        callback_data: `order:approved:${orderId}`,
      },
      {
        text: "Reject",
        callback_data: `order:rejected:${orderId}`,
      },
    ]);
  }

  rows.push([
    {
      text: "Refresh",
      callback_data: `order:refresh:${orderId}`,
    },
  ]);

  return { inline_keyboard: rows };
}

function buildQuickReplyKeyboard() {
  return {
    keyboard: [
      [{ text: "/stats" }, { text: "/pending" }, { text: "/recent" }],
      [{ text: "/approved" }, { text: "/rejected" }, { text: "/today" }],
      [{ text: "/search " }, { text: "/order " }],
    ],
    resize_keyboard: true,
    one_time_keyboard: false,
    input_field_placeholder: "Commande admin Telegram...",
  };
}

function computeOrderStats(orders) {
  const stats = {
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    revenueApproved: 0,
    revenuePending: 0,
    todayTotal: 0,
    todayPending: 0,
    todayApproved: 0,
    todayRevenue: 0,
  };

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const dayStart = now.getTime();

  for (const order of orders) {
    const status = String(order?.status || "pending");
    const total = Number(order?.total || 0);
    const createdAt = Number(order?.createdAt || 0);

    stats.total += 1;
    if (status === "approved") {
      stats.approved += 1;
      stats.revenueApproved += total;
    } else if (status === "rejected") {
      stats.rejected += 1;
    } else {
      stats.pending += 1;
      stats.revenuePending += total;
    }

    if (createdAt >= dayStart) {
      stats.todayTotal += 1;
      if (status === "approved") {
        stats.todayApproved += 1;
        stats.todayRevenue += total;
      } else if (status !== "rejected") {
        stats.todayPending += 1;
      }
    }
  }

  return stats;
}

function isAuthorizedChat(config, chatId) {
  if (!config.telegramAdminChatId) return false;
  return String(chatId) === config.telegramAdminChatId;
}

async function sendMessage(config, chatId, text, extra = {}) {
  return telegramRequest(config, "sendMessage", {
    chat_id: chatId,
    text,
    ...extra,
  });
}

async function sendOrderCard(config, chatId, order) {
  const orderId = order?.fbKey || "";
  return sendMessage(config, chatId, buildOrderText(order), {
    parse_mode: "HTML",
    disable_web_page_preview: true,
    reply_markup: buildOrderKeyboard(orderId, order?.status || "pending"),
  });
}

async function sendOrderCardsList(config, chatId, title, orders, limit) {
  if (!orders.length) {
    await sendMessage(config, chatId, `${title}\nAucun resultat.`);
    return;
  }

  const safeLimit = Math.min(Math.max(1, Number(limit || 10)), MAX_LIST_CARDS);
  const displayed = orders.slice(0, safeLimit);

  await sendMessage(
    config,
    chatId,
    `${title}\n${orders.length} commande(s), affichage ${displayed.length}.`,
  );

  for (const order of displayed) {
    await sendOrderCard(config, chatId, order);
  }

  if (orders.length > displayed.length) {
    await sendMessage(
      config,
      chatId,
      `Astuce: augmentez la limite (max ${MAX_LIST_CARDS}), exemple: /recent ${MAX_LIST_CARDS}`,
    );
  }
}

async function sendHelp(config, chatId) {
  const lines = [
    "Admin Telegram Librairie YO",
    "",
    "Commandes principales:",
    "/stats - statistiques globales",
    "/today - resume des commandes du jour",
    "/pending [n] - commandes en attente",
    "/approved [n] - commandes approuvees",
    "/rejected [n] - commandes rejetees",
    "/recent [n] - dernieres commandes",
    "/search <texte> - rechercher (id, nom, tel, reference)",
    "/order <id> - afficher une commande",
    "/approve <id> - approuver une commande",
    "/reject <id> - rejeter une commande",
    "/menu - afficher ce menu",
  ];

  await sendMessage(config, chatId, lines.join("\n"), {
    reply_markup: buildQuickReplyKeyboard(),
  });
}

async function sendStats(config, chatId) {
  const orders = await getOrders(config);
  const stats = computeOrderStats(orders);

  const lines = [
    "Statistiques admin",
    "",
    `Total commandes: ${stats.total}`,
    `En attente: ${stats.pending}`,
    `Approuvees: ${stats.approved}`,
    `Rejetees: ${stats.rejected}`,
    `CA approuve: ${formatGNF(stats.revenueApproved)}`,
    "",
    "Aujourd'hui:",
    `Commandes: ${stats.todayTotal}`,
    `En attente: ${stats.todayPending}`,
    `Approuvees: ${stats.todayApproved}`,
    `CA approuve: ${formatGNF(stats.todayRevenue)}`,
  ];

  await sendMessage(config, chatId, lines.join("\n"));
}

async function sendTodaySummary(config, chatId) {
  const orders = await getOrders(config);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const dayStart = now.getTime();

  const todayOrders = orders.filter((order) => Number(order?.createdAt || 0) >= dayStart);
  const pendingToday = todayOrders.filter(
    (order) => String(order?.status || "pending") === "pending",
  );

  const revenueToday = todayOrders
    .filter((order) => String(order?.status || "pending") === "approved")
    .reduce((sum, order) => sum + Number(order?.total || 0), 0);

  await sendMessage(
    config,
    chatId,
    [
      "Resume du jour",
      "",
      `Commandes: ${todayOrders.length}`,
      `En attente: ${pendingToday.length}`,
      `CA approuve: ${formatGNF(revenueToday)}`,
    ].join("\n"),
  );

  if (pendingToday.length) {
    await sendOrderCardsList(
      config,
      chatId,
      "Commandes en attente du jour",
      pendingToday,
      parseLimit("", 10),
    );
  }
}

async function sendOrderById(config, chatId, orderId) {
  if (!orderId) {
    await sendMessage(config, chatId, "Utilisez /order <id>.");
    return;
  }

  const order = await getOrderById(config, orderId);
  if (!order) {
    await sendMessage(config, chatId, `Commande ${orderId} introuvable.`);
    return;
  }

  await sendOrderCard(config, chatId, order);
}

async function processStatusCommand(config, chatId, orderId, status) {
  if (!orderId) {
    await sendMessage(
      config,
      chatId,
      `Utilisez /${status === "approved" ? "approve" : "reject"} <id>.`,
    );
    return;
  }

  const current = await getOrderById(config, orderId);
  if (!current) {
    await sendMessage(config, chatId, `Commande ${orderId} introuvable.`);
    return;
  }

  await patchOrderStatus(config, orderId, status);
  const updatedOrder = await getOrderById(config, orderId);

  if (!updatedOrder) {
    await sendMessage(
      config,
      chatId,
      `Statut mis a jour, mais commande ${orderId} introuvable ensuite.`,
    );
    return;
  }

  await sendOrderCard(config, chatId, updatedOrder);
}

async function sendSearchResults(config, chatId, term) {
  if (!term) {
    await sendMessage(config, chatId, "Utilisez /search <nom|tel|reference|id>.");
    return;
  }

  const orders = await getOrders(config);
  const results = filterOrdersBySearchTerm(orders, term);
  await sendOrderCardsList(
    config,
    chatId,
    `Recherche: "${term}"`,
    results,
    parseLimit("", 10),
  );
}

async function sendOrdersByStatus(config, chatId, status, args) {
  const orders = await getOrders(config);
  const filtered = orders.filter(
    (order) => String(order?.status || "pending") === status,
  );
  const limit = parseLimit(args, 10);
  const title =
    status === "approved"
      ? "Commandes approuvees"
      : status === "rejected"
        ? "Commandes rejetees"
        : "Commandes en attente";
  await sendOrderCardsList(config, chatId, title, filtered, limit);
}

async function sendRecentOrders(config, chatId, args) {
  const orders = await getOrders(config);
  const limit = parseLimit(args, 10);
  await sendOrderCardsList(config, chatId, "Dernieres commandes", orders, limit);
}

async function updateOrderCardMessage(config, chatId, messageId, order) {
  return telegramRequest(config, "editMessageText", {
    chat_id: chatId,
    message_id: messageId,
    text: buildOrderText(order),
    parse_mode: "HTML",
    disable_web_page_preview: true,
    reply_markup: buildOrderKeyboard(order?.fbKey || "", order?.status || "pending"),
  });
}

async function handleMessage(config, message) {
  const chatId = message?.chat?.id;
  if (!chatId) return;

  if (!isAuthorizedChat(config, chatId)) {
    await sendMessage(config, chatId, "Acces non autorise.");
    return;
  }

  const text = String(message?.text || "").trim();
  if (!text) return;

  const parsed = parseCommandText(text);
  if (!parsed) {
    await sendHelp(config, chatId);
    return;
  }

  try {
    switch (parsed.command) {
      case "start":
      case "help":
      case "menu":
        await sendHelp(config, chatId);
        return;
      case "stats":
        await sendStats(config, chatId);
        return;
      case "today":
        await sendTodaySummary(config, chatId);
        return;
      case "pending":
        await sendOrdersByStatus(config, chatId, "pending", parsed.args);
        return;
      case "approved":
        await sendOrdersByStatus(config, chatId, "approved", parsed.args);
        return;
      case "rejected":
        await sendOrdersByStatus(config, chatId, "rejected", parsed.args);
        return;
      case "recent":
        await sendRecentOrders(config, chatId, parsed.args);
        return;
      case "search":
        await sendSearchResults(config, chatId, parsed.args);
        return;
      case "order":
        await sendOrderById(config, chatId, firstArg(parsed.args));
        return;
      case "approve":
        await processStatusCommand(config, chatId, firstArg(parsed.args), "approved");
        return;
      case "reject":
        await processStatusCommand(config, chatId, firstArg(parsed.args), "rejected");
        return;
      default:
        await sendHelp(config, chatId);
    }
  } catch (error) {
    console.error("[telegram-admin] message handling error:", error);
    await sendMessage(
      config,
      chatId,
      `Erreur: ${error?.message || "operation impossible"}`,
    );
  }
}

async function handleCallbackQuery(config, callbackQuery) {
  const callbackId = callbackQuery?.id;
  const data = String(callbackQuery?.data || "");
  const chatId = callbackQuery?.message?.chat?.id;
  const messageId = callbackQuery?.message?.message_id;

  if (!chatId || !messageId || !callbackId) return;

  if (!isAuthorizedChat(config, chatId)) {
    await telegramRequest(config, "answerCallbackQuery", {
      callback_query_id: callbackId,
      text: "Acces non autorise.",
      show_alert: false,
    });
    return;
  }

  const match = data.match(/^order:(approved|rejected|refresh):(.+)$/);
  if (!match) {
    await telegramRequest(config, "answerCallbackQuery", {
      callback_query_id: callbackId,
      text: "Action inconnue.",
      show_alert: false,
    });
    return;
  }

  const action = match[1];
  const orderId = match[2];

  try {
    if (action === "approved" || action === "rejected") {
      await patchOrderStatus(config, orderId, action);
    }

    const updatedOrder = await getOrderById(config, orderId);
    if (!updatedOrder) {
      await telegramRequest(config, "answerCallbackQuery", {
        callback_query_id: callbackId,
        text: `Commande ${orderId} introuvable.`,
        show_alert: false,
      });
      return;
    }

    await telegramRequest(config, "answerCallbackQuery", {
      callback_query_id: callbackId,
      text:
        action === "refresh"
          ? `Commande ${orderId} rafraichie.`
          : `Commande ${orderId} -> ${statusLabel(action)}.`,
      show_alert: false,
    });

    try {
      await updateOrderCardMessage(config, chatId, messageId, updatedOrder);
    } catch {
      await sendOrderCard(config, chatId, updatedOrder);
    }
  } catch (error) {
    console.error("[telegram-admin] callback error:", error);
    await telegramRequest(config, "answerCallbackQuery", {
      callback_query_id: callbackId,
      text: "Erreur pendant l'action.",
      show_alert: false,
    });
  }
}

export function validateWebhookSecret(headerValue) {
  const config = getConfig();
  if (!config.telegramWebhookSecret) return true;
  return String(headerValue || "") === config.telegramWebhookSecret;
}

export function validateConfig() {
  const config = getConfig();
  const missing = [];
  if (!config.telegramBotToken) missing.push("TELEGRAM_BOT_TOKEN");
  if (!config.telegramAdminChatId) missing.push("TELEGRAM_ADMIN_CHAT_ID");
  if (!config.firebaseDbUrl) missing.push("FIREBASE_DB_URL");
  return { config, missing };
}

export async function handleTelegramUpdate(update) {
  const { config, missing } = validateConfig();
  if (missing.length) {
    throw new Error(`Missing env vars: ${missing.join(", ")}`);
  }

  if (update?.message) {
    await handleMessage(config, update.message);
  }

  if (update?.callback_query) {
    await handleCallbackQuery(config, update.callback_query);
  }
}
