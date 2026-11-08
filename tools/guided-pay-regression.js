#!/usr/bin/env node
/* Guided manual pay. Synthetic demo numbers only.
 * Usage: node tools/guided-pay-regression.js [--base URL] [--shots dir]
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
const PORT = 9600 + Math.floor(Math.random() * 200);
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
  async shot(name) {
    if (!SHOTS) return;
    await this.eval(`(() => { const s = document.querySelector(".gp-sheet"); if (s) s.scrollTop = 0; return true; })()`);
    await sleep(280);
    const r = await this.send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(SHOTS + "/" + name, Buffer.from(r.data, "base64"));
  }
}
function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
function near(a, b) { return typeof a === "number" && Math.abs(a - b) <= 0.02; }

const STUB = {
  payDate: "2026-11-06", gross: 9000, net: 4000, employee401k: 5000, employer401k: 800,
  federalTax: 400, stateTax: 100, socialSecurity: 200, medicare: 50,
  otherDeductions: [],
  ytd: { gross: 9000, earnings: 9000, federalTax: 400, stateTax: 100, employee401k: 5000, employer401k: 800 }
};
const state = {
  tab: "budget", year: 2026, month: 11, worthYear: 2026, incomeYear: 2026,
  plan: "premium", theme: "light", envelopeMode: "remaining",
  policyConsent: { version: "1.2", acceptedAt: "2026-01-01T00:00:00.000Z", via: "app" },
  onboarding: { status: "done", answers: { name: "Preview", payFrequency: "monthly", birthday: "1990-01-01" } },
  profile: {
    name: "Preview", payFrequency: "monthly", filingStatus: "single", dependents: 0, birthday: "1990-01-01",
    documents: [{ id: "doc1", slot: "payStubs", payStubConfirmed: true, payStubPending: STUB }]
  },
  compensation: { baseSalary: 0, paychecksPerYear: 12, zipCode: "80202", filingStatus: "single", trueManual: false, preTax: [], postTax: [], trueLines: [] },
  foo: { emergencyAmount: 12000 }, matters: {},
  months: { "2026-11": {
    year: 2026, month: 11,
    incomes: [{ id: "pay", name: "Paycheck", amount: 4000, date: "2026-11-01" }],
    categories: [
      { id: "sav", name: "Savings", system: "savings", flat: false, sortOrder: 0, lines: [{ id: "chk", name: "Checking", system: "checking", assigned: 400, sortOrder: 0 }] },
      { id: "food", name: "Food", sortOrder: 1, flat: true, lines: [{ id: "food", name: "Food", assigned: 3600, sortOrder: 0 }] }
    ],
    transactions: []
  } },
  worth: { years: [2026], notes: {}, lines: [], income: {} }
};
const SEED = `(() => {
  localStorage.setItem("PaperTrail.preview.v6", ${JSON.stringify(JSON.stringify(state))});
  localStorage.setItem("PaperTrail.tourSeen.stats", "1");
  localStorage.setItem("PaperTrail.tourSeen.spend", "1");
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
      let body = {};
      if (u.indexOf("/auth/v1/user") >= 0) body = { id: "preview-user", email: "preview@example.com" };
      else if (u.indexOf("book_versions") >= 0 && (!opts || !opts.method || opts.method === "GET")) body = [];
      else body = [{ id: 1 }];
      return Promise.resolve(new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } }));
    }
    return orig.apply(this, arguments);
  };
})();`;

(async () => {
  const chrome = spawn(CHROME, [
    "--headless=new", "--disable-gpu", "--no-sandbox", "--disable-dev-shm-usage",
    "--remote-debugging-port=" + PORT, "--user-data-dir=/tmp/pt-gp-" + PORT, "about:blank"
  ], { stdio: "ignore" });
  const fail = [];
  const out = {};
  function check(cond, msg) { if (!cond) fail.push(msg); }
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
    await cdp.send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
    await cdp.send("Page.addScriptToEvaluateOnNewDocument", { source: FETCH_STUB });
    await cdp.send("Page.addScriptToEvaluateOnNewDocument", { source: SEED });
    await cdp.send("Page.navigate", { url: BASE.replace(/\/$/, "") + "/index.html?nosplash=1" });
    await sleep(1600);

    async function click(sel) {
      const ok = await cdp.eval(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return false; el.click(); return true; })()`);
      if (!ok) throw new Error("missing " + sel);
      await sleep(80);
    }
    async function rate() { return cdp.eval("PaperTrailPreview.canonicalSavings(2026, 11, 11)"); }
    async function text() { return cdp.eval(`document.querySelector(".gp-sheet") ? document.querySelector(".gp-sheet").innerText : ""`); }

    await click(".sav-pay-link");
    check(await cdp.eval(`!!document.querySelector('[data-act="vault-add-paystub"]') && !!document.querySelector('[data-act="it-true-flat"]')`), "upload and one-page edit stay available");
    await click('[data-act="it-true-manual"]');
    out.income0 = await text();
    check(/one year/i.test(out.income0) && /salary/i.test(out.income0) && /bonus/i.test(out.income0) && /other gross income/i.test(out.income0) && /gross pay, before anything comes out/i.test(out.income0), "income page is one year of gross");
    await click('[data-act="gp-next"]');
    check(/Enter salary for the year/.test(await text()), "salary is required");
    await cdp.eval(`(() => { document.querySelector('[name=checks]').value = '12'; document.querySelector('[name=salary]').value = '48000'; })()`);
    await click('[data-act="gp-next"]');
    await click('[data-act="gp-back"]');
    out.salaryKept = await cdp.eval(`document.querySelector('[name=salary]').value`);
    check(/48,?000/.test(out.salaryKept || ""), "back keeps the salary " + out.salaryKept);
    await cdp.shot("sav-guided-income.png");
    await click('[data-act="gp-next"]');
    out.retDefaults = await cdp.eval(`(() => {
      const box = document.querySelector('[name=retSave0]');
      const pre = document.querySelector('.gp-line [data-tax=pre]');
      const sel = document.querySelector('[name=retType0]');
      return { checked: !!(box && box.checked), pre: pre && pre.getAttribute('aria-pressed'), type: sel && sel.value };
    })()`);
    check(out.retDefaults.checked === true && out.retDefaults.pre === "true" && out.retDefaults.type === "401k-trad", "new retirement counts and starts pre-tax " + JSON.stringify(out.retDefaults));
    await cdp.eval(`document.querySelector('[name=retAmt0]').value = '2400'`);
    await click('[data-act="gp-add"]');
    await cdp.eval(`(() => { const s = document.querySelector('[name=retType1]'); s.value = 'custom'; s.dispatchEvent(new Event('change', { bubbles: true })); })()`);
    await sleep(50);
    await cdp.eval(`(() => { document.querySelector('[name=retName1]').value = 'Side plan'; document.querySelector('[name=retAmt1]').value = '600'; })()`);
    await click('[data-act="gp-next"]');
    check(/Choose pre-tax or after-tax for Side plan/.test(await text()), "custom retirement does not assume pre-tax");
    await cdp.eval(`(() => { const line = document.querySelectorAll('.gp-line')[1]; line.querySelector('[data-tax=post]').click(); document.querySelector('[name=retSave1]').checked = false; })()`);
    await cdp.shot("sav-guided-retire.png");
    await click('[data-act="gp-next"]');
    out.erDefault = await cdp.eval(`!!document.querySelector('[name=erCount]').checked`);
    check(out.erDefault === true, "employer additions count by default");
    await cdp.eval(`(() => { const row = document.querySelector('[name=erMatch]').closest('[data-gp-amt]'); row.querySelector('[data-u=pct]').click(); document.querySelector('[name=erMatch]').value = '3'; })()`);
    await click('[data-act="gp-next"]');
    out.dedDefault = await cdp.eval(`!!document.querySelector('[name=dedSave0]').checked`);
    check(out.dedDefault === false, "new other deductions do not count");
    await cdp.eval(`(() => { const s = document.querySelector('[name=dedKind0]'); s.value = 'health'; s.dispatchEvent(new Event('change', { bubbles: true })); })()`);
    await sleep(40);
    await cdp.eval(`document.querySelector('[name=dedAmt0]').value = '600'`);
    await click('[data-act="gp-next"]');
    check(/Choose pre-tax or after-tax for Healthcare/.test(await text()), "healthcare tax is not inferred");
    await cdp.eval(`document.querySelector('.gp-line [data-tax=pre]').click()`);
    await click('[data-act="gp-add"]');
    await cdp.eval(`(() => { document.querySelector('[name=dedName1]').value = 'Parking'; document.querySelector('[name=dedAmt1]').value = '1200'; document.querySelectorAll('.gp-line')[1].querySelector('[data-tax=pre]').click(); document.querySelector('[name=dedSave1]').checked = true; })()`);
    await cdp.shot("sav-guided-other.png");
    await click('[data-mode="totals"]');
    await cdp.eval(`(() => { document.querySelector('[name=totPre]').value = '360'; document.querySelector('[name=totPost]').value = '240'; })()`);
    await cdp.shot("sav-guided-totals.png");
    await click('[data-mode="lines"]');
    out.keptLines = await cdp.eval(`(() => ({ park: (document.querySelector('[name=dedName1]') || {}).value || '', amt: (document.querySelector('[name=dedAmt1]') || {}).value || '', save: document.querySelector('[name=dedSave1]').checked, health: (document.querySelector('[name=dedAmt0]') || {}).value || '' }))()`);
    check(out.keptLines.park === "Parking" && /1200|1,200/.test(out.keptLines.amt) && out.keptLines.save === true && /600/.test(out.keptLines.health), "switching back keeps the individual lines " + JSON.stringify(out.keptLines));
    await click('[data-mode="totals"]');
    out.keptTot = await cdp.eval(`({ pre: document.querySelector('[name=totPre]').value, post: document.querySelector('[name=totPost]').value, preSave: document.querySelector('[name=totPreSave]').checked })`);
    check(/360/.test(out.keptTot.pre) && /240/.test(out.keptTot.post) && out.keptTot.preSave === false, "totals stay put and do not count by default " + JSON.stringify(out.keptTot));
    await click('[data-mode="lines"]');
    await click('[data-act="gp-next"]');
    out.review = await text();
    check(/One year · 12 paychecks/.test(out.review) && /Gross pay for the year/.test(out.review) && /\$48,000/.test(out.review), "review states the year and gross");
    check(/Traditional 401k/.test(out.review) && /Counts/.test(out.review) && /Side plan/.test(out.review) && /Not counted/.test(out.review), "review lists retirement inclusion");
    check(/Parking/.test(out.review) && /Healthcare/.test(out.review) && /individual deductions/.test(out.review) && !/Pre-tax total/.test(out.review), "review saves the list, not the totals as well");
    await cdp.shot("sav-guided-review.png");
    await click('[data-act="gp-back"]');
    out.backDed = await cdp.eval(`({ mode: (document.querySelector('[data-mode="lines"]') || {}).getAttribute && document.querySelector('[data-mode="lines"]').getAttribute('aria-pressed'), park: (document.querySelector('[name=dedName1]') || {}).value || '' })`);
    check(out.backDed.mode === "true" && out.backDed.park === "Parking", "back returns to the individual list " + JSON.stringify(out.backDed));
    await click('[data-act="gp-next"]');
    await click('[data-act="gp-save"]');
    await sleep(300);
    out.saved = await rate();
    const s = out.saved;
    check(s && s.source === "typed" && s.label === "Savings rate · gross pay", "typed-in pay beats the stub");
    check(s && near(s.gross, 4000) && near(s.paycheck, 300) && near(s.employer, 120) && near(s.budget, 400) && near(s.savings, 820) && near(s.divisor, 4120), "401k + marked parking + 3% employer on both sides, others out " + JSON.stringify(s && { g: s.gross, p: s.paycheck, e: s.employer, b: s.budget, sv: s.savings, d: s.divisor }));
    check(s && s.paycheckItems.some((it) => it.name === "Parking") && !s.paycheckItems.some((it) => /Side plan|Healthcare/.test(it.name)), "only checked lines are in the paycheck group");
    out.budgetLines = await cdp.eval(`(async () => { document.querySelector('[data-tab="budget"]').click(); await new Promise((r) => setTimeout(r, 250)); return document.querySelector('.envelope') ? document.querySelector('.envelope').innerText : ''; })()`);
    check(/Checking/.test(out.budgetLines) && !/Traditional 401k|Parking/.test(out.budgetLines), "payroll savings are not budget lines");

    await cdp.eval(`document.querySelector('[data-tab="stats"]').click()`);
    await sleep(250);
    await click('[data-door="review"]');
    await click('[data-door="paystubs"]');
    await click('[data-act="it-true-manual"]');
    out.round = await cdp.eval(`(async () => {
      const salary = document.querySelector('[name=salary]').value;
      document.querySelector('[data-act="gp-next"]').click();
      await new Promise((r) => setTimeout(r, 40));
      const ret = { type: document.querySelector('[name=retType0]').value, save: document.querySelector('[name=retSave0]').checked, amt: document.querySelector('[name=retAmt0]').value, sideSave: document.querySelector('[name=retSave1]').checked, sideTax: document.querySelector('[name=retTax1]').value, sideName: document.querySelector('[name=retName1]').value };
      document.querySelector('[data-act="gp-next"]').click();
      await new Promise((r) => setTimeout(r, 40));
      document.querySelector('[data-act="gp-next"]').click();
      await new Promise((r) => setTimeout(r, 40));
      const ded = { name: document.querySelector('[name=dedName1]').value, save: document.querySelector('[name=dedSave1]').checked, healthSave: document.querySelector('[name=dedSave0]').checked };
      document.querySelector('[name=salary]') ;
      return { salary, ret, ded };
    })()`);
    check(/48,?000/.test(out.round.salary) && out.round.ret.save === true && out.round.ret.sideSave === false && out.round.ret.sideTax === "post" && out.round.ret.sideName === "Side plan", "edit round trip keeps retirement marks and tax " + JSON.stringify(out.round));
    check(out.round.ded.name === "Parking" && out.round.ded.save === true && out.round.ded.healthSave === false, "edit round trip keeps the custom parking mark");
    await click('[data-act="close-modal"]');
    await sleep(150);
    out.afterCancel = await rate();
    check(near(out.afterCancel.savings, 820) && near(out.afterCancel.divisor, 4120), "closing without save leaves the plan");

    await click('[data-act="it-true-manual"]');
    await cdp.eval(`document.querySelector('[name=salary]').value = '1000'`);
    await click('[data-act="close-modal"]');
    await sleep(100);
    out.still = await rate();
    check(near(out.still.gross, 4000), "cancel does not overwrite salary");

    await click('[data-act="it-true-manual"]');
    await click('[data-act="gp-next"]');
    await click('[data-act="gp-next"]');
    await cdp.eval(`document.querySelector('[name=erCount]').checked = false`);
    await click('[data-act="gp-next"]');
    await click('[data-mode="totals"]');
    await cdp.eval(`(() => { document.querySelector('[name=totPre]').value = '600'; document.querySelector('[name=totPost]').value = '0'; document.querySelector('[name=totPreSave]').checked = true; })()`);
    await click('[data-act="gp-next"]');
    out.reviewTot = await text();
    check(/Pre-tax total/.test(out.reviewTot) && /Saving the two totals/.test(out.reviewTot) && !/Parking/.test(out.reviewTot), "totals review does not also list the individual lines");
    await click('[data-act="gp-save"]');
    await sleep(300);
    out.totals = await rate();
    const t = out.totals;
    check(t && near(t.employer, 0) && near(t.divisor, 4000) && near(t.paycheck, 250) && !t.paycheckItems.some((it) => it.name === "Parking") && t.paycheckItems.some((it) => it.name === "Pre-tax deductions"), "totals replace the list and an unchecked employer drops off both sides " + JSON.stringify(t && { e: t.employer, d: t.divisor, p: t.paycheck, names: t.paycheckItems.map((i) => i.name) }));

    out.smoke = await cdp.eval(`(async () => {
      document.querySelector('[data-tab="budget"]').click();
      await new Promise((r) => setTimeout(r, 250));
      const ltb = document.getElementById('left-to-budget');
      const hero = document.querySelector('.budget-hero');
      const screen = document.getElementById('screen');
      const b0 = ltb.getBoundingClientRect().top, h0 = hero.getBoundingClientRect().top;
      screen.scrollTop = 200;
      const lineDelta = Math.round(ltb.getBoundingClientRect().top - b0);
      const heroDelta = Math.round(hero.getBoundingClientRect().top - h0);
      document.querySelector('[data-tab="stats"]').click();
      await new Promise((r) => setTimeout(r, 250));
      const door = document.querySelector('[data-door="dash"]');
      if (door) door.click();
      await new Promise((r) => setTimeout(r, 250));
      const folds = () => [...document.querySelectorAll('.dash-fold')].filter((b) => b.getAttribute('aria-expanded') === 'true').map((b) => b.getAttribute('data-id'));
      const buttons = [...document.querySelectorAll('.dash-fold')];
      if (buttons[0]) buttons[0].click();
      await new Promise((r) => setTimeout(r, 30));
      const one = folds();
      if (buttons[1]) buttons[1].click();
      await new Promise((r) => setTimeout(r, 30));
      const two = folds();
      return { slogan: ltb.textContent.trim(), sticky: getComputedStyle(ltb).position, lineDelta, heroDelta, one, two };
    })()`);
    check(out.smoke.slogan === "Every dollar has a job" && out.smoke.sticky !== "sticky" && Math.abs(out.smoke.lineDelta - out.smoke.heroDelta) <= 2, "slogan still scrolls with the balance");
    check(out.smoke.one.length === 1 && out.smoke.two.length === 1 && out.smoke.one[0] !== out.smoke.two[0], "one dashboard section at a time");

    out.fail = fail;
    console.log(JSON.stringify(out));
    if (fail.length) process.exitCode = 1;
  } catch (err) {
    console.log(JSON.stringify({ error: String(err && err.stack || err), fail: fail, out: out }));
    process.exitCode = 1;
  } finally {
    chrome.kill("SIGKILL");
  }
})();
