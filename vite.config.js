import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

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
        ...appAssets,
      ])];

      const workerSource = [
        'const CACHE_NAME = "windhub-shell-v5";',
        `const PRECACHE_URLS = ${JSON.stringify(precacheUrls)};`,
        'self.addEventListener("install", (event) => {',
        '  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting()));',
        '});',
        'self.addEventListener("activate", (event) => {',
        '  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith("windhub-shell-") && key !== CACHE_NAME).map((key) => caches.delete(key)))).then(() => self.clients.claim()));',
        '});',
        'self.addEventListener("fetch", (event) => {',
        '  const request = event.request;',
        '  const url = new URL(request.url);',
        '  if (request.method !== "GET" || url.origin !== self.location.origin) return;',
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
  plugins: [
    react(),
    tailwindcss(),
    offlineAppPlugin(),
  ],
  resolve: {
    alias: {
      '@': '/src'
    }
  }
})