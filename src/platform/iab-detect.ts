import type { BrowserEnv, ViewportClass } from '../domain/types';

export function detectBrowserEnv(uaString?: string): BrowserEnv {
  const ua =
    uaString ?? (typeof navigator !== 'undefined' && navigator.userAgent ? navigator.userAgent : '');
  if (!ua) return 'other';

  if (/\bLine\//i.test(ua)) return 'line-iab';
  if (/\b(FBAN|FBAV|FB_IAB)\b/i.test(ua)) return 'fb-iab';
  if (/\bInstagram\b/i.test(ua)) return 'ig-iab';
  if (/\b(Chrome|CriOS)\b/i.test(ua) && !/\bEdg\b/i.test(ua)) return 'chrome';
  if (/\bSafari\b/i.test(ua) && !/\b(Chrome|CriOS|Android)\b/i.test(ua)) return 'safari';
  return 'other';
}

export function detectViewportClass(widthPx?: number): ViewportClass {
  const w = widthPx ?? (typeof window !== 'undefined' ? window.innerWidth : 390);
  if (w < 360) return 'compact';
  if (w <= 480) return 'standard';
  return 'wide';
}

export function isInAppBrowser(env: BrowserEnv = detectBrowserEnv()): boolean {
  return env === 'line-iab' || env === 'fb-iab' || env === 'ig-iab';
}

export function parseWhitelistedEntryRef(search?: string): 'direct' | 'buddy-share' {
  const rawSearch = search ?? (typeof window !== 'undefined' ? window.location.search : '');
  try {
    const params = new URLSearchParams(rawSearch);
    return params.get('ref') === 'buddy' ? 'buddy-share' : 'direct';
  } catch {
    return 'direct';
  }
}
