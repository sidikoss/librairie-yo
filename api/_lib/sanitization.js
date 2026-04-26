// api/_lib/sanitization.js
// Middleware de sanitization pour prévenir les injections XSS et SQL
// ATTENTION: Les paramètres sont uniquement escapés, pas validés

const DANGEROUS_PATTERNS = {
  xss: [
    /<script[^>]*>[\s\S]*?<\/script>/gi,
    /<script[^>]*>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe[^>]*>[\s\S]*?<\/iframe>/gi,
    /<object[^>]*>[\s\S]*?<\/object>/gi,
    /<embed[^>]*>/gi,
    /<applet[^>]*>[\s\S]*?<\/applet>/gi,
    /<form[^>]*>/gi,
    /<input[^>]*>/gi,
    /<link[^>]*>/gi,
    /<meta[^>]*>/gi,
    /<svg[^>]*>[\s\S]*?<\/svg>/gi,
    /<math[^>]*>[\s\S]*?<\/math>/gi,
    /data:/gi,
    /vbscript:/gi,
    /expression\s*\(/gi,
  ],
  html: [
    /<[^>]*>/g,
    /&lt;/g,
    /&gt;/g,
    /&#x?[0-9a-f]+;/gi,
  ],
  sql: [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|TRUNCATE|EXEC|EXECUTE|XP_|SP_)\b)/gi,
    /(--|\/\*|\*\/|;)/g,
    /(\bOR\b|\bAND\b)\s*(\d+\s*=\s*\d+)/gi,
  ],
};

const DANGEROUS_CHARS = {
  html: { '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;', '&': '&amp;' },
  quotes: { '"': '\\"', "'": "\\'", '`': '\\`' },
};

function replacePattern(str, patterns) {
  let result = str;
  for (const pattern of patterns) {
    result = result.replace(pattern, '');
  }
  return result;
}

export function sanitizeXSS(input) {
  if (typeof input !== 'string') {
    return input;
  }

  let result = input;
  
  for (const pattern of DANGEROUS_PATTERNS.xss) {
    result = result.replace(pattern, '');
  }
  
  result = result.replace(/[\u0000-\u001F\u007F]/g, '');
  
  return result;
}

export function sanitizeHTML(input) {
  if (typeof input !== 'string') {
    return input;
  }

  let result = input;
  
  for (const pattern of DANGEROUS_PATTERNS.html) {
    result = result.replace(pattern, '');
  }
  
  return result;
}

export function sanitizeSQL(input) {
  if (typeof input !== 'string') {
    return input;
  }

  let result = input;
  
  for (const pattern of DANGEROUS_PATTERNS.sql) {
    result = result.replace(pattern, '');
  }
  
  return result;
}

export function escapeHTML(str) {
  if (typeof str !== 'string') {
    return str;
  }
  
  return str.replace(/[<>"'&]/g, (char) => DANGEROUS_CHARS.html[char] || char);
}

export function escapeQuotes(str) {
  if (typeof str !== 'string') {
    return str;
  }
  
  return str.replace(/["'`]/g, (char) => DANGEROUS_CHARS.quotes[char] || char);
}

export function sanitizeFilename(str) {
  if (typeof str !== 'string') {
    return str;
  }
  
  return str
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.{2,}/g, '.')
    .slice(0, 255);
}

export function sanitizeObject(obj, depth = 0, maxDepth = 10) {
  if (depth > maxDepth) {
    return '[MAX_DEPTH_EXCEEDED]';
  }
  
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'string') {
    return sanitizeXSS(obj);
  }
  
  if (typeof obj === 'number' || typeof obj === 'boolean') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, depth + 1, maxDepth));
  }
  
  if (typeof obj === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      const sanitizedKey = sanitizeXSS(String(key)).replace(/[^a-zA-Z0-9_]/g, '_');
      sanitized[sanitizedKey] = sanitizeObject(value, depth + 1, maxDepth);
    }
    return sanitized;
  }
  
  return String(obj);
}

export function sanitizeRequestBody(body, options = {}) {
  const {
    maxDepth = 10,
    stripTypes = true,
  } = options;

  if (!body) {
    return {};
  }

  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      return {};
    }
  }

  if (typeof body !== 'object' || body === null) {
    return {};
  }

  return sanitizeObject(body, 0, maxDepth);
}

export function xssDetection(input) {
  if (typeof input !== 'string') {
    return { detected: false, threats: [] };
  }

  const threats = [];
  
  for (const pattern of DANGEROUS_PATTERNS.xss) {
    if (pattern.test(input)) {
      threats.push({
        type: 'XSS',
        pattern: pattern.toString(),
        severity: 'HIGH',
      });
    }
  }

  for (const pattern of DANGEROUS_PATTERNS.sql) {
    if (pattern.test(input)) {
      threats.push({
        type: 'SQL_INJECTION',
        pattern: pattern.toString(),
        severity: 'CRITICAL',
      });
    }
  }

  return {
    detected: threats.length > 0,
    threats,
    timestamp: Date.now(),
  };
}

export function sanitizationMiddleware(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    const bodyCopy = sanitizeRequestBody(req.body);
    
    for (const key of Object.keys(bodyCopy)) {
      req.body[key] = bodyCopy[key];
    }
  }

  if (req.query && typeof req.query === 'object') {
    const queryCopy = sanitizeRequestBody(req.query);
    
    req.query = queryCopy;
  }

  next();
}