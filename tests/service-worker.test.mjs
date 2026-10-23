import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../sw.js', import.meta.url), 'utf8');

function boot(overrides = {}) {
  const listeners = {};
  const cacheCalls = [];
  const notifications = [];
  const navigation = [];
  const client = {
    url: 'https://kalimat.example/',
    focus: async () => navigation.push('focus'),
    navigate: async url => { navigation.push(url); client.url = url; }
  };
  const cache = {
    addAll: async () => {},
    put: async (...args) => cacheCalls.push(args),
    match: async () => null
  };
  const self = {
    location: { origin: 'https://kalimat.example' },
    addEventListener: (name, fn) => { listeners[name] = fn; },
    skipWaiting: async () => {},
    clients: {
      claim: async () => {},
      matchAll: async () => [client],
      openWindow: async url => navigation.push(url)
    },
    registration: { showNotification: async (...args) => notifications.push(args) }
  };
  const context = {
    self, location: { origin: 'https://kalimat.example' }, caches: {
      open: async () => { cacheCalls.push(['open']); return cache; },
      keys: async () => ['kmx-v1', 'kmx-v2'],
      delete: async () => true,
      match: async () => null
    },
    fetch: async () => new Response('ok', { status: 200 }),
    URL, Response, Promise, console,
    ...overrides
  };
  vm.runInNewContext(source, context);
  return { listeners, cacheCalls, notifications, navigation, client, self };
}

test('push notification rejects an external destination', async () => {
  const env = boot();
  let pending;
  env.listeners.push({ data: { json: () => ({ title: 'Test', url: 'https://evil.example/phish' }) }, waitUntil: p => { pending = p; } });
  await pending;
  assert.equal(env.notifications.length, 1);
  assert.equal(env.notifications[0][1].data.url, './');
});

test('notification click never navigates to an external origin', async () => {
  const env = boot();
  let pending;
  env.listeners.notificationclick({
    notification: { close() {}, data: { url: 'https://evil.example/phish' } },
    waitUntil: p => { pending = p; }
  });
  await pending;
  assert.equal(env.navigation[0], 'focus');
  assert.equal(env.navigation.some(value => String(value).startsWith('https://evil.example/')), false);
});

test('failed same-origin responses are not cached', async () => {
  const env = boot({ fetch: async () => new Response('server error', { status: 500 }) });
  let responsePromise;
  env.listeners.fetch({
    request: new Request('https://kalimat.example/app.js'),
    respondWith: p => { responsePromise = p; }
  });
  const response = await responsePromise;
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(response.status, 500);
  assert.equal(env.cacheCalls.some(call => call[0] === 'open'), false);
});


test('push notification preserves a same-origin destination', async () => {
  const env = boot();
  let pending;
  env.listeners.push({ data: { json: () => ({ title: 'Test', url: '/chat/123' }) }, waitUntil: p => { pending = p; } });
  await pending;
  assert.equal(env.notifications[0][1].data.url, 'https://kalimat.example/chat/123');
});

test('service worker leaves non-GET requests untouched', () => {
  const env = boot();
  let intercepted = false;
  env.listeners.fetch({
    request: new Request('https://kalimat.example/send-message', { method: 'POST', body: 'test' }),
    respondWith: () => { intercepted = true; }
  });
  assert.equal(intercepted, false);
});

test('offline navigation falls back to the cached app shell', async () => {
  const shell = new Response('offline app shell', { status: 200 });
  const env = boot({
    fetch: async () => { throw new Error('offline'); },
    caches: {
      open: async () => ({ addAll: async () => {}, put: async () => {} }),
      keys: async () => ['kmx-v2'],
      delete: async () => true,
      match: async key => key === './index.html' ? shell : null
    }
  });
  let responsePromise;
  env.listeners.fetch({
    request: { method: 'GET', url: 'https://kalimat.example/messages/room-1', mode: 'navigate' },
    respondWith: promise => { responsePromise = promise; }
  });
  const response = await responsePromise;
  assert.equal(await response.text(), 'offline app shell');
});

test('offline missing static assets fail instead of returning the HTML shell', async () => {
  const env = boot({ fetch: async () => { throw new Error('offline'); } });
  let responsePromise;
  env.listeners.fetch({
    request: { method: 'GET', url: 'https://kalimat.example/missing.js', mode: 'no-cors' },
    respondWith: promise => { responsePromise = promise; }
  });
  const response = await responsePromise;
  assert.equal(response.type, 'error');
});

