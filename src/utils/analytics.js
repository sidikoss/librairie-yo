const ANALYTICS_KEY = "yo_analytics";
const SESSION_KEY = "yo_session";

function getSession() {
  try {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Date.now() - parsed.startedAt < 30 * 60 * 1000) {
        return parsed;
      }
    }
  } catch {}
  
  return {
    id: generateId(),
    startedAt: Date.now(),
    pageCount: 0,
  };
}

function saveSession(session) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function generateId() {
  return `s_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function getPageKey() {
  return window.location.pathname + window.location.search;
}

export function trackPageView(pageName) {
  const session = getSession();
  session.pageCount++;
  saveSession(session);
  
  const event = {
    type: "pageview",
    page: pageName || getPageKey(),
    sessionId: session.id,
    timestamp: Date.now(),
  };
  
  queueEvent(event);
}

export function trackEvent(category, action, label = null, value = null) {
  const event = {
    type: "event",
    category,
    action,
    label,
    value,
    sessionId: getSession().id,
    timestamp: Date.now(),
  };
  
  queueEvent(event);
}

export function trackTiming(category, variable, value, label = null) {
  const event = {
    type: "timing",
    category,
    variable,
    value,
    label,
    sessionId: getSession().id,
    timestamp: Date.now(),
  };
  
  queueEvent(event);
}

export function trackError(error, fatal = false) {
  const event = {
    type: "error",
    description: error.message || String(error),
    fatal,
    url: window.location.href,
    sessionId: getSession().id,
    timestamp: Date.now(),
  };
  
  queueEvent(event);
}

function queueEvent(event) {
  try {
    const stored = localStorage.getItem(ANALYTICS_KEY);
    const queue = stored ? JSON.parse(stored) : [];
    
    queue.push(event);
    
    if (queue.length > 100) {
      queue.shift();
    }
    
    localStorage.setItem(ANALYTICS_KEY, JSON.stringify(queue));
  } catch (error) {
    console.warn("[Analytics] Failed to queue event:", error);
  }
}

export function getAnalytics() {
  try {
    const stored = localStorage.getItem(ANALYTICS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function clearAnalytics() {
  localStorage.removeItem(ANALYTICS_KEY);
  sessionStorage.removeItem(SESSION_KEY);
}

export function getSessionInfo() {
  return getSession();
}

export function getPageViews() {
  const events = getAnalytics();
  return events.filter((e) => e.type === "pageview");
}

export function getEvents() {
  const events = getAnalytics();
  return events.filter((e) => e.type === "event");
}

export function getErrors() {
  const events = getAnalytics();
  return events.filter((e) => e.type === "error");
}