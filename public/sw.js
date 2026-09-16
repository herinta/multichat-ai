// Multi-AI PWA Service Worker
const CACHE_NAME = 'multi-ai-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle Push Notifications from Server
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data = { title: 'Multi-AI Chat', body: event.data.text() };
    }
  }

  const title = data.title || 'Multi-AI Message';
  const options = {
    body: data.body || 'Ada pesan baru untukmu.',
    icon: data.icon || '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [100, 50, 100],
    data: data.data || {},
    tag: data.tag || 'multi-ai-general'
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Handle Notification Click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const roomId = event.notification.data?.roomId;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // 1. If a window is already open, focus it and notify it to switch room
      for (const client of clientList) {
        if ('focus' in client) {
          client.postMessage({ type: 'OPEN_ROOM', roomId });
          return client.focus();
        }
      }
      // 2. If no window open, open new window
      if (self.clients.openWindow) {
        const targetUrl = roomId ? `/?room=${roomId}` : '/';
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
