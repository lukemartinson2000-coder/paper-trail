#!/usr/bin/env node
/* Focused checks for the one savings rate. Synthetic demo numbers only.
 * Serves nothing: BASE_URL defaults to http://127.0.0.1:8765/index.html?nosplash=1.
 * Prints one JSON line. Exit 1 when an assertion fails.
 * Usage: node tools/savings-regression.js [--base URL] [--shots dir]
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
const PORT = 9500 + Math.floor(Math.random() * 200);
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

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

function month(y, m, income, lines, food) {
  const mm = String(m).padStart(2, "0");
  return [y + "-" + m, {
    year: y, month: m,
    incomes: [{ id: "pay", name: "Paycheck", amount: income, date: y + "-" + mm + "-01" }],
    categories: [
      { id: "sav", name: "Savings", system: "savings", flat: false, sortOrder: 0, lines: lines },
      { id: "food", name: "Food", sortOrder: 1, flat: true, lines: [{ id: "food", name: "Food", assigned: food, sortOrder: 0 }] }
    ],
    transactions: []
  }];
}
function line(id, name, assigned, system) {
  const row = { id: id, name: name, assigned: assigned, sortOrder: 0 };
  if (system) row.system = system;
  return row;
}
const NOV_LINES = [line("chk", "Checking", 400, "checking"), line("house", "House fund", 200), line("roth", "Roth IRA", 100), line("kcash", "401k cash", 50)];
const STUB = {
  payDate: "2026-11-06", gross: 4000, net: 2800, employee401k: 500, employer401k: 200, hsa: 0,
  federalTax: 400, stateTax: 100, socialSecurity: 200, medicare: 50,
  otherDeductions: [
    { name: "Parking", amount: 40, preTax: true, saves: true },
    { name: "Gym", amount: 30, preTax: false, saves: false }
  ],
  ytd: { gross: 4000, earnings: 4000, federalTax: 400, stateTax: 100, employee401k: 500, employer401k: 200 }
};
function baseState(extra) {
  const months = {};
  months["2026-11"] = month(2026, 11, 4000, NOV_LINES, 3250)[1];
  /* October is left with dollars unassigned so the new-month wrap-up does not steal the view from November. */
  months["2026-10"] = month(2026, 10, 1000, [line("chk", "Checking", 100, "checking")], 800)[1];
  for (let m = 1; m <= 12; m++) months["2024-" + m] = month(2024, m, 100, [line("chk", "Checking", 10, "checking")], 90)[1];
  const state = {
    tab: "budget", year: 2026, month: 11, worthYear: 2026, incomeYear: 2026,
    plan: "free", theme: "light", envelopeMode: "remaining",
    policyConsent: { version: "1.2", acceptedAt: "2026-01-01T00:00:00.000Z", via: "app" },
    onboarding: { status: "done", answers: { name: "Preview", payFrequency: "monthly", birthday: "1990-01-01" } },
    profile: { name: "Preview", payFrequency: "monthly", filingStatus: "single", documents: [], dependents: 0, birthday: "1990-01-01" },
    compensation: { baseSalary: 0, paychecksPerYear: 12, zipCode: "80202", filingStatus: "single", trueManual: false, preTax: [], postTax: [], trueLines: [] },
    foo: { emergencyAmount: 12000 }, matters: {},
    months: months,
    worth: { years: [2026], notes: {}, lines: [], income: {} }
  };
  if (extra) extra(state);
  return state;
}
function typedPay(state) {
  state.plan = "premium";
  state.profile.payFrequency = "monthly";
  state.compensation = {
    baseSalary: 48000, paychecksPerYear: 12, zipCode: "80202", filingStatus: "single",
    trueManual: true, employer401kMatch: 1200, employer401kMatchIsPercent: false, employerMatchKnown: true,
    erSaves: { er401k: true },
    preTax: [
      { id: "401k", name: "401k", method: "fixed", value: 2400, on: true },
      { id: "park", name: "Parking", method: "fixed", value: 1200, on: true },
      { id: "hsa", name: "HSA", method: "fixed", value: 0, on: false }
    ],
    postTax: [{ id: "gym", name: "Gym", method: "fixed", value: 600, on: true }],
    trueLines: [{ id: "401k", saves: true }, { id: "park", saves: true }, { id: "gym", saves: false }]
  };
}
function withStub(state) {
  state.profile.documents = [{ id: "doc1", slot: "payStubs", payStubConfirmed: true, payStubPending: STUB }];
}

const FETCH_STUB = `
(() => {
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

function seedSource(state) {
  return `(() => {
    localStorage.setItem("PaperTrail.preview.v6", ${JSON.stringify(JSON.stringify(state))});
    localStorage.setItem("PaperTrail.tourSeen.stats", "1");
    localStorage.setItem("PaperTrail.tourSeen.spend", "1");
    localStorage.setItem("PaperTrail.cloud.session", JSON.stringify({
      access_token: "preview-token", refresh_token: "preview-refresh",
      expires_at: Math.floor(Date.now() / 1000) + 86400,
      user: { id: "preview-user", email: "preview@example.com" }
    }));
  })();`;
}

function near(a, b, eps) {
  return typeof a === "number" && typeof b === "number" && Math.abs(a - b) <= (eps || 0.001);
}

(async () => {
  const chrome = spawn(CHROME, [
    "--headless=new", "--disable-gpu", "--no-sandbox", "--disable-dev-shm-usage",
    "--remote-debugging-port=" + PORT, "--user-data-dir=/tmp/pt-sav-" + PORT, "about:blank"
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

    async function boot(state) {
      await cdp.send("Page.addScriptToEvaluateOnNewDocument", { source: seedSource(state) });
      await cdp.send("Page.navigate", { url: BASE.replace(/\/$/, "") + "/index.html?nosplash=1" });
      await sleep(1600);
    }
    async function rate(y, m1, m2) {
      return cdp.eval("PaperTrailPreview.canonicalSavings(" + y + "," + m1 + "," + m2 + ")");
    }

    /* 1. Budget only: one take-home rate, house fund included until the marker says otherwise. */
    await boot(baseState());
    out.budgetOnly = await rate(2026, 11, 11);
    out.yearMix = await rate(2026, 10, 11);
    out.full = await rate(2024, 1, 12);
    const b = out.budgetOnly, y = out.yearMix, full = out.full;
    check(b && b.label === "Savings rate · take-home", "budget label " + (b && b.label));
    check(b && b.basis === "take-home" && near(b.savings, 750) && near(b.divisor, 4000) && near(b.rate, 750 / 4000), "budget-only 750/4000");
    check(b && b.budgetItems.some((it) => it.name === "House fund") && b.budgetItems.some((it) => it.name === "401k cash"), "house fund and 401k cash stay in");
    check(b && !b.budgetItems.some((it) => it.name === "Food"), "food is not savings");
    check(b && b.paycheck === 0 && b.employer === 0, "no payroll without pay data");
    check(y && near(y.savings, 850) && near(y.divisor, 5000) && near(y.rate, 0.17), "weighted 850/5000");
    check(y && Math.abs(y.rate - ((750 / 4000 + 100 / 1000) / 2)) > 0.01, "not an average of percents");
    check(y && y.partial === true && /estimate/.test(y.period || ""), "partial year labeled estimate");
    check(full && full.partial === false && full.months === 12 && near(full.rate, 0.1), "full year weighted, not partial");

    out.uiBudget = await cdp.eval(`(async () => {
      for (let i = 0; i < 20 && !/November/.test(document.body.innerText); i++) await new Promise((r) => setTimeout(r, 150));
      const link = document.querySelector(".sav-pay-link");
      const env0 = document.querySelector(".sav-envelope");
      const toggle = document.querySelector(".sav-count-toggle");
      const hiddenMarks = [...document.querySelectorAll(".sav-envelope .sav-mark")];
      const head0 = env0.querySelector(".envelope-head").getBoundingClientRect();
      const amt0 = env0.querySelector(".line-assigned-btn").getBoundingClientRect();
      const scroll0 = document.getElementById("screen").scrollTop;
      const folded = {
        expanded: toggle.getAttribute("aria-expanded"),
        label: toggle.getAttribute("aria-label"),
        controls: toggle.getAttribute("aria-controls"),
        header: document.querySelector(".sav-count-h").textContent.replace(/\\s+/g, " ").trim(),
        help: !!document.querySelector(".sav-count-h .help-q"),
        hidden: hiddenMarks.length > 1 && hiddenMarks.every((el) => el.getAttribute("aria-hidden") === "true" && el.getAttribute("tabindex") === "-1" && getComputedStyle(el).visibility === "hidden" && getComputedStyle(el).opacity === "0"),
        checksInDom: hiddenMarks.filter((el) => el.querySelector(".sav-check")).length
      };
      toggle.click();
      await new Promise((r) => setTimeout(r, 80));
      const midOpacity = Number(getComputedStyle(env0.querySelector(".sav-mark")).opacity);
      await new Promise((r) => setTimeout(r, 180));
      const head1 = env0.querySelector(".envelope-head").getBoundingClientRect();
      const amt1 = env0.querySelector(".line-assigned-btn").getBoundingClientRect();
      const still = {
        head: Math.abs(head1.top - head0.top) < 0.5 && Math.abs(head1.left - head0.left) < 0.5,
        amtRight: Math.abs(amt1.right - amt0.right) < 0.5,
        nameLeft: Math.abs(env0.querySelector(".line-name").getBoundingClientRect().left - (head0.left + 44)) < 1.5,
        scroll: document.getElementById("screen").scrollTop === scroll0,
        mid: midOpacity,
        open: toggle.getAttribute("aria-expanded"),
        openLabel: toggle.getAttribute("aria-label")
      };
      const marks = [...document.querySelectorAll(".sav-mark")].map((el) => ({
        name: el.getAttribute("data-name"), pressed: el.getAttribute("aria-pressed"), label: el.getAttribute("aria-label"), text: el.textContent.trim(), check: !!el.querySelector(".sav-check"),
        shown: getComputedStyle(el).visibility === "visible" && getComputedStyle(el).opacity === "1" && el.getAttribute("aria-hidden") !== "true"
      }));
      const env = document.querySelector(".sav-envelope");
      const head = env && env.querySelector(".envelope-head");
      const label = env && env.querySelector(".sav-count-h");
      const row = env && env.querySelector(".envelope-line-head");
      const mark = row && row.querySelector(".sav-mark");
      const name = row && row.querySelector(".line-name");
      let layout = null;
      if (head && label && mark && name) {
        const hb = head.getBoundingClientRect(), lb = label.getBoundingClientRect(), mb = mark.getBoundingClientRect(), nb = name.getBoundingClientRect();
        const lefts = [...env.querySelectorAll(".sav-mark")].map((el) => Math.round(el.getBoundingClientRect().left));
        layout = {
          labelBelow: lb.top >= hb.bottom - 1,
          labelLeft: Math.abs(lb.left - hb.left) <= 2,
          markLeftOfName: mb.right <= nb.left + 1,
          sameColumn: lefts.length > 1 && lefts.every((x) => x === lefts[0]),
          noInOut: marks.every((m) => !/\\b(In|Out)\\b/.test(m.text))
        };
      }
      const ltb = document.getElementById("left-to-budget");
      const hero = document.querySelector(".budget-hero");
      const screen = document.getElementById("screen");
      const b0 = ltb.getBoundingClientRect().top, h0 = hero.getBoundingClientRect().top;
      screen.scrollTop = 240;
      return {
        link: link ? { act: link.getAttribute("data-act"), plan: link.getAttribute("data-plan"), text: link.textContent.trim() } : null,
        caption: (document.querySelector(".sav-pay-link + .caption") || {}).textContent || "",
        marks: marks, layout: layout, folded: folded, still: still,
        slogan: ltb.textContent.trim(), sticky: getComputedStyle(ltb).position,
        lineDelta: Math.round(ltb.getBoundingClientRect().top - b0),
        heroDelta: Math.round(hero.getBoundingClientRect().top - h0)
      };
    })()`);
    const ui = out.uiBudget;
    check(ui.link && ui.link.act === "set-plan" && ui.link.plan === "premium" && ui.link.text === "Include paycheck savings", "free paycheck link uses the premium gate");
    check(/Count retirement contributions and employer contributions from your pay/.test(ui.caption), "paycheck link caption");
    check(ui.folded && ui.folded.expanded === "false" && ui.folded.label === "Show which lines count towards the savings rate" && ui.folded.controls === "sav-count-col" && /Count towards savings rate/.test(ui.folded.header) && ui.folded.help && ui.folded.hidden && ui.folded.checksInDom >= 1, "checks hidden until expand " + JSON.stringify(ui.folded));
    check(ui.still && ui.still.head && ui.still.amtRight && ui.still.nameLeft && ui.still.scroll && ui.still.mid > 0.05 && ui.still.mid < 0.98 && ui.still.open === "true" && ui.still.openLabel === "Hide which lines count towards the savings rate", "expand fades the checks without moving the rows " + JSON.stringify(ui.still));
    check(ui.marks.some((m) => m.name === "House fund" && m.pressed === "true" && /Included in savings rate/.test(m.label) && m.check && m.shown && !/\b(In|Out)\b/.test(m.text)), "house fund marker is a check, not in/out");
    check(ui.marks.every((m) => m.shown), "opened checks are shown");
    check(ui.layout && ui.layout.labelBelow && ui.layout.labelLeft && ui.layout.markLeftOfName && ui.layout.sameColumn && ui.layout.noInOut, "count column sits under the savings total, on the left " + JSON.stringify(ui.layout));
    check(ui.slogan === "Every dollar has a job" && ui.sticky !== "sticky" && Math.abs(ui.lineDelta - ui.heroDelta) <= 2 && Math.abs(ui.lineDelta) > 100, "slogan still scrolls with the balance");
    if (SHOTS) {
      await cdp.eval(`document.getElementById("screen").scrollTop = 0; document.querySelector(".sav-pay-link").scrollIntoView({ block: "center" });`);
      await cdp.shot(SHOTS + "/sav-budget-link.png");
    }
    await cdp.eval(`document.querySelector('[data-act="sav-mark"][data-name="House fund"]').click()`);
    await sleep(300);
    out.markOff = await cdp.eval(`(() => {
      const house = document.querySelector('[data-act="sav-mark"][data-name="House fund"]');
      const chk = document.querySelector('[data-act="sav-mark"][data-name="Checking"]');
      return {
        housePressed: house && house.getAttribute("aria-pressed"),
        houseCheck: !!(house && house.querySelector(".sav-check")),
        houseText: house ? house.textContent.trim() : "",
        chkCheck: !!(chk && chk.querySelector(".sav-check"))
      };
    })()`);
    check(out.markOff && out.markOff.housePressed === "false" && !out.markOff.houseCheck && out.markOff.houseText === "" && out.markOff.chkCheck, "excluded row has no check; counted row keeps one " + JSON.stringify(out.markOff));
    out.excluded = await rate(2026, 11, 11);
    check(out.excluded && near(out.excluded.savings, 550) && near(out.excluded.rate, 550 / 4000) && !out.excluded.budgetItems.some((it) => it.name === "House fund"), "excluding house fund leaves 550/4000");
    check(out.excluded && out.excluded.budgetItems.some((it) => it.name === "401k cash"), "excluding house fund does not drop 401k cash");
    await cdp.eval(`document.querySelector(".sav-count-toggle").click()`);
    await sleep(220);
    out.refolded = await cdp.eval(`(() => {
      const marks = [...document.querySelectorAll(".sav-envelope .sav-mark")];
      const btn = document.querySelector(".sav-count-toggle");
      return {
        expanded: btn && btn.getAttribute("aria-expanded"),
        hidden: marks.length > 1 && marks.every((el) => el.getAttribute("aria-hidden") === "true" && getComputedStyle(el).visibility === "hidden")
      };
    })()`);
    check(out.refolded && out.refolded.expanded === "false" && out.refolded.hidden, "collapsing hides the checks again " + JSON.stringify(out.refolded));
    out.stillExcluded = await rate(2026, 11, 11);
    check(out.stillExcluded && near(out.stillExcluded.savings, 550) && !out.stillExcluded.budgetItems.some((it) => it.name === "House fund"), "collapsed column still uses the saved exclusion");

    out.dash = await cdp.eval(`(async () => {
      document.querySelector('[data-tab="stats"]').click();
      await new Promise((r) => setTimeout(r, 400));
      const monthBtn = document.querySelector('[data-act="sav-details"][data-sav="month"]');
      const yearBtn = document.querySelector('[data-act="sav-details"][data-sav="year"]');
      const folds = () => [...document.querySelectorAll(".dash-fold")].filter((b) => b.getAttribute("aria-expanded") === "true").map((b) => b.getAttribute("data-id"));
      const buttons = [...document.querySelectorAll(".dash-fold")];
      const a = buttons[0], c = buttons[1];
      a.click(); await new Promise((r) => setTimeout(r, 40));
      const one = folds();
      c.click(); await new Promise((r) => setTimeout(r, 40));
      const two = folds();
      return {
        month: monthBtn ? monthBtn.textContent.replace(/\\s+/g, " ").trim() : "",
        year: yearBtn ? yearBtn.textContent.replace(/\\s+/g, " ").trim() : "",
        monthLabel: monthBtn ? monthBtn.querySelector(".caption, .lbl") : null,
        one: one, two: two
      };
    })()`);
    check(out.dash.one.length === 1 && out.dash.two.length === 1 && out.dash.one[0] !== out.dash.two[0], "one dashboard section at a time");
    await cdp.eval(`document.querySelector('[data-act="sav-details"][data-sav="month"]').click()`);
    await sleep(250);
    out.detailsTake = await cdp.eval(`(() => {
      const s = document.querySelector(".sav-details");
      return s ? s.innerText : "";
    })()`);
    check(/Savings rate · take-home/.test(out.detailsTake), "details title is the take-home rate");
    check(/from your budget/i.test(out.detailsTake) && /from your paycheck/i.test(out.detailsTake) && /from your employer/i.test(out.detailsTake), "three groups");
    check(/House fund/.test(out.detailsTake) === false && /401k cash/.test(out.detailsTake), "details match the exclusion");
    check(out.dash.month.indexOf("14%") >= 0, "dashboard month shows 14% after exclusion, got " + out.dash.month);
    check(out.detailsTake.indexOf("14%") >= 0, "details show the same 14%");
    if (SHOTS) await cdp.shot(SHOTS + "/sav-details-takehome.png");
    await cdp.eval(`document.querySelector('[data-act="close-modal"]').click()`);

    /* 2. Typed-in pay beats a stub. Custom "Parking" counts; "Gym" does not. Employer on both sides. */
    await boot(baseState((s) => { typedPay(s); withStub(s); s.months = { "2026-11": s.months["2026-11"] }; }));
    out.typed = await rate(2026, 11, 11);
    const t = out.typed;
    check(t && t.label === "Savings rate · gross pay" && t.source === "typed", "typed-in pay beats the stub");
    check(t && near(t.budget, 750) && near(t.paycheck, 300) && near(t.employer, 100) && near(t.gross, 4000), "1150 savings on 4000 gross + 100 employer");
    check(t && near(t.savings, 1150) && near(t.divisor, 4100) && near(t.rate, 1150 / 4100), "employer on both sides");
    check(t && t.paycheckItems.some((it) => it.name === "Parking") && !t.paycheckItems.some((it) => it.name === "Gym"), "custom marked parking counts; gym does not");
    check(t && !t.paycheckItems.some((it) => it.amount === 500), "stub 401k is not stacked on typed-in pay");
    out.dashGross = await cdp.eval(`(async () => {
      document.querySelector('[data-tab="stats"]').click();
      await new Promise((r) => setTimeout(r, 400));
      const btn = document.querySelector('[data-act="sav-details"][data-sav="month"]');
      return btn ? btn.textContent.replace(/\\s+/g, " ").trim() : "";
    })()`);
    check(out.dashGross.indexOf("28%") >= 0 && out.dashGross.indexOf("Savings rate · gross pay") >= 0, "dashboard gross label " + out.dashGross);
    if (SHOTS) await cdp.shot(SHOTS + "/sav-dash-gross.png");
    await cdp.eval(`document.querySelector('[data-act="sav-details"][data-sav="month"]').click()`);
    await sleep(250);
    out.detailsGross = await cdp.eval(`document.querySelector(".sav-details").innerText`);
    check(out.detailsGross.indexOf("28%") >= 0 && /from your paycheck/i.test(out.detailsGross) && /Parking/.test(out.detailsGross) && /from your employer/i.test(out.detailsGross), "details match dashboard and list three groups");
    check(/Gym/.test(out.detailsGross) === false, "excluded gym stays out of the details");
    if (SHOTS) await cdp.shot(SHOTS + "/sav-details-gross.png");
    await cdp.eval(`document.querySelector('[data-act="close-modal"]').click()`);
    await sleep(150);
    out.typedDot = await cdp.eval(`(async () => {
      document.querySelector('[data-tab="budget"]').click();
      await new Promise((r) => setTimeout(r, 250));
      document.querySelector('[data-act="sav-pay-link"]').click();
      await new Promise((r) => setTimeout(r, 250));
      document.querySelector('[data-act="it-true-flat"]').click();
      await new Promise((r) => setTimeout(r, 300));
      const dots = [...document.querySelectorAll(".it-line-sum")].map((row) => ({
        text: row.textContent.replace(/\\s+/g, " ").trim(),
        label: (row.querySelector(".it-sv") || {}).getAttribute ? row.querySelector(".it-sv").getAttribute("aria-label") : ""
      }));
      const er = document.querySelector('[data-act="it-er-form-sv"]');
      const help = [...document.querySelectorAll(".sheet .caption")].map((p) => p.textContent).join(" ");
      return { dots: dots, er: er ? er.getAttribute("aria-label") : "", help: help };
    })()`);
    check(out.typedDot.dots.some((d) => /Parking/.test(d.text) && d.text.indexOf("In") >= 0 && /Counts toward retirement savings/.test(d.label)), "parking dot says it counts");
    check(out.typedDot.dots.some((d) => /Gym/.test(d.text) && d.text.indexOf("Out") >= 0 && /Not counted toward retirement savings/.test(d.label)), "gym dot says it is not counted");
    check(/Counts toward retirement savings/.test(out.typedDot.er) && /Filled dot, In: counts toward retirement savings/.test(out.typedDot.help), "typed-in form explains the dot in words");
    if (SHOTS) await cdp.shot(SHOTS + "/sav-payroll-dot-typed.png");

    /* 3. Stub only, including a month with no gross. */
    await boot(baseState((s) => {
      s.plan = "premium";
      s.profile.payFrequency = "monthly";
      s.compensation.paychecksPerYear = 12;
      withStub(s);
      s.months["2025-3"] = month(2025, 3, 2000, [line("chk", "Checking", 200, "checking")], 1800)[1];
    }));
    out.stub = await rate(2026, 11, 11);
    out.noGross = await rate(2025, 3, 3);
    const st = out.stub;
    check(st && st.source === "stub" && st.label === "Savings rate · gross pay", "stub basis");
    check(st && st.paycheckItems.some((it) => it.name === "Parking") && !st.paycheckItems.some((it) => it.name === "Gym"), "stub counts only marked other deductions");
    check(st && st.employer > 0 && near(st.divisor, st.gross + st.employer) && near(st.savings, st.budget + st.paycheck + st.employer), "stub employer on both sides");
    check(out.noGross && out.noGross.rate == null && out.noGross.state === "no-gross", "missing gross is not a take-home rate");
    out.stubDot = await cdp.eval(`(async () => {
      document.querySelector('[data-tab="stats"]').click();
      await new Promise((r) => setTimeout(r, 300));
      const review = document.querySelector('[data-door="review"]');
      if (review) review.click();
      await new Promise((r) => setTimeout(r, 300));
      const door = document.querySelector('[data-door="paystubs"]');
      if (door) door.click();
      await new Promise((r) => setTimeout(r, 400));
      const pre = document.querySelector('[data-act="it-toggle"][data-g="pre"]');
      if (pre) pre.click();
      await new Promise((r) => setTimeout(r, 150));
      const post = document.querySelector('[data-act="it-toggle"][data-g="post"]');
      if (post) post.click();
      const rows = [...document.querySelectorAll(".it-now-line, .it-now-er")].map((row) => ({
        text: row.textContent.replace(/\\s+/g, " ").trim(),
        label: (row.querySelector(".it-sv") || {}).getAttribute ? row.querySelector(".it-sv").getAttribute("aria-label") : ""
      }));
      const key = (document.querySelector(".it-key") || {}).textContent || "";
      return { rows: rows, key: key.replace(/\\s+/g, " ").trim() };
    })()`);
    check(/Counts toward retirement savings/.test(out.stubDot.key) && /Not counted/.test(out.stubDot.key), "stub legend explains both states");
    check(out.stubDot.rows.some((r) => /Parking/.test(r.text) && /Counts toward retirement savings/.test(r.label) && r.text.indexOf("In") >= 0), "stub parking dot");
    check(out.stubDot.rows.some((r) => /Gym/.test(r.text) && /Not counted toward retirement savings/.test(r.label) && r.text.indexOf("Out") >= 0), "stub gym dot");
    if (SHOTS) {
      await cdp.eval(`const k = document.querySelector(".it-key"); if (k) k.scrollIntoView({ block: "center" });`);
      await sleep(150);
      await cdp.shot(SHOTS + "/sav-payroll-dot-stub.png");
    }

    /* 4. A 3-paycheck month weighs more than a 2-paycheck month. Two months together are summed, not averaged. */
    await boot(baseState((s) => {
      s.plan = "premium";
      s.year = 2026; s.month = 1;
      s.profile.payFrequency = "biweekly";
      s.compensation = {
        baseSalary: 26000, paychecksPerYear: 26, zipCode: "80202", filingStatus: "single", trueManual: true,
        employer401kMatch: 0, employer401kMatchIsPercent: false,
        preTax: [{ id: "401k", name: "401k", method: "fixed", value: 2600, on: true }],
        postTax: [], trueLines: [{ id: "401k", saves: true }]
      };
      const jan = month(2026, 1, 1000, [line("chk", "Checking", 100, "checking")], 900)[1];
      jan.transactions = [{ id: "txp", type: "income", date: "2026-01-02", amount: 1000, incomeId: "pay" }];
      const feb = month(2026, 2, 1000, [line("chk", "Checking", 100, "checking")], 900)[1];
      s.months = { "2026-1": jan, "2026-2": feb };
    }));
    out.jan = await rate(2026, 1, 1);
    out.feb = await rate(2026, 2, 2);
    out.both = await rate(2026, 1, 2);
    check(out.jan && near(out.jan.gross, 3000) && near(out.jan.paycheck, 300), "January is 3 paychecks: gross 3000, 401k 300");
    check(out.feb && near(out.feb.gross, 2000) && near(out.feb.paycheck, 200), "February is 2 paychecks: gross 2000, 401k 200");
    const avg = (out.jan.rate + out.feb.rate) / 2;
    check(out.both && near(out.both.savings, 700) && near(out.both.divisor, 5000) && near(out.both.rate, 0.14) && Math.abs(out.both.rate - avg) > 0.001, "two months are summed, not averaged");

    out.fail = fail;
    console.log(JSON.stringify(out));
    if (fail.length) process.exitCode = 1;
  } catch (err) {
    console.log(JSON.stringify({ error: String(err && err.stack || err), fail: fail }));
    process.exitCode = 1;
  } finally {
    chrome.kill("SIGKILL");
  }
})();
