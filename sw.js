// Minimal Service Worker to satisfy Chrome PWA Installability Requirements
self.addEventListener('install', (e) => {
    self.skipWaiting();
});

self.addEventListener('fetch', (e) => {
    // Network-first or pass-through
    // We do nothing, simply exist to allow beforeinstallprompt to fire.
});
