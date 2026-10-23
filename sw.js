// خدمة العمل: تخزين الواجهة للعمل بدون إنترنت. الشبكة أولاً لملفات التطبيق حتى لا تعلق نسخة قديمة.
const V = 'kmx-v2';
const SHELL = ['./', 'index.html', 'app.js', 'firebase-config.js', 'manifest.json', 'icon.svg', 'icon.svg', 'icon.svg'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(SHELL).catch(() => {})).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return; const u = new URL(r.url);
  if (u.origin === location.origin) {
    e.respondWith(fetch(r).then(res => { if (res && res.ok) { const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); } return res; }).catch(() => caches.match(r).then(m => { if (m) return m; if (r.mode === 'navigate') return caches.match('./index.html'); return Response.error(); })));
  } else if (u.hostname === 'www.gstatic.com' && u.pathname.includes('/firebasejs/')) {
    e.respondWith(caches.match(r).then(m => m || fetch(r).then(res => { if (res && res.ok) { const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); } return res; })));
  }
});


// Handle notifications delivered to the service worker when a push provider is configured.
// This handler is groundwork only: receiving pushes still requires a push subscription
// and a trusted server/FCM sender; it does not create push delivery by itself.
self.addEventListener('push', event => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; }
  catch { data = { body: event.data ? event.data.text() : '' }; }
  const title = data.title || 'كلمات ماسنجر';
  const options = {
    body: data.body || 'لديك إشعار جديد',
    icon: './icon-192.png',
    badge: './icon-192.png',
    tag: data.tag || 'kalimat-message',
    data: { url: (() => { try { const u = new URL(data.url || './', self.location.origin); return u.origin === self.location.origin ? u.href : './'; } catch { return './'; } })() },
    renotify: false
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  let target = self.location.origin + '/';
  try {
    const requested = new URL(event.notification.data?.url || './', self.location.origin);
    if (requested.origin === self.location.origin) target = requested.href;
  } catch {}
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of windows) {
      if (client.url.startsWith(self.location.origin) && 'focus' in client) {
        await client.focus();
        if ('navigate' in client && client.url !== target) await client.navigate(target);
        return;
      }
    }
    if (self.clients.openWindow) await self.clients.openWindow(target);
  })());
});
