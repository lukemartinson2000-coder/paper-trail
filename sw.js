/* Paper Trail service worker (v37.5.65). Caches the app shell per version so the app opens offline and from
 * the home screen. index.html is network-first (3 s timeout): with a connection, closing and reopening the app
 * always loads the newest version; offline, the last cached copy is used. Other files are versioned (?v=) and
 * served cache-first, app.js included. Old version caches are deleted on activate. Data stays in localStorage, never in here. */
var VERSION = "37.5.65";
var CACHE = "pt-shell-" + VERSION;
var SHELL = [
  "./", "index.html", "manifest.webmanifest?v=27",
  "styles.css?v=" + VERSION, "vendor/fflate.js?v=" + VERSION, "grade-math.js?v=" + VERSION,
  "export-kit.js?v=" + VERSION, "import-merge.js?v=" + VERSION, "app.js?v=" + VERSION, "cloud-config.js?v=" + VERSION,
  "favicon.svg?v=27", "apple-touch-icon.png?v=27", "icon-192.png?v=27", "icon-512.png?v=27",
  "fonts/Caveat-Medium.ttf", "fonts/ShadowsIntoLight-Regular.ttf", "privacy.html"
];
self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return Promise.all(SHELL.map(function (u) { return c.add(new Request(u, { cache: "reload" })).catch(function () {}); }));
  }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k.indexOf("pt-shell-") === 0 && k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
/* v37.5.64 (review M2): navigations race a 3-second timeout, then fall back to the cached copy (weak signal
 * no longer hangs launch). Fallbacks chain with .then so offline really reaches index.html. */
var NET_TIMEOUT_MS = 3000;
function fromCache(req) {
  return caches.match(req).then(function (hit) {
    return hit || caches.match(req, { ignoreSearch: true });
  }).then(function (hit) {
    return hit || caches.match("index.html");
  }).then(function (hit) {
    return hit || caches.match("./");
  });
}
function networkFirst(req) {
  return new Promise(function (resolve) {
    var done = false;
    var timer = setTimeout(function () {
      fromCache(req).then(function (hit) { if (!done && hit) { done = true; resolve(hit); } });
    }, NET_TIMEOUT_MS);
    fetch(req, { cache: "no-store" }).then(function (res) {
      if (res && res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); }
      if (!done) { done = true; clearTimeout(timer); resolve(res); }
    }).catch(function () {
      clearTimeout(timer);
      fromCache(req).then(function (hit) {
        if (!done) { done = true; resolve(hit || new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain" } })); }
      });
    });
  });
}
self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  var path = url.pathname;
  /* app.js?v=… is versioned like the other assets, so it's cache-first; only pages (and an unversioned app.js) go to the network first. */
  if (req.mode === "navigate" || /\/(index\.html)?$/.test(path) || (/\/app\.js$/.test(path) && !url.search)) { e.respondWith(networkFirst(req)); return; }
  e.respondWith(caches.match(req).then(function (hit) {
    return hit || fetch(req).then(function (res) {
      if (res && res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); }
      return res;
    });
  }));
});
