// Version comes from the registration query (?v=<commit-sha>), so every deploy
// gets a fresh cache name — old caches are purged on activate and the shell is
// re-precached from the new build.
const SW_VERSION = new URL(self.location.href).searchParams.get("v") || "v3";
const CACHE_NAME = "basic-note-" + SW_VERSION;

// Shell routes that must work fully offline. We precache BOTH variants:
//  - the HTML document (full page load / PWA cold start)
//  - the RSC flight payload (App Router client-side navigation, ?_rsc=)
// The note editor lives at the single static route /notes/note (id is in the
// query string, read client-side), so one fixed RSC payload serves every note
// — enabling offline "create → open" and "list → open" with no per-id fetch.
const SHELL_DOC_URLS = ["/", "/notes", "/notes/note"];
const SHELL_RSC_URLS = ["/notes", "/notes/note"];

// Synthetic cache key for an RSC variant (kept distinct from the document).
const rscKey = (pathname) => `${pathname}?__swrsc=1`;

const isRscRequest = (request, url) =>
  request.headers.get("RSC") === "1" || url.searchParams.has("_rsc");

const isShellPath = (pathname) =>
  pathname === "/notes" || pathname === "/notes/note";

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(SHELL_DOC_URLS);
      // Precache RSC payloads by requesting each route with the RSC header.
      await Promise.all(
        SHELL_RSC_URLS.map(async (path) => {
          try {
            const res = await fetch(path, {
              headers: { RSC: "1" },
              credentials: "same-origin",
            });
            if (res.ok) await cache.put(rscKey(path), res);
          } catch {
            // offline during install — best effort
          }
        })
      );
    })()
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Skip non-GET and cross-origin requests
  if (request.method !== "GET" || !request.url.startsWith(self.location.origin))
    return;

  const url = new URL(request.url);

  // Skip API/Supabase requests — always network
  if (url.pathname.includes("/api/") || request.url.includes("supabase")) return;

  // Shell routes (/notes, /notes/note): network-first, but fall back to the
  // precached document or RSC payload when offline. The query string (id,
  // _rsc hash) is stripped via a fixed cache key, so any note id resolves.
  if (isShellPath(url.pathname)) {
    const key = isRscRequest(request, url) ? rscKey(url.pathname) : url.pathname;
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(key, clone));
          return response;
        })
        .catch(async () => {
          return (
            (await caches.match(key)) ||
            (await caches.match("/notes")) ||
            (await caches.match("/")) ||
            Response.error()
          );
        })
    );
    return;
  }

  // Network-first for navigation (other HTML pages)
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match("/"))
        )
    );
    return;
  }

  // Cache-first for static assets (JS, CSS, fonts, images)
  if (
    request.url.match(/\.(js|css|woff2?|ttf|png|jpg|svg|ico)(\?.*)?$/) ||
    request.url.includes("/_next/static/")
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            return response;
          })
      )
    );
    return;
  }

  // Network-first for everything else
  event.respondWith(
    fetch(request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        return response;
      })
      .catch(() => caches.match(request))
  );
});
