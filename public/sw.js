const VERSION = "rumble-stage1-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Stage 1 deliberately keeps networking untouched. Offline asset caching is added
// only when the PWA install/production pass begins in Stage 5.
void VERSION;
