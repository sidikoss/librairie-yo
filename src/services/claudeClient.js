function safeString(value) {
  return String(value || "").trim();
}

async function parseJsonSafe(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function extractReadableError(payload) {
  if (!payload) return "";
  if (typeof payload.error === "string") return payload.error;
  if (typeof payload.message === "string") return payload.message;
  if (payload.details) {
    if (typeof payload.details === "string") return payload.details;
    if (typeof payload.details?.error === "string") return payload.details.error;
  }
  return "";
}

export async function callClaude({
  model = "claude-3-5-sonnet-latest",
  messages,
  max_tokens = 512,
  temperature = 0.2,
  system,
} = {}) {
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error("callClaude: `messages` doit être un tableau non vide.");
  }

  const body = {
    model,
    messages,
    max_tokens,
    temperature,
    ...(system === undefined ? {} : { system }),
  };

  let res;
  try {
    res = await fetch("/api/claude", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (networkError) {
    throw new Error("Impossible de contacter le serveur Claude (réseau indisponible).");
  }

  const payload = await parseJsonSafe(res);
  if (!res.ok || !payload?.ok) {
    const detail = extractReadableError(payload) || safeString(payload?.error) || "";
    const status = res.status ? ` (HTTP ${res.status})` : "";
    throw new Error(detail ? `${detail}${status}` : `Erreur Claude${status}`);
  }

  return payload.data;
}

function extractTextFromClaudeResponse(data) {
  const blocks = Array.isArray(data?.content) ? data.content : [];
  const texts = blocks
    .map((b) => (b?.type === "text" ? String(b.text || "") : ""))
    .filter(Boolean);
  return texts.join("\n").trim();
}

export async function generateMetadata(prompt) {
  const cleanPrompt = safeString(prompt);
  if (!cleanPrompt) {
    throw new Error("generateMetadata: `prompt` est requis.");
  }

  const system =
    "Tu es un assistant qui génère des métadonnées propres et fiables. " +
    "Réponds UNIQUEMENT en JSON valide, sans texte autour. " +
    'Format: {"title":string,"author":string,"summary":string,"keywords":string[]}';

  const data = await callClaude({
    system,
    messages: [{ role: "user", content: cleanPrompt }],
    max_tokens: 512,
    temperature: 0.2,
    model: "claude-3-5-sonnet-latest",
  });

  const text = extractTextFromClaudeResponse(data);
  if (!text) return { title: "", author: "", summary: "", keywords: [] };

  try {
    const parsed = JSON.parse(text);
    return {
      title: safeString(parsed?.title),
      author: safeString(parsed?.author),
      summary: safeString(parsed?.summary),
      keywords: Array.isArray(parsed?.keywords)
        ? parsed.keywords.map((k) => safeString(k)).filter(Boolean)
        : [],
    };
  } catch {
    // Fallback: return raw content if model didn't comply.
    return { title: "", author: "", summary: text, keywords: [] };
  }
}

