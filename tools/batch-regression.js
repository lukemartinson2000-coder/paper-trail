#!/usr/bin/env node
/* Narrow checks for the December / notes / allocation batch. Synthetic data. */
"use strict";
const http = require("http");
const fs = require("fs");
const { spawn } = require("child_process");
function arg(name, fallback) { const i = process.argv.indexOf(name); return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback; }
const BASE = arg("--base", "http://127.0.0.1:8765");
const SHOTS = arg("--shots", "");
const PORT = 9720 + Math.floor(Math.random() * 100);
const CHROME = process.env.CHROME || "/usr/local/bin/google-chrome";
function get(url) { return new Promise((resolve, reject) => { http.get(url, (res) => { let d = ""; res.on("data", (c) => d += c); res.on("end", () => resolve(d)); }).on("error", reject); }); }
function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
function near(a, b) { return typeof a === "number" && Math.abs(a - b) < 0.02; }
class CDP {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl); this.id = 0; this.pending = new Map();
    this.ready = new Promise((res, rej) => { this.ws.addEventListener("open", res); this.ws.addEventListener("error", rej); });
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
    const p = new Promise((res, rej) => this.pending.set(id, { resolve: res, reject: rej }));
    this.ws.send(JSON.stringify({ id, method, params: params || {} })); return p;
  }
  async eval(expression) {
    const r = await this.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error((r.exceptionDetails.exception && r.exceptionDetails.exception.description) || r.exceptionDetails.text || "eval");
    return r.result.value;
  }
  async shot(name) { if (!SHOTS) return; const r = await this.send("Page.captureScreenshot", { format: "png" }); fs.writeFileSync(SHOTS + "/" + name, Buffer.from(r.data, "base64")); }
}
function month(y, m, income, lines, txs) {
  return { year: y, month: m, incomes: income > 0 ? [{ id: "pay", name: "Paycheck", amount: income, date: y + "-12-01" }] : [],
    categories: [
      { id: "sav", name: "Savings", system: "savings", flat: false, sortOrder: 0, lines: lines },
      { id: "food", name: "Food", sortOrder: 1, flat: true, lines: [{ id: "food", name: "Food", assigned: 3250, sortOrder: 0 }] },
      { id: "gifts", name: "Gifts", sortOrder: 2, flat: true, lines: [{ id: "gifts", name: "Gifts", assigned: 100, sortOrder: 0 }] }
    ],
    transactions: txs || [] };
}
const lines = [
  { id: "chk", name: "Checking", system: "checking", assigned: 400, sortOrder: 0 },
  { id: "house", name: "House fund", assigned: 200, sortOrder: 1 },
  { id: "roth", name: "Roth IRA", assigned: 100, sortOrder: 2 },
  { id: "kcash", name: "401k cash", assigned: 50, sortOrder: 3 }
];
const state = {
  tab: "budget", year: 2026, month: 12, worthYear: 2026, incomeYear: 2026,
  plan: "premium", theme: "seasonal", envelopeMode: "remaining",
  policyConsent: { version: "1.2", acceptedAt: "2026-01-01T00:00:00.000Z", via: "app" },
  onboarding: { status: "done", answers: { name: "Preview", payFrequency: "monthly", birthday: "1990-01-01" } },
  profile: { name: "Preview", payFrequency: "monthly", filingStatus: "single", documents: [], dependents: 0, birthday: "1990-01-01" },
  compensation: { baseSalary: 0, paychecksPerYear: 12, zipCode: "80202", filingStatus: "single", trueManual: false, preTax: [], postTax: [], trueLines: [] },
  foo: { emergencyAmount: 8000 }, matters: {},
  months: {
    "2026-12": month(2026, 12, 4000, lines, [{ id: "g1", payee: "Shop", date: "2026-12-02", amount: 100, categoryId: "gifts", lineId: "gifts", note: "the scarf" }]),
    "2026-1": month(2026, 1, 0, [{ id: "chk", name: "Checking", system: "checking", assigned: 0, sortOrder: 0 }], [])
  },
  worth: { years: [2026], notes: {}, lines: [], income: {} }
};
const SEED = `(() => {
  localStorage.setItem("PaperTrail.preview.v6", ${JSON.stringify(JSON.stringify(state))});
  localStorage.setItem("PaperTrail.tourSeen.stats", "1");
  localStorage.setItem("PaperTrail.cloud.session", JSON.stringify({ access_token: "preview-token", refresh_token: "preview-refresh", expires_at: Math.floor(Date.now()/1000)+86400, user: { id: "preview-user", email: "preview@example.com" } }));
  const orig = window.fetch;
  window.fetch = function (url, opts) {
    if (String(url).indexOf("supabase.co") >= 0) {
      const body = String(url).indexOf("/auth/v1/user") >= 0 ? { id: "preview-user", email: "preview@example.com" } : [];
      return Promise.resolve(new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } }));
    }
    return orig.apply(this, arguments);
  };
})();`;
(async () => {
  const chrome = spawn(CHROME, ["--headless=new", "--disable-gpu", "--no-sandbox", "--disable-dev-shm-usage", "--remote-debugging-port=" + PORT, "--user-data-dir=/tmp/pt-batch-" + PORT, "about:blank"], { stdio: "ignore" });
  const fail = [];
  const out = {};
  function check(c, m) { if (!c) fail.push(m); }
  try {
    let ver; for (let i = 0; i < 40 && !ver; i++) { try { ver = JSON.parse(await get("http://127.0.0.1:" + PORT + "/json/version")); } catch (e) { await sleep(150); } }
    if (!ver) throw new Error("chrome");
    const page = JSON.parse(await get("http://127.0.0.1:" + PORT + "/json/list")).find((t) => t.type === "page");
    const cdp = new CDP(page.webSocketDebuggerUrl);
    await cdp.send("Page.enable"); await cdp.send("Runtime.enable");
    await cdp.send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
    await cdp.send("Page.addScriptToEvaluateOnNewDocument", { source: SEED });
    await cdp.send("Page.navigate", { url: BASE.replace(/\/$/, "") + "/index.html?nosplash=1" });
    await sleep(1600);
    out.dec = await cdp.eval(`({ dec: document.body.classList.contains("season-dec"), nov: document.body.classList.contains("season-nov") || document.documentElement.classList.contains("season-nov"), kind: (document.getElementById("season-fx") || {}).getAttribute && document.getElementById("season-fx").getAttribute("data-kind"), flakes: document.querySelectorAll("#season-fx .season-fx-p").length, hat: !!document.querySelector(".season-hat"), holly: !!document.querySelector(".season-sprig"), help: (document.querySelector(".sav-count-h") || {}).textContent || "" })`);
    check(out.dec.dec && out.dec.kind === "snow" && out.dec.flakes === 18 && !out.dec.hat && out.dec.holly, "December snow, not November " + JSON.stringify(out.dec));
    check(/Count towards savings rate/.test(out.dec.help), "savings header");
    out.titleFit = await cdp.eval(`(() => {
      const h = document.querySelector(".month-jump"); if (!h) return null;
      const sprig = h.querySelector(".season-sprig");
      const probe = document.createElement("span");
      probe.style.cssText = "position:absolute;left:-9999px;white-space:nowrap;font:" + getComputedStyle(h).font;
      probe.textContent = "September 2026";
      document.body.appendChild(probe);
      const need = probe.offsetWidth + (sprig ? sprig.getBoundingClientRect().width + 8 : 0) + 16;
      probe.remove();
      const h1 = h.closest("h1");
      return { need, have: h1 ? h1.clientWidth : h.clientWidth, overflow: h.scrollWidth > h.clientWidth + 1 };
    })()`);
    check(out.titleFit && !out.titleFit.overflow && out.titleFit.have + 1 >= out.titleFit.need, "month title clips " + JSON.stringify(out.titleFit));
    await cdp.eval(`document.querySelector(".sav-count-h .help-q").click()`);
    await sleep(80);
    out.help = await cdp.eval(`(document.querySelector("#help-pop p") || {}).textContent || ""`);
    check(out.help === "Want to track how much you’re saving for retirement? Include money set aside for retirement, and leave out funds intended for future spending, like a car or vacation. You choose which items count.", "help text");
    await cdp.shot("batch-help.png");
    await cdp.eval(`document.querySelector("[data-help-ok]").click()`);
    await cdp.eval(`document.querySelector(".sav-count-h").scrollIntoView({ block: "center" })`);
    await sleep(80);
    await cdp.shot("batch-december.png");
    out.alloc = await cdp.eval(`PaperTrailPreview.allocationMonth(2026, 12)`);
    const food = out.alloc.slices.filter((s) => s.label === "Food")[0];
    const sav = out.alloc.slices.filter((s) => s.label === "Savings")[0];
    check(out.alloc.basis === "take-home" && !out.alloc.slices.some((s) => s.label === "Taxes") && near(out.alloc.divisor, 4000) && food && near(food.amount, 3250) && sav && near(sav.amount, 750), "take-home allocation, no invented taxes " + JSON.stringify(out.alloc && { b: out.alloc.basis, d: out.alloc.divisor, slices: out.alloc.slices }));
    out.zero = await cdp.eval(`PaperTrailPreview.allocationMonth(2026, 1)`);
    check(out.zero && !(out.zero.divisor > 0), "zero month has no divisor");
    out.plane = await cdp.eval(`(() => { const p = window.__ptSplashPath(3000, 800, 390); const downs = []; const ups = []; const dh = [];
      const ang = (k) => +k.transform.match(/rotate\\(([-0-9.]+)deg\\)/)[1];
      p.move.forEach((k, i) => { if (!p.move[i+1]) return; const y1 = +k.transform.match(/,([-0-9.]+)px/)[1]; const y2 = +p.move[i+1].transform.match(/,([-0-9.]+)px/)[1]; const dy = y2 - y1; if (dy > 2) downs.push(dy); if (dy < -2) ups.push(-dy); dh.push(Math.abs(ang(p.move[i+1]) - ang(k))); });
      const avg = (a) => a.reduce((n, x) => n + x, 0) / a.length;
      const max = (a) => a.reduce((n, x) => Math.max(n, x), 0);
      return { n: p.move.length, loop: p.loopEndT, down: avg(downs), up: avg(ups), maxTurn: max(dh), end: p.move[p.move.length - 1].offset, dots: p.dots.length }; })()`);
    check(out.plane.n > 200 && out.plane.loop > 400 && out.plane.loop < 2600 && out.plane.down > out.plane.up && out.plane.maxTurn < 12 && out.plane.end === 1 && out.plane.dots > 20, "plane flight is continuous and faster downhill " + JSON.stringify(out.plane));
    await cdp.eval(`document.querySelector('[data-act="bar-menu"]').click()`);
    await sleep(60);
    out.menu = await cdp.eval(`({ open: document.getElementById("budget-menu") && !document.getElementById("budget-menu").hidden, items: [...document.querySelectorAll("#budget-menu [role=menuitem]")].map((b) => b.textContent.trim()) })`);
    check(out.menu.open && out.menu.items.indexOf("Profile and settings") >= 0 && out.menu.items.some((t) => t.indexOf("Seasonal") >= 0), "settings menu " + JSON.stringify(out.menu));
    await cdp.eval(`document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }))`);
    await sleep(40);
    check(await cdp.eval(`document.getElementById("budget-menu").hidden === true`), "escape closes the menu");
    await cdp.eval(`document.querySelector('[data-tab="spend"]').click()`);
    await sleep(250);
    out.noteList = await cdp.eval(`document.body.innerText.indexOf("the scarf") >= 0`);
    check(out.noteList, "existing note shows on Transactions");
    await cdp.eval(`document.querySelector('[data-act="edit-spend"]').click()`);
    await sleep(200);
    out.noteField = await cdp.eval(`(document.querySelector('[data-ed-in="note"]') || {}).value || ""`);
    check(out.noteField === "the scarf", "edit keeps the note");
    await cdp.eval(`(() => { const n = document.querySelector('[data-ed-in="note"]'); n.value = "<b>mittens</b>"; n.dispatchEvent(new Event("input", { bubbles: true })); })()`);
    await cdp.shot("batch-note.png");
    await cdp.eval(`document.querySelector(".ed-save").click()`);
    await sleep(250);
    out.savedNote = await cdp.eval(`document.body.innerText.indexOf("mittens") >= 0 && document.body.innerText.indexOf("<b>") < 0`);
    check(out.savedNote, "note round trip strips tags");
    await cdp.eval(`document.querySelector('[data-tab="stats"]').click()`);
    await sleep(300);
    await cdp.eval(`const d = document.querySelector('[data-door="dash"]'); if (d) d.click()`);
    await sleep(250);
    out.dashProbe = await cdp.eval(`(() => { const el = document.getElementById("dash-spendcat"); if (!el) return "missing"; el.scrollIntoView({ block: "start" }); return "ok"; })()`);
    check(out.dashProbe === "ok", "allocation card missing");
    if (out.dashProbe === "ok") {
      await cdp.eval(`const b = document.querySelector('#dash-spendcat .dash-fold'); if (b && b.getAttribute('aria-expanded') !== 'true') b.click()`);
      await sleep(80);
      await cdp.shot("batch-allocation.png");
      out.card = await cdp.eval(`document.getElementById("dash-spendcat").innerText`);
      check(/planned take-home/i.test(out.card) && /not scaled to 100%/.test(out.card) && /Food/.test(out.card) && /Savings/.test(out.card), "allocation card");
    }
    await cdp.eval(`document.querySelector('[data-tab="budget"]').click()`);
    await sleep(200);
    await cdp.eval(`document.querySelector('[data-act="prev-month"]').click()`);
    await sleep(250);
    out.nov = await cdp.eval(`({ dec: document.body.classList.contains("season-dec"), kind: (document.getElementById("season-fx") || {}).getAttribute && document.getElementById("season-fx").getAttribute("data-kind"), hat: !!document.querySelector(".season-hat"), santa: !!document.getElementById("season-santa") })`);
    check(out.nov.kind === "leaves" && out.nov.hat && !out.nov.dec && !out.nov.santa, "November unchanged " + JSON.stringify(out.nov));
    await cdp.shot("batch-november.png");
    out.gross = await cdp.eval(`(() => {
      const pack = PaperTrailPreview.allocationWithPay({ year: 2026, month: 12, savLineOn: { "house fund": false }, compensation: {
        baseSalary: 60000, paychecksPerYear: 12, zipCode: "80202", filingStatus: "single", trueManual: true,
        employer401kMatch: 3, employer401kMatchIsPercent: true, employer401kBase: 0,
        preTax: [{ id: "401k", name: "401k", method: "percent", value: 10, on: true }, { id: "park", name: "Parking", method: "fixed", value: 1200, on: true }],
        postTax: [{ id: "gym", name: "Gym", method: "fixed", value: 600, on: true }],
        trueLines: [{ id: "401k", saves: true }, { id: "park", saves: true }, { id: "gym", saves: false }] } });
      const dec = pack.month, jan = pack.january, year = pack.year, can = pack.canonical;
      const amt = (pic, label) => { const s = (pic.slices || []).filter((x) => x.label === label)[0]; return s ? s.amount : 0; };
      const back = PaperTrailPreview.allocationMonth(2026, 12);
      return { basis: dec.basis, source: dec.source, divisor: dec.divisor, of: dec.of, savings: dec.savings, canSav: can.savings, canRate: can.rate,
        food: amt(dec, "Food"), aside: amt(dec, "Set aside, not in the rate"), taxes: amt(dec, "Taxes"), other: amt(dec, "Other payroll deductions"),
        park: amt(dec, "Parking"), k: amt(dec, "401k"), shortfall: dec.shortfall,
        janDiv: jan.divisor, janBasis: jan.basis, yearMixed: year.mixed, yearDiv: year.divisor, yearFood: amt(year, "Food"), yearMonths: year.months,
        restored: back.basis };
    })()`);
    check(out.gross && out.gross.restored === "take-home", "pay plan restored");
    await cdp.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
    await cdp.send("Page.navigate", { url: BASE.replace(/\/$/, "") + "/index.html" });
    let reduceSeen = false;
    for (let i = 0; i < 30 && !reduceSeen; i++) {
      reduceSeen = await cdp.eval(`!!document.querySelector(".launch-splash") && !document.querySelector(".ls-trail") && matchMedia("(prefers-reduced-motion: reduce)").matches`);
      if (!reduceSeen) await sleep(40);
    }
    await sleep(800);
    out.reduce = { seen: reduceSeen, still: await cdp.eval(`!!document.querySelector(".launch-splash")`) };
    check(out.reduce.seen && !out.reduce.still, "reduced motion is a short fade " + JSON.stringify(out.reduce));
    check(out.gross && out.gross.basis === "gross" && out.gross.source === "typed" && out.gross.of.indexOf("employer") >= 0, "gross basis " + JSON.stringify(out.gross));
    check(out.gross && near(out.gross.food, 3250) && near(out.gross.aside, 200) && near(out.gross.savings, 1300) && near(out.gross.other, 50) && out.gross.taxes > 0 && out.gross.park === 0 && out.gross.k === 0, "no double count " + JSON.stringify(out.gross));
    check(out.gross && near(out.gross.canSav, out.gross.savings) && out.gross.divisor > 5000, "savings rate not refit " + JSON.stringify(out.gross));
    check(out.gross && !out.gross.yearMixed && out.gross.yearMonths >= 2 && out.gross.janBasis === "gross" && near(out.gross.yearFood, 3250 * out.gross.yearMonths) && near(out.gross.yearDiv, out.gross.janDiv * out.gross.yearMonths) && near(out.gross.yearFood / out.gross.yearDiv, 3250 / out.gross.divisor), "weighted year " + JSON.stringify(out.gross));
    out.fail = fail;
    console.log(JSON.stringify(out));
    if (fail.length) process.exitCode = 1;
  } catch (err) {
    console.log(JSON.stringify({ error: String(err.stack || err), fail }));
    process.exitCode = 1;
  } finally { chrome.kill("SIGKILL"); }
})();
