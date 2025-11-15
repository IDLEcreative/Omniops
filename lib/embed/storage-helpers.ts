import { getDomain } from 'tldts';

function getCookieDomain(hostname: string): string | null {
  if (!hostname || hostname === 'localhost' || /^[\d.:]+$/.test(hostname)) {
    return null;
  }

  try {
    const parsed = getDomain(hostname);
    if (parsed) {
      return parsed;
    }
  } catch (error) {
    console.warn('[Chat Widget] Failed to parse hostname for cookie domain:', error);
  }

  const parts = hostname.split('.');
  if (parts.length <= 1) {
    return null;
  }

  return parts.slice(-2).join('.');
}

function getCookieName(key: string): string {
  return `chat_widget_${key}`;
}

export function setStorageCookie(key: string, value: string): void {
  try {
    const hostname = window.location.hostname;
    const domain = getCookieDomain(hostname);
    const cookieName = getCookieName(key);
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    const domainAttr = domain ? `; Domain=.${domain}` : '';
    const encoded = encodeURIComponent(value);

    document.cookie = `${cookieName}=${encoded}; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax${domainAttr}${secure}`;
  } catch (error) {
    console.warn('[Chat Widget] Failed to set persistence cookie:', error);
  }
}

export function getStorageCookie(key: string): string | null {
  try {
    const cookieName = `${getCookieName(key)}=`;
    const cookies = document.cookie ? document.cookie.split(';') : [];

    for (const rawCookie of cookies) {
      const cookie = rawCookie.trim();
      if (cookie.startsWith(cookieName)) {
        return decodeURIComponent(cookie.substring(cookieName.length));
      }
    }
  } catch (error) {
    console.warn('[Chat Widget] Failed to read persistence cookie:', error);
  }
  return null;
}

export function deleteStorageCookie(key: string): void {
  try {
    const hostname = window.location.hostname;
    const domain = getCookieDomain(hostname);
    const cookieName = getCookieName(key);
    const domainAttr = domain ? `; Domain=.${domain}` : '';
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';

    document.cookie = `${cookieName}=; Path=/; Max-Age=0; SameSite=Lax${domainAttr}${secure}`;
  } catch (error) {
    console.warn('[Chat Widget] Failed to delete persistence cookie:', error);
  }
}
