#!/usr/bin/env node
/* Sets one version everywhere: app.js APP_VERSION, sw.js VERSION, and every 37.x ?v= / banner in index.html.
 * Usage: node tools/set-version.js 37.5.59.125     Check only: node tools/set-version.js --check */
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
const f = n => path.join(root, n);
const app = fs.readFileSync(f("app.js"), "utf8"), sw = fs.readFileSync(f("sw.js"), "utf8"), html = fs.readFileSync(f("index.html"), "utf8");
const VER = /(?<![\d.])37\.\d+\.\d+(?:\.\d+)?(?!\d|\.\d)/g;
if (process.argv[2] === "--check") {
  const a = (app.match(/APP_VERSION = "([^"]+)"/) || [])[1], s = (sw.match(/VERSION = "([^"]+)"/) || [])[1];
  const h = [...new Set(html.match(VER) || [])];
  const ok = a && a === s && h.length === 1 && h[0] === a;
  console.log(ok ? "version OK " + a : "version MISMATCH app=" + a + " sw=" + s + " index=" + h.join(","));
  process.exit(ok ? 0 : 1);
}
const v = process.argv[2];
if (!/^37\.\d+\.\d+(\.\d+)?$/.test(v || "")) { console.error("usage: set-version.js 37.5.59.NNN | --check"); process.exit(2); }
fs.writeFileSync(f("app.js"), app.replace(/APP_VERSION = "[^"]+"/, 'APP_VERSION = "' + v + '"'));
fs.writeFileSync(f("sw.js"), sw.replace(/VERSION = "[^"]+"/, 'VERSION = "' + v + '"'));
fs.writeFileSync(f("index.html"), html.replace(VER, v));
console.log("set " + v);
