/* Candidate only. Live HTTPS/offline/install behavior is not yet verified. */
const STRYKE_CACHE_VERSION = "stryke-pwa-20261019-workflow-local-v1";
const STRYKE_CORE_ASSETS = [
  "/", "/index.html", "/app/", "/app/index.html", "/workspace/", "/workspace/index.html",
  "/academy/", "/academy/index.html", "/contact/", "/contact/index.html", "/investors/", "/investors/index.html",
  "/modern.css", "/script.js", "/site.webmanifest", "/favicon.ico", "/favicon.png",
  "/favicon-16x16.png", "/favicon-32x32.png", "/apple-touch-icon.png",
  "/android-chrome-192x192.png", "/android-chrome-512x512.png", "/pwa-icon-192.png", "/pwa-icon-512.png",
  "/maskable-icon-192x192.png", "/maskable-icon-512x512.png", "/pwa-maskable-192.png", "/pwa-maskable-512.png",
  "/stryke-official-wordmark-logo.png", "/stryke-icon-mark.png",
];
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(STRYKE_CACHE_VERSION).then((cache) => cache.addAll(STRYKE_CORE_ASSETS)));
  // Do not forcibly replace an active worker/tab in the middle of a visit.
});
self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((names) => Promise.all(names
    .filter((name) => name.startsWith("stryke-pwa-") && name !== STRYKE_CACHE_VERSION)
    .map((name) => caches.delete(name)))));
});
self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.search || !STRYKE_CORE_ASSETS.includes(url.pathname)) return;
  event.respondWith(fetch(request).catch(async () => {
    const cached = await caches.match(request);
    return cached || new Response("This page is unavailable offline. Please reconnect.", {
      status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }));
});
