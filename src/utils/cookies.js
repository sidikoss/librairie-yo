const DEFAULT_COOKIE_OPTIONS = {
  path: "/",
  expires: 365,
  sameSite: "Lax",
};

export function setCookie(name, value, options = {}) {
  try {
    const config = { ...DEFAULT_COOKIE_OPTIONS, ...options };
    let expires = config.expires;
    
    if (typeof expires === "number") {
      const date = new Date();
      date.setTime(date.getTime() + expires * 24 * 60 * 60 * 1000);
      expires = date;
    }
    
    const cookieValue = encodeURIComponent(JSON.stringify(value));
    const cookieString = `${name}=${cookieValue};expires=${expires.toUTCString()};path=${config.path}`;
    
    if (config.domain) {
      cookieString += `;domain=${config.domain}`;
    }
    
    if (config.sameSite) {
      cookieString += `;samesite=${config.sameSite}`;
    }
    
    if (config.secure) {
      cookieString += ";secure";
    }
    
    if (config.httpOnly) {
      cookieString += ";httponly";
    }
    
    document.cookie = cookieString;
    
    return true;
  } catch (error) {
    console.error("[Cookie] Error setting cookie:", error);
    return false;
  }
}

export function getCookie(name) {
  try {
    const cookies = document.cookie.split(";");
    
    for (const cookie of cookies) {
      const [key, value] = cookie.trim().split("=");
      
      if (key === name) {
        return JSON.parse(decodeURIComponent(value));
      }
    }
    
    return null;
  } catch (error) {
    console.error("[Cookie] Error getting cookie:", error);
    return null;
  }
}

export function deleteCookie(name, options = {}) {
  try {
    const config = { ...DEFAULT_COOKIE_OPTIONS, ...options, expires: -1 };
    const date = new Date(0);
    const cookieString = `${name}=;expires=${date.toUTCString()};path=${config.path}`;
    
    if (config.domain) {
      cookieString += `;domain=${config.domain}`;
    }
    
    document.cookie = cookieString;
    
    return true;
  } catch (error) {
    console.error("[Cookie] Error deleting cookie:", error);
    return false;
  }
}

export function getAllCookies() {
  try {
    const cookies = {};
    const cookieArray = document.cookie.split(";");
    
    for (const cookie of cookieArray) {
      const [key, ...rest] = cookie.trim().split("=");
      if (key) {
        try {
          cookies[key] = JSON.parse(decodeURIComponent(rest.join("=")));
        } catch {
          cookies[key] = rest.join("=");
        }
      }
    }
    
    return cookies;
  } catch (error) {
    console.error("[Cookie] Error getting all cookies:", error);
    return {};
  }
}

export function hasCookie(name) {
  return getCookie(name) !== null;
}

export function cookieExists(name) {
  return document.cookie.split(";").some((c) => c.trim().startsWith(`${name}=`));
}