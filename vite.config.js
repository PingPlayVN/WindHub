import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const WINDTANK_REMOTE_ORIGIN =
  globalThis.process?.env?.VITE_WINDTANK_ORIGIN || 'https://windtank-trouble.vercel.app';

const windtankProxyConfig = {
  '/windtank': {
    target: WINDTANK_REMOTE_ORIGIN,
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/windtank/, '') || '/',
  },
};

function offlineAppPlugin() {
  return {
    name: 'windhub-offline-app',
    apply: 'build',
    generateBundle(_options, bundle) {
      const appAssets = Object.keys(bundle)
        .filter((fileName) => fileName !== 'sw.js' && !fileName.endsWith('.map'))
        .map((fileName) => `/${fileName}`);
      const precacheUrls = [...new Set([
        '/',
        '/index.html',
        '/manifest.webmanifest',
        '/windhub.png',
        '/windhub-192.png',
        '/windhub-512.png',
        '/windhub-logo.svg',
        '/games/windtank-cover.jpg',
        '/games/tai-xiu-cover.jpg',
        '/games/bau-cua-cover.jpg',
        ...appAssets,
      ])];

      const workerSource = [
        'const CACHE_NAME = "windhub-shell-v7";',
        'const WINDTANK_CACHE = "windhub-windtank-v1";',
        `const PRECACHE_URLS = ${JSON.stringify(precacheUrls)};`,
        'self.addEventListener("install", (event) => {',
        '  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting()));',
        '});',
        'self.addEventListener("activate", (event) => {',
        '  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => (key.startsWith("windhub-shell-") && key !== CACHE_NAME) || (key.startsWith("windhub-windtank-") && key !== WINDTANK_CACHE)).map((key) => caches.delete(key)))).then(() => self.clients.claim()));',
        '});',
        'self.addEventListener("fetch", (event) => {',
        '  const request = event.request;',
        '  const url = new URL(request.url);',
        '  if (request.method !== "GET" || url.origin !== self.location.origin) return;',
        '  if (url.pathname === "/windtank" || url.pathname.startsWith("/windtank/")) {',
        '    const isWindTankEntry = request.mode === "navigate" || url.pathname === "/windtank" || url.pathname === "/windtank/" || url.pathname.endsWith("/index.html");',
        '    if (isWindTankEntry) {',
        '      event.respondWith((async () => {',
        '        const cache = await caches.open(WINDTANK_CACHE);',
        '        try {',
        '          const response = await fetch(request);',
        '          if (response.ok) await cache.put("/windtank/index.html", response.clone());',
        '          return response;',
        '        } catch {',
        '          return (await cache.match(request, { ignoreSearch: true })) || (await cache.match("/windtank/index.html")) || (await caches.match("/windtank/index.html", { ignoreSearch: true }));',
        '        }',
        '      })());',
        '      return;',
        '    }',
        '    const isHashedChunk = /\\/windtank\\/assets\\/.+-[A-Za-z0-9_-]{6,}\\.(?:js|mjs|css)$/i.test(url.pathname);',
        '    event.respondWith((async () => {',
        '      const cache = await caches.open(WINDTANK_CACHE);',
        '      if (isHashedChunk) {',
        '        const cached = await cache.match(request, { ignoreSearch: true });',
        '        if (cached) return cached;',
        '      }',
        '      try {',
        '        const response = await fetch(request);',
        '        if (response.ok) await cache.put(request, response.clone());',
        '        return response;',
        '      } catch {',
        '        return (await cache.match(request, { ignoreSearch: true })) || (await caches.match(request, { ignoreSearch: true }));',
        '      }',
        '    })());',
        '    return;',
        '  }',
        '  if (request.mode === "navigate") {',
        '    event.respondWith(fetch(request).then((response) => {',
        '      if (response.ok) caches.open(CACHE_NAME).then((cache) => cache.put("/index.html", response.clone()));',
        '      return response;',
        '    }).catch(async () => (await caches.match("/index.html")) || (await caches.match("/"))));',
        '    return;',
        '  }',
        '  const isAppAsset = url.pathname.includes("/assets/") || /\\.(?:js|css|svg|png|jpe?g|webmanifest|ico|woff2?)$/i.test(url.pathname);',
        '  if (!isAppAsset) return;',
        '  event.respondWith((async () => {',
        '    const cache = await caches.open(CACHE_NAME);',
        '    const cached = await cache.match(request);',
        '    if (cached) return cached;',
        '    const response = await fetch(request);',
        '    if (response.ok) await cache.put(request, response.clone());',
        '    return response;',
        '  })());',
        '});',
      ].join('\n');

      this.emitFile({ type: 'asset', fileName: 'sw.js', source: workerSource });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  cacheDir: './.vite_cache',
  plugins: [
    react(),
    tailwindcss(),
    offlineAppPlugin(),
  ],
  server: {
    proxy: windtankProxyConfig,
  },
  preview: {
    proxy: windtankProxyConfig,
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
})