#!/usr/bin/env node
/* Dashboard order below Grade. Synthetic data. ~390px.
 * Usage: node tools/dash-order-regression.js [--base URL] [--shots dir]
 */
"use strict";
const http = require("http");
const fs = require("fs");
const { spawn } = require("child_process");
function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}
const BASE = arg("--base", "http://127.0.0.1:8765");
const SHOTS = arg("--shots", "");
const PORT = 9700 + Math.floor(Math.random() * 200);
const CHROME = process.env.CHROME || "/usr/local/bin/google-chrome";
function get(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => { let d = ""; res.on("data", (c) => (d += c)); res.on("end", () => resolve(d)); }).on("error", reject);
  });
}
class CDP {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl); this.id = 0; this.pending = new Map();
    this.ready = new Promise((resolve, reject) => { this.ws.addEventListener("open", resolve); this.ws.addEventListener("error", reject); });
    this.ws.addEventListener("message", (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const p = this.pending.get(msg.id); this.pending.delete(msg.id);
        if (msg.error) p.reject(new Error(JSON.stringify(msg.error))); else p.resolve(msg.result);
      }
    });
  }
  async send(method, params) {
    await this.ready; const id = ++this.id;
    const p = new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
    this.ws.send(JSON.stringify({ id, method, params: params || {} })); return p;
  }
  async eval(expression) {
    const r = await this.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error((r.exceptionDetails.exception && r.exceptionDetails.exception.description) || r.exceptionDetails.text || "eval failed");
    return r.result.value;
  }
  async shot(name) {
    if (!SHOTS) return;
    const r = await this.send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(SHOTS + "/" + name, Buffer.from(r.data, "base64"));
  }
}
function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
const state = {
  tab: "stats", statsDoor: "dash", year: 2026, month: 11, worthYear: 2026, incomeYear: 2026,
  plan: "premium", theme: "light", envelopeMode: "remaining",
  policyConsent: { version: "1.2", acceptedAt: "2026-01-01T00:00:00.000Z", via: "app" },
  onboarding: { status: "done", answers: { name: "Preview", payFrequency: "monthly", birthday: "1990-01-01" } },
  profile: { name: "Preview", payFrequency: "monthly", filingStatus: "single", documents: [], dependents: 0, birthday: "1990-01-01", retireAge: 65 },
  compensation: { baseSalary: 48000, paychecksPerYear: 12, zipCode: "80202", filingStatus: "single", trueManual: false, preTax: [], postTax: [] },
  foo: { emergencyAmount: 12000 }, matters: {},
  months: { "2026-11": {
    year: 2026, month: 11,
    incomes: [{ id: "pay", name: "Paycheck", amount: 4000, date: "2026-11-01" }],
    categories: [
      { id: "sav", name: "Savings", system: "savings", flat: false, sortOrder: 0, lines: [{ id: "chk", name: "Checking", system: "checking", assigned: 400, sortOrder: 0 }] },
      { id: "food", name: "Food", sortOrder: 1, flat: true, lines: [{ id: "food", name: "Food", assigned: 3600, sortOrder: 0 }] }
    ],
    transactions: [{ id: "t1", payee: "Market", date: "2026-11-02", amount: 42.5, categoryId: "food", lineId: "food" }]
  } },
  worth: { years: [2026], notes: {}, income: {}, lines: [
    { id: "w1", name: "Checking", kind: "asset", group: "cash", sortOrder: 0, amounts: { "2026": 8000 }, additions: { "2026": 0 } },
    { id: "w2", name: "401k", kind: "asset", group: "retirement", sortOrder: 1, amounts: { "2026": 40000 }, additions: { "2026": 1200 } }
  ] }
};
const SEED = `(() => {
  localStorage.setItem("PaperTrail.preview.v6", ${JSON.stringify(JSON.stringify(state))});
  localStorage.setItem("PaperTrail.tourSeen.stats", "1");
  localStorage.setItem("PaperTrail.cloud.session", JSON.stringify({
    access_token: "preview-token", refresh_token: "preview-refresh",
    expires_at: Math.floor(Date.now() / 1000) + 86400,
    user: { id: "preview-user", email: "preview@example.com" }
  }));
})();`;
const FETCH_STUB = `(() => {
  const orig = window.fetch;
  window.fetch = function (url, opts) {
    const u = String(url);
    if (u.indexOf("supabase.co") >= 0) {
      const body = u.indexOf("/auth/v1/user") >= 0 ? { id: "preview-user", email: "preview@example.com" } : (u.indexOf("book_versions") >= 0 && (!opts || !opts.method || opts.method === "GET") ? [] : [{ id: 1 }]);
      return Promise.resolve(new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } }));
    }
    return orig.apply(this, arguments);
  };
})();`;

(async () => {
  const chrome = spawn(CHROME, ["--headless=new", "--disable-gpu", "--no-sandbox", "--disable-dev-shm-usage", "--remote-debugging-port=" + PORT, "--user-data-dir=/tmp/pt-dash-" + PORT, "about:blank"], { stdio: "ignore" });
  const fail = [];
  const out = {};
  function check(cond, msg) { if (!cond) fail.push(msg); }
  try {
    let ver;
    for (let i = 0; i < 40 && !ver; i++) { try { ver = JSON.parse(await get("http://127.0.0.1:" + PORT + "/json/version")); } catch (e) { await sleep(150); } }
    if (!ver) throw new Error("Chrome debug port did not open");
    const list = JSON.parse(await get("http://127.0.0.1:" + PORT + "/json/list"));
    const page = list.find((t) => t.type === "page");
    const cdp = new CDP(page.webSocketDebuggerUrl);
    await cdp.send("Page.enable"); await cdp.send("Runtime.enable");
    await cdp.send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
    await cdp.send("Page.addScriptToEvaluateOnNewDocument", { source: FETCH_STUB });
    await cdp.send("Page.addScriptToEvaluateOnNewDocument", { source: SEED });
    await cdp.send("Page.navigate", { url: BASE.replace(/\/$/, "") + "/index.html?nosplash=1" });
    await sleep(1700);
    await cdp.eval(`document.querySelector('[data-tab="stats"]').click()`);
    await sleep(300);
    const door = await cdp.eval(`(() => { const d = document.querySelector('[data-door="dash"]'); if (d) d.click(); return true; })()`);
    void door;
    await sleep(300);
    out.order = await cdp.eval(`(() => {
      const dash = document.getElementById("dash");
      const kids = [...dash.children].map((el) => ({
        id: el.id || "",
        cls: el.className || "",
        label: ((el.querySelector(":scope > .dash-k, :scope > .kicker, :scope > h3, :scope > .section-label") || el).textContent || "").replace(/\\s+/g, " ").trim().slice(0, 80)
      }));
      const grade = kids.findIndex((k) => /grade-hero/.test(k.cls));
      const snap = kids.findIndex((k) => k.id === "dash-snap");
      return { snap, grade, below: kids.slice(grade + 1).map((k) => k.id || k.label) };
    })()`);
    const below = out.order.below.join(" | ");
    check(out.order.snap >= 0 && out.order.snap < out.order.grade, "snapshot strip stays above Grade");
    const want = ["dash-nw", "dash-year", "Debt payoff", "dash-sav", "dash-reserves", "dash-ret", "dash-buys", "dash-proj", "dash-est", "dash-graphs", "dash-spendcat", "dash-taxes"];
    let at = 0;
    want.forEach((id) => {
      const i = out.order.below.findIndex((x, n) => n >= at && (x === id || x.indexOf(id) === 0));
      if (i < 0) fail.push("missing " + id + " in " + below);
      else at = i + 1;
    });
    check(below.indexOf("dash-taxes") > below.indexOf("dash-graphs") && below.indexOf("dash-graphs") > below.indexOf("dash-est"), "taxes follow graphs, graphs follow the 3-year estimate");
    check((out.order.below.filter((x) => x === "dash-sav").length) === 1, "one savings section");
    await cdp.eval(`document.getElementById("screen").scrollTop = 0`);
    await cdp.shot("dash-order-top.png");
    await cdp.eval(`document.querySelector(".debt-card").scrollIntoView({ block: "start" })`);
    await sleep(100);
    await cdp.shot("dash-order-middle.png");
    await cdp.eval(`document.getElementById("dash-proj").scrollIntoView({ block: "start" })`);
    await sleep(100);
    await cdp.shot("dash-order-lower.png");
    out.folds = await cdp.eval(`(async () => {
      document.getElementById("screen").scrollTop = 0;
      const folds = () => [...document.querySelectorAll("#dash .dash-fold")].map((b) => ({ id: b.getAttribute("data-id"), open: b.getAttribute("aria-expanded") === "true" }));
      const by = (id) => document.querySelector('#dash .dash-fold[data-id="' + id + '"]');
      by("dash-nw").click(); await new Promise((r) => setTimeout(r, 40));
      const one = folds().filter((f) => f.open).map((f) => f.id);
      by("dash-year").click(); await new Promise((r) => setTimeout(r, 40));
      const two = folds().filter((f) => f.open).map((f) => f.id);
      by("dash-ret").click(); await new Promise((r) => setTimeout(r, 40));
      const det = document.querySelector('[data-dash="ret-toggle"]');
      det.click(); await new Promise((r) => setTimeout(r, 200));
      const after = document.querySelector('[data-dash="ret-toggle"]').getAttribute("aria-expanded");
      const open = folds().filter((f) => f.open).map((f) => f.id);
      const input = document.querySelector("[data-dashnum='retireAge']");
      return { one, two, after, open, hasInput: !!input, est: !!document.getElementById("dash-est") };
    })()`);
    check(out.folds.one.length === 1 && out.folds.one[0] === "dash-nw", "opening net worth is the only open section");
    check(out.folds.two.length === 1 && out.folds.two[0] === "dash-year", "opening income closes net worth");
    check(out.folds.after === "true" && out.folds.open.length === 1 && out.folds.open[0] === "dash-ret" && out.folds.hasInput, "retirement details stay nested inside the one open section");
    out.nav = await cdp.eval(`(async () => {
      document.querySelector('[data-tab="budget"]').click();
      await new Promise((r) => setTimeout(r, 200));
      document.querySelector('[data-tab="stats"]').click();
      await new Promise((r) => setTimeout(r, 200));
      const door = document.querySelector('[data-door="dash"]'); if (door) door.click();
      await new Promise((r) => setTimeout(r, 200));
      const ids = [...document.querySelectorAll("#dash > section, #dash > p.section-label, #dash > details")].map((el) => el.id).filter(Boolean);
      return ids;
    })()`);
    check(out.nav.indexOf("dash-nw") < out.nav.indexOf("dash-year") && out.nav.indexOf("dash-sav") < out.nav.indexOf("dash-ret") && out.nav.indexOf("dash-proj") < out.nav.indexOf("dash-taxes"), "order survives leaving and coming back");
    out.fail = fail;
    console.log(JSON.stringify(out));
    if (fail.length) process.exitCode = 1;
  } catch (err) {
    console.log(JSON.stringify({ error: String(err && err.stack || err), fail: fail, out: out }));
    process.exitCode = 1;
  } finally { chrome.kill("SIGKILL"); }
})();
