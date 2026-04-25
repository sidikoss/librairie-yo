// api/_lib/schemaValidator.js
// Validation de schéma pour les requêtes API
// Protection contre les données malformées

class ValidationError extends Error {
  constructor(message, field) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.statusCode = 400;
  }
}

function isString(value) {
  return typeof value === 'string' || value instanceof String;
}

function isNumber(value) {
  return typeof value === 'number' && !isNaN(value);
}

function isBoolean(value) {
  return typeof value === 'boolean';
}

function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isArray(value) {
  return Array.isArray(value);
}

export function validateString(value, options = {}) {
  const {
    required = false,
    minLength = 0,
    maxLength = Infinity,
    pattern = null,
    trim = true,
  } = options;

  if (value === undefined || value === null) {
    if (required) {
      throw new ValidationError('Champ requis', 'unknown');
    }
    return null;
  }

  let str = isString(value) ? value : String(value);
  
  if (trim) {
    str = str.trim();
  }

  if (str.length < minLength) {
    throw new ValidationError(
      `Minimum ${minLength} caractères requis`,
      'unknown'
    );
  }

  if (str.length > maxLength) {
    throw new ValidationError(
      `Maximum ${maxLength} caractères autorisés`,
      'unknown'
    );
  }

  if (pattern && !pattern.test(str)) {
    throw new ValidationError('Format invalide', 'unknown');
  }

  return str;
}

export function validateNumber(value, options = {}) {
  const {
    required = false,
    min = -Infinity,
    max = Infinity,
    integer = false,
  } = options;

  if (value === undefined || value === null) {
    if (required) {
      throw new ValidationError('Champ numérique requis', 'unknown');
    }
    return null;
  }

  const num = Number(value);
  
  if (isNaN(num)) {
    throw new ValidationError('Valeur numérique invalide', 'unknown');
  }

  if (integer && !Number.isInteger(num)) {
    throw new ValidationError('Nombre entier requis', 'unknown');
  }

  if (num < min || num > max) {
    throw new ValidationError(
      `Doit être entre ${min} et ${max}`,
      'unknown'
    );
  }

  return num;
}

export function validateBoolean(value, options = {}) {
  const { required = false } = options;

  if (value === undefined || value === null) {
    if (required) {
      throw new ValidationError('Champ booléen requis', 'unknown');
    }
    return null;
  }

  return Boolean(value);
}

export function validatePhone(value) {
  const cleaned = validateString(value, { required: true, minLength: 9, maxLength: 20 });
  const digitsOnly = cleaned.replace(/[^\d]/g, '');
  
  if (!/^\d{9,15}$/.test(digitsOnly)) {
    throw new ValidationError('Numéro de téléphone invalide', 'phone');
  }
  
  return digitsOnly;
}

export function validatePIN(value) {
  const cleaned = validateString(value, { required: true, minLength: 4, maxLength: 4 });
  
  if (!/^\d{4}$/.test(cleaned)) {
    throw new ValidationError('PIN invalide (4 chiffres requis)', 'pin');
  }
  
  return cleaned;
}

export function validateTxId(value) {
  const cleaned = validateString(value, { required: true, minLength: 4, maxLength: 100 });
  
  if (!/^[A-Za-z0-9_-]+$/.test(cleaned)) {
    throw new ValidationError(
      'Référence invalide (lettres, chiffres, tirets et underscores uniquement)',
      'txId'
    );
  }
  
  return cleaned;
}

export function validateAmount(value, options = {}) {
  const { min = 100, max = 100000000 } = options;
  const num = validateNumber(value, { required: true, min, max });
  
  return Math.round(num);
}

export function validateEmail(value) {
  if (!value) return null;
  
  const cleaned = validateString(value, { maxLength: 255 });
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailPattern.test(cleaned)) {
    throw new ValidationError('Email invalide', 'email');
  }
  
  return cleaned;
}

export function validateArray(value, options = {}) {
  const {
    required = false,
    minLength = 0,
    maxLength = Infinity,
    itemValidator = null,
  } = options;

  if (value === undefined || value === null) {
    if (required) {
      throw new ValidationError('Tableau requis', 'unknown');
    }
    return null;
  }

  if (!isArray(value)) {
    throw new ValidationError('Doit être un tableau', 'unknown');
  }

  if (value.length < minLength) {
    throw new ValidationError(
      `Minimum ${minLength} éléments requis`,
      'unknown'
    );
  }

  if (value.length > maxLength) {
    throw new ValidationError(
      `Maximum ${maxLength} éléments autorisés`,
      'unknown'
    );
  }

  if (itemValidator) {
    return value.map((item, index) => {
      try {
        return itemValidator(item);
      } catch (error) {
        throw new ValidationError(
          `Element ${index}: ${error.message}`,
          `items[${index}]`
        );
      }
    });
  }

  return value;
}

export function validateObject(value, schema) {
  if (!isObject(value)) {
    throw new ValidationError('Doit être un objet', 'unknown');
  }

  const result = {};
  const errors = [];

  for (const [key, validator] of Object.entries(schema)) {
    try {
      result[key] = validator(value[key]);
    } catch (error) {
      if (error instanceof ValidationError) {
        errors.push({ field: key, message: error.message });
      } else {
        throw error;
      }
    }
  }

  if (errors.length > 0) {
    const error = new ValidationError(
      errors.map(e => `${e.field}: ${e.message}`).join('; '),
      errors[0].field
    );
    error.details = errors;
    throw error;
  }

  return result;
}

export function sanitizeObject(obj, allowedKeys) {
  const sanitized = {};
  
  for (const key of allowedKeys) {
    if (key in obj) {
      sanitized[key] = obj[key];
    }
  }
  
  return sanitized;
}

export function validateAdminAuth(body) {
  return validateObject(body, {
    password: (val) => validateString(val, { required: true, minLength: 1, maxLength: 128 }),
  });
}

export function validateOrangeMoneyPayment(body) {
  return validateObject(body, {
    txId: validateTxId,
    amount: (val) => validateAmount(val, { min: 100 }),
    name: (val) => validateString(val, { required: true, minLength: 2, maxLength: 100 }),
    phone: validatePhone,
    pin: validatePIN,
    promoCode: (val) => val ? validateString(val, { maxLength: 20 }).toUpperCase() : null,
  });
}

export function validatePromoCode(body) {
  return validateObject(body, {
    code: (val) => validateString(val, { required: true, minLength: 3, maxLength: 20, pattern: /^[A-Z0-9_-]+$/ }),
    orderTotal: (val) => validateAmount(val, { min: 0 }),
  });
}