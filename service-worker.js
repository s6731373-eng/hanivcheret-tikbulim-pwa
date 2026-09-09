// ============================================================================
// Service Worker - מאפשר לאפליקציה לפעול גם ללא אינטרנט.
// אסטרטגיה: קודם מנסים רשת (כדי שגרסה חדשה תופיע מיד כשיש אינטרנט), ורק אם
// אין חיבור - חוזרים לגרסה השמורה במטמון. קריאות לשרת (Apps Script/Tranzila)
// לא נשמרות במטמון כלל ועוברות תמיד ישירות לרשת.
//
// *** חשוב: יש להעלות מספר גרסה כאן (CACHE_NAME) בכל פעם שמפרסמים עדכון,
// כדי שמכשירים שכבר התקינו את ה-Service Worker הקודם ינקו את המטמון הישן. ***
// ============================================================================

const CACHE_NAME = "tikbulim-cache-v2";

const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/styles.css",
  "./js/config.js",
  "./js/db.js",
  "./js/api.js",
  "./js/sync.js",
  "./js/tranzila.js",
  "./js/app.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  "./icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // רק בקשות GET מאותו מקור (האפליקציה עצמה) נשמרות במטמון
  if (event.request.method !== "GET" || url.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match("./index.html")))
  );
});
