export const WINDTANK_CACHE_NAME = 'windhub-windtank-v1';
export const WINDTANK_ENTRY_PATH = '/windtank/index.html';
export const WINDTANK_SW_PATH = '/windtank/sw.js';
export const WINDTANK_STANDALONE_URL = 'https://windtank-trouble.vercel.app/';

const KNOWN_STATIC_RELATIVE_ASSETS = [
  './favicon.svg',
];

/**
 * Extracts same-origin `/windtank/...` asset paths referenced by WindTank's `index.html`
 * so WindHub can pre-warm the Cache Storage bundle for 100% offline play while keeping
 * WindTank in an independent repository.
 */
export function extractWindTankAssetUrls(
  html,
  baseHref = 'https://windhub.local/windtank/index.html'
) {
  if (typeof html !== 'string' || !html.trim()) return [];

  const base = new URL(baseHref);
  const discovered = new Set([WINDTANK_ENTRY_PATH]);

  const addCandidate = (raw) => {
    if (!raw || raw.startsWith('data:') || raw.startsWith('blob:')) return;
    try {
      const resolved = new URL(raw, base);
      if (resolved.origin !== base.origin) return;
      if (!resolved.pathname.startsWith('/windtank/')) return;
      discovered.add(`${resolved.pathname}${resolved.search}`);
    } catch {
      // Ignore malformed attribute values
    }
  };

  for (const rel of KNOWN_STATIC_RELATIVE_ASSETS) {
    addCandidate(rel);
  }

  const attrPattern = /<(?:script|link|img)\b[^>]*?\b(?:src|href)=["']([^"']+)["'][^>]*>/gi;
  let match;
  while ((match = attrPattern.exec(html)) !== null) {
    addCandidate(match[1]);
  }

  return [...discovered];
}

export function isGenuineWindTankHtml(html) {
  return typeof html === 'string' && html.includes('id="game-root"');
}

export async function hasWindTankOfflineCache() {
  if (typeof window === 'undefined' || !('caches' in window)) return false;
  try {
    const dedicated = await window.caches.open(WINDTANK_CACHE_NAME);
    const hit = await dedicated.match(WINDTANK_ENTRY_PATH, { ignoreSearch: true });
    if (hit) return true;
    const anyHit = await window.caches.match(WINDTANK_ENTRY_PATH, { ignoreSearch: true });
    return Boolean(anyHit);
  } catch {
    return false;
  }
}

let inflightSyncPromise = null;

export function syncWindTankOfflineCache() {
  if (typeof window === 'undefined' || !('caches' in window) || typeof fetch !== 'function') {
    return Promise.resolve({ ok: false, cached: false });
  }
  if (!navigator.onLine) {
    return hasWindTankOfflineCache().then((cached) => ({ ok: false, cached }));
  }
  if (inflightSyncPromise) return inflightSyncPromise;

  inflightSyncPromise = (async () => {
    try {
      const entryRes = await fetch(WINDTANK_ENTRY_PATH, { cache: 'no-cache' });
      if (!entryRes.ok) {
        return { ok: false, cached: await hasWindTankOfflineCache() };
      }

      const html = await entryRes.clone().text();
      if (!isGenuineWindTankHtml(html)) {
        return { ok: false, cached: await hasWindTankOfflineCache() };
      }

      const cache = await window.caches.open(WINDTANK_CACHE_NAME);
      await cache.put(WINDTANK_ENTRY_PATH, entryRes);

      const baseHref = new URL(WINDTANK_ENTRY_PATH, window.location.origin).toString();
      const assetUrls = extractWindTankAssetUrls(html, baseHref).filter(
        (u) => u !== WINDTANK_ENTRY_PATH
      );

      await Promise.allSettled(
        assetUrls.map(async (assetUrl) => {
          const isHashed = /\/windtank\/assets\/.+-[A-Za-z0-9_-]{6,}\.(?:js|mjs|css)$/i.test(assetUrl);
          if (isHashed) {
            const existing = await cache.match(assetUrl, { ignoreSearch: true });
            if (existing) return;
          }
          const res = await fetch(assetUrl);
          if (res.ok) {
            await cache.put(assetUrl, res);
          }
        })
      );

      // Opportunistically register WindTank's own scoped SW when available on future WindTank deploys
      if ('serviceWorker' in navigator) {
        try {
          const swProbe = await fetch(WINDTANK_SW_PATH, { method: 'HEAD', cache: 'no-cache' });
          const ct = swProbe.headers.get('content-type') || '';
          if (swProbe.ok && ct.includes('javascript')) {
            await navigator.serviceWorker.register(WINDTANK_SW_PATH, { scope: '/windtank/' });
          }
        } catch {
          // WindHub's primary SW already caches /windtank/* cleanly
        }
      }

      return { ok: true, cached: true };
    } catch {
      return { ok: false, cached: await hasWindTankOfflineCache() };
    } finally {
      inflightSyncPromise = null;
    }
  })();

  return inflightSyncPromise;
}
