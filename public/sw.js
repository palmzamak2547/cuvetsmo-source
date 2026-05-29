// source.cuvetsmo.com — service worker · Primitive 8.
//
// Cache-first for canonical content and shell. Network-first with
// cache fallback for everything else. Offline-capable after first
// visit.
//
// Cache key strategy:
//   CACHE_VERSION bumps on any shell-layout-changing deploy so old
//   clients invalidate cleanly. JSON content stays cached across
//   versions (we want the offline experience to keep working even
//   when the shell updates).

const CACHE_VERSION = 'v1-2026-05-27'
const SHELL_CACHE = `source-shell-${CACHE_VERSION}`
const CONTENT_CACHE = `source-content`  // unversioned — survives shell deploys

// Pages + assets to precache for the offline shell.
const PRECACHE_URLS = [
  '/',
  '/drugs',
  '/verify',
  '/sources',
  '/api',
  '/search',
  '/manifest.webmanifest',
  '/icon.svg',
]

// Content endpoints — cached separately so they survive shell versions.
const CONTENT_URL_PATTERNS = [
  /^\/api\/drugs(\/|$)/,
  /^\/api\/by-code/,
  /^\/api\/keys\//,
  /^\/api\/log/,
  /^\/c\/[0-9a-f]{64}/,
  /^\/drugs\//,
  /^\/verify\//,
]

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then(cache => {
      // Use addAll-with-individual-fallback so one broken URL doesn't
      // abort the whole install. Better than failing PWA registration.
      return Promise.allSettled(
        PRECACHE_URLS.map(url =>
          cache.add(url).catch(err => console.warn('[sw] precache failed', url, err))
        )
      )
    }).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(k => k.startsWith('source-shell-') && k !== SHELL_CACHE)
          .map(k => caches.delete(k))
      )
    }).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', event => {
  const req = event.request
  if (req.method !== 'GET') return

  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return

  // Content endpoints: stale-while-revalidate. Serve cached fast, refresh in background.
  const isContent = CONTENT_URL_PATTERNS.some(pat => pat.test(url.pathname))
  if (isContent) {
    event.respondWith(staleWhileRevalidate(req, CONTENT_CACHE))
    return
  }

  // Shell: cache-first, fall back to network.
  if (PRECACHE_URLS.includes(url.pathname)) {
    event.respondWith(cacheFirst(req, SHELL_CACHE))
    return
  }

  // Everything else: network-first with cache fallback. If both fail,
  // serve the shell '/' as last-ditch (so navigation never shows the
  // browser's offline error page).
  event.respondWith(networkFirstWithShellFallback(req))
})

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)
  if (cached) return cached
  try {
    const fresh = await fetch(request)
    if (fresh.ok) cache.put(request, fresh.clone())
    return fresh
  } catch (err) {
    return new Response('Offline and not cached.', { status: 503 })
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)
  const networkPromise = fetch(request).then(fresh => {
    if (fresh.ok) cache.put(request, fresh.clone())
    return fresh
  }).catch(() => null)

  if (cached) return cached
  const fresh = await networkPromise
  if (fresh) return fresh
  return new Response(JSON.stringify({
    ok: false,
    error: { code: 'offline-no-cache', message: 'No cached copy and offline.' },
  }), { status: 503, headers: { 'Content-Type': 'application/json' } })
}

async function networkFirstWithShellFallback(request) {
  try {
    const fresh = await fetch(request)
    if (fresh.ok) {
      const cache = await caches.open(SHELL_CACHE)
      cache.put(request, fresh.clone()).catch(() => {})
    }
    return fresh
  } catch (err) {
    const cache = await caches.open(SHELL_CACHE)
    const cached = await cache.match(request)
    if (cached) return cached
    // Last ditch: serve the shell root so navigation has SOMETHING.
    if (request.mode === 'navigate') {
      const root = await cache.match('/')
      if (root) return root
    }
    return new Response('Offline.', { status: 503 })
  }
}
