#!/usr/bin/env node
/* Narrow checks for the sheet tweaks through 37.5.122. Synthetic demo numbers only.
 * Savings rows line up with other envelopes until the count toggle opens.
 * Transactions has one add control. The transaction sheet puts the budget
 * item above the note and keeps its frame steady.
 * Serves nothing: BASE_URL defaults to http://127.0.0.1:8765/index.html?nosplash=1.
 * Usage: node tools/ui-tweaks-regression.js [--base URL] [--shots dir]
 */
"use strict";
const http = require("http");
const fs = require("fs");
const path = require("path");
const { spawn, execFileSync } = require("child_process");

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}
const BASE = arg("--base", "http://127.0.0.1:8765");
const SHOTS = arg("--shots", "");
const PORT = 9600 + Math.floor(Math.random() * 200);
const CHROME = process.env.CHROME || "/usr/local/bin/google-chrome";
const ROOT = path.join(__dirname, "..");

function get(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let d = "";
      res.on("data", (c) => (d += c));
      res.on("end", () => resolve(d));
    }).on("error", reject);
  });
}
class CDP {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 0;
    this.pending = new Map();
    this.ready = new Promise((resolve, reject) => {
      this.ws.addEventListener("open", resolve);
      this.ws.addEventListener("error", reject);
    });
    this.ws.addEventListener("message", (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const p = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) p.reject(new Error(JSON.stringify(msg.error)));
        else p.resolve(msg.result);
      }
    });
  }
  async send(method, params) {
    await this.ready;
    const id = ++this.id;
    const p = new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
    this.ws.send(JSON.stringify({ id, method, params: params || {} }));
    return p;
  }
  async eval(expression) {
    const r = await this.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) {
      const d = r.exceptionDetails;
      throw new Error((d.exception && d.exception.description) || d.text || "eval failed");
    }
    return r.result.value;
  }
  async shot(file, clip) {
    const r = await this.send("Page.captureScreenshot", Object.assign({ format: "png" }, clip ? { clip: clip } : {}));
    fs.writeFileSync(file, Buffer.from(r.data, "base64"));
  }
}

const SEED = `
(() => {
  const y = 2026, m = 11;
  const state = {
    tab: "budget", year: y, month: m, worthYear: y, incomeYear: y,
    plan: "premium", theme: "light", envelopeMode: "remaining",
    savLineOn: { vacation: false },
    policyConsent: { version: "1.2", acceptedAt: "2026-01-01T00:00:00.000Z", via: "app" },
    onboarding: { status: "done", answers: { name: "Preview", payFrequency: "biweekly", birthday: "1990-01-01" } },
    profile: { name: "Preview", payFrequency: "biweekly", filingStatus: "single", documents: [], dependents: 0, birthday: "1990-01-01" },
    compensation: { baseSalary: 90000, paychecksPerYear: 26, zipCode: "80202", filingStatus: "single", trueManual: false, preTax: [], postTax: [] },
    foo: { emergencyAmount: 12000 }, matters: {},
    months: { "2026-11": {
      year: y, month: m,
      incomes: [{ id: "pay1", name: "Paycheck", amount: 4000, date: "2026-11-01" }],
      categories: [
        { id: "food", name: "Food", sortOrder: 0, flat: false, lines: [
          { id: "groceries", name: "Groceries", assigned: 500, sortOrder: 0 },
          { id: "restaurants", name: "Restaurants", assigned: 120, sortOrder: 1 }
        ]},
        { id: "sav", name: "Savings", system: "savings", sortOrder: 1, flat: false, lines: [
          { id: "house", name: "House fund", assigned: 200, sortOrder: 0 },
          { id: "vac", name: "Vacation", assigned: 80, sortOrder: 1 }
        ]},
        { id: "home", name: "Housing", sortOrder: 2, flat: false, lines: [
          { id: "rent", name: "Rent", assigned: 1500, sortOrder: 0 }
        ]},
        { id: "life", name: "Lifestyle", sortOrder: 3, flat: false, lines: [
          { id: "fun", name: "Fun Money", assigned: 80, sortOrder: 0 },
          { id: "efund", name: "Emergency Fund", assigned: 25, sortOrder: 1 }
        ]}
      ],
      transactions: [
        { id: "t1", payee: "Market", date: "2026-11-02", amount: 42.5, categoryId: "food", lineId: "groceries", note: "Weekly groceries" },
        { id: "t2", payee: "Cafe", date: "2026-11-03", amount: 6, categoryId: "food", lineId: "restaurants", note: "" },
        { id: "t3", payee: "Trader Joe's", date: "2026-11-01", amount: 12, categoryId: "food", lineId: "groceries", note: "" },
        { id: "t4", payee: "Trader Joe's", date: "2026-11-02", amount: 18, categoryId: "food", lineId: "groceries", note: "" },
        { id: "t5", payee: "Trader Joe's", date: "2026-11-04", amount: 9.5, categoryId: "food", lineId: "groceries", note: "" },
        { id: "t6", payee: "Transit", date: "2026-11-12", amount: 2.75, categoryId: "food", lineId: "restaurants", note: "" },
        { id: "t7", payee: "Truck stop", date: "2026-11-06", amount: 40, categoryId: "home", lineId: "rent", note: "" },
        { id: "t8", payee: "Target", date: "2026-11-09", amount: 26, categoryId: "sav", lineId: "house", note: "" },
        { id: "t9", payee: "Central Transit", date: "2026-11-04", amount: 12, categoryId: "food", lineId: "restaurants", note: "" },
        { id: "t10", payee: "Tesco", date: "2026-11-07", amount: 14, categoryId: "food", lineId: "groceries", note: "" },
        { id: "t11", payee: "Tesco", date: "2026-11-13", amount: 16, categoryId: "food", lineId: "groceries", note: "" },
        { id: "t12", payee: "Temple Books", date: "2026-11-11", amount: 11, categoryId: "food", lineId: "restaurants", note: "" },
        { id: "t13", payee: "Teacher Supply", date: "2026-11-08", amount: 22, categoryId: "home", lineId: "rent", note: "" },
        { id: "t-over", payee: "Clinic", date: "2026-11-10", amount: 90, categoryId: "life", lineId: "efund", note: "" },
        { id: "t-solo", payee: "Solo Mart", date: "2026-11-05", amount: 8, categoryId: "food", lineId: "groceries", note: "" },
        { id: "t-mix-g", payee: "Mixed Mart", date: "2026-11-03", amount: 5, categoryId: "food", lineId: "groceries", note: "" },
        { id: "t-mix-r", payee: "Mixed Mart", date: "2026-11-14", amount: 7, categoryId: "food", lineId: "restaurants", note: "" }
      ]
    }},
    worth: { years: [y], notes: {}, lines: [
      { id: "w1", name: "Checking", kind: "asset", group: "cash", sortOrder: 0, amounts: { "2026": 8000 }, additions: { "2026": 0 } }
    ], income: {} }
  };
  try { if (sessionStorage.getItem("pt-shot-dark") === "1") state.theme = "dark"; } catch (e) {}
  localStorage.setItem("PaperTrail.preview.v6", JSON.stringify(state));
  localStorage.setItem("PaperTrail.tourSeen.stats", "1");
  localStorage.setItem("PaperTrail.tourSeen.spend", "1");
  localStorage.setItem("PaperTrail.cloud.session", JSON.stringify({
    access_token: "preview-token", refresh_token: "preview-refresh",
    expires_at: Math.floor(Date.now() / 1000) + 86400,
    user: { id: "preview-user", email: "preview@example.com" }
  }));
  const orig = window.fetch;
  window.fetch = function (url, opts) {
    const u = String(url);
    if (u.indexOf("supabase.co") >= 0) {
      let body = {};
      if (u.indexOf("/auth/v1/user") >= 0) body = { id: "preview-user", email: "preview@example.com" };
      else if (u.indexOf("book_versions") >= 0 && (!opts || !opts.method || opts.method === "GET")) body = [];
      else body = [{ id: 1 }];
      return Promise.resolve(new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } }));
    }
    return orig.apply(this, arguments);
  };
})();
`;

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
function near(a, b, px) { return Math.abs(a - b) <= (px == null ? 2 : px); }

function versionLockstep() {
  const app = fs.readFileSync(path.join(ROOT, "app.js"), "utf8");
  const sw = fs.readFileSync(path.join(ROOT, "sw.js"), "utf8");
  const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  const a = (app.match(/APP_VERSION = "([^"]+)"/) || [])[1];
  const s = (sw.match(/VERSION = "([^"]+)"/) || [])[1];
  const h = [...new Set(html.match(/(?<![\d.])37\.\d+\.\d+(?:\.\d+)?(?!\d|\.\d)/g) || [])];
  return { app: a, sw: s, index: h, ok: a === "37.5.122" && a === s && h.length === 1 && h[0] === a };
}

(async () => {
  const fail = [];
  const out = { version: versionLockstep() };
  if (!out.version.ok) fail.push("version lockstep " + JSON.stringify(out.version));
  const chrome = spawn(CHROME, [
    "--headless=new", "--disable-gpu", "--no-sandbox", "--disable-dev-shm-usage",
    "--remote-debugging-port=" + PORT, "--user-data-dir=/tmp/pt-ui-" + PORT, "about:blank"
  ], { stdio: "ignore" });
  try {
    let ver;
    for (let i = 0; i < 40 && !ver; i++) {
      try { ver = JSON.parse(await get("http://127.0.0.1:" + PORT + "/json/version")); } catch (e) { await sleep(150); }
    }
    if (!ver) throw new Error("Chrome debug port did not open");
    const list = JSON.parse(await get("http://127.0.0.1:" + PORT + "/json/list"));
    const page = list.find((t) => t.type === "page");
    const cdp = new CDP(page.webSocketDebuggerUrl);
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");
    await cdp.send("Emulation.setDeviceMetricsOverride", { width: 390, height: 960, deviceScaleFactor: 1, mobile: true });
    await cdp.send("Page.addScriptToEvaluateOnNewDocument", { source: SEED });
    await cdp.send("Page.navigate", { url: BASE.replace(/\/$/, "") + "/index.html?nosplash=1" });
    await sleep(1600);

    async function phoneClip() {
      const box = await cdp.eval(`(() => {
        const p = document.querySelector(".phone").getBoundingClientRect();
        return { x: p.x, y: p.y, width: p.width, height: p.height, scale: 1 };
      })()`);
      return box;
    }
    async function snap(name) {
      if (!SHOTS) return;
      fs.mkdirSync(SHOTS, { recursive: true });
      await cdp.shot(path.join(SHOTS, name), await phoneClip());
    }

    out.savings = await cdp.eval(`(async () => {
      for (let i = 0; i < 20 && !document.querySelector(".sav-envelope"); i++) await new Promise((r) => setTimeout(r, 150));
      const screen = document.getElementById("screen");
      const sav = document.querySelector(".sav-envelope");
      const foodLine = document.querySelector(".envelope:not(.sav-envelope) .line-name");
      const sr = screen.getBoundingClientRect();
      screen.scrollTop += sav.getBoundingClientRect().top - sr.top - 120;
      await new Promise((r) => setTimeout(r, 50));
      const foodName = document.querySelector(".envelope:not(.sav-envelope) .line-name").getBoundingClientRect();
      const foodAmt = document.querySelector(".envelope:not(.sav-envelope) .line-assigned-btn").getBoundingClientRect();
      const savName = sav.querySelector(".line-name").getBoundingClientRect();
      const savAmt = sav.querySelector(".line-assigned-btn").getBoundingClientRect();
      const marks = [...sav.querySelectorAll(".sav-mark")];
      const toggle = document.querySelector(".sav-count-toggle");
      const rate0 = PaperTrailPreview.canonicalSavings(2026, 11, 11);
      const scroll0 = screen.scrollTop;
      const head0 = sav.querySelector(".sav-count-h").getBoundingClientRect();
      const folded = {
        nameDelta: Math.round((savName.left - foodName.left) * 10) / 10,
        amtDelta: Math.round((savAmt.right - foodAmt.right) * 10) / 10,
        hidden: marks.length >= 2 && marks.every((el) => getComputedStyle(el).visibility === "hidden" && Number(getComputedStyle(el).opacity) === 0 && el.getAttribute("aria-hidden") === "true"),
        width: Math.round(marks[0].getBoundingClientRect().width),
        header: document.querySelector(".sav-count-h").textContent.replace(/\\s+/g, " ").trim(),
        help: !!document.querySelector(".sav-count-h .help-q"),
        expanded: toggle.getAttribute("aria-expanded"),
        label: toggle.getAttribute("aria-label")
      };
      toggle.click();
      await new Promise((r) => setTimeout(r, 80));
      const mid = Number(getComputedStyle(sav.querySelector(".sav-mark")).opacity);
      const midName = sav.querySelector(".line-name").getBoundingClientRect().left;
      await new Promise((r) => setTimeout(r, 220));
      const savName1 = sav.querySelector(".line-name").getBoundingClientRect();
      const savAmt1 = sav.querySelector(".line-assigned-btn").getBoundingClientRect();
      const foodAmt1 = document.querySelector(".envelope:not(.sav-envelope) .line-assigned-btn").getBoundingClientRect();
      const head1 = sav.querySelector(".sav-count-h").getBoundingClientRect();
      const openMarks = [...sav.querySelectorAll(".sav-mark")].map((el) => ({
        name: el.getAttribute("data-name"),
        pressed: el.getAttribute("aria-pressed"),
        check: !!el.querySelector(".sav-check"),
        shown: getComputedStyle(el).visibility === "visible" && Number(getComputedStyle(el).opacity) > 0.9,
        text: el.textContent.trim(),
        w: Math.round(el.getBoundingClientRect().width)
      }));
      const opened = {
        shifted: Math.round(savName1.left - savName.left),
        amtStill: Math.abs(savAmt1.right - savAmt.right) < 1.5,
        foodAmtStill: Math.abs(foodAmt1.top - foodAmt.top) < 1.5 && Math.abs(foodAmt1.right - foodAmt.right) < 1.5,
        headStill: Math.abs(head1.top - head0.top) < 1.5 && Math.abs(head1.left - head0.left) < 1.5,
        scroll: screen.scrollTop === scroll0,
        mid: mid,
        midMoved: midName > savName.left + 2 && midName < savName1.left - 1,
        header: document.querySelector(".sav-count-h").textContent.replace(/\\s+/g, " ").trim(),
        help: !!document.querySelector(".sav-count-h .help-q"),
        expanded: toggle.getAttribute("aria-expanded"),
        label: toggle.getAttribute("aria-label"),
        marks: openMarks
      };
      const rate1 = PaperTrailPreview.canonicalSavings(2026, 11, 11);
      toggle.click();
      await new Promise((r) => setTimeout(r, 260));
      const back = sav.querySelector(".line-name").getBoundingClientRect();
      const foodBack = document.querySelector(".envelope:not(.sav-envelope) .line-name").getBoundingClientRect();
      const hiddenAgain = [...sav.querySelectorAll(".sav-mark")].every((el) => getComputedStyle(el).visibility === "hidden");
      const rate2 = PaperTrailPreview.canonicalSavings(2026, 11, 11);
      return {
        folded, opened, backName: Math.round((back.left - foodBack.left) * 10) / 10,
        hiddenAgain, expandedAgain: toggle.getAttribute("aria-expanded"),
        rateSame: rate0.rate === rate1.rate && rate1.rate === rate2.rate,
        houseIn: rate0.budgetItems.some((it) => it.name === "House fund"),
        vacOut: !rate0.budgetItems.some((it) => it.name === "Vacation")
      };
    })()`);
    const sv = out.savings;
    if (!sv || !sv.folded) fail.push("savings layout missing");
    else {
      if (!near(sv.folded.nameDelta, 0)) fail.push("closed savings names are not aligned with Food " + sv.folded.nameDelta);
      if (!near(sv.folded.amtDelta, 0)) fail.push("closed savings amounts are not aligned " + sv.folded.amtDelta);
      if (!sv.folded.hidden || sv.folded.width > 2) fail.push("checks take space while closed " + JSON.stringify(sv.folded));
      if (sv.folded.expanded !== "false" || sv.folded.label !== "Show which lines count towards the savings rate") fail.push("toggle label " + sv.folded.label);
      if (!/Count towards savings rate/.test(sv.folded.header) || !sv.folded.help) fail.push("header/help changed " + sv.folded.header);
      if (!(sv.opened.shifted >= 16 && sv.opened.shifted <= 30)) fail.push("open shift " + sv.opened.shifted);
      if (!sv.opened.amtStill || !sv.opened.foodAmtStill || !sv.opened.headStill || !sv.opened.scroll) fail.push("open moved header, other amounts, or scroll " + JSON.stringify(sv.opened));
      if (!(sv.opened.mid > 0.05 && sv.opened.mid < 0.98) || !sv.opened.midMoved) fail.push("shift/fade was not in progress " + sv.opened.mid);
      if (sv.opened.header !== sv.folded.header || !sv.opened.help) fail.push("header changed when opened");
      if (sv.opened.expanded !== "true" || sv.opened.label !== "Hide which lines count towards the savings rate") fail.push("open label " + sv.opened.label);
      const house = sv.opened.marks.filter((m) => m.name === "House fund")[0];
      const vac = sv.opened.marks.filter((m) => m.name === "Vacation")[0];
      if (!house || !house.check || !house.shown || house.pressed !== "true" || /\b(In|Out)\b/.test(house.text)) fail.push("counted check " + JSON.stringify(house));
      if (!vac || vac.check || !vac.shown || vac.pressed !== "false" || vac.text !== "") fail.push("uncounted blank " + JSON.stringify(vac));
      if (!near(sv.backName, 0) || !sv.hiddenAgain || sv.expandedAgain !== "false") fail.push("close did not restore alignment " + JSON.stringify({ back: sv.backName, hidden: sv.hiddenAgain }));
      if (!sv.rateSame || !sv.houseIn || !sv.vacOut) fail.push("savings math changed " + JSON.stringify({ rateSame: sv.rateSame, houseIn: sv.houseIn, vacOut: sv.vacOut }));
    }
    await snap("01-savings-collapsed.png");
    await cdp.eval(`document.querySelector(".sav-count-toggle").click()`);
    await sleep(280);
    await snap("02-savings-open.png");
    await cdp.eval(`document.querySelector(".sav-count-toggle").click()`);
    await sleep(50);

    out.tx = await cdp.eval(`(async () => {
      document.querySelector('[data-tab="spend"]').click();
      await new Promise((r) => setTimeout(r, 300));
      const adds = [...document.querySelectorAll('[data-act="add-spend"]')].filter((el) => !el.hidden && el.offsetParent !== null);
      const labeled = [...document.querySelectorAll("button")].filter((b) => b.offsetParent && b.textContent.trim() === "Add");
      return {
        n: adds.length,
        id: adds.map((el) => el.id),
        label: adds.map((el) => el.getAttribute("aria-label") || el.textContent.trim()),
        labeled: labeled.length,
        title: (document.querySelector(".nav-row h2") || {}).textContent || ""
      };
    })()`);
    if (!out.tx || out.tx.n !== 1 || out.tx.id[0] !== "fab-add") fail.push("transactions add controls " + JSON.stringify(out.tx));
    if (out.tx && out.tx.labeled !== 0) fail.push("Add label still on screen");
    if (out.tx && out.tx.title !== "Transactions") fail.push("transactions title " + out.tx.title);
    await snap("03-transactions-one-add.png");

    out.budgetAdd = await cdp.eval(`(async () => {
      document.querySelector('[data-tab="budget"]').click();
      await new Promise((r) => setTimeout(r, 200));
      const bar = document.querySelector(".bar-add-tx");
      return { bar: !!(bar && bar.offsetParent), fabHidden: document.getElementById("fab-add").hidden };
    })()`);
    if (!out.budgetAdd || !out.budgetAdd.bar || !out.budgetAdd.fabHidden) fail.push("budget add changed " + JSON.stringify(out.budgetAdd));

    out.sheet = await cdp.eval(`(async () => {
      const samples = [];
      let stop = false;
      const tick = () => {
        const sh = document.querySelector(".sheet.ed-add");
        if (sh) {
          const r = sh.getBoundingClientRect();
          samples.push({ top: r.top, h: r.height });
        }
        if (!stop) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      document.querySelector(".bar-add-tx").click();
      await new Promise((r) => setTimeout(r, 450));
      stop = true;
      let maxTop = 0, maxH = 0;
      for (let i = 1; i < samples.length; i++) {
        maxTop = Math.max(maxTop, Math.abs(samples[i].top - samples[i - 1].top));
        maxH = Math.max(maxH, Math.abs(samples[i].h - samples[i - 1].h));
      }
      const sh = document.querySelector("form.sheet.ed-add");
      const order = ["date", "amount", "payee", "item", "note"].map((k) => {
        const el = k === "amount" ? sh.querySelector(".ed-amt") : k === "item" ? sh.querySelector(".ed-items") : k === "note" ? sh.querySelector(".ed-add-note") : sh.querySelector('[data-ed-in="' + k + '"]');
        return el ? Math.round(el.getBoundingClientRect().top) : null;
      });
      const focusables = [...sh.querySelectorAll("button, input, select, textarea")].filter((el) => !el.disabled && el.tabIndex >= 0 && el.offsetParent && el.getAttribute("aria-hidden") !== "true");
      const keys = focusables.map((el) => el.getAttribute("data-ed-in") || el.getAttribute("data-ed") || el.className);
      const payI = keys.indexOf("payee");
      const today = new Date();
      const iso = today.getFullYear() + "-" + ("0" + (today.getMonth() + 1)).slice(-2) + "-" + ("0" + today.getDate()).slice(-2);
      const date = sh.querySelector('[data-ed-in="date"]');
      const pay = sh.querySelector('[data-ed-in="payee"]');
      const note = sh.querySelector('[data-ed-in="note"]');
      return {
        openMaxTop: Math.round(maxTop), openMaxH: Math.round(maxH), samples: samples.length,
        order: order,
        next: keys[payI + 1] || "",
        date: date.value, iso: iso,
        amt: sh.querySelector(".ed-amt-v").textContent,
        payee: pay.value,
        ph: [date, pay, note].map((el) => el.getAttribute("placeholder")),
        noteOpen: sh.querySelector(".ed-note").classList.contains("is-open"),
        noteText: sh.querySelector(".ed-add-note").textContent.trim(),
        itemText: sh.querySelector(".ed-items-name").textContent.trim(),
        splitLink: !!sh.querySelector(".ed-split-link, [data-ed='split']"),
        addSplit: !!sh.querySelector(".ed-add-split"),
        save: !!sh.querySelector(".ed-actions .ed-save"),
        del: !!sh.querySelector('[data-act="delete-spend"]'),
        close: !!sh.querySelector('[data-act="close-modal"]'),
        closeX: (() => {
          const b = sh.querySelector(".ed-close");
          if (!b) return null;
          const r = b.getBoundingClientRect();
          const head = sh.querySelector(".ed-head").getBoundingClientRect();
          return { label: b.getAttribute("aria-label"), w: Math.round(r.width), h: Math.round(r.height), right: Math.round(head.right - r.right), n: sh.querySelectorAll(".ed-top button").length };
        })(),
        title: sh.querySelector("h3").textContent
      };
    })()`);
    const sh = out.sheet;
    if (!sh) fail.push("sheet missing");
    else {
      if (sh.order.some((n) => n == null) || !(sh.order[0] < sh.order[1] && sh.order[1] < sh.order[2] && sh.order[2] < sh.order[3] && sh.order[3] < sh.order[4])) fail.push("field order " + JSON.stringify(sh.order));
      if (sh.next !== "picker") fail.push("tab after merchant is " + sh.next);
      if (sh.date !== sh.iso) fail.push("date default " + sh.date + " vs " + sh.iso);
      if (sh.amt !== "" || sh.payee !== "") fail.push("amount/merchant not empty " + JSON.stringify({ amt: sh.amt, payee: sh.payee }));
      if (sh.ph.some((p) => p)) fail.push("placeholder returned " + JSON.stringify(sh.ph));
      if (sh.noteOpen || sh.noteText !== "Add note") fail.push("note not collapsed " + sh.noteText);
      if (sh.itemText !== "Choose budget item") fail.push("budget item " + sh.itemText);
      if (sh.splitLink || sh.addSplit) fail.push("empty sheet offers a split control");
      if (!sh.save || sh.del || sh.close) fail.push("new sheet actions " + JSON.stringify({ save: sh.save, del: sh.del, close: sh.close }));
      if (!sh.closeX || sh.closeX.label !== "Close" || sh.closeX.w < 44 || sh.closeX.h < 44 || sh.closeX.right > 16 || sh.closeX.n !== 1) fail.push("close x " + JSON.stringify(sh.closeX));
      if (sh.openMaxTop > 24 || sh.openMaxH > 80) fail.push("open jumped " + sh.openMaxTop + "/" + sh.openMaxH);
    }
    await snap("04-new-transaction.png");

    out.merchant = await cdp.eval(`(async () => {
      const pay = document.querySelector('[data-ed-in="payee"]');
      pay.focus();
      pay.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
      pay.value = "Corner market";
      pay.dispatchEvent(new Event("input", { bubbles: true }));
      await new Promise((r) => setTimeout(r, 560));
      const sh = document.querySelector("form.sheet.ed-add");
      const item = sh.querySelector(".ed-items");
      const note = sh.querySelector(".ed-add-note");
      const sc = sh.querySelector(".ed-scroll").getBoundingClientRect();
      const ir = item.getBoundingClientRect();
      const nr = note.getBoundingClientRect();
      const pr = pay.getBoundingClientRect();
      const save = sh.querySelector(".ed-save").getBoundingClientRect();
      return {
        payee: pay.value,
        itemAboveNote: ir.bottom <= nr.top + 1,
        belowMerchant: ir.top >= pr.bottom - 1,
        inScroll: ir.top >= sc.top - 2 && ir.bottom <= sc.bottom + 2,
        saveBelow: save.top >= ir.bottom - 1,
        item: item.querySelector(".ed-items-name").textContent.trim()
      };
    })()`);
    if (!out.merchant || out.merchant.payee !== "Corner market" || !out.merchant.itemAboveNote || !out.merchant.belowMerchant || !out.merchant.inScroll) fail.push("budget item not ready after merchant " + JSON.stringify(out.merchant));
    await snap("05-merchant-then-budget-item.png");

    out.motion = await cdp.eval(`(async () => {
      const sh = document.querySelector("form.sheet.ed-add");
      const before = sh.getBoundingClientRect();
      const phoneBefore = document.querySelector(".phone").getBoundingClientRect();
      const modalBefore = document.getElementById("modal").getBoundingClientRect();
      const tfBefore = getComputedStyle(sh).transform;
      const samples = [];
      let stop = false;
      const tick = () => {
        const r = sh.getBoundingClientRect();
        samples.push({ top: r.top, h: r.height });
        if (!stop) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      const noteBtn = document.querySelector('[data-ed="note-open"]');
      if (noteBtn && noteBtn.offsetParent) noteBtn.click();
      await new Promise((r) => setTimeout(r, 280));
      const noteTop = sh.getBoundingClientRect().top;
      document.querySelector('[data-ed="picker"]').click();
      await new Promise((r) => setTimeout(r, 80));
      const midPicker = !!document.querySelector(".ed-picker");
      const ticks = document.querySelectorAll(".ed-picker [data-ed='tick']").length;
      document.querySelector(".ed-picker [data-ed='tick']").click();
      await new Promise((r) => setTimeout(r, 40));
      document.querySelector("[data-ed='picker-done']").click();
      await new Promise((r) => setTimeout(r, 240));
      stop = true;
      let maxTop = 0, maxH = 0;
      for (let i = 1; i < samples.length; i++) {
        maxTop = Math.max(maxTop, Math.abs(samples[i].top - samples[i - 1].top));
        maxH = Math.max(maxH, Math.abs(samples[i].h - samples[i - 1].h));
      }
      const after = sh.getBoundingClientRect();
      return {
        maxTop: Math.round(maxTop), maxH: Math.round(maxH),
        topDelta: Math.round(after.top - before.top),
        hDelta: Math.round(after.height - before.height),
        beforeH: Math.round(before.height), afterH: Math.round(after.height),
        styleH: sh.style.height, lock: sh.dataset.lockH, cls: sh.className, tf: sh.style.transform,
        phoneH: Math.round(document.querySelector(".phone").getBoundingClientRect().height - phoneBefore.height),
        modalH: Math.round(document.getElementById("modal").getBoundingClientRect().height - modalBefore.height),
        modalTop: Math.round(document.getElementById("modal").getBoundingClientRect().top - modalBefore.top),
        tfBefore: tfBefore, tfAfter: getComputedStyle(sh).transform,
        noteTopDelta: Math.round(noteTop - before.top),
        pickerSeen: midPicker,
        ticks: ticks,
        pickerGone: !document.querySelector(".ed-picker"),
        item: (document.querySelector(".ed-items-name") || {}).textContent || "",
        noteOpen: document.querySelector(".ed-note").classList.contains("is-open")
      };
    })()`);
    if (!out.motion || out.motion.maxTop > 8 || out.motion.maxH > 8 || Math.abs(out.motion.topDelta) > 2) fail.push("note/picker jumped the sheet " + JSON.stringify(out.motion));
    if (!out.motion.pickerSeen || out.motion.ticks < 2 || !out.motion.pickerGone || out.motion.item === "Choose budget item" || !out.motion.noteOpen) fail.push("picker/note did not settle " + JSON.stringify(out.motion));

    await cdp.eval(`document.querySelector(".ed-save") && (document.querySelector('[data-act="delete-spend"]') || true)`);
    /* Close by saving is not required here. Leave the new sheet and open an edit from the list. */
    await cdp.eval(`(() => { const m = document.getElementById("modal"); m.hidden = true; m.innerHTML = ""; document.body.classList.remove("ed-add-open", "tx-editor-open", "ed-typing"); })()`);
    await sleep(50);

    out.edit = await cdp.eval(`(async () => {
      document.querySelector('[data-tab="spend"]').click();
      await new Promise((r) => setTimeout(r, 250));
      document.querySelector('[data-act="edit-spend"][data-id="t1"]').click();
      await new Promise((r) => setTimeout(r, 250));
      const sh = document.querySelector("form.sheet.ed-add");
      if (!sh) return { error: "no edit sheet", text: document.body.innerText.slice(0, 200) };
      const block = sh.querySelector(".ed-itemsec");
      const item = (block.querySelector(".ed-split-main") || block).getBoundingClientRect();
      const note = sh.querySelector(".ed-note").getBoundingClientRect();
      const x = sh.querySelector('[data-act="delete-spend"]');
      const save = sh.querySelector(".ed-actions .ed-save");
      const noteIn = sh.querySelector('[data-ed-in="note"]');
      return {
        itemAbove: block.getBoundingClientRect().bottom <= note.top + 2,
        item: sh.querySelector(".ed-items-name").textContent.trim(),
        addSplit: !!sh.querySelector(".ed-add-split"),
        splitLink: !!sh.querySelector(".ed-split-link, [data-ed='split']"),
        minus: !!sh.querySelector(".ed-split-minus"),
        mark: (sh.querySelector(".ed-split-minus") || {}).textContent.trim(),
        removeName: (sh.querySelector(".ed-split-minus") || {}).getAttribute("aria-label") || "",
        rem: (sh.querySelector(".ed-split-main .ed-rem") || {}).textContent.trim(),
        addInside: !!sh.querySelector(".ed-budget-card .ed-add-split"),
        xLeft: (() => {
          const line = sh.querySelector(".ed-split-line");
          if (!line) return false;
          const xb = line.querySelector(".ed-split-minus").getBoundingClientRect();
          const name = line.querySelector(".ed-items-name").getBoundingClientRect();
          const amt = line.querySelector(".ed-row-amt").getBoundingClientRect();
          return xb.right <= name.left + 1 && amt.left >= name.right - 2;
        })(),
        noteOpen: sh.querySelector(".ed-note").classList.contains("is-open"),
        note: noteIn.value,
        x: x ? x.getAttribute("aria-label") : "",
        xTop: x ? x.getAttribute("data-act") : "",
        save: save ? save.textContent.trim() : "",
        saveInFoot: !!(save && save.closest(".ed-actions")),
        close: !!sh.querySelector('[data-act="close-modal"]'),
        closeX: (sh.querySelector(".ed-close") || {}).getAttribute ? sh.querySelector(".ed-close").getAttribute("aria-label") : "",
        headerXs: sh.querySelectorAll(".ed-top button").length,
        ph: noteIn.getAttribute("placeholder")
      };
    })()`);
    if (!out.edit || out.edit.error) fail.push("edit " + JSON.stringify(out.edit));
    else {
      if (!out.edit.itemAbove || out.edit.item !== "Groceries") fail.push("edit budget item " + JSON.stringify(out.edit));
      if (!out.edit.addSplit || out.edit.splitLink || !out.edit.minus || !/Remove /.test(out.edit.removeName) || !/Remaining:/.test(out.edit.rem) || !out.edit.addInside || !out.edit.xLeft) fail.push("edit split chrome " + JSON.stringify(out.edit));
      if (!out.edit.noteOpen || out.edit.note !== "Weekly groceries") fail.push("edit note " + out.edit.note);
      if (out.edit.x || out.edit.save !== "Save" || !out.edit.saveInFoot || out.edit.close || out.edit.closeX !== "Close" || out.edit.headerXs !== 1 || out.edit.ph) fail.push("edit chrome " + JSON.stringify(out.edit));
    }
    await snap("06-edit-transaction.png");

    out.keyboard = await cdp.eval(`(async () => {
      const pay = document.querySelector('[data-ed-in="payee"]');
      const fake = { height: 340, width: 390, offsetTop: 0, offsetLeft: 0, scale: 1, pageTop: 0, pageLeft: 0, addEventListener() {}, removeEventListener() {} };
      try { Object.defineProperty(window, "visualViewport", { configurable: true, get() { return fake; } }); }
      catch (e) { return { skipped: true, why: String(e) }; }
      const samples = [];
      let stop = false;
      const tick = () => {
        const sh = document.querySelector("form.sheet.ed-add");
        if (sh) samples.push({ top: sh.getBoundingClientRect().top, h: sh.getBoundingClientRect().height });
        if (!stop) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      window.__focusins = 0;
      pay.blur();
      try { pay.focus({ preventScroll: true }); } catch (e) { pay.focus(); }
      pay.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
      await new Promise((r) => setTimeout(r, 400));
      stop = true;
      const sh = document.querySelector("form.sheet.ed-add");
      const field = pay.getBoundingClientRect();
      const save = sh.querySelector(".ed-save").getBoundingClientRect();
      const sheet = sh.getBoundingClientRect();
      let maxStep = 0;
      for (let i = 1; i < samples.length; i++) maxStep = Math.max(maxStep, Math.abs(samples[i].h - samples[i - 1].h), Math.abs(samples[i].top - samples[i - 1].top));
      return {
        fieldBottom: Math.round(field.bottom), fieldTop: Math.round(field.top),
        saveBottom: Math.round(save.bottom), saveTop: Math.round(save.top),
        sheetBottom: Math.round(sheet.bottom), vis: fake.height,
        maxStep: Math.round(maxStep),
        coveredField: field.bottom > fake.height + 1 || field.bottom > save.top + 2,
        coveredSave: save.bottom > fake.height + 1,
        cls: sh.className, tf: sh.style.transform, ht: sh.style.height, lock: sh.dataset.lockH,
        vv: window.visualViewport && window.visualViewport.height,
        host: Math.round(sh.parentNode.getBoundingClientRect().bottom),
        active: document.activeElement === pay,
        lastFit: window.__lastFit || null,
        focusins: window.__focusins || 0
      };
    })()`);
    if (!out.keyboard || out.keyboard.skipped) fail.push("keyboard viewport " + JSON.stringify(out.keyboard));
    else {
      if (out.keyboard.coveredField || out.keyboard.coveredSave) fail.push("keyboard covered field or save " + JSON.stringify(out.keyboard));
    }
    await snap("07-keyboard-field-and-save.png");

    await cdp.send("Page.navigate", { url: BASE.replace(/\/$/, "") + "/index.html?nosplash=1" });
    await sleep(1500);
    await cdp.eval(`document.querySelector(".bar-add-tx").click()`);
    await sleep(350);
    out.splitEmpty = await cdp.eval(`(() => {
      const sh = document.querySelector("form.sheet.ed-add");
      const block = sh.querySelector(".ed-itemsec").getBoundingClientRect();
      const note = sh.querySelector(".ed-note").getBoundingClientRect();
      return {
        split: !!sh.querySelector(".ed-split-link, [data-ed='split'], .ed-add-split"),
        choose: (sh.querySelector(".ed-items-name") || {}).textContent.trim(),
        noteAfter: block.bottom <= note.top + 2
      };
    })()`);
    if (!out.splitEmpty || out.splitEmpty.split || out.splitEmpty.choose !== "Choose budget item" || !out.splitEmpty.noteAfter) fail.push("empty split chrome " + JSON.stringify(out.splitEmpty));
    await cdp.eval(`["2","0","0","0"].forEach((k) => document.querySelector('[data-ed="key"][data-k="' + k + '"]').click())`);
    await sleep(80);
    await cdp.eval(`document.querySelector('[data-ed="picker"]').click()`);
    await sleep(220);
    out.splitPicker = await cdp.eval(`(() => {
      const ticks = [...document.querySelectorAll(".ed-picker [role='checkbox']")];
      const top0 = document.querySelector("form.sheet.ed-add").getBoundingClientRect().top;
      return {
        n: ticks.length,
        boxes: ticks.every((t) => t.getAttribute("role") === "checkbox"),
        hint: (document.querySelector(".ed-picker-hint") || {}).textContent || "",
        top: top0,
        remPx: parseFloat(getComputedStyle(document.querySelector(".ed-picker .ed-rem-amt")).fontSize),
        remWeight: getComputedStyle(document.querySelector(".ed-picker .ed-rem-amt")).fontWeight,
        namePx: parseFloat(getComputedStyle(document.querySelector(".ed-picker .ed-item-label")).fontSize),
        nameWeight: getComputedStyle(document.querySelector(".ed-picker .ed-item-label")).fontWeight,
        nameWrap: getComputedStyle(document.querySelector(".ed-picker .ed-item-label")).whiteSpace,
        nameCut: getComputedStyle(document.querySelector(".ed-picker .ed-item-label")).textOverflow,
        remUnder: document.querySelector(".ed-picker .ed-rem").getBoundingClientRect().top >= document.querySelector(".ed-picker .ed-item-label").getBoundingClientRect().bottom - 2,
        tickRight: document.querySelector(".ed-picker .ed-tick").getBoundingClientRect().left >= document.querySelector(".ed-picker .ed-item-label").getBoundingClientRect().right - 2,
        remColor: getComputedStyle(document.querySelector(".ed-picker .ed-rem")).color,
        hintColor: getComputedStyle(document.querySelector(".ed-picker-hint")).color
      };
    })()`);
    await snap("08-budget-picker-checks.png");
    if (!out.splitPicker || out.splitPicker.n < 2 || !out.splitPicker.boxes || /split across/i.test(out.splitPicker.hint)) fail.push("picker checks " + JSON.stringify(out.splitPicker));
    if (!out.splitPicker || !(out.splitPicker.remPx <= 13) || !(out.splitPicker.namePx >= 15) || Number(out.splitPicker.remWeight) >= 600 || Number(out.splitPicker.nameWeight) >= 600 || out.splitPicker.nameWrap === "nowrap" || out.splitPicker.nameCut === "ellipsis" || !out.splitPicker.remUnder || !out.splitPicker.tickRight) fail.push("picker remaining type " + JSON.stringify(out.splitPicker));
    out.splitCheck = await cdp.eval(`(async () => {
      const sh = document.querySelector("form.sheet.ed-add");
      const a = sh.getBoundingClientRect().top;
      document.querySelector(".ed-picker [data-ed='tick']").click();
      await new Promise((r) => setTimeout(r, 60));
      const b = sh.getBoundingClientRect().top;
      return { delta: Math.round(Math.abs(b - a)), checked: document.querySelector(".ed-picker [data-ed='tick']").getAttribute("aria-checked"), open: !!document.querySelector(".ed-picker") };
    })()`);
    if (!out.splitCheck || out.splitCheck.delta > 3 || out.splitCheck.checked !== "true" || !out.splitCheck.open) fail.push("checking a box " + JSON.stringify(out.splitCheck));
    await cdp.eval(`document.querySelector("[data-ed='picker-done']").click()`);
    await sleep(260);
    out.splitOne = await cdp.eval(`(() => {
      const sh = document.querySelector("form.sheet.ed-add");
      const card = sh.querySelector(".ed-budget-card");
      const line = sh.querySelector(".ed-split-line");
      const block = sh.querySelector(".ed-itemsec").getBoundingClientRect();
      const note = sh.querySelector(".ed-note").getBoundingClientRect();
      const x = line.querySelector(".ed-split-minus").getBoundingClientRect();
      const name = line.querySelector(".ed-items-name").getBoundingClientRect();
      const amt = line.querySelector(".ed-row-amt").getBoundingClientRect();
      const add = sh.querySelector(".ed-add-split");
      const cardBox = card.getBoundingClientRect();
      const remEl = line.querySelector(".ed-rem-amt");
      const amtEl = line.querySelector(".ed-row-amt");
      return {
        lines: sh.querySelectorAll(".ed-split-line").length,
        name: (line.querySelector(".ed-items-name") || {}).textContent.trim(),
        add: (add || {}).textContent.trim(),
        minus: (line.querySelector(".ed-split-minus") || {}).getAttribute("aria-label") || "",
        rem: (line.querySelector(".ed-rem") || {}).textContent.trim(),
        splitBtn: !!sh.querySelector(".ed-split-link, [data-ed='split']"),
        noteAfter: block.bottom <= note.top + 2,
        remPx: parseFloat(getComputedStyle(remEl).fontSize),
        amtPx: parseFloat(getComputedStyle(amtEl).fontSize),
        namePx: parseFloat(getComputedStyle(line.querySelector(".ed-split-name")).fontSize),
        remWeight: getComputedStyle(remEl).fontWeight,
        payeePx: parseFloat(getComputedStyle(sh.querySelector('[data-ed-in="payee"]')).fontSize),
        remWrap: getComputedStyle(line.querySelector(".ed-rem")).whiteSpace,
        remCut: getComputedStyle(line.querySelector(".ed-rem")).textOverflow,
        addH: Math.round(add.getBoundingClientRect().height),
        addAlign: getComputedStyle(add).textAlign,
        addWeight: getComputedStyle(add).fontWeight,
        heading: (sh.querySelector(".ed-budget-h") || {}).textContent.trim(),
        ring: !!line.querySelector(".ed-minus-ring"),
        hit: Math.round(Math.min(x.width, x.height)),
        nameColor: getComputedStyle(line.querySelector(".ed-split-name")).color,
        remColor: getComputedStyle(remEl).color,
        amtColor: getComputedStyle(amtEl).color,
        checkNo: /check\s*#/i.test(sh.innerText),
        xLeft: x.right <= name.left + 1 && x.left >= cardBox.left - 1,
        xRight: x.left > cardBox.right - 8,
        amtRight: amt.left >= name.right - 2 && amt.right <= cardBox.right + 1,
        addInside: !!(card && add && card.contains(add) && add.getBoundingClientRect().top >= line.getBoundingClientRect().bottom - 2 && add.getBoundingClientRect().bottom <= cardBox.bottom + 1),
        quiet: getComputedStyle(line.querySelector(".ed-split-minus")).backgroundColor === "rgba(0, 0, 0, 0)" || !/rgb\(\s*(1[2-9]\d|2\d\d)\s*,\s*(\d{1,2})\s*,\s*(\d{1,2})\s*\)/.test(getComputedStyle(line.querySelector(".ed-split-minus")).backgroundColor),
        rowAmt: amtEl.value,
        topAmt: (sh.querySelector(".ed-amt-v") || {}).textContent.trim(),
        oldBoxes: sh.querySelectorAll(".ed-alloc-row").length,
        picker: !!sh.querySelector(".ed-picker")
      };
    })()`);
    await snap("09-one-item-add-split.png");
    if (!out.splitOne || out.splitOne.lines !== 1 || !out.splitOne.name || out.splitOne.name === "Choose budget item" || out.splitOne.add !== "Add Split" || !/Remove /.test(out.splitOne.minus) || !/Remaining:/.test(out.splitOne.rem) || /…/.test(out.splitOne.rem) || out.splitOne.splitBtn || !out.splitOne.noteAfter || out.splitOne.picker || !(out.splitOne.namePx >= out.splitOne.remPx + 3) || Number(out.splitOne.remWeight) >= 600 || out.splitOne.nameColor === out.splitOne.remColor || out.splitOne.amtColor !== out.splitOne.nameColor || out.splitOne.heading !== "Budget Item(s)" || !out.splitOne.ring || out.splitOne.hit < 44 || out.splitOne.addAlign !== "center" || out.splitOne.addH < 52 || out.splitOne.addH > 64 || Number(out.splitOne.addWeight) >= 500 || out.splitOne.checkNo || !out.splitOne.xLeft || out.splitOne.xRight || !out.splitOne.amtRight || !out.splitOne.addInside || !out.splitOne.quiet || out.splitOne.rowAmt !== "$20.00" || out.splitOne.topAmt !== "$20.00" || out.splitOne.oldBoxes) fail.push("one item split " + JSON.stringify(out.splitOne));
    await cdp.eval(`document.querySelector(".ed-add-split").click()`);
    await sleep(200);
    await cdp.eval(`(() => { const off = [...document.querySelectorAll(".ed-picker [data-ed='tick']")].find((t) => t.getAttribute("aria-checked") !== "true"); off.click(); })()`);
    await sleep(40);
    await cdp.eval(`document.querySelector("[data-ed='picker-done']").click()`);
    await sleep(200);
    out.splitTwo = await cdp.eval(`(() => {
      const sh = document.querySelector("form.sheet.ed-add");
      const card = sh.querySelector(".ed-budget-card");
      const block = sh.querySelector(".ed-itemsec").getBoundingClientRect();
      const note = sh.querySelector(".ed-note").getBoundingClientRect();
      const add = sh.querySelector(".ed-add-split");
      const lines = [...sh.querySelectorAll(".ed-split-line")];
      return {
        lines: lines.length,
        names: [...sh.querySelectorAll(".ed-items-name")].map((el) => el.textContent.trim()),
        add: (add || {}).textContent.trim(),
        minus: sh.querySelectorAll(".ed-split-minus").length,
        noteAfter: block.bottom <= note.top + 2,
        amounts: sh.querySelectorAll("[data-ed-leg]").length,
        values: [...sh.querySelectorAll(".ed-row-amt")].map((el) => el.value),
        rem: [...sh.querySelectorAll(".ed-split-main .ed-rem")].map((el) => el.textContent.trim()),
        rest: sh.querySelectorAll(".ed-rest").length,
        even: sh.querySelectorAll("[data-ed='even']").length,
        msg: sh.querySelectorAll(".ed-split-msg").length,
        status: sh.querySelectorAll(".ed-alloc-status").length,
        save: (sh.querySelector(".ed-save") || {}).textContent.trim(),
        saveDisabled: !!(sh.querySelector(".ed-save") || {}).disabled,
        saveAria: (sh.querySelector(".ed-save") || {}).getAttribute("aria-label") || "",
        saveRadius: parseFloat(getComputedStyle(sh.querySelector(".ed-save")).borderRadius),
        addInside: !!(card && add && card.contains(add)),
        xLeft: lines.every((line) => {
          const x = line.querySelector(".ed-split-minus").getBoundingClientRect();
          const name = line.querySelector(".ed-items-name").getBoundingClientRect();
          const amt = line.querySelector(".ed-row-amt").getBoundingClientRect();
          return x.right <= name.left + 1 && amt.left >= name.right - 2;
        }),
        oldBoxes: sh.querySelectorAll(".ed-alloc-row").length
      };
    })()`);
    await cdp.eval(`(() => {
      const card = document.querySelector(".ed-budget-card");
      const sc = document.querySelector(".ed-scroll");
      if (!card || !sc) return;
      const sr = sc.getBoundingClientRect();
      const cr = card.getBoundingClientRect();
      if (cr.bottom > sr.bottom - 8) sc.scrollTop += cr.bottom - (sr.bottom - 8);
    })()`);
    await sleep(40);
    await snap("10-two-splits.png");
    if (!out.splitTwo || out.splitTwo.lines !== 2 || out.splitTwo.names.length !== 2 || out.splitTwo.add !== "Add Split" || out.splitTwo.minus !== 2 || !out.splitTwo.noteAfter || out.splitTwo.amounts !== 2 || out.splitTwo.values.join(",") !== "$0.00,$0.00" || out.splitTwo.rem.length !== 2 || out.splitTwo.rem.some((t) => !/Remaining:/.test(t)) || out.splitTwo.rest !== 0 || out.splitTwo.even !== 0 || out.splitTwo.status !== 0 || out.splitTwo.msg !== 0 || out.splitTwo.save !== "$20.00 remaining" || !out.splitTwo.saveDisabled || out.splitTwo.saveAria.indexOf("$20.00 remaining") !== 0 || !(out.splitTwo.saveRadius >= 20) || !out.splitTwo.addInside || !out.splitTwo.xLeft || out.splitTwo.oldBoxes) fail.push("two splits " + JSON.stringify(out.splitTwo));

    async function closeEd() {
      await cdp.eval(`(() => { const m = document.getElementById("modal"); m.hidden = true; m.innerHTML = ""; document.body.classList.remove("ed-add-open", "tx-editor-open", "ed-typing"); })()`);
      await sleep(40);
    }
    async function openAddSheet() {
      await cdp.eval(`document.querySelector('[data-tab="budget"]').click()`);
      await sleep(180);
      await cdp.eval(`document.querySelector(".bar-add-tx").click()`);
      await sleep(280);
    }
    await closeEd();
    await openAddSheet();
    out.merchList = await cdp.eval(`(async () => {
      ["2", "0", "0", "0"].forEach((k) => document.querySelector('[data-ed="key"][data-k="' + k + '"]').click());
      const pay = document.querySelector('[data-ed-in="payee"]');
      pay.focus();
      pay.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
      await new Promise((r) => setTimeout(r, 320));
      const before = document.querySelector(".ed-items").getBoundingClientRect().top;
      pay.value = "Tr";
      pay.dispatchEvent(new Event("input", { bubbles: true }));
      await new Promise((r) => setTimeout(r, 40));
      const names = [...document.querySelectorAll(".ed-quick-btn")].map((b) => b.textContent.trim());
      const after = document.querySelector(".ed-items").getBoundingClientRect().top;
      const bar = document.querySelector(".ed-quick");
      const buttons = [...document.querySelectorAll(".ed-quick-btn")];
      const rects = buttons.map((b) => b.getBoundingClientRect());
      const save = document.querySelector(".ed-save").getBoundingClientRect();
      const pr = pay.getBoundingClientRect();
      const br = bar.getBoundingClientRect();
      return {
        names,
        n: names.length,
        jump: Math.round(Math.abs(after - before) * 10) / 10,
        row: rects.length > 1 && rects.every((r) => Math.abs(r.top - rects[0].top) < 2),
        equal: rects.length > 1 && rects.every((r) => Math.abs(r.width - rects[0].width) < 8),
        ellipsis: getComputedStyle(buttons[0]).textOverflow === "ellipsis",
        radius: parseFloat(getComputedStyle(buttons[0]).borderRadius),
        aboveSave: br.bottom <= save.top + 2 && br.top > pr.bottom + 24,
        sheetGap: Math.round(document.querySelector(".phone").getBoundingClientRect().bottom - document.querySelector("form.sheet.ed-add").getBoundingClientRect().bottom),
        dropdown: !!document.querySelector(".ed-suggest"),
        chips: document.querySelectorAll(".merchant-chip").length
      };
    })()`);
    const wantMerch = ["Trader Joe's", "Transit", "Truck stop"];
    if (!out.merchList || out.merchList.names.join("|") !== wantMerch.join("|") || out.merchList.n !== 3 || out.merchList.jump > 2 || !out.merchList.row || !out.merchList.equal || !out.merchList.ellipsis || !(out.merchList.radius >= 12) || !out.merchList.aboveSave || out.merchList.sheetGap > 2 || out.merchList.dropdown || out.merchList.chips) fail.push("merchant suggestions " + JSON.stringify(out.merchList));
    out.merchPick = await cdp.eval(`(async () => {
      const btn = [...document.querySelectorAll(".ed-quick-btn")].find((b) => b.textContent.trim() === "Trader Joe's");
      btn.click();
      await new Promise((r) => setTimeout(r, 80));
      const sh = document.querySelector("form.sheet.ed-add");
      return {
        payee: sh.querySelector('[data-ed-in="payee"]').value,
        choose: (sh.querySelector(".ed-items-name") || {}).textContent.trim(),
        card: !!sh.querySelector(".ed-budget-card"),
        topAmt: (sh.querySelector(".ed-amt-v") || {}).textContent.trim(),
        list: sh.querySelectorAll(".ed-quick-btn").length,
        sugg: !!sh.querySelector("[data-role='env-suggest']")
      };
    })()`);
    if (!out.merchPick || out.merchPick.payee !== "Trader Joe's" || out.merchPick.choose !== "Groceries" || !out.merchPick.card || out.merchPick.topAmt !== "$20.00" || out.merchPick.list || out.merchPick.sugg) fail.push("merchant fill " + JSON.stringify(out.merchPick));
    out.lastUsed = await cdp.eval(`(async () => {
      document.querySelector('[data-ed="picker"]').click();
      await new Promise((r) => setTimeout(r, 80));
      const first = document.querySelector(".ed-picker .ed-item-row");
      return {
        name: (first.querySelector(".ed-item-label") || {}).textContent.trim(),
        tag: (first.querySelector(".ed-last-used") || {}).textContent.trim(),
        open: !!document.querySelector(".ed-picker")
      };
    })()`);
    if (!out.lastUsed || out.lastUsed.name !== "Groceries" || out.lastUsed.tag !== "Last used" || !out.lastUsed.open) fail.push("last used " + JSON.stringify(out.lastUsed));
    await cdp.eval(`document.querySelector("[data-ed='picker-done']").click()`);
    await sleep(80);
    await closeEd();
    await openAddSheet();
    out.merchKeep = await cdp.eval(`(async () => {
      document.querySelector('[data-ed="picker"]').click();
      await new Promise((r) => setTimeout(r, 80));
      const row = [...document.querySelectorAll(".ed-picker .ed-item-row")].find((r) => ((r.querySelector(".ed-item-label") || {}).textContent || "").trim() === "Rent");
      row.querySelector("[data-ed='tick']").click();
      await new Promise((r) => setTimeout(r, 40));
      document.querySelector("[data-ed='picker-done']").click();
      await new Promise((r) => setTimeout(r, 80));
      const pay = document.querySelector('[data-ed-in="payee"]');
      pay.focus();
      pay.value = "Ta";
      pay.dispatchEvent(new Event("input", { bubbles: true }));
      await new Promise((r) => setTimeout(r, 40));
      const btn = [...document.querySelectorAll(".ed-quick-btn")].find((b) => b.textContent.trim() === "Target");
      if (btn) btn.click();
      await new Promise((r) => setTimeout(r, 60));
      const name = (document.querySelector(".ed-split-name") || {}).textContent || "";
      return { tapped: !!btn, name: name.trim(), payee: document.querySelector('[data-ed-in="payee"]').value };
    })()`);
    if (!out.merchKeep || !out.merchKeep.tapped || out.merchKeep.payee !== "Target" || out.merchKeep.name.indexOf("Rent") !== 0) fail.push("merchant did not keep the picked item " + JSON.stringify(out.merchKeep));
    await closeEd();
    await openAddSheet();
    out.merchTe = await cdp.eval(`(async () => {
      const pay = document.querySelector('[data-ed-in="payee"]');
      pay.focus();
      pay.value = "Te";
      pay.dispatchEvent(new Event("input", { bubbles: true }));
      await new Promise((r) => setTimeout(r, 40));
      return [...document.querySelectorAll(".ed-quick-btn")].map((b) => b.textContent.trim());
    })()`);
    if (!out.merchTe || out.merchTe.join("|") !== ["Tesco", "Temple Books", "Teacher Supply"].join("|")) fail.push("Te suggestions " + JSON.stringify(out.merchTe));

    if (SHOTS) {
      await cdp.send("Page.navigate", { url: BASE.replace(/\/$/, "") + "/index.html?nosplash=1" });
      await sleep(1500);
      await cdp.eval(`document.querySelector(".bar-add-tx").click()`);
      await sleep(350);
      fs.mkdirSync(path.join(SHOTS, "frames"), { recursive: true });
      const clip0 = await phoneClip();
      let n = 0;
      async function grab() {
        const file = path.join(SHOTS, "frames", "f" + String(n).padStart(3, "0") + ".png");
        n += 1;
        await cdp.shot(file, clip0);
      }
      await grab();
      await cdp.eval(`document.querySelector('[data-ed="next"]').click()`);
      for (let i = 0; i < 4; i++) { await sleep(60); await grab(); }
      await cdp.eval(`(() => { const p = document.querySelector('[data-ed-in="payee"]'); p.value = "Corner market"; p.dispatchEvent(new Event("input", { bubbles: true })); document.querySelector('[data-ed="note-open"]').click(); })()`);
      for (let i = 0; i < 5; i++) { await sleep(50); await grab(); }
      await cdp.eval(`document.querySelector('[data-ed="picker"]').click()`);
      for (let i = 0; i < 4; i++) { await sleep(45); await grab(); }
      await cdp.eval(`document.querySelector('.ed-picker [data-ed="tick"]').click()`);
      for (let i = 0; i < 3; i++) { await sleep(45); await grab(); }
      await cdp.eval(`document.querySelector("[data-ed='picker-done']").click()`);
      for (let i = 0; i < 3; i++) { await sleep(45); await grab(); }
      try {
        const gif = path.join(SHOTS, "07-sheet-motion.gif");
        execFileSync("ffmpeg", ["-y", "-framerate", "10", "-i", path.join(SHOTS, "frames", "f%03d.png"),
          "-vf", "fps=10,scale=390:-1:flags=lanczos,split[s0][s1];[s0]palettegen=stats_mode=diff[p];[s1][p]paletteuse",
          gif], { stdio: "ignore" });
        out.gif = gif;
      } catch (e) { out.gifError = String(e && e.message || e); }

      await cdp.eval(`sessionStorage.setItem("pt-shot-dark", "1")`);
      await cdp.send("Page.navigate", { url: BASE.replace(/\/$/, "") + "/index.html?nosplash=1" });
      await sleep(1600);
      await closeEd();
      await openAddSheet();
      await cdp.eval(`(async () => {
        ["2", "0", "0", "0"].forEach((k) => document.querySelector('[data-ed="key"][data-k="' + k + '"]').click());
        document.querySelector('[data-ed="picker"]').click();
        await new Promise((r) => setTimeout(r, 120));
        document.querySelector(".ed-picker [data-ed='tick']").click();
        await new Promise((r) => setTimeout(r, 40));
        document.querySelector("[data-ed='picker-done']").click();
      })()`);
      await sleep(240);
      await snap("a-one-item-add-split.png");
      await cdp.eval(`(async () => {
        document.querySelector(".ed-add-split").click();
        await new Promise((r) => setTimeout(r, 120));
        const second = [...document.querySelectorAll(".ed-picker [data-ed='tick']")].find((t) => t.getAttribute("aria-checked") !== "true");
        second.click();
        await new Promise((r) => setTimeout(r, 40));
        document.querySelector("[data-ed='picker-done']").click();
        await new Promise((r) => setTimeout(r, 160));
        const inputs = [...document.querySelectorAll(".ed-row-amt")];
        ["1000", "1000"].forEach((digits, i) => {
          inputs[i].value = digits;
          inputs[i].dispatchEvent(new Event("input", { bubbles: true }));
        });
      })()`);
      await sleep(200);
      await snap("b-two-item-add-split.png");
      await closeEd();
    }

    out.monthBase = await cdp.eval(`(() => {
      const food = { id: "food", name: "Food", lines: [{ id: "g", name: "Groceries", assigned: 500 }] };
      const rec = (year, month, income) => ({
        year: year, month: month,
        incomes: [{ id: "pay", name: "Paycheck", amount: income }],
        categories: [food],
        transactions: []
      });
      const deductions = [{ name: "Insurance", amount: 100, preTax: true }];
      const stub = (date, gross) => [{ payStubConfirmed: true, payStubPending: {
        payDate: date, gross: gross, net: 5000, employee401k: 500, hsa: 200, otherDeductions: deductions
      } }];
      const slice = (pic, label) => {
        const s = (pic.alloc.slices || []).find((x) => x.label === label);
        return s ? s.amount : 0;
      };
      const typed = {
        trueManual: true, baseSalary: 120000, paychecksPerYear: 12, zipCode: "80202", filingStatus: "single",
        bonusMonth: 2, employer401kMatch: 0, employer401kBase: 0, employer401kMatchIsPercent: false, employer401kBaseIsPercent: false,
        compRows: [
          { id: "bonus", kind: "bonus", name: "Bonus", method: "percent", value: 10, when: "yearly", on: true },
          { id: "var", kind: "other", name: "Variable comp", method: "fixed", value: 6000, when: "yearly", on: true }
        ],
        preTax: [], postTax: [], trueLines: []
      };
      const budget = PaperTrailPreview.allocationProbe({
        year: 2026, month: 11, rec: rec(2026, 11, 5000), payFrequency: "monthly",
        compensation: { trueManual: false, baseSalary: 0 }
      });
      const key = PaperTrailPreview.allocationProbe({
        year: 2026, month: 11, rec: rec(2026, 11, 5000), payFrequency: "monthly",
        compensation: { trueManual: false, baseSalary: 0, paychecksPerYear: 12 },
        documents: stub("2026-11-15", 5800)
      });
      const nov = PaperTrailPreview.allocationProbe({
        year: 2026, month: 11, rec: rec(2026, 11, 5000), payFrequency: "monthly", compensation: typed
      });
      const bonus = PaperTrailPreview.allocationProbe({
        year: 2026, month: 2, rec: rec(2026, 2, 5000), payFrequency: "monthly", compensation: typed
      });
      const three = PaperTrailPreview.allocationProbe({
        year: 2026, month: 1, rec: rec(2026, 1, 5000), payFrequency: "biweekly",
        compensation: { trueManual: false, baseSalary: 0, paychecksPerYear: 26 },
        documents: stub("2026-01-01", 3000)
      });
      const guard = PaperTrailPreview.allocationProbe({
        year: 2026, month: 11, rec: rec(2026, 11, 8000), payFrequency: "monthly",
        compensation: { trueManual: false, baseSalary: 0, paychecksPerYear: 12 },
        documents: stub("2026-11-15", 8000)
      });
      const leftAmt = (slices) => {
        const row = (slices || []).find((x) => x.label === "Left to budget");
        const old = (slices || []).find((x) => x.label === "Unallocated");
        return { amount: row ? row.amount : 0, shown: !!row, old: !!old };
      };
      const full = {
        year: 2026, month: 11,
        incomes: [{ id: "pay", name: "Paycheck", amount: 5000 }],
        categories: [{ id: "food", name: "Food", lines: [{ id: "g", name: "Groceries", assigned: 5000 }] }],
        transactions: []
      };
      const filled = PaperTrailPreview.allocationProbe({
        year: 2026, month: 11, rec: full, payFrequency: "monthly",
        compensation: { trueManual: false, baseSalary: 0, paychecksPerYear: 12 },
        documents: stub("2026-11-15", 5800)
      });
      const pack = (pic) => ({
        source: pic.alloc.source, divisor: pic.alloc.divisor, same: pic.same, warn: !!pic.alloc.incomeWarn,
        savings: pic.alloc.savings, other: slice(pic, "Other payroll deductions"), taxes: slice(pic, "Taxes"),
        food: slice(pic, "Food"), checks: pic.alloc.paychecks, of: pic.alloc.of,
        left: leftAmt(pic.alloc.slices), yearLeft: leftAmt(pic.year && pic.year.slices)
      });
      return { budget: pack(budget), key: pack(key), typedNov: pack(nov), typedFeb: pack(bonus), three: pack(three), guard: pack(guard), filled: pack(filled) };
    })()`);
    const mb = out.monthBase;
    const taxRow = (row) => row && (row.taxes > 0 || row.other > 0);
    if (!mb || mb.budget.divisor !== 5000 || !mb.budget.same || taxRow(mb.budget) || mb.budget.warn) fail.push("budget month " + JSON.stringify(mb && mb.budget));
    if (!mb || mb.key.divisor !== 5800 || !mb.key.same || mb.key.savings !== 700 || mb.key.other !== 100 || mb.key.food !== 500 || mb.key.warn || mb.key.of.indexOf("paycheck") < 0 || !mb.key.left.shown || mb.key.left.amount !== 4500 || mb.key.left.old || !mb.key.yearLeft.shown || mb.key.yearLeft.amount !== 4500 || mb.key.yearLeft.old) fail.push("stub extras " + JSON.stringify(mb && mb.key));
    if (!mb || mb.filled.divisor !== 5800 || mb.filled.left.shown || mb.filled.left.old || mb.filled.yearLeft.shown || mb.filled.yearLeft.old) fail.push("left to budget hidden at zero " + JSON.stringify(mb && mb.filled));
    if (!mb || mb.typedNov.divisor !== 5000 || !mb.typedNov.same) fail.push("typed non-bonus " + JSON.stringify(mb && mb.typedNov));
    if (!mb || mb.typedFeb.divisor !== 17000 || !mb.typedFeb.same) fail.push("typed bonus month " + JSON.stringify(mb && mb.typedFeb));
    if (!mb || mb.three.divisor !== 7400 || mb.three.savings !== 2100 || mb.three.other !== 300 || mb.three.checks !== 3 || mb.three.warn) fail.push("three paychecks " + JSON.stringify(mb && mb.three));
    if (!mb || mb.guard.divisor !== 8800 || !mb.guard.warn || mb.guard.savings !== 700 || mb.guard.other !== 100) fail.push("double-count guard " + JSON.stringify(mb && mb.guard));
    if (SHOTS) {
      await cdp.eval(`PaperTrailPreview.paintExample(${JSON.stringify({
        year: 2026, month: 11, payFrequency: "monthly",
        compensation: { trueManual: false, baseSalary: 0, paychecksPerYear: 12 },
        documents: [{ payStubConfirmed: true, payStubPending: {
          payDate: "2026-11-15", gross: 5800, net: 5000, employee401k: 500, hsa: 200,
          otherDeductions: [{ name: "Insurance", amount: 100, preTax: true }]
        } }],
        rec: {
          year: 2026, month: 11,
          incomes: [{ id: "pay", name: "Paycheck", amount: 5000 }],
          categories: [{ id: "food", name: "Food", lines: [{ id: "g", name: "Groceries", assigned: 500 }] }],
          transactions: []
        }
      })})`);
      await sleep(500);
      await cdp.eval(`(() => {
        const sec = document.getElementById("dash-spendcat");
        const btn = sec && sec.querySelector("[data-dash='fold']");
        if (btn && sec.classList.contains("dash-folded")) btn.click();
        if (sec) sec.scrollIntoView({ block: "center" });
      })()`);
      await sleep(200);
      await snap("spend-by-category.png");
      await cdp.eval(`(() => {
        const sec = document.getElementById("dash-sav");
        if (sec) sec.scrollIntoView({ block: "start" });
      })()`);
      await sleep(200);
      await snap("savings-rate.png");
      const exampleCaption = await cdp.eval(`(() => {
        const sec = document.getElementById("dash-spendcat");
        return sec ? sec.innerText : "";
      })()`);
      out.exampleCaption = !!(exampleCaption && exampleCaption.indexOf("planned income + paycheck deductions") >= 0 && exampleCaption.indexOf("$5,800") >= 0 && exampleCaption.indexOf("may already include") < 0);
      if (!out.exampleCaption) fail.push("example caption " + exampleCaption);
    }

    async function sheetStable(height, keyboard, shotName) {
      await cdp.send("Emulation.setDeviceMetricsOverride", { width: 390, height: height, deviceScaleFactor: 1, mobile: true });
      await cdp.send("Page.navigate", { url: BASE.replace(/\/$/, "") + "/index.html?nosplash=1" });
      await sleep(1500);
      await cdp.eval(`document.querySelector(".bar-add-tx").click()`);
      await sleep(300);
      const info = await cdp.eval(`(async () => {
        const vis = ${keyboard};
        const fake = { height: vis, width: 390, offsetTop: 0, offsetLeft: 0, scale: 1, pageTop: 0, pageLeft: 0, addEventListener() {}, removeEventListener() {} };
        try { Object.defineProperty(window, "visualViewport", { configurable: true, get() { return fake; } }); } catch (e) {}
        const date = () => document.querySelector('[data-ed-in="date"]').closest(".ed-row").getBoundingClientRect();
        const pay = document.querySelector('[data-ed-in="payee"]');
        const box = () => ({ date: date().top, pay: pay.getBoundingClientRect().top, sheet: document.querySelector("form.sheet.ed-add").getBoundingClientRect().top });
        pay.focus();
        pay.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
        await new Promise((r) => setTimeout(r, 80));
        pay.blur();
        await new Promise((r) => setTimeout(r, 80));
        const before = box();
        try { pay.focus({ preventScroll: true }); } catch (e) { pay.focus(); }
        pay.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
        await new Promise((r) => setTimeout(r, 180));
        const mid = box();
        pay.value = "Tr";
        pay.dispatchEvent(new Event("input", { bubbles: true }));
        await new Promise((r) => setTimeout(r, 80));
        const d = date();
        const sh = document.querySelector("form.sheet.ed-add").getBoundingClientRect();
        const item = document.querySelector(".ed-items, .ed-budget-card").getBoundingClientRect();
        const after = box();
        return {
          before, mid, after,
          dateTop: Math.round(d.top), dateBottom: Math.round(d.bottom),
          sheetTop: Math.round(sh.top), sheetBottom: Math.round(sh.bottom),
          itemTop: Math.round(item.top), itemBottom: Math.round(item.bottom),
          vis,
          dateVisible: d.top >= sh.top - 1 && d.bottom <= Math.min(sh.bottom, vis) + 1,
          itemVisible: item.top >= sh.top - 1 && item.bottom <= Math.min(sh.bottom, vis) + 1,
          still: Math.abs(before.date - mid.date) <= 1 && Math.abs(mid.date - after.date) <= 1 && Math.abs(before.sheet - after.sheet) <= 1 && Math.abs(before.pay - after.pay) <= 1
        };
      })()`);
      if (shotName) await snap(shotName);
      return info;
    }
    out.stable844 = await sheetStable(844, 508, SHOTS ? "add-keyboard-390x844.png" : "");
    out.stable667 = await sheetStable(667, 336, SHOTS ? "add-keyboard-390x667.png" : "");
    if (!out.stable844 || !out.stable844.dateVisible || !out.stable844.itemVisible || !out.stable844.still) fail.push("sheet moved at 844 " + JSON.stringify(out.stable844));
    if (!out.stable667 || !out.stable667.dateVisible || !out.stable667.itemVisible || !out.stable667.still) fail.push("sheet moved at 667 " + JSON.stringify(out.stable667));
    await cdp.eval(`document.querySelector('[data-ed="picker"]').click()`);
    await sleep(200);
    out.longNames = await cdp.eval(`(() => {
      const rows = [...document.querySelectorAll(".ed-picker .ed-item-row")];
      const find = (name) => rows.find((r) => ((r.querySelector(".ed-item-label") || {}).textContent || "") === name);
      const pack = (name) => {
        const row = find(name);
        if (!row) return null;
        const label = row.querySelector(".ed-item-label");
        const rem = row.querySelector(".ed-rem");
        const tick = row.querySelector(".ed-tick");
        const ls = getComputedStyle(label);
        return {
          text: label.textContent,
          cut: ls.textOverflow,
          wrap: ls.whiteSpace,
          full: label.scrollHeight <= label.clientHeight + 1 || ls.whiteSpace !== "nowrap",
          rem: rem.textContent.trim(),
          rust: rem.classList.contains("rust"),
          color: getComputedStyle(rem).color,
          remUnder: rem.getBoundingClientRect().top >= label.getBoundingClientRect().bottom - 2,
          tickRight: tick.getBoundingClientRect().left >= label.getBoundingClientRect().right - 2
        };
      };
      return { fun: pack("Fun Money"), fund: pack("Emergency Fund") };
    })()`);
    if (SHOTS) {
      await cdp.send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
      await sleep(200);
      await cdp.eval(`(() => {
        const row = [...document.querySelectorAll(".ed-picker .ed-item-row")].find((r) => ((r.querySelector(".ed-item-label") || {}).textContent || "") === "Emergency Fund");
        if (row) row.scrollIntoView({ block: "center" });
      })()`);
      await sleep(100);
      await snap("picker-long-names.png");
    }
    if (!out.longNames || !out.longNames.fun || !out.longNames.fund || out.longNames.fun.cut === "ellipsis" || out.longNames.fund.cut === "ellipsis" || out.longNames.fun.wrap === "nowrap" || !out.longNames.fun.remUnder || !out.longNames.fund.remUnder || !out.longNames.fun.tickRight || !out.longNames.fund.rust || out.longNames.fund.color === out.longNames.fun.color) fail.push("long picker names " + JSON.stringify(out.longNames));

    await cdp.send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await cdp.send("Page.navigate", { url: BASE.replace(/\/$/, "") + "/index.html?nosplash=1" });
    await sleep(1500);
    await cdp.eval(`document.querySelector(".bar-add-tx").click()`);
    await sleep(300);
    if (SHOTS) await snap("add-close-844.png");
    const rowTops = () => cdp.eval(`(() => {
      const row = (sel) => { const el = document.querySelector(sel); const r = el.getBoundingClientRect(); return Math.round(r.top); };
      return {
        date: row('[data-ed-in="date"]'),
        amount: row(".ed-amt"),
        merchant: row('[data-ed-in="payee"]'),
        item: row(".ed-itemsec")
      };
    })()`);
    const sameTops = (a, b) => a && b && ["date", "amount", "merchant", "item"].every((k) => Math.abs(a[k] - b[k]) <= 1);
    await cdp.eval(`["2","0","0","0"].forEach((k) => document.querySelector('[data-ed="key"][data-k="' + k + '"]').click())`);
    await sleep(40);
    const amountBefore = await rowTops();
    if (SHOTS) await snap("finish-amount-before.png");
    await cdp.eval(`document.querySelector('[data-ed="next"]').click()`);
    await sleep(320);
    const amountAfter = await rowTops();
    if (SHOTS) await snap("finish-amount-after.png");
    await cdp.eval(`(() => {
      const pay = document.querySelector('[data-ed-in="payee"]');
      pay.focus();
      pay.value = "Tr";
      pay.dispatchEvent(new Event("input", { bubbles: true }));
    })()`);
    await sleep(80);
    const merchantBefore = await rowTops();
    if (SHOTS) await snap("finish-merchant-before.png");
    await cdp.eval(`(() => {
      const pay = document.querySelector('[data-ed-in="payee"]');
      pay.value = "Trader Joe's";
      pay.dispatchEvent(new Event("input", { bubbles: true }));
      pay.blur();
    })()`);
    await sleep(80);
    const merchantAfter = await rowTops();
    if (SHOTS) await snap("finish-merchant-after.png");
    const pickerBefore = await rowTops();
    if (SHOTS) await snap("finish-picker-before.png");
    await cdp.eval(`document.querySelector('[data-ed="picker"]').click()`);
    await sleep(80);
    await cdp.eval(`document.querySelector(".ed-picker [data-ed='tick']").click()`);
    await sleep(40);
    await cdp.eval(`document.querySelector("[data-ed='picker-done']").click()`);
    await sleep(280);
    const pickerAfter = await rowTops();
    if (SHOTS) await snap("finish-picker-after.png");
    out.finish = { amountBefore, amountAfter, merchantBefore, merchantAfter, pickerBefore, pickerAfter };
    if (!sameTops(amountBefore, amountAfter)) fail.push("amount finish moved " + JSON.stringify(out.finish));
    if (!sameTops(merchantBefore, merchantAfter)) fail.push("merchant finish moved " + JSON.stringify(out.finish));
    if (!sameTops(pickerBefore, pickerAfter)) fail.push("picker finish moved " + JSON.stringify(out.finish));
    out.discard = await cdp.eval(`(async () => {
      const pay = document.querySelector('[data-ed-in="payee"]');
      pay.value = "Temp merchant";
      pay.dispatchEvent(new Event("input", { bubbles: true }));
      document.querySelector(".ed-close").click();
      await new Promise((r) => setTimeout(r, 250));
      const gone = document.getElementById("modal").hidden;
      document.querySelector(".bar-add-tx").click();
      await new Promise((r) => setTimeout(r, 250));
      const fresh = document.querySelector('[data-ed-in="payee"]').value;
      document.querySelector(".ed-close").click();
      await new Promise((r) => setTimeout(r, 220));
      document.querySelector('[data-tab="spend"]').click();
      await new Promise((r) => setTimeout(r, 200));
      document.querySelector('[data-act="edit-spend"][data-id="t1"]').click();
      await new Promise((r) => setTimeout(r, 250));
      const orig = document.querySelector('[data-ed-in="payee"]').value;
      document.querySelector('[data-ed-in="payee"]').value = "Changed";
      document.querySelector('[data-ed-in="payee"]').dispatchEvent(new Event("input", { bubbles: true }));
      document.querySelector(".ed-close").click();
      await new Promise((r) => setTimeout(r, 220));
      document.querySelector('[data-act="edit-spend"][data-id="t1"]').click();
      await new Promise((r) => setTimeout(r, 250));
      const kept = document.querySelector('[data-ed-in="payee"]').value;
      return { gone, fresh, orig, kept };
    })()`);
    if (SHOTS) await snap("edit-close-844.png");
    if (!out.discard || !out.discard.gone || out.discard.fresh !== "" || out.discard.kept !== out.discard.orig) fail.push("discard close " + JSON.stringify(out.discard));

    await cdp.send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await cdp.eval(`(() => { const m = document.getElementById("modal"); if (m) { m.hidden = true; m.innerHTML = ""; } document.body.classList.remove("ed-add-open", "tx-editor-open", "ed-typing"); document.querySelector('[data-tab="budget"]').click(); })()`);
    await sleep(300);
    async function openLine(name) {
      return cdp.eval(`(async () => {
        const btn = [...document.querySelectorAll(".line-name")].find((b) => b.textContent.trim() === ${JSON.stringify(name)});
        if (!btn) return { missing: true };
        btn.click();
        await new Promise((r) => setTimeout(r, 250));
        const head = document.querySelector(".sheet-month-head");
        const amt = document.querySelector(".sheet-month-spent");
        const txs = [...document.querySelectorAll(".sheet-tx .mono")].map((el) => el.textContent.trim());
        const title = (document.querySelector("#modal h3") || {}).textContent || "";
        const box = head ? head.getBoundingClientRect() : null;
        const a = amt ? amt.getBoundingClientRect() : null;
        return {
          title: title.trim(),
          spent: amt ? amt.textContent.trim() : "",
          txs,
          sameLine: !!(box && a && Math.abs(a.top - box.top) < 4 && a.right <= box.right + 1),
          label: head ? head.textContent.replace(amt ? amt.textContent : "", "").trim() : ""
        };
      })()`);
    }
    out.lineFood = await openLine("Groceries");
    if (SHOTS) await snap("line-spent-groceries.png");
    await cdp.eval(`document.querySelector('[data-act="close-modal"]').click()`);
    await sleep(200);
    out.lineHome = await openLine("Rent");
    if (SHOTS) await snap("line-spent-rent.png");
    function spentOk(row) {
      if (!row || row.missing || !row.spent || !row.sameLine) return false;
      if (!/^\$/.test(row.spent)) return false;
      const nums = row.txs.map((t) => Number(String(t).replace(/[^0-9.-]/g, "")));
      const sum = Math.round(nums.reduce((n, v) => n + v, 0) * 100) / 100;
      const shown = Number(String(row.spent).replace(/[^0-9.-]/g, ""));
      return Math.abs(sum - shown) < 0.001;
    }
    if (!spentOk(out.lineFood) || !/Groceries/.test(out.lineFood.title)) fail.push("food spent " + JSON.stringify(out.lineFood));
    if (!spentOk(out.lineHome) || !/Rent/.test(out.lineHome.title)) fail.push("rent spent " + JSON.stringify(out.lineHome));

    await cdp.eval(`(() => { const m = document.getElementById("modal"); if (m) { m.hidden = true; m.innerHTML = ""; } document.body.classList.remove("ed-add-open", "tx-editor-open", "ed-typing"); })()`);
    await sleep(80);
    await cdp.eval(`document.querySelector(".bar-add-tx").click()`);
    await sleep(250);
    const tops = () => cdp.eval(`(() => {
      const t = (sel) => Math.round(document.querySelector(sel).getBoundingClientRect().top);
      return { date: t('[data-ed-in="date"]'), amount: t(".ed-amt"), merchant: t('[data-ed-in="payee"]'), item: t(".ed-itemsec") };
    })()`);
    await cdp.eval(`["2","0","0","0"].forEach((k) => document.querySelector('[data-ed="key"][data-k="' + k + '"]').click())`);
    await sleep(40);
    await cdp.eval(`document.querySelector('[data-ed="next"]').click()`);
    await sleep(200);
    const beforeAuto = await tops();
    await cdp.eval(`(() => {
      const pay = document.querySelector('[data-ed-in="payee"]');
      pay.value = "Solo Mart";
      pay.dispatchEvent(new Event("input", { bubbles: true }));
      pay.blur();
    })()`);
    await sleep(80);
    out.autoSingle = await cdp.eval(`(() => {
      const sh = document.querySelector("form.sheet.ed-add");
      return { item: (sh.querySelector(".ed-split-name") || {}).textContent || "", choose: (sh.querySelector(".ed-items-name") || {}).textContent.trim() };
    })()`);
    const afterAuto = await tops();
    if (SHOTS) await snap("auto-filled.png");
    out.autoStill = { before: beforeAuto, after: afterAuto };
    if (SHOTS) await snap("auto-stable.png");
    const still = beforeAuto && afterAuto && ["date", "amount", "merchant", "item"].every((k) => Math.abs(beforeAuto[k] - afterAuto[k]) <= 1);
    if (!out.autoSingle || out.autoSingle.item.trim() !== "Groceries" || !still) fail.push("single auto " + JSON.stringify({ auto: out.autoSingle, still: out.autoStill }));
    await cdp.eval(`document.querySelector(".ed-close").click()`);
    await sleep(220);
    await cdp.eval(`document.querySelector(".bar-add-tx").click()`);
    await sleep(250);
    await cdp.eval(`(() => {
      const pay = document.querySelector('[data-ed-in="payee"]');
      pay.value = "Mixed Mart";
      pay.dispatchEvent(new Event("input", { bubbles: true }));
      pay.blur();
    })()`);
    await sleep(80);
    await cdp.eval(`document.querySelector('[data-ed="picker"]').click()`);
    await sleep(120);
    out.autoMixed = await cdp.eval(`(() => {
      const first = document.querySelector(".ed-picker .ed-item-row");
      return {
        choose: (document.querySelector(".ed-items-name") || {}).textContent.trim(),
        card: !!document.querySelector(".ed-budget-card"),
        name: (first && first.querySelector(".ed-item-label") || {}).textContent || "",
        tag: (first && first.querySelector(".ed-last-used") || {}).textContent || ""
      };
    })()`);
    if (SHOTS) await snap("auto-mixed.png");
    if (!out.autoMixed || out.autoMixed.choose !== "Choose budget item" || out.autoMixed.card || out.autoMixed.name !== "Restaurants" || out.autoMixed.tag !== "Last used") fail.push("mixed merchant " + JSON.stringify(out.autoMixed));
    await cdp.eval(`document.querySelector("[data-ed='picker-done']").click()`);
    await sleep(80);
    await cdp.eval(`document.querySelector(".ed-close").click()`);
    await sleep(220);
    await cdp.eval(`document.querySelector(".bar-add-tx").click()`);
    await sleep(250);
    await cdp.eval(`document.querySelector('[data-ed="picker"]').click()`);
    await sleep(80);
    await cdp.eval(`(() => { const row = [...document.querySelectorAll(".ed-picker .ed-item-row")].find((r) => ((r.querySelector(".ed-item-label") || {}).textContent || "") === "Rent"); row.querySelector("[data-ed='tick']").click(); })()`);
    await sleep(40);
    await cdp.eval(`document.querySelector("[data-ed='picker-done']").click()`);
    await sleep(80);
    await cdp.eval(`(() => {
      const pay = document.querySelector('[data-ed-in="payee"]');
      pay.value = "Trader Joe's";
      pay.dispatchEvent(new Event("input", { bubbles: true }));
      pay.blur();
    })()`);
    await sleep(80);
    out.autoKeep = await cdp.eval(`(() => (document.querySelector(".ed-split-name") || {}).textContent || "")()`);
    if (!out.autoKeep || String(out.autoKeep).trim() !== "Rent") fail.push("kept user pick " + JSON.stringify(out.autoKeep));

    await cdp.send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await cdp.eval(`(() => { const m = document.getElementById("modal"); if (m) { m.hidden = true; m.innerHTML = ""; } document.body.classList.remove("ed-add-open", "tx-editor-open", "ed-typing"); document.querySelector('[data-tab="budget"]').click(); })()`);
    await sleep(250);
    await cdp.eval(`document.querySelector(".sav-pay-link").click()`);
    await sleep(200);
    await cdp.eval(`document.querySelector('[data-act="it-true-manual"]').click()`);
    await sleep(250);
    function segBox() {
      return cdp.eval(`(() => {
        function box(el) {
          if (!el) return null;
          const t = el.getBoundingClientRect();
          const cs = getComputedStyle(el);
          const border = parseFloat(cs.borderTopWidth) || 0;
          const pad = parseFloat(cs.paddingTop) || 0;
          const radius = parseFloat(cs.borderRadius) || 0;
          const btns = [...el.querySelectorAll("button")];
          const rs = btns.map((b) => b.getBoundingClientRect());
          const bcs = btns.map((b) => getComputedStyle(b));
          const inset = rs.length ? {
            l: rs[0].left - t.left - border,
            r: t.right - rs[rs.length - 1].right - border,
            t: rs[0].top - t.top - border,
            b: t.bottom - rs[0].bottom - border
          } : null;
          const input = el.closest(".it-amt-row") && el.closest(".it-amt-row").querySelector('input[type="text"]');
          const ir = input ? input.getBoundingClientRect() : null;
          return {
            h: Math.round(t.height * 10) / 10,
            inputH: ir ? Math.round(ir.height * 10) / 10 : null,
            w: Math.round(t.width * 10) / 10,
            radius,
            pad,
            border,
            inner: bcs.length ? parseFloat(bcs[0].borderRadius) : null,
            btnBorder: bcs.length ? parseFloat(bcs[0].borderTopWidth) : null,
            inset,
            widths: rs.map((r) => Math.round(r.width * 10) / 10),
            labels: btns.map((b) => b.textContent),
            clipped: btns.some((b) => b.scrollWidth > b.clientWidth + 1),
            on: (btns.find((b) => b.classList.contains("on")) || {}).textContent || ""
          };
        }
        const unit = document.querySelector(".it-amt-row .it-unit-toggle");
        const tax = document.querySelector(".gp-tax .it-unit-toggle");
        const row = document.querySelector(".it-amt-row");
        const tops = (sel) => { const el = document.querySelector(sel); return el ? Math.round(el.getBoundingClientRect().top) : null; };
        return {
          step: (document.querySelector(".gp-step") || {}).textContent || "",
          unit: box(unit),
          tax: box(tax),
          rowW: row ? Math.round(row.getBoundingClientRect().width * 10) / 10 : null,
          help: (document.querySelector(".gp-tax-help") || {}).textContent || "",
          label: (document.querySelector(".gp-tax-label") || {}).textContent || "",
          tops: {
            step: tops(".gp-step"),
            account: tops("select"),
            amt: tops(".it-amt-row input"),
            unit: tops(".it-amt-row .it-unit-toggle"),
            tax: tops(".gp-tax .it-unit-toggle"),
            help: tops(".gp-tax-help"),
            check: tops(".gp-check"),
            next: tops("[data-act='gp-next']")
          }
        };
      })()`);
    }
    function insetOk(seg) {
      if (!seg || !seg.inset) return false;
      const n = seg.pad;
      return ["l", "r", "t", "b"].every((k) => Math.abs(seg.inset[k] - n) <= 1);
    }
    function radiusOk(seg) {
      if (!seg) return false;
      return Math.abs(seg.inner - (seg.radius - seg.pad - seg.border)) <= 0.6 && seg.btnBorder === 0;
    }
    out.payIncome = await segBox();
    const inc = out.payIncome && out.payIncome.unit;
    if (!inc || inc.inputH == null || Math.abs(inc.h - inc.inputH) > 1 || !insetOk(inc) || !radiusOk(inc) || inc.clipped || inc.on !== "$ a year") fail.push("income unit toggle " + JSON.stringify(inc));
    await cdp.eval(`(() => { const s = document.querySelector('[name="salary"]'); s.value = "90000"; })()`);
    await cdp.eval(`document.querySelector('[data-act="gp-next"]').click()`);
    await sleep(200);
    out.payPre = await segBox();
    if (SHOTS) await snap("pay-pretax.png");
    const pre = out.payPre;
    const tax = pre && pre.tax;
    const unit = pre && pre.unit;
    const halves = tax && tax.widths.length === 2 && Math.abs(tax.widths[0] - tax.widths[1]) <= 1;
    const full = tax && pre.rowW && Math.abs(tax.w - pre.rowW) <= 2;
    if (!pre || !/Retirement/.test(pre.step) || pre.label !== "Tax treatment" || pre.help !== "Comes out before taxes, lowers taxable pay." || !unit || Math.abs(unit.h - unit.inputH) > 1 || !insetOk(unit) || !radiusOk(unit) || unit.clipped || (unit.labels || []).join("|") !== "$ a year|% of yearly gross" || unit.on !== "$ a year" || !tax || tax.clipped || !halves || !full || !insetOk(tax) || !radiusOk(tax) || tax.on !== "Pre-tax") fail.push("retirement pretax " + JSON.stringify(pre));
    const beforeToggle = pre.tops;
    await cdp.eval(`document.querySelector('.gp-tax [data-tax="post"]').click()`);
    await sleep(60);
    out.payPost = await segBox();
    if (SHOTS) await snap("pay-aftertax.png");
    const moved = beforeToggle && out.payPost && out.payPost.tops && Object.keys(beforeToggle).filter((k) => beforeToggle[k] != null && Math.abs(beforeToggle[k] - out.payPost.tops[k]) > 1);
    if (!out.payPost || out.payPost.help !== "Comes out after taxes (Roth-style)." || out.payPost.tax.on !== "After-tax" || (moved && moved.length)) fail.push("after-tax toggle " + JSON.stringify({ help: out.payPost && out.payPost.help, on: out.payPost && out.payPost.tax && out.payPost.tax.on, moved, before: beforeToggle, after: out.payPost && out.payPost.tops }));
    await cdp.eval(`(() => { const s = document.querySelector('select[name="retType0"]'); s.value = "hsa"; s.dispatchEvent(new Event("change", { bubbles: true })); })()`);
    await sleep(200);
    out.payHsa = await segBox();
    if (SHOTS) await snap("pay-hsa.png");
    const hsa = out.payHsa;
    const hsaName = await cdp.eval(`(document.querySelector('select[name="retType0"]') || {}).value || ""`);
    if (hsaName !== "hsa" || !hsa || !hsa.unit || Math.abs(hsa.unit.h - hsa.unit.inputH) > 1 || !insetOk(hsa.unit) || !radiusOk(hsa.unit) || hsa.unit.clipped || hsa.unit.on !== "$ a year" || hsa.tax.on !== "Pre-tax") fail.push("hsa toggle " + JSON.stringify({ hsaName, hsa }));

    out.quarterMath = await cdp.eval(`(() => {
      const t = PaperTrailPreview.seasonFxTiming();
      const p = (ms) => PaperTrailPreview.seasonFxPhase(ms);
      const list = PaperTrailPreview.quarterList();
      return { t, p0: p(0), p4: p(4000), p20: p(20000), p36: p(36000), p40: p(40000), list };
    })()`);
    const qm = out.quarterMath;
    const lastQ = qm && qm.list && qm.list[qm.list.length - 1];
    if (!qm || qm.t.normalMs !== 5000 || qm.t.slowMs !== 30000 || qm.p0.rate !== 1 || qm.p4.rate !== 1 || Math.abs(qm.p20.rate - qm.t.slowRate) > 0.02 || qm.p20.fade || !qm.p40.dead || !lastQ || lastQ.year !== 2026 || lastQ.q !== 3) fail.push("quarter or fall timing " + JSON.stringify(qm));

    await cdp.send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await cdp.eval(`(() => { const x = document.querySelector(".gp-sheet .sheet-x"); if (x) x.click(); })()`);
    await sleep(300);
    await cdp.eval(`document.querySelector('[data-act="bar-menu"]').click()`);
    await sleep(80);
    await cdp.eval(`document.querySelector('[data-act="set-theme"][data-theme="dark"]').click()`);
    await sleep(200);
    await cdp.eval(`document.querySelector('[data-tab="stats"]').click()`);
    await sleep(350);
    await cdp.eval(`document.querySelector('[data-act="stats-door"][data-door="review"]').click()`);
    await sleep(300);
    out.q3entry = await cdp.eval(`(() => {
      const row = document.querySelector('[data-act="open-quarter"]');
      return { text: row ? row.textContent.replace(/\\s+/g, " ").trim() : "", night: document.body.classList.contains("night") };
    })()`);
    if (SHOTS) await snap("q3-entry.png");
    if (!out.q3entry || out.q3entry.text.indexOf("Q3 2026") < 0 || !out.q3entry.night) fail.push("q3 entry " + JSON.stringify(out.q3entry));
    await cdp.eval(`document.querySelector('[data-act="open-quarter"]').click()`);
    await sleep(300);
    for (let i = 0; i < 8 && !(await cdp.eval(`!!document.querySelector(".fridge-card")`)); i++) {
      await cdp.eval(`(() => { var n = document.querySelector('[data-act="wrap-next"]'); if (n) n.click(); })()`);
      await sleep(180);
    }
    out.q3card = await cdp.eval(`(() => {
      const card = document.querySelector(".fridge-card");
      return { period: card ? (card.querySelector(".fc-period") || {}).textContent : "", label: card ? card.getAttribute("aria-label") : "", night: document.body.classList.contains("night") };
    })()`);
    if (SHOTS) await snap("q3-fridge.png");
    if (!out.q3card || out.q3card.period !== "Q3 2026" || !out.q3card.night) fail.push("q3 fridge " + JSON.stringify(out.q3card));

    await cdp.eval(`document.querySelector('[data-act="close-modal"]').click()`);
    await sleep(250);
    await cdp.eval(`document.querySelector('[data-tab="budget"]').click()`);
    await sleep(200);
    await cdp.eval(`document.querySelector('[data-act="bar-menu"]').click()`);
    await sleep(80);
    const fxStart = Date.now();
    await cdp.eval(`document.querySelector('[data-act="set-theme"][data-theme="seasonal"]').click()`);
    await sleep(700);
    async function fxNow() {
      return cdp.eval(`(() => {
        const fx = document.getElementById("season-fx");
        const p = document.querySelector(".season-fx-p");
        const cs = p ? getComputedStyle(p) : null;
        return {
          kind: fx ? fx.getAttribute("data-kind") : "",
          n: document.querySelectorAll(".season-fx-p").length,
          seen: fx ? Number(fx.getAttribute("data-fx-seen")) : null,
          rate: fx ? Number(fx.getAttribute("data-fx-rate")) : null,
          dead: fx ? fx.classList.contains("fx-dead") : null,
          anim: cs ? cs.animationName : "",
          play: p && p.getAnimations ? ((p.getAnimations()[0] || {}).playbackRate) : null
        };
      })()`);
    }
    out.fxEarly = await fxNow();
    if (SHOTS) await snap("fx-0to5.png");
    const seenBeforeTab = out.fxEarly && out.fxEarly.seen;
    await cdp.eval(`document.querySelector('[data-tab="spend"]').click()`);
    await sleep(250);
    await cdp.eval(`document.querySelector('[data-tab="budget"]').click()`);
    await sleep(400);
    out.fxAfterTab = await fxNow();
    if (!out.fxEarly || out.fxEarly.kind !== "leaves" || out.fxEarly.n < 8 || !(out.fxEarly.rate > 0.9) || out.fxEarly.dead || !out.fxAfterTab || out.fxAfterTab.kind !== "leaves" || out.fxAfterTab.seen < seenBeforeTab || out.fxAfterTab.n !== out.fxEarly.n) fail.push("fall start " + JSON.stringify({ early: out.fxEarly, tab: out.fxAfterTab }));
    const wait20 = 20000 - (Date.now() - fxStart);
    if (wait20 > 0) await sleep(wait20);
    out.fxSlow = await fxNow();
    if (SHOTS) await snap("fx-20s.png");
    if (!out.fxSlow || out.fxSlow.dead || !(out.fxSlow.rate < 0.45) || !(out.fxSlow.rate > 0.15) || out.fxSlow.anim === "none" || !(out.fxSlow.play < 0.45)) fail.push("fall slow " + JSON.stringify(out.fxSlow));
    const wait38 = 38500 - (Date.now() - fxStart);
    if (wait38 > 0) await sleep(wait38);
    out.fxStop = await fxNow();
    if (SHOTS) await snap("fx-stopped.png");
    if (!out.fxStop || !out.fxStop.dead || out.fxStop.rate !== 0 || out.fxStop.anim !== "none" || out.fxStop.play != null) fail.push("fall stopped " + JSON.stringify(out.fxStop));
    if (SHOTS) {
      try {
        const dir = path.join(SHOTS, "fx-seq");
        fs.mkdirSync(dir, { recursive: true });
        ["fx-0to5.png", "fx-20s.png", "fx-stopped.png"].forEach((name, i) => {
          fs.copyFileSync(path.join(SHOTS, name), path.join(dir, "f" + i + ".png"));
        });
        execFileSync("ffmpeg", ["-y", "-framerate", "1", "-i", path.join(dir, "f%d.png"),
          "-vf", "fps=1,scale=390:-1:flags=lanczos,split[s0][s1];[s0]palettegen=stats_mode=diff[p];[s1][p]paletteuse",
          path.join(SHOTS, "fx-fall.gif")], { stdio: "ignore" });
      } catch (e) { out.fxGifError = String(e && e.message || e); }
    }

    await cdp.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
    await cdp.send("Page.navigate", { url: BASE.replace(/\/$/, "") + "/index.html?nosplash=1" });
    await sleep(1500);
    await cdp.eval(`document.querySelector('[data-tab="budget"]').click()`);
    await sleep(200);
    await cdp.eval(`document.querySelector('[data-act="bar-menu"]').click()`);
    await sleep(80);
    await cdp.eval(`document.querySelector('[data-act="set-theme"][data-theme="seasonal"]').click()`);
    await sleep(400);
    out.fxReduce = await fxNow();
    if (!out.fxReduce || out.fxReduce.kind !== "leaves" || out.fxReduce.n < 8 || out.fxReduce.anim !== "none" || out.fxReduce.play != null) fail.push("reduced motion " + JSON.stringify(out.fxReduce));

    out.fail = fail;
    console.log(JSON.stringify(out, null, 2));
    process.exit(fail.length ? 1 : 0);
  } catch (e) {
    console.error(e && e.stack || e);
    process.exit(1);
  } finally {
    try { chrome.kill(); } catch (e) {}
  }
})();
