importScripts("https://www.gstatic.com/firebasejs/10.9.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.9.0/firebase-messaging-compat.js");

const CACHE_NAME = 'ulak-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.json',
  '/assets/icon.png'
];

self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
      caches.open(CACHE_NAME)
        .then(cache => cache.addAll(urlsToCache))
        .catch(err => console.error('Cache error:', err))
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        Promise.all([
            clients.claim(),
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== CACHE_NAME) {
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
        ])
    );
});

self.addEventListener('fetch', event => {
    // Only cache GET requests to our own origin
    if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
        return;
    }
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) return response;
                return fetch(event.request).catch(() => {
                    if (event.request.mode === 'navigate') {
                        return caches.match('/index.html');
                    }
                });
            })
    );
});

const firebaseConfig = {
  apiKey: "AIzaSyB3HwVPpJ2Qz2Su5s7swqf5_55ZrsqzB5E",
  authDomain: "ulak-b4965.firebaseapp.com",
  projectId: "ulak-b4965",
  storageBucket: "ulak-b4965.firebasestorage.app",
  messagingSenderId: "47685919953",
  appId: "1:47685919953:web:889c3dd87924dcf2ad51f0",
  measurementId: "G-1LDW0F6FKG"
};

// Initialize Firebase in the service worker
firebase.initializeApp(firebaseConfig);

// Retrieve firebase messaging
const messaging = firebase.messaging();

// Arka plan mesajlarını yakala
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Arka plan bildirimi geldi:', payload);
  
  const notificationTitle = payload.notification?.title || 'ULAK - Yeni Mesaj';
  const notificationOptions = {
    body: payload.notification?.body || 'Bir mesajınız var.',
    icon: '/assets/icon.png',
    badge: '/assets/icon.png', // Android için ufak ikon
    vibrate: [200, 100, 200], // Telefon titremesi
    tag: 'ulak-new-message', // Aynı kişiden mesaj gelirse üst üste binmesin
    renotify: true, // Yeni mesaj gelince tekrar titret
    data: {
        url: '/' // Bildirime tıklayınca siteye gitsin
    }
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Bildirime tıklandığında uygulamayı aç
self.addEventListener('notificationclick', (event) => {
    event.notification.close(); // Bildirimi kapat
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            if (clientList.length > 0) {
                let client = clientList[0];
                for (let i = 0; i < clientList.length; i++) {
                    if (clientList[i].focused) {
                        client = clientList[i];
                    }
                }
                return client.focus();
            }
            return clients.openWindow('/');
        })
    );
});
