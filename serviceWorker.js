const offlineCacheName = "realrankus-offline-v1";
const offlineFallbackPage = new URL("offline.html", self.registration.scope).toString();

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(offlineCacheName)
      .then((cache) => cache.add(offlineFallbackPage))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;

  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request).catch(async () => {
      const offlineUrl = new URL(offlineFallbackPage);
      offlineUrl.searchParams.set("lang", requestUrl.pathname.startsWith("/en/") ? "en" : "ko");
      const cachedPage = await caches.match(offlineUrl, { ignoreSearch: true });
      return cachedPage || new Response("Offline", { status: 503, statusText: "Service Unavailable" });
    })
  );
});
