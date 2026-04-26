// api/_lib/securityMonitor.js
// Monitoring de sécurité - Détecte et journalise les activités suspectes
// Alertes automatiques pour comportements anormaux

const SUSPICIOUS_PATTERNS = {
  bruteForce: {
    adminAuth: { threshold: 3, windowMs: 5 * 60 * 1000 },
    payment: { threshold: 5, windowMs: 10 * 60 * 1000 },
  },
  xssIndicators: [
    /<script/i,
    /javascript:/i,
    /onerror\s*=/i,
    /onload\s*=/i,
    /document\.cookie/i,
  ],
  sqlInjection: [
    /('|"|;|--|\/\*|\*\/)/,
    /\b(union|select|insert|update|delete|drop)\b/i,
  ],
};

const SECURITY_LOG = [];
const MAX_LOG_ENTRIES = 1000;
const LOG_TTL_MS = 24 * 60 * 60 * 1000;

function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.headers['x-real-ip']
    || req.socket?.remoteAddress
    || 'unknown';
}

function getUserAgent(req) {
  return req.headers['user-agent'] || 'unknown';
}

function getTimestamp() {
  return new Date().toISOString();
}

function detectXSS(input) {
  if (typeof input !== 'string') return false;
  return SUSPICIOUS_PATTERNS.xssIndicators.some(pattern => pattern.test(input));
}

function detectSQLInjection(input) {
  if (typeof input !== 'string') return false;
  return SUSPICIOUS_PATTERNS.sqlInjection.some(pattern => pattern.test(input));
}

function checkRequestForThreats(req) {
  const threats = [];
  const body = req.body || {};
  const query = req.query || {};
  const headers = req.headers || {};

  const allStrings = [
    ...Object.values(body),
    ...Object.values(query),
    headers['user-agent'],
    headers['referer'],
  ].filter(v => typeof v === 'string');

  for (const str of allStrings) {
    if (detectXSS(str)) {
      threats.push({ type: 'XSS', value: str.slice(0, 50) });
    }
    if (detectSQLInjection(str)) {
      threats.push({ type: 'SQL_INJECTION', value: str.slice(0, 50) });
    }
  }

  return threats;
}

function addSecurityLog(entry) {
  SECURITY_LOG.push({
    ...entry,
    timestamp: getTimestamp(),
  });

  while (SECURITY_LOG.length > MAX_LOG_ENTRIES) {
    SECURITY_LOG.shift();
  }
}

export function logSecurityEvent(type, req, details = {}) {
  const entry = {
    type,
    severity: getSeverity(type),
    ip: getClientIP(req),
    userAgent: getUserAgent(req),
    path: req.path,
    method: req.method,
    ...details,
  };

  addSecurityLog(entry);

  console.warn(`[SECURITY ${entry.severity}] ${type}:`, {
    ip: entry.ip,
    path: entry.path,
    ...details,
  });

  if (entry.severity === 'CRITICAL') {
    notifySecurityAlert(entry);
  }
}

function getSeverity(type) {
  const criticalTypes = [
    'SQL_INJECTION_DETECTED',
    'BRUTE_FORCE_DETECTED',
    'INVALID_ADMIN_TOKEN',
    'UNAUTHORIZED_ADMIN_ACCESS',
    'PAYMENT_FRAUD_ATTEMPT',
  ];
  
  const highTypes = [
    'XSS_DETECTED',
    'RATE_LIMIT_EXCEEDED',
    'SUSPICIOUS_REQUEST',
  ];

  if (criticalTypes.includes(type)) return 'CRITICAL';
  if (highTypes.includes(type)) return 'HIGH';
  return 'MEDIUM';
}

function notifySecurityAlert(event) {
  console.error('[SECURITY ALERT]', JSON.stringify(event, null, 2));
}

export function detectBruteForce(ip, endpoint) {
  const key = `brute:${ip}:${endpoint}`;
  const now = Date.now();
  
  const config = endpoint === '/api/admin-auth'
    ? SUSPICIOUS_PATTERNS.bruteForce.adminAuth
    : SUSPICIOUS_PATTERNS.bruteForce.payment;

  let attempts = 1;
  
  for (const log of SECURITY_LOG.slice(-100)) {
    if (
      log.ip === ip &&
      log.path === endpoint &&
      log.type === 'AUTH_FAILURE' &&
      now - new Date(log.timestamp).getTime() < config.windowMs
    ) {
      attempts++;
    }
  }

  return {
    isBruteForcing: attempts >= config.threshold,
    attempts,
    threshold: config.threshold,
  };
}

export function securityMiddleware(req, res, next) {
  req.securityContext = {
    ip: getClientIP(req),
    userAgent: getUserAgent(req),
    timestamp: getTimestamp(),
  };

  const threats = checkRequestForThreats(req);
  
  if (threats.length > 0) {
    logSecurityEvent('XSS_DETECTED', req, { threats });
  }

  next();
}

export function getSecurityLogs(limit = 100, filters = {}) {
  let logs = [...SECURITY_LOG].reverse();

  if (filters.ip) {
    logs = logs.filter(log => log.ip === filters.ip);
  }
  if (filters.type) {
    logs = logs.filter(log => log.type === filters.type);
  }
  if (filters.severity) {
    logs = logs.filter(log => log.severity === filters.severity);
  }
  if (filters.since) {
    const sinceDate = new Date(filters.since);
    logs = logs.filter(log => new Date(log.timestamp) >= sinceDate);
  }

  return logs.slice(0, limit);
}

export function getSecurityStats() {
  const now = Date.now();
  const last24h = now - LOG_TTL_MS;
  
  const recentLogs = SECURITY_LOG.filter(
    log => new Date(log.timestamp).getTime() > last24h
  );

  return {
    totalEvents: SECURITY_LOG.length,
    last24h: {
      total: recentLogs.length,
      critical: recentLogs.filter(l => l.severity === 'CRITICAL').length,
      high: recentLogs.filter(l => l.severity === 'HIGH').length,
      medium: recentLogs.filter(l => l.severity === 'MEDIUM').length,
    },
    byType: recentLogs.reduce((acc, log) => {
      acc[log.type] = (acc[log.type] || 0) + 1;
      return acc;
    }, {}),
    topOffenders: getTopOffenders(recentLogs),
  };
}

function getTopOffenders(logs) {
  const ipCounts = {};
  
  for (const log of logs) {
    if (log.severity === 'HIGH' || log.severity === 'CRITICAL') {
      ipCounts[log.ip] = (ipCounts[log.ip] || 0) + 1;
    }
  }
  
  return Object.entries(ipCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([ip, count]) => ({ ip, count }));
}

export function clearOldLogs() {
  const cutoff = Date.now() - LOG_TTL_MS;
  let removed = 0;
  
  while (SECURITY_LOG.length > 0) {
    const first = SECURITY_LOG[0];
    if (new Date(first.timestamp).getTime() < cutoff) {
      SECURITY_LOG.shift();
      removed++;
    } else {
      break;
    }
  }
  
  return removed;
}