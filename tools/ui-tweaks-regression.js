#!/usr/bin/env node
/* Narrow checks for the sheet tweaks through 37.5.105. Synthetic demo numbers only.
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
        ]}
      ],
      transactions: [
        { id: "t1", payee: "Market", date: "2026-11-02", amount: 42.5, categoryId: "food", lineId: "groceries", note: "Weekly groceries" },
        { id: "t2", payee: "Cafe", date: "2026-11-03", amount: 6, categoryId: "food", lineId: "restaurants", note: "" }
      ]
    }},
    worth: { years: [y], notes: {}, lines: [
      { id: "w1", name: "Checking", kind: "asset", group: "cash", sortOrder: 0, amounts: { "2026": 8000 }, additions: { "2026": 0 } }
    ], income: {} }
  };
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
  return { app: a, sw: s, index: h, ok: a === "37.5.105" && a === s && h.length === 1 && h[0] === a };
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
        noteOpen: sh.querySelector(".ed-note").classList.contains("is-open"),
        note: noteIn.value,
        x: x ? x.getAttribute("aria-label") : "",
        xTop: x ? x.getAttribute("data-act") : "",
        save: save ? save.textContent.trim() : "",
        saveInFoot: !!(save && save.closest(".ed-actions")),
        close: !!sh.querySelector('[data-act="close-modal"]'),
        ph: noteIn.getAttribute("placeholder")
      };
    })()`);
    if (!out.edit || out.edit.error) fail.push("edit " + JSON.stringify(out.edit));
    else {
      if (!out.edit.itemAbove || out.edit.item !== "Groceries") fail.push("edit budget item " + JSON.stringify(out.edit));
      if (!out.edit.addSplit || out.edit.splitLink || !out.edit.minus || out.edit.mark !== "✕" || !/Remove /.test(out.edit.removeName) || out.edit.removeName === out.edit.x) fail.push("edit split chrome " + JSON.stringify(out.edit));
      if (!out.edit.noteOpen || out.edit.note !== "Weekly groceries") fail.push("edit note " + out.edit.note);
      if (out.edit.x !== "Delete transaction" || out.edit.save !== "Save" || !out.edit.saveInFoot || out.edit.close || out.edit.ph) fail.push("edit chrome " + JSON.stringify(out.edit));
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
      if (out.keyboard.maxStep > 90) fail.push("keyboard fit snapped " + out.keyboard.maxStep);
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
        remColor: getComputedStyle(document.querySelector(".ed-picker .ed-rem")).color,
        hintColor: getComputedStyle(document.querySelector(".ed-picker-hint")).color
      };
    })()`);
    await snap("08-budget-picker-checks.png");
    if (!out.splitPicker || out.splitPicker.n < 2 || !out.splitPicker.boxes || /split across/i.test(out.splitPicker.hint)) fail.push("picker checks " + JSON.stringify(out.splitPicker));
    if (!out.splitPicker || !(out.splitPicker.remPx >= 16) || Number(out.splitPicker.remWeight) < 600 || out.splitPicker.remColor === out.splitPicker.hintColor) fail.push("picker remaining type " + JSON.stringify(out.splitPicker));
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
      const block = sh.querySelector(".ed-itemsec").getBoundingClientRect();
      const note = sh.querySelector(".ed-note").getBoundingClientRect();
      return {
        lines: sh.querySelectorAll(".ed-split-line").length,
        name: (sh.querySelector(".ed-items-name") || {}).textContent.trim(),
        add: (sh.querySelector(".ed-add-split") || {}).textContent.trim(),
        minus: (sh.querySelector(".ed-split-minus") || {}).getAttribute("aria-label") || "",
        rem: (sh.querySelector(".ed-split-main .ed-rem") || {}).textContent.trim(),
        splitBtn: !!sh.querySelector(".ed-split-link, [data-ed='split']"),
        noteAfter: block.bottom <= note.top + 2,
        remPx: parseFloat(getComputedStyle(sh.querySelector(".ed-split-main .ed-rem-amt")).fontSize),
        mark: (sh.querySelector(".ed-split-minus") || {}).textContent.trim(),
        gap: Math.round(sh.querySelector(".ed-split-minus").getBoundingClientRect().left - sh.querySelector(".ed-split-main").getBoundingClientRect().right),
        pad: parseFloat(getComputedStyle(sh.querySelector(".ed-split-main")).paddingTop),
        quiet: !/rgb\(\s*(1[2-9]\d|2\d\d)\s*,\s*(\d{1,2})\s*,\s*(\d{1,2})\s*\)/.test(getComputedStyle(sh.querySelector(".ed-split-minus")).backgroundColor),
        top: sh.getBoundingClientRect().top,
        picker: !!sh.querySelector(".ed-picker")
      };
    })()`);
    await snap("09-one-item-add-split.png");
    if (!out.splitOne || out.splitOne.lines !== 1 || !out.splitOne.name || out.splitOne.name === "Choose budget item" || out.splitOne.add !== "Add Split" || !/Remove /.test(out.splitOne.minus) || !/Remaining /.test(out.splitOne.rem) || out.splitOne.splitBtn || !out.splitOne.noteAfter || out.splitOne.picker || !(out.splitOne.remPx >= 16) || out.splitOne.mark !== "✕" || out.splitOne.gap < 8 || out.splitOne.pad < 12 || !out.splitOne.quiet) fail.push("one item split " + JSON.stringify(out.splitOne));
    await cdp.eval(`document.querySelector(".ed-add-split").click()`);
    await sleep(200);
    await cdp.eval(`(() => { const off = [...document.querySelectorAll(".ed-picker [data-ed='tick']")].find((t) => t.getAttribute("aria-checked") !== "true"); off.click(); })()`);
    await sleep(40);
    await cdp.eval(`document.querySelector("[data-ed='picker-done']").click()`);
    await sleep(260);
    out.splitTwo = await cdp.eval(`(() => {
      const sh = document.querySelector("form.sheet.ed-add");
      const block = sh.querySelector(".ed-itemsec").getBoundingClientRect();
      const note = sh.querySelector(".ed-note").getBoundingClientRect();
      return {
        lines: sh.querySelectorAll(".ed-split-line").length,
        names: [...sh.querySelectorAll(".ed-items-name")].map((el) => el.textContent.trim()),
        add: (sh.querySelector(".ed-add-split") || {}).textContent.trim(),
        minus: sh.querySelectorAll(".ed-split-minus").length,
        noteAfter: block.bottom <= note.top + 2,
        amounts: sh.querySelectorAll("[data-ed-leg]").length
      };
    })()`);
    await cdp.eval(`(() => {
      const note = document.querySelector(".ed-note");
      const sc = document.querySelector(".ed-scroll");
      if (!note || !sc) return;
      const sr = sc.getBoundingClientRect();
      const nr = note.getBoundingClientRect();
      if (nr.bottom > sr.bottom - 8) sc.scrollTop += nr.bottom - (sr.bottom - 8);
    })()`);
    await sleep(40);
    await snap("10-two-splits.png");
    if (!out.splitTwo || out.splitTwo.lines !== 2 || out.splitTwo.names.length !== 2 || out.splitTwo.add !== "Add Split" || out.splitTwo.minus !== 2 || !out.splitTwo.noteAfter || out.splitTwo.amounts !== 2) fail.push("two splits " + JSON.stringify(out.splitTwo));

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
    }

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
