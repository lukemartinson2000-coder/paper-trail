#!/usr/bin/env node
/* Targeted checks for the four smoothness fixes. Needs Google Chrome.
 * Serves nothing itself: BASE_URL defaults to http://127.0.0.1:8765 (index.html?nosplash=1).
 * Prints one JSON line. Exit 1 when an assertion fails.
 * Usage: node tools/smooth-regression.js [--base URL] [--shots dir] [--label after]
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
const LABEL = arg("--label", "after");
const PORT = 9400 + Math.floor(Math.random() * 200);
const CHROME = process.env.CHROME || "/usr/local/bin/google-chrome";

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
  async shot(path) {
    const r = await this.send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path, Buffer.from(r.data, "base64"));
  }
}

const SEED = `
(() => {
  const y = 2026, m = 11;
  const names = ["Savings","Housing","Food","Transportation","Giving","Subscriptions","Insurance","Health","Personal","Fun"];
  const state = {
    tab: "budget", year: y, month: m, worthYear: y, incomeYear: y,
    plan: "premium", theme: "light", envelopeMode: "remaining",
    policyConsent: { version: "1.2", acceptedAt: "2026-01-01T00:00:00.000Z", via: "app" },
    onboarding: { status: "done", answers: { name: "Preview", payFrequency: "biweekly", birthday: "1990-01-01" } },
    profile: { name: "Preview", payFrequency: "biweekly", filingStatus: "single", documents: [], dependents: 0, birthday: "1990-01-01" },
    compensation: { baseSalary: 90000, paychecksPerYear: 26, zipCode: "80202", filingStatus: "single", trueManual: false, preTax: [], postTax: [] },
    foo: { emergencyAmount: 12000 }, matters: {},
    months: { "2026-11": {
      year: y, month: m,
      incomes: [{ id: "pay1", name: "Paycheck", amount: 1850, date: "2026-11-01" }],
      categories: names.map((name, i) => ({
        id: "c" + i, name, assigned: 0, sortOrder: i, flat: name !== "Savings",
        system: name === "Savings" ? "savings" : undefined,
        lines: [{ id: "l" + i, name: name === "Savings" ? "Checking" : name, assigned: name === "Savings" ? 500 : 150, sortOrder: 0, system: name === "Savings" ? "checking" : undefined }]
      })),
      transactions: [{ id: "t1", payee: "Market", date: "2026-11-02", amount: 42.5, categoryId: "c2", lineId: "l2" }]
    }},
    worth: { years: [y], notes: {}, lines: [
      { id: "w1", name: "Checking", kind: "asset", group: "cash", sortOrder: 0, amounts: { "2026": 8000 }, additions: { "2026": 0 } },
      { id: "w2", name: "401k", kind: "asset", group: "retirement", sortOrder: 1, amounts: { "2026": 40000 }, additions: { "2026": 0 } }
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

(async () => {
  const chrome = spawn(CHROME, [
    "--headless=new", "--disable-gpu", "--no-sandbox", "--disable-dev-shm-usage",
    "--remote-debugging-port=" + PORT, "--user-data-dir=/tmp/pt-reg-" + PORT, "about:blank"
  ], { stdio: "ignore" });
  const fail = [];
  const out = { label: LABEL };
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
    async function boot(h) {
      await cdp.send("Emulation.setDeviceMetricsOverride", { width: 390, height: h || 844, deviceScaleFactor: 2, mobile: true });
      await cdp.send("Page.addScriptToEvaluateOnNewDocument", { source: SEED });
      await cdp.send("Page.navigate", { url: BASE.replace(/\/$/, "") + "/index.html?nosplash=1" });
      await sleep(1500);
    }
    await boot(844);

    out.budget = await cdp.eval(`(() => {
      const ltb = document.getElementById("left-to-budget");
      const hero = document.querySelector(".budget-hero");
      const bar = document.querySelector(".mode-toggle");
      const screen = document.getElementById("screen");
      const b0 = ltb.getBoundingClientRect().top, h0 = hero.getBoundingClientRect().top, m0 = bar.getBoundingClientRect().top;
      screen.scrollTop = 240;
      const b1 = ltb.getBoundingClientRect().top, h1 = hero.getBoundingClientRect().top, m1 = bar.getBoundingClientRect().top;
      return {
        text: ltb.textContent.trim(), cls: ltb.className, pos: getComputedStyle(ltb).position,
        lineDelta: Math.round(b1 - b0), heroDelta: Math.round(h1 - h0), barDelta: Math.round(m1 - m0)
      };
    })()`);
    if (SHOTS) { await cdp.eval(`document.getElementById("screen").scrollTop = 0`); await cdp.shot(SHOTS + "/" + LABEL + "-budget-top.png"); await cdp.eval(`document.getElementById("screen").scrollTop = 240`); await cdp.shot(SHOTS + "/" + LABEL + "-budget-scrolled.png"); }
    if (out.budget.text !== "Every dollar has a job") fail.push("budget text " + out.budget.text);
    if (out.budget.pos === "sticky") fail.push("slogan is sticky");
    if (Math.abs(out.budget.lineDelta - out.budget.heroDelta) > 2) fail.push("slogan did not scroll with the balance");
    if (Math.abs(out.budget.lineDelta) < 100) fail.push("slogan barely moved " + out.budget.lineDelta);

    /* Leftover line still pins (not part of this fix) — measure only. */
    out.category = await cdp.eval(`(async () => {
      document.querySelector('[data-act="add-spend"]').click();
      await new Promise((r) => setTimeout(r, 250));
      const sh = document.querySelector(".sheet.ed-add");
      sh.scrollTop = 160;
      const screen = document.getElementById("screen");
      screen.scrollTop = 80;
      const before = { sheet: sh.scrollTop, top: Math.round(sh.getBoundingClientRect().top), screen: screen.scrollTop };
      document.querySelector('[data-ed="picker"]').click();
      await new Promise((r) => setTimeout(r, 200));
      const midSh = document.querySelector(".sheet.ed-add");
      const mid = { sheet: midSh.scrollTop, top: Math.round(midSh.getBoundingClientRect().top), screen: screen.scrollTop, picker: !!document.querySelector(".ed-picker") };
      document.querySelector(".ed-picker [data-ed='item']").click();
      await new Promise((r) => setTimeout(r, 200));
      const sh2 = document.querySelector(".sheet.ed-add");
      const row = sh2.querySelector(".ed-items");
      const sr = sh2.getBoundingClientRect(), er = row ? row.getBoundingClientRect() : null;
      const rowVisible = !!(er && er.top >= sr.top - 2 && er.bottom <= sr.bottom + 2 && er.top < window.innerHeight && er.bottom > 0);
      return { before, mid, after: { sheet: sh2.scrollTop, top: Math.round(sh2.getBoundingClientRect().top), screen: document.getElementById("screen").scrollTop, item: (document.querySelector(".ed-items-name") || {}).textContent || "", picker: !!document.querySelector(".ed-picker"), rowVisible } };
    })()`);
    if (SHOTS) await cdp.shot(SHOTS + "/" + LABEL + "-category.png");
    const cat = out.category;
    if (!cat.after.item || cat.after.item === "Choose budget item") fail.push("category not selected");
    if (cat.after.picker) fail.push("picker stayed open");
    if (Math.abs(cat.after.screen - cat.before.screen) > 2) fail.push("page scroll jumped " + cat.before.screen + " -> " + cat.after.screen);
    if (cat.after.top < cat.before.top - 8) fail.push("sheet jumped upward " + cat.before.top + " -> " + cat.after.top);
    if (!cat.after.rowVisible) fail.push("chosen category row is off screen");

    out.stay = await cdp.eval(`(async () => {
      const pay = document.querySelector('[data-ed-in="payee"]');
      if (pay) { pay.value = "Corner store"; pay.dispatchEvent(new Event("input", { bubbles: true })); }
      document.getElementById("modal").click();
      document.querySelector('[data-tab="stats"]').click();
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
      await new Promise((r) => setTimeout(r, 80));
      const sh = document.querySelector("form.sheet.ed-add");
      const pay2 = sh && sh.querySelector('[data-ed-in="payee"]');
      const tab = document.querySelector(".tab.active");
      return {
        open: !!sh,
        payee: pay2 ? pay2.value : "",
        closeBtn: !!(sh && sh.querySelector('[data-act="close-modal"]')),
        tab: tab ? tab.getAttribute("data-tab") : ""
      };
    })()`);
    if (!out.stay.open) fail.push("outside click, tab, or escape closed the transaction");
    if (out.stay.payee !== "Corner store") fail.push("typed merchant was lost: " + out.stay.payee);
    if (out.stay.closeBtn) fail.push("transaction sheet still offers a dismiss control");
    if (out.stay.tab !== "budget") fail.push("tab changed while entering a transaction: " + out.stay.tab);

    await cdp.eval(`(async () => {
      document.querySelector('[data-ed="pad"]').click();
      await new Promise((r) => setTimeout(r, 40));
      ["1", "0", "0"].forEach((k) => document.querySelector('.ed-pad [data-k="' + k + '"]').click());
      document.querySelector(".ed-save").click();
    })()`);
    await sleep(300);
    out.saved = await cdp.eval(`(() => {
      const raw = JSON.parse(localStorage.getItem("PaperTrail.preview.v6") || "{}");
      const txs = (raw.months && raw.months["2026-11"] && raw.months["2026-11"].transactions) || [];
      return { open: !!document.querySelector("form[data-act='save-spend-sheet']"), saved: txs.some((t) => t.payee === "Corner store" && t.amount === 1) };
    })()`);
    if (out.saved.open) fail.push("save did not close the transaction");
    if (!out.saved.saved) fail.push("save did not keep the transaction");

    out.del = await cdp.eval(`(async () => {
      document.querySelector('[data-tab="spend"]').click();
      await new Promise((r) => setTimeout(r, 200));
      const row = document.querySelector('[data-act="edit-spend"][data-id="t1"]');
      if (!row) return { error: "no market row" };
      row.click();
      await new Promise((r) => setTimeout(r, 200));
      const del = document.querySelector('form[data-act="save-spend-sheet"] [data-act="delete-spend"]');
      if (!del) return { error: "delete not shown" };
      document.getElementById("modal").click();
      const still = !!document.querySelector('[data-act="delete-spend"]');
      window.confirm = function () { return false; };
      del.click();
      const kept = !!document.querySelector('form[data-act="save-spend-sheet"]');
      window.confirm = function () { return true; };
      document.querySelector('[data-act="delete-spend"]').click();
      await new Promise((r) => setTimeout(r, 200));
      const raw = JSON.parse(localStorage.getItem("PaperTrail.preview.v6") || "{}");
      const txs = (raw.months && raw.months["2026-11"] && raw.months["2026-11"].transactions) || [];
      return { still: still, kept: kept, open: !!document.querySelector('form[data-act="save-spend-sheet"]'), hasMarket: txs.some((t) => t.id === "t1") };
    })()`);
    if (out.del.error) fail.push("delete: " + out.del.error);
    else {
      if (!out.del.still || !out.del.kept) fail.push("delete confirm was skipped or outside tap closed the editor " + JSON.stringify(out.del));
      if (out.del.open) fail.push("confirmed delete left the editor open");
      if (out.del.hasMarket) fail.push("confirmed delete left the transaction");
    }

    out.dashboard = await cdp.eval(`(async () => {
      document.querySelector('[data-tab="stats"]').click();
      await new Promise((r) => setTimeout(r, 300));
      const folds = () => [...document.querySelectorAll(".dash-fold")].map((b) => ({ id: b.getAttribute("data-id"), open: b.getAttribute("aria-expanded") === "true", label: (b.getAttribute("aria-label") || "").replace(/^(Expand|Collapse) /, "") }));
      const buttons = [...document.querySelectorAll(".dash-fold")];
      const grade = buttons.find((b) => /grade/i.test(b.getAttribute("aria-label") || "")) || buttons[0];
      const nw = buttons.find((b) => /net worth/i.test(b.getAttribute("aria-label") || "")) || buttons[1];
      grade.click();
      await new Promise((r) => setTimeout(r, 40));
      const one = folds().filter((f) => f.open).map((f) => f.id);
      nw.click();
      await new Promise((r) => setTimeout(r, 40));
      const two = folds().filter((f) => f.open).map((f) => f.id);
      nw.click();
      await new Promise((r) => setTimeout(r, 40));
      const none = folds().filter((f) => f.open).map((f) => f.id);
      const ret = [...document.querySelectorAll(".dash-fold")].find((b) => /retirement/i.test(b.getAttribute("aria-label") || ""));
      ret.click();
      await new Promise((r) => setTimeout(r, 40));
      const det = document.querySelector('[data-dash="ret-toggle"]');
      const beforeDetails = det.getAttribute("aria-expanded");
      det.click();
      await new Promise((r) => setTimeout(r, 250));
      const afterDetails = document.querySelector('[data-dash="ret-toggle"]').getAttribute("aria-expanded");
      const retStill = [...document.querySelectorAll(".dash-fold")].find((b) => /retirement/i.test(b.getAttribute("aria-label") || ""));
      const input = document.querySelector("[data-dashnum='retireAge']");
      const inputVal = input ? input.value : "";
      if (input) { input.value = "67"; input.dispatchEvent(new Event("change", { bubbles: true })); }
      await new Promise((r) => setTimeout(r, 250));
      const saved = document.querySelector("[data-dashnum='retireAge']");
      const foldsNow = [...document.querySelectorAll(".dash-fold")];
      const retNow = foldsNow.find((b) => /retirement/i.test(b.getAttribute("aria-label") || ""));
      const openNow = foldsNow.filter((b) => b.getAttribute("aria-expanded") === "true").map((b) => b.getAttribute("aria-label"));
      return { one, two, none, beforeDetails, afterDetails, retOpen: !!(retNow && retNow.getAttribute("aria-expanded") === "true"), others: foldsNow.filter((b) => b !== retNow && b.getAttribute("aria-expanded") === "true").length, openNow, inputVal, saved: saved ? saved.value : "" };
    })()`);
    if (SHOTS) {
      await cdp.eval(`document.getElementById("screen").scrollTop = 0`);
      const ret = await cdp.eval(`(() => { const b = [...document.querySelectorAll(".dash-fold")].find((x) => /retirement/i.test(x.getAttribute("aria-label") || "")); if (b && b.getAttribute("aria-expanded") !== "true") b.click(); return true; })()`);
      await sleep(80);
      await cdp.eval(`(() => { const b = [...document.querySelectorAll(".dash-fold")].find((x) => /net worth/i.test(x.getAttribute("aria-label") || "")); if (b) b.click(); return true; })()`);
      await sleep(80);
      await cdp.shot(SHOTS + "/" + LABEL + "-dashboard.png");
    }
    const dash = out.dashboard;
    if (dash.one.length !== 1) fail.push("first section did not open alone");
    if (dash.two.length !== 1 || dash.two[0] === dash.one[0]) fail.push("second section did not replace the first: " + JSON.stringify(dash.two));
    if (dash.none.length !== 0) fail.push("open section did not close");
    if (dash.beforeDetails !== "false" || dash.afterDetails !== "true") fail.push("retirement details did not open");
    if (!dash.retOpen) fail.push("opening details closed the retirement card");
    if (dash.others !== 0) fail.push("another top-level section stayed open with retirement");
    if (dash.saved !== "67") fail.push("retire age input not kept: " + dash.saved);

    /* Deduction field on a short viewport (keyboard-sized visible area). */
    await cdp.send("Emulation.setDeviceMetricsOverride", { width: 390, height: 430, deviceScaleFactor: 2, mobile: true });
    out.deduction = await cdp.eval(`(async () => {
      document.querySelector('[data-tab="stats"]').click();
      await new Promise((r) => setTimeout(r, 200));
      const review = document.querySelector('[data-door="review"]');
      if (review) review.click();
      await new Promise((r) => setTimeout(r, 200));
      const pay = document.querySelector('[data-door="paystubs"]');
      if (pay) pay.click();
      await new Promise((r) => setTimeout(r, 250));
      const setup = document.querySelector('[data-act="it-true-setup"]');
      if (!setup) return { error: "no true-rate button", text: document.body.innerText.slice(0, 300) };
      setup.click();
      await new Promise((r) => setTimeout(r, 250));
      const add = document.querySelector('[data-act="it-line-add"]');
      if (!add) return { error: "no add deduction", text: document.body.innerText.slice(0, 300) };
      add.click();
      await new Promise((r) => setTimeout(r, 400));
      const nm = document.querySelector(".it-line.open .it-line-name");
      const sh = document.querySelector(".it-sheet");
      if (!nm || !sh) return { error: "no field", open: !!document.querySelector(".it-line.open") };
      const er = nm.getBoundingClientRect(), sr = sh.getBoundingClientRect();
      const topBar = sh.querySelector(".sheet-top").getBoundingClientRect();
      return {
        focused: document.activeElement === nm,
        fieldTop: Math.round(er.top), fieldBottom: Math.round(er.bottom),
        sheetTop: Math.round(sr.top), sheetBottom: Math.round(sr.bottom),
        barBottom: Math.round(topBar.bottom),
        viewH: window.innerHeight,
        maxH: sh.style.maxHeight
      };
    })()`);
    if (SHOTS && out.deduction && !out.deduction.error) await cdp.shot(SHOTS + "/" + LABEL + "-deduction-short.png");
    const ded = out.deduction;
    if (ded.error) fail.push("deduction: " + ded.error);
    else {
      if (!ded.focused) fail.push("new deduction name was not focused");
      if (ded.fieldTop < ded.barBottom - 2) fail.push("field under the sheet title");
      if (ded.fieldBottom > ded.sheetBottom + 2) fail.push("field below the visible sheet");
      if (ded.fieldBottom > ded.viewH + 2) fail.push("field below the viewport");
    }

    /* Fake a keyboard: shorter visualViewport + a pan offset, then refocus. */
    out.keyboard = await cdp.eval(`(async () => {
      const nm = document.querySelector(".it-line.open .it-line-name");
      if (!nm) return { skipped: true };
      const fake = { height: 260, width: 390, offsetTop: 70, offsetLeft: 0, scale: 1, pageTop: 70, pageLeft: 0, onresize: null, onscroll: null, addEventListener() {}, removeEventListener() {} };
      try { Object.defineProperty(window, "visualViewport", { configurable: true, get() { return fake; } }); }
      catch (e) { return { skipped: true, why: "visualViewport not configurable" }; }
      window.scrollTo(0, 70);
      nm.blur();
      nm.focus();
      await new Promise((r) => setTimeout(r, 500));
      const er = nm.getBoundingClientRect(), sh = document.querySelector(".it-sheet").getBoundingClientRect();
      return {
        kbClass: document.body.classList.contains("it-kb"),
        fieldBottom: Math.round(er.bottom),
        sheetBottom: Math.round(sh.getBoundingClientRect ? sh.bottom : sh.bottom),
        maxH: document.querySelector(".it-sheet").style.maxHeight,
        win: window.scrollY
      };
    })()`);
    if (SHOTS && out.keyboard && !out.keyboard.skipped) await cdp.shot(SHOTS + "/" + LABEL + "-deduction-keyboard.png");
    if (out.keyboard && !out.keyboard.skipped) {
      if (!out.keyboard.kbClass) fail.push("keyboard class not applied");
      if (out.keyboard.fieldBottom > out.keyboard.sheetBottom + 2) fail.push("field covered when keyboard viewport shrinks");
      if (out.keyboard.win !== 0) fail.push("page stayed panned " + out.keyboard.win);
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
