/* Paper Trail service worker (v37.5.59.74). Caches the app shell per version so the app opens offline and from
 * the home screen. index.html and app.js are network-first: with a connection, closing and reopening the app
 * always loads the newest version; offline, the last cached copy is used. Other files are versioned (?v=) and
 * served cache-first. Old version caches are deleted on activate. Data stays in localStorage, never in here. */
var VERSION = "37.5.59.74";
var CACHE = "pt-shell-" + VERSION;
var SHELL = [
  "./", "index.html", "manifest.webmanifest?v=27",
  "styles.css?v=" + VERSION, "vendor/fflate.js?v=" + VERSION, "grade-math.js?v=" + VERSION,
  "export-kit.js?v=" + VERSION, "import-merge.js?v=" + VERSION, "app.js?v=" + VERSION,
  "favicon.svg?v=27", "apple-touch-icon.png?v=27", "icon-192.png?v=27", "icon-512.png?v=27",
  "fonts/Caveat-Medium.ttf", "fonts/ShadowsIntoLight-Regular.ttf"
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
function networkFirst(req) {
  return fetch(req, { cache: "no-store" }).then(function (res) {
    if (res && res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); }
    return res;
  }).catch(function () {
    return caches.match(req).then(function (hit) { return hit || caches.match(req, { ignoreSearch: true }) || caches.match("index.html"); });
  });
}
self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  var path = url.pathname;
  if (req.mode === "navigate" || /\/(index\.html)?$/.test(path) || /\/app\.js$/.test(path)) { e.respondWith(networkFirst(req)); return; }
  e.respondWith(caches.match(req).then(function (hit) {
    return hit || fetch(req).then(function (res) {
      if (res && res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); }
      return res;
    });
  }));
});
