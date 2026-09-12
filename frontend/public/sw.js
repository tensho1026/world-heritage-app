const STATIC_CACHE = 'heritage-static-v1'
const DATA_CACHE = 'heritage-data-v1'
const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
]
const DATA_MAX_AGE = 24 * 60 * 60 * 1000
const DATA_MAX_ENTRIES = 120

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS)),
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => ![STATIC_CACHE, DATA_CACHE].includes(key))
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

function isOfflineDataRequest(url) {
  return [
    /^\/api\/heritage\/[0-9a-f-]+$/i,
    /^\/api\/vocabulary(?:\?|$)/,
    /^\/api\/(favorites|read-later|history|stats)(?:\?|$)/,
  ].some((pattern) => pattern.test(`${url.pathname}${url.search}`))
}

async function storeData(request, response) {
  if (!response.ok) return response
  const headers = new Headers(response.headers)
  headers.set('x-cache-timestamp', String(Date.now()))
  const cachedResponse = new Response(await response.clone().blob(), {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
  const cache = await caches.open(DATA_CACHE)
  await cache.put(request, cachedResponse)
  const keys = await cache.keys()
  await Promise.all(
    keys
      .slice(0, Math.max(0, keys.length - DATA_MAX_ENTRIES))
      .map((key) => cache.delete(key)),
  )
  return response
}

async function cachedData(request) {
  const cache = await caches.open(DATA_CACHE)
  const response = await cache.match(request)
  if (!response) return undefined
  const cachedAt = Number(response.headers.get('x-cache-timestamp') ?? 0)
  if (!cachedAt || Date.now() - cachedAt > DATA_MAX_AGE) {
    await cache.delete(request)
    return undefined
  }
  return response
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone()
          void caches
            .open(STATIC_CACHE)
            .then((cache) => cache.put(request, copy))
          return response
        })
        .catch(
          async () =>
            (await caches.match(request)) ??
            (await caches.match('/')) ??
            caches.match('/offline.html'),
        ),
    )
    return
  }

  if (url.origin === self.location.origin && isOfflineDataRequest(url)) {
    event.respondWith(
      fetch(request)
        .then((response) => storeData(request, response))
        .catch(async () => (await cachedData(request)) ?? Response.error()),
    )
  }
})
