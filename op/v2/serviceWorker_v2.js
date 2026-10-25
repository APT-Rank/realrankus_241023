const OP_V2_CACHE = "op-v2-shell-20261025";
const OP_V2_OFFLINE = "/op/v2/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(OP_V2_CACHE).then((cache) => cache.add(OP_V2_OFFLINE)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys
      .filter((key) => key.startsWith("op-v2-shell-") && key !== OP_V2_CACHE)
      .map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate" || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(fetch(event.request).catch(() => caches.match(OP_V2_OFFLINE)));
});
