const CACHE = 'calendar-shell-v1'
const SCOPE = new URL(self.registration.scope)
const SHELL = new URL('./', SCOPE).href
const ICON = new URL('icons/icon-192.png', SCOPE).href
const BADGE = new URL('icons/badge-96.png', SCOPE).href
const MAX_TEXT = 300
const MAX_ENTRIES = 300

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.add(new Request(SHELL, { cache: 'reload' })))
      .catch(() => undefined)
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

const trim = (cache) =>
  cache.keys().then((keys) =>
    Promise.all(
      keys
        .filter((key) => key.url !== SHELL)
        .slice(0, Math.max(0, keys.length - MAX_ENTRIES))
        .map((key) => cache.delete(key)),
    ),
  )

const isOwnAsset = (url) =>
  url.origin === SCOPE.origin && url.pathname.startsWith(new URL('assets/', SCOPE).pathname)

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== SCOPE.origin) return
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok && url.href === SHELL)
            caches.open(CACHE).then((cache) => cache.put(SHELL, response.clone()))
          return response
        })
        .catch(() => caches.match(SHELL).then((cached) => cached ?? Response.error())),
    )
    return
  }
  if (!isOwnAsset(url)) return
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ??
        fetch(request).then((response) => {
          if (response.ok && response.type === 'basic') {
            const copy = response.clone()
            caches.open(CACHE).then((cache) => cache.put(request, copy).then(() => trim(cache)))
          }
          return response
        }),
    ),
  )
})

const text = (value, fallback) => (typeof value === 'string' && value !== '' ? value.slice(0, MAX_TEXT) : fallback)

const ownUrl = (value) => {
  try {
    const url = new URL(value, SCOPE)
    return url.origin === SCOPE.origin && url.pathname.startsWith(SCOPE.pathname) ? url.href : SHELL
  } catch {
    return SHELL
  }
}

self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = {}
  }
  event.waitUntil(
    self.registration.showNotification(text(data.title, 'Kalender'), {
      body: text(data.body, ''),
      tag: text(data.tag, undefined),
      icon: ICON,
      badge: BADGE,
      data: { url: ownUrl(data.url) },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = ownUrl(event.notification.data && event.notification.data.url)
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      const existing = windows.find((client) => new URL(client.url).origin === SCOPE.origin)
      if (!existing) return self.clients.openWindow(target)
      return existing
        .navigate(target)
        .then((client) => (client ?? existing).focus())
        .catch(() => self.clients.openWindow(target))
    }),
  )
})
