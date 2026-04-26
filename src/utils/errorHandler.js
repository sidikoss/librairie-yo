export class AppError extends Error {
  constructor(message, code, details = null) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

export class ValidationError extends AppError {
  constructor(message, field, details = null) {
    super(message, "VALIDATION_ERROR", details);
    this.name = "ValidationError";
    this.field = field;
  }
}

export class NetworkError extends AppError {
  constructor(message, statusCode = null) {
    super(message, "NETWORK_ERROR", { statusCode });
    this.name = "NetworkError";
  }
}

export class AuthError extends AppError {
  constructor(message, code = "AUTH_ERROR") {
    super(message, code);
    this.name = "AuthError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource, id) {
    super(`${resource} not found`, "NOT_FOUND", { resource, id });
    this.name = "NotFoundError";
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfter = 60) {
    super("Trop de requêtes", "RATE_LIMIT", { retryAfter });
    this.name = "RateLimitError";
    this.retryAfter = retryAfter;
  }
}

export const ERROR_CODES = {
  NETWORK_ERROR: "NETWORK_ERROR",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  AUTH_ERROR: "AUTH_ERROR",
  NOT_FOUND: "NOT_FOUND",
  RATE_LIMIT: "RATE_LIMIT",
  SERVER_ERROR: "SERVER_ERROR",
  TIMEOUT: "TIMEOUT",
  UNKNOWN: "UNKNOWN",
};

export function formatError(error) {
  if (error instanceof AppError) {
    return {
      message: error.message,
      code: error.code,
      details: error.details,
      timestamp: error.timestamp,
    };
  }

  if (error.name === "TypeError" && error.message.includes("fetch")) {
    return {
      message: "Erreur de connexion",
      code: ERROR_CODES.NETWORK_ERROR,
      details: null,
    };
  }

  if (error.name === "AbortError") {
    return {
      message: "Délai d'attente dépassé",
      code: ERROR_CODES.TIMEOUT,
      details: null,
    };
  }

  return {
    message: error.message || "Une erreur est survenue",
    code: ERROR_CODES.UNKNOWN,
    details: null,
  };
}

export function isRetryableError(error) {
  const retryableCodes = [
    ERROR_CODES.NETWORK_ERROR,
    ERROR_CODES.TIMEOUT,
    ERROR_CODES.RATE_LIMIT,
  ];
  
  if (error instanceof AppError) {
    return retryableCodes.includes(error.code);
  }
  
  return false;
}

export function getErrorMessage(error, fallback = "Une erreur est survenue") {
  if (typeof error === "string") return error;
  if (!error) return fallback;
  
  const formatted = formatError(error);
  return formatted.message || fallback;
}