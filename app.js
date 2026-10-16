/* Browser preview of Paper Trail. SwiftUI remains the source of truth. Cache bust v37.5.59.16. */
(function () {
  "use strict";

  var STORAGE_KEY = "PaperTrail.preview.v6";
  var DEFAULT_ENVELOPES = [
    "Savings",
    "Giving",
    "Housing",
    "Food",
    "Health",
    "Entertainment",
    "Subscriptions",
    "Transportation",
    "Personal",
    "Utilities",
    "Insurance",
    "Miscellaneous",
    "Debt"
  ];
  var SAMPLE_ASSIGNED = {
    Savings: 200,
    Giving: 0,
    Housing: 1000,
    Food: 500,
    Health: 90,
    Entertainment: 50,
    Subscriptions: 80,
    Transportation: 100,
    Personal: 40,
    Utilities: 200,
    Insurance: 150,
    Miscellaneous: 50,
    Debt: 60
  };
  var MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  var GROUPS = [
    { id: "cash", title: "Cash" },
    { id: "lifestyle", title: "Lifestyle / other assets" },
    { id: "taxable", title: "Investments (taxable)" },
    { id: "retirement", title: "Retirement" },
    { id: "realEstate", title: "Property" },
    { id: "debt", title: "Debt" }
  ];
  var CHART_INKS = [
    "var(--moss)",
    "var(--gold)",
    "var(--plum)",
    "var(--berry)"
  ];
  var NW_YEARS = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];
  var INCOME_YEARS = NW_YEARS.concat([2026]);
  var NW_LINES = [
    { name: "Checking", kind: "asset", group: "cash", amounts: [800, 1000, 1200, 1500, 1500, 2000, 2000, 2500, 3000, 3500] },
    { name: "Savings", kind: "asset", group: "cash", amounts: [500, 1500, 2500, 3000, 4000, 5000, 6000, 8000, 10000, 12000] },
    { name: "Car", kind: "asset", group: "lifestyle", amounts: [6000, 5500, 5000, 4500, 4000, 12000, 11000, 10000, 9000, 8000] },
    { name: "House Fund", kind: "asset", group: "lifestyle", amounts: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
    { name: "Brokerage", kind: "asset", group: "taxable", amounts: [0, 0, 1000, 2000, 4000, 6000, 7000, 9000, 12000, 15000] },
    { name: "Roth IRA", kind: "asset", group: "retirement", amounts: [0, 0, 0, 2000, 5000, 9000, 12000, 18000, 25000, 33000] },
    { name: "401k", kind: "asset", group: "retirement", amounts: [0, 0, 0, 0, 0, 2000, 6000, 11000, 18000, 26000] },
    { name: "Home loan", kind: "asset", group: "realEstate", amounts: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
    { name: "Student Loan", kind: "liability", group: "debt", amounts: [0, 0, 0, 0, 20000, 18000, 15000, 12000, 8000, 4000] }
  ];
  var ROTH_ADDITIONS = {
    2019: 2000,
    2020: 3000,
    2021: 3500,
    2022: 3000,
    2023: 4000,
    2024: 5000,
    2025: 5000
  };

  var OLD_SAMPLE_INCOMES = [28000, 32000, 36000, 42000, 45000, 52000, 58000, 64000, 68800, 72800, 0];
  var SAMPLE_INCOMES = [20000, 24000, 30000, 34000, 38000, 42000, 46000, 48000, 55000, 62000, 0];
  var PRETAX_SPECS = [
    { id: "medical", name: "Medical Insurance", method: "fixed" },
    { id: "dental", name: "Dental", method: "fixed" },
    { id: "vision", name: "Vision", method: "fixed" },
    { id: "401k", name: "401k", method: "percentGross" },
    { id: "ltd", name: "Long Term Disability", method: "fixed" },
    { id: "life", name: "Life Insurance", method: "fixed" },
    { id: "commuter", name: "Commuter Plan", method: "fixed" },
    { id: "fsa", name: "FSA", method: "fixed" },
    { id: "hsa", name: "HSA", method: "fixed" }
  ];

  var uid = 1;
  var state = null;
  var envelopeEditMode = false;
  var TX_PAGE = 200;
  var spendShowLimit = TX_PAGE;
  var spendSearch = "";
  var quickSpendLineId = "";
  var ritual = { step: 0, destKey: "" };
  var spendDraft = null;
  var mattersReturnToProfile = false;
  var lastPaintKey = "";
  var profileHighlightDocId = "";
  var profileDocDraft = null;
  var pendingDocFile = null;
  var vaultPickMode = false;
  var pendingScreenUi = null;
  var modalReturnScreenTop = null;
  /* v37.5.59.6 (QA): the row a sheet was opened from, and where it sat in the viewport. After Save we
   * put that row back at the same offset — a raw scrollTop jumps when content above it changes
   * (e.g. the first Net worth save adds Equity returns / Trend / Allocation above the Cash rows). */
  var modalReturnAnchor = null;
  var payStubUndo = {};
  var compWhatIfOpen = false;
  var sheetTriggerEl = null;
  var pendingFocusRestore = null;
  var pendingClockAdvance = false;
  var midnightTimer = null;
  var ignoreClicksUntil = 0;
  var searchTimer = null;
  var clickAnchor = null;
  /** Live money field mid-keystroke; blocks focus from re-arming replaceAll after estimate paint. */
  var editingMoneyEl = null;
  var moneyEntryMemo = null; // v37.5.59.2: decimal entry survives a mid-edit re-render
  var VAULT_TYPES = (window.GradeMath && window.GradeMath.vaultTypes) || [
    { id: "insurance", title: "Insurance" },
    { id: "mortgage", title: "Mortgage" },
    { id: "loan", title: "Loan" },
    { id: "other", title: "Other" }
  ];
  var VAULT_FREQ = (window.GradeMath && window.GradeMath.vaultFrequencies) || [
    { id: "monthly", title: "Monthly", suffix: "/ mo" },
    { id: "quarterly", title: "Quarterly", suffix: "/ qtr" },
    { id: "semiannual", title: "Semiannual", suffix: "/ 6 mo" },
    { id: "annual", title: "Annual", suffix: "/ yr" }
  ];
  var LINE_SCRIPT_STYLE = "font-family:'PaperTrailScript','PaperTrailScriptAlt',cursive !important;font-size:24px;font-weight:500;font-style:normal;letter-spacing:0.02em;line-height:1.15";
  var DOC_SLOTS = [
    { id: "payStubs", title: "Pay stubs" },
    { id: "insurance", title: "Insurance" },
    { id: "loans", title: "Loans" },
    { id: "k401", title: "401k" },
    { id: "other", title: "Other" }
  ];
  var DOC_DB_NAME = "PaperTrail.preview.docs.v1";
  var DOC_STORE = "files";
  var docDb = null;

  function lineNameButton(name, extraClass, attrs) {
    return '<button class="line-name' + (extraClass || "") + '" type="button" style="' + LINE_SCRIPT_STYLE + '"' +
      (attrs ? " " + attrs : "") + '><span class="line-name-ink" style="' + LINE_SCRIPT_STYLE + '">' +
      esc(name) + "</span></button>";
  }

  function lineNameSpan(name) {
    return '<span class="line-name line-name-ink" style="' + LINE_SCRIPT_STYLE + '">' + esc(name) + "</span>";
  }

  function nextId() {
    return "id-" + (uid++);
  }

  function ymKey(year, month) {
    return year + "-" + month;
  }

  function pad(n) {
    return n < 10 ? "0" + n : String(n);
  }

  function isoDate(year, month, day) {
    return year + "-" + pad(month) + "-" + pad(day);
  }

  /* v37.5.59.12: YYYY-MM-DD → {year, month}, or null. */
  function parseTxYearMonth(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ""));
    if (!m) return null;
    var y = Number(m[1]), mo = Number(m[2]);
    if (!(y >= 2000 && y <= 2100) || !(mo >= 1 && mo <= 12)) return null;
    return { year: y, month: mo };
  }

  function currentYearMonth() {
    var now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  }

  function offsetMonth(year, month, delta) {
    var m = month + delta;
    var y = year;
    while (m > 12) { m -= 12; y += 1; }
    while (m < 1) { m += 12; y -= 1; }
    return { year: y, month: m };
  }

  function cents(n) {
    return Math.round((Number(n) || 0) * 100);
  }

  function centsFromDigits(value) {
    var digits = String(value == null ? "" : value).replace(/\D/g, "");
    if (!digits) return 0;
    return parseInt(digits, 10) / 100;
  }

  function nextPaycheckName(month) {
    var names = (month.incomes || []).map(function (item) { return item.name; });
    var n = 1;
    while (names.indexOf("Paycheck " + n) >= 0) n += 1;
    return "Paycheck " + n;
  }

  function isPaycheckName(name) {
    return /^Paycheck(\s+\d+)?$/.test(String(name || "").trim());
  }

  function roundCents(n) {
    return Math.round((Number(n) || 0) * 100) / 100;
  }

  var SS_WAGE_BASE = 184500;
  var SS_RATE = 0.062;
  var MEDICARE_RATE = 0.0145;
  var ADD_MEDICARE_RATE = 0.009;
  var ADD_MEDICARE_THRESHOLD = 200000;
  var FED_STD = 16100;
  var FED_STD_MFJ = 32200;
  var ADD_MEDICARE_THRESHOLD_MFJ = 250000;
  var FED_BRACKETS = [
    [12400, 0.10],
    [50400, 0.12],
    [105700, 0.22],
    [201775, 0.24],
    [256225, 0.32],
    [640600, 0.35],
    [99999999, 0.37]
  ];
  var FED_BRACKETS_MFJ = [
    [24800, 0.10],
    [100800, 0.12],
    [211400, 0.22],
    [403550, 0.24],
    [512450, 0.32],
    [768700, 0.35], // v37.5.59.3: 2026 MFJ 35% tops out at $768,700 (Rev. Proc. 2025-32; was 1,281,200)
    [99999999, 0.37]
  ];
  var PAY_FREQUENCIES = [
    { id: "weekly", label: "Weekly", checks: 52 },
    { id: "biweekly", label: "Biweekly", checks: 26 },
    { id: "semimonthly", label: "Semi-monthly", checks: 24 },
    { id: "monthly", label: "Monthly", checks: 12 }
  ];
  /* v37.5.59.3: 2026 Minnesota table (MN Dept. of Revenue, Dec 16 2025) — was the older
   * 14,575 / 32,570 / 106,990 / 198,630 single table with no married version. */
  var MN_STD = 15300;
  var MN_STD_MFJ = 30600;
  var MN_BRACKETS = [
    [33310, 0.0535],
    [109430, 0.0680],
    [203150, 0.0785],
    [99999999, 0.0985]
  ];
  var MN_BRACKETS_MFJ = [
    [48700, 0.0535],
    [193480, 0.0680],
    [337930, 0.0785],
    [99999999, 0.0985]
  ];

  function defaultPreTax() {
    return PRETAX_SPECS.map(function (spec) {
      return { id: spec.id, name: spec.name, method: spec.method, value: 0 };
    });
  }

  function defaultCompensation() {
    return {
      baseSalary: 0,
      bonusTargetPercent: 0,
      employee401kValue: 0,
      employee401kIsPercent: true,
      employer401kBase: 0,
      employer401kBaseIsPercent: true,
      employer401kMatch: 0,
      employer401kMatchIsPercent: true,
      hsaDeferral: 0,
      otherDeductions: 0,
      zipCode: "",
      filingStatus: "single",
      paychecksPerYear: 26,
      preTax: defaultPreTax(),
      postTax: []
    };
  }

  function ensurePreTax(rows) {
    var list = (rows || []).map(function (row) {
      return {
        id: row.id,
        name: row.name,
        method: row.method || "fixed",
        value: Number(row.value) || 0
      };
    });
    PRETAX_SPECS.forEach(function (spec) {
      if (!list.some(function (row) { return row.id === spec.id; })) {
        list.push({ id: spec.id, name: spec.name, method: spec.method, value: 0 });
      }
    });
    return list.sort(function (a, b) {
      var order = PRETAX_SPECS.map(function (spec) { return spec.id; });
      var ai = order.indexOf(a.id);
      var bi = order.indexOf(b.id);
      if (ai < 0) ai = 99;
      if (bi < 0) bi = 99;
      return ai - bi;
    });
  }

  function migrateCompensation(plan) {
    plan = plan || defaultCompensation();
    if (!plan.preTax || !plan.preTax.length) {
      plan.preTax = defaultPreTax();
      var k401 = plan.preTax.filter(function (row) { return row.id === "401k"; })[0];
      if (k401) {
        k401.method = plan.employee401kIsPercent === false ? "fixed" : "percentGross";
        k401.value = Number(plan.employee401kValue) || 0;
      }
      var hsa = plan.preTax.filter(function (row) { return row.id === "hsa"; })[0];
      if (hsa) hsa.value = Number(plan.hsaDeferral) || 0;
      if (Number(plan.otherDeductions) > 0) {
        plan.preTax.push({
          id: "other",
          name: "Other",
          method: "fixed",
          value: Number(plan.otherDeductions) || 0
        });
      }
    }
    plan.preTax = ensurePreTax(plan.preTax);
    if (plan.filingStatus !== "married") plan.filingStatus = "single";
    /* v37.5.59.16: employer base/match default to % entry. Saved dollar values keep $ mode; an empty $0 flips to %. */
    if (plan.employer401kBaseIsPercent == null) plan.employer401kBaseIsPercent = !(Number(plan.employer401kBase) > 0);
    if (plan.employer401kMatchIsPercent == null) plan.employer401kMatchIsPercent = !(Number(plan.employer401kMatch) > 0);
    plan.postTax = (plan.postTax || []).map(function (row) {
      return {
        id: row.id || nextId(),
        name: row.name || "",
        method: row.method || "fixed",
        value: Number(row.value) || 0
      };
    });
    if (plan.payStubSnapshot && typeof plan.payStubSnapshot === "object") {
      plan.payStubSnapshot = plan.payStubSnapshot;
    } else {
      plan.payStubSnapshot = null;
    }
    return plan;
  }

  function zipPrefixState(prefix) {
    if (prefix === 5) return "NY";
    if (prefix >= 6 && prefix <= 9) return "PR";
    if (prefix >= 10 && prefix <= 27) return "MA";
    if (prefix >= 28 && prefix <= 29) return "RI";
    if (prefix >= 30 && prefix <= 38) return "NH";
    if (prefix >= 39 && prefix <= 49) return "ME";
    if ((prefix >= 50 && prefix <= 54) || (prefix >= 56 && prefix <= 59)) return "VT";
    if (prefix >= 60 && prefix <= 69) return "CT";
    if (prefix >= 70 && prefix <= 89) return "NJ";
    if (prefix >= 100 && prefix <= 149) return "NY";
    if (prefix >= 150 && prefix <= 196) return "PA";
    if (prefix >= 197 && prefix <= 199) return "DE";
    if (prefix >= 200 && prefix <= 205) return "DC";
    if (prefix >= 206 && prefix <= 219) return "MD";
    if (prefix >= 220 && prefix <= 246) return "VA";
    if (prefix >= 247 && prefix <= 268) return "WV";
    if (prefix >= 270 && prefix <= 289) return "NC";
    if (prefix >= 290 && prefix <= 299) return "SC";
    if (prefix >= 300 && prefix <= 319) return "GA";
    if (prefix >= 320 && prefix <= 349) return "FL";
    if (prefix >= 350 && prefix <= 369) return "AL";
    if (prefix >= 370 && prefix <= 385) return "TN";
    if (prefix >= 386 && prefix <= 397) return "MS";
    if (prefix >= 400 && prefix <= 427) return "KY";
    if (prefix >= 430 && prefix <= 459) return "OH";
    if (prefix >= 460 && prefix <= 479) return "IN";
    if (prefix >= 480 && prefix <= 499) return "MI";
    if (prefix >= 500 && prefix <= 528) return "IA";
    if (prefix >= 530 && prefix <= 549) return "WI";
    if (prefix >= 550 && prefix <= 567) return "MN";
    if (prefix >= 570 && prefix <= 577) return "SD";
    if (prefix >= 580 && prefix <= 588) return "ND";
    if (prefix >= 590 && prefix <= 599) return "MT";
    if (prefix >= 600 && prefix <= 629) return "IL";
    if (prefix >= 630 && prefix <= 658) return "MO";
    if (prefix >= 660 && prefix <= 679) return "KS";
    if (prefix >= 680 && prefix <= 693) return "NE";
    if (prefix >= 700 && prefix <= 714) return "LA";
    if (prefix >= 716 && prefix <= 729) return "AR";
    if (prefix >= 730 && prefix <= 749) return "OK";
    if (prefix >= 750 && prefix <= 799) return "TX";
    if (prefix >= 800 && prefix <= 816) return "CO";
    if (prefix >= 820 && prefix <= 831) return "WY";
    if (prefix >= 832 && prefix <= 838) return "ID";
    if (prefix >= 840 && prefix <= 847) return "UT";
    if (prefix >= 850 && prefix <= 865) return "AZ";
    if (prefix >= 870 && prefix <= 884) return "NM";
    if (prefix >= 889 && prefix <= 898) return "NV";
    if (prefix >= 900 && prefix <= 961) return "CA";
    if (prefix >= 967 && prefix <= 968) return "HI";
    if (prefix >= 970 && prefix <= 979) return "OR";
    if (prefix >= 980 && prefix <= 994) return "WA";
    if (prefix >= 995 && prefix <= 999) return "AK";
    return null;
  }

  var STATE_NAMES = {
    AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
    CO: "Colorado", CT: "Connecticut", DC: "District of Columbia", DE: "Delaware",
    FL: "Florida", GA: "Georgia", HI: "Hawaii", IA: "Iowa", ID: "Idaho", IL: "Illinois",
    IN: "Indiana", KS: "Kansas", KY: "Kentucky", LA: "Louisiana", MA: "Massachusetts",
    MD: "Maryland", ME: "Maine", MI: "Michigan", MN: "Minnesota", MO: "Missouri",
    MS: "Mississippi", MT: "Montana", NC: "North Carolina", ND: "North Dakota",
    NE: "Nebraska", NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico",
    NV: "Nevada", NY: "New York", OH: "Ohio", OK: "Oklahoma", OR: "Oregon",
    PA: "Pennsylvania", PR: "Puerto Rico", RI: "Rhode Island", SC: "South Carolina",
    SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VA: "Virginia",
    VT: "Vermont", WA: "Washington", WI: "Wisconsin", WV: "West Virginia", WY: "Wyoming"
  };

  function resolveZip(zip) {
    var digits = String(zip || "").replace(/\D/g, "");
    if (!digits) return { location: null, helper: "Add ZIP for state tax" };
    if (digits.length < 5) return { location: null, helper: "Add ZIP for state tax" };
    var value = parseInt(digits.slice(0, 5), 10);
    var code = zipPrefixState(Math.floor(value / 100));
    if (!code) return { location: null, helper: "ZIP not recognized — no state tax" };
    var locality = null;
    if (code === "NY" && ((value >= 10000 && value <= 10499) || (value >= 11100 && value <= 11499) || (value >= 11600 && value <= 11699))) {
      locality = { id: "nyc", name: "New York City" };
    }
    if (code === "PA" && value >= 19100 && value <= 19199) {
      locality = { id: "philadelphia", name: "Philadelphia" };
    }
    return {
      location: { stateCode: code, stateName: STATE_NAMES[code] || code, locality: locality },
      helper: null
    };
  }

  function stateTaxFor(agi, location, married) {
    if (!location) return 0;
    switch (location.stateCode) {
      case "AK":
      case "FL":
      case "NV":
      case "NH":
      case "SD":
      case "TN":
      case "TX":
      case "WA":
      case "WY":
      case "PR":
        return 0;
      case "MN":
        return married
          ? progressiveTax(Math.max(0, agi - MN_STD_MFJ), MN_BRACKETS_MFJ)
          : progressiveTax(Math.max(0, agi - MN_STD), MN_BRACKETS);
      case "CA":
        return progressiveTax(Math.max(0, agi - 5540), [
          [10756, 0.01], [25499, 0.02], [40245, 0.04], [55866, 0.06],
          [70606, 0.08], [360659, 0.093], [432787, 0.103], [721314, 0.113], [99999999, 0.123]
        ]);
      case "NY":
        return progressiveTax(Math.max(0, agi - 8000), [
          [8500, 0.04], [11700, 0.045], [13900, 0.0525], [80650, 0.055],
          [215400, 0.06], [1077550, 0.0685], [5000000, 0.0965], [25000000, 0.103], [99999999, 0.109]
        ]);
      case "NJ":
        return progressiveTax(Math.max(0, agi), [
          [20000, 0.014], [35000, 0.0175], [40000, 0.035], [75000, 0.05525],
          [500000, 0.0637], [1000000, 0.0897], [99999999, 0.1075]
        ]);
      case "OR":
        return progressiveTax(Math.max(0, agi - 2745), [
          [4300, 0.0475], [10750, 0.0675], [125000, 0.0875], [99999999, 0.099]
        ]);
      case "WI":
        return progressiveTax(Math.max(0, agi - 13230), [
          [14320, 0.035], [28640, 0.044], [315310, 0.053], [99999999, 0.0765]
        ]);
      case "IA":
        return roundCents(Math.max(0, agi) * 0.038);
      case "IL":
        return roundCents(Math.max(0, agi - 2775) * 0.0495);
      case "PA":
        return roundCents(Math.max(0, agi) * 0.0307);
      case "NC":
        return roundCents(Math.max(0, agi - 12750) * 0.045);
      case "CO":
        return roundCents(Math.max(0, agi) * 0.044);
      case "AZ":
        return roundCents(Math.max(0, agi) * 0.025);
      case "MI":
        return roundCents(Math.max(0, agi) * 0.0425);
      case "IN":
        return roundCents(Math.max(0, agi) * 0.0305);
      case "UT":
        return roundCents(Math.max(0, agi) * 0.0455);
      case "KY":
        return roundCents(Math.max(0, agi - 3160) * 0.04);
      case "MA":
        return roundCents(Math.max(0, agi - 4400) * 0.05);
      case "GA":
        return roundCents(Math.max(0, agi - 12000) * 0.0519);
      case "VA":
        return progressiveTax(Math.max(0, agi - 8000), [
          [3000, 0.02], [5000, 0.03], [17000, 0.05], [99999999, 0.0575]
        ]);
      case "MD":
        return progressiveTax(Math.max(0, agi - 2550), [
          [1000, 0.02], [2000, 0.03], [3000, 0.04], [100000, 0.0475],
          [125000, 0.05], [150000, 0.0525], [250000, 0.055], [99999999, 0.0575]
        ]);
      case "CT":
        return progressiveTax(Math.max(0, agi), [
          [10000, 0.02], [50000, 0.045], [100000, 0.055], [200000, 0.06],
          [250000, 0.065], [500000, 0.069], [99999999, 0.0699]
        ]);
      case "OH":
        return progressiveTax(Math.max(0, agi), [
          [26050, 0], [100000, 0.0275], [99999999, 0.035]
        ]);
      case "DC":
        return progressiveTax(Math.max(0, agi), [
          [10000, 0.04], [40000, 0.06], [60000, 0.065], [250000, 0.085],
          [500000, 0.0925], [1000000, 0.0975], [99999999, 0.1075]
        ]);
      case "ND":
        return progressiveTax(Math.max(0, agi), [
          [44725, 0], [225975, 0.0195], [99999999, 0.025]
        ]);
      default:
        return roundCents(Math.max(0, agi) * 0.05);
    }
  }

  function localTaxFor(cash, agi, location) {
    if (!location || !location.locality) return 0;
    if (location.locality.id === "nyc") {
      return progressiveTax(Math.max(0, agi - 8000), [
        [12000, 0.03078], [25000, 0.03762], [50000, 0.03819], [99999999, 0.03876]
      ]);
    }
    if (location.locality.id === "philadelphia") return roundCents(Math.max(0, cash) * 0.0375);
    return 0;
  }

  function employerContribution(value, isPercent, cashPay) {
    var amount = Math.max(0, Number(value) || 0);
    if (!isPercent) return amount;
    return roundCents((Number(cashPay) || 0) * amount / 100);
  }

  function deductionAmount(row, gross, netAfterTax) {
    var value = Math.max(0, Number(row && row.value) || 0);
    if (!row || row.method === "fixed") return value;
    if (row.method === "percentNet") return roundCents((Number(netAfterTax) || 0) * value / 100);
    return roundCents((Number(gross) || 0) * value / 100);
  }

  function progressiveTax(taxable, brackets) {
    var income = Math.max(0, Number(taxable) || 0);
    var last = 0;
    var tax = 0;
    for (var i = 0; i < brackets.length; i++) {
      if (income <= last) break;
      var slice = Math.min(income, brackets[i][0]) - last;
      if (slice > 0) tax += slice * brackets[i][1];
      last = brackets[i][0];
    }
    return roundCents(tax);
  }


  // v37.5.14: the blended compensation savings rate is gone. Savings rates now come from
  // GradeMath.basicSavingsRate (Free) and GradeMath.trueSavingsRate (Premium + confirmed stub).

  function estimateCompensation(plan) {
    plan = migrateCompensation(plan || defaultCompensation());
    var base = Math.max(0, Number(plan.baseSalary) || 0);
    var bonus = roundCents(base * Math.max(0, Number(plan.bonusTargetPercent) || 0) / 100);
    var cash = roundCents(base + bonus);
    var preTaxAmounts = (plan.preTax || []).map(function (row) { return deductionAmount(row, cash, 0); });
    var pretax = preTaxAmounts.reduce(function (n, amt) { return n + amt; }, 0);
    var employee401k = 0;
    var hsa = 0;
    var ficaShield = 0;
    (plan.preTax || []).forEach(function (row, i) {
      if (row.id === "401k") employee401k = preTaxAmounts[i];
      if (row.id === "hsa") hsa = preTaxAmounts[i];
      if (row.id !== "401k") ficaShield += preTaxAmounts[i];
    });
    var employerBase = employerContribution(
      plan.employer401kBase,
      plan.employer401kBaseIsPercent,
      cash
    );
    var employerMatch = employerContribution(
      plan.employer401kMatch,
      plan.employer401kMatchIsPercent,
      cash
    );
    var filing = filingStatusOf(plan);
    var married = filing === "married";
    var agi = Math.max(0, cash - pretax);
    var federal = progressiveTax(
      Math.max(0, agi - (married ? FED_STD_MFJ : FED_STD)),
      married ? FED_BRACKETS_MFJ : FED_BRACKETS
    );
    var resolved = resolveZip(plan.zipCode);
    var state = stateTaxFor(agi, resolved.location, married);
    var local = localTaxFor(cash, agi, resolved.location);
    var ficaWages = Math.max(0, cash - ficaShield);
    var social = roundCents(Math.min(ficaWages, SS_WAGE_BASE) * SS_RATE);
    var addMed = married ? ADD_MEDICARE_THRESHOLD_MFJ : ADD_MEDICARE_THRESHOLD;
    var medicare = roundCents(ficaWages * MEDICARE_RATE) +
      roundCents(Math.max(0, ficaWages - addMed) * ADD_MEDICARE_RATE);
    var fica = social + medicare;
    var totalTax = federal + state + local + fica;
    var netAfterTax = Math.max(0, cash - pretax - totalTax);
    var posttax = (plan.postTax || []).reduce(function (n, row) {
      return n + deductionAmount(row, cash, netAfterTax);
    }, 0);
    var takeHome = roundCents(Math.max(0, netAfterTax - posttax));
    var totalComp = roundCents(cash + employerBase + employerMatch);
    var checks = Math.max(1, Math.min(52, Number(plan.paychecksPerYear) || checksForFrequency(payFrequencyOf(plan))));
    return {
      baseSalary: base,
      bonus: bonus,
      cashPay: cash,
      employee401k: employee401k,
      employerBase: employerBase,
      employerMatch: employerMatch,
      hsa: hsa,
      preTaxTotal: pretax,
      postTaxTotal: posttax,
      totalCompensation: totalComp,
      federalTax: federal,
      stateTax: state,
      localTax: local,
      socialSecurity: social,
      medicare: medicare,
      fica: fica,
      totalTax: totalTax,
      takeHome: takeHome,
      effectiveTaxRate: cash > 0 ? totalTax / cash : null,
      suggestedPaycheck: roundCents(takeHome / checks),
      stateLabel: resolved.location ? resolved.location.stateName : "State",
      localityLabel: resolved.location && resolved.location.locality ? resolved.location.locality.name : null,
      zipHelper: resolved.helper,
      usesMinnesota: !!(resolved.location && resolved.location.stateCode === "MN")
    };
  }

  function takeHomeSlices(est) {
    var slices = [];
    if (est.federalTax > 0) slices.push({ name: "Federal", amount: est.federalTax });
    if (est.stateTax > 0) slices.push({ name: est.stateLabel, amount: est.stateTax });
    if (est.localTax > 0) slices.push({ name: est.localityLabel || "Local", amount: est.localTax });
    if (est.fica > 0) slices.push({ name: "FICA", amount: est.fica });
    if (est.preTaxTotal > 0) slices.push({ name: "Pre-tax", amount: est.preTaxTotal });
    if (est.postTaxTotal > 0) slices.push({ name: "Post-tax", amount: est.postTaxTotal });
    if (est.takeHome > 0) slices.push({ name: "Take-home", amount: est.takeHome });
    return slices;
  }

  function dollarsFromDigits(value) {
    var raw = String(value == null ? "" : value).trim();
    if (!raw) return 0;
    // Formatted money from money() has a decimal → treat digit run as cents.
    // Raw whole-dollar typing ("4300") must stay dollars, not $43.00.
    var normalized = raw.replace(/[^0-9.]/g, "");
    if (/\.\d/.test(normalized)) {
      return Math.round(centsFromDigits(raw));
    }
    var digits = raw.replace(/\D/g, "");
    if (!digits) return 0;
    return parseInt(digits, 10) || 0;
  }

  function wholePercent(amount, income) {
    if (!income) return 0;
    return Math.round((Number(amount) || 0) / income * 100);
  }

  function planSlices(month, income) {
    if (!(income > 0)) return [];
    return month.categories.map(function (cat) {
      var assigned = catAssigned(cat);
      if (!(assigned > 0)) return null;
      return { name: cat.name + " " + wholePercent(assigned, income) + "%", amount: assigned };
    }).filter(Boolean).sort(function (a, b) { return b.amount - a.amount; });
  }

  function envelopeMode() {
    return state && (state.envelopeMode === "planned" || state.envelopeMode === "spent")
      ? state.envelopeMode
      : "remaining";
  }

  function envelopeAmount(assigned, spent) {
    var mode = envelopeMode();
    if (mode === "planned") return assigned;
    if (mode === "spent") return spent;
    return assigned - spent;
  }

  function txMatches(month, tx, query) {
    var q = String(query || "").replace(/^\s+|\s+$/g, "").toLowerCase();
    if (!q) return true;
    var hay = ((tx.payee || "") + " " + (tx.note || "") + " " + displayEnvelope(month, tx)).toLowerCase();
    if (isSplitTx(tx)) hay += " split";
    txLegs(tx).forEach(function (leg) {
      hay += " " + (leg.note || "") + " " + displayLegEnvelope(month, leg);
    });
    return hay.toLowerCase().indexOf(q) >= 0;
  }

  function txLegs(tx) {
    if (tx && tx.legs && tx.legs.length) return tx.legs;
    return [{
      id: (tx && tx.id ? tx.id + "-leg" : nextId()),
      categoryId: tx ? tx.categoryId : "",
      lineId: tx ? tx.lineId : "",
      amount: tx ? Number(tx.amount) || 0 : 0,
      refund: tx ? Number(tx.refund) || 0 : 0,
      note: tx ? (tx.note || "") : ""
    }];
  }

  /* v37.5.14: Expense vs Income. Missing type = expense (migration-safe). */
  function isIncomeTx(tx) {
    return !!(tx && tx.type === "income");
  }

  function expenseTxs(txs) {
    return (txs || []).filter(function (tx) { return !isIncomeTx(tx); });
  }

  /* Net spend of one expense (purchase − refunds; standalone refund is negative). Income → 0. */
  function txNet(tx) {
    return gm().txSummary(tx).net;
  }

  function incomeLineName(month, incomeId) {
    var line = (month.incomes || []).filter(function (item) { return String(item.id) === String(incomeId); })[0];
    return line ? (line.name || "Income") : "Income";
  }

  function receivedFor(month, incomeId) {
    return gm().incomeReceived(month.transactions || [], incomeId);
  }

  function isSplitTx(tx) {
    return !!(tx && tx.legs && tx.legs.length > 1);
  }

  function txTotal(tx) {
    if (tx && tx.legs && tx.legs.length) {
      return tx.legs.reduce(function (n, leg) { return n + (Number(leg.amount) || 0); }, 0);
    }
    return Number(tx && tx.amount) || 0;
  }

  function spentOnLine(month, lineId) {
    // Net of refunds; income transactions never count as spending.
    return gm().envelopeNetSpent(month.transactions || [], "line", lineId);
  }

  function displayLegEnvelope(month, leg) {
    var cat = (month.categories || []).filter(function (c) { return c.id === leg.categoryId; })[0];
    if (leg.lineId && cat) {
      var line = (cat.lines || []).filter(function (l) { return l.id === leg.lineId; })[0];
      if (line) return cat.name + " · " + line.name;
    }
    return cat ? cat.name : "No category";
  }

  function shouldMergeSplit(payee, notes, count) {
    if (count < 2) return false;
    if ((notes || []).some(function (n) { return /split\s+with/i.test(String(n || "")); })) return true;
    return /state\s*fair/i.test(String(payee || ""));
  }

  function migrateSplits(month) {
    var txs = month.transactions || [];
    var groups = {};
    txs.forEach(function (tx) {
      if (tx.legs && tx.legs.length) return;
      if (isIncomeTx(tx) || tx.refundKind) return;
      var payee = String(tx.payee || "").replace(/^\s+|\s+$/g, "").toLowerCase();
      if (!payee) return;
      var key = payee + "|" + String(tx.date || "");
      if (!groups[key]) groups[key] = [];
      groups[key].push(tx);
    });
    Object.keys(groups).forEach(function (key) {
      var members = groups[key];
      var notes = members.map(function (tx) { return tx.note || ""; });
      if (!shouldMergeSplit(members[0].payee, notes, members.length)) return;
      var keeper = members[0];
      keeper.legs = members.map(function (item) {
        return {
          id: nextId(),
          categoryId: item.categoryId,
          lineId: item.lineId,
          amount: Number(item.amount) || 0,
          note: String(item.note || "").replace(/\s*split with.*$/i, "").replace(/^\s+|\s+$/g, "")
        };
      });
      keeper.amount = txTotal(keeper);
      keeper.note = "";
      keeper.categoryId = keeper.legs[0].categoryId;
      keeper.lineId = keeper.legs[0].lineId;
      var drop = {};
      members.slice(1).forEach(function (item) { drop[item.id] = true; });
      month.transactions = month.transactions.filter(function (tx) { return !drop[tx.id]; });
    });
  }

  function migrateLoanFields(month) {
    (month.categories || []).forEach(function (cat) {
      (cat.lines || []).forEach(function (line) {
        if (line.loanBalance == null) line.loanBalance = 0;
        if (line.loanApr == null) line.loanApr = 0;
        if (line.loanMinPayment == null) line.loanMinPayment = 0;
        if (line.loanOriginalBalance == null) line.loanOriginalBalance = 0;
        if (line.loanDebtType == null) line.loanDebtType = "";
      });
    });
  }

  function migrateTransactions(month) {
    (month.transactions || []).forEach(function (tx) {
      if (tx.note == null) tx.note = "";
    });
    migrateSplits(month);
    migrateLoanFields(month);
  }

  function incomesMatchSeries(map, series) {
    return INCOME_YEARS.every(function (year, i) {
      return (Number(map[year]) || 0) === (series[i] || 0);
    });
  }

  function migrateWorthIncome(worth) {
    if (!worth) return;
    if (!worth.income) worth.income = {};
    if (!worth.notes) worth.notes = {};
    if (worth.blank) {
      // v37.5.15: books started from the welcome survey never get sample incomes back-filled.
    } else if (incomesMatchSeries(worth.income, OLD_SAMPLE_INCOMES)) {
      INCOME_YEARS.forEach(function (year, i) {
        worth.income[year] = SAMPLE_INCOMES[i] || 0;
      });
    } else {
      INCOME_YEARS.forEach(function (year, i) {
        if (worth.income[year] == null) worth.income[year] = SAMPLE_INCOMES[i] || 0;
      });
    }
    (worth.lines || []).forEach(function (line) {
      if (!line.employerMatch) line.employerMatch = {};
      if (!line.employerBase) line.employerBase = {};
      if (line.loanBalance == null) line.loanBalance = 0;
      if (line.loanApr == null) line.loanApr = 0;
      if (line.loanMinPayment == null) line.loanMinPayment = 0;
      if (line.loanOriginalBalance == null) line.loanOriginalBalance = 0;
      if (line.loanDebtType == null) line.loanDebtType = "";
    });
    migrateSplitRetirementAccounts(worth);
  }

  /* Combined 401k/IRA statement lines become two accounts. The old balance stays on 401k; IRA starts at $0. */
  function migrateSplitRetirementAccounts(worth) {
    if (!worth || !worth.lines) return;
    var lines = worth.lines;
    var hasIra = lines.some(function (line) { return String(line.name || "") === "IRA"; });
    var i;
    for (i = 0; i < lines.length; i++) {
      var line = lines[i];
      var name = String(line.name || "");
      if (name !== "Retirement (401k / IRA)" && name !== "401k + IRA") continue;
      line.name = "401k";
      if (hasIra) continue;
      var years = {};
      Object.keys(line.amounts || {}).forEach(function (year) { years[year] = true; });
      Object.keys(line.additions || {}).forEach(function (year) { years[year] = true; });
      var amounts = {};
      var additions = {};
      Object.keys(years).forEach(function (year) {
        amounts[year] = 0;
        additions[year] = 0;
      });
      lines.splice(i + 1, 0, {
        id: nextId(),
        name: "IRA",
        kind: "asset",
        group: "retirement",
        sortOrder: (Number(line.sortOrder) || 0) + 1,
        amounts: amounts,
        additions: additions,
        employerMatch: {},
        employerBase: {},
        loanBalance: 0,
        loanApr: 0,
        loanMinPayment: 0,
        loanOriginalBalance: 0,
        loanDebtType: ""
      });
      hasIra = true;
      i += 1;
    }
  }

  function migrateIncome(month) {
    (month.incomes || []).forEach(function (item) {
      if (item.name === "Paycheck") item.name = "Paycheck 1";
    });
    if (!month.incomes || !month.incomes.length) {
      month.incomes = [{
        id: nextId(),
        name: "Paycheck 1",
        amount: 0,
        date: isoDate(month.year, month.month, 1)
      }];
    }
  }

  function money(n) {
    return formatMoney(n, 2);
  }

  /* Year-over-year columns only. Statements keep cents. */
  function moneyWhole(n) {
    return formatMoney(Math.round(Number(n) || 0), 0);
  }

  function formatMoney(n, digits) {
    var value = Number(n) || 0;
    var abs = Math.abs(value);
    var formatted = abs.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: digits,
      maximumFractionDigits: digits
    });
    return value < 0 ? "-" + formatted : formatted;
  }

  function percent(ratio) {
    return (ratio * 100).toLocaleString("en-US", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }) + "%";
  }

  function signedMoney(n) {
    var formatted = money(n);
    return n > 0 ? "+" + formatted : formatted;
  }

  function tone(n) {
    if (n > 0) return "moss";
    if (n < 0) return "rust";
    return "ink";
  }

  function esc(text) {
    return String(text == null ? "" : text).replace(/[&<>"']/g, function (ch) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch];
    });
  }

  function seedWorth() {
    return {
      years: NW_YEARS.slice(),
      notes: {},
      lines: NW_LINES.map(function (line, index) {
        var amounts = {};
        var additions = {};
        NW_YEARS.forEach(function (year, i) {
          amounts[year] = line.amounts[i];
          additions[year] = line.name === "Roth IRA" ? (ROTH_ADDITIONS[year] || 0) : 0;
        });
        return { id: nextId(), name: line.name, kind: line.kind, group: line.group, sortOrder: index, amounts: amounts, additions: additions, employerMatch: {}, employerBase: {}, loanBalance: 0, loanApr: 0, loanMinPayment: 0, loanOriginalBalance: 0, loanDebtType: line.kind === "liability" && /student/i.test(line.name) ? "student" : "" };
      }),
      income: (function () {
        var map = {};
        INCOME_YEARS.forEach(function (year, i) { map[year] = SAMPLE_INCOMES[i] || 0; });
        return map;
      })()
    };
  }

  function defaultLineNames(envelope) {
    /* v37.5.59.16: new-user default. Existing users' months are never rewritten. */
    if (envelope === "Giving") return ["Tithes / Charity"];
    return envelope === "Food" ? ["Groceries", "Restaurants"] : [envelope];
  }

  function sampleLines(envelope) {
    if (envelope === "Food") {
      return [{ name: "Groceries", assigned: 400 }, { name: "Restaurants", assigned: 100 }];
    }
    if (envelope === "Giving") return [{ name: "Tithes / Charity", assigned: 0 }];
    return [{ name: envelope, assigned: SAMPLE_ASSIGNED[envelope] || 0 }];
  }

  function makeLines(specs) {
    return specs.map(function (spec, i) {
      return {
        id: nextId(),
        name: spec.name,
        assigned: Number(spec.assigned) || 0,
        sortOrder: i,
        loanBalance: 0,
        loanApr: 0,
        loanMinPayment: 0,
        loanOriginalBalance: 0,
        loanDebtType: ""
      };
    });
  }

  function sortedLines(cat) {
    return (cat.lines || []).slice().sort(function (a, b) { return a.sortOrder - b.sortOrder; });
  }

  function reindexLines(cat) {
    sortedLines(cat).forEach(function (line, i) { line.sortOrder = i; });
  }

  function catAssigned(cat) {
    var lines = cat.lines || [];
    if (!lines.length) return Number(cat.assigned) || 0;
    return lines.reduce(function (n, line) { return n + (Number(line.assigned) || 0); }, 0);
  }

  function findLine(month, lineId) {
    var found = null;
    (month.categories || []).forEach(function (cat) {
      (cat.lines || []).forEach(function (line) {
        if (line.id === lineId) found = { cat: cat, line: line };
      });
    });
    return found;
  }

  function lineSpends(month, lineId) {
    var rows = [];
    (month.transactions || []).forEach(function (tx) {
      if (isIncomeTx(tx)) return;
      var legs = txLegs(tx);
      var nets = gm().txLegBreakdown(tx);
      legs.forEach(function (leg, i) {
        if (String(leg.lineId) === String(lineId)) {
          var b = nets[i] || { net: Number(leg.amount) || 0, refund: 0 };
          rows.push({
            payee: tx.payee,
            amount: b.net,
            date: tx.date,
            note: leg.note || tx.note || "",
            split: isSplitTx(tx),
            refund: b.refund > 0 ? gm().refundLabel(tx, money) : ""
          });
        }
      });
    });
    return rows.sort(function (a, b) { return a.date < b.date ? 1 : -1; });
  }

  function lineSpendList(month, lineId) {
    var txs = lineSpends(month, lineId);
    var html = '<p class="sheet-label">This month</p>';
    if (!txs.length) {
      return html + '<p class="empty">No spending on this line yet.</p>';
    }
    txs.forEach(function (tx) {
      html += '<div class="sheet-tx"><div><div class="name">' + esc(tx.payee || "Spend") +
        (tx.split ? ' <span class="split-stamp">Split</span>' : "") +
        (tx.refund ? ' <span class="refund-chip">' + esc(tx.refund) + "</span>" : "") +
        '</div><span class="caption">' + esc(displayDate(tx.date)) +
        (tx.note ? " · " + esc(tx.note) : "") +
        "</span></div><span class='mono'>" + money(tx.amount) + "</span></div>";
    });
    return html;
  }

  function displayEnvelope(month, tx) {
    if (isIncomeTx(tx)) return "Income · " + incomeLineName(month, tx.incomeId);
    if (isSplitTx(tx)) return "Split";
    var cat = month.categories.filter(function (c) { return c.id === tx.categoryId; })[0];
    if (tx.lineId && cat) {
      var line = (cat.lines || []).filter(function (l) { return l.id === tx.lineId; })[0];
      if (line) return cat.name + " · " + line.name;
    }
    return cat ? cat.name : "No category";
  }

  function migrateSubsections(month) {
    (month.categories || []).forEach(function (cat) {
      if (cat.lines && cat.lines.length) return;
      if (cat.name === "Food") {
        var groceries = { id: nextId(), name: "Groceries", assigned: Number(cat.assigned) || 0, sortOrder: 0 };
        cat.lines = [
          groceries,
          { id: nextId(), name: "Restaurants", assigned: 0, sortOrder: 1 }
        ];
        (month.transactions || []).forEach(function (tx) {
          if (tx.categoryId === cat.id && !tx.lineId) tx.lineId = groceries.id;
        });
      } else {
        var line = { id: nextId(), name: cat.name, assigned: Number(cat.assigned) || 0, sortOrder: 0 };
        cat.lines = [line];
        (month.transactions || []).forEach(function (tx) {
          if (tx.categoryId === cat.id && !tx.lineId) tx.lineId = line.id;
        });
      }
    });
  }

  function seedBudgetMonth(year, month) {
    var cats = DEFAULT_ENVELOPES.map(function (name, i) {
      var lines = makeLines(sampleLines(name));
      return {
        id: nextId(),
        name: name,
        assigned: SAMPLE_ASSIGNED[name] || 0,
        sortOrder: i,
        lines: lines
      };
    });
    var food = cats.filter(function (c) { return c.name === "Food"; })[0];
    var groceries = food.lines.filter(function (l) { return l.name === "Groceries"; })[0];
    var restaurants = food.lines.filter(function (l) { return l.name === "Restaurants"; })[0];
    var misc = cats.filter(function (c) { return c.name === "Miscellaneous"; })[0];
    var miscLine = misc && misc.lines[0];
    var debt = cats.filter(function (c) { return c.name === "Debt"; })[0];
    if (debt && debt.lines[0]) {
      debt.lines[0].loanBalance = 8500;
      debt.lines[0].loanApr = 6.8;
      debt.lines[0].loanMinPayment = 60;
    }
    var cantinaId = nextId();
    return {
      year: year,
      month: month,
      incomes: [
        { id: nextId(), name: "Paycheck 1", amount: 2800, date: isoDate(year, month, 1) },
        { id: nextId(), name: "Side project", amount: 400, date: isoDate(year, month, 12) }
      ],
      categories: cats,
      transactions: [
        {
          id: nextId(),
          payee: "Market",
          amount: 62.4,
          date: isoDate(year, month, 3),
          categoryId: food.id,
          lineId: groceries.id,
          note: "Weekly groceries"
        },
        {
          id: cantinaId,
          payee: "Taco Place",
          amount: 78.77,
          date: isoDate(year, month, 4),
          categoryId: food.id,
          lineId: restaurants.id,
          note: "",
          legs: [
            { id: nextId(), categoryId: food.id, lineId: restaurants.id, amount: 35, note: "" },
            { id: nextId(), categoryId: misc.id, lineId: miscLine.id, amount: 43.77, note: "" }
          ]
        }
      ]
    };
  }

  function sortedCategories(month) {
    return month.categories.slice().sort(function (a, b) { return a.sortOrder - b.sortOrder; });
  }

  function reindexCategories(month) {
    sortedCategories(month).forEach(function (cat, i) { cat.sortOrder = i; });
  }

  function deleteEnvelope(month, id) {
    var cat = month.categories.filter(function (c) { return c.id === id; })[0];
    if (!cat) return;
    var spendCount = month.transactions.filter(function (t) {
      return txLegs(t).some(function (leg) { return leg.categoryId === id; });
    }).length;
    var message = "Delete " + cat.name + "?";
    if (spendCount === 0) {
      message += " This envelope has no spending.";
    } else if (spendCount === 1) {
      message += " This also deletes 1 spend on this envelope. Spends are not left behind without a category.";
    } else {
      message += " This also deletes " + spendCount + " spends on this envelope. Spends are not left behind without a category.";
    }
    if (!window.confirm(message)) return;
    month.transactions = month.transactions.filter(function (t) {
      if (!t.legs || !t.legs.length) return t.categoryId !== id;
      t.legs = t.legs.filter(function (leg) { return leg.categoryId !== id; });
      if (!t.legs.length) return false;
      t.amount = txTotal(t);
      t.categoryId = t.legs[0].categoryId;
      t.lineId = t.legs[0].lineId;
      return true;
    });
    month.categories = month.categories.filter(function (c) { return c.id !== id; });
    reindexCategories(month);
    closeModal();
    saveState();
    render();
  }

  /* ---- v37.5.59.16: press-and-hold menu on envelopes (Move / Delete) ---------------------------- */
  function txsTouchingLine(month, lineId) {
    return (month.transactions || []).filter(function (t) {
      return txLegs(t).some(function (leg) { return leg.lineId === lineId; });
    });
  }

  function reassignLineTxs(month, fromLineId, toCat, toLine) {
    (month.transactions || []).forEach(function (t) {
      if (t.legs && t.legs.length) {
        t.legs.forEach(function (leg) {
          if (leg.lineId === fromLineId) { leg.categoryId = toCat.id; leg.lineId = toLine.id; }
        });
        t.categoryId = t.legs[0].categoryId;
        t.lineId = t.legs[0].lineId;
      } else if (t.lineId === fromLineId) {
        t.categoryId = toCat.id;
        t.lineId = toLine.id;
      }
    });
  }

  function fallbackLineFor(month, exceptCatId, exceptLineId) {
    var found = null;
    var cats = sortedCategories(month);
    var same = cats.filter(function (c) { return c.id === exceptCatId; })[0];
    function pick(cat) {
      var l = sortedLines(cat).filter(function (x) { return x.id !== exceptLineId; })[0];
      return l ? { cat: cat, line: l } : null;
    }
    if (same) found = pick(same);
    if (!found) {
      cats.filter(function (c) { return /^miscellaneous$/i.test(c.name) && c.id !== exceptCatId; }).forEach(function (c) { found = found || pick(c); });
    }
    if (!found) cats.forEach(function (c) { if (c.id !== exceptCatId) found = found || pick(c); });
    return found;
  }

  /* Delete an envelope line but keep its transaction history (moved to a sensible neighbour). */
  function deleteLineKeepHistory(month, lineId) {
    var found = findLine(month, lineId);
    if (!found) return;
    var txs = txsTouchingLine(month, lineId);
    if (!txs.length) { deleteLine(month, lineId); return; }
    var target = fallbackLineFor(month, found.cat.id, lineId);
    if (!target) { deleteLine(month, lineId); return; }
    var assigned = Number(found.line.assigned) || 0;
    var msg = "Delete " + found.line.name + "?\n\nIt has " + txs.length + (txs.length === 1 ? " transaction" : " transactions") +
      (assigned > 0 ? " and " + money(assigned) + " assigned" : "") +
      ". The transactions are kept and move to “" + target.line.name + "”" +
      (assigned > 0 ? "; the assigned dollars return to Left to assign" : "") + ".";
    if (!window.confirm(msg)) return;
    var wasDebt = found.cat && /^debt$/i.test(found.cat.name);
    var debtName = found.line.name;
    reassignLineTxs(month, lineId, target.cat, target.line);
    found.cat.lines = (found.cat.lines || []).filter(function (l) { return l.id !== lineId; });
    reindexLines(found.cat);
    if (wasDebt) removeBudgetNwLiability(debtName);
    closeModal();
    saveState();
    render();
  }

  function deleteEnvelopeKeepHistory(month, catId) {
    var cat = month.categories.filter(function (c) { return c.id === catId; })[0];
    if (!cat) return;
    var txs = (month.transactions || []).filter(function (t) {
      return txLegs(t).some(function (leg) { return leg.categoryId === catId; });
    });
    if (!txs.length) { deleteEnvelope(month, catId); return; }
    var target = null;
    var others = sortedCategories(month).filter(function (c) { return c.id !== catId; });
    var misc = others.filter(function (c) { return /^miscellaneous$/i.test(c.name); })[0] || others[0];
    if (misc && sortedLines(misc).length) target = { cat: misc, line: sortedLines(misc)[0] };
    if (!target) { deleteEnvelope(month, catId); return; }
    var assigned = catAssigned(cat);
    var msg = "Delete " + cat.name + "?\n\nIt has " + txs.length + (txs.length === 1 ? " transaction" : " transactions") +
      (assigned > 0 ? " and " + money(assigned) + " assigned" : "") +
      ". The transactions are kept and move to “" + target.cat.name + " › " + target.line.name + "”" +
      (assigned > 0 ? "; the assigned dollars return to Left to assign" : "") + ".";
    if (!window.confirm(msg)) return;
    (month.transactions || []).forEach(function (t) {
      if (t.legs && t.legs.length) {
        t.legs.forEach(function (leg) {
          if (leg.categoryId === catId) { leg.categoryId = target.cat.id; leg.lineId = target.line.id; }
        });
        t.categoryId = t.legs[0].categoryId;
        t.lineId = t.legs[0].lineId;
      } else if (t.categoryId === catId) {
        t.categoryId = target.cat.id;
        t.lineId = target.line.id;
      }
    });
    month.categories = month.categories.filter(function (c) { return c.id !== catId; });
    reindexCategories(month);
    closeModal();
    saveState();
    render();
  }

  function moveLineToCategory(month, lineId, destCatId) {
    var found = findLine(month, lineId);
    var dest = month.categories.filter(function (c) { return c.id === destCatId; })[0];
    if (!found || !dest || dest.id === found.cat.id) return;
    found.cat.lines = (found.cat.lines || []).filter(function (l) { return l.id !== lineId; });
    reindexLines(found.cat);
    found.line.sortOrder = (dest.lines || []).length;
    dest.lines = (dest.lines || []).concat([found.line]);
    (month.transactions || []).forEach(function (t) {
      if (t.legs && t.legs.length) {
        t.legs.forEach(function (leg) { if (leg.lineId === lineId) leg.categoryId = dest.id; });
        t.categoryId = t.legs[0].categoryId;
      } else if (t.lineId === lineId) {
        t.categoryId = dest.id;
      }
    });
    closeModal();
    saveState();
    render();
  }

  function openEnvelopeMenu(kind, id) {
    var month = ensureMonth(state.year, state.month);
    var html = '<div class="sheet env-menu">';
    if (kind === "line") {
      var found = findLine(month, id);
      if (!found) return;
      var lines = sortedLines(found.cat);
      var idx = lines.map(function (l) { return l.id; }).indexOf(id);
      html += "<h3>" + esc(found.line.name) + '</h3><p class="caption">' + esc(found.cat.name) + "</p>" +
        '<div class="env-menu-list">' +
        '<button type="button" data-act="envmenu-line-up" data-id="' + esc(id) + '"' + (idx <= 0 ? " disabled" : "") + ">Move up</button>" +
        '<button type="button" data-act="envmenu-line-down" data-id="' + esc(id) + '"' + (idx >= lines.length - 1 ? " disabled" : "") + ">Move down</button>";
      if (!/^debt$/i.test(found.cat.name)) {
        sortedCategories(month).filter(function (c) { return c.id !== found.cat.id && !/^debt$/i.test(c.name); }).forEach(function (c) {
          html += '<button type="button" data-act="envmenu-line-to" data-id="' + esc(id) + '" data-to="' + esc(c.id) + '">Move to ' + esc(c.name) + "</button>";
        });
      }
      html += '<button class="danger" type="button" data-act="envmenu-line-delete" data-id="' + esc(id) + '">Delete…</button></div>';
    } else {
      var cat = month.categories.filter(function (c) { return c.id === id; })[0];
      if (!cat) return;
      var cats = sortedCategories(month);
      var ci = cats.map(function (c) { return c.id; }).indexOf(id);
      html += "<h3>" + esc(cat.name) + '</h3><div class="env-menu-list">' +
        '<button type="button" data-act="envmenu-cat-up" data-id="' + esc(id) + '"' + (ci <= 0 ? " disabled" : "") + ">Move up</button>" +
        '<button type="button" data-act="envmenu-cat-down" data-id="' + esc(id) + '"' + (ci >= cats.length - 1 ? " disabled" : "") + ">Move down</button>" +
        '<button class="danger" type="button" data-act="envmenu-cat-delete" data-id="' + esc(id) + '">Delete…</button></div>';
    }
    html += '<div class="sheet-actions"><button type="button" data-act="close-modal">Cancel</button></div></div>';
    var modal = document.getElementById("modal");
    modal.hidden = false;
    modal.innerHTML = html;
    try { if (navigator.vibrate) navigator.vibrate(12); } catch (err) {}
  }

  /* Long-press (~500ms) on a budget envelope row. Cancels on movement (so scrolling still works); the
     click that follows a fired press is swallowed so it never also opens the edit sheet. */
  (function () {
    var timer = null;
    var startX = 0;
    var startY = 0;
    var suppressUntil = 0;
    function cancel() { if (timer) { clearTimeout(timer); timer = null; } }
    document.addEventListener("pointerdown", function (ev) {
      if (ev.button > 0 || state.tab !== "budget") return;
      var row = ev.target.closest && ev.target.closest("#screen .envelope-line, #screen .envelope-head");
      if (!row || envelopeEditMode) return;
      cancel();
      startX = ev.clientX;
      startY = ev.clientY;
      var isLine = row.classList.contains("envelope-line");
      var idEl = isLine ? row.querySelector("[data-act=edit-line-item]") : row.querySelector("[data-act=open-envelope]");
      var id = idEl && idEl.getAttribute("data-id");
      if (!id) return;
      timer = setTimeout(function () {
        timer = null;
        suppressUntil = Infinity;
        openEnvelopeMenu(isLine ? "line" : "cat", id);
      }, 500);
    }, true);
    document.addEventListener("pointermove", function (ev) {
      if (timer && (Math.abs(ev.clientX - startX) > 8 || Math.abs(ev.clientY - startY) > 8)) cancel();
    }, true);
    ["pointerup", "pointercancel", "scroll", "dragstart"].forEach(function (name) {
      document.addEventListener(name, cancel, true);
    });
    /* The click that ends a fired press can arrive any time after release; swallow it, then re-arm shortly after pointerup. */
    ["pointerup", "pointercancel"].forEach(function (name) {
      document.addEventListener(name, function () {
        if (suppressUntil === Infinity) suppressUntil = Date.now() + 450;
      }, true);
    });
    document.addEventListener("contextmenu", function (ev) {
      if (ev.target.closest && ev.target.closest("#screen .envelope-line, #screen .envelope-head")) ev.preventDefault();
    }, true);
    window.addEventListener("click", function (ev) {
      if (Date.now() < suppressUntil) {
        ev.preventDefault();
        ev.stopImmediatePropagation();
      }
    }, true);
  })();

  function moveEnvelope(month, id, delta) {
    var ordered = sortedCategories(month);
    var index = -1;
    ordered.forEach(function (c, i) { if (c.id === id) index = i; });
    var next = index + delta;
    if (index < 0 || next < 0 || next >= ordered.length) return;
    var swap = ordered[index];
    ordered[index] = ordered[next];
    ordered[next] = swap;
    ordered.forEach(function (c, i) { c.sortOrder = i; });
    saveState();
    render();
  }

  function deleteLine(month, lineId) {
    var found = findLine(month, lineId);
    if (!found) return;
    var spendCount = month.transactions.filter(function (t) {
      return txLegs(t).some(function (leg) { return leg.lineId === lineId; });
    }).length;
    var message = "Delete " + found.line.name + "?";
    if (spendCount === 0) {
      message += " This line has no spending. Assigned dollars return to leftover.";
    } else if (spendCount === 1) {
      message += " This also deletes 1 spend on this line.";
    } else {
      message += " This also deletes " + spendCount + " spends on this line.";
    }
    if (!window.confirm(message)) return;
    var wasDebt = found.cat && /^debt$/i.test(found.cat.name);
    var debtName = found.line.name;
    month.transactions = month.transactions.filter(function (t) {
      if (!t.legs || !t.legs.length) return t.lineId !== lineId;
      t.legs = t.legs.filter(function (leg) { return leg.lineId !== lineId; });
      if (!t.legs.length) return false;
      t.amount = txTotal(t);
      t.categoryId = t.legs[0].categoryId;
      t.lineId = t.legs[0].lineId;
      return true;
    });
    found.cat.lines = (found.cat.lines || []).filter(function (l) { return l.id !== lineId; });
    reindexLines(found.cat);
    if (wasDebt) removeBudgetNwLiability(debtName);
    closeModal();
    saveState();
    render();
  }

  function moveLine(month, lineId, delta) {
    var found = findLine(month, lineId);
    if (!found) return;
    var ordered = sortedLines(found.cat);
    var index = -1;
    ordered.forEach(function (l, i) { if (l.id === lineId) index = i; });
    var next = index + delta;
    if (index < 0 || next < 0 || next >= ordered.length) return;
    var swap = ordered[index];
    ordered[index] = ordered[next];
    ordered[next] = swap;
    ordered.forEach(function (l, i) { l.sortOrder = i; });
    saveState();
    render();
  }

  function emptyMonth(year, month, templates) {
    return {
      year: year,
      month: month,
      incomes: [{
        id: nextId(),
        name: "Paycheck 1",
        amount: 0,
        date: isoDate(year, month, 1)
      }],
      categories: templates.map(function (tpl, i) {
        var name = typeof tpl === "string" ? tpl : tpl.name;
        var lineNames = typeof tpl === "string"
          ? defaultLineNames(name)
          : (tpl.lineNames && tpl.lineNames.length ? tpl.lineNames : defaultLineNames(name));
        return {
          id: nextId(),
          name: name,
          assigned: 0,
          sortOrder: i,
          lines: lineNames.map(function (lineName, li) {
            return { id: nextId(), name: lineName, assigned: 0, sortOrder: li, loanBalance: 0, loanApr: 0, loanMinPayment: 0, loanOriginalBalance: 0, loanDebtType: "" };
          })
        };
      }),
      transactions: []
    };
  }

  function defaultFoo() {
    return {
      deductibles: 0,
      deductiblesCovered: null,
      birthday: "",
      matchFull: false,
      matchPercent: "",
      noDebt: false,
      emergencyFunded: false,
      emergencyAmount: 0,
      rothOnTrack: false,
      rothAmount: 0,
      maxEmployerPlans: false,
      hyperOnTrack: false,
      hyperPercent: "",
      prepayFuture: false,
      prepayLowInterest: false,
      loanExtras: {},
      highestDeductible: 4500
    };
  }

  function migrateFoo(raw) {
    var foo = defaultFoo();
    if (!raw || typeof raw !== "object") return foo;
    Object.keys(foo).forEach(function (key) {
      if (raw[key] == null) return;
      foo[key] = raw[key];
    });
    if (!foo.loanExtras || typeof foo.loanExtras !== "object") foo.loanExtras = {};
    if (foo.birthday == null) foo.birthday = "";
    if (foo.deductiblesCovered !== true && foo.deductiblesCovered !== false) foo.deductiblesCovered = null;
    if (!raw || raw.highestDeductible == null || raw.highestDeductible === "") {
      foo.highestDeductible = 4500;
    } else {
      foo.highestDeductible = Number(raw.highestDeductible) || 0;
    }
    return foo;
  }

  function defaultMatters() {
    return {
      financeStart: "",
      usesBudget: "",
      budgetMethod: "",
      budgetMethodOther: "",
      budgetAppName: "",
      aspireWealthy: "",
      wealthPossible: "",
      education: "",
      millionaireGeneration: "",
      frugal: "",
      riskTolerance: 5,
      okIlliquidity: "",
      deeperOpen: false,
      needSignificance: 0,
      needAcceptance: 0,
      needIntelligence: 0,
      needPity: 0,
      needStrength: 0,
      goals: [],
      customGoals: [],
      goalPlans: []
    };
  }

  function migrateMatters(raw) {
    var matters = defaultMatters();
    if (!raw || typeof raw !== "object") return matters;
    Object.keys(matters).forEach(function (key) {
      if (raw[key] == null) return;
      matters[key] = raw[key];
    });
    if (!Array.isArray(matters.goals)) matters.goals = [];
    if (!Array.isArray(matters.customGoals)) matters.customGoals = [];
    if (!Array.isArray(matters.goalPlans)) matters.goalPlans = [];
    matters.goalPlans = matters.goalPlans.filter(function (plan) {
      return plan && plan.id;
    }).map(function (plan) {
      return {
        id: String(plan.id),
        targetDate: plan.targetDate ? String(plan.targetDate) : "",
        amount: Number(plan.amount) || 0
      };
    });
    if ((raw.riskTolerance == null || raw.riskTolerance === "") && raw.growVsSafety != null) {
      var grow = Number(raw.growVsSafety) || 3;
      matters.riskTolerance = Math.max(1, Math.min(10, 11 - Math.round(grow * 2)));
    }
    var risk = Number(matters.riskTolerance);
    matters.riskTolerance = risk >= 1 && risk <= 10 ? Math.round(risk) : 5;
    if (!matters.okIlliquidity && raw.okayWithLowRateDebt) {
      matters.okIlliquidity = raw.okayWithLowRateDebt === "yes" || raw.okayWithLowRateDebt === "no"
        ? raw.okayWithLowRateDebt
        : "";
    }
    if (matters.budgetMethod !== "app" && matters.budgetMethod !== "paper" && matters.budgetMethod !== "other") {
      matters.budgetMethod = "";
    }
    matters.budgetMethodOther = String(matters.budgetMethodOther || "");
    matters.budgetAppName = String(matters.budgetAppName || "");
    ["needSignificance", "needAcceptance", "needIntelligence", "needPity", "needStrength"].forEach(function (key) {
      var n = Number(matters[key]) || 0;
      matters[key] = n >= 0 && n <= 5 ? Math.round(n) : 0;
    });
    return matters;
  }

  function defaultProfile() {
    return {
      name: "",
      birthday: "",
      filingStatus: "single",
      payFrequency: "biweekly",
      dependents: 0,
      phone: "",
      documents: []
    };
  }

  function checksForFrequency(freq) {
    var row = PAY_FREQUENCIES.filter(function (item) { return item.id === freq; })[0];
    return row ? row.checks : 26;
  }

  function frequencyFromChecks(n) {
    var checks = Number(n) || 26;
    var row = PAY_FREQUENCIES.filter(function (item) { return item.checks === checks; })[0];
    if (row) return row.id;
    if (checks >= 45) return "weekly";
    if (checks >= 25) return "biweekly";
    if (checks >= 18) return "semimonthly";
    return "monthly";
  }

  function migrateProfile(raw, foo, plan) {
    var profile = defaultProfile();
    var had = raw && typeof raw === "object";
    if (had) {
      Object.keys(profile).forEach(function (key) {
        if (raw[key] == null) return;
        profile[key] = raw[key];
      });
    }
    if (!profile.birthday && foo && foo.birthday) profile.birthday = foo.birthday;
    if (profile.filingStatus !== "married") profile.filingStatus = "single";
    var deps = Number(profile.dependents);
    profile.dependents = deps >= 0 && isFinite(deps) ? Math.round(deps) : 0;
    if (!Array.isArray(profile.documents)) profile.documents = [];
    profile.documents = migrateDocuments(profile.documents);
    profile.phone = String(profile.phone || "");
    if (!had || !PAY_FREQUENCIES.some(function (item) { return item.id === raw.payFrequency; })) {
      profile.payFrequency = frequencyFromChecks(plan && plan.paychecksPerYear);
    }
    return profile;
  }

  function normalizeDocSlot(slot) {
    var raw = String(slot || "");
    if (raw === "401k" || raw === "k401k") return "k401";
    if (DOC_SLOTS.some(function (item) { return item.id === raw; })) return raw;
    return "other";
  }

  function docSlotTitle(slot) {
    var id = normalizeDocSlot(slot);
    var row = DOC_SLOTS.filter(function (item) { return item.id === id; })[0];
    return row ? row.title : "Other";
  }

  function defaultLinkedKind(slot) {
    slot = normalizeDocSlot(slot);
    if (slot === "payStubs") return "income";
    if (slot === "insurance") return "insurance";
    if (slot === "loans") return "loan";
    if (slot === "k401") return "k401";
    return "";
  }

  function vaultNum(value) {
    var n = Number(value);
    return isFinite(n) && n > 0 ? n : 0;
  }

  function emptyVaultFields() {
    return {
      title: "",
      titleCustomized: false,
      vaultType: "",
      vaultTypeCustomized: false,
      provider: "",
      policyNumber: "",
      insuredItems: "",
      premium: 0,
      premiumFrequency: "monthly",
      deductibles: "",
      limits: "",
      termRenewal: "",
      notes: "",
      balance: 0,
      rate: 0,
      payment: 0,
      escrow: "",
      term: "",
      property: "",
      minPayment: 0,
      originalBalance: 0,
      addToNetWorth: null,
      touchedFields: {},
      pdfAutofillReview: false,
      pdfAutofilledFields: [],
      pdfScanned: false,
      pdfQuickReadFailed: false,
      collateral: "",
      payStubReview: false,
      payStubReadFailed: false,
      payStubManual: false,
      payStubConfirmed: false,
      payStubManualError: "",
      payStubPending: null
    };
  }

  function cloneVaultDoc(doc) {
    if (!doc || typeof doc !== "object") return null;
    var blanks = emptyVaultFields();
    var row = {
      id: doc.id || nextId(),
      slot: normalizeDocSlot(doc.slot),
      fileName: doc.fileName || "File",
      mime: doc.mime || "",
      hasBlob: !!doc.hasBlob,
      dataUrl: typeof doc.dataUrl === "string" ? doc.dataUrl : "",
      linkedKind: doc.linkedKind || "",
      linkedId: doc.linkedId || "",
      linkedName: doc.linkedName || ""
    };
    Object.keys(blanks).forEach(function (key) {
      if (key === "premium" || key === "balance" || key === "rate" || key === "payment" ||
          key === "minPayment" || key === "originalBalance") {
        row[key] = vaultNum(doc[key] != null ? doc[key] : blanks[key]);
      } else if (key === "titleCustomized" || key === "vaultTypeCustomized" || key === "pdfAutofillReview" ||
          key === "pdfScanned" || key === "pdfQuickReadFailed" ||
          key === "payStubReview" || key === "payStubReadFailed" || key === "payStubManual" || key === "payStubConfirmed") {
        row[key] = !!doc[key];
      } else if (key === "addToNetWorth") {
        row[key] = doc[key] == null ? null : !!doc[key];
      } else if (key === "touchedFields") {
        row[key] = doc.touchedFields && typeof doc.touchedFields === "object" ? doc.touchedFields : {};
      } else if (key === "pdfAutofilledFields") {
        row[key] = Array.isArray(doc.pdfAutofilledFields) ? doc.pdfAutofilledFields.slice() : [];
      } else if (key === "payStubPending") {
        row[key] = doc.payStubPending && typeof doc.payStubPending === "object" ? doc.payStubPending : null;
      } else if (doc[key] != null && doc[key] !== "") {
        row[key] = doc[key];
      } else {
        row[key] = blanks[key];
      }
    });
    /* v37.5.57: keep cancelable-add flag through migrate/render clones. */
    if (doc._vaultDraft) row._vaultDraft = true;
    return row;
  }

  function migrateDocuments(docs) {
    if (!Array.isArray(docs)) return [];
    return docs.map(function (doc) {
      var row = cloneVaultDoc(doc);
      if (!row) return null;
      if (window.GradeMath && window.GradeMath.enrichVaultDoc) window.GradeMath.enrichVaultDoc(row);
      return row;
    }).filter(Boolean);
  }

  function documentsForStorage(docs) {
    if (!Array.isArray(docs)) return [];
    return docs.map(cloneVaultDoc).filter(Boolean).map(function (doc) {
      var row = {
        id: doc.id,
        slot: doc.slot,
        fileName: doc.fileName,
        mime: doc.mime || "",
        hasBlob: !!doc.hasBlob,
        linkedKind: doc.linkedKind || "",
        linkedId: doc.linkedId || "",
        linkedName: doc.linkedName || "",
        title: doc.title || "",
        titleCustomized: !!doc.titleCustomized,
        vaultType: doc.vaultType || "",
        vaultTypeCustomized: !!doc.vaultTypeCustomized,
        provider: doc.provider || "",
        policyNumber: doc.policyNumber || "",
        insuredItems: doc.insuredItems || "",
        premium: vaultNum(doc.premium),
        premiumFrequency: doc.premiumFrequency || "monthly",
        deductibles: doc.deductibles || "",
        limits: doc.limits || "",
        termRenewal: doc.termRenewal || "",
        notes: doc.notes || "",
        balance: vaultNum(doc.balance),
        rate: vaultNum(doc.rate),
        payment: vaultNum(doc.payment),
        escrow: doc.escrow || "",
        term: doc.term || "",
        property: doc.property || "",
        minPayment: vaultNum(doc.minPayment),
        originalBalance: vaultNum(doc.originalBalance),
        addToNetWorth: doc.addToNetWorth == null ? null : !!doc.addToNetWorth,
        touchedFields: doc.touchedFields && typeof doc.touchedFields === "object" ? doc.touchedFields : {},
        pdfAutofillReview: !!doc.pdfAutofillReview,
        pdfAutofilledFields: Array.isArray(doc.pdfAutofilledFields) ? doc.pdfAutofilledFields : [],
        pdfScanned: !!doc.pdfScanned,
        pdfQuickReadFailed: !!doc.pdfQuickReadFailed,
        collateral: doc.collateral || "",
        payStubReview: !!doc.payStubReview,
        payStubReadFailed: !!doc.payStubReadFailed,
        payStubManual: !!doc.payStubManual,
        payStubConfirmed: !!doc.payStubConfirmed,
        payStubManualError: typeof doc.payStubManualError === "string" ? doc.payStubManualError : "",
        payStubPending: doc.payStubPending && typeof doc.payStubPending === "object" ? doc.payStubPending : null
      };
      if (!row.hasBlob && doc.dataUrl) row.dataUrl = doc.dataUrl;
      return row;
    });
  }

  function openDocDb(done) {
    if (docDb) return done(null, docDb);
    if (!window.indexedDB) return done(new Error("no-idb"));
    var req = indexedDB.open(DOC_DB_NAME, 1);
    req.onupgradeneeded = function () {
      if (!req.result.objectStoreNames.contains(DOC_STORE)) req.result.createObjectStore(DOC_STORE);
    };
    req.onsuccess = function () {
      docDb = req.result;
      done(null, docDb);
    };
    req.onerror = function () { done(req.error || new Error("idb")); };
  }

  function putDocBlob(id, blob, done) {
    openDocDb(function (err, db) {
      if (err || !db) return done(err || new Error("idb"));
      var tx = db.transaction(DOC_STORE, "readwrite");
      tx.objectStore(DOC_STORE).put(blob, id);
      tx.oncomplete = function () { done(null); };
      tx.onerror = function () { done(tx.error || new Error("put")); };
    });
  }

  function getDocBlob(id, done) {
    openDocDb(function (err, db) {
      if (err || !db) return done(err || new Error("idb"));
      var tx = db.transaction(DOC_STORE, "readonly");
      var req = tx.objectStore(DOC_STORE).get(id);
      req.onsuccess = function () { done(null, req.result || null); };
      req.onerror = function () { done(req.error || new Error("get")); };
    });
  }

  function deleteDocBlob(id, done) {
    openDocDb(function (err, db) {
      if (err || !db) return (done || function () {})(err);
      var tx = db.transaction(DOC_STORE, "readwrite");
      tx.objectStore(DOC_STORE).delete(id);
      tx.oncomplete = function () { (done || function () {})(null); };
      tx.onerror = function () { (done || function () {})(tx.error); };
    });
  }

  function clearDocDb(done) {
    openDocDb(function (err, db) {
      if (err || !db) return (done || function () {})(err);
      var tx = db.transaction(DOC_STORE, "readwrite");
      tx.objectStore(DOC_STORE).clear();
      tx.oncomplete = function () { (done || function () {})(null); };
      tx.onerror = function () { (done || function () {})(tx.error); };
    });
  }

  function dataUrlToBlob(dataUrl) {
    try {
      var parts = String(dataUrl).split(",");
      var meta = parts[0] || "";
      var mime = (meta.match(/data:([^;]+)/) || [])[1] || "application/octet-stream";
      var binary = atob(parts[1] || "");
      var bytes = new Uint8Array(binary.length);
      for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      return new Blob([bytes], { type: mime });
    } catch (err) {
      return null;
    }
  }

  function migrateProfileDocBlobs() {
    state.profile = migrateProfile(state.profile, state.foo, state.compensation);
    var docs = state.profile.documents || [];
    var pending = docs.filter(function (doc) { return doc.dataUrl && !doc.hasBlob; });
    if (!pending.length) return;
    var i = 0;
    function next() {
      if (i >= pending.length) {
        saveState();
        return;
      }
      var doc = pending[i++];
      var blob = dataUrlToBlob(doc.dataUrl);
      if (!blob) return next();
      putDocBlob(doc.id, blob, function (err) {
        if (!err) {
          doc.hasBlob = true;
          doc.dataUrl = "";
        }
        next();
      });
    }
    next();
  }

  function guessDocSlot(fileName) {
    var lower = String(fileName || "").toLowerCase();
    if (/stub|pay\s*stub|earnings\s*statement|paycheck|gross\s*pay|net\s*pay/.test(lower)) return "payStubs";
    if (/insur|policy/.test(lower)) return "insurance";
    if (/mortgage|heloc|home\s*loan/.test(lower)) return "loans";
    if (/loan|note/.test(lower)) return "loans";
    if (/401/.test(lower)) return "k401";
    return "other";
  }

  function gm() {
    return window.GradeMath || {};
  }

  function inferVaultType(doc) {
    return gm().inferVaultType ? gm().inferVaultType(doc) : "other";
  }

  function guessVaultProvider(fileName, type) {
    return gm().guessVaultProvider ? gm().guessVaultProvider(fileName, type) : "";
  }

  function defaultVaultTitle(type, provider, fileName) {
    return gm().defaultVaultTitle
      ? gm().defaultVaultTitle(type, provider, fileName)
      : (provider ? String(type) + " — " + provider : String(type));
  }

  function docNeedsReview(doc) {
    return gm().docNeedsReview ? gm().docNeedsReview(doc) : true;
  }

  function vaultBadges(docs) {
    return gm().vaultBadges ? gm().vaultBadges(docs) : { total: (docs || []).length, review: 0 };
  }

  function vaultRowMoney(doc) {
    return gm().vaultRowMoney ? gm().vaultRowMoney(doc) : null;
  }

  function slotFromVaultType(type) {
    return gm().slotFromVaultType ? gm().slotFromVaultType(type) : "other";
  }

  function applyVaultTitle(doc, opts) {
    opts = opts || {};
    if (doc.titleCustomized && !opts.force) return;
    // v37.5.59.6 (QA): a pay stub card stays a pay stub ("Pay stub — Employer"), never the generic "Other".
    if (normalizeDocSlot(doc.slot) === "payStubs") {
      if (!/^Pay stub/.test(doc.title || "")) doc.title = "Pay stub";
      return;
    }
    doc.title = defaultVaultTitle(doc.vaultType, doc.provider, doc.fileName);
  }

  function applyVaultTypeToSlot(doc) {
    if (doc.vaultType === "other" && (doc.slot === "payStubs" || doc.slot === "k401")) return;
    doc.slot = slotFromVaultType(doc.vaultType);
    if (!doc.linkedKind) {
      var link = suggestDocLink(doc.slot);
      applyDocLink(doc, link);
    }
  }

  function isPdfFile(file, doc) {
    var mime = (file && file.type) || (doc && doc.mime) || "";
    var name = (file && file.name) || (doc && doc.fileName) || "";
    return /pdf/i.test(mime) || /\.pdf$/i.test(name);
  }

  function shouldAddVaultToNetWorth(doc) {
    if (gm().shouldAddVaultToNetWorth) return gm().shouldAddVaultToNetWorth(doc);
    var type = doc && (doc.vaultType || inferVaultType(doc));
    return (type === "loan" || type === "mortgage") && doc.addToNetWorth !== false;
  }

  function markVaultFieldTouched(doc, field) {
    if (!doc) return;
    if (!doc.touchedFields || typeof doc.touchedFields !== "object") doc.touchedFields = {};
    if (field) doc.touchedFields[field] = true;
    if (doc.pdfAutofillReview) doc.pdfAutofillReview = false;
  }

  function applyParsedVaultPdf(doc, parsed) {
    if (!gm().applyVaultPdfAutofill) return [];
    var result = gm().applyVaultPdfAutofill(doc, parsed, { touched: doc.touchedFields });
    if (result.filled && result.filled.length) {
      if (!doc.vaultTypeCustomized && parsed.vaultType) applyVaultTypeToSlot(doc);
      if (!doc.titleCustomized && result.filled.indexOf("title") < 0) applyVaultTitle(doc);
    }
    doc.pdfScanned = true;
    doc.pdfQuickReadFailed = false;
    var touched = doc.touchedFields || {};
    var type = doc.vaultType || (parsed && parsed.vaultType) || "";
    doc.pdfPremiumMissing = (type === "insurance" || doc.slot === "insurance") &&
      !(Number(doc.premium) > 0) && !touched.premium;
    return result.filled || [];
  }

  function pdfQuickReadCopy() {
    return gm().pdfQuickReadCopy ? gm().pdfQuickReadCopy()
      : "Couldn’t read this PDF quickly — edit premium or try a shorter declarations page";
  }

  function markPdfQuickReadFailed(doc) {
    if (!doc) return;
    doc.pdfScanned = true;
    doc.pdfQuickReadFailed = true;
    doc.pdfPremiumMissing = false;
  }


  function maybeAttachPayStubReview(doc, text, parsed) {
    if (!doc) return;
    var stub = (parsed && parsed.payStub) || null;
    if (!stub && gm().parsePayStubText) {
      try { stub = gm().parsePayStubText(text); } catch (err) { stub = null; }
    }
    var slot = normalizeDocSlot(doc.slot);
    var looks = !!(stub && ((stub.confidence || 0) >= 0.25 || stub.gross != null || stub.net != null));
    var forceSlot = slot === "payStubs";
    if (!looks && !forceSlot) return;
    if (!looks && forceSlot) {
      var thin = !(text && String(text).replace(/\s/g, ""));
      doc.payStubPending = stub || { confidence: 0, adapterId: "generic-us", otherDeductions: [], employer: "" };
      doc.payStubReview = true;
      doc.payStubReadFailed = thin;
      return;
    }
    if (!looks) return;
    doc.payStubPending = stub;
    doc.payStubReview = true;
    doc.payStubReadFailed = false;
    if (slot !== "payStubs" && !doc.vaultTypeCustomized &&
        (doc.vaultType === "other" || !doc.vaultType || doc.vaultType === "")) {
      doc.slot = "payStubs";
      doc.linkedKind = "income";
      doc.linkedId = "compensation";
      doc.linkedName = "Income statement";
      if (!doc.titleCustomized) {
        doc.title = stub.employer ? ("Pay stub — " + stub.employer) : "Pay stub";
      }
    } else if (slot === "payStubs" && !doc.titleCustomized && stub.employer) {
      doc.title = "Pay stub — " + stub.employer;
    }
  }

  /* v37.5.59.6 (QA): US date for people — 09/04/2026 (ISO stays in storage). */
  function usDate(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ""));
    return m ? m[2] + "/" + m[3] + "/" + m[1] : String(iso || "");
  }

  /* v37.5.59.6 (QA): the same stub (pay date + gross) already confirmed on another card. */
  function payStubDuplicateOf(doc) {
    var stub = doc && doc.payStubPending;
    if (!stub || !(Number(stub.gross) > 0) || !stub.payDate) return null;
    var docs = (state.profile && state.profile.documents) || [];
    for (var i = 0; i < docs.length; i++) {
      var d = docs[i];
      if (!d || d.id === doc.id || !d.payStubConfirmed || !d.payStubPending) continue;
      if (String(d.payStubPending.payDate || "") === String(stub.payDate) &&
          Math.abs((Number(d.payStubPending.gross) || 0) - Number(stub.gross)) < 0.005) return d;
    }
    return null;
  }

  function payStubReviewHtml(doc) {
    if (!doc || !doc.payStubReview) return "";
    var stub = doc.payStubPending || {};
    var dupOf = payStubDuplicateOf(doc);
    if (dupOf) {
      return '<section class="card paystub-review paystub-dup">' +
        '<p class="vault-review">Already in Vault</p>' +
        '<p class="caption">This pay stub (pay date ' + esc(usDate(stub.payDate)) + ", gross " + esc(money(stub.gross)) +
        ") is already in Vault as “" + esc(dupOf.title || "Pay stub") + "”, confirmed. Nothing was added to Income.</p>" +
        '<div class="sheet-actions">' +
        '<button class="planner-apply" type="button" data-act="paystub-dup-open" data-id="' + esc(doc.id) + '" data-keep="' + esc(dupOf.id) + '">Open the saved one</button>' +
        '<button class="text-btn" type="button" data-act="paystub-dup-discard" data-id="' + esc(doc.id) + '">Remove this copy</button>' +
        "</div></section>";
    }
    var failed = !!doc.payStubReadFailed || !!doc.payStubManual || (!(stub.gross > 0) && !(stub.net > 0));
    var html = '<section class="card paystub-review">';
    if (failed) {
      /* v37.5.59.5 (QA 37.5.59.4): say honestly what happened and offer manual entry — never a silent
       * "Autofilled from PDF" with nothing to review. */
      var noText = !!doc.payStubReadFailed && !doc.payStubManual;
      html += '<p class="vault-review">' + (doc.payStubManual && !doc.payStubReadFailed ? "Type your pay stub numbers"
          : noText ? "Couldn’t read this PDF on your device" : "Read the PDF, but found no pay-stub numbers") + "</p>" +
        '<p class="caption">' + (noText
          ? "No text came out of this file — it may be a scan or a photo. Type the numbers from your stub below (gross pay is required), or Cancel. Nothing is saved until you Confirm."
          : "Type the numbers from your stub below (gross pay is required), or Cancel. Nothing is saved until you Confirm.") + "</p>" +
        payStubManualFormHtml(doc) +
        (doc.payStubManualError ? '<p class="form-error" role="alert">' + esc(doc.payStubManualError) + "</p>" : "") +
        '<div class="sheet-actions">' +
        '<button class="planner-apply" type="button" data-act="paystub-confirm" data-id="' + esc(doc.id) + '">Confirm → Income</button>' +
        '<button class="text-btn" type="button" data-act="paystub-cancel" data-id="' + esc(doc.id) + '">Cancel</button>' +
        "</div></section>";
      return html;
    } else {
      html += '<p class="vault-review">Pay stub autofill — review before Income</p>' +
        '<p class="caption">Confirm writes these into Compensation. Cancel leaves Income untouched.</p>';
    }
    function row(label, val) {
      if (val == null || val === "") return "";
      var shown = typeof val === "number" ? money(val) : String(val);
      return '<div class="row dense"><span>' + esc(label) + '</span><span class="mono">' + esc(shown) + "</span></div>";
    }
    html += row("Employer", stub.employer || "");
    html += row("Pay period", (stub.payPeriodStart || "") && (stub.payPeriodEnd || "")
      ? (usDate(stub.payPeriodStart) + " → " + usDate(stub.payPeriodEnd)) : usDate(stub.payPeriodStart || stub.payPeriodEnd || ""));
    html += row("Pay date", usDate(stub.payDate));
    html += row("Gross", stub.gross);
    html += row("Net", stub.net);
    html += row("Federal tax", stub.federalTax);
    html += row("State tax", stub.stateTax);
    html += row("Social Security", stub.socialSecurity);
    html += row("Medicare", stub.medicare);
    html += row("FICA", stub.fica);
    html += row("Employee 401k", stub.employee401k);
    html += row("Employer 401k match", stub.employer401k);
    /* v37.5.59.4: DN401NC-style company base contribution — employer money, not pay, not a deduction. */
    html += row("Employer 401k base · not pay", stub.employer401kBase);
    html += row("HSA", stub.hsa);
    html += row("FSA", stub.fsa);
    (stub.otherTaxes || []).forEach(function (t) {
      html += row((t.name || "Other tax") + " (tax)", t.amount);
    });
    (stub.otherDeductions || []).forEach(function (d) {
      var tag = d.preTax === true ? " · pre-tax" : d.preTax === false ? " · after-tax" : " · not marked";
      html += row((d.name || "Other") + tag, d.amount);
    });
    /* v37.5.59.3: YTD columns drive taxes, brackets and True (actual so far + projected remaining checks). */
    if (stub.ytd && typeof stub.ytd === "object") {
      html += '<p class="sheet-label">Year to date</p>';
      html += row("Gross YTD", stub.ytd.gross);
      html += row("401k YTD", stub.ytd.employee401k);
      html += row("HSA YTD", stub.ytd.hsa);
      html += row("FSA YTD", stub.ytd.fsa);
      html += row("Federal tax YTD", stub.ytd.federalTax);
      html += row("State tax YTD", stub.ytd.stateTax);
      html += row("Social Security YTD", stub.ytd.socialSecurity);
      html += row("Medicare YTD", stub.ytd.medicare);
      html += row("Employer 401k base YTD · not pay", stub.ytd.employer401kBase);
      (stub.earningsLines || []).forEach(function (l) {
        var k = gm().earningsKind ? gm().earningsKind(l) : "base";
        if ((k === "bonus" || k === "variable") && Number(l.ytd) > 0) html += row((k === "bonus" ? "Bonus YTD · " : "Variable pay YTD · ") + (l.name || ""), l.ytd);
      });
    } else {
      html += '<p class="caption">No year-to-date column found — taxes and deductions will count this check and project the rest of the year from it; earlier paychecks need a stub with YTD.</p>';
    }
    html += paycheckCompositionHtml(stub);
    html += '<div class="sheet-actions">' +
      '<button class="planner-apply" type="button" data-act="paystub-confirm" data-id="' + esc(doc.id) + '">Confirm → Income</button>' +
      '<button class="text-btn" type="button" data-act="paystub-cancel" data-id="' + esc(doc.id) + '">Cancel</button>' +
      "</div></section>";
    return html;
  }

  var PAYSTUB_MANUAL_FIELDS = [
    ["gross", "Gross pay (this check)"], ["net", "Net pay"], ["federalTax", "Federal tax"], ["stateTax", "State tax"],
    ["socialSecurity", "Social Security"], ["medicare", "Medicare"], ["employee401k", "Your 401k"],
    ["employer401k", "Employer 401k match"], ["hsa", "HSA"], ["fsa", "FSA"]
  ];

  function payStubManualFormHtml(doc) {
    var stub = doc.payStubPending || {};
    return '<div class="paystub-manual">' +
      '<label class="field">Pay date<input type="date" data-act="paystub-field" data-field="payDate" data-id="' + esc(doc.id) +
      '" value="' + esc(stub.payDate || "") + '"></label>' +
      PAYSTUB_MANUAL_FIELDS.map(function (f) {
        var v = Number(stub[f[0]]);
        return '<label class="field">' + esc(f[1]) +
          '<input class="cents-input" data-cents="1" data-act="paystub-field" data-field="' + f[0] + '" data-id="' + esc(doc.id) +
          '" inputmode="decimal" autocomplete="off" type="text" value="' + esc(money(v > 0 ? v : 0)) + '"></label>';
      }).join("") + "</div>";
  }

  function updatePayStubField(el) {
    var doc = findProfileDoc(el.getAttribute("data-id") || "");
    if (!doc) return;
    if (!doc.payStubPending || typeof doc.payStubPending !== "object") doc.payStubPending = { confidence: 0, adapterId: "manual", otherDeductions: [] };
    var field = el.getAttribute("data-field") || "";
    if (field === "payDate") doc.payStubPending.payDate = el.value || "";
    else if (field) {
      var v = el.dataset && el.dataset.digits != null ? moneyFromDigits(el.dataset.digits, false) : centsFromDigits(el.value);
      doc.payStubPending[field] = v > 0 ? v : null;
    }
    doc.payStubManualError = "";
    saveState();
  }

  function confirmPayStubToIncome(docId) {
    var doc = findProfileDoc(docId || state.vaultDocId || "");
    if (!doc || !doc.payStubPending) return;
    var stub = doc.payStubPending;
    if (payStubDuplicateOf(doc)) { renderVaultPreserve(); return; } // never a second confirmed copy
    if (!(Number(stub.gross) > 0)) {
      // v37.5.59.5: a manual / unread stub needs at least gross pay before it can drive Income.
      // v37.5.59.6 (QA): keep the same header and show the error (it used to be dropped on re-render).
      doc.payStubManualError = "Type the gross pay from your stub first (Cancel to leave Income untouched).";
      saveState();
      renderVaultPreserve();
      return;
    }
    if (doc.payStubReadFailed || doc.payStubManual) stub.adapterId = stub.adapterId && stub.adapterId !== "generic-us" ? stub.adapterId : "manual";
    doc.payStubReadFailed = false;
    doc.payStubManual = false;
    doc.payStubManualError = "";
    var plan = migrateCompensation(state.compensation || defaultCompensation());
    var result = gm().applyPayStubToCompensation
      ? gm().applyPayStubToCompensation(plan, stub, {
          paychecksPerYear: plan.paychecksPerYear || checksForFrequency(payFrequencyOf(plan)),
          confirmedAt: new Date().toISOString(),
          // v37.5.59.3: deductions from actual YTD + projected remaining checks (all confirmed stubs)
          stubs: confirmedPayStubs(),
          frequency: payFrequencyOf(plan),
          hsaCoverage: hsaCoverageOf(),
          ageAtYearEnd: ageAtYearEnd(stub.payDate ? Number(String(stub.payDate).slice(0, 4)) : currentYearMonth().year),
          bonusMonth: bonusMonthOf(),
          bonusTargetPercent: Number(plan.bonusTargetPercent) || 0
        })
      : null;
    if (result && result.plan) state.compensation = migrateCompensation(result.plan);
    else {
      state.compensation = plan;
      state.compensation.payStubSnapshot = stub;
    }
    doc.payStubReview = false;
    doc.payStubConfirmed = true;
    delete payStubUndo[doc.id];
    doc.payStubPending = stub;
    saveState();
    renderVaultPreserve();
  }

  function cancelPayStubReview(docId) {
    var doc = findProfileDoc(docId || state.vaultDocId || "");
    if (!doc) return;
    var undo = payStubUndo[doc.id];
    delete payStubUndo[doc.id];
    if (undo) {
      // Put the card back exactly as it was before this upload (title, file, slot, type).
      Object.keys(doc).forEach(function (k) { if (!(k in undo)) delete doc[k]; });
      Object.keys(undo).forEach(function (k) { doc[k] = undo[k]; });
      doc.payStubReview = false;
      doc.payStubPending = null;
      doc.payStubReadFailed = false;
      doc.payStubManualError = "";
      saveState();
      renderVaultPreserve();
      return;
    }
    if (normalizeDocSlot(doc.slot) === "payStubs" && !/^Pay stub/.test(doc.title || "")) doc.title = "Pay stub";
    doc.payStubManualError = "";
    doc.payStubReview = false;
    doc.payStubPending = null;
    doc.payStubReadFailed = false;
    saveState();
    renderVaultPreserve();
  }


  function maybeAutofillVaultPdf(doc, blob, done) {
    done = done || function () {};
    if (!doc || !blob || !isPdfFile(blob, doc) || !gm().extractPdfText) {
      done();
      return;
    }
    function finishEmpty() {
      doc.pdfScanned = true;
      doc.pdfQuickReadFailed = true;
      doc.pdfPremiumMissing = false;
      if (normalizeDocSlot(doc.slot) === "payStubs") {
        doc.payStubReview = true;
        doc.payStubReadFailed = true;
        doc.payStubPending = { confidence: 0, adapterId: "generic-us", otherDeductions: [] };
      }
      done();
    }
    function parseBytes(bytes) {
      setTimeout(function () {
        if (!bytes || bytes.length > 1500000) {
          finishEmpty();
          return;
        }
        var text = "";
        var info = {};
        try {
          text = gm().extractPdfText(bytes, { maxMs: 200, maxPages: 3, info: info }) || "";
        } catch (err) {
          finishEmpty();
          return;
        }
        if (info.timedOut && (gm().pdfTextIsThin ? gm().pdfTextIsThin(text) : !String(text).replace(/\s/g, ""))) {
          finishEmpty();
          return;
        }
        try {
          var parsed = gm().parseVaultPdfFields ? gm().parseVaultPdfFields(text) : {};
          var ps = parsed && parsed.payStub;
          var isStub = normalizeDocSlot(doc.slot) === "payStubs" ||
            !!(ps && (ps.confidence || 0) >= 0.5 && (ps.gross > 0 || ps.net > 0));
          // v37.5.59.5: a pay stub never gets insurance/loan fields guessed from its text ("Autofilled from PDF").
          if (isStub) {
            doc.pdfScanned = true;
            doc.pdfQuickReadFailed = false;
          } else {
            applyParsedVaultPdf(doc, parsed);
          }
          maybeAttachPayStubReview(doc, text, parsed);
        } catch (err2) {
          doc.pdfScanned = true;
        }
        done();
      }, 0);
    }
    if (blob instanceof ArrayBuffer) {
      parseBytes(new Uint8Array(blob));
      return;
    }
    if (typeof Blob !== "undefined" && blob instanceof Blob && typeof blob.arrayBuffer === "function") {
      blob.arrayBuffer().then(function (buf) {
        parseBytes(new Uint8Array(buf));
      }).catch(function () {
        finishEmpty();
      });
      return;
    }
    if (typeof FileReader !== "undefined" && blob && blob.size != null) {
      var reader = new FileReader();
      reader.onload = function () {
        parseBytes(new Uint8Array(reader.result || []));
      };
      reader.onerror = function () {
        finishEmpty();
      };
      try { reader.readAsArrayBuffer(blob); } catch (err) {
        finishEmpty();
      }
      return;
    }
    done();
  }

  function mergeVaultPdfInto(existing, incoming) {
    if (!existing || !incoming) return;
    /* v37.5.59.5 (QA): Vault › + Pay stub uploads into the draft card (replaceId). Carry the pay-stub read
     * (review / failure / manual entry) over, and never guess insurance or loan fields from a pay stub. */
    if (normalizeDocSlot(existing.slot) === "payStubs" || normalizeDocSlot(incoming.slot) === "payStubs" || incoming.payStubReview) {
      ["payStubPending", "payStubReview", "payStubReadFailed"].forEach(function (key) {
        if (incoming[key] !== undefined) existing[key] = incoming[key];
      });
      if (incoming.payStubReview) {
        existing.payStubConfirmed = false;
        existing.payStubManual = null;
        existing.payStubManualError = "";
      }
      existing.slot = "payStubs";
      existing.linkedKind = "income";
      existing.linkedId = "compensation";
      existing.linkedName = "Income statement";
      if (!existing.titleCustomized && incoming.title && /^Pay stub/.test(incoming.title)) existing.title = incoming.title;
      existing.hasBlob = incoming.hasBlob || existing.hasBlob;
      existing.mime = incoming.mime || existing.mime;
      existing.pdfScanned = true;
      existing.pdfQuickReadFailed = !!incoming.pdfQuickReadFailed;
      existing.pdfPremiumMissing = false;
      existing.pdfAutofillReview = false;
      existing.pdfAutofilledFields = [];
      return;
    }
    var parsed = {};
    ["vaultType", "title", "provider", "policyNumber", "insuredItems", "premium", "premiumFrequency",
      "deductibles", "limits", "termRenewal", "balance", "rate", "payment", "minPayment",
      "originalBalance", "term", "property", "collateral"].forEach(function (key) {
      if (incoming[key] != null && incoming[key] !== "" && incoming[key] !== 0) parsed[key] = incoming[key];
    });
    if (incoming.pdfQuickReadFailed) {
      existing.hasBlob = incoming.hasBlob || existing.hasBlob;
      existing.mime = incoming.mime || existing.mime;
      existing.pdfScanned = true;
      existing.pdfQuickReadFailed = true;
      existing.pdfPremiumMissing = false;
      return;
    }
    applyParsedVaultPdf(existing, parsed);
    existing.hasBlob = incoming.hasBlob || existing.hasBlob;
    existing.mime = incoming.mime || existing.mime;
    existing.pdfScanned = true;
    existing.pdfQuickReadFailed = false;
  }

  function findLinkedNwLiability(doc) {
    if (!doc || (doc.linkedKind !== "loan" && doc.linkedKind !== "nw")) return null;
    var lines = (state.worth && state.worth.lines) || [];
    var i;
    for (i = 0; i < lines.length; i++) {
      if (lines[i].kind !== "liability") continue;
      if (doc.linkedId && lines[i].id === doc.linkedId) return lines[i];
    }
    if (doc.linkedName) {
      var key = String(doc.linkedName).toLowerCase();
      for (i = 0; i < lines.length; i++) {
        if (lines[i].kind === "liability" && String(lines[i].name || "").toLowerCase() === key) return lines[i];
      }
    }
    return null;
  }

  function currentWorthYear() {
    if (state.worthYear && state.worth && (state.worth.years || []).indexOf(state.worthYear) >= 0) {
      return state.worthYear;
    }
    var years = (state.worth && state.worth.years) || [];
    return years.length ? years[years.length - 1] : 2025;
  }

  function ensureVaultNwLiability(doc) {
    if (!shouldAddVaultToNetWorth(doc)) return null;
    var existing = findLinkedNwLiability(doc);
    if (existing) return existing;
    if (!state.worth) return null;
    if (!state.worth.lines) state.worth.lines = [];
    var year = currentWorthYear();
    var amounts = {};
    (state.worth.years || [year]).forEach(function (y) { amounts[y] = 0; });
    var type = gm().normalizeVaultType ? gm().normalizeVaultType(doc.vaultType) : doc.vaultType;
    var line = {
      id: nextId(),
      name: doc.title || doc.provider || (type === "mortgage" ? "Mortgage" : "Loan"),
      kind: "liability",
      group: "debt",
      sortOrder: state.worth.lines.length,
      amounts: amounts,
      additions: {},
      employerMatch: {},
      employerBase: {},
      loanBalance: vaultNum(doc.balance),
      loanApr: vaultNum(doc.rate),
      loanMinPayment: vaultNum(doc.minPayment || doc.payment),
      loanOriginalBalance: vaultNum(doc.originalBalance),
      loanDebtType: type === "mortgage" ? "mortgage" : (doc.loanDebtType || "")
    };
    line.amounts[year] = vaultNum(doc.balance);
    state.worth.lines.push(line);
    doc.linkedKind = "loan";
    doc.linkedId = line.id;
    doc.linkedName = line.name;
    doc.addToNetWorth = true;
    return line;
  }

  function syncVaultLoanToNetWorth(doc) {
    if (!shouldAddVaultToNetWorth(doc)) return;
    /* v37.5.57: no $0 liability cards from an unfinished Vault add. */
    if (!(vaultNum(doc.balance) > 0) && !(vaultNum(doc.payment) > 0) && !(vaultNum(doc.minPayment) > 0)) return;
    var line = ensureVaultNwLiability(doc);
    if (!line) return;
    var year = currentWorthYear();
    if (!line.amounts) line.amounts = {};
    if (vaultNum(doc.balance) > 0 || line.amounts[year] == null) line.amounts[year] = vaultNum(doc.balance);
    if (vaultNum(doc.balance) > 0) line.loanBalance = vaultNum(doc.balance);
    if (vaultNum(doc.rate) > 0) line.loanApr = vaultNum(doc.rate);
    if (vaultNum(doc.minPayment) > 0) line.loanMinPayment = vaultNum(doc.minPayment);
    else if (vaultNum(doc.payment) > 0) line.loanMinPayment = vaultNum(doc.payment);
    if (vaultNum(doc.originalBalance) > 0) line.loanOriginalBalance = vaultNum(doc.originalBalance);
    var type = gm().normalizeVaultType ? gm().normalizeVaultType(doc.vaultType) : doc.vaultType;
    if (type === "mortgage") line.loanDebtType = "mortgage";
    if (doc.title && doc.linkedName !== doc.title && !line.nameTouched) {
      line.name = doc.title;
    }
    doc.linkedKind = "loan";
    doc.linkedId = line.id;
    doc.linkedName = line.name;
  }

  function unlinkVaultFromNetWorth(doc) {
    if (!doc) return;
    if (findLinkedNwLiability(doc)) {
      doc.linkedKind = "";
      doc.linkedId = "";
      doc.linkedName = "";
    }
    doc.addToNetWorth = false;
  }

  function syncNwLiabilityToVault(line) {
    if (!line || line.kind !== "liability") return;
    var docs = (state.profile && state.profile.documents) || [];
    var year = currentWorthYear();
    var amount = lineAmount(line, year);
    docs.forEach(function (doc) {
      if (doc.linkedKind !== "loan" || doc.linkedId !== line.id) return;
      doc.balance = (Number(line.loanBalance) || 0) > 0 ? Number(line.loanBalance) : amount;
      if ((Number(line.loanApr) || 0) > 0) doc.rate = Number(line.loanApr);
      if ((Number(line.loanMinPayment) || 0) > 0) {
        if (doc.vaultType === "mortgage") doc.payment = Number(line.loanMinPayment);
        else doc.minPayment = Number(line.loanMinPayment);
      }
      if ((Number(line.loanOriginalBalance) || 0) > 0) doc.originalBalance = Number(line.loanOriginalBalance);
      doc.linkedName = line.name;
    });
  }

  /* Budget Debt lines store payoff balance on loanBalance (assigned stays the monthly payment).
   * Mirror that balance onto a Net Worth liability — match by name so an existing statement
   * line is updated instead of double-counted. Never copy assigned/payment onto the statement. */
  function findNwLiabilityByName(name) {
    var key = String(name || "").toLowerCase();
    if (!key) return null;
    var lines = (state.worth && state.worth.lines) || [];
    var i;
    for (i = 0; i < lines.length; i++) {
      if (lines[i].kind !== "liability" && lines[i].group !== "debt") continue;
      if (String(lines[i].name || "").toLowerCase() === key) return lines[i];
    }
    return null;
  }

  function ensureBudgetNwLiability(debtLine, lookupName) {
    if (!debtLine || !state.worth) return null;
    var existing = findNwLiabilityByName(lookupName || debtLine.name);
    if (existing) return existing;
    if (!state.worth.lines) state.worth.lines = [];
    var year = currentWorthYear();
    var amounts = {};
    (state.worth.years || [year]).forEach(function (y) { amounts[y] = 0; });
    var balance = Number(debtLine.loanBalance) || 0;
    var line = {
      id: nextId(),
      name: debtLine.name || "Loan",
      kind: "liability",
      group: "debt",
      sortOrder: state.worth.lines.length,
      amounts: amounts,
      additions: {},
      employerMatch: {},
      employerBase: {},
      loanBalance: balance,
      loanApr: Number(debtLine.loanApr) || 0,
      loanMinPayment: Number(debtLine.loanMinPayment) || 0,
      loanOriginalBalance: Number(debtLine.loanOriginalBalance) || 0,
      loanDebtType: debtLine.loanDebtType || ""
    };
    line.amounts[year] = balance;
    state.worth.lines.push(line);
    return line;
  }

  function syncBudgetLoanToNetWorth(debtLine, oldName) {
    if (!debtLine || !state.worth) return null;
    var balance = Number(debtLine.loanBalance) || 0;
    var byOld = oldName ? findNwLiabilityByName(oldName) : null;
    var byNew = findNwLiabilityByName(debtLine.name);
    if (byOld && byNew && byOld.id !== byNew.id) {
      /* Renamed onto an existing statement loan — keep one line, drop the old name. */
      removeBudgetNwLiability(oldName);
      byOld = null;
    }
    var existing = byOld || byNew;
    if (!existing && !(balance > 0)) return null;
    var line = existing || ensureBudgetNwLiability(debtLine, oldName || debtLine.name);
    if (!line) return null;
    var year = currentWorthYear();
    if (!line.amounts) line.amounts = {};
    /* Statement amount tracks payoff balance, not this month's payment (assigned). */
    line.amounts[year] = balance;
    line.loanBalance = balance;
    line.loanApr = Number(debtLine.loanApr) || 0;
    line.loanMinPayment = Number(debtLine.loanMinPayment) || 0;
    if (debtLine.loanOriginalBalance != null) {
      line.loanOriginalBalance = Number(debtLine.loanOriginalBalance) || 0;
    }
    if (debtLine.loanDebtType != null) line.loanDebtType = debtLine.loanDebtType || "";
    if (debtLine.name) line.name = debtLine.name;
    syncNwLiabilityToVault(line);
    return line;
  }

  function removeBudgetNwLiability(debtLineOrName) {
    if (!state.worth || !state.worth.lines) return;
    var name = typeof debtLineOrName === "string"
      ? debtLineOrName
      : (debtLineOrName && debtLineOrName.name);
    var key = String(name || "").toLowerCase();
    if (!key) return;
    var removed = null;
    state.worth.lines = state.worth.lines.filter(function (line) {
      if (line.kind !== "liability" && line.group !== "debt") return true;
      if (String(line.name || "").toLowerCase() !== key) return true;
      removed = line;
      return false;
    });
    if (!removed) return;
    var docs = (state.profile && state.profile.documents) || [];
    docs.forEach(function (doc) {
      if (doc.linkedKind === "loan" && doc.linkedId === removed.id) {
        doc.linkedKind = "";
        doc.linkedId = "";
        doc.linkedName = "";
      }
    });
  }

  function syncAllBudgetLoansToNetWorth(month) {
    if (!month || !state.worth) return;
    (month.categories || []).forEach(function (cat) {
      if (!/^debt$/i.test(cat.name)) return;
      (cat.lines || []).forEach(function (line) {
        if ((Number(line.loanBalance) || 0) > 0) syncBudgetLoanToNetWorth(line);
      });
    });
  }

  var pdfRescanIds = {};

  function vaultPdfShouldRescan(doc) {
    return !doc.pdfScanned;
  }

  function maybeAutofillOpenVaultDoc(doc) {
    if (!doc || pdfRescanIds[doc.id]) return;
    if (doc.pdfScanned && !vaultPdfShouldRescan(doc)) return;
    pdfRescanIds[doc.id] = true;
    if (!(doc.hasBlob || doc.dataUrl) || !isPdfFile(null, doc)) {
      doc.pdfScanned = true;
      return;
    }
    function finish() {
      if (shouldAddVaultToNetWorth(doc)) syncVaultLoanToNetWorth(doc);
      saveState();
      renderVaultPreserve();
    }
    if (doc.dataUrl && !doc.hasBlob) {
      if (doc.dataUrl.length > 1500000 * 1.4) {
        doc.pdfScanned = true;
        doc.pdfQuickReadFailed = true;
        doc.pdfPremiumMissing = false;
        finish();
        return;
      }
      maybeAutofillVaultPdf(doc, dataUrlToBlob(doc.dataUrl), finish);
      return;
    }
    getDocBlob(doc.id, function (err, blob) {
      if (err || !blob) return;
      maybeAutofillVaultPdf(doc, blob, finish);
    });
  }

  function emptyVaultDoc(type) {
    var blanks = emptyVaultFields();
    blanks.vaultType = gm().normalizeVaultType ? gm().normalizeVaultType(type) : (type || "other");
    blanks.vaultTypeCustomized = true;
    blanks.slot = slotFromVaultType(blanks.vaultType);
    blanks.title = defaultVaultTitle(blanks.vaultType, "", "");
    blanks.fileName = "";
    return {
      id: nextId(),
      slot: blanks.slot,
      fileName: "",
      mime: "",
      hasBlob: false,
      dataUrl: "",
      linkedKind: defaultLinkedKind(blanks.slot),
      linkedId: blanks.slot === "payStubs" ? "compensation" : "",
      linkedName: blanks.slot === "payStubs" ? "Income statement" : "",
      title: blanks.title,
      titleCustomized: false,
      vaultType: blanks.vaultType,
      vaultTypeCustomized: true,
      provider: "",
      policyNumber: "",
      insuredItems: "",
      premium: 0,
      premiumFrequency: "monthly",
      deductibles: "",
      limits: "",
      termRenewal: "",
      notes: "",
      balance: 0,
      rate: 0,
      payment: 0,
      escrow: "",
      term: "",
      property: "",
      minPayment: 0,
      originalBalance: 0,
      addToNetWorth: (blanks.vaultType === "loan" || blanks.vaultType === "mortgage") ? true : null,
      touchedFields: {},
      pdfAutofillReview: false,
      pdfAutofilledFields: [],
      pdfScanned: false,
      pdfQuickReadFailed: false,
      collateral: ""
    };
  }

  function retryVaultPdfRead(id) {
    var doc = findProfileDoc(id);
    if (!doc) return;
    pdfRescanIds[doc.id] = true;
    function finish() {
      if (shouldAddVaultToNetWorth(doc)) syncVaultLoanToNetWorth(doc);
      saveState();
      renderVaultPreserve();
    }
    function run(blob) {
      if (!blob) {
        markPdfQuickReadFailed(doc);
        finish();
        return;
      }
      maybeAutofillVaultPdf(doc, blob, finish);
    }
    if (doc.dataUrl && !doc.hasBlob) {
      if (doc.dataUrl.length > 1500000 * 1.4) {
        doc.pdfScanned = true;
        doc.pdfQuickReadFailed = true;
        doc.pdfPremiumMissing = false;
        finish();
        return;
      }
      run(dataUrlToBlob(doc.dataUrl));
      return;
    }
    getDocBlob(doc.id, function (err, blob) {
      if (err || !blob) {
        markPdfQuickReadFailed(doc);
        finish();
        return;
      }
      run(blob);
    });
  }

  function docLinkTargets() {
    var targets = [{ kind: "", id: "", name: "", label: "Not linked" }];
    var month = monthRecord();
    if (month) {
      (month.categories || []).forEach(function (cat) {
        if (/^insurance$/i.test(cat.name)) {
          (cat.lines || []).forEach(function (line) {
            targets.push({
              kind: "insurance",
              id: line.id,
              name: line.name,
              label: "Budget · " + line.name
            });
          });
        }
        if (/^debt$/i.test(cat.name)) {
          (cat.lines || []).forEach(function (line) {
            targets.push({
              kind: "loan",
              id: line.id,
              name: line.name,
              label: "Loan · " + line.name
            });
          });
        }
      });
    }
    (state.worth && state.worth.lines || []).forEach(function (line) {
      if (is401k(line)) {
        targets.push({ kind: "k401", id: line.id, name: line.name, label: "NW · " + line.name });
      }
      if (/insurance/i.test(line.name || "")) {
        targets.push({ kind: "insurance", id: line.id, name: line.name, label: "NW · " + line.name });
      }
      if (line.kind === "liability") {
        targets.push({ kind: "loan", id: line.id, name: line.name, label: "NW · " + line.name });
      }
    });
    targets.push({ kind: "income", id: "compensation", name: "Income statement", label: "Income statement" });
    var seen = {};
    return targets.filter(function (row) {
      var key = row.kind + "|" + row.id + "|" + row.name;
      if (seen[key]) return false;
      seen[key] = true;
      return true;
    });
  }

  function suggestDocLink(slot) {
    var kind = defaultLinkedKind(slot);
    if (!kind) return null;
    return docLinkTargets().filter(function (row) { return row.kind === kind; })[0] || null;
  }

  function applyDocLink(doc, target) {
    if (!target || !target.kind) {
      doc.linkedKind = "";
      doc.linkedId = "";
      doc.linkedName = "";
      return;
    }
    doc.linkedKind = target.kind;
    doc.linkedId = target.id || "";
    doc.linkedName = target.name || "";
  }

  function docsLinkedTo(kind, id, name) {
    return ((state.profile && state.profile.documents) || []).filter(function (doc) {
      if (doc.linkedKind !== kind) return false;
      if (id && doc.linkedId && doc.linkedId === id) return true;
      if (name && doc.linkedName && String(doc.linkedName).toLowerCase() === String(name).toLowerCase()) return true;
      return !doc.linkedId && !doc.linkedName;
    });
  }

  function docCueHtml(kind, id, name) {
    var docs = docsLinkedTo(kind, id, name);
    if (!docs.length) return "";
    var doc = docs[0];
    return '<button class="doc-cue" type="button" data-act="open-linked-doc" data-id="' +
      esc(doc.id) + '" aria-label="Open ' + esc(doc.fileName || "document") + '">📎</button>';
  }

  function profileName() {
    return String((state.profile && state.profile.name) || "").replace(/^\s+|\s+$/g, "");
  }

  function profileMasthead() {
    var name = profileName();
    return name ? name + "’s Paper Trail" : "";
  }

  function birthdayISO() {
    var fromProfile = state.profile && state.profile.birthday;
    if (fromProfile) return fromProfile;
    return (state.foo && state.foo.birthday) || "";
  }

  function syncBirthday(value) {
    state.profile = migrateProfile(state.profile, state.foo, state.compensation);
    state.foo = migrateFoo(state.foo);
    state.profile.birthday = value || "";
    state.foo.birthday = value || "";
  }

  function filingStatusOf(plan) {
    if (plan && (plan.filingStatus === "married" || plan.filingStatus === "single")) return plan.filingStatus;
    if (state.profile && state.profile.filingStatus === "married") return "married";
    return "single";
  }

  function payFrequencyOf(plan) {
    if (state.profile && PAY_FREQUENCIES.some(function (item) { return item.id === state.profile.payFrequency; })) {
      return state.profile.payFrequency;
    }
    return frequencyFromChecks(plan && plan.paychecksPerYear);
  }

  function applyPayFrequency(freq) {
    state.profile = migrateProfile(state.profile, state.foo, state.compensation);
    state.compensation = migrateCompensation(state.compensation || defaultCompensation());
    state.profile.payFrequency = freq;
    state.compensation.paychecksPerYear = checksForFrequency(freq);
  }

  function latestNetWorthHeadline() {
    var years = ((state.worth && state.worth.years) || []).slice().sort(function (a, b) { return a - b; });
    var withNW = null;
    years.forEach(function (year) {
      if (worthTotals(year).equity !== 0) withNW = year;
    });
    if (withNW == null) withNW = years.length ? years[years.length - 1] : null;
    if (withNW == null) return { year: null, amount: 0 };
    return { year: withNW, amount: worthTotals(withNW).equity };
  }

  /* v37.5.57: one income number — IS gross Total income for the year, else take-home × 12. */
  function statementGrossForYear(year) {
    if (year == null || !state) return null;
    var book = state.annualStatement;
    if (!book || !book.years) return null;
    var raw = book.years[String(year)];
    if (!raw) return null;
    return annualIncomeParts(annualRow(raw), Number(year)).total;
  }

  function yearIncomeFigure(year) {
    var gross = statementGrossForYear(year);
    if (gross != null && gross > 0) {
      var parts = annualIncomeParts(annualRow(state.annualStatement.years[String(year)]), Number(year));
      return { year: year, amount: gross, source: "statement", label: "gross",
        stubs: parts.source === "stubs", grossPay: parts.taxedIncome, basisShort: parts.basis ? parts.basis.short : "" };
    }
    if (!state || !state.compensation) return { year: year, amount: 0, source: "empty", label: "" };
    var takeHome = estimateCompensation(state.compensation).takeHome;
    if (takeHome > 0) {
      return { year: year, amount: roundCents(takeHome * 12), source: "take-home", label: "take-home" };
    }
    return { year: year, amount: 0, source: "empty", label: "" };
  }

  function currentAnnualIncomeHeadline() {
    ensureAnnualStatement();
    var book = state.annualStatement;
    var years = annualYearList(book).slice().sort(function (a, b) { return b - a; });
    var now = currentYearMonth().year;
    var ordered = [];
    if (years.indexOf(now) >= 0) ordered.push(now);
    years.forEach(function (y) { if (ordered.indexOf(y) < 0) ordered.push(y); });
    var i, fig;
    for (i = 0; i < ordered.length; i++) {
      fig = yearIncomeFigure(ordered[i]);
      if (fig.amount > 0 && fig.source === "statement") return fig;
    }
    for (i = 0; i < ordered.length; i++) {
      fig = yearIncomeFigure(ordered[i]);
      if (fig.amount > 0) return fig;
    }
    fig = yearIncomeFigure(now);
    if (fig.amount > 0) return fig;
    return { year: null, amount: 0, source: "empty", label: "" };
  }

  /* v37.5.59: which income basis "How you compare" uses. Peer medians (SCF / Census) are GROSS
   * (before tax), so only a gross figure is compared: Income statement gross first, then the
   * Compensation base salary. Take-home (paychecks) is shown labeled but never set against a
   * gross median — that would compare unlike things. */
  function incomeCompareBasis() {
    var fig = currentAnnualIncomeHeadline();
    if (fig.amount > 0 && fig.source === "statement" && fig.stubs && fig.grossPay > 0) {
      // v37.5.59.4: same projected gross as average tax and True (no employer 401k).
      return { kind: "gross", comparable: true, amount: fig.grossPay,
        youLabel: "You · gross", source: "Gross pay · pay stubs " + fig.year + " (" + fig.basisShort + ")" };
    }
    if (fig.amount > 0 && fig.source === "statement") {
      return { kind: "gross", comparable: true, amount: fig.amount,
        youLabel: "You · gross", source: "Gross pay · Income statement " + fig.year };
    }
    var est = state && state.compensation ? estimateCompensation(state.compensation) : null;
    if (est && est.baseSalary > 0) {
      return { kind: "gross", comparable: true, amount: roundCents(est.baseSalary),
        youLabel: "You · gross", source: "Gross pay · base salary (Compensation)" };
    }
    if (fig.amount > 0) {
      return { kind: "take-home", comparable: false, amount: fig.amount,
        youLabel: "You · take-home", source: "Take-home · est. take-home × 12" };
    }
    return { kind: "empty", comparable: false, amount: 0, youLabel: "You · gross",
      source: "No gross pay yet — add it on your Income statement" };
  }

  function incomeYearList(worth) {
    var book = worth || (state && state.worth) || {};
    var set = {};
    Object.keys(book.income || {}).forEach(function (year) { set[Number(year)] = true; });
    (book.years || []).forEach(function (year) { set[Number(year)] = true; });
    var stmt = (state && state.annualStatement && state.annualStatement.years) || {};
    Object.keys(stmt).forEach(function (year) { set[Number(year)] = true; });
    var now = currentYearMonth().year;
    if (now > 0) set[now] = true;
    return Object.keys(set).map(Number).filter(function (year) { return year > 0; })
      .sort(function (a, b) { return a - b; });
  }

  function defaultIncomeYear(worth) {
    var years = incomeYearList(worth).slice().sort(function (a, b) { return b - a; });
    var now = currentYearMonth().year;
    if (years.indexOf(now) >= 0 && yearIncomeFigure(now).amount > 0) return now;
    var i, y;
    for (i = 0; i < years.length; i++) {
      y = years[i];
      if (yearIncomeFigure(y).amount > 0) return y;
    }
    return years.length ? years[0] : null;
  }

  function selectedIncomeYear() {
    var years = incomeYearList();
    if (!years.length) return null;
    if (years.indexOf(Number(state.incomeYear)) >= 0) return Number(state.incomeYear);
    state.incomeYear = defaultIncomeYear();
    return state.incomeYear;
  }

  function selectedAnnualIncome() {
    var year = selectedIncomeYear();
    if (year == null) year = currentYearMonth().year;
    return yearIncomeFigure(year);
  }

  function incomeHeadlineCaption(headline) {
    if (headline.source === "take-home") {
      return headline.year
        ? ("Annual income · " + headline.year + " · take-home")
        : "Annual income · take-home";
    }
    if (headline.source === "statement" && headline.year) return "Annual income · " + headline.year;
    if (headline.year) return "Annual income · " + headline.year;
    return "Current annual income";
  }

  var HISTORY_WINDOW = 5;

  function recentYears(years, expanded) {
    var desc = years.slice().sort(function (a, b) { return b - a; });
    if (expanded || desc.length <= HISTORY_WINDOW) return desc;
    return desc.slice(0, HISTORY_WINDOW);
  }

  function historyToggleHtml(act, expanded, total) {
    if (total <= HISTORY_WINDOW) return "";
    return '<button class="text-btn history-more" type="button" data-act="' + act + '">' +
      (expanded ? "Show recent years" : "Show more years") + "</button>";
  }

  function yearSelectHtml(act, years, selected) {
    var options = years.slice().sort(function (a, b) { return b - a; }).map(function (year) {
      return '<option value="' + year + '"' + (year === selected ? " selected" : "") + ">" + year + "</option>";
    }).join("");
    return '<select class="toolbar-select" data-act="' + act + '" aria-label="Year">' + options + "</select>";
  }

  function statsHeadlineCard(kicker, amount, caption) {
    return '<section class="stats-headline"><p class="kicker">' + esc(kicker) + "</p>" +
      '<p class="amount">' + money(amount) + "</p>" +
      (caption ? '<p class="caption">' + esc(caption) + "</p>" : "") +
      "</section>";
  }

  function crossDoorHtml(door, title, amount, caption) {
    return '<button class="row-btn cross-door" type="button" data-act="stats-door" data-door="' +
      esc(door) + '"><div class="row"><div><div class="name">' + esc(title) + "</div>" +
      (caption ? '<span class="caption">' + esc(caption) + "</span>" : "") +
      "</div><span class='mono'>" + money(amount) + "</span></div></button>";
  }

  function incomeHeroHtml() {
    var income = selectedAnnualIncome();
    return '<section class="hero"><div><p class="kicker">' + esc(incomeHeadlineCaption(income)) +
      "</p>" +
      '<p class="worth-amount">' + money(income.amount) + "</p></div></section>";
  }

  function incomeCrossDoorHtml() {
    var income = currentAnnualIncomeHeadline();
    return crossDoorHtml(
      "statement",
      "Income",
      income.amount,
      incomeHeadlineCaption(income)
    );
  }

  function netWorthCrossDoorHtml() {
    var nw = latestNetWorthHeadline();
    return crossDoorHtml(
      "worth",
      "Net Worth",
      nw.amount,
      nw.year ? "Latest net worth · " + nw.year : "Latest net worth"
    );
  }

  /* v37.5.19 — Stats: two pills only. Vault stays off this row (quiet link + Profile). */
  var MENU_SVG = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"></path></svg>';

  function statsSegmentHtml(active) {
    /* v37.5.21: Income statement left, Net worth right. Default door stays worth. */
    /* v37.5.23: Vault is a full-width outline button directly under the two pills. */
    return '<div class="stats-doors">' +
      '<div class="stats-seg" role="tablist" aria-label="Statement">' +
      '<button type="button" role="tab" data-act="stats-door" data-door="statement"' +
      (active === "statement" ? ' class="on" aria-selected="true"' : ' aria-selected="false"') +
      ">Income statement</button>" +
      '<button type="button" role="tab" data-act="stats-door" data-door="worth"' +
      (active === "worth" ? ' class="on" aria-selected="true"' : ' aria-selected="false"') +
      ">Net worth</button>" +
      "</div>" +
      '<button class="stats-vault" type="button" data-act="stats-door" data-door="vault">Vault</button>' +
      "</div>";
  }

  function calendarYearPickerHtml(act, years, selected, aria, opts) {
    opts = opts || {};
    if (!years || !years.length) return "";
    var options = years.slice().sort(function (a, b) { return b - a; }).map(function (year) {
      return '<option value="' + year + '"' + (Number(year) === Number(selected) ? " selected" : "") + ">" + year + "</option>";
    }).join("");
    var iconOnly = !!opts.iconOnly;
    return '<label class="year-picker' + (iconOnly ? " is-icon" : "") + '" title="Pick year">' +
      '<span class="cal-ico" aria-hidden="true">' +
      '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6">' +
      '<rect x="3.5" y="5" width="17" height="15.5" rx="2"></rect><path d="M3.5 10h17M8 3.5v3M16 3.5v3"></path>' +
      "</svg></span>" +
      '<select class="toolbar-select year-picker-select" data-act="' + act + '" aria-label="' +
      esc(aria || "Year") + '">' + options + "</select></label>";
  }

  function statsYearPick() {
    if (state.statsDoor === "statement") {
      return {
        act: "income-year",
        years: incomeYearList(),
        selected: selectedIncomeYear(),
        aria: "Income year"
      };
    }
    var years = (state.worth && state.worth.years) ? state.worth.years.slice() : [];
    var selected = state.worthYear;
    if (years.indexOf(selected) < 0 && years.length) selected = years[years.length - 1];
    return { act: "worth-year", years: years, selected: selected, aria: "Net worth year" };
  }

  function statsMonthBarHtml() {
    /* Year columns live on the income statement itself. The header calendar stays on Net worth. */
    var picker = '<span class="icon-btn" aria-hidden="true"></span>';
    if (state.statsDoor !== "statement") {
      var pick = statsYearPick();
      if (pick.years.length) {
        picker = calendarYearPickerHtml(pick.act, pick.years, pick.selected, pick.aria, { iconOnly: true });
      }
    }
    // v37.5.59.2: same header as the other tabs — Profile gear on the right; year picker on the left.
    return picker + "<h1>Stats</h1>" +
      '<button class="icon-btn" type="button" data-act="open-profile" aria-label="Profile">⚙</button>';
  }

  function statementHairline() {
    return '<hr class="stmt-rule" />';
  }

  function statementRowHtml(label, amount, opts) {
    opts = opts || {};
    var cls = "stmt-line" +
      (opts.total ? " is-total" : "") +
      (opts.subtotal ? " is-subtotal" : "") +
      (opts.underlined ? " is-underlined" : "");
    return '<div class="' + cls + '"><span class="stmt-label">' + esc(label) +
      '</span><span class="mono stmt-amt' + (opts.moss ? " moss" : "") + '">' + (opts.whole ? moneyWhole(amount) : money(amount)) + "</span></div>";
  }

  var BS_ASSET_SECTIONS = [
    { id: "cash", title: "Cash", groups: ["cash"] },
    /* "investment" is the brokerage group — same bucket as taxable, not a made-up account. */
    { id: "investments", title: "Investments", groups: ["taxable", "retirement", "investment"] },
    /* Cars and other lifestyle assets read as property, not investments (owner). */
    { id: "property", title: "Property", groups: ["realEstate", "lifestyle"] }
  ];
  /* Session-only. First pass stays collapsed; not written to the books. */
  var bsGroupOpen = {};
  /* v37.5.56: taxes disclosure + formula info tip (not persisted). */
  var annualTaxesOpen = false;
  var annualInfoTip = null;

  function balanceAssetLines(groups) {
    return (state.worth.lines || []).filter(function (line) {
      if (line.kind === "liability" || line.group === "debt") return false;
      return groups.indexOf(line.group) >= 0;
    });
  }

  function balanceGroupSum(groups, year) {
    var sum = 0;
    balanceAssetLines(groups).forEach(function (line) {
      sum += lineAmount(line, year);
    });
    return sum;
  }

  function balanceGroupRowHtml(sec, year) {
    var kids = balanceAssetLines(sec.groups);
    var open = !!(bsGroupOpen[sec.id] && kids.length);
    var amount = balanceGroupSum(sec.groups, year);
    if (!kids.length) return statementRowHtml(sec.title, amount);
    var html = '<button class="stmt-line is-group" type="button" data-act="toggle-bs-group" data-group="' +
      esc(sec.id) + '" aria-expanded="' + (open ? "true" : "false") + '">' +
      '<span class="stmt-label"><span class="stmt-chev' + (open ? " is-open" : "") +
      '" aria-hidden="true"></span>' + esc(sec.title) + "</span>" +
      '<span class="mono stmt-amt">' + money(amount) + "</span></button>";
    if (open) {
      kids.forEach(function (line) {
        html += '<div class="stmt-line is-child"><span class="stmt-label">' + esc(line.name) +
          '</span><span class="mono stmt-amt">' + money(lineAmount(line, year)) + "</span></div>";
      });
    }
    return html;
  }

  /* v37.5.20: group totals first. Chevron expands real lines already on the books. */
  function balanceSheetLinesHtml(year) {
    var totals = worthTotals(year);
    var html = '<p class="stmt-section">Assets</p>';
    BS_ASSET_SECTIONS.forEach(function (sec) {
      html += balanceGroupRowHtml(sec, year);
    });
    html += statementHairline();
    html += statementRowHtml("Subtotal Assets", totals.assets, { subtotal: true });
    html += '<p class="stmt-section">Liabilities</p>';
    var debts = (state.worth.lines || []).filter(function (l) {
      return l.kind === "liability" || l.group === "debt";
    });
    debts.forEach(function (line) {
      html += statementRowHtml(line.name, lineAmount(line, year));
    });
    html += statementHairline();
    html += statementRowHtml("Subtotal Liabilities", totals.liabilities, { subtotal: true });
    return html;
  }

  function freshState() {
    uid = 1;
    var cur = currentYearMonth();
    var months = {};
    months[ymKey(cur.year, cur.month)] = seedBudgetMonth(cur.year, cur.month);
    return {
      tab: "budget",
      year: cur.year,
      month: cur.month,
      worthYear: 2025,
      incomeYear: null,
      incomeYearsExpanded: false,
      worthYearsExpanded: false,
      worthDetails: false,
      statementDetails: false,
      statsDoor: "",
      vaultDocId: "",
      insightPriorities: [],
      insightExtra: 100,
      foo: defaultFoo(),
      matters: defaultMatters(),
      profile: defaultProfile(),
      plan: "free",
      worthScrubYear: null,
      insightsDoor: "",
      gradeSheet: "",
      months: months,
      worth: seedWorth(),
      annualStatement: seedAnnualStatement(),
      nightLedger: false,
      compensation: defaultCompensation(),
      envelopeMode: "remaining",
      wrapCadence: "year",
      merchantRules: {},
      merchantHint: null,
      loanSort: { key: "balance", dir: "desc" },
      payoffExtra: 100,
      payoffLoanId: "",
      // Sample seed = demo (opt-in from the welcome screen or Profile › Restore sample data).
      onboarding: { status: "done", demo: true, skipped: {} }
    };
  }

  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      // v37.5.15: no saved data → welcome survey on empty books (sample data is opt-in only).
      if (!raw) return blankState();
      var parsed = JSON.parse(raw);
      if (!parsed || !parsed.months || !parsed.worth) return blankState();
      uid = 1000;
      // v37.5.59.12 (QA H3): skip null/broken rows instead of blanking the whole app.
      var repaired = false;
      Object.keys(parsed.months).forEach(function (key) {
        var m = parsed.months[key];
        if (!m || typeof m !== "object") { delete parsed.months[key]; repaired = true; return; }
        // v37.5.59.12 (QA L9): drop invalid month keys so they can't inflate Wrapped take-home.
        var keyBits = /^(\d{4})-(\d{1,2})$/.exec(key);
        var yNum = Number(m.year != null ? m.year : (keyBits && keyBits[1]));
        var mNum = Number(m.month != null ? m.month : (keyBits && keyBits[2]));
        if (!keyBits || !(yNum >= 2000 && yNum <= 2100) || !(mNum >= 1 && mNum <= 12)) {
          delete parsed.months[key];
          repaired = true;
          return;
        }
        m.year = yNum;
        m.month = mNum;
        if (!Array.isArray(m.categories)) { m.categories = []; repaired = true; }
        else {
          var beforeC = m.categories.length;
          m.categories = m.categories.filter(function (c) { return c && typeof c === "object"; });
          if (m.categories.length !== beforeC) repaired = true;
          m.categories.forEach(function (c) {
            if (!Array.isArray(c.lines)) c.lines = [];
            else {
              var beforeL = c.lines.length;
              c.lines = c.lines.filter(function (l) { return l && typeof l === "object"; });
              if (c.lines.length !== beforeL) repaired = true;
            }
          });
        }
        if (!Array.isArray(m.transactions)) { m.transactions = []; repaired = true; }
        else {
          var beforeT = m.transactions.length;
          m.transactions = m.transactions.filter(function (t) { return t && typeof t === "object"; });
          if (m.transactions.length !== beforeT) repaired = true;
        }
        if (m.incomes != null) {
          if (!Array.isArray(m.incomes)) { m.incomes = []; repaired = true; }
          else {
            var beforeI = m.incomes.length;
            m.incomes = m.incomes.filter(function (t) { return t && typeof t === "object"; });
            if (m.incomes.length !== beforeI) repaired = true;
          }
        }
        migrateSubsections(m);
        migrateIncome(m);
        migrateTransactions(m);
      });
      if (!parsed.worth || typeof parsed.worth !== "object") parsed.worth = blankWorth(currentYearMonth().year);
      if (!Array.isArray(parsed.worth.lines)) { parsed.worth.lines = []; repaired = true; }
      else {
        var beforeW = parsed.worth.lines.length;
        parsed.worth.lines = parsed.worth.lines.filter(function (l) { return l && typeof l === "object"; });
        if (parsed.worth.lines.length !== beforeW) repaired = true;
      }
      if (parsed.profile && Array.isArray(parsed.profile.documents)) {
        var beforeD = parsed.profile.documents.length;
        parsed.profile.documents = parsed.profile.documents.filter(function (d) { return d && typeof d === "object"; });
        if (parsed.profile.documents.length !== beforeD) repaired = true;
      }
      if (repaired) {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed)); } catch (err) {}
      }
      if (parsed.tab === "income") parsed.tab = "budget";
      if (parsed.tab === "worth") {
        parsed.tab = "stats";
        parsed.statsDoor = "worth";
      } else if (parsed.tab === "statement") {
        parsed.tab = "stats";
        parsed.statsDoor = "statement";
      }
      if (parsed.statsDoor == null) parsed.statsDoor = "";
      if (parsed.vaultDocId == null) parsed.vaultDocId = "";
      if (!parsed.insightPriorities) parsed.insightPriorities = [];
      if (!(Number(parsed.insightExtra) > 0)) parsed.insightExtra = 100;
      parsed.foo = migrateFoo(parsed.foo);
      parsed.matters = migrateMatters(parsed.matters);
      parsed.plan = (window.GradeMath && window.GradeMath.normalizePlan)
        ? window.GradeMath.normalizePlan(parsed.plan)
        : (parsed.plan === "premium" ? "premium" : "free");
      parsed.compensation = migrateCompensation(parsed.compensation || defaultCompensation());
      parsed.profile = migrateProfile(parsed.profile, parsed.foo, parsed.compensation);
      if (parsed.profile.birthday && !parsed.foo.birthday) parsed.foo.birthday = parsed.profile.birthday;
      parsed.compensation.filingStatus = parsed.profile.filingStatus;
      parsed.compensation.paychecksPerYear = checksForFrequency(parsed.profile.payFrequency);
      if (parsed.insightsDoor !== "foo") parsed.insightsDoor = "";
      parsed.gradeSheet = "";
      if (parsed.worthScrubYear == null) parsed.worthScrubYear = parsed.worthYear || null;
      if (parsed.incomeYearsExpanded == null) parsed.incomeYearsExpanded = false;
      if (parsed.worthYearsExpanded == null) parsed.worthYearsExpanded = false;
      if (parsed.worthDetails == null) parsed.worthDetails = false;
      if (parsed.statementDetails == null) parsed.statementDetails = false;
      migrateWorthIncome(parsed.worth);
      migrateSampleAnnualDefaults(parsed);
      ensureAnnualStatement(parsed);
      /* Defer incomeYear fix until state is assigned — yearIncomeFigure needs state. */
      if (parsed.incomeYear == null) parsed.incomeYear = currentYearMonth().year;
      if (parsed.nightLedger == null) parsed.nightLedger = false;
      if (parsed.envelopeMode !== "planned" && parsed.envelopeMode !== "spent") {
        parsed.envelopeMode = "remaining";
      }
      /* v37.5.55: Wrapped is annual for now; quarterly/monthly stay parked. */
      parsed.wrapCadence = "year";
      if (!parsed.merchantRules || typeof parsed.merchantRules !== "object" || Array.isArray(parsed.merchantRules)) {
        parsed.merchantRules = {};
      }
      if (!parsed.merchantHint || typeof parsed.merchantHint !== "object") parsed.merchantHint = null;
      parsed.loanSort = (window.GradeMath && window.GradeMath.normalizeLoanSort)
        ? window.GradeMath.normalizeLoanSort(parsed.loanSort)
        : { key: "balance", dir: "desc" };
      if (!(Number(parsed.payoffExtra) > 0)) {
        parsed.payoffExtra = Number(parsed.insightExtra) > 0 ? Number(parsed.insightExtra) : 100;
      }
      if (parsed.payoffLoanId == null) parsed.payoffLoanId = "";
      migrateWorthIncome(parsed.worth);
      parsed.onboarding = migrateOnboarding(parsed.onboarding);
      if (parsed.worth && Array.isArray(parsed.worth.lines)) {
        parsed.worth.lines.forEach(function (line) {
          if (!line || line.kind === "liability") return;
          if (String(line.name || "") === "Car" && line.group === "lifestyle") line.group = "realEstate";
        });
      }
      return parsed;
    } catch (err) {
      return blankState();
    }
  }

  var SAVE_WARN = "Couldn't save. Storage is full — export a backup from Profile › Data.";
  var saveBlocked = false;
  var saveBlockedDetail = "";

  function storageHasHeadroom() {
    try {
      var pad = "";
      while (pad.length < 256 * 1024) pad += "0123456789abcdef";
      localStorage.setItem("pt-health", pad);
      localStorage.removeItem("pt-health");
      return true;
    } catch (err) {
      try { localStorage.removeItem("pt-health"); } catch (e2) {}
      return false;
    }
  }

  function checkStorageHealthOnLoad() {
    // v37.5.59.12 (QA H4 gap): if storage is already near full, show the warning before any edit.
    if (!storageHasHeadroom()) {
      saveBlocked = true;
      saveBlockedDetail = "Storage is almost full — new changes may not save. Export a backup from Profile › Data.";
    }
  }

  function paintSaveWarning() {
    var host = document.getElementById("phone") || document.body;
    var el = document.getElementById("save-warn");
    if (!saveBlocked) {
      if (el) el.parentNode && el.parentNode.removeChild(el);
      return;
    }
    if (!el) {
      el = document.createElement("div");
      el.id = "save-warn";
      el.className = "save-warn";
      el.setAttribute("role", "alert");
      host.insertBefore(el, host.firstChild);
    }
    el.textContent = saveBlockedDetail || SAVE_WARN;
  }

  function saveState() {
    try {
      var payload = storagePayload();
      var text = JSON.stringify(payload);
      localStorage.setItem(STORAGE_KEY, text);
      var read = localStorage.getItem(STORAGE_KEY);
      if (read !== text) throw new Error("verify-mismatch");
      // Keep the banner while there is still no headroom (a same-size rewrite can succeed when full).
      if (saveBlocked && storageHasHeadroom()) {
        saveBlocked = false;
        saveBlockedDetail = "";
        paintSaveWarning();
      }
      return true;
    } catch (err) {
      saveBlocked = true;
      saveBlockedDetail = /quota|QuotaExceeded|QUOTA/i.test(String(err && (err.name || err.message) || err))
        ? SAVE_WARN
        : "Couldn't save on this device. Export a backup from Profile › Data before you close the app.";
      paintSaveWarning();
      return false;
    }
  }

  function monthRecord() {
    return state.months[ymKey(state.year, state.month)];
  }

  function ensureMonth(year, month) {
    var key = ymKey(year, month);
    if (state.months[key]) {
      migrateIncome(state.months[key]);
      migrateTransactions(state.months[key]);
      syncAllBudgetLoansToNetWorth(state.months[key]);
      return state.months[key];
    }

    var templates = DEFAULT_ENVELOPES.map(function (name) {
      return { name: name, lineNames: defaultLineNames(name) };
    });
    var earlier = Object.keys(state.months).map(function (k) {
      return state.months[k];
    }).filter(function (m) {
      return m.categories.length && (m.year < year || (m.year === year && m.month < month));
    }).sort(function (a, b) {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });
    if (earlier[0]) {
      migrateSubsections(earlier[0]);
      templates = sortedCategories(earlier[0]).map(function (c) {
        var names = sortedLines(c).map(function (l) { return l.name; });
        return { name: c.name, lineNames: names.length ? names : defaultLineNames(c.name) };
      });
    }
    state.months[key] = emptyMonth(year, month, templates);
    return state.months[key];
  }

  function sums(month) {
    migrateSubsections(month);
    // income = planned paychecks (left-to-budget stays planned − assigned, EveryDollar style).
    // received = Income transactions. spent = expenses net of refunds; income never counts.
    var income = month.incomes.reduce(function (n, i) { return n + (Number(i.amount) || 0); }, 0);
    var assigned = month.categories.reduce(function (n, c) { return n + catAssigned(c); }, 0);
    var ledger = gm().sumLedger(month.transactions || []);
    var spent = ledger.spendingNet;
    var leftover = income - assigned;
    return {
      income: income,
      received: ledger.received,
      refunds: ledger.refunds,
      assigned: assigned,
      spent: spent,
      leftover: leftover,
      unused: assigned - spent,
      stamped: income > 0 && cents(leftover) === 0
    };
  }

  function spentFor(month, categoryId) {
    return gm().envelopeNetSpent(month.transactions || [], "category", categoryId);
  }

  function lineAmount(line, year) {
    var value = line.amounts[year];
    return value == null ? 0 : Number(value);
  }

  function lineAddition(line, year) {
    if (!line.additions) return 0;
    var value = line.additions[year];
    return value == null ? 0 : Number(value);
  }

  function lineEmployerMatch(line, year) {
    return Number((line.employerMatch || {})[year]) || 0;
  }

  function lineEmployerBase(line, year) {
    return Number((line.employerBase || {})[year]) || 0;
  }

  function is401k(line) {
    return /401k|401/.test(String(line.name || "").toLowerCase());
  }

  function treatedAdditions(line, year, employerAsGains) {
    var employee = lineAddition(line, year);
    if (!is401k(line)) return employee;
    return employerAsGains ? employee : employee + lineEmployerMatch(line, year) + lineEmployerBase(line, year);
  }

  function tracksContributions(line) {
    return line.group === "retirement";
  }

  function incomeGrowth(current, prior) {
    if (!prior || Number(current) === 0) return null;
    return (Number(current) - Number(prior)) / Number(prior);
  }

  function headlineIncomeGrowth(incomeMap) {
    var years = Object.keys(incomeMap || {}).map(Number).sort(function (a, b) { return a - b; });
    var latest = -1;
    years.forEach(function (year, i) {
      if (Number(incomeMap[year]) !== 0) latest = i;
    });
    if (latest < 1) return null;
    return incomeGrowth(incomeMap[years[latest]], incomeMap[years[latest - 1]]);
  }

  function annualizedIncomeGrowth(incomeMap) {
    var years = Object.keys(incomeMap || {}).map(Number).sort(function (a, b) { return a - b; });
    var first = null;
    var last = null;
    years.forEach(function (year) {
      if (Number(incomeMap[year]) !== 0) {
        if (first == null) first = year;
        last = year;
      }
    });
    if (first == null || last == null || last <= first) return null;
    var start = Number(incomeMap[first]);
    var end = Number(incomeMap[last]);
    if (!(start > 0) || end < 0) return null;
    return Math.pow(end / start, 1 / (last - first)) - 1;
  }

  function firstEquityYear(years) {
    var ordered = years.slice().sort(function (a, b) { return a - b; });
    for (var i = 0; i < ordered.length; i++) {
      if (worthTotals(ordered[i]).equity !== 0) return ordered[i];
    }
    return null;
  }

  function equityCagr(start, end, periods) {
    if (!(periods > 0) || !(start > 0) || end < 0) return null;
    return Math.pow(end / start, 1 / periods) - 1;
  }

  function annualReturn(ending, priorEnding, netAdditions) {
    if (!priorEnding) return null;
    return (ending - priorEnding - netAdditions) / priorEnding;
  }

  function irrCashflows(cashflows) {
    if (!cashflows || cashflows.length < 2) return null;
    var hasPos = false;
    var hasNeg = false;
    cashflows.forEach(function (c) {
      if (c > 0) hasPos = true;
      if (c < 0) hasNeg = true;
    });
    if (!hasPos || !hasNeg) return null;
    function npv(rate) {
      var total = 0;
      for (var i = 0; i < cashflows.length; i++) {
        var base = 1 + rate;
        if (base === 0) return NaN;
        total += cashflows[i] / Math.pow(base, i);
      }
      return total;
    }
    var low = -0.999999;
    var high = 10;
    var fLow = npv(low);
    var fHigh = npv(high);
    if (fLow * fHigh > 0) {
      high = 100;
      fHigh = npv(high);
      if (fLow * fHigh > 0) return null;
    }
    for (var n = 0; n < 80; n++) {
      var mid = (low + high) / 2;
      var fMid = npv(mid);
      if (fLow * fMid <= 0) {
        high = mid;
        fHigh = fMid;
      } else {
        low = mid;
        fLow = fMid;
      }
    }
    return (low + high) / 2;
  }

  function contributionCashflows(line, throughYear, employerAsGains) {
    var years = state.worth.years.filter(function (y) { return y <= throughYear; }).slice().sort(function (a, b) {
      return a - b;
    });
    var start = -1;
    years.forEach(function (y, i) {
      if (start < 0 && treatedAdditions(line, y, employerAsGains !== false) !== 0) start = i;
    });
    if (start < 0) return null;
    var slice = years.slice(start);
    if (!slice.length) return null;
    var cfs = slice.map(function (y) { return -treatedAdditions(line, y, employerAsGains !== false); });
    cfs.push(lineAmount(line, throughYear));
    return cfs;
  }

  function worthTotals(year) {
    var assets = 0;
    var liabilities = 0;
    var rollup = {};
    GROUPS.forEach(function (g) { rollup[g.id] = 0; });
    state.worth.lines.forEach(function (line) {
      var amount = lineAmount(line, year);
      rollup[line.group] = (rollup[line.group] || 0) + amount;
      if (line.kind === "liability") liabilities += amount;
      else assets += amount;
    });
    return { assets: assets, liabilities: liabilities, equity: assets - liabilities, rollup: rollup };
  }

  function displayDate(iso) {
    var parts = String(iso).split("-");
    if (parts.length !== 3) return iso;
    var d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  function polar(cx, cy, r, angle) {
    var a = (angle - 90) * Math.PI / 180;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  }

  function pieSvg(slices, emptyText, legendKind) {
    if (!slices.length) {
      return '<p class="empty" style="margin:0">' + esc(emptyText || "No spending this month yet.") + "</p>";
    }
    var total = slices.reduce(function (n, s) { return n + s.amount; }, 0);
    var cx = 100;
    var cy = 88;
    var r = 70;
    var paths = "";
    var legend = "";
    var angle = 0;
    slices.forEach(function (slice, i) {
      var sweep = slice.amount / total * 360;
      var color = slice.color || CHART_INKS[i % CHART_INKS.length];
      if (slices.length === 1 || sweep >= 359.9) {
        paths += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + color + '"></circle>';
      } else {
        var start = polar(cx, cy, r, angle);
        var end = polar(cx, cy, r, angle + sweep);
        var large = sweep > 180 ? 1 : 0;
        paths += '<path fill="' + color + '" d="M ' + cx + ' ' + cy +
          ' L ' + start[0].toFixed(2) + ' ' + start[1].toFixed(2) +
          ' A ' + r + ' ' + r + ' 0 ' + large + ' 1 ' +
          end[0].toFixed(2) + ' ' + end[1].toFixed(2) + ' Z"></path>';
      }
      angle += sweep;
      legend += '<span><i class="swatch" style="background:' + color + '"></i>' +
        esc(slice.name) + (legendKind === "label" ? "" : " " + money(slice.amount)) + "</span>";
    });
    return '<svg class="chart pie" viewBox="0 0 200 176" aria-hidden="true">' + paths +
      "</svg><div class='pie-legend'>" + legend + "</div>";
  }

  function lineChart(seriesList, opts) {
    if (!seriesList || !seriesList.length) return "";
    var points = seriesList[0].points || [];
    if (points.length < 2) return "";
    opts = opts || {};
    var selectedYear = opts.selectedYear;
    var w = 320;
    var h = 180;
    var padL = 8;
    var padR = 8;
    var padT = 12;
    var padB = 28;
    var ys = [];
    seriesList.forEach(function (series) {
      (series.points || []).forEach(function (p) { ys.push(p.y); });
    });
    var min = Math.min.apply(null, ys.concat([0]));
    var max = Math.max.apply(null, ys);
    if (max === min) max = min + 1;
    function x(i) {
      return padL + i * (w - padL - padR) / (points.length - 1);
    }
    function y(v) {
      return padT + (1 - (v - min) / (max - min)) * (h - padT - padB);
    }
    var selectedIndex = -1;
    points.forEach(function (p, i) {
      if (p.year === selectedYear) selectedIndex = i;
    });
    var paths = seriesList.map(function (series, si) {
      var color = series.color || CHART_INKS[si % CHART_INKS.length];
      var pts = (series.points || []).map(function (p, i) {
        return x(i).toFixed(1) + "," + y(p.y).toFixed(1);
      }).join(" ");
      var dots = (series.points || []).map(function (p, i) {
        var r = p.year === selectedYear ? 4.4 : 3.2;
        return '<circle cx="' + x(i).toFixed(1) + '" cy="' + y(p.y).toFixed(1) +
          '" r="' + r + '" fill="' + color + '" data-act="nw-scrub-year" data-year="' +
          p.year + '" style="cursor:pointer"></circle>';
      }).join("");
      return '<polyline fill="none" stroke="' + color + '" stroke-width="3" points="' + pts +
        '"></polyline>' + dots;
    }).join("");
    var rule = "";
    if (selectedIndex >= 0) {
      var sx = x(selectedIndex).toFixed(1);
      rule = '<line class="nw-rule" x1="' + sx + '" x2="' + sx + '" y1="' + padT +
        '" y2="' + (h - padB) + '" stroke="rgb(40,28,18)" stroke-width="1.6" stroke-dasharray="4 3"></line>';
    }
    var labels = points.map(function (p, i) {
      if (i % 2 && i !== points.length - 1) return "";
      return '<text x="' + x(i).toFixed(1) + '" y="' + (h - 8) +
        '" text-anchor="middle" font-size="9" fill="rgb(107,97,87)">' + p.year + "</text>";
    }).join("");
    var legend = '<div class="chart-legend">' + seriesList.map(function (series, si) {
      var color = series.color || CHART_INKS[si % CHART_INKS.length];
      return '<span><i class="swatch" style="background:' + color + '"></i>' + esc(series.name) + "</span>";
    }).join("") + "</div>";
    var svg = '<svg class="chart" viewBox="0 0 ' + w + " " + h + '" aria-hidden="true">' +
      paths + rule + labels + "</svg>";
    if (!opts.interactive) return svg + legend;
    var years = points.map(function (p) { return p.year; });
    function seriesAt(name, year) {
      var series = seriesList.filter(function (s) { return s.name === name; })[0];
      if (!series) return 0;
      var pt = (series.points || []).filter(function (p) { return p.year === year; })[0];
      return pt ? pt.y : 0;
    }
    var attrs = years.map(function (year) {
      return ' data-nw-' + year + '="' + seriesAt("Net worth", year) + '" data-inc-' + year + '="' +
        seriesAt("Income", year) + '"';
    }).join("");
    var highlight = selectedYear == null ? years[years.length - 1] : selectedYear;
    return '<div class="nw-scrubber" data-nw-scrub="1" data-years=\'' + JSON.stringify(years) + "'" + attrs + ">" +
      svg +
      '<p class="scrub-readout">' + highlight + " · Net worth " + money(seriesAt("Net worth", highlight)) +
      " · Income " + money(seriesAt("Income", highlight)) + "</p></div>" + legend;
  }

  function barChart(rows) {
    if (!rows.length) return "";
    var w = 320;
    var rowH = 28;
    var h = rows.length * rowH + 8;
    var max = Math.max.apply(null, rows.map(function (r) { return r.amount; }).concat([1]));
    var html = '<svg class="chart bars" viewBox="0 0 ' + w + " " + h + '" aria-hidden="true">';
    rows.forEach(function (row, i) {
      var y = 6 + i * rowH;
      var bw = row.amount > 0 ? Math.max(4, (row.amount / max) * 170) : 0; // v37.5.59.6: $0 = empty bar
      var fill = row.id === "debt" ? "var(--berry)" : CHART_INKS[i % CHART_INKS.length];
      html += '<text x="0" y="' + (y + 12) + '" font-size="10" fill="currentColor">' +
        esc(row.title) + "</text>";
      if (!(row.amount > 0)) html += '<rect x="138.5" y="' + (y + 2.5) + '" width="169" height="11" rx="2" fill="none" stroke="currentColor" stroke-opacity="0.25"></rect>';
      html += '<rect x="138" y="' + (y + 2) + '" width="' + bw.toFixed(1) +
        '" height="12" rx="2" fill="' + fill + '"></rect>';
    });
    return html + "</svg>";
  }

  function tabIcon(name) {
    var paths = {
      budget: '<rect x="4" y="7" width="16" height="13" rx="2"></rect><path d="M8 7V6a4 4 0 0 1 8 0v1"></path>',
      income: '<circle cx="12" cy="12" r="8"></circle><path d="M12 8v8M8 12h8"></path>',
      spend: '<rect x="3" y="6" width="18" height="13" rx="2"></rect><path d="M3 10h18"></path>',
      statement: '<path d="M7 4h8l5 5v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"></path><path d="M15 4v5h5"></path>',
      worth: '<path d="M5 8h14M5 16h14M8 5v14M16 5v14"></path>',
      stats: '<path d="M5 8h14M5 16h14M8 5v14M16 5v14"></path>',
      insights: '<path d="M9 18h6M10 22h4M12 2a7 7 0 0 1 4 12.7V17H8v-2.3A7 7 0 0 1 12 2z"></path>'
    };
    return '<svg viewBox="0 0 24 24">' + paths[name] + "</svg>";
  }

  function renderMonthBar() {
    var el = document.getElementById("month-bar");
    el.className = "month-bar";
    if (state.tab === "stats" && state.statsDoor !== "vault") {
      el.className = "month-bar stats-bar";
      el.innerHTML = statsMonthBarHtml();
      return;
    }
    if (state.tab === "stats" && state.statsDoor === "vault") {
      var vaultTitle = "Vault";
      if (state.vaultDocId) {
        var vaultDoc = findProfileDoc(state.vaultDocId);
        if (vaultDoc && (vaultDoc.title || vaultDoc.fileName)) {
          vaultTitle = vaultDoc.title || vaultDoc.fileName;
        }
      }
      el.innerHTML =
        '<button class="text-btn" type="button" data-act="stats-back">Back</button>' +
        "<h1>" + esc(vaultTitle) + "</h1>" +
        '<button class="icon-btn" type="button" data-act="open-profile" aria-label="Profile">⚙</button>';
      return;
    }
    if (state.tab === "worth") {
      el.innerHTML =
        '<span class="icon-btn" aria-hidden="true"></span>' +
        "<h1>Net Worth</h1>" +
        '<button class="icon-btn" type="button" data-act="open-profile" aria-label="Profile">⚙</button>';
      return;
    }
    if (state.tab === "insights") {
      el.innerHTML =
        '<span class="icon-btn" aria-hidden="true"></span>' +
        "<h1>" + esc(MONTH_NAMES[state.month - 1] + " " + state.year) + "</h1>" +
        '<button class="icon-btn" type="button" data-act="open-profile" aria-label="Profile">⚙</button>';
      return;
    }
    var leading = '<button class="icon-btn" type="button" data-act="prev-month" aria-label="Previous month">‹</button>';
    el.innerHTML =
      leading +
      "<h1>" + esc(MONTH_NAMES[state.month - 1] + " " + state.year) + "</h1>" +
      '<button class="icon-btn" type="button" data-act="next-month" aria-label="Next month">›</button>' +
      '<button class="icon-btn" type="button" data-act="open-profile" aria-label="Profile">⚙</button>';
  }

  function renderTabs() {
    var tabs = [
      ["budget", "Budget"],
      ["spend", "Transactions"],
      ["stats", "Stats"],
      ["insights", "Insights"]
    ];
    document.getElementById("tab-bar").innerHTML = tabs.map(function (t) {
      return '<button class="tab' + (state.tab === t[0] ? " active" : "") +
        '" type="button" data-act="tab" data-tab="' + t[0] + '">' +
        tabIcon(t[0]) + esc(t[1]) + "</button>";
    }).join("");
  }

  function isPremium() {
    return (state.plan || "free") === "premium";
  }

  function setPlan(plan) {
    state.plan = (window.GradeMath && window.GradeMath.normalizePlan)
      ? window.GradeMath.normalizePlan(plan)
      : (plan === "premium" ? "premium" : "free");
    saveState();
  }

  var stampWatch = { key: "", stamped: false, ready: false };

  function noteStamp(month, totals) {
    var key = ymKey(month.year, month.month);
    var stamped = !!totals.stamped;
    if (stampWatch.ready && stampWatch.key === key && stamped && !stampWatch.stamped) {
      burstTrailConfetti();
    }
    stampWatch.key = key;
    stampWatch.stamped = stamped;
    stampWatch.ready = true;
  }

  function burstTrailConfetti() {
    var host = document.querySelector(".phone") || document.body;
    var canvas = document.createElement("canvas");
    canvas.className = "trail-confetti";
    canvas.setAttribute("aria-hidden", "true");
    var width = host.clientWidth || 390;
    var height = host.clientHeight || 700;
    var scale = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    host.appendChild(canvas);
    var ctx = canvas.getContext("2d");
    if (!ctx) {
      canvas.remove();
      return;
    }
    ctx.scale(scale, scale);
    var colors = ["#1f7a61", "#5c8f74", "#c4a35a", "#2c2c2a", "#8fbfa8"];
    var pieces = [];
    var i;
    for (i = 0; i < 36; i++) {
      pieces.push({
        x: width * (0.32 + Math.random() * 0.36),
        y: height * 0.18,
        vx: (Math.random() - 0.5) * 5.2,
        vy: -(1.6 + Math.random() * 4.2),
        g: 0.16 + Math.random() * 0.1,
        w: 3 + Math.random() * 4,
        h: 5 + Math.random() * 6,
        rot: Math.random() * 6,
        vr: (Math.random() - 0.5) * 0.28,
        color: colors[i % colors.length],
        life: 42 + Math.random() * 16
      });
    }
    var frame = 0;
    function tick() {
      frame += 1;
      ctx.clearRect(0, 0, width, height);
      var alive = false;
      pieces.forEach(function (piece) {
        piece.life -= 1;
        if (piece.life <= 0) return;
        alive = true;
        piece.vy += piece.g;
        piece.x += piece.vx;
        piece.y += piece.vy;
        piece.rot += piece.vr;
        ctx.save();
        ctx.translate(piece.x, piece.y);
        ctx.rotate(piece.rot);
        ctx.globalAlpha = Math.max(0, piece.life / 36);
        ctx.fillStyle = piece.color;
        ctx.fillRect(-piece.w / 2, -piece.h / 2, piece.w, piece.h);
        ctx.restore();
      });
      if (alive && frame < 70) requestAnimationFrame(tick);
      else canvas.remove();
    }
    requestAnimationFrame(tick);
  }

  function renderBudget(month, totals) {
    noteStamp(month, totals);
    var headline = totals.leftover > 0 ? "Left to assign" :
      totals.leftover < 0 ? "Assigned more than take-home" : "Every dollar has a job";
    var html =
      '<div class="nav-row">' +
      '<button class="text-btn" type="button" data-act="toggle-edit-envelopes" aria-label="' +
      (envelopeEditMode ? "Done editing envelopes" : "Edit envelopes") + '">' +
      (envelopeEditMode ? "Done" : "Edit") + "</button>" +
      "<h2>Budget</h2>" +
      '<button class="text-btn" type="button" data-act="add-category">Add</button></div>' +
      demoBannerHtml() +
      onboardChecklistHtml() +
      fooBudgetStripHtml(month) +
      '<p class="section-label">Income · take-home paychecks</p>' +
      '<p class="caption income-basis">What lands in your account after tax. Gross pay lives on your Income statement.</p>';
    (month.incomes || []).forEach(function (item) {
      var got = receivedFor(month, item.id);
      html += '<div class="income-row-wrap"><button class="row-btn income-row" type="button" data-act="edit-income" data-id="' + item.id + '">' +
        '<div class="row"><div><div class="name">' + esc(item.name || "Paycheck 1") +
        '</div><span class="caption income-received">Received ' + money(got) + " of " + money(item.amount) + "</span>" +
        "</div><span class='mono moss'>" + money(item.amount) + "</span></div></button>" +
        docCueHtml("income") + "</div>";
    });
    html += '<button class="add-line income-add" type="button" data-act="add-income">+ Add paycheck</button>';
    html +=
      '<section class="hero">' +
      "<div><p class='kicker'>" + headline + "</p>" +
      '<p class="hero-amount ' + tone(totals.leftover) + '">' + money(totals.leftover) + "</p>" +
      '<p class="sub">Take-home planned ' + money(totals.income) + "  ·  Assigned " + money(totals.assigned) + "</p>" +
      '<p class="sub">Take-home received ' + money(totals.received) + "  ·  Spent " + money(totals.spent) + "</p></div>" +
      (totals.stamped ? '<div class="stamp" aria-label="Stamp: trail set, every dollar has a job">TRAIL SET</div>' : "") +
      "</section>" +
      modeToggleHtml() +
      '<p class="section-label">Envelopes</p>';
    var ordered = sortedCategories(month);
    ordered.forEach(function (cat, index) {
      var assigned = catAssigned(cat);
      var spent = spentFor(month, cat.id);
      var shown = envelopeAmount(assigned, spent);
      var amountClass = envelopeMode() === "remaining" && shown >= 0 ? tone(shown) : "ink";
      html += '<div class="envelope' + (envelopeEditMode ? " is-editing" : "") + '">' +
        '<div class="envelope-head">' +
        '<button class="envelope-main" type="button" data-act="open-envelope" data-id="' + cat.id + '">' +
        '<div class="name">' + esc(cat.name) + "</div>" +
        "</button>" +
        '<span class="mono ' + amountClass + '">' + money(shown) + "</span></div>";
      if (envelopeEditMode) {
        html += '<div class="envelope-tools">' +
          '<button type="button" data-act="move-up" data-id="' + cat.id + '" aria-label="Move ' + esc(cat.name) + ' up"' +
          (index === 0 ? " disabled" : "") + ">Move up</button>" +
          '<button type="button" data-act="move-down" data-id="' + cat.id + '" aria-label="Move ' + esc(cat.name) + ' down"' +
          (index === ordered.length - 1 ? " disabled" : "") + ">Move down</button>" +
          '<button class="danger" type="button" data-act="delete-category" data-id="' + cat.id + '">Delete</button></div>';
      }
      sortedLines(cat).forEach(function (line, lineIndex) {
        var lineSpent = spentOnLine(month, line.id);
        var lineShown = envelopeAmount(Number(line.assigned) || 0, lineSpent);
        var lines = sortedLines(cat);
        html += '<div class="envelope-line">';
        html += '<div class="envelope-line-head">';
        html += lineNameButton(line.name, "", 'data-act="edit-line-item" data-id="' + line.id + '"');
        var cueKind = /^debt$/i.test(cat.name) ? "loan"
          : /^insurance$/i.test(cat.name) ? "insurance"
          : /401/.test(String(line.name || "").toLowerCase()) ? "k401"
          : "";
        if (cueKind) html += docCueHtml(cueKind, line.id, line.name);
        html += '<button class="line-assigned-btn" type="button" data-act="edit-line-item" data-focus="assigned" data-id="' +
          line.id + '" aria-label="' + esc(envelopeMode() + " " + money(lineShown) + " for " + line.name) + '">' +
          money(lineShown) + "</button>";
        html += "</div>";
        if (envelopeEditMode) {
          html += '<div class="envelope-tools">' +
            '<button type="button" data-act="move-line-up" data-id="' + line.id + '"' +
            (lineIndex === 0 ? " disabled" : "") + ">Move up</button>" +
            '<button type="button" data-act="move-line-down" data-id="' + line.id + '"' +
            (lineIndex + 1 >= lines.length ? " disabled" : "") + ">Move down</button>" +
            '<button class="danger" type="button" data-act="delete-line" data-id="' + line.id + '">Delete</button></div>';
        }
        html += "</div>";
      });
      html += '<button class="add-line" type="button" data-act="add-line" data-id="' + cat.id +
        '" aria-label="Add subsection to ' + esc(cat.name) + '">+</button>';
      html += "</div>";
    });
    if (!(totals.assigned > 0) && !(totals.spent > 0) && previousPlanMonth()) {
      html += '<button class="copy-month" type="button" data-act="copy-last-month">Copy last month’s budget</button>';
    }
    html += '<button class="copy-month" type="button" data-act="start-month">Start next month</button>';
    html += '<p class="empty">On an empty month, copy last month’s assigned dollars and paychecks. Start next month is the guided ritual. Spending never copies.</p>';
    if (!totals.stamped && totals.leftover > 0) {
      html += '<p class="empty">Tap a line’s name or assigned amount to change it. Stamp rule: income &gt; 0 and leftover exactly $0.</p>';
    }
    return html;
  }

  function fooBudgetStripHtml(month) {
    if (!window.GradeMath) return "";
    var grade = window.GradeMath.evaluate(buildGradeInput(month));
    var step = grade.foo.currentStep;
    var name = window.GradeMath.fooNames[step] || "";
    return '<button class="foo-strip" type="button" data-act="foo-explain" data-step="' + step + '">' +
      "<span>Step " + step + " · " + esc(name) + "</span>" +
      '<span class="caption">Why</span></button>' +
      merchantHintHtml();
  }

  function modeToggleHtml() {
    var mode = envelopeMode();
    return '<div class="mode-toggle" role="tablist" aria-label="Envelope amount">' +
      [["planned", "Planned"], ["spent", "Spent"], ["remaining", "Remaining"]].map(function (item) {
        return '<button type="button" data-act="envelope-mode" data-mode="' + item[0] + '"' +
          (mode === item[0] ? ' class="active" aria-pressed="true"' : ' aria-pressed="false"') + ">" +
          item[1] + "</button>";
      }).join("") + "</div>";
  }

  function renderIncome(month, totals) {
    var html =
      '<div class="nav-row"><h2>Income</h2>' +
      '<button class="text-btn" type="button" data-act="add-income">Add</button></div>' +
      '<div class="row"><span>This month</span><span class="mono moss">' + money(totals.income) + "</span></div>" +
      '<div class="row"><span>Left to assign</span><span class="mono ' + tone(totals.leftover) + '">' +
      money(totals.leftover) + "</span></div>" +
      '<p class="section-label">Entries</p>';
    if (!month.incomes.length) {
      html += '<p class="empty">Add a paycheck or other income for this month.</p>';
    }
    month.incomes.forEach(function (item) {
      html += '<div class="row"><div><div class="name">' + esc(item.name || "Income") +
        '</div><span class="caption">' + esc(displayDate(item.date)) +
        "</span></div><span class='mono'>" + money(item.amount) + "</span></div>";
    });
    return html;
  }

var TRASH_SVG = '<svg class="trash-ico" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><path d="M9 3h6l1 2h4v2H4V5h4l1-2zm-3 6h12l-1 12H7L6 9zm4 2v8h1.5v-8H10zm3.5 0v8H15v-8h-1.5z" fill="currentColor"/></svg>';

  function spendRowHtml(month, tx) {
    var income = isIncomeTx(tx);
    var summary = gm().txSummary(tx);
    var refund = gm().refundLabel(tx, money);
    var standalone = !income && tx.refundKind === "standalone";
    var amountHtml;
    if (income) {
      amountHtml = '<span class="mono tx-amt income-amt">+' + money(summary.received) + "</span>";
    } else if (tx.refundKind === "full") {
      amountHtml = '<span class="mono tx-amt refunded-amt">' + money(summary.purchase) + "</span>";
    } else if (standalone) {
      amountHtml = '<span class="mono tx-amt refund-amt">↩ ' + money(summary.refund) + "</span>";
    } else {
      amountHtml = "<span class='mono tx-amt'>" + money(txTotal(tx)) + "</span>";
    }
    var caption = (isSplitTx(tx) ? "Split · " : esc(displayEnvelope(month, tx)) + " · ") +
      esc(displayDate(tx.date)) +
      (tx.note && !isSplitTx(tx) ? " · " + esc(tx.note) : "");
    if (!income && tx.refundKind === "partial" && summary.refund > 0) caption += " · Net " + esc(money(summary.net));
    if (standalone) caption += " · Money back, not income";
    var chips = "";
    if (income) chips += ' <span class="income-chip">Income</span>';
    if (isSplitTx(tx)) chips += ' <span class="split-stamp">Split</span>';
    if (refund) chips += ' <span class="refund-chip">' + esc(refund) + "</span>";
    return '<div class="tx-swipe" data-swipe-id="' + esc(tx.id) + '">' +
      '<button class="tx-swipe-delete" type="button" data-act="swipe-delete" data-id="' + esc(tx.id) +
      '" tabindex="-1" aria-label="Delete ' + esc(tx.payee || "transaction") + '" title="Delete">' + TRASH_SVG +
      '<span class="tx-swipe-label">Delete</span></button>' +
      '<button class="row-btn tx-row' + (income ? " tx-income" : "") + (refund ? " tx-refund" : "") +
      '" type="button" data-act="edit-spend" data-id="' + esc(tx.id) + '">' +
      '<div class="row"><div><div class="name">' + esc(tx.payee || (income ? "Income" : "Spend")) + chips +
      '</div><span class="caption">' + caption + "</span></div>" + amountHtml + "</div></button></div>";
  }

  function renderSpend(month, totals) {
    var html =
      '<div class="nav-row"><h2>Transactions</h2>' +
      '<button class="text-btn" type="button" data-act="add-spend"' +
      (month.categories.length ? "" : " disabled") + ">Add</button></div>" +
      '<div class="row"><span>Spent this month</span><span class="mono">' + money(totals.spent) + "</span></div>" +
      (totals.refunds > 0 ? '<div class="row dense"><span class="caption">Refunds netted out</span><span class="mono caption">' + money(totals.refunds) + "</span></div>" : "") +
      '<div class="row"><span>Take-home received this month</span><span class="mono moss">+' + money(totals.received) + "</span></div>" +
      '<input class="search-field" data-act="spend-search" type="search" placeholder="Search this month" value="' +
      esc(spendSearch) + '">' +
      '<p class="section-label">Transactions</p>';
    var txs = (month.transactions || []).filter(function (tx) { return txMatches(month, tx, spendSearch); });
    if (!month.transactions.length) {
      html += '<p class="empty">Spend from a category, or log a paycheck as Income. Expenses reduce that envelope’s remaining amount; income counts toward Received.</p>';
    } else if (!txs.length) {
      html += '<p class="empty">No transactions match that search.</p>';
    }
    // v37.5.59.12 (QA M10): draw at most spendShowLimit rows; huge months page in 200 at a time.
    var shownTx = txs.length > spendShowLimit ? txs.slice(0, spendShowLimit) : txs;
    var rowParts = [];
    shownTx.forEach(function (tx) { rowParts.push(spendRowHtml(month, tx)); });
    html += rowParts.join("");
    if (txs.length > shownTx.length) {
      html += '<button class="text-btn" type="button" data-act="tx-show-more">Show ' +
        Math.min(TX_PAGE, txs.length - shownTx.length) + ' more (' + (txs.length - shownTx.length) + ' not shown)</button>';
    }
    if (txs.length) html += '<p class="caption swipe-hint">Tip: swipe a row left (or hover / drag with a mouse) to reveal the trash can. Deleting asks once and can’t be undone.</p>';
    return html;
  }

  function rateOrDash(rate) {
    return rate == null ? "—" : percent(rate);
  }

  function renderStatsLanding() {
    /* v37.5.18: busy twin/chip door wall removed. Default is Balance sheet; this path is a quiet Vault/Goals fallback. */
    return '<div class="nav-row"><h2>Stats</h2></div>' +
      statsSegmentHtml("worth") +
      '<p class="caption">Open Income statement or Net worth above. Vault keeps papers and policies.</p>' +
      goalsOnStatsHtml();
  }

  function goalCatalog() {
    var built = (window.GradeMath && window.GradeMath.goalChips) || [
      { id: "buy-home", label: "Buy a home" },
      { id: "start-business", label: "Start a business" },
      { id: "kill-debt", label: "Kill debt" },
      { id: "invest", label: "Invest" },
      { id: "emergency-fund", label: "Emergency fund" },
      { id: "retire", label: "Retire on my terms" },
      { id: "travel", label: "Travel" },
      { id: "education", label: "Education / kids" }
    ];
    var custom = ((state.matters && state.matters.customGoals) || []).filter(function (item) {
      return item && item.id && item.label;
    });
    return built.concat(custom);
  }

  function openGoalEditor(opts) {
    opts = opts || {};
    state.matters = migrateMatters(state.matters);
    var plan = (state.matters.goalPlans || []).filter(function (item) { return item.id === opts.id; })[0];
    var date = opts.date != null ? opts.date : (plan ? plan.targetDate : "");
    var amount = opts.amount != null ? opts.amount : (plan ? plan.amount : 0);
    var selected = opts.id && (state.matters.goals || []).indexOf(opts.id) >= 0;
    var html = "";
    if (opts.isNew) {
      html += field("Name", "goalLabel", opts.label || "");
    } else {
      html += '<p class="name">' + esc(opts.label || "Goal") + "</p>" +
        '<input type="hidden" name="goalLabel" value="' + esc(opts.label || "") + '">';
    }
    html += field("Target date", "goalDate", date || "", "date") +
      field("Dollar amount", "goalAmount", String(amount || 0), "number") +
      '<input type="hidden" name="goalId" value="' + esc(opts.id || "") + '">' +
      '<input type="hidden" name="goalIsNew" value="' + (opts.isNew ? "1" : "0") + '">' +
      '<input type="hidden" name="goalReturn" value="' + esc(opts.returnTo || "stats") + '">';
    if (opts.error) html += '<p class="caption rust">' + esc(opts.error) + "</p>";
    if (!opts.isNew && selected) {
      html += '<button class="text-btn danger" type="button" data-act="remove-goal" data-id="' +
        esc(opts.id || "") + '" data-return="' + esc(opts.returnTo || "stats") + '">Remove</button>';
    }
    openSheet(opts.isNew ? "Add a goal" : "Edit goal", html, "save-goal");
  }

  function goalsOnStatsHtml() {
    state.matters = migrateMatters(state.matters);
    var selected = state.matters.goals || [];
    var html = '<p class="section-label">Goals</p><div class="goal-chips">';
    goalCatalog().forEach(function (chip) {
      html += '<button class="goal-chip' + (selected.indexOf(chip.id) >= 0 ? " on" : "") +
        '" type="button" data-act="edit-goal" data-id="' + esc(chip.id) + '" data-return="stats">' +
        esc(chip.label) + "</button>";
    });
    html += "</div>" +
      '<label class="field goal-add">Add a goal' +
      '<input data-act="custom-goal" type="text" placeholder="e.g. Boat" value=""></label>' +
      '<button class="text-btn" type="button" data-act="add-custom-goal">Add</button>' +
      '<p class="caption">Chip shows the name. Tap to set a target date and dollar amount.</p>';
    return html;
  }

  function vaultHiddenPickers() {
    return '<input id="vault-doc-camera" data-act="vault-doc-file" accept="image/*" capture="environment" type="file" hidden>' +
      '<input id="vault-doc-file" data-act="vault-doc-file" accept="image/*,application/pdf,.pdf,.png,.jpg,.jpeg,.heic,.webp" type="file" hidden>';
  }

  function vaultChipHtml(doc) {
    if (doc.vaultType !== "other") return "";
    var slot = normalizeDocSlot(doc.slot);
    if (slot !== "payStubs" && slot !== "k401") return "";
    return '<span class="vault-chip">' + esc(docSlotTitle(slot)) + "</span>";
  }

  function vaultRowMoneyHtml(doc) {
    var row = vaultRowMoney(doc);
    if (!row) return '<span class="vault-row-money muted">—</span>';
    return '<span class="vault-row-money mono">' + money(row.amount) +
      (row.suffix ? " <span class='caption'>" + esc(row.suffix) + "</span>" : "") + "</span>";
  }

  function aprLabel(rate) {
    var n = Number(rate);
    if (!(n > 0)) return "";
    var rounded = Math.round(n * 10) / 10;
    return (rounded % 1 === 0 ? String(Math.round(rounded)) : rounded.toFixed(1)) + "% APR";
  }

  function vaultLoanFacts(doc) {
    var type = doc.vaultType || inferVaultType(doc);
    if (type !== "loan" && type !== "mortgage") return "";
    var bits = [];
    if ((Number(doc.balance) || 0) > 0) bits.push(money(Number(doc.balance)));
    var rate = aprLabel(doc.rate);
    if (rate) bits.push(rate);
    return bits.join(" · ");
  }

  function vaultRowSecondary(doc) {
    if (gm().vaultRowSecondary) return gm().vaultRowSecondary(doc) || "";
    return "";
  }

  function vaultLimitBoxes(doc) {
    var parsed = gm().parseLiabilityLimits
      ? gm().parseLiabilityLimits(doc.limits)
      : { perPerson: 0, perAccident: 0, property: 0 };
    var rows = [
      ["Bodily injury / person", "limitPerPerson", parsed.perPerson,
        "Max the policy pays for injuries to one person in a crash you’re liable for."],
      ["Bodily injury / accident", "limitPerAccident", parsed.perAccident,
        "Max for all injured people in one crash."],
      ["Property damage", "limitProperty", parsed.property,
        "Max for other people’s property (their car, fence, etc.) in one crash."]
    ];
    return rows.map(function (row) {
      var shown = row[2] > 0 ? money(row[2]) : "";
      return '<label class="field">' + esc(row[0]) +
        '<input data-act="vault-field" data-field="' + row[1] + '" data-id="' + esc(doc.id) +
        '" data-cents="1" class="cents-input" name="' + esc(vaultControlName(doc.id, row[1])) +
        '" inputmode="numeric" autocomplete="off" type="text" value="' + esc(shown) + '">' +
        '<span class="caption">' + esc(row[3]) + "</span></label>";
    }).join("");
  }

  function vaultPayoffField(doc) {
    var stored = String(doc.term || "").replace(/^\s+|\s+$/g, "");
    var estimate = gm().estimateLoanPayoff ? (gm().estimateLoanPayoff(doc) || "") : "";
    var shown = stored || estimate;
    var caption = (!stored && estimate) || (estimate && stored === estimate)
      ? "Estimated from balance, APR, and min payment."
      : "When this loan is paid off.";
    return vaultText("Payoff date", "term", shown, doc.id, ' placeholder="Sep 2030"') +
      '<p class="caption">' + esc(caption) + "</p>";
  }

  function vaultFreqTitle(freq) {
    var id = String(freq || "monthly");
    var row = (VAULT_FREQ || []).filter(function (item) { return item.id === id; })[0];
    return row ? row.title.toLowerCase() : id;
  }

  function vaultMonthlyInnerHtml(doc) {
    var cost = gm().insuranceMonthlyCost ? gm().insuranceMonthlyCost(doc) : null;
    if (!cost) return "";
    var html = '<div class="vault-monthly">';
    if (cost.estimated) {
      html += '<span class="name">About ' + money(cost.amount) + "/mo</span>" +
        '<span class="caption">Estimated from the ' + money(doc.premium) + " " +
        esc(vaultFreqTitle(cost.frequency)) + " premium (÷ " + cost.months +
        "). Not the bill amount.</span>";
    } else {
      html += '<span class="name">Monthly cost ' + money(cost.amount) + "</span>" +
        '<span class="caption">Same as the premium — what you pay each month.</span>';
    }
    html += "</div>";
    if (gm().insuranceBillingNeedsPrompt && gm().insuranceBillingNeedsPrompt(doc)) {
      html += '<div class="vault-pay-ask">' +
        '<p class="caption">Do you pay this monthly?</p>' +
        '<button class="text-btn" type="button" data-act="vault-pay-monthly" data-answer="yes" data-id="' +
        esc(doc.id) + '">Yes, monthly</button>' +
        '<button class="text-btn" type="button" data-act="vault-pay-monthly" data-answer="no" data-id="' +
        esc(doc.id) + '">No — keep this billing</button></div>';
    }
    return html;
  }

  function paintVaultMonthly(doc) {
    var node = document.getElementById("vault-monthly-block");
    if (!node || !doc) return;
    node.innerHTML = vaultMonthlyInnerHtml(doc);
  }

  function renderVault() {
    state.profile = migrateProfile(state.profile, state.foo, state.compensation);
    if (state.vaultDocId) {
      var open = findProfileDoc(state.vaultDocId);
      if (open) return renderVaultDetail(open);
      state.vaultDocId = "";
    }
    var docs = state.profile.documents || [];
    var html = '<div class="nav-row"><h2>Vault</h2>' +
      '<button class="doc-add" type="button" data-act="vault-doc-plus" aria-label="Add paper">+</button></div>' +
      '<p class="caption vault-lead">Same papers as Profile Documents. PDFs autofill insurance and loan fields. Tester sharing can include only how many documents you have and their types (Profile › Data sharing).</p>';
    if (vaultPickMode) {
      html += '<div class="doc-picker vault-picker">' +
        '<button class="planner-apply" type="button" data-act="vault-doc-camera">Take photo</button>' +
        '<button class="planner-apply" type="button" data-act="vault-doc-choose">Choose file</button>' +
        '<p class="caption">Or start a card without a file.</p></div>';
    }
    html += vaultHiddenPickers();
    html += '<div class="vault-type-adds">';
    VAULT_TYPES.forEach(function (item) {
      html += '<button class="vault-type-add" type="button" data-act="vault-add-type" data-type="' +
        item.id + '">+ ' + esc(item.title) + "</button>";
    });
    html += '<span class="vault-type-add-item"><button class="vault-type-add" type="button" data-act="vault-add-paystub">+ Pay stub</button>' +
      '<span class="caption">We can read this</span></span>';
    html += "</div>";
    if (!docs.length) {
      html += '<p class="empty">Empty vault. Add a paper or start a typed card.</p>';
      return html;
    }
    var loanSortShown = false;
    var payStubRows = docs.filter(function (doc) { return normalizeDocSlot(doc.slot) === "payStubs"; });
    if (payStubRows.length) {
      html += '<p class="section-label">Pay stubs</p>';
      payStubRows.forEach(function (doc) {
        var review = docNeedsReview(doc) ? '<span class="door-badge door-badge-alert vault-row-alert">!</span>' : "";
        html += '<div class="vault-row">' +
          '<button class="vault-row-main" type="button" data-act="vault-open" data-id="' + esc(doc.id) + '">' +
          '<span class="vault-row-copy"><span class="vault-row-title">' +
          '<span class="name">' + esc(doc.title || doc.fileName || "Pay stub") +
          "</span>" + vaultChipHtml(doc) + review + "</span></span>" +
          vaultRowMoneyHtml(doc) + "</button>" +
          '<label class="field vault-inline-title">Title' +
          '<input data-act="vault-field" data-id="' + esc(doc.id) + '" data-field="title" name="' +
          esc(vaultControlName(doc.id, "title")) + '" autocomplete="off" type="text" value="' +
          esc(doc.title || "") + '"></label>' +
          '<button class="text-btn danger vault-row-delete" type="button" data-act="vault-delete" data-id="' +
          esc(doc.id) + '">Delete</button></div>';
      });
    }
    VAULT_TYPES.forEach(function (group) {
      var rows = docs.filter(function (doc) {
        if (normalizeDocSlot(doc.slot) === "payStubs") return false;
        return (doc.vaultType || inferVaultType(doc)) === group.id;
      });
      if (!rows.length) return;
      if (group.id === "loan" || group.id === "mortgage") {
        if (!loanSortShown) {
          html += loanSortControlHtml();
          loanSortShown = true;
        }
        rows = sortedLoanDocs(rows);
      }
      html += '<p class="section-label">' + esc(group.title) + "</p>";
      rows.forEach(function (doc) {
        var review = docNeedsReview(doc) ? '<span class="door-badge door-badge-alert vault-row-alert">!</span>' : "";
        html += '<div class="vault-row">' +
          '<button class="vault-row-main" type="button" data-act="vault-open" data-id="' + esc(doc.id) + '">' +
          '<span class="vault-row-copy"><span class="vault-row-title">' +
          '<span class="name">' + esc(doc.title || doc.fileName || group.title) +
          "</span>" + vaultChipHtml(doc) + review + "</span>" +
          (vaultLoanFacts(doc)
            ? '<span class="vault-row-sub">' + esc(vaultLoanFacts(doc)) + "</span>"
            : "") +
          (vaultRowSecondary(doc)
            ? '<span class="vault-row-sub">' + esc(vaultRowSecondary(doc)) + "</span>"
            : "") +
          "</span>" +
          vaultRowMoneyHtml(doc) + "</button>" +
          '<label class="field vault-inline-title">Title' +
          '<input data-act="vault-field" data-id="' + esc(doc.id) + '" data-field="title" name="' +
          esc(vaultControlName(doc.id, "title")) + '" autocomplete="off" type="text" value="' +
          esc(doc.title || "") + '"></label>' +
          '<button class="text-btn danger vault-row-delete" type="button" data-act="vault-delete" data-id="' +
          esc(doc.id) + '">Delete</button></div>';
      });
    });
    return html;
  }

  function vaultControlName(docId, field) {
    return "vault-" + String(docId || "none") + "-" + String(field || "field");
  }

  function vaultProviderNameKey(type) {
    if (type === "insurance") return "carrier";
    if (type === "loan" || type === "mortgage") return "lender";
    return "source";
  }

  function vaultSelect(label, field, value, options, docId) {
    return '<label class="field">' + esc(label) + '<select data-act="vault-field" data-field="' + field +
      '" data-id="' + esc(docId || "") + '" name="' + esc(vaultControlName(docId, field)) +
      '" autocomplete="off">' +
      options.map(function (item) {
        return '<option value="' + esc(item.id) + '"' + (value === item.id ? " selected" : "") + ">" +
          esc(item.title) + "</option>";
      }).join("") +
      "</select></label>";
  }

  function vaultText(label, field, value, docId, extra) {
    return '<label class="field">' + esc(label) +
      '<input data-act="vault-field" data-field="' + field + '" data-id="' + esc(docId || "") +
      '" name="' + esc(vaultControlName(docId, field)) + '" autocomplete="off" type="text" value="' +
      esc(value || "") + '"' + (extra || "") + "></label>";
  }

  function vaultProviderField(label, doc) {
    var type = doc.vaultType || inferVaultType(doc);
    return '<label class="field">' + esc(label) +
      '<input data-act="vault-field" data-field="provider" data-id="' + esc(doc.id) +
      '" name="' + esc(vaultControlName(doc.id, vaultProviderNameKey(type))) +
      '" autocomplete="off" type="text" value="' +
      esc(doc.provider || "") + '"></label>';
  }

  function vaultNotesField(doc) {
    return '<label class="field">Notes<textarea data-act="vault-field" data-field="notes" data-id="' +
      esc(doc.id) + '" name="' + esc(vaultControlName(doc.id, "notes")) +
      '" autocomplete="off">' +
      esc(doc.notes || "") + "</textarea></label>";
  }

  function vaultMoneyField(label, field, value, docId) {
    return '<label class="field">' + esc(label) +
      '<input data-act="vault-field" data-field="' + field + '" data-id="' + esc(docId || "") +
      '" data-cents="1" class="cents-input" name="' +
      esc(vaultControlName(docId, field)) + '" inputmode="numeric" autocomplete="off" type="text" value="' +
      esc(money(Number(value) || 0)) + '"></label>';
  }

  function vaultRateField(label, field, value, docId) {
    return '<label class="field">' + esc(label) +
      '<input data-act="vault-field" data-field="' + field + '" data-id="' + esc(docId || "") +
      '" name="' + esc(vaultControlName(docId, field)) +
      '" autocomplete="off" inputmode="decimal" type="text" value="' +
      esc(value ? String(value) : "") + '"></label>';
  }

  function vaultFileBlockHtml(doc) {
    var html = '<div class="vault-file-block">' +
      '<p class="section-label">Paper first</p>' +
      vaultHiddenPickers();
    if (doc.hasBlob || doc.dataUrl || doc.fileName) {
      html += '<p class="caption">' + esc(doc.fileName || "File on this device") + "</p>" +
        '<button class="text-btn" type="button" data-act="open-profile-doc" data-id="' + esc(doc.id) +
        '">Open file</button>';
    } else {
      html += '<p class="caption">Upload first when you can — title autofills from the filename. Fields still work without a file.</p>';
    }
    html += '<button class="planner-apply" type="button" data-act="vault-doc-camera">Take photo</button>' +
      '<button class="planner-apply" type="button" data-act="vault-doc-choose">Choose file</button>' +
      '<p class="caption">Tester sharing can include only how many documents you have and their types (Profile › Data sharing). PDF text can autofill. Always editable after.</p></div>';
    return html;
  }

  function renderVaultDetail(doc) {
    maybeAutofillOpenVaultDoc(doc);
    var type = doc.vaultType || inferVaultType(doc);
    var id = doc.id;
    var review = docNeedsReview(doc);
    var html = '<div class="vault-detail">';
    html += payStubReviewHtml(doc);
    if (doc.pdfAutofillReview) {
      html += '<p class="vault-review vault-pdf-review">Autofilled from PDF — review</p>';
    }
    if (doc.pdfQuickReadFailed) {
      html += '<p class="vault-review">' + esc(pdfQuickReadCopy()) + "</p>" +
        '<button class="text-btn" type="button" data-act="vault-pdf-retry" data-id="' + esc(doc.id) +
        '">Retry read</button>';
    } else if (doc.pdfPremiumMissing || ((doc.vaultType === "insurance" || doc.slot === "insurance") &&
        !(Number(doc.premium) > 0) && (doc.hasBlob || doc.dataUrl) &&
        !(doc.touchedFields && doc.touchedFields.premium) && doc.pdfScanned)) {
      html += '<p class="vault-review">' + esc(gm().insuranceUnreadPremiumCopy
        ? gm().insuranceUnreadPremiumCopy()
        : "Policy on file — could not read premium; edit the Vault card or re-upload.") + "</p>";
    }
    html += (review
        ? '<p id="vault-review" class="vault-review">Needs review — add a money field or attach a file' +
          (type !== "other" ? " (and a provider / lender)" : "") + ".</p>"
        : '<p id="vault-review" class="vault-review is-clear" hidden>Looks complete.</p>') +
      vaultFileBlockHtml(doc) +
      vaultSelect("Type", "vaultType", type, VAULT_TYPES, id) +
      vaultText("Title", "title", doc.title, id);
    if (type === "insurance") {
      html += vaultProviderField("Provider", doc) +
        vaultText("Policy #", "policyNumber", doc.policyNumber, id) +
        vaultText("Insured items", "insuredItems", doc.insuredItems, id) +
        vaultMoneyField("Premium", "premium", doc.premium, id) +
        vaultSelect("Billing", "premiumFrequency", doc.premiumFrequency || "monthly", VAULT_FREQ, id) +
        '<p class="caption">How this premium is billed. Monthly uses the premium as the monthly cost. Anything longer is averaged.</p>' +
        '<div id="vault-monthly-block">' + vaultMonthlyInnerHtml(doc) + "</div>" +
        vaultText("Deductibles", "deductibles", doc.deductibles, id) +
        vaultLimitBoxes(doc) +
        vaultText("Term / renewal", "termRenewal", doc.termRenewal, id) +
        vaultNotesField(doc);
    } else if (type === "mortgage") {
      html += vaultProviderField("Lender", doc) +
        vaultMoneyField("Balance", "balance", doc.balance, id) +
        vaultMoneyField("Original balance", "originalBalance", doc.originalBalance, id) +
        vaultRateField("Rate %", "rate", doc.rate, id) +
        vaultMoneyField("Payment", "payment", doc.payment, id) +
        vaultSelect("Escrow", "escrow", doc.escrow || "", [
          { id: "", title: "—" },
          { id: "yes", title: "Yes" },
          { id: "no", title: "No" }
        ], id) +
        vaultText("Term / maturity", "term", doc.term, id) +
        vaultText("Property", "property", doc.property, id) +
        vaultAddToNetWorthHtml(doc);
    } else if (type === "loan") {
      html += vaultProviderField("Lender", doc) +
        vaultText("Account #", "policyNumber", doc.policyNumber, id) +
        vaultMoneyField("Balance", "balance", doc.balance, id) +
        vaultMoneyField("Original balance", "originalBalance", doc.originalBalance, id) +
        vaultRateField("APR %", "rate", doc.rate, id) +
        vaultMoneyField("Min payment", "minPayment", doc.minPayment, id) +
        vaultPayoffField(doc) +
        vaultText("Collateral", "collateral", doc.collateral, id) +
        vaultAddToNetWorthHtml(doc);
    } else {
      html += vaultProviderField("Provider / source", doc) +
        vaultMoneyField("Payment", "payment", doc.payment, id) +
        vaultNotesField(doc);
      if (normalizeDocSlot(doc.slot) === "payStubs" && !doc.payStubReview) {
        html += '<p class="caption">Feeds your Income statement on Stats and Compensation. Upload a pay stub PDF to autofill (you review before anything is saved).</p>';
        if (!doc.payStubConfirmed) {
          html += '<button class="text-btn" type="button" data-act="paystub-manual" data-id="' + esc(id) + '">Type pay stub numbers instead</button>';
        }
        if (doc.payStubConfirmed) {
          html += '<button class="planner-apply" type="button" data-act="open-income-statement">Open Compensation</button>';
        }
      }
    }
    html += '<button class="text-btn danger vault-delete" type="button" data-act="vault-delete" data-id="' +
      esc(id) + '">Delete</button>';
    return html + "</div>";
  }

  function vaultAddToNetWorthHtml(doc) {
    return '<label class="check"><input type="checkbox" data-act="vault-field" data-field="addToNetWorth" data-id="' +
      esc(doc.id) + '"' + (doc.addToNetWorth !== false ? " checked" : "") +
      '> Add to Net Worth</label>' +
      '<p class="caption">Creates or updates a matching liability. Uncheck unlinks; the Net Worth row stays.</p>';
  }

  function monthsToPayOff(balance, aprPercent, payment) {
    if (window.GradeMath && window.GradeMath.monthsToPayOff) {
      return window.GradeMath.monthsToPayOff(balance, aprPercent, payment);
    }
    balance = Number(balance) || 0;
    aprPercent = Number(aprPercent) || 0;
    payment = Number(payment) || 0;
    if (!(balance > 0) || !(aprPercent > 0) || !(payment > 0)) return null;
    var r = (aprPercent / 100) / 12;
    var interest = balance * r;
    if (payment <= interest + 0.0001) return null;
    var n = Math.log(payment / (payment - interest)) / Math.log(1 + r);
    if (!isFinite(n) || n <= 0) return null;
    return Math.ceil(n - 0.0000001);
  }

  function formatDuration(months) {
    if (months <= 0) return "0 months";
    if (months < 12) return months === 1 ? "1 month" : months + " months";
    var years = Math.floor(months / 12);
    var leftover = months % 12;
    var yearPart = years === 1 ? "1 year" : years + " years";
    if (!leftover) return yearPart;
    return yearPart + " " + (leftover === 1 ? "1 month" : leftover + " months");
  }

  function debtLineNames() {
    var month = monthRecord();
    var names = [];
    if (!month) return names;
    (month.categories || []).forEach(function (cat) {
      if (!/^debt$/i.test(cat.name)) return;
      (cat.lines || []).forEach(function (line) {
        names.push(String(line.name || "").toLowerCase());
      });
    });
    return names;
  }

  function collectLoans(month) {
    return collectListedDebts(month).filter(function (loan) {
      return loan.balance > 0 && loan.apr > 0 && loan.min > 0;
    });
  }

  function collectListedDebts(month) {
    var seen = {};
    var loans = [];
    (month.categories || []).forEach(function (cat) {
      if (!/^debt$/i.test(cat.name)) return;
      (cat.lines || []).forEach(function (line) {
        seen[String(line.name || "").toLowerCase()] = true;
        loans.push({
          id: line.id,
          source: "envelope",
          name: line.name,
          balance: Number(line.loanBalance) || 0,
          apr: Number(line.loanApr) || 0,
          min: Number(line.loanMinPayment) || 0,
          originalBalance: Number(line.loanOriginalBalance) || 0,
          debtType: line.loanDebtType || ""
        });
      });
    });
    var year = state.worthYear || 2025;
    (state.worth.lines || []).forEach(function (line) {
      if (line.kind !== "liability") return;
      var key = String(line.name || "").toLowerCase();
      if (seen[key]) return;
      var nwAmount = lineAmount(line, year);
      if ((Number(line.loanBalance) || 0) > 0 || (Number(line.loanApr) || 0) > 0 ||
          (Number(line.loanMinPayment) || 0) > 0 || nwAmount > 0) {
        loans.push({
          id: line.id,
          source: "nw",
          name: line.name,
          balance: (Number(line.loanBalance) || 0) > 0 ? Number(line.loanBalance) : nwAmount,
          apr: Number(line.loanApr) || 0,
          min: Number(line.loanMinPayment) || 0,
          originalBalance: Number(line.loanOriginalBalance) || 0,
          debtType: line.loanDebtType || ""
        });
      }
    });
    return loans;
  }

  function classifiedDebtSet(month) {
    var GM = window.GradeMath;
    var listed = collectListedDebts(month);
    return GM.classifyDebts(listed, GM.ageYears(birthdayISO()));
  }

  function debtTypeSelect(fieldName, value, nameForHint) {
    var GM = window.GradeMath;
    var current = value || "";
    var inferred = GM.debtTypeFromName(nameForHint || "");
    var options = [
      { id: "", label: "Auto from name (" + GM.debtTypeLabel(inferred) + ")" },
      { id: "creditCard", label: "Credit card" },
      { id: "student", label: "Student" },
      { id: "auto", label: "Auto" },
      { id: "personal", label: "Personal" },
      { id: "mortgage", label: "Mortgage" },
      { id: "other", label: "Other" }
    ];
    return '<label class="field">Debt type<select name="' + esc(fieldName) + '">' +
      options.map(function (opt) {
        return '<option value="' + esc(opt.id) + '"' + (current === opt.id ? " selected" : "") + ">" +
          esc(opt.label) + "</option>";
      }).join("") +
      "</select></label>";
  }

  function fooHelpButton(step) {
    return '<button class="foo-help" type="button" data-act="foo-explain" data-step="' + step +
      '" aria-label="What is this step">?</button>';
  }

  function fooInkCheck() {
    return '<span class="foo-ink-check" aria-label="done" title="done">' +
      '<svg viewBox="0 0 24 18" aria-hidden="true">' +
      '<path d="M2.2 9.6c2.6 1.8 4.6 5.2 5.8 7.6C12.4 8.4 16.6 4.2 22.4 2.4"/>' +
      "</svg></span>";
  }

  function fooDoneCluster(step) {
    return '<span class="foo-done-meta">' + fooInkCheck() + fooHelpButton(step) + "</span>";
  }

  function deductiblesAreCovered(foo) {
    foo = migrateFoo(foo);
    return (Number(foo.deductibles) || 0) > 0 || foo.deductiblesCovered === true;
  }

  function highestDeductibleNoteHtml(foo) {
    foo = migrateFoo(foo);
    if (!deductiblesAreCovered(foo)) return "";
    return '<div class="foo-worst-deductible">' +
      '<label class="field">Worst-case / highest deductible' +
      '<input class="cents-input" data-dollars="1" data-act="foo-money" data-field="highestDeductible" inputmode="numeric" autocomplete="off" type="text" value="' +
      esc(money(foo.highestDeductible)) + '"></label>' +
      '<p class="caption">The largest insurance deductible — not your emergency fund.</p></div>';
  }

  function formatPercentPoints(value) {
    var n = Number(value);
    if (!isFinite(n)) return "";
    var rounded = Math.round(n * 10) / 10;
    return (rounded % 1 === 0 ? String(rounded) : rounded.toFixed(1)) + "%";
  }

  function incomeEmployerRates(plan) {
    plan = migrateCompensation(plan || state.compensation || defaultCompensation());
    var GM = window.GradeMath;
    return {
      match: GM.enteredEmployerPercent(plan.employer401kMatch, plan.employer401kMatchIsPercent),
      base: GM.enteredEmployerPercent(plan.employer401kBase, plan.employer401kBaseIsPercent)
    };
  }

  function fooEmployerRatesHtml() {
    var rates = incomeEmployerRates();
    var bits = [];
    if (rates.match != null) bits.push(formatPercentPoints(rates.match) + " employer match");
    if (rates.base != null) bits.push(formatPercentPoints(rates.base) + " employer base");
    var html = '<div class="foo-income-rates">';
    if (bits.length) html += "<p>From Income: " + bits.join(" · ") + ".</p>";
    if (bits.length < 2) {
      html += '<p class="caption">Add employer match % and employer base % on Income / Stats. Paper Trail never invents a percent.</p>' +
        '<button class="matters-btn" type="button" data-act="open-income-statement">Open Compensation</button>';
    }
    html += "</div>";
    return html;
  }

  function fooBadgeButton(item, loan) {
    if (!item || item.fooStep !== 3 || !item.badge) return "";
    var id = (loan && loan.id) || "";
    var source = (loan && loan.source) || "";
    return '<button class="foo-badge" type="button" data-act="foo3-callout" data-id="' +
      esc(id) + '" data-source="' + esc(source) + '">' + esc(item.badge) + "</button>";
  }

  function fooLoanExtra(name) {
    var extras = (state.foo && state.foo.loanExtras) || {};
    var value = Number(extras[name]);
    return value > 0 ? value : 100;
  }

  function formatPayoffDate(months) {
    var d = new Date();
    d.setMonth(d.getMonth() + Math.max(0, Number(months) || 0));
    return MONTH_NAMES[d.getMonth()].slice(0, 3) + " " + d.getFullYear();
  }

  function checklistMatchPercent() {
    var raw = state.foo && state.foo.matchPercent;
    if (raw === "" || raw == null) return null;
    var value = Number(raw);
    return value > 0 ? value : null;
  }

  function budgetLinesFromMonth(month) {
    var lines = [];
    (month.categories || []).forEach(function (cat) {
      var catLines = cat.lines || [];
      if (!catLines.length) {
        lines.push({
          envelope: cat.name,
          name: cat.name,
          assigned: Number(cat.assigned) || 0,
          minPayment: 0
        });
        return;
      }
      catLines.forEach(function (line) {
        lines.push({
          envelope: cat.name,
          name: line.name,
          assigned: Number(line.assigned) || 0,
          minPayment: Number(line.loanMinPayment) || 0
        });
      });
    });
    return lines;
  }

  function gradeMonthFor(month) {
    var totals = sums(month);
    if (totals.income > 0 || totals.assigned > 0) return month;
    var keys = Object.keys(state.months || {}).sort(function (a, b) {
      var am = state.months[a];
      var bm = state.months[b];
      if (am.year !== bm.year) return bm.year - am.year;
      return bm.month - am.month;
    });
    for (var i = 0; i < keys.length; i++) {
      var candidate = state.months[keys[i]];
      if (candidate.year > month.year || (candidate.year === month.year && candidate.month >= month.month)) continue;
      var ct = sums(candidate);
      if (ct.income > 0 || ct.assigned > 0) return candidate;
    }
    return month;
  }

  function cashOnHandForYear(year) {
    var cash = 0;
    ((state.worth && state.worth.lines) || []).forEach(function (line) {
      if (line.group !== "cash") return;
      var name = String(line.name || "").toLowerCase();
      if (name === "checking" || name === "saving" || name === "savings") {
        cash += lineAmount(line, year);
      }
    });
    return cash;
  }

  function completedStatementMeta() {
    migrateWorthIncome(state.worth);
    var years = ((state.worth && state.worth.years) || []).slice().sort(function (a, b) { return a - b; });
    var completed = years.filter(function (year) {
      return (Number((state.worth.income || {})[year]) || 0) !== 0 && worthTotals(year).equity !== 0;
    });
    if (!completed.length) return { years: [], consecutive: 0, hasGap: false };
    var latest = completed[completed.length - 1];
    var consecutive = 0;
    var cursor = latest;
    while (completed.indexOf(cursor) >= 0) {
      consecutive += 1;
      cursor -= 1;
    }
    var span = completed[completed.length - 1] - completed[0] + 1;
    return {
      years: completed,
      consecutive: consecutive,
      hasGap: completed.length >= 2 && span !== completed.length
    };
  }

  function deltaNWToIncome(completed) {
    if (!completed.years.length) return null;
    var latest = completed.years[completed.years.length - 1];
    var prior = latest - 1;
    var currentNW = worthTotals(latest).equity;
    var priorTotals = worthTotals(prior);
    var priorHas = ((state.worth && state.worth.lines) || []).some(function (line) {
      return lineAmount(line, prior) !== 0;
    });
    if (!priorHas && priorTotals.equity === 0) return null;
    var income = yearIncomeFigure(latest).amount;
    var fallback = currentAnnualIncomeHeadline().amount;
    var denom = income > 0 ? income : fallback;
    if (!(denom > 0)) return null;
    return (currentNW - priorTotals.equity) / denom;
  }

  /* v37.5.59.13 (owner): FOO Step 1 (deductibles) stays hidden — and never blocks — until the user has
     entered budget data: any transaction, any non-zero income line, or any envelope with an assigned amount
     in any month. Net Worth balances or Vault papers alone don't count. */
  function fooStep1Shown() {
    var months = state.months || {};
    return Object.keys(months).some(function (key) {
      var m = months[key];
      if (!m) return false;
      if ((m.transactions || []).length) return true;
      if ((m.incomes || []).some(function (i) { return (Number(i.amount) || 0) !== 0; })) return true;
      return (m.categories || []).some(function (c) { return catAssigned(c) !== 0; });
    });
  }

  function buildGradeInput(month) {
    var GM = window.GradeMath;
    var used = gradeMonthFor(month);
    var lines = budgetLinesFromMonth(used);
    var essentials = GM.monthlyEssentials(lines);
    var monthIncome = sums(used).income;
    var annual = currentAnnualIncomeHeadline().amount;
    var income = monthIncome > 0 ? monthIncome : (annual > 0 ? annual / 12 : 0);
    /* v37.5.16: grade Spending bar = Basic savings rate (same as Income/Insights/Wrapped). */
    /* v37.5.59: planned until every planned paycheck this month is received (the owner's rule). */
    var thInfo = GM.monthTakeHome(sums(used).income, used.transactions || [], used.incomes || [], takeHomeOpts(used));
    var takeHome = thInfo.amount;
    if (!(takeHome > 0) && income > 0) takeHome = income; // fall back to planned/annualized income already resolved
    var savingsEnv = GM.savingsEnvelopeTotal(used.categories || []).total;
    var savingsRate = GM.basicSavingsRate({ savings: savingsEnv, takeHome: takeHome }).rate;
    var years = ((state.worth && state.worth.years) || []).slice().sort(function (a, b) { return a - b; });
    var latestYear = years.length ? years[years.length - 1] : 2025;
    var cashYear = latestYear;
    var yi;
    for (yi = years.length - 1; yi >= 0; yi--) {
      if (cashOnHandForYear(years[yi]) > 0) { cashYear = years[yi]; break; }
    }
    var liquid = cashOnHandForYear(cashYear);
    var liquidMonths = essentials > 0 ? liquid / essentials : null;
    var equityYear = latestYear;
    for (yi = years.length - 1; yi >= 0; yi--) {
      if (worthTotals(years[yi]).equity !== 0) { equityYear = years[yi]; break; }
    }
    var totals = worthTotals(equityYear);
    var foo = migrateFoo(state.foo);
    var classified = foo.noDebt
      ? { highInterestTotal: 0, cheapTotal: 0, needsBirthday: false, hasHighInterest: false, hasOnlyCheapDebt: false }
      : classifiedDebtSet(month);
    var consumer = classified.highInterestTotal;
    var totalDebt = totals.liabilities;
    var est = estimateCompensation(state.compensation);
    var gross = est.cashPay > 0 ? est.cashPay : annual;
    var retirement = (Number(foo.rothAmount) || 0) + (est.hsa || 0) + (est.employerMatch || 0) + (est.employee401k || 0);
    var retirementRate = gross > 0 ? retirement / gross : null;
    if (foo.hyperPercent !== "" && foo.hyperPercent != null && Number(foo.hyperPercent) > 0) {
      retirementRate = Math.max(retirementRate || 0, Number(foo.hyperPercent) / 100);
    }
    var completed = completedStatementMeta();
    var deductiblesCovered = (Number(foo.deductibles) || 0) > 0 ? true : foo.deductiblesCovered;
    return {
      savingsRate: savingsRate,
      // v37.5.59.2: grade Spend sheet names the basis in use (planned until all paychecks arrive).
      takeHomeBasis: { source: thInfo.source, receivedCount: thInfo.receivedCount, plannedCount: thInfo.plannedCount, period: thInfo.period },
      liquidMonths: liquidMonths,
      consumerDebtToIncome: annual > 0 ? consumer / annual : null,
      totalDebtToAssets: totals.assets > 0 ? totalDebt / totals.assets : null,
      netWorth: totals.equity,
      annualIncome: annual > 0 ? annual : null,
      ageYears: GM.ageYears(birthdayISO()),
      deltaNWToIncome: deltaNWToIncome(completed),
      completedStatementYears: completed.years.length,
      consecutiveCompletedYears: completed.consecutive,
      completedYearsHaveGap: completed.hasGap,
      hasHighInterestConsumerDebt: classified.hasHighInterest && !foo.noDebt,
      hasOnlyCheapDebt: classified.hasOnlyCheapDebt && !foo.noDebt,
      needsBirthdayForDebt: !!classified.needsBirthday && !foo.noDebt,
      retirementRateOfGross: retirementRate,
      deductiblesCovered: deductiblesCovered,
      deductiblesHidden: !fooStep1Shown(),
      matchCaptured: foo.matchFull ? true : null,
      emergencyFunded: foo.emergencyFunded ? true : null,
      rothOnTrack: foo.rothOnTrack ? true : ((Number(foo.rothAmount) || 0) > 0 ? true : null),
      maxEmployerPlans: !!foo.maxEmployerPlans,
      hyperOnTrack: !!foo.hyperOnTrack,
      prepayFuture: !!foo.prepayFuture,
      prepayLowInterest: !!foo.prepayLowInterest
    };
  }

  function renderGradeBar(section) {
    var width = section.score == null ? 0 : Math.max(0, Math.min(100, section.score));
    var right = section.score == null
      ? esc(section.omittedReason || "—")
      : String(Math.round(section.score));
    return '<button class="grade-bar" type="button" data-act="grade-bar" data-section="' +
      esc(section.id) + '"><div class="grade-bar-row"><span>' + esc(section.title) +
      (section.provisional ? ' <em>Provisional</em>' : "") +
      "</span><span class='mono" + (section.score == null ? " grade-reason" : "") + "'>" + right + "</span></div>" +
      '<div class="grade-track"><div class="grade-fill" style="width:' + width.toFixed(1) +
      '%"></div></div></button>';
  }

  /* True when nothing has been entered yet: no budget amounts, no transactions, no Net Worth balances. */
  function booksEmpty() {
    var months = state.months || {};
    var anyMonth = Object.keys(months).some(function (key) {
      var m = months[key];
      if (!m) return false;
      if ((m.transactions || []).length) return true;
      return (m.categories || []).some(function (c) { return catAssigned(c) !== 0; });
    });
    return !anyMonth && !worthHasData();
  }

  function renderGradeLanding(month) {
    var GM = window.GradeMath;
    var grade = GM.evaluate(buildGradeInput(month));
    var html = '<div class="nav-row"><h2>' + esc(profileMasthead() || "Insights") + "</h2></div>";
    if (booksEmpty()) {
      // v37.5.15 zero state: no grade (and no "Excellent") before there is anything to grade.
      html += '<section class="card grade-empty empty-card"><p class="kicker">Paper Trail Grade</p>' +
        '<p class="grade-number muted">—</p>' +
        "<p>Your grade shows up once your first budget has numbers in it.</p>" +
        '<button class="planner-apply" type="button" data-act="tab" data-tab="budget">Build my budget</button></section>' +
        wrapEntryHtml(month) + savingsRateCardHtml("insights");
      html += '<p class="empty">Estimates, not advice.</p>';
      return html;
    }
    if (isPremium()) {
      html += premiumGradeHeroHtml(grade) + wrapEntryHtml(month) + savingsRateCardHtml("insights") + streakChipHtml() +
        compareSwipeHtml() + nextActionHtml(grade) +
        debtPayoffInsightHtml(month) + fooRailHtml(grade, month) + premiumExtraHtml(month, grade);
    } else {
      html += gradeGlimpseHtml(grade) + wrapEntryHtml(month) + savingsRateCardHtml("insights") + streakChipHtml() +
        compareSwipeHtml() + fooBasicsHtml(grade) +
        debtPayoffInsightHtml(month) + insuranceTeaserHtml();
    }
    html += '<button class="matters-btn" type="button" data-act="open-matters">What matters to you</button>';
    html += '<p class="empty">Estimates, not advice.</p>';
    return html;
  }

  function premiumGradeHeroHtml(grade) {
    var html = '<section class="card grade-hero">' +
      '<div class="grade-hero-top"><span class="kicker">Paper Trail Grade</span>' +
      (grade.provisional ? '<span class="provisional">Provisional</span>' : "") + "</div>" +
      '<div class="grade-hero-score"><span class="grade-number">' + grade.score + "</span>" +
      '<div><strong>' + esc(grade.band.title) + "</strong><div class='caption'>" +
      esc(grade.band.range) + "</div></div></div>" +
      "<p>" + esc(grade.diagnosis) + "</p>";
    grade.sections.forEach(function (section) { html += renderGradeBar(section); });
    html += '<p class="caption">Tap a bar for that section only. The order of operations isn’t this number.</p></section>';
    return html;
  }

  function nextActionHtml(grade) {
    var GM = window.GradeMath;
    return '<section class="card insight-card">' +
      '<p class="kicker">What to do next</p>' +
      "<h3>" + esc(grade.nextAction.title) + "</h3>" +
      "<p>" + esc(grade.nextAction.why) + "</p>" +
      '<p class="caption">Step ' + grade.foo.currentStep + " · " +
      esc(GM.fooNames[grade.foo.currentStep] || "") + "</p></section>";
  }

  function fooRailHtml(grade, month) {
    var html = '<section class="card foo-rail">';
    html += '<p class="kicker" title="Often shortened to FOO">Financial order of operations</p><div class="foo-dots">';
    grade.foo.steps.forEach(function (step) {
      if (step.number === 1 && !fooStep1Shown()) return; /* v37.5.59.13: hidden until data exists */
      html += '<span class="foo-dot ' + step.status + '" title="' + esc(step.name) + '"></span>';
    });
    html += "</div><p class='next-dollar'>" + esc(grade.foo.nextDollarLine) + "</p>";
    var current = grade.foo.steps.filter(function (s) { return s.status === "current"; })[0];
    if (current) {
      html += '<div class="foo-current"><div class="foo-step-head"><strong>' + current.number +
        ". " + esc(current.name) + "</strong>" + fooHelpButton(current.number) + "</div>" +
        "<p>" + esc(current.definition) + "</p>";
      if (grade.foo.question) {
        html += "<p>" + esc(grade.foo.question.prompt) + "</p>";
        if (grade.foo.question.field === "needsBirthday") {
          html += '<button class="matters-btn" type="button" data-act="open-profile">Add birthday in Profile</button>';
        } else {
          html += '<div class="yn-row">' +
            '<button type="button" data-act="foo-answer" data-field="' + esc(grade.foo.question.field) +
            '" data-value="yes">Yes</button>' +
            '<button type="button" data-act="foo-answer" data-field="' + esc(grade.foo.question.field) +
            '" data-value="no">Not yet</button></div>';
        }
      }
      if (current.number === 2) html += fooEmployerRatesHtml();
      if (current.number === 1) html += highestDeductibleNoteHtml(migrateFoo(state.foo));
      html += "</div>";
    }
    html += '<div class="foo-mini">';
    grade.foo.steps.forEach(function (step) {
      if (step.status === "current" || (step.number === 1 && !fooStep1Shown())) return;
      html += '<div class="foo-mini-row"><span>' + step.number + ". " + esc(step.name) +
        "</span>" +
        (step.status === "done" ? fooDoneCluster(step.number) : "<span class='caption'>locked</span>") +
        "</div>";
      if (step.number === 1 && step.status === "done") html += highestDeductibleNoteHtml(migrateFoo(state.foo));
      if (step.number === 2 && step.status === "done") html += fooEmployerRatesHtml();
    });
    html += "</div>";
    html += '<button class="matters-btn" type="button" data-act="open-full-foo">Full order of operations</button>';
    if (grade.foo.hit25Percent) {
      html += '<p class="caption">25% of gross is already on track — maxing the employer plan is not nagged.</p>';
    }
    html += "</section>";
    return html;
  }

  function gradeGlimpseHtml(grade) {
    return '<section class="card grade-hero">' +
      '<div class="grade-hero-top"><span class="kicker">Paper Trail Grade</span></div>' +
      '<div class="grade-hero-score"><span class="grade-number">' + grade.score + "</span>" +
      "<div><strong>" + esc(grade.band.title) + "</strong>" +
      '<div class="caption">Glimpse · subscribe for full bars</div></div></div>' +
      "<p>" + esc(grade.diagnosis) + "</p>" +
      '<button class="matters-btn" type="button" data-act="set-plan" data-plan="premium">Unlock full Insights</button>' +
      "</section>";
  }

  function fooBasicsHtml(grade) {
    var current = grade.foo.steps.filter(function (s) { return s.status === "current"; })[0];
    return '<section class="card foo-rail">' +
      '<p class="kicker" title="Often shortened to FOO">Financial order of operations</p>' +
      '<p class="next-dollar">' + esc(grade.foo.nextDollarLine) + "</p>" +
      (current ? "<p>" + esc(current.definition) + "</p>" : "") +
      '<button class="matters-btn" type="button" data-act="open-full-foo">Full order of operations</button></section>';
  }

  function monthTxList(month) {
    // Expenses only, net of refunds (a fully refunded purchase drops out). Income never here.
    return expenseTxs(month.transactions).map(function (tx) {
      return { payee: tx.payee || "Spend", amount: txNet(tx) };
    }).filter(function (row) { return row.amount > 0; });
  }

  function merchantsHtml(month) {
    var GM = window.GradeMath;
    var tops = GM.topMerchants(monthTxList(month), 3);
    var html = '<section class="card insight-card"><p class="kicker">This month</p><h3>Top merchants</h3>';
    if (!tops.length) html += "<p>No spends this month yet.</p>";
    else {
      html += '<div class="sheet-table">';
      tops.forEach(function (row) {
        html += '<div class="row dense"><div><div class="name">' + esc(row.name) +
          '</div><span class="caption">' + esc(row.category) + "</span></div>" +
          '<span class="mono">' + money(row.amount) + "</span></div>";
      });
      html += "</div>";
    }
    html += "</section>";
    return html;
  }

  function currentDebtTotal() {
    var year = state.worthYear || 2025;
    var total = 0;
    (state.worth.lines || []).forEach(function (line) {
      if (line.kind === "liability") total += Number(lineAmount(line, year)) || 0;
    });
    return total;
  }

  function peerCompare() {
    var GM = window.GradeMath;
    var nw = latestNetWorthHeadline();
    return GM.comparePeers({
      ageYears: GM.ageYears(birthdayISO()),
      zip: state.compensation && state.compensation.zipCode,
      income: incomeCompareBasis().amount,
      netWorth: nw.amount,
      debt: currentDebtTotal()
    });
  }

  function compareSwipeHtml() {
    var GM = window.GradeMath;
    var peers = peerCompare();
    var deck = GM.compareDeck
      ? GM.compareDeck({
        ageYears: GM.ageYears(birthdayISO()),
        zip: state.compensation && state.compensation.zipCode,
        income: peers.youIncome,
        netWorth: peers.youNetWorth,
        debt: peers.youDebt,
        plan: isPremium() ? "premium" : "free"
      })
      : { cards: [], exactAge: peers.exactAgeLine || "", ageBand: peers.ageBand, geo: peers.geo, citation: peers.citation, needsBirthday: peers.needsBirthday, teaser: peers.teaser, premium: isPremium() };
    var html = '<section class="card insight-card compare-deck-card">' +
      '<p class="kicker">How you compare</p>';
    if (deck.needsBirthday) {
      html += "<p>Add a birthday to see your age band. Age is never invented.</p>" +
        '<button class="matters-btn" type="button" data-act="open-profile">Add birthday in Profile</button>';
    } else {
      html += "<p class='compare-age'>" + esc(deck.exactAge || peers.exactAgeLine || "") +
        " · " + esc((deck.ageBand && deck.ageBand.label) || "") +
        (deck.geo ? " · " + esc(deck.geo.label) : "") + "</p>" +
        '<p class="caption">Finest published SCF / Census band — not a single-year percentile.</p>';
      html += '<div class="compare-deck" tabindex="0">';
      var incBasis = incomeCompareBasis();
      (deck.cards || []).forEach(function (card) {
        var isIncome = card.id === "income";
        html += '<article class="compare-slide' + (card.locked || card.teaser ? " is-teaser" : "") + '"' +
          (isIncome ? ' data-basis="' + esc(incBasis.kind) + '"' : "") + ">" +
          "<h3>" + esc(isIncome ? (incBasis.kind === "take-home" ? "Income · take-home" : "Income · gross") : card.title) + "</h3>";
        if (isIncome && !card.locked && !incBasis.comparable) {
          /* v37.5.59: no gross figure → never set take-home against a gross median. */
          html += (incBasis.amount > 0
            ? '<div class="compare-slide-row"><span>' + esc(incBasis.youLabel) + '</span><span class="mono">' + money(incBasis.amount) + "</span></div>"
            : "") +
            '<p class="caption compare-basis">Medians are gross pay (before tax). Add gross pay to your Income statement to compare like with like.</p>';
        } else if (card.locked) {
          html += "<p>Subscribe for the rest of the deck.</p>";
        } else if (card.teaser && !deck.premium) {
          html += '<div class="compare-slide-row"><span>' + esc(isIncome ? incBasis.youLabel : "You") + '</span><span class="mono">' +
            money(card.you) + "</span></div>" +
            '<p class="caption">Median ' + esc((deck.ageBand && deck.ageBand.label) || "") +
            " stays on Premium.</p>";
        } else {
          html += '<div class="compare-slide-row"><span>' + esc(isIncome ? incBasis.youLabel : "You") + '</span><span class="mono">' +
            money(card.you) + "</span></div>" +
            '<div class="compare-slide-row"><span>Median ' +
            esc((deck.ageBand && deck.ageBand.label) || "") + (isIncome ? " · gross" : "") +
            '</span><span class="mono">' + money(card.peer) + "</span></div>";
          if (isIncome) html += '<p class="caption compare-basis">' + esc(incBasis.source) + ". Both gross (before tax). Budget paychecks are take-home, so they run lower.</p>";
        }
        html += "</article>";
      });
      html += "</div>";
      if (!deck.premium) {
        html += '<button class="matters-btn" type="button" data-act="set-plan" data-plan="premium">Subscribe for the full picture</button>';
      }
    }
    html += '<p class="caption">' + esc(deck.citation || peers.citation) + "</p></section>";
    return html;
  }

  function loanSortSpec() {
    var GM = window.GradeMath;
    state.loanSort = GM && GM.normalizeLoanSort ? GM.normalizeLoanSort(state.loanSort) : { key: "balance", dir: "desc" };
    return state.loanSort;
  }

  function loanSortControlHtml() {
    var sort = loanSortSpec();
    var keys = [
      { id: "balance", title: "Balance" },
      { id: "rate", title: "Rate" },
      { id: "time", title: "Time remaining" }
    ];
    var html = '<div class="mode-toggle loan-sort" role="group" aria-label="Sort loans">';
    keys.forEach(function (item) {
      var on = sort.key === item.id;
      var arrow = on ? (sort.dir === "asc" ? " ↑" : " ↓") : "";
      html += '<button type="button" data-act="loan-sort" data-key="' + item.id + '"' +
        (on ? ' class="active" aria-pressed="true"' : ' aria-pressed="false"') + ">" +
        esc(item.title + arrow) + "</button>";
    });
    html += "</div>";
    return html;
  }

  function sortedLoanDocs(rows) {
    var GM = window.GradeMath;
    if (!GM || !GM.sortLoans) return rows;
    return GM.sortLoans(rows.map(function (doc) {
      return {
        doc: doc,
        name: doc.title || doc.fileName || "",
        balance: Number(doc.balance) || 0,
        rate: Number(doc.rate) || 0,
        minPayment: Number(doc.minPayment) > 0 ? Number(doc.minPayment) : (Number(doc.payment) || 0),
        term: doc.term || ""
      };
    }), loanSortSpec()).map(function (item) { return item.doc; });
  }

  function sortedWorthLoans(lines, year) {
    var GM = window.GradeMath;
    if (!GM || !GM.sortLoans) return lines;
    return GM.sortLoans(lines.map(function (line) {
      var amount = lineAmount(line, year);
      return {
        line: line,
        name: line.name || "",
        balance: (Number(line.loanBalance) || 0) > 0 ? Number(line.loanBalance) : amount,
        rate: Number(line.loanApr) || 0,
        minPayment: Number(line.loanMinPayment) || 0,
        term: ""
      };
    }), loanSortSpec()).map(function (item) { return item.line; });
  }

  function payoffExtraAmount() {
    var n = Number(state.payoffExtra);
    if (!(n > 0)) n = Number(state.insightExtra) > 0 ? Number(state.insightExtra) : 100;
    return n;
  }

  function debtPayoffInsightHtml(month) {
    var loans = collectLoans(month);
    if (!loans.length) return "";
    var extra = payoffExtraAmount();
    var html = '<section class="card insight-card" id="payoff-card"><p class="kicker">Payoff</p>' +
      '<label class="field extra-field">Extra $ / mo' +
      '<input class="cents-input" data-dollars="1" data-act="payoff-extra" inputmode="numeric" autocomplete="off" type="text" value="' +
      esc(money(extra)) + '"></label>' +
      '<div id="payoff-results">' + payoffResultsHtml(loans, extra) + "</div>" +
      '<p class="caption">Estimate — not advice.</p></section>';
    return html;
  }

  function payoffResultsHtml(loans, extra) {
    var GM = window.GradeMath;
    var rank = GM && GM.rankExtraPayoff ? GM.rankExtraPayoff(loans, extra) : { bestSave: null, fastest: null, sameLoan: false };
    var html = "";
    if (rank.bestSave && rank.fastest && rank.sameLoan) {
      var one = rank.bestSave;
      html += '<p class="payoff-headline"><strong>' + esc(one.loan.name) +
        "</strong> saves the most interest and pays off fastest — " +
        money(one.insight.interestSaved) + " interest, " +
        formatDuration(one.insight.savedMonths) + " sooner, payoff ~" +
        formatPayoffDate(one.insight.extraMonths) + ".</p>";
    } else {
      if (rank.bestSave) {
        var saved = rank.bestSave;
        html += '<p class="payoff-headline"><span class="caption">Saves most interest</span><br><strong>' +
          esc(saved.loan.name) + "</strong> · " + money(saved.insight.interestSaved) +
          " saved · " + formatDuration(saved.insight.savedMonths) + " cut</p>";
      }
      if (rank.fastest) {
        var fast = rank.fastest;
        html += '<p class="payoff-headline"><span class="caption">Pays off fastest</span><br><strong>' +
          esc(fast.loan.name) + "</strong> · payoff ~" + formatPayoffDate(fast.insight.extraMonths) +
          " · " + formatDuration(fast.insight.savedMonths) + " sooner</p>";
      }
    }
    html += '<p class="caption">Select a loan</p><div class="mode-toggle loan-sort">';
    loans.forEach(function (loan) {
      var on = state.payoffLoanId === loan.id;
      html += '<button type="button" data-act="payoff-pick" data-id="' + esc(loan.id) + '"' +
        (on ? ' class="active" aria-pressed="true"' : ' aria-pressed="false"') + ">" +
        esc(loan.name) + "</button>";
    });
    html += "</div>";
    var picked = loans.filter(function (loan) { return loan.id === state.payoffLoanId; })[0];
    if (picked) {
      html += '<div class="foo-loan" data-loan="' + esc(picked.name) + '"><div class="name">' + esc(picked.name) + "</div>" +
        '<p class="caption">Balance ' + money(picked.balance);
      if ((Number(picked.originalBalance) || 0) > 0) html += " · original " + money(picked.originalBalance);
      html += " · " + picked.apr + "% · min " + money(picked.min) + "</p>" +
        '<p class="payoff-copy">' + esc(payoffCopyFor(picked, extra)) + "</p></div>";
    }
    return html;
  }

  function paintPayoffCard() {
    var node = document.getElementById("payoff-results");
    if (!node) return;
    var month = ensureMonth(state.year, state.month);
    node.innerHTML = payoffResultsHtml(collectLoans(month), payoffExtraAmount());
  }

  function vaultInsuranceDocs() {
    return ((state.profile && state.profile.documents) || []).map(function (doc) {
      return {
        title: doc.title,
        provider: doc.provider,
        premium: doc.premium,
        premiumFrequency: doc.premiumFrequency,
        vaultType: doc.vaultType,
        slot: doc.slot
      };
    });
  }

  function insuranceTeaserHtml() {
    var GM = window.GradeMath;
    var over = GM.insuranceOverpay(vaultInsuranceDocs(), GM.ageYears(birthdayISO()));
    if (over.unreadPremium && !(over.rows && over.rows.length)) {
      return '<section class="card insight-card"><h3>Insurance</h3><p>' +
        esc(over.emptyCopy || over.teaser) + "</p></section>";
    }
    return '<section class="card insight-card">' +
      "<h3>Insurance</h3><p>" + esc(over.teaser) + "</p>" +
      '<button class="matters-btn" type="button" data-act="set-plan" data-plan="premium">Subscribe for details</button>' +
      "</section>";
  }

  function insuranceDetailHtml() {
    var GM = window.GradeMath;
    var over = GM.insuranceOverpay(vaultInsuranceDocs(), GM.ageYears(birthdayISO()));
    var html = '<section class="card insight-card"><h3>Insurance overpay</h3>';
    if (!over.rows.length) {
      html += "<p>" + esc(over.emptyCopy || "Add a Vault insurance card with a premium to benchmark. Cohort table is a stub.") + "</p>";
    } else {
      html += '<div class="sheet-table compare-grid">' +
        '<div class="stmt-cols"><span>Policy</span><span style="text-align:right">You</span>' +
        '<span style="text-align:right">Cohort</span></div>';
      over.rows.forEach(function (row) {
        html += '<div class="stmt-row dense"><span>' + esc(row.title) +
          ' <span class="caption">' + esc(row.policy) + "</span></span><span>" +
          money(row.youMonthly) + "/mo</span><span>" + money(row.cohortMonthly) + "/mo</span></div>";
      });
      html += "</div>";
      if (over.totalOverpayMonthly > 0) {
        html += "<p>Overpay seed ~" + money(over.totalOverpayMonthly) + "/mo vs age + policy cohort.</p>";
      }
      if (over.unreadCount) {
        html += "<p>" + esc(over.emptyCopy || "") + "</p>";
      }
    }
    html += '<p class="caption">Age + policy from Vault vs seed table. Stub — not live quotes.</p></section>';
    return html;
  }

  function envelopeSpends(month) {
    var rows = [];
    expenseTxs(month.transactions).forEach(function (tx) {
      rows.push({ envelope: displayEnvelope(month, tx) || "Spend", amount: txNet(tx) });
    });
    return rows;
  }

  function priorMonthRecord(month) {
    var prev = offsetMonth(month.year, month.month, -1);
    return state.months[ymKey(prev.year, prev.month)] || null;
  }

  // Spending trends card is off Insights. owner wants this later as a monthly Wrapped slide. Do not build Wrapped now.
  function trendsHtml(month) {
    var GM = window.GradeMath;
    var prior = priorMonthRecord(month);
    var rows = GM.spendingTrends(envelopeSpends(month), prior ? envelopeSpends(prior) : []);
    var html = '<section class="card insight-card"><h3>Spending trends</h3>';
    if (!rows.length) html += "<p>Need two months of spends for a trend.</p>";
    else {
      html += '<div class="sheet-table">';
      rows.forEach(function (row) {
        html += '<div class="row dense"><span>' + esc(row.label) +
          (row.unusual ? ' <em class="unusual">Unusual</em>' : "") +
          '</span><span class="mono">' + money(row.thisMonth) + "</span></div>";
      });
      html += "</div>";
    }
    html += '<p class="caption">Preview stub vs last month. Estimate — not advice.</p></section>';
    return html;
  }

  function autoMapHtml(month) {
    var GM = window.GradeMath;
    var seen = {};
    var maps = [];
    expenseTxs(month.transactions).forEach(function (tx) {
      var payee = tx.payee || "Spend";
      var key = payee.toLowerCase();
      if (seen[key]) return;
      seen[key] = true;
      maps.push(GM.autoCategorize(payee));
    });
    maps = maps.slice(0, 6);
    var html = '<section class="card insight-card"><h3>Auto-categorize</h3>';
    if (!maps.length) html += "<p>No merchants to map yet.</p>";
    else {
      maps.forEach(function (map) {
        html += '<div class="row dense"><span>' + esc(map.payee) + '</span><span class="caption">' +
          esc(map.envelope) + " · " + esc(map.line) + "</span></div>";
      });
    }
    html += '<p class="caption">QuickBooks-style best-effort from payee names. Preview only.</p></section>';
    return html;
  }

  var wrapSlideIndex = 0;

  function periodBounds(year, month, cadence) {
    var names = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    if (cadence === "year") {
      return { start: isoDate(year, 1, 1), end: isoDate(year, 12, 31), name: String(year), spanLabel: "12 months" };
    }
    if (cadence === "quarter") {
      var q = Math.floor((month - 1) / 3);
      var startM = q * 3 + 1;
      var endM = startM + 2;
      var endDay = new Date(year, endM, 0).getDate();
      return {
        start: isoDate(year, startM, 1),
        end: isoDate(year, endM, endDay),
        name: "Q" + (q + 1) + " " + year,
        spanLabel: "3 months"
      };
    }
    var endDayM = new Date(year, month, 0).getDate();
    return {
      start: isoDate(year, month, 1),
      end: isoDate(year, month, endDayM),
      name: names[month - 1] + " " + year,
      spanLabel: ""
    };
  }

  /* Wrapped / Insights activity. v37.5.14:
   *  - txs = expenses only; amount = net of refunds (standalone refunds are negative rows).
   *  - income = take-home for Wrapped (v37.5.59.2): the SAME per-month rule as Basic savings rate —
   *    GradeMath.monthTakeHome: planned take-home until every paycheck that month is fully received,
   *    then Received. Summed over months whose start falls in the period. (receivedLogged keeps the
   *    raw dated money-in for reference only.)
   *  - Income transactions never count as spending; refunds never count as income. */
  function activityInPeriod(bounds) {
    var txs = [];
    var income = 0;
    var days = {};
    var savings = 0;
    var takeHome = 0;
    var monthCount = 0;
    var basisMonths = [];
    var periodMonths = [];
    Object.keys(state.months || {}).forEach(function (key) {
      var rec = state.months[key];
      if (!rec) return;
      var hasIncomeTx = (rec.transactions || []).some(isIncomeTx);
      if (!hasIncomeTx) {
        (rec.incomes || []).forEach(function (item) {
          var date = item.date || isoDate(rec.year, rec.month, 1);
          if (date < bounds.start || date > bounds.end) return;
          if (!((Number(item.amount) || 0) > 0)) return; // a $0 placeholder paycheck isn't a logged day
          if (item.autoCopy) return; // v37.5.59.12: a projected paycheck in a copied-forward month isn't a logged day
          days[date] = true;
        });
      }
      var recStart = isoDate(rec.year, rec.month, 1);
      if (recStart >= bounds.start && recStart <= bounds.end) {
        monthCount += 1;
        periodMonths.push({ year: Number(rec.year), month: Number(rec.month) });
        savings += gm().savingsEnvelopeTotal(rec.categories || []).total;
        // v37.5.59 Basic denominator, per month: planned until EVERY planned paycheck that month is
        // received, then Received. The annual rate sums each month's denominator under this rule.
        var plannedMo = (rec.incomes || []).reduce(function (n, item) { return n + (Number(item.amount) || 0); }, 0);
        var thMo = gm().monthTakeHome(plannedMo, rec.transactions || [], rec.incomes || [], takeHomeOpts(rec));
        takeHome += thMo.amount;
        if (plannedMo > 0 || thMo.amount > 0) {
          basisMonths.push({ year: rec.year, month: rec.month, source: thMo.source, period: thMo.period,
            planned: thMo.planned, received: thMo.received,
            receivedCount: thMo.receivedCount, plannedCount: thMo.plannedCount, amount: thMo.amount });
        }
      }
      (rec.transactions || []).forEach(function (tx) {
        var date = tx.date || isoDate(rec.year, rec.month, 1);
        if (date < bounds.start || date > bounds.end) return;
        days[date] = true;
        if (isIncomeTx(tx)) {
          income += Number(tx.amount) || 0; // raw Received, reference only
          return;
        }
        txs.push({
          payee: tx.payee || "Spend",
          amount: txNet(tx),
          date: date,
          category: txCategoryName(rec, tx),
          tx: tx,
          month: rec
        });
      });
    });
    return {
      txs: txs,
      income: takeHome, // v37.5.59.2: Wrapped take-home = Basic per-month rule
      receivedLogged: income,
      takeHomeBasis: basisMonths.sort(function (a, b) { return (a.year - b.year) || (a.month - b.month); }),
      periodMonths: periodMonths.sort(function (a, b) { return (a.year - b.year) || (a.month - b.month); }),
      daysLogged: Object.keys(days).length,
      savingsPlanned: savings,
      savedPlanned: savings,
      takeHomePlanned: takeHome,
      monthCount: monthCount
    };
  }

  function reportSpending(bag) {
    var net = bag.txs.reduce(function (n, row) { return n + row.amount; }, 0);
    return Math.max(0, Math.round(net * 100) / 100);
  }

  function txCategoryName(month, tx) {
    var leg = txLegs(tx)[0];
    if (!leg) return "Spend";
    var cat = (month.categories || []).filter(function (c) { return c.id === leg.categoryId; })[0];
    return cat ? cat.name : "Spend";
  }

  /* Basic savings rate over a Wrapped period: savings envelopes ÷ take-home
   * (per month: planned until every planned paycheck is received, then Received — v37.5.59 rule),
   * summed across the months inside the period. */
  function periodSavingsRate(bounds) {
    var bag = activityInPeriod(bounds);
    return gm().basicSavingsRate({ savings: bag.savingsPlanned, takeHome: bag.takeHomePlanned }).rate;
  }

  function merchantStory(txs, limit) {
    var totals = {};
    var labels = {};
    var cats = {};
    var counts = {};
    txs.forEach(function (row) {
      var name = String(row.payee || "").replace(/^\s+|\s+$/g, "");
      if (!name || !(row.amount > 0)) return;
      var key = name.toLowerCase();
      totals[key] = (totals[key] || 0) + row.amount;
      if (!labels[key]) labels[key] = name;
      counts[key] = (counts[key] || 0) + 1;
      if (row.category) cats[key] = row.category;
    });
    var ranked = Object.keys(totals).sort(function (a, b) { return totals[b] - totals[a]; });
    var top = ranked.slice(0, limit || 3).map(function (key) {
      return { name: labels[key], amount: totals[key], category: cats[key] || "" };
    });
    var surprise = null;
    ranked.slice(limit || 3).forEach(function (key) {
      if (counts[key] === 1 && (!surprise || totals[key] > surprise.amount)) {
        surprise = { name: labels[key], amount: totals[key], category: cats[key] || "" };
      }
    });
    if (!surprise) {
      ranked.slice(limit || 3).forEach(function (key) {
        if (!surprise || totals[key] > surprise.amount) {
          surprise = { name: labels[key], amount: totals[key], category: cats[key] || "" };
        }
      });
    }
    return { top: top, surprise: surprise };
  }

  function netWorthDebtDelta() {
    var years = ((state.worth && state.worth.years) || []).slice().sort(function (a, b) { return a - b; });
    if (!years.length) {
      return { netWorthDelta: null, debtDelta: null, netWorthHint: "Add a Net Worth year to see the change.", netWorthDeltaLabel: "" };
    }
    var latest = years[years.length - 1];
    if (years.length < 2) {
      var one = worthTotals(latest);
      return {
        netWorthDelta: null,
        debtDelta: null,
        netWorthHint: latest + " net worth is " + money(one.equity) + ". Add another year to see the change.",
        netWorthDeltaLabel: ""
      };
    }
    var prior = years[years.length - 2];
    var now = worthTotals(latest);
    var then = worthTotals(prior);
    return {
      netWorthDelta: now.equity - then.equity,
      debtDelta: now.liabilities - then.liabilities,
      netWorthHint: "",
      netWorthDeltaLabel: prior + " → " + latest
    };
  }

  function outflowLedger() {
    var dates = [];
    var earliest = null;
    Object.keys(state.months || {}).forEach(function (key) {
      var rec = state.months[key];
      if (!rec) return;
      (rec.incomes || []).forEach(function (item) {
        var date = item.date || isoDate(rec.year, rec.month, 1);
        if (!earliest || date < earliest) earliest = date;
      });
      (rec.transactions || []).forEach(function (tx) {
        var date = tx.date || isoDate(rec.year, rec.month, 1);
        if (!earliest || date < earliest) earliest = date;
        // Outflow = a purchase that day. Income and money-back refunds are not outflow.
        if (!isIncomeTx(tx) && gm().txSummary(tx).purchase > 0) dates.push(date);
      });
    });
    return { dates: dates, earliest: earliest };
  }

  function currentNoSpendStreak() {
    if (!window.GradeMath || !window.GradeMath.noSpendStreak) return 0;
    var bag = outflowLedger();
    var today = new Date();
    return window.GradeMath.noSpendStreak(
      bag.dates,
      isoDate(today.getFullYear(), today.getMonth() + 1, today.getDate()),
      bag.earliest
    );
  }

  /* v37.5.15: a streak only means something after the first logged purchase. */
  function hasExpenseHistory() {
    var months = state.months || {};
    return Object.keys(months).some(function (key) {
      return ((months[key] && months[key].transactions) || []).some(function (tx) { return !isIncomeTx(tx); });
    });
  }

  function streakChipHtml() {
    if (!hasExpenseHistory()) return '<p class="streak-chip">No-spend streak starts after your first logged purchase</p>';
    var n = currentNoSpendStreak();
    return '<p class="streak-chip">No-spend streak · ' + n + (n === 1 ? " day" : " days") + "</p>";
  }

  function merchantHintHtml() {
    if (!state.merchantHint || !state.merchantHint.payee) return "";
    return '<p class="merchant-hint">Mapped from your history — change anytime</p>';
  }

  function runwayHtml(emergencyAmount, burn) {
    var months = window.GradeMath.runwayMonths(emergencyAmount, burn);
    if (months == null) return "";
    var pct = Math.max(0, Math.min(100, (months / 6) * 100));
    var label = (Math.round(months * 10) / 10).toFixed(1);
    return '<div class="runway">' +
      '<div class="runway-track" role="img" aria-label="You have ' + label + ' months saved, target 3 to 6">' +
      '<div class="runway-fill" style="width:' + pct.toFixed(1) + '%"></div>' +
      '<span class="runway-mark at-3"></span><span class="runway-mark at-6"></span></div>' +
      '<div class="runway-scale"><span>3</span><span>6</span></div>' +
      '<p class="runway-label">You have ' + label + " months saved</p></div>";
  }

  function wrapEntryHtml(month) {
    var cadence = "year";
    state.wrapCadence = "year";
    var bounds = periodBounds(month.year, month.month, cadence);
    return '<button class="card insight-card wrap-entry" type="button" data-act="open-wrapped">' +
      '<p class="kicker">Your wrap</p><h3>' + esc(bounds.name) + "</h3>" +
      "<p>" + (isPremium()
        ? "Your year on paper — planned vs spent, savings rate, and the rest of the story."
        : "Two slides free. Premium opens the full year.") +
      "</p></button>";
  }

  /* v37.5.55 (owner): one Wrapped page per spending category for the year.
   * Savings envelopes out. Planned + spent, spend ÷ income, biggest purchase, most-common merchant. */
  function periodCategoryStories(bounds) {
    var byName = {};
    var order = [];
    var income = 0;
    Object.keys(state.months || {}).forEach(function (key) {
      var rec = state.months[key];
      if (!rec) return;
      var recStart = isoDate(rec.year, rec.month, 1);
      if (recStart < bounds.start || recStart > bounds.end) return;
      // v37.5.59.2: "% of take-home" uses the Basic per-month rule (planned until every paycheck
      // that month is fully received, then Received) — same function as the savings rate.
      var plannedCat = (rec.incomes || []).reduce(function (n, item) { return n + (Number(item.amount) || 0); }, 0);
      income += gm().monthTakeHome(plannedCat, rec.transactions || [], rec.incomes || [], takeHomeOpts(rec)).amount;
      (rec.categories || []).forEach(function (cat) {
        if (gm().isSavingsEnvelope(cat.name, "")) return;
        var planned = 0;
        var lines = cat.lines || [];
        if (lines.length) {
          lines.forEach(function (line) {
            if (gm().isSavingsEnvelope(cat.name, line.name)) return;
            planned += Number(line.assigned) || 0;
          });
        } else {
          planned = Number(cat.assigned) || 0;
        }
        var spent = Number(spentFor(rec, cat.id)) || 0;
        var nameKey = String(cat.name || "Envelope").toLowerCase();
        if (!byName[nameKey]) {
          byName[nameKey] = {
            name: cat.name || "Envelope",
            planned: 0,
            spent: 0,
            biggest: null,
            merchants: {}
          };
          order.push(nameKey);
        }
        byName[nameKey].planned += planned;
        byName[nameKey].spent += spent;
      });
      (rec.transactions || []).forEach(function (tx) {
        if (isIncomeTx(tx)) return; // take-home already counted via monthTakeHome above
        var net = txNet(tx);
        if (!(net > 0)) return;
        var catName = txCategoryName(rec, tx);
        if (gm().isSavingsEnvelope(catName, "")) return;
        var nameKey = String(catName || "Spend").toLowerCase();
        if (!byName[nameKey]) {
          byName[nameKey] = {
            name: catName || "Spend",
            planned: 0,
            spent: 0,
            biggest: null,
            merchants: {},
            spentFromTx: true
          };
          order.push(nameKey);
        }
        var bag = byName[nameKey];
        if (bag.spentFromTx) bag.spent += net;
        var payee = String(tx.payee || "Spend").replace(/^\s+|\s+$/g, "") || "Spend";
        var date = tx.date || isoDate(rec.year, rec.month, 1);
        if (!bag.biggest || net > bag.biggest.amount) {
          bag.biggest = { payee: payee, amount: net, date: date };
        }
        var mKey = payee.toLowerCase();
        if (!bag.merchants[mKey]) bag.merchants[mKey] = { name: payee, count: 0, amount: 0 };
        bag.merchants[mKey].count += 1;
        bag.merchants[mKey].amount += net;
      });
    });
    var categories = order.map(function (k) {
      var row = byName[k];
      var top = null;
      Object.keys(row.merchants || {}).forEach(function (m) {
        var cur = row.merchants[m];
        if (!top || cur.count > top.count || (cur.count === top.count && cur.amount > top.amount)) {
          top = cur;
        }
      });
      return {
        name: row.name,
        planned: row.planned,
        spent: row.spent,
        biggest: row.biggest,
        topMerchant: top ? { name: top.name, count: top.count, amount: top.amount } : null
      };
    }).filter(function (r) { return r.planned > 0 || r.spent > 0; })
      .sort(function (a, b) { return b.spent - a.spent; });
    return { income: income, categories: categories };
  }

  function wrappedFacts(month, cadence) {
    var bounds = periodBounds(month.year, month.month, cadence);
    var bag = activityInPeriod(bounds);
    var spent = reportSpending(bag);
    var depth = cadence === "year" ? 5 : cadence === "quarter" ? 4 : 3;
    var merchants = merchantStory(bag.txs, depth);
    var categories = {};
    bag.txs.forEach(function (row) {
      if (!(row.amount > 0)) return;
      var name = row.category || "Spend";
      categories[name] = (categories[name] || 0) + row.amount;
    });
    var categoryName = "";
    var categoryAmount = 0;
    Object.keys(categories).forEach(function (name) {
      if (categories[name] > categoryAmount) {
        categoryName = name;
        categoryAmount = categories[name];
      }
    });
    var biggest = null;
    var byDay = {};
    bag.txs.forEach(function (row) {
      if (!(row.amount > 0)) return;
      if (!biggest || row.amount > biggest.amount) biggest = row;
      byDay[row.date] = (byDay[row.date] || 0) + row.amount;
    });
    var biggestDayDate = "";
    var biggestDayAmount = 0;
    Object.keys(byDay).forEach(function (date) {
      if (byDay[date] > biggestDayAmount) {
        biggestDayDate = date;
        biggestDayAmount = byDay[date];
      }
    });
    var grade = window.GradeMath.evaluate(buildGradeInput(month));
    var done = grade.foo.steps.filter(function (step) { return step.status === "done" && !(step.number === 1 && !fooStep1Shown()); }).length;
    var priorAnchor = cadence === "year"
      ? { year: month.year - 1, month: month.month }
      : offsetMonth(month.year, month.month, cadence === "quarter" ? -3 : -1);
    var prior = periodBounds(priorAnchor.year, priorAnchor.month, cadence);
    var deltas = netWorthDebtDelta();
    var peers = isPremium() ? peerCompare() : null;
    var compareLine = "";
    var compareLines = [];
    var compareFootnote = "";
    if (peers && !peers.needsBirthday) {
      /* v37.5.59: say which basis. Gross vs gross median only; take-home is never compared. */
      var wrapBasis = incomeCompareBasis();
      var bandLabel = (peers.ageBand && peers.ageBand.label) || "";
      if (wrapBasis.comparable) {
        compareLines = [
          "Your gross income " + money(wrapBasis.amount),
          "Median gross, ages " + bandLabel + " " + money(peers.peerIncome)
        ];
        compareFootnote = "Basis: " + wrapBasis.source + " vs. SCF / Census median gross income. " +
          "Both before tax. Your Budget paychecks are take-home, so they run lower.";
      } else {
        compareLines = wrapBasis.amount > 0
          ? ["Your take-home " + money(wrapBasis.amount) + " a year", "Median " + bandLabel + " income is gross (before tax) — not compared."]
          : ["No gross pay on your Income statement yet."];
        compareFootnote = "Add gross pay to your Income statement to compare like with like. Medians are gross; take-home is after tax.";
      }
      compareLine = compareLines.join(" · ");
    }
    var categoryRows = Object.keys(categories).map(function (name) {
      return { name: name, amount: categories[name] };
    }).sort(function (a, b) { return b.amount - a.amount; });
    var snap = state.compensation && state.compensation.payStubSnapshot;
    var paystubStack = null;
    if (isPremium() && snap && (snap.gross != null || snap.federalTax != null || snap.employee401k != null)) {
      paystubStack = {
        gross: snap.gross,
        federalTax: snap.federalTax,
        stateTax: snap.stateTax,
        fica: snap.fica,
        employee401k: snap.employee401k,
        employer401k: snap.employer401k,
        hsa: snap.hsa,
        net: snap.net
      };
    }
    var trailSetMonths = 0;
    var zeroLeftoverMonths = 0;
    Object.keys(state.months || {}).forEach(function (key) {
      var rec = state.months[key];
      if (!rec) return;
      var planned = (rec.incomes || []).reduce(function (n, row) { return n + (Number(row.amount) || 0); }, 0);
      var inc = gm().monthMoneyIn(planned, rec.transactions || [], rec.incomes || [], takeHomeOpts(rec));
      var out = Math.max(0, gm().sumLedger(rec.transactions || []).spendingNet);
      var left = inc - out;
      if (rec.stamped) trailSetMonths += 1;
      if (inc > 0 && Math.abs(left) < 0.5) zeroLeftoverMonths += 1;
    });
    /* v37.5.16: True over the whole Wrapped period (confirmed stub × months + savings sum). */
    var periodTrue = null;
    if (gm().periodTrueSavingsRate) {
      var planTrue = state.compensation || {};
      periodTrue = gm().periodTrueSavingsRate({
        premium: isPremium(),
        snapshot: planTrue.payStubSnapshot || null,
        paychecksPerYear: planTrue.paychecksPerYear || checksForFrequency(payFrequencyOf(planTrue)),
        savings: bag.savingsPlanned,
        monthCount: bag.monthCount || 0,
        useBasis: useStubBasis(),
        stubMonths: (bag.periodMonths || []).map(function (m) { return stubMonthFigures(m.year, m.month); }),
        basisShort: stubBasisShort(bag.periodMonths && bag.periodMonths.length ? bag.periodMonths[bag.periodMonths.length - 1].year : currentYearMonth().year)
      });
    } else {
      periodTrue = monthSavingsRates(month).trueRate;
    }
    return {
      cadence: cadence,
      periodName: bounds.name,
      spanLabel: (bag.daysLogged >= 28 ? bounds.spanLabel : ""),
      daysLogged: bag.daysLogged,
      moneyIn: bag.income,
      takeHomeBasis: bag.takeHomeBasis || [],
      moneyOut: spent,
      // v37.5.45: Wrapped dollars saved are the assigned savings-envelope plan,
      // using the same classifier as Basic savings rate—not income minus spent.
      savedPlanned: bag.savedPlanned,
      merchants: merchants.top,
      surprise: merchants.surprise,
      categories: categoryRows,
      categoryName: categoryName,
      categoryAmount: categoryAmount,
      categorySwing: categoryRows.length > 1
        ? { name: categoryRows[0].name, delta: categoryRows[0].amount - (categoryRows[1] ? categoryRows[1].amount : 0) }
        : null,
      biggestPayee: biggest ? biggest.payee : "",
      biggestAmount: biggest ? biggest.amount : 0,
      biggestDate: biggest ? biggest.date : "",
      biggestDayDate: biggestDayDate,
      biggestDayAmount: biggestDayAmount,
      fooStep: grade.foo.currentStep,
      fooName: window.GradeMath.fooNames[grade.foo.currentStep] || "",
      fooDone: done,
      cleanFoo: true,
      gradeScore: booksEmpty() ? null : grade.score,
      gradeBand: booksEmpty() ? "" : (grade.band && grade.band.title),
      savingsRate: periodSavingsRate(bounds),
      trueSavingsRate: periodTrue && periodTrue.state === "ok" ? periodTrue.rate : null,
      trueSavingsState: periodTrue ? periodTrue.state : null,
      truePeriodNote: periodTrue && periodTrue.periodNote ? periodTrue.periodNote : null,
      categoryStories: periodCategoryStories(bounds),
      priorPeriodName: prior && prior.name ? prior.name : "",
      priorSavingsRate: periodSavingsRate(prior),
      /* v37.5.55: prior-period True so the headline compares like with like. */
      priorTrueSavingsRate: (function () {
        if (!gm().periodTrueSavingsRate) return null;
        var pb = activityInPeriod(prior);
        var planP = state.compensation || {};
        var pt = gm().periodTrueSavingsRate({
          premium: isPremium(),
          snapshot: planP.payStubSnapshot || null,
          paychecksPerYear: planP.paychecksPerYear || checksForFrequency(payFrequencyOf(planP)),
          savings: pb.savingsPlanned,
          monthCount: pb.monthCount || 0,
          useBasis: useStubBasis(),
          stubMonths: (pb.periodMonths || []).map(function (m) { return stubMonthFigures(m.year, m.month); })
        });
        return pt && pt.state === "ok" ? pt.rate : null;
      })(),
      peerSavingsRates: [],
      netWorthDelta: deltas.netWorthDelta,
      debtDelta: deltas.debtDelta,
      netWorthHint: deltas.netWorthHint || "",
      netWorthDeltaLabel: deltas.netWorthDeltaLabel || "",
      compareLine: compareLine,
      compareLines: compareLines,
      compareFootnote: compareFootnote,
      streak: hasExpenseHistory() ? currentNoSpendStreak() : null,
      trailSetMonths: trailSetMonths,
      zeroLeftoverMonths: zeroLeftoverMonths,
      paystubStack: paystubStack,
      premium: isPremium()
    };
  }

  function openWrapped(month) {
    captureModalReturnScreenTop();
    wrapSlideIndex = 0;
    renderWrapped(month);
  }

  function renderWrapped(month) {
    var cadence = "year";
    state.wrapCadence = "year";
    var deck = window.GradeMath.buildWrappedDeck(wrappedFacts(month, cadence));
    if (wrapSlideIndex >= deck.slides.length) wrapSlideIndex = deck.slides.length - 1;
    if (wrapSlideIndex < 0) wrapSlideIndex = 0;
    var slide = deck.slides[wrapSlideIndex];
    var html = '<div class="wrap-stage">';
    html += '<div class="wrap-top"><button type="button" data-act="close-modal">Close</button>' +
      '<p class="wrap-cadence-label caption">Annual wrap</p></div>';
    html += '<div class="wrap-progress">';
    deck.slides.forEach(function (item, index) {
      html += '<i class="' + (index === wrapSlideIndex ? "on" : "") + '"></i>';
    });
    html += "</div>";
    html += '<div class="wrap-slide"><p class="kicker">' + esc(slide.kicker) + "</p>" +
      "<h2>" + esc(slide.title) + "</h2>";
    (slide.lines || []).forEach(function (line) {
      html += '<p class="line">' + esc(line) + "</p>";
    });
    if (slide.chart && slide.chart.type === "bars" && slide.chart.rows && slide.chart.rows.length) {
      html += '<div class="wrap-chart">' + barChart(slide.chart.rows.map(function (row) {
        return { title: row.title, amount: row.amount, id: row.id || row.title };
      })) + "</div>";
    } else if (slide.chart && slide.chart.type === "donut" && slide.chart.slices && slide.chart.slices.length) {
      html += '<div class="wrap-chart">' + pieSvg(slide.chart.slices, "", "label") + "</div>";
    }
    if (slide.paystubStack && isPremium()) {
      var stack = slide.paystubStack;
      html += '<div class="wrap-paystub-stack"><p class="sheet-label">Paystub ledger</p>';
      if (stack.gross != null) html += '<div class="row dense"><span>Gross</span><span class="mono">' + money(stack.gross) + "</span></div>";
      if (stack.federalTax != null) html += '<div class="row dense"><span>Federal</span><span class="mono">' + money(stack.federalTax) + "</span></div>";
      if (stack.stateTax != null) html += '<div class="row dense"><span>State</span><span class="mono">' + money(stack.stateTax) + "</span></div>";
      if (stack.fica != null) html += '<div class="row dense"><span>FICA</span><span class="mono">' + money(stack.fica) + "</span></div>";
      if (stack.employee401k != null) html += '<div class="row dense"><span>Employee 401k</span><span class="mono">' + money(stack.employee401k) + "</span></div>";
      if (stack.hsa != null) html += '<div class="row dense"><span>HSA</span><span class="mono">' + money(stack.hsa) + "</span></div>";
      html += '<p class="caption">Premium paystub breakdown — only known stub numbers.</p></div>';
    } else if (slide.id === "savings-rate-compare" && isPremium() && !slide.paystubStack) {
      html += '<p class="caption">Add a paystub to unlock gross / tax / 401k ledger.</p>';
    }
    if (slide.footnote) html += '<p class="caption">' + esc(slide.footnote) + "</p>";
    if (slide.chip) html += '<p class="streak-chip">' + esc(slide.chip) + "</p>";
    if (slide.locked) {
      html += '<button class="matters-btn" type="button" data-act="set-plan" data-plan="premium">Unlock the full wrap</button>';
    }
    if (slide.share) {
      var shareSaved = shareShowAmounts ? slide.share.saved : "••••";
      html += '<article class="share-card"><p class="kicker">Paper Trail</p><strong>' +
        esc(slide.share.period) + "</strong>" +
        "<p>Savings envelopes " + esc(shareSaved) + "</p>" +
        "<p>No-spend streak " + esc(slide.share.streak) + "</p>" +
        "<p>Grade " + esc(slide.share.grade) + "</p></article>" +
        '<button class="matters-btn share-open" type="button" data-act="share-card-open">Save share card (PNG)</button>' +
        '<p class="caption">' + (shareShowAmounts
          ? "Dollar amounts are on for this preview."
          : "Dollar amounts are hidden until you turn them on.") + "</p>";
    }
    html += "</div>";
    html += '<div class="wrap-nav wrap-nav-pills">';
    if (wrapSlideIndex > 0) {
      html += '<button type="button" class="wrap-pill" data-act="wrap-prev">Back</button>';
    } else {
      html += '<span class="wrap-pill-spacer"></span>';
    }
    if (wrapSlideIndex < deck.slides.length - 1) {
      html += '<button class="primary wrap-pill" type="button" data-act="wrap-next">Next</button>';
    } else {
      html += '<button class="primary wrap-pill" type="button" data-act="close-modal">Done</button>';
    }
    html += "</div></div>";
    var modal = document.getElementById("modal");
    modal.classList.add("wrap-open");
    modal.hidden = false;
    modal.innerHTML = html;
    armSheetA11y(modal);
  }

  function premiumExtraHtml(month, grade) {
    var html = autoMapHtml(month) + insuranceDetailHtml();
    var est = estimateCompensation(state.compensation);
    var plan = state.compensation;
    var employeePct = plan.employee401kIsPercent === false
      ? (est.cashPay > 0 ? (est.employee401k / est.cashPay) * 100 : null)
      : (Number(plan.employee401kValue) || 0);
    var matchPct = checklistMatchPercent();
    var foo = migrateFoo(state.foo);
    if (!foo.matchFull && matchPct != null && (employeePct == null ? 0 : employeePct) + 0.05 < matchPct) {
      html += insightCard("Employer match", "You may not be getting the full employer match — that’s free money.");
    }
    var savingsCat = (month.categories || []).filter(function (c) { return /^savings$/i.test(c.name); })[0];
    var monthly = window.GradeMath.monthlySpend(budgetLinesFromMonth(month));
    if (!(monthly > 0) && est.takeHome > 0) monthly = est.takeHome / 12;
    if (monthly > 0) {
      var year = state.worthYear || 2025;
      var onHand = (Number(foo.emergencyAmount) || 0) > 0
        ? Number(foo.emergencyAmount)
        : cashOnHandForYear(year);
      html += insightCard(
        "Emergency reserves",
        "3–6 mo target " + money(monthly * 3) + " – " + money(monthly * 6) + ". On hand " + money(onHand) + "."
      );
    }
    html += taxFreeRoomCard(est, foo);
    return html;
  }

  function renderInsights(month) {
    migrateCompensation(state.compensation);
    state.foo = migrateFoo(state.foo);
    state.matters = migrateMatters(state.matters);
    if (state.insightsDoor === "foo") return renderFullFoo(month);
    return renderGradeLanding(month);
  }

  function renderFullFoo(month) {
    var foo = state.foo;
    var est = estimateCompensation(state.compensation);
    var plan = state.compensation;
    var employeePct = plan.employee401kIsPercent === false
      ? (est.cashPay > 0 ? (est.employee401k / est.cashPay) * 100 : null)
      : (Number(plan.employee401kValue) || 0);
    var matchPct = checklistMatchPercent();
    var listed = foo.noDebt ? [] : collectListedDebts(month);
    var classified = foo.noDebt
      ? { items: [] }
      : window.GradeMath.classifyDebts(listed, window.GradeMath.ageYears(birthdayISO()));
    var grade = window.GradeMath.evaluate(buildGradeInput(month));
    var statuses = {};
    grade.foo.steps.forEach(function (step) { statuses[step.number] = step.status; });
    var html =
      '<div class="nav-row"><button class="text-btn" type="button" data-act="insights-back">Back</button>' +
      "<h2>Full order of operations</h2></div>" +
      '<section class="card insight-card">' +
      "<p>Financial Order of Operations — fill this checklist in order. Estimates only, not tax or legal advice.</p>" +
      "</section>" +
      '<div class="foo-list">';

    if (fooStep1Shown()) {
      html += fooStep(1, "Deductibles covered",
        '<label class="field">Amount' +
        '<input class="cents-input" data-dollars="1" data-act="foo-money" data-field="deductibles" inputmode="numeric" autocomplete="off" type="text" value="' +
        esc(money(foo.deductibles || 0)) + '"></label>' +
        highestDeductibleNoteHtml(foo),
        statuses[1]);
    }

    var matchBody =
      '<label class="check"><input type="checkbox" data-act="foo-check" data-field="matchFull"' +
      (foo.matchFull ? " checked" : "") + '> I’m getting the full match</label>' +
      '<label class="field">Total match %' +
      '<input data-act="foo-percent" data-field="matchPercent" inputmode="decimal" type="text" value="' +
      esc(foo.matchPercent === "" || foo.matchPercent == null ? "" : foo.matchPercent) +
      '" placeholder="e.g. 7"></label>';
    if (!foo.matchFull && matchPct != null && (employeePct == null ? 0 : employeePct) + 0.05 < matchPct) {
      matchBody += "<p>You may not be getting the full employer match — that’s free money.</p>" +
        '<p class="caption">Estimate — not advice. Uses the match % you entered — never invented.</p>';
    } else {
      matchBody += '<p class="caption">Enter the match % from your plan. Paper Trail never invents one.</p>';
    }
    matchBody += fooEmployerRatesHtml();
    html += fooStep(2, "Employer match", matchBody, statuses[2]);

    var debtBody = '<label class="check"><input type="checkbox" data-act="foo-check" data-field="noDebt"' +
      (foo.noDebt ? " checked" : "") + "> No debt</label>";
    var cheapBody = "";
    if (!foo.noDebt) {
      var needsBirthday = false;
      listed.forEach(function (loan, i) {
        var item = classified.items[i] || window.GradeMath.classifyDebt(loan, window.GradeMath.ageYears(birthdayISO()));
        if (item.needsBirthday) needsBirthday = true;
        var block = fooLoanBlock(loan, item, false);
        if (item.fooStep === 9) cheapBody += block;
        else debtBody += block;
      });
      if (needsBirthday) {
        debtBody += '<p class="caption">Add birthday in Profile so student and auto loans can be classified. Age is never invented.</p>' +
          '<button class="matters-btn" type="button" data-act="open-profile">Add birthday in Profile</button>';
      }
      debtBody += '<p class="sheet-label">Add a debt</p>' +
        field("Name", "debtName", "") +
        field("Balance", "debtBalance", "0", "number") +
        '<label class="field">APR %<input name="debtApr" inputmode="decimal" type="text" value="0"></label>' +
        field("Min payment", "debtMin", "0", "number") +
        debtTypeSelect("debtType", "", "") +
        '<button class="planner-apply" type="button" data-act="add-foo-debt">Add this debt</button>' +
        '<p class="caption">Writes a Debt envelope line with the same balance / APR / min fields. Extra payment lives on the Payoff card. Estimates, not advice.</p>';
    } else {
      debtBody += '<p class="caption">No-debt hides extra-payment math. Step 5 is the tax-free slot.</p>';
    }
    html += fooStep(3, "High-interest debt", debtBody, statuses[3]);

    var savingsCat = (month.categories || []).filter(function (c) { return /^savings$/i.test(c.name); })[0];
    var essentials = window.GradeMath.monthlyEssentials(budgetLinesFromMonth(month));
    var burn = essentials > 0 ? essentials : (est.takeHome > 0 ? est.takeHome / 12 : 0);
    var emergencyBody =
      '<label class="check"><input type="checkbox" data-act="foo-check" data-field="emergencyFunded"' +
      (foo.emergencyFunded ? " checked" : "") + "> Fully funded</label>" +
      '<label class="field">On hand $' +
      '<input class="cents-input" data-dollars="1" data-act="foo-money" data-field="emergencyAmount" inputmode="numeric" autocomplete="off" type="text" value="' +
      esc(money(foo.emergencyAmount || 0)) + '"></label>';
    if (burn > 0) {
      var three = burn * 3;
      var six = burn * 6;
      var year = state.worthYear || 2025;
      var nwSaving = (state.worth.lines || []).filter(function (line) {
        var n = String(line.name || "").toLowerCase();
        return n === "saving" || n === "savings";
      })[0];
      var onHand = (Number(foo.emergencyAmount) || 0) > 0
        ? Number(foo.emergencyAmount)
        : (nwSaving && (Number(nwSaving.amounts[year]) || 0) > 0
          ? Number(nwSaving.amounts[year])
          : (savingsCat ? catAssigned(savingsCat) : 0));
      emergencyBody += runwayHtml(Number(foo.emergencyAmount) || 0, burn);
      emergencyBody += "<p>3–6 mo target " + money(three) + " – " + money(six) +
        ". On hand " + money(onHand) + ".</p>" +
        '<p class="caption">Essential burn from Budget essentials' +
        (essentials > 0 ? "" : ", else take-home / 12") +
        ". Estimate — not advice.</p>";
    }
    html += fooStep(4, "Emergency reserves", emergencyBody, statuses[4]);

    html += fooStep(5, "Roth IRA + HSA",
      '<label class="check"><input type="checkbox" data-act="foo-check" data-field="rothOnTrack"' +
      (foo.rothOnTrack ? " checked" : "") + "> On track</label>" +
      '<label class="field">This year $' +
      '<input class="cents-input" data-dollars="1" data-act="foo-money" data-field="rothAmount" inputmode="numeric" autocomplete="off" type="text" value="' +
      esc(money(foo.rothAmount || 0)) + '"></label>' +
      '<p class="caption">Tax-free slot — Roth or HSA. Extra-payment math lives on Step 3 only when a loan is listed.</p>',
      statuses[5]);

    html += fooStep(6, "Max retirement",
      '<label class="check"><input type="checkbox" data-act="foo-check" data-field="maxEmployerPlans"' +
      (foo.maxEmployerPlans ? " checked" : "") + "> Maxing employer plans</label>" +
      '<p class="caption">If Roth + HSA + employer match + employee deferral already hit 25% of gross, this step is complete — no nag to max the employer plan.</p>',
      statuses[6]);

    html += fooStep(7, "Hyper-accumulation (25% of gross)",
      '<label class="check"><input type="checkbox" data-act="foo-check" data-field="hyperOnTrack"' +
      (foo.hyperOnTrack ? " checked" : "") + "> On track</label>" +
      '<label class="field">Current % of gross' +
      '<input data-act="foo-percent" data-field="hyperPercent" inputmode="decimal" type="text" value="' +
      esc(foo.hyperPercent === "" || foo.hyperPercent == null ? "" : foo.hyperPercent) + '"></label>',
      statuses[7]);

    html += fooStep(8, "Prepaid future expenses",
      '<label class="check"><input type="checkbox" data-act="foo-check" data-field="prepayFuture"' +
      (foo.prepayFuture ? " checked" : "") + "> Prepaying future expenses</label>",
      statuses[8]);

    html += fooStep(9, "Low-interest debt pre-pay",
      '<label class="check"><input type="checkbox" data-act="foo-check" data-field="prepayLowInterest"' +
      (foo.prepayLowInterest ? " checked" : "") + "> Prepaying low-interest debt</label>" +
      (cheapBody
        ? cheapBody + '<p class="caption">Cheap debt waits here. Mortgage / Home loan never sits on Step 3. In the spirit of Money Guy’s Financial Order of Operations — estimates, not advice.</p>'
        : '<p class="caption">Extra to cheap debt only after the rest of the order of operations.</p>'),
      statuses[9]);

    html += "</div>";
    return html;
  }

  function fooLoanBlock(loan, item, showExtra) {
    var extra = fooLoanExtra(loan.name);
    var html = '<div class="foo-loan"><div class="name">' + esc(loan.name) + "</div>" +
      '<p class="caption">Balance ' + money(loan.balance) + " · " + loan.apr + "% · min " +
      money(loan.min) + " · " + esc(window.GradeMath.debtTypeLabel(item.type)) + "</p>";
    html += fooBadgeButton(item, loan);
    if (item.needsBirthday) {
      html += '<p class="caption">Add birthday in Profile</p>';
    } else if (item.caption && item.fooStep !== 3) {
      html += '<p class="caption">' + esc(item.caption) + "</p>";
    }
    if (showExtra && loan.balance > 0 && loan.apr > 0 && loan.min > 0) {
      html += '<label class="field extra-field">Extra $ / mo' +
        '<input class="cents-input" data-dollars="1" data-act="loan-extra" data-loan="' +
        esc(loan.name) + '" inputmode="numeric" autocomplete="off" type="text" value="' +
        esc(money(extra)) + '"></label>';
      html += '<p class="payoff-copy">' + esc(payoffCopyFor(loan, extra)) + "</p>" +
        '<p class="caption">Estimate — not advice.</p>';
    }
    html += "</div>";
    return html;
  }

  function fooStep(number, title, body, status) {
    var done = status === "done";
    return '<section class="foo-step" id="foo-step-' + number + '">' +
      '<div class="foo-step-head"><h3>' + number + ". " + esc(title) + "</h3>" +
      (done ? fooDoneCluster(number) : fooHelpButton(number)) +
      "</div>" + body + "</section>";
  }

  function openFooExplainer(step) {
    captureModalReturnScreenTop();
    var explainer = window.GradeMath.fooExplainer(step);
    if (!explainer) return;
    var html = '<div class="sheet foo-explain-sheet">' +
      "<h3>" + explainer.number + ". " + esc(explainer.name) + "</h3>" +
      '<p class="kicker">What it is</p><p>' + esc(explainer.what) + "</p>" +
      '<p class="kicker">Why it matters</p><p>' + esc(explainer.why) + "</p>" +
      '<p class="kicker">Examples</p><ul class="foo-examples">' +
      explainer.examples.map(function (ex) { return "<li>" + esc(ex) + "</li>"; }).join("") +
      "</ul>" +
      '<p class="grade-sheet-note">' + esc(explainer.affiliation) + "</p>" +
      '<div class="sheet-actions"><button type="button" data-act="close-modal">Done</button></div></div>';
    var modal = document.getElementById("modal");
    modal.hidden = false;
    modal.innerHTML = html;
  }

  function openGradeSheet(sectionId) {
    captureModalReturnScreenTop();
    var month = ensureMonth(state.year, state.month);
    var grade = window.GradeMath.evaluate(buildGradeInput(month));
    var section = grade.sections.filter(function (item) { return item.id === sectionId; })[0];
    if (!section) return;
    var score = section.score == null ? (section.omittedReason || "Omitted") : String(Math.round(section.score));
    var html = '<div class="sheet">' +
      "<h3>" + esc(section.title) + "</h3>" +
      '<p class="grade-number">' + esc(score) + "</p>" +
      (section.provisional ? '<p class="caption">Provisional — fewer than two completed statements.</p>' : "") +
      "<p>" + esc(section.whatWentIn) + "</p>" +
      "<p>" + esc(section.sentence) + "</p>" +
      '<p class="grade-sheet-note">Estimates, not advice. This bar is not a letter grade and is not the order of operations.</p>' +
      '<div class="sheet-actions"><button type="button" data-act="close-modal">Done</button></div></div>';
    var modal = document.getElementById("modal");
    modal.hidden = false;
    modal.innerHTML = html;
  }

  function payoffCopyFor(loan, extra) {
    var GM = window.GradeMath;
    extra = Number(extra) || 0;
    var insight = GM.extraPayoffInsight
      ? GM.extraPayoffInsight(loan.balance, loan.apr, loan.min, extra)
      : null;
    if (!insight || !insight.currentMonths) return "";
    var current = insight.currentMonths;
    var faster = insight.extraMonths;
    if (!(extra > 0) || faster == null || faster >= current) {
      return "Current payoff " + formatPayoffDate(current) + " (" + formatDuration(current) + ").";
    }
    var copy = "Extra " + money(extra) + "/mo → paid off ~" +
      formatDuration(insight.savedMonths) + " sooner";
    if (insight.interestSaved > 0) copy += " / interest saved " + money(insight.interestSaved);
    copy += ". Current payoff " + formatPayoffDate(current) + " (" + formatDuration(current) + ").";
    return copy;
  }

  function paintLoanPayoff(el, name) {
    var wrap = el.closest(".foo-loan");
    if (!wrap) return;
    var loan = collectListedDebts(ensureMonth(state.year, state.month)).filter(function (item) {
      return item.name === name;
    })[0];
    var copy = wrap.querySelector(".payoff-copy");
    if (!copy || !loan) return;
    copy.textContent = payoffCopyFor(loan, fooLoanExtra(name));
  }

  function addFooDebt(root) {
    if (!root) return;
    var nameEl = root.querySelector("[name='debtName']");
    var balEl = root.querySelector("[name='debtBalance']");
    var aprEl = root.querySelector("[name='debtApr']");
    var minEl = root.querySelector("[name='debtMin']");
    var name = String(nameEl && nameEl.value || "").replace(/^\s+|\s+$/g, "");
    if (!name) return;
    var month = ensureMonth(state.year, state.month);
    var debt = (month.categories || []).filter(function (c) { return /^debt$/i.test(c.name); })[0];
    if (!debt) {
      debt = {
        id: nextId(),
        name: "Debt",
        assigned: 0,
        sortOrder: month.categories.length,
        lines: []
      };
      month.categories.push(debt);
    }
    if (!debt.lines) debt.lines = [];
    var min = centsFromDigits(minEl && minEl.value);
    var typeEl = root.querySelector("[name='debtType']");
    var newDebtLine = {
      id: nextId(),
      name: name,
      assigned: min,
      sortOrder: debt.lines.length,
      loanBalance: centsFromDigits(balEl && balEl.value),
      loanApr: Number(String(aprEl && aprEl.value || "").replace(/[^0-9.]/g, "")) || 0,
      loanMinPayment: min,
      loanOriginalBalance: 0,
      loanDebtType: (typeEl && typeEl.value) || ""
    };
    debt.lines.push(newDebtLine);
    reindexLines(debt);
    syncBudgetLoanToNetWorth(newDebtLine);
    saveState();
    render();
  }

  function mattersScale(title, field, low, high, value, max) {
    max = max || 5;
    return '<div class="scale-row"><strong>' + esc(title) + "</strong>" +
      '<input type="range" min="1" max="' + max + '" step="1" data-act="matters-scale" data-field="' +
      field + '" value="' + (Number(value) || (max === 10 ? 5 : 3)) + '">' +
      '<div class="scale-ends"><span>' + esc(low) + "</span><span>" + (Number(value) || (max === 10 ? 5 : 3)) +
      "</span><span>" + esc(high) + "</span></div></div>";
  }

  function mattersYesNo(title, field, value) {
    return mattersPick(title, field, [
      { id: "yes", label: "Yes" },
      { id: "no", label: "No" }
    ], value);
  }

  function mattersBudgetFollowUp(m) {
    if (!m || (m.usesBudget !== "yes" && m.usesBudget !== "sort-of")) return "";
    var html = mattersPick("How do you budget?", "budgetMethod", [
      { id: "app", label: "App" },
      { id: "paper", label: "Paper" },
      { id: "other", label: "Other" }
    ], m.budgetMethod);
    if (m.budgetMethod === "app") {
      html += '<label class="field">Which app?' +
        '<input data-act="matters-text" data-field="budgetAppName" autocomplete="off" type="text" value="' +
        esc(m.budgetAppName || "") + '">' +
        '<span class="caption">Optional.</span></label>';
    }
    if (m.budgetMethod === "other") {
      html += '<label class="field">How else do you budget?' +
        '<input data-act="matters-text" data-field="budgetMethodOther" autocomplete="off" type="text" required value="' +
        esc(m.budgetMethodOther || "") + '" placeholder="Describe how you budget">' +
        '<span class="caption">Required when Other is selected.</span></label>';
    }
    return html;
  }

  function mattersPick(title, field, options, value) {
    var html = '<div class="scale-row"><strong>' + esc(title) + "</strong>" +
      '<div class="yn-row wrap">';
    options.forEach(function (opt) {
      html += '<button type="button" data-act="matters-yn" data-field="' + field + '" data-value="' +
        esc(opt.id) + '"' + (value === opt.id ? ' class="on"' : "") + ">" + esc(opt.label) + "</button>";
    });
    html += "</div></div>";
    return html;
  }

  function mattersSheetScrollTop() {
    var modal = document.getElementById("modal");
    if (!modal || modal.hidden) return 0;
    var sheet = modal.querySelector(".sheet");
    return sheet ? sheet.scrollTop : 0;
  }

  function restoreMattersSheetScroll(top) {
    var modal = document.getElementById("modal");
    var sheet = modal && modal.querySelector(".sheet");
    if (sheet) sheet.scrollTop = top;
  }

  function paintMattersYesNo(row, field, value) {
    if (!row) return;
    Array.prototype.forEach.call(row.querySelectorAll("[data-act='matters-yn']"), function (btn) {
      if (btn.getAttribute("data-field") !== field) return;
      if (btn.getAttribute("data-value") === value) btn.classList.add("on");
      else btn.classList.remove("on");
    });
  }

  function openMattersSurvey(opts) {
    opts = opts || {};
    if (!opts.preserveScroll) captureModalReturnScreenTop();
    var keepTop = opts.preserveScroll ? mattersSheetScrollTop() : 0;
    state.matters = migrateMatters(state.matters);
    var m = state.matters;
    var html = '<div class="sheet matters-sheet">' +
      "<h3>What matters to you</h3>" +
      '<p class="caption">Required segmentation so Paper Trail can compare before and after. Optional needs are stored only — no coach tone. Estimates later, not advice.</p>' +
      mattersPick("When did you start taking finances seriously?", "financeStart", [
        { id: "not-yet", label: "Not yet" },
        { id: "this-year", label: "This year" },
        { id: "1-3", label: "Last 1–3 years" },
        { id: "4-10", label: "Last 4–10 years" },
        { id: "10-plus", label: "More than 10 years" },
        { id: "always", label: "Always / growing up" }
      ], m.financeStart) +
      mattersPick("Do you use a budget?", "usesBudget", [
        { id: "yes", label: "Yes" },
        { id: "sort-of", label: "Sort of" },
        { id: "no", label: "No" }
      ], m.usesBudget) +
      mattersBudgetFollowUp(m) +
      mattersPick("Aspire to be wealthy?", "aspireWealthy", [
        { id: "yes", label: "Yes" },
        { id: "not-sure", label: "Not sure" },
        { id: "no", label: "No" }
      ], m.aspireWealthy) +
      mattersPick("Do you think it’s possible?", "wealthPossible", [
        { id: "yes", label: "Yes" },
        { id: "not-sure", label: "Not sure" },
        { id: "no", label: "No" }
      ], m.wealthPossible) +
      mattersPick("Education level", "education", [
        { id: "high-school", label: "High school" },
        { id: "some-college", label: "Some college" },
        { id: "bachelors", label: "Bachelor’s" },
        { id: "masters", label: "Master’s" },
        { id: "doctorate", label: "Doctorate / professional" },
        { id: "other", label: "Other" }
      ], m.education) +
      mattersPick("If millionaire: generation in family", "millionaireGeneration", [
        { id: "na", label: "N/A / not there" },
        { id: "1st", label: "1st generation" },
        { id: "2nd", label: "2nd generation" },
        { id: "3rd", label: "3rd+" }
      ], m.millionaireGeneration) +
      mattersPick("Frugal?", "frugal", [
        { id: "yes", label: "Yes" },
        { id: "sort-of", label: "Sort of" },
        { id: "no", label: "No" }
      ], m.frugal) +
      mattersScale("Risk tolerance", "riskTolerance", "Protect", "Grow", m.riskTolerance, 10) +
      mattersPick("OK with some illiquidity for higher returns on a portion of assets?", "okIlliquidity", [
        { id: "yes", label: "Yes" },
        { id: "not-sure", label: "Not sure" },
        { id: "no", label: "No" }
      ], m.okIlliquidity) +
      '<p class="sheet-label">Goals</p>' +
      '<p class="caption">Also live as chips on Stats. Tap a chip to set a target date and dollar amount.</p>' +
      '<div class="goal-chips">';
    goalCatalog().forEach(function (chip) {
      html += '<button class="goal-chip' + ((m.goals || []).indexOf(chip.id) >= 0 ? " on" : "") +
        '" type="button" data-act="edit-goal" data-id="' + esc(chip.id) + '" data-return="matters">' +
        esc(chip.label) + "</button>";
    });
    html += "</div>" +
      '<button class="planner-apply" type="button" data-act="matters-deeper">' +
      (m.deeperOpen ? "Hide deeper questions" : "Go deeper") + "</button>" +
      '<p class="caption">Optional. Stored for later analysis — no coach or narration. No IQ, no 16 Personalities.</p>';
    if (m.deeperOpen) {
      html += mattersScale("I want my money choices to stand out.", "needSignificance", "Low", "High", m.needSignificance || 1) +
        mattersScale("I care that people close to me accept how I handle money.", "needAcceptance", "Low", "High", m.needAcceptance || 1) +
        mattersScale("I like mastering the details and being the one who figured it out.", "needIntelligence", "Low", "High", m.needIntelligence || 1) +
        mattersScale("I want the hard parts of my money story understood.", "needPity", "Low", "High", m.needPity || 1) +
        mattersScale("I want to be the one in control.", "needStrength", "Low", "High", m.needStrength || 1);
      var ranked = window.GradeMath.rankedNeeds({
        significance: m.needSignificance,
        acceptance: m.needAcceptance,
        intelligence: m.needIntelligence,
        pity: m.needPity,
        strength: m.needStrength
      });
      if (ranked.primary) {
        html += '<p class="caption">Primary ' + esc(ranked.primary.title) +
          (ranked.secondary ? " · secondary " + esc(ranked.secondary.title) : "") +
          ". Saved only — Paper Trail will not narrate from these needs.</p>";
      }
    }
    html += '<div class="sheet-actions"><button type="button" data-act="close-modal">Done</button></div></div>';
    var modal = document.getElementById("modal");
    modal.hidden = false;
    modal.innerHTML = html;
    if (opts.preserveScroll) restoreMattersSheetScroll(keepTop);
  }

  /* v37.5.59.2 (owner): finished months use Received (planned only if nothing logged); the current
   * month uses planned until every paycheck arrives. Every take-home caller passes the month here. */
  function takeHomeOpts(rec) {
    return rec ? { year: rec.year, month: rec.month } : {};
  }

  /* ---- v37.5.14 savings rates (Basic on Free, True on Premium + confirmed stub) ---- */
  function monthSavingsRates(month) {
    month = month || ensureMonth(state.year, state.month);
    var envelopes = gm().savingsEnvelopeTotal(month.categories || []);
    var th = gm().monthTakeHome(sums(month).income, month.transactions || [], month.incomes || [], takeHomeOpts(month));
    var plan = state.compensation || {};
    return {
      month: month,
      envelopes: envelopes,
      takeHomeSource: th.source,
      takeHomeLabel: th.label,
      takeHomePeriod: th.period,
      paychecksPlanned: th.plannedCount || 0,
      paychecksReceived: th.receivedCount || 0,
      basic: gm().basicSavingsRate({ savings: envelopes.total, takeHome: th.amount }),
      trueRate: gm().trueSavingsRate({
        premium: isPremium(),
        snapshot: plan.payStubSnapshot || null,
        paychecksPerYear: plan.paychecksPerYear || checksForFrequency(payFrequencyOf(plan)),
        savings: envelopes.total,
        useBasis: useStubBasis(),
        stubMonth: useStubBasis() ? stubMonthFigures(month.year, month.month) : null
      })
    };
  }

  /* v37.5.59.3: True inputs for one month / a list of months from the pay-stub year basis. */
  function stubMonthFigures(year, month) {
    var b = payStubBasisFor(year);
    return b && gm().payStubBasisMonth ? gm().payStubBasisMonth(b, month) : null;
  }
  function useStubBasis() {
    return !!gm().payStubYearBasis && confirmedPayStubs().length > 0;
  }
  function stubBasisShort(year) {
    var b = payStubBasisFor(year);
    return b ? b.short : "";
  }

  function savingsRateCardHtml(context) {
    var r = monthSavingsRates();
    var fmt = gm().formatSavingsRate;
    var label = MONTH_NAMES[r.month.month - 1] + " " + r.month.year;
    var html = '<section class="card savings-rates" data-context="' + esc(context || "") + '">' +
      '<p class="kicker">Savings rate · ' + esc(label) + "</p>" +
      '<div class="rate-row basic"><span>Basic savings rate</span><strong class="mono' +
      (r.basic.rate != null ? " moss" : "") + '">' + fmt(r.basic.rate) + "</strong></div>";
    if (r.basic.rate == null) {
      html += '<p class="caption">Add a paycheck to this month’s budget to see your Basic savings rate.</p>';
    } else {
      html += '<p class="caption">Savings envelopes ' + money(r.basic.savings) + " ÷ take-home " + money(r.basic.takeHome) +
        " (this month’s " + esc(r.takeHomeLabel || "planned paychecks") + " · after tax, not gross).</p>" +
        /* v37.5.59: say which denominator and why (the owner's rule). */
        '<p class="caption basic-denominator">' +
        (r.takeHomePeriod === "past"
          ? (r.takeHomeSource === "received"
            ? "Finished month — Basic uses what you received (" + money(r.basic.takeHome) + ")" +
              (r.paychecksPlanned > r.paychecksReceived
                ? ", " + r.paychecksReceived + " of " + r.paychecksPlanned + " planned paychecks logged. Log any missing paycheck to update it."
                : ".")
            : "Finished month with no income logged — Basic stays on planned take-home until you log what you received.")
          : esc(gm().BASIC_DENOMINATOR_NOTE) + (r.paychecksPlanned > 0
            ? " " + r.paychecksReceived + " of " + r.paychecksPlanned + " paycheck" + (r.paychecksPlanned === 1 ? "" : "s") + " received so far."
            : "")) + "</p>";
      if (!(r.basic.savings > 0)) {
        html += '<p class="caption empty-hint">Nothing assigned to savings envelopes yet — give savings a job on Budget.</p>';
      }
    }
    var t = r.trueRate;
    html += '<div class="true-rate' + (t.state === "ok" ? "" : " is-empty") + (t.state === "locked" ? " is-locked" : "") + '">';
    if (t.state === "ok") {
      html += '<div class="rate-row"><span>True savings rate</span><strong class="mono plum">' + fmt(t.rate) + "</strong></div>";
      t.rows.forEach(function (row) {
        html += '<div class="row dense rate-part' + (row.id === "employerMatch" || row.id === "employerBase" ? " is-match" : "") + '"><span>' +
          (row.id === "savings" ? "" : "+ ") + esc(row.label) + "</span><span class='mono'>" +
          (row.missing ? "Not on stub" : money(row.amount)) + "</span></div>";
      });
      html += '<div class="row dense rate-part total"><span>÷ Gross pay</span><span class="mono">' + money(t.gross) + "</span></div>" +
        (t.basis === "month"
          ? '<p class="caption true-month-basis">This month’s paychecks: ' + esc(t.monthNote) + ". Plus this month’s savings envelopes. Gross pay is the same actual-plus-projected basis as average tax (projected checks are base pay; a bonus only in its month). 401k and HSA stop at their 2026 IRS limits; " +
            esc(stubBasisShort(r.month.year)) + " for the year.</p>"
          : '<p class="caption">Monthly: confirmed pay stub × ' + t.paychecksPerYear + " paychecks ÷ 12, plus this month’s savings envelopes. Never estimated.</p>");
    } else if (t.state === "locked") {
      html += '<p class="kicker">Premium</p><div class="rate-row"><span>True savings rate</span><strong class="mono muted">🔒</strong></div>' +
        '<p class="caption">' + (confirmedPayStubSnapshot()
          ? "Your pay stub is confirmed. Premium unlocks True savings rate — savings envelopes + 401k + employer match + HSA ÷ gross pay."
          : "Confirm a pay stub on Premium to see your true savings rate — savings envelopes + 401k + employer match + HSA ÷ gross pay.") + "</p>" +
        '<button class="matters-btn" type="button" data-act="set-plan" data-plan="premium">Unlock True savings rate</button>';
    } else {
      html += '<div class="rate-row"><span>True savings rate</span><strong class="mono muted">—</strong></div>' +
        '<p class="empty-state">' + (t.noMonthStub
          ? "No confirmed pay stub covers " + esc(label) + " — True uses each month’s own paychecks, so confirm a " + r.month.year + " stub (one with YTD columns covers the whole year so far)."
          : confirmedPayStubSnapshot()
          ? "True savings rate needs Premium with this confirmed stub."
          : "Confirm a pay stub to see your true savings rate.") + "</p>" +
        '<p class="caption">Uses only a confirmed stub’s gross, 401k, employer match, and HSA. No stub, no number — never estimated.</p>' +
        (confirmedPayStubSnapshot()
          ? '<button class="matters-btn" type="button" data-act="set-plan" data-plan="premium">Unlock True savings rate</button>'
          : '<button class="planner-apply" type="button" data-act="open-vault-paystubs">Add a pay stub in Vault</button>');
    }
    html += "</div></section>";
    return html;
  }

  function insightCard(title, body) {
    return '<section class="card insight-card">' +
      "<h3>" + esc(title) + "</h3>" +
      "<p>" + esc(body) + "</p>" +
      '<p class="caption">Estimate — not advice.</p></section>';
  }

  function taxFreeRoomCard(est, foo) {
    var GM = window.GradeMath;
    var age = GM.ageYears(birthdayISO());
    var income = currentAnnualIncomeHeadline().amount;
    var filing = filingStatusOf(state.compensation);
    var room = GM.taxFreeRoom({
      ageYears: age,
      annualIncome: income,
      filingStatus: filing,
      ytdRoth: Number(foo.rothAmount) || 0,
      // v37.5.59.3: actual HSA so far this year from the pay-stub YTD (employee + employer), else the plan
      ytdHsa: (function () {
        var b = payStubBasisFor(new Date().getFullYear());
        return b ? roundCents(b.actual.hsa + b.actual.erHsa) : (Number(est && est.hsa) || 0);
      })(),
      hsaCoverage: hsaCoverageOf(),
      year: new Date().getFullYear()
    });
    var bits = [];
    bits.push("Roth room left " + money(room.rothLeft) + " of " + money(room.rothLimit));
    bits.push("HSA room left " + money(room.hsaLeft) + " of " + money(room.hsaLimit) +
      (room.familyHsa ? " (family estimate)" : " (self-only estimate)"));
    if (room.rothEligible === "none") bits.push("Income looks above the " + room.year + " Roth limit.");
    else if (room.rothEligible === "partial") bits.push("Income may phase out some Roth room.");
    if (room.needsBirthday) bits.push("Add birthday in Profile for catch-up.");
    return insightCard("Roth / HSA room left → Step 5", bits.join(" "));
  }


  function paycheckCompositionHtml(snap) {
    var comp = gm().paycheckComposition ? gm().paycheckComposition(snap) : null;
    if (!comp) return "";
    function pctLabel(p) {
      return Math.round((Number(p) || 0) * 100) + "%";
    }
    var t = Math.max(0, Math.round(comp.taxesPct * 1000) / 10);
    var d = Math.max(0, Math.round(comp.deductionsPct * 1000) / 10);
    var n = Math.max(0, Math.round(comp.netPct * 1000) / 10);
    return '<div class="paycheck-composition">' +
      '<div class="paycheck-comp-chips">' +
      '<span class="paycheck-comp-chip taxes"><strong>' + pctLabel(comp.taxesPct) + "</strong> taxes</span>" +
      '<span class="paycheck-comp-chip deductions"><strong>' + pctLabel(comp.deductionsPct) + "</strong> deductions</span>" +
      '<span class="paycheck-comp-chip net"><strong>' + pctLabel(comp.netPct) + "</strong> net</span>" +
      "</div>" +
      '<div class="paycheck-comp-bar" aria-hidden="true">' +
      '<span class="seg taxes" style="width:' + t + '%"></span>' +
      '<span class="seg deductions" style="width:' + d + '%"></span>' +
      '<span class="seg net" style="width:' + n + '%"></span>' +
      "</div>" +
      '<p class="caption">Share of this paycheck\'s gross — taxes, voluntary deductions, net. From confirmed stub only.</p>' +
      "</div>";
  }

  /* opts.paycheckStrip: Income keeps optional paycheck chrome; NW focuses on investable mix.
   * opts.context: "income" | "worth" (affects captions only).
   */
  function taxTriangleHtml(opts) {
    opts = opts || {};
    var showPaycheck = opts.paycheckStrip !== false;
    var context = opts.context || "income";
    var year = state.worthYear || ((state.worth.years || [])[(state.worth.years || []).length - 1]) || new Date().getFullYear();
    var lines = (state.worth && state.worth.lines) || [];
    var tri = gm().taxTriangleBuckets ? gm().taxTriangleBuckets(lines, year) : { empty: true, buckets: [], total: 0 };
    var html = '<p class="section-label">Tax triangle</p>';
    if (!isPremium()) {
      html += '<section class="card tax-triangle locked">' +
        '<p class="kicker">Premium</p>' +
        '<p>See how investable net worth splits across Non-qualified, Pre-tax, and After-tax.</p>' +
        '<p class="caption">No fake bucket amounts on Free. Unlock Premium for the real NW split.</p>' +
        '<button class="matters-btn" type="button" data-act="set-plan" data-plan="premium">Unlock tax triangle</button>' +
        "</section>";
      return html;
    }
    html += '<section class="card tax-triangle' + (context === "worth" ? " tax-triangle-worth" : "") + '">';
    if (tri.empty) {
      html += '<p class="empty">No retirement or investment balances yet for ' + year + ".</p>" +
        '<p class="caption">Add them to your Net Worth statement and the Non-qualified / Pre-tax / After-tax split appears here. Cash, Lifestyle, Property, and loans stay out of the triangle.</p>';
    } else {
      /* v37.5.28: triangle slices use the existing moss / gold / plum tokens.
         Named buckets keep their color. Slice order is not rearranged. */
      var positive = (tri.buckets || []).filter(function (b) { return b.amount > 0; });
      function triangleFill(bucket, index, count) {
        var id = bucket.id || "";
        var label = String(bucket.label || "").toLowerCase();
        var named = "";
        if (id === "nonQualified" || /non-?qualified|\btaxable\b/.test(label)) named = "var(--moss)";
        else if (id === "preTax" || /pre-?tax/.test(label)) named = "var(--gold)";
        else if (id === "afterTax" || /after-?tax|\broth\b/.test(label)) named = "var(--plum)";
        if (count === 3) return named || ["var(--moss)", "var(--gold)", "var(--plum)"][index];
        return named || ["var(--moss)", "var(--gold)", "var(--plum)"][index % 3];
      }
      var slices = positive.map(function (b, i) {
        return { name: b.label, amount: b.amount, color: triangleFill(b, i, positive.length) };
      });
      html += '<p class="kicker">Investable mix · ' + year + "</p>";
      html += pieSvg(slices, "No investable balances.", "label");
      (tri.buckets || []).forEach(function (b) {
        html += '<div class="row dense"><span>' + esc(b.label) + '</span><span class="mono">' +
          money(b.amount) + "</span></div>";
      });
      html += '<p class="caption">Estimates from Net Worth lines; you can reclassify later. Cash / Lifestyle / Property / loans are out of the triangle.</p>';
    }
    if (showPaycheck) {
      var snap = state.compensation && state.compensation.payStubSnapshot;
      var strip = gm().paycheckTaxStrip ? gm().paycheckTaxStrip(snap) : null;
      if (strip) {
        html += '<p class="sheet-label">This paycheck</p>' +
          '<div class="row dense"><span>Current tax</span><span class="mono">' + money(strip.currentTax) + "</span></div>" +
          '<div class="row dense"><span>Deferred</span><span class="mono">' + money(strip.deferred) + "</span></div>" +
          '<div class="row dense"><span>Tax-free</span><span class="mono">' + money(strip.taxFree) + "</span></div>" +
          paycheckCompositionHtml(snap) +
          '<p class="caption">Only known pay-stub withholding / contributions — never estimated.</p>';
      } else {
        html += '<p class="caption">Add a pay stub to unlock this-paycheck tax / deferred / tax-free strip.</p>';
      }
    }
    html += "</section>";
    return html;
  }

  function renderCompensation() {
    var est = estimateCompensation(state.compensation);
    return '<p class="section-label">Compensation</p><div class="planner">' +
      '<div class="row"><span>Base salary</span><span class="mono">' + money(est.baseSalary) + "</span></div>" +
      '<div class="row"><span>Est. take-home</span><span class="mono moss">' + money(est.takeHome) + "</span></div>" +
      '<div class="row"><span>Basic savings rate</span><span class="mono moss">' +
      gm().formatSavingsRate(monthSavingsRates().basic.rate) + "</span></div>" +
      '<div class="row"><span>Average tax</span><span class="mono">' +
      rateOrDash(compStubFigures() ? compStubFigures().avgTax : est.effectiveTaxRate) + "</span></div>" +
      '<div class="doc-cue-row"><button class="planner-apply" type="button" data-act="open-income-statement">Open Compensation</button>' +
      docCueHtml("income") + docCueHtml("k401") + docCueHtml("payStubs") + "</div>" +
      (est.baseSalary > 0 ? "" : '<p class="caption empty-hint">Add your salary in the income statement to estimate take-home and taxes.</p>') +
      '<p class="caption">Estimates only — not tax advice. Budget paycheck amounts stay manual.</p></div>' +
      savingsRateCardHtml("income") +
      taxTriangleHtml({ paycheckStrip: true, context: "income" });
  }


  /* v37.5.24: income statement shows Basic/True savings rate and average tax
   * where the Planned/Received budget comparison used to sit. Rates come from
   * monthSavingsRates (same Basic/True rules). Average tax is taxes ÷ gross
   * already on this statement (estimateCompensation.effectiveTaxRate). */
  function statementRatesHtml(rates, est, fmt) {
    function line(label, value, empty) {
      return '<div class="stmt-line"><span class="stmt-label">' + esc(label) +
        '</span><span class="stmt-amt' + (empty ? " is-empty" : "") + '">' + value + "</span></div>";
    }
    var html = '<div class="stmt-rates">';
    if (rates.basic.rate == null) {
      html += line("Basic savings rate", "—", true) +
        '<p class="caption quiet">Add a paycheck to see Basic savings rate.</p>';
    } else {
      html += line("Basic savings rate", fmt(rates.basic.rate), false);
    }
    if (rates.trueRate && rates.trueRate.state === "ok" && rates.trueRate.rate != null) {
      html += line("True savings rate", fmt(rates.trueRate.rate), false);
    }
    if (est.effectiveTaxRate == null) {
      html += line("Average tax", "—", true) +
        '<p class="caption quiet">Add gross and taxes to see average tax.</p>';
    } else {
      html += line("Average tax", rateOrDash(est.effectiveTaxRate), false);
    }
    html += "</div>";
    return html;
  }

  function statementPreviousMonth(month) {
    var previous = offsetMonth(month.year, month.month, -1);
    return state.months[ymKey(previous.year, previous.month)] || null;
  }

  function statementPreviousCategory(month, previousMonth, category) {
    if (!previousMonth) return null;
    var byId = (previousMonth.categories || []).filter(function (item) {
      return String(item.id) === String(category.id);
    })[0];
    if (byId) return byId;
    return (previousMonth.categories || []).filter(function (item) {
      return String(item.name || "") === String(category.name || "");
    })[0] || null;
  }

  function statementLastMonthSpent(month, previousMonth, category) {
    var previousCategory = statementPreviousCategory(month, previousMonth, category);
    return previousCategory ? spentFor(previousMonth, previousCategory.id) : 0;
  }

  function renderStatement(month, totals) {
    /* v37.5.53: the income statement is the yearly tracker. The old details page is not the statement. */
    return renderAnnualStatement();
  }

  /* Whole dollars from the Finances IS! tab. Blank cells stay null. Bonus is null every year.
     401k deferral is not folded into salary or total. */
  /* v37.5.57: the owner's historical income statement. Used for demo seed + one-time
   * migration for existing devices that never persisted annualStatement. Fresh
   * users get emptyAnnualStatement() instead. */
  function sampleAnnualStatementSeed() {
    function row(salary, sideGig, other, match, taxes, opex, investments) {
      return {
        salary: salary,
        bonus: null,
        sideGig: sideGig,
        other: other,
        match: match,
        taxes: taxes,
        opex: opex,
        investments: investments
      };
    }
    return {
      filingStatus: "single",
      years: {
        "2016": row(18000, null, null, null, 0, 12000, 1000),
        "2017": row(20000, null, null, null, 0, 13000, 1500),
        "2018": row(24000, null, null, null, 0, 15000, 2000),
        "2019": row(28000, null, null, null, 0, 17000, 2500),
        "2020": row(32000, null, null, null, 0, 19000, 3000),
        "2021": row(36000, 1000, null, null, 0, 21000, 3500),
        "2022": row(40000, 1500, null, null, 0, 23000, 4000),
        "2023": row(44000, 2000, null, 300, 6000, 26000, 4500),
        "2024": row(50000, 2500, 500, 400, 7500, 29000, 5000),
        "2025": row(56000, 3000, 600, 500, 9000, 32000, 6000),
        "2026": row(60000, null, null, null, null, null, null)
      }
    };
  }

  function emptyAnnualStatement() {
    return { filingStatus: "single", years: {} };
  }

  /* Kept as an alias for call sites that still say seed; demo/fresh restore use the sample book. */
  function seedAnnualStatement() {
    return sampleAnnualStatementSeed();
  }

  var ANNUAL_FIELDS = ["salary", "bonus", "sideGig", "other", "match", "taxes", "opex", "investments"];
  var ANNUAL_INCOME_FIELDS = ["salary", "bonus", "sideGig", "other", "match"];
  var ANNUAL_TAX_PART_FIELDS = ["taxFederal", "taxState", "taxFica", "taxOther"];
  var ANNUAL_TAX_PART_LABELS = {
    taxFederal: "Federal income",
    taxState: "State income",
    taxFica: "FICA (SS + Medicare)",
    taxOther: "Other"
  };
  /* 2026 federal brackets & standard deduction — IRS Rev. Proc. 2025-32. */
  var STMT_FED_STD_2026 = { single: 16100, mfj: 32200, hoh: 24150 };
  var STMT_FED_BRACKETS_2026 = {
    single: [[12400, 0.10], [50400, 0.12], [105700, 0.22], [201775, 0.24], [256225, 0.32], [640600, 0.35], [Infinity, 0.37]],
    mfj: [[24800, 0.10], [100800, 0.12], [211400, 0.22], [403550, 0.24], [512450, 0.32], [768700, 0.35], [Infinity, 0.37]],
    hoh: [[17700, 0.10], [67450, 0.12], [105700, 0.22], [201750, 0.24], [256200, 0.32], [640600, 0.35], [Infinity, 0.37]]
  };
  /* 2026 Minnesota brackets & standard deduction — MN Dept. of Revenue (Dec 2025). */
  var STMT_MN_STD_2026 = { single: 15300, mfj: 30600, hoh: 23000 };
  var STMT_MN_BRACKETS_2026 = {
    single: [[33310, 0.0535], [109430, 0.068], [203150, 0.0785], [Infinity, 0.0985]],
    mfj: [[48700, 0.0535], [193480, 0.068], [337930, 0.0785], [Infinity, 0.0985]],
    hoh: [[41010, 0.0535], [164800, 0.068], [270060, 0.0785], [Infinity, 0.0985]]
  };
  var STMT_FED_RATE_OPTIONS = [0.10, 0.12, 0.22, 0.24, 0.32, 0.35, 0.37];
  var STMT_MN_RATE_OPTIONS = [0.0535, 0.068, 0.0785, 0.0985];

  function ensureAnnualStatement(host) {
    host = host || state;
    if (!host) return emptyAnnualStatement();
    var book = host.annualStatement;
    if (book && typeof book === "object" && book.years && typeof book.years === "object") {
      return book;
    }
    /* v37.5.57: missing book → empty years, never sample history. */
    host.annualStatement = emptyAnnualStatement();
    return host.annualStatement;
  }

  function annualStatementHasYears(book) {
    return !!(book && book.years && typeof book.years === "object" && Object.keys(book.years).length);
  }

  /* True when the device already has real books that aren't a brand-new blank survey. */
  function hasOtherSavedBooks(parsed) {
    if (!parsed || typeof parsed !== "object") return false;
    var months = parsed.months || {};
    var monthKeys = Object.keys(months);
    if (monthKeys.length > 1) return true;
    if (monthKeys.length === 1) {
      var m = months[monthKeys[0]] || {};
      if ((m.transactions || []).length) return true;
      if ((m.incomes || []).some(function (row) { return (Number(row.amount) || 0) > 0; })) return true;
      if ((m.categories || []).some(function (c) { return catAssigned(c) > 0; })) return true;
    }
    if (parsed.worth && !parsed.worth.blank && worthHasData(parsed.worth)) return true;
    if (parsed.profile && (parsed.profile.name || (parsed.profile.documents || []).length)) return true;
    if (parsed.onboarding && parsed.onboarding.status === "done" && !parsed.onboarding.demo) return true;
    return false;
  }

  /* One-time: devices that never persisted annualStatement still get owner's history. */
  function migrateSampleAnnualDefaults(parsed) {
    if (!parsed || typeof parsed !== "object") return;
    if (parsed._sampleAnnualMigrated) return;
    if (annualStatementHasYears(parsed.annualStatement)) {
      parsed._sampleAnnualMigrated = true;
      return;
    }
    if (!hasOtherSavedBooks(parsed)) {
      if (!parsed.annualStatement) parsed.annualStatement = emptyAnnualStatement();
      return;
    }
    parsed.annualStatement = sampleAnnualStatementSeed();
    parsed.compensation = migrateCompensation(parsed.compensation || defaultCompensation());
    if (!(Number(parsed.compensation.baseSalary) > 0)) parsed.compensation.baseSalary = 87885;
    parsed._sampleAnnualMigrated = true;
  }

  function annualNumber(value) {
    if (value == null || value === "") return null;
    var n = Number(value);
    return isFinite(n) ? n : null;
  }

  /* Older yearly rows stored this line as employer match. Read it once as 401k match. */
  var ANNUAL_MATCH_LEGACY_KEYS = ["employerMatch", "employer match", "Employer match", "Employer Match"];

  function annualLegacyMatch(raw) {
    var i;
    for (i = 0; i < ANNUAL_MATCH_LEGACY_KEYS.length; i++) {
      var key = ANNUAL_MATCH_LEGACY_KEYS[i];
      if (!Object.prototype.hasOwnProperty.call(raw, key)) continue;
      var value = annualNumber(raw[key]);
      if (value != null) return value;
    }
    return null;
  }

  function annualRow(raw) {
    raw = raw || {};
    var row = {};
    ANNUAL_FIELDS.forEach(function (id) { row[id] = annualNumber(raw[id]); });
    ANNUAL_TAX_PART_FIELDS.forEach(function (id) { row[id] = annualNumber(raw[id]); });
    /* Prefer the current match field. Fall back to the old key only when match is blank, so it is not added twice. */
    if (row.match == null) row.match = annualLegacyMatch(raw);
    row.federalBracket = annualBracketRate(raw.federalBracket);
    row.stateBracket = annualStateBracketValue(raw.stateBracket);
    row.stateOtherPct = annualNumber(raw.stateOtherPct);
    return row;
  }

  function annualBracketRate(value) {
    if (value == null || value === "" || value === "auto") return null;
    var n = Number(value);
    return isFinite(n) ? n : null;
  }

  function annualStateBracketValue(value) {
    if (value == null || value === "" || value === "auto") return null;
    if (value === "other") return "other";
    var n = Number(value);
    return isFinite(n) ? n : null;
  }

  function annualCloneYearRow(raw) {
    var row = annualRow(raw);
    var out = {};
    ANNUAL_FIELDS.forEach(function (id) { out[id] = row[id]; });
    ANNUAL_TAX_PART_FIELDS.forEach(function (id) { out[id] = row[id]; });
    out.federalBracket = row.federalBracket;
    out.stateBracket = row.stateBracket;
    out.stateOtherPct = row.stateOtherPct;
    return out;
  }

  /* If a calendar year column is missing, copy the prior year (including tax sub-lines). */
  function ensureAnnualYearFromPrior(book, year) {
    book = book || ensureAnnualStatement();
    var key = String(year);
    if (book.years[key]) return book.years[key];
    var years = annualYearList(book);
    var prior = null;
    years.forEach(function (y) { if (y < year) prior = y; });
    if (prior == null) {
      book.years[key] = {
        salary: null, bonus: null, sideGig: null, other: null, match: null,
        taxes: null, opex: null, investments: null,
        taxFederal: null, taxState: null, taxFica: null, taxOther: null,
        federalBracket: null, stateBracket: null, stateOtherPct: null
      };
    } else {
      book.years[key] = annualCloneYearRow(book.years[String(prior)]);
    }
    return book.years[key];
  }

  function annualFilingStatus(book) {
    book = book || ensureAnnualStatement();
    var s = book.filingStatus;
    if (s === "mfj" || s === "hoh" || s === "single") return s;
    var profile = filingStatusOf(state.compensation);
    if (profile === "married") return "mfj";
    return "single";
  }

  function annualHasTaxParts(row) {
    return ANNUAL_TAX_PART_FIELDS.some(function (id) { return row[id] != null; });
  }

  function annualTaxesAmount(row, year) {
    if (annualHasTaxParts(row)) {
      /* v37.5.59.5: a typed sub-line wins; a blank one keeps its live pay-stub estimate (same as the table shows). */
      var partEst = year != null ? annualTaxEstimateParts(year) : null;
      var sum = 0;
      ANNUAL_TAX_PART_FIELDS.forEach(function (id) {
        if (row[id] != null) sum += row[id];
        else if (partEst && partEst[id] != null) sum += partEst[id];
      });
      return roundCents(sum);
    }
    if (row.taxes != null) return row.taxes;
    /* v37.5.59.3: that year’s pay stubs — actual YTD withheld + projected remaining checks. */
    var est = annualTaxEstimateParts(year);
    if (!est) return null;
    var estSum = 0;
    var any = false;
    ANNUAL_TAX_PART_FIELDS.forEach(function (id) {
      if (est[id] != null) { any = true; estSum += est[id]; }
    });
    return any ? roundCents(estSum) : null;
  }

  function confirmedPayStubSnapshot() {
    var snap = state.compensation && state.compensation.payStubSnapshot;
    if (snap && typeof snap === "object" && (snap.gross != null || snap.federalTax != null || snap.net != null)) {
      return snap;
    }
    var docs = (state.profile && state.profile.documents) || [];
    var i, doc;
    for (i = 0; i < docs.length; i++) {
      doc = docs[i];
      if (doc && doc.payStubConfirmed && doc.payStubPending && typeof doc.payStubPending === "object") {
        return doc.payStubPending;
      }
    }
    return null;
  }

  /* v37.5.59.3: every confirmed pay stub (Vault docs + the compensation snapshot), newest last. */
  function confirmedPayStubs() {
    var out = [];
    var keys = {};
    function add(stub) {
      if (!stub || typeof stub !== "object") return;
      var key = (stub.payDate || "") + "|" + (stub.gross || "") + "|" + (stub.net || "");
      if (keys[key]) {
        // keep the copy that carries YTD columns
        if (stub.ytd && !keys[key].ytd) out[out.indexOf(keys[key])] = stub;
        return;
      }
      keys[key] = stub;
      out.push(stub);
    }
    ((state.profile && state.profile.documents) || []).forEach(function (doc) {
      if (doc && doc.payStubConfirmed && doc.payStubPending && typeof doc.payStubPending === "object") add(doc.payStubPending);
    });
    var snap = state.compensation && state.compensation.payStubSnapshot;
    if (snap && snap.confirmedAt) add(snap);
    return out.sort(function (a, b) { return String(a.payDate || "") < String(b.payDate || "") ? -1 : 1; });
  }

  /* v37.5.59.4: month the annual bonus pays (1–12), or null when not set. */
  function bonusMonthOf() {
    var m = Number(state.compensation && state.compensation.bonusMonth);
    return m >= 1 && m <= 12 ? m : null;
  }

  function hsaCoverageOf() {
    var c = state.compensation && state.compensation.hsaCoverage;
    if (c === "family" || c === "self") return c;
    return filingStatusOf(state.compensation) === "married" ? "family" : "self";
  }

  function ageAtYearEnd(year) {
    var b = birthdayISO();
    var m = String(b || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return null;
    return Number(year) - Number(m[1]);
  }

  /* v37.5.59.3 (owner): actual YTD + projected remaining checks, capped at 2026 IRS limits.
   * Replaces stub × paychecks/year everywhere (brackets, Taxes, average tax, True). Cached per render input. */
  var payStubBasisCache = {};
  /* ---- v37.5.59.16: Compensation → income statement sync, year-end salary target, line notes ----
   * Stored on this device only, in state.incomeSync / state.incomeTargets. Tester sharing is an allow-list
   * (buildTesterPayload) that never reads these, so targets and free-text notes are never shared.
   * Sync is an overlay: it never rewrites or deletes what the user typed on the income statement. */
  var SYNC_LINES = [
    { id: "salary", label: "Salary" },
    { id: "bonus", label: "Bonus" },
    { id: "match", label: "401k match" }
  ];
  var NOTE_LINES = [
    { id: "salary", label: "Salary" },
    { id: "bonus", label: "Bonus" },
    { id: "sideGig", label: "Side gig" },
    { id: "other", label: "Other" },
    { id: "match", label: "401k match" }
  ];

  function incomeSyncCfg() {
    var c = state && state.incomeSync;
    if (!c || typeof c !== "object") c = { off: false, lines: {} };
    if (!c.lines || typeof c.lines !== "object") c.lines = {};
    return c;
  }

  function incomeTargetFor(year) {
    var all = (state && state.incomeTargets) || {};
    var t = all[String(Number(year))] || {};
    var target = Number(t.salaryTarget);
    return { salaryTarget: target > 0 ? target : null, notes: t.notes && typeof t.notes === "object" ? t.notes : {} };
  }

  function writeIncomeTarget(year, target, notes) {
    if (!state.incomeTargets || typeof state.incomeTargets !== "object") state.incomeTargets = {};
    var cleanNotes = {};
    Object.keys(notes || {}).forEach(function (k) { var v = String(notes[k] || "").replace(/^\s+|\s+$/g, ""); if (v) cleanNotes[k] = v.slice(0, 300); });
    if (!(target > 0) && !Object.keys(cleanNotes).length) { delete state.incomeTargets[String(year)]; return; }
    state.incomeTargets[String(year)] = { salaryTarget: target > 0 ? target : null, notes: cleanNotes };
  }

  /* What Compensation contributes to each synced line for this year. Current calendar year only; stub years
   * keep their stub figures (stubs win), so this only reaches the typed-income path. Variable comp is never
   * synced (off in 2026). A bonus syncs only while its pay month is still ahead; side gig / other have no
   * Compensation source. */
  function compSyncValues(year) {
    var out = {};
    var cfg = incomeSyncCfg();
    var now = currentYearMonth();
    if (cfg.off || Number(year) !== now.year || !state || !state.compensation) return out;
    var plan = migrateCompensation(state.compensation);
    var est = estimateCompensation(plan);
    if (!cfg.lines.salary && est.baseSalary > 0) out.salary = roundCents(est.baseSalary);
    var pct = Number(plan.bonusTargetPercent) || 0;
    var bm = bonusMonthOf();
    if (!cfg.lines.bonus && est.baseSalary > 0 && pct > 0 && bm && bm >= now.month) out.bonus = roundCents(est.baseSalary * pct / 100);
    var er = roundCents((Number(est.employerMatch) || 0) + (Number(est.employerBase) || 0));
    if (!cfg.lines.match && er > 0) out.match = er;
    return out;
  }

  function syncedAnnualRow(row, year) {
    var out = row;
    var copied = false;
    function set(id, v) {
      if (!copied) { out = {}; Object.keys(row).forEach(function (k) { out[k] = row[k]; }); copied = true; }
      out[id] = v;
    }
    var t = incomeTargetFor(year);
    var sync = compSyncValues(year);
    Object.keys(sync).forEach(function (id) { set(id, sync[id]); });
    if (t.salaryTarget) set("salary", t.salaryTarget);
    return out;
  }

  function payStubBasisFor(year) {
    if (!gm().payStubYearBasis) return null;
    var stubs = confirmedPayStubs();
    if (!stubs.length) return null;
    var plan = state.compensation || {};
    var typedRow = state.annualStatement && state.annualStatement.years && state.annualStatement.years[String(Number(year))];
    var opts = {
      year: Number(year),
      frequency: payFrequencyOf(plan),
      paychecksPerYear: plan.paychecksPerYear,
      hsaCoverage: hsaCoverageOf(),
      ageAtYearEnd: ageAtYearEnd(year),
      // v37.5.59.4: a bonus is projected only if its month is still ahead (bonusMonth); amount = typed bonus, else target %.
      bonusMonth: bonusMonthOf(),
      bonusAmount: typedRow ? annualRow(typedRow).bonus : null,
      bonusTargetPercent: Number(plan.bonusTargetPercent) || 0,
      salaryTarget: incomeTargetFor(year).salaryTarget
    };
    var key = JSON.stringify([stubs, opts]);
    var slot = payStubBasisCache[String(opts.year)];
    if (slot && slot.key === key) return slot.value;
    var value = gm().payStubYearBasis(stubs, opts);
    payStubBasisCache[String(opts.year)] = { key: key, value: value };
    return value;
  }

  /* v37.5.59.5 one-time repair: 37.5.59.4 and earlier saved the read-only pay-stub Taxes estimate as typed
   * Taxes whenever the year sheet was saved, freezing it. Conservative: clear a stored Taxes only when no tax
   * sub-line is typed and it equals, to the cent, the estimate engine's output — today's, or the same basis
   * without the typed bonus (the sheet froze the pre-bonus estimate when a bonus was typed in the same save). */
  function migrateFrozenStubTaxes() {
    var book = state && state.annualStatement;
    if (!book || !book.years || !gm().payStubYearBasis) return false;
    var stubs = confirmedPayStubs();
    if (!stubs.length) return false;
    var changed = false;
    Object.keys(book.years).forEach(function (key) {
      var raw = book.years[key];
      if (!raw || typeof raw !== "object") return;
      var row = annualRow(raw);
      if (row.taxes == null || annualHasTaxParts(row)) return;
      var year = Number(key);
      var basis = payStubBasisFor(year);
      if (!basis) return;
      var plan = state.compensation || {};
      var noBonus = gm().payStubYearBasis(stubs, {
        year: year, frequency: payFrequencyOf(plan), paychecksPerYear: plan.paychecksPerYear,
        hsaCoverage: hsaCoverageOf(), ageAtYearEnd: ageAtYearEnd(year), bonusMonth: bonusMonthOf(),
        bonusAmount: null, bonusTargetPercent: Number(plan.bonusTargetPercent) || 0
      });
      var candidates = [];
      [basis, noBonus].forEach(function (b) {
        if (!b || !b.taxes) return;
        var t = b.taxes;
        candidates.push(cents(t.total));
        candidates.push(cents(roundCents(t.fed) + roundCents(t.state) + roundCents(t.fica) + (t.otherTax > 0 ? roundCents(t.otherTax) : 0)));
      });
      if (candidates.indexOf(cents(row.taxes)) >= 0) {
        raw.taxes = null;
        changed = true;
      }
    });
    return changed;
  }

  /* Taxes for a year from the pay-stub basis: actual withheld YTD + projected remaining checks. */
  function annualTaxEstimateParts(year) {
    if (year == null) year = currentYearMonth().year;
    var basis = payStubBasisFor(year);
    if (!basis) return null;
    var t = basis.taxes;
    return {
      taxFederal: roundCents(t.fed),
      taxState: roundCents(t.state),
      taxFica: roundCents(t.fica),
      taxOther: t.otherTax > 0 ? roundCents(t.otherTax) : null
    };
  }

  function annualTaxPartDisplay(row, partId, year) {
    if (row[partId] != null) return { value: row[partId], estimate: false };
    var est = annualTaxEstimateParts(year);
    if (est && est[partId] != null) return { value: est[partId], estimate: true };
    return { value: null, estimate: false };
  }

  function annualHasTaxPartsOrEstimate(row, year) {
    if (annualHasTaxParts(row)) return true;
    var est = annualTaxEstimateParts(year);
    return !!(est && ANNUAL_TAX_PART_FIELDS.some(function (id) { return est[id] != null; }));
  }

  function annualBlankTaxInputs(row, year) {
    var missing = [];
    // v37.5.59.5: a pay-stub estimate counts as filled — never "fill in Taxes" while Taxes shows an estimate.
    if (annualTaxesAmount(row, year) == null) missing.push("Taxes");
    if (row.opex == null) missing.push("Operating expenses");
    return missing;
  }

  function marginalRateFromBrackets(taxable, brackets) {
    var income = Math.max(0, Number(taxable) || 0);
    var rate = brackets[0][1];
    for (var i = 0; i < brackets.length; i++) {
      rate = brackets[i][1];
      if (income <= brackets[i][0]) break;
    }
    return rate;
  }

  /* v37.5.59.3: pre-tax only from that year's pay-stub basis (401k + HSA + FSA + other pre-tax, capped).
   * Older years never borrow this year's stub — no basis → null (no deduction-based estimate). */
  function annualPretaxKnown(year) {
    var basis = payStubBasisFor(year);
    return basis ? basis.pretax.total : null;
  }

  /* Returns { taxable, wages, pretax, std, source, basis } or null. */
  function annualEstimateTaxableDetail(row, filing, which, year) {
    var std = which === "federal" ? STMT_FED_STD_2026[filing] : STMT_MN_STD_2026[filing];
    var typed = 0;
    var any = false;
    ["salary", "bonus", "sideGig", "other"].forEach(function (id) {
      if (row[id] != null) { any = true; typed += row[id]; }
    });
    var basis = year != null ? payStubBasisFor(year) : null;
    if (basis && basis.hasYtd) {
      // W-2 wages from the stubs (already after pre-tax) + typed side gig / other income.
      var stubWages = which === "federal" ? basis.fedTaxableWages : basis.stateTaxableWages;
      var extra = (Number(row.sideGig) || 0) + (Number(row.other) || 0);
      return {
        taxable: Math.max(0, roundCents(stubWages + extra - std)),
        wages: roundCents(stubWages), extra: roundCents(extra), pretax: basis.pretax.total,
        gross: roundCents(basis.total.earnings), std: std, source: "stubs", basis: basis
      };
    }
    if (!any) return null;
    if (basis) {
      // No YTD on any stub: typed income − pre-tax from the stubs we have (+ projection) − standard deduction.
      return {
        taxable: Math.max(0, roundCents(typed - basis.pretax.total - std)),
        wages: null, gross: roundCents(typed), pretax: basis.pretax.total, std: std, source: "typed+stubs", basis: basis
      };
    }
    return {
      taxable: Math.max(0, roundCents(typed - std)),
      wages: null, gross: roundCents(typed), pretax: null, std: std, source: "typed", basis: null
    };
  }

  function annualEstimateTaxable(row, filing, which, year) {
    var d = annualEstimateTaxableDetail(row, filing, which, year);
    return d ? d.taxable : null;
  }

  function annualEstimateFederalMarginal(row, filing, year) {
    var taxable = annualEstimateTaxable(row, filing, "federal", year);
    if (taxable == null) return null;
    return marginalRateFromBrackets(taxable, STMT_FED_BRACKETS_2026[filing]);
  }

  function annualEstimateStateMarginal(row, filing, year) {
    var taxable = annualEstimateTaxable(row, filing, "state", year);
    if (taxable == null) return null;
    return marginalRateFromBrackets(taxable, STMT_MN_BRACKETS_2026[filing]);
  }

  /* ⓘ sentence: how a year's bracket estimate was built. */
  function annualBracketBasisCopy(row, filing, which, year) {
    var d = annualEstimateTaxableDetail(row, filing, which, year);
    var label = which === "federal" ? "federal" : "Minnesota";
    if (!d) return year + ": add salary to estimate.";
    var rate = marginalRateFromBrackets(d.taxable, which === "federal" ? STMT_FED_BRACKETS_2026[filing] : STMT_MN_BRACKETS_2026[filing]);
    var std = which === "federal" ? "standard deduction " : "MN standard deduction ";
    if (d.source === "stubs") {
      /* v37.5.59.5: plain-words basis. Taxable earnings = gross pay + taxable pay not received in cash (imputed). */
      var gpB = d.basis.grossPay || {};
      var imputed = Math.max(0, roundCents(d.gross - (Number(gpB.total) || 0)));
      var viaEarnings = roundCents(d.gross - d.pretax);
      var wagesNote = Math.abs(viaEarnings - d.wages) >= 1
        ? " (the stub’s own " + label + " taxable-wages column is used for the YTD part, so this differs from earnings − pre-tax by " + annualMoney(Math.abs(roundCents(viaEarnings - d.wages))) + ")"
        : "";
      return year + " " + label + " taxable wages start from your taxable earnings, " + annualMoney(d.gross) + ": gross pay " + annualMoney(gpB.total) +
        (imputed > 0 ? " + " + annualMoney(imputed) + " of taxable pay you don’t get in cash (imputed income such as group-term life insurance over $50k and other taxable perks)" : "") +
        ". Minus pre-tax deductions " + annualMoney(d.pretax) + " (401k " + annualMoney(d.basis.pretax.e401) + ", HSA " + annualMoney(d.basis.pretax.hsa) +
        ", FSA " + annualMoney(d.basis.pretax.fsa) + ", other pre-tax " + annualMoney(d.basis.pretax.otherPre) + ") = " + label + " wages " + annualMoney(d.wages) + wagesNote +
        (d.extra ? " + side gig/other " + annualMoney(d.extra) : "") + ". Minus the " + std + annualMoney(d.std) + " = taxable " + annualMoney(d.taxable) +
        " → " + formatAnnualRateOption(rate) + ". Employer 401k money isn’t in wages. Basis: " + d.basis.short + ". " + d.basis.long;
    }
    if (d.source === "typed+stubs") {
      return year + " basis: typed income " + annualMoney(d.gross) + " − pre-tax " + annualMoney(d.pretax) + " (" + d.basis.short + "; " + d.basis.long + ") − " +
        std + annualMoney(d.std) + " = taxable " + annualMoney(d.taxable) + " → " + formatAnnualRateOption(rate) + ".";
    }
    return year + " basis: typed income " + annualMoney(d.gross) + " − " + std + annualMoney(d.std) + " = taxable " + annualMoney(d.taxable) +
      " → " + formatAnnualRateOption(rate) + ". No pay stub for " + year + ", so no pre-tax deductions are subtracted (this year’s stub is never reused), and it uses the 2026 tables.";
  }

  function annualRateLabel(rate) {
    if (rate == null) return "—";
    return formatAnnualRateOption(rate);
  }

  function formatAnnualRateOption(rate) {
    var pct = Number(rate) * 100;
    if (!isFinite(pct)) return "—";
    if (Math.abs(pct - Math.round(pct)) < 1e-9) return Math.round(pct) + "%";
    var rounded = Math.round(pct * 100) / 100;
    var text = rounded.toFixed(2).replace(/0$/, "").replace(/\.$/, "");
    return text + "%";
  }

  function annualYearList(book) {
    var years = (book && book.years) || {};
    return Object.keys(years).map(Number).filter(function (year) { return year > 0; })
      .sort(function (a, b) { return a - b; });
  }

  function annualHighlightYear(years) {
    var now = currentYearMonth().year;
    if (years.indexOf(now) >= 0) return now;
    return years.length ? years[years.length - 1] : null;
  }

  function annualTotal(row) {
    var any = false;
    var sum = 0;
    ANNUAL_INCOME_FIELDS.forEach(function (id) {
      if (row[id] != null) {
        any = true;
        sum += row[id];
      }
    });
    return any ? roundCents(sum) : null;
  }

  /* Blank taxes or operating expenses stay blank. Do not treat a missing line as $0. */
  function annualOcf(row, total, year) {
    var taxes = annualTaxesAmount(row, year);
    if (total == null || taxes == null || row.opex == null) return null;
    return roundCents(total - taxes - row.opex);
  }

  function annualAvgTax(taxes, total) {
    if (total == null || total === 0 || taxes == null) return null;
    return taxes / total;
  }

  function annualSavings(ocf, total) {
    if (total == null || total === 0 || ocf == null) return null;
    return ocf / total;
  }

  /* v37.5.59.4 (owner): one income basis per year. A year with a confirmed pay stub that carries YTD columns uses
   * the stubs — gross pay = YTD gross + checks since + projected BASE pay for the remaining checks + any bonus
   * whose month is still ahead; employer 401k = match + base contribution (DN401NC), never pay. Typed Salary /
   * Bonus / 401k match are the fallback only when the year has no such stub. Side gig + Other stay typed. */
  function annualIncomeParts(row, year) {
    var basis = year != null ? payStubBasisFor(year) : null;
    var side = row.sideGig, other = row.other;
    if (basis && basis.hasYtd && basis.grossPay && basis.grossPay.total > 0) {
      var gp = basis.grossPay;
      var er = roundCents((basis.total.er401 || 0) + (basis.total.er401Base || 0));
      var extra = (Number(side) || 0) + (Number(other) || 0);
      return {
        source: "stubs", basis: basis,
        grossPay: roundCents(gp.total),
        salary: roundCents(gp.basePay), bonus: gp.bonusTotal > 0 ? roundCents(gp.bonusTotal) : null,
        sideGig: side, other: other,
        match: er > 0 ? er : null, matchOnly: roundCents(basis.total.er401 || 0), matchBase: roundCents(basis.total.er401Base || 0),
        taxedIncome: roundCents(gp.total + extra),
        total: roundCents(gp.total + extra + er)
      };
    }
    row = syncedAnnualRow(row, year);
    var total = annualTotal(row);
    var taxed = null;
    ["salary", "bonus", "sideGig", "other"].forEach(function (id) { if (row[id] != null) taxed = (taxed || 0) + row[id]; });
    return {
      source: "typed", basis: basis || null, grossPay: null,
      salary: row.salary, bonus: row.bonus, sideGig: side, other: other, match: row.match,
      taxedIncome: taxed == null ? null : roundCents(taxed), total: total
    };
  }

  function annualMetrics(row, year) {
    var inc = annualIncomeParts(row, year);
    var total = inc.total;
    var taxes = annualTaxesAmount(row, year);
    var ocf = annualOcf(row, total, year);
    /* Stub years: Taxes ÷ gross pay (+ typed side gig / other) — employer 401k isn't taxed pay.
     * v37.5.59.5 (QA): typed years use the same footing — Salary + Bonus + Side gig + Other, 401k match left out.
     * Falls back to Total income only when none of those pay lines is typed. */
    var avgDen = inc.source === "stubs" ? inc.taxedIncome
      : (inc.taxedIncome != null && inc.taxedIncome > 0 ? inc.taxedIncome : total);
    return {
      total: total,
      taxes: taxes,
      ocf: ocf,
      avgTax: annualAvgTax(taxes, avgDen),
      avgDen: avgDen,
      income: inc,
      savings: annualSavings(ocf, total)
    };
  }

  function annualMoney(n) {
    if (n == null) return "—";
    // v37.5.59.5 (QA): always show cents so a column never mixes $70,959 with $5,700.03.
    return money(n);
  }


  /* v37.5.54: savings rate so far this calendar year, on the income summary.
     Reuses True when a confirmed pay stub can price it, otherwise Basic.
     Months after today are ignored. A month with no paycheck and no savings
     envelopes is ignored. Dollars come only from budgets and the stub — never estimated.
     The yearly column is untouched: it stays blank until taxes and operating expenses are both entered. */
  function ytdSavingsSoFar(year) {
    var today = new Date();
    var calYear = today.getFullYear();
    var calMonth = today.getMonth() + 1;
    if (Number(year) !== calYear) return { applies: false };
    var savings = 0;
    var takeHome = 0;
    var monthCount = 0;
    var firstMonth = 0;
    var lastMonth = 0;
    var ytdMonths = [];
    Object.keys(state.months || {}).forEach(function (key) {
      var rec = state.months[key];
      if (!rec || Number(rec.year) !== calYear) return;
      if (!(Number(rec.month) >= 1) || Number(rec.month) > calMonth) return;
      var planned = (rec.incomes || []).reduce(function (n, item) {
        return n + (Number(item.amount) || 0);
      }, 0);
      var th = gm().monthTakeHome(planned, rec.transactions || [], rec.incomes || [], takeHomeOpts(rec)).amount;
      var env = gm().savingsEnvelopeTotal(rec.categories || []).total;
      if (!(th > 0) && !(env > 0)) return;
      monthCount += 1;
      savings += env;
      takeHome += th;
      ytdMonths.push(Number(rec.month));
      var m = Number(rec.month);
      if (!firstMonth || m < firstMonth) firstMonth = m;
      if (m > lastMonth) lastMonth = m;
    });
    var basic = gm().basicSavingsRate({ savings: savings, takeHome: takeHome });
    var plan = state.compensation || {};
    var trueRate = gm().periodTrueSavingsRate({
      premium: isPremium(),
      snapshot: plan.payStubSnapshot || null,
      paychecksPerYear: plan.paychecksPerYear || checksForFrequency(payFrequencyOf(plan)),
      savings: savings,
      monthCount: monthCount,
      useBasis: useStubBasis(),
      stubMonths: ytdMonths.map(function (mo) { return stubMonthFigures(calYear, mo); }),
      basisShort: stubBasisShort(calYear)
    });
    var kind = "missing";
    var rate = null;
    if (trueRate && trueRate.state === "ok" && trueRate.rate != null) {
      kind = "true";
      rate = trueRate.rate;
    } else if (basic && basic.rate != null) {
      kind = "basic";
      rate = basic.rate;
    }
    return {
      applies: true,
      kind: kind,
      rate: rate,
      monthCount: monthCount,
      firstMonth: firstMonth,
      lastMonth: lastMonth,
      savings: basic ? basic.savings : 0,
      takeHome: basic ? basic.takeHome : 0,
      trueState: trueRate ? trueRate.state : null
    };
  }

  function ytdSavingsSpan(ytd) {
    if (!ytd.firstMonth || !ytd.lastMonth) return "";
    var start = MONTH_NAMES[ytd.firstMonth - 1];
    if (ytd.lastMonth === ytd.firstMonth) return start;
    return start + "–" + MONTH_NAMES[ytd.lastMonth - 1];
  }

  function ytdSavingsNote(ytd) {
    var span = ytdSavingsSpan(ytd);
    var when = span ? " (" + span + ")" : "";
    if (ytd.kind === "true") {
      return "So far this year" + when +
        ". True savings rate: savings envelopes + employee 401k + employer 401k (match + any base contribution) + HSA ÷ gross pay, from this year’s budgets and each month’s own paychecks (" +
        (stubBasisShort(currentYearMonth().year) || "confirmed pay stubs") + "). Not the yearly column.";
    }
    if (ytd.kind === "basic") {
      return "So far this year" + when +
        ". Basic savings rate: savings envelopes ÷ take-home (finished months count what you received — planned only if nothing was logged; the current month counts planned take-home until all its paychecks arrive). 401k, match, and HSA wait for a confirmed pay stub. Not the yearly column.";
    }
    if (ytd.savings > 0 && !(ytd.takeHome > 0)) {
      return "So far this year stays blank until this year’s budget has income to divide by. Nothing is estimated.";
    }
    return "So far this year stays blank until this year’s budget has a paycheck or savings envelopes. Nothing is estimated.";
  }

  function annualRateText(ratio) {
    if (ratio == null) return "—";
    return percent(ratio);
  }

  function annualPriorYear(years, year) {
    var i = years.indexOf(Number(year));
    if (i <= 0) return null;
    return years[i - 1];
  }

  function annualYoYTone(delta) {
    if (!(delta > 0) && !(delta < 0)) return "is-flat";
    return delta > 0 ? "is-up" : "is-down";
  }

  function annualYoYMoneyText(curr, prior) {
    if (curr == null || prior == null) return "";
    var delta = roundCents(curr - prior);
    var body = annualMoney(Math.abs(delta));
    if (delta === 0) return "$0";
    return (delta > 0 ? "+" : "−") + body;
  }

  function annualYoYPtsText(curr, prior) {
    if (curr == null || prior == null) return "";
    var pts = Math.round((curr - prior) * 1000) / 10;
    if (pts === 0) return "0.0 pts";
    var abs = Math.abs(pts).toFixed(1);
    return (pts > 0 ? "+" : "−") + abs + " pts";
  }

  function annualYoYHtml(kind, curr, prior) {
    var text = kind === "ocf" ? annualYoYMoneyText(curr, prior) : annualYoYPtsText(curr, prior);
    if (!text) return "";
    var delta = kind === "ocf" ? roundCents(curr - prior) : Math.round((curr - prior) * 1000) / 10;
    return '<span class="annual-yoy ' + annualYoYTone(delta) + '">' + esc(text) + "</span>";
  }

  function annualYoYPopoverNote(kind, year, years, book) {
    var prior = annualPriorYear(years, year);
    if (prior == null) return "";
    var currM = annualMetrics(annualRow(book.years[String(year)]), year);
    var priorM = annualMetrics(annualRow(book.years[String(prior)]), prior);
    var text = "";
    if (kind === "ocf") text = annualYoYMoneyText(currM.ocf, priorM.ocf);
    else if (kind === "savings") text = annualYoYPtsText(currM.savings, priorM.savings);
    if (!text) return "";
    return year + " vs " + prior + ": " + text + ".";
  }

  function annualInfoButton(key, label) {
    return '<button class="annual-info" type="button" data-act="annual-info" data-key="' +
      esc(key) + '" aria-label="About ' + esc(label) + '">i</button>';
  }

  /* v37.5.59.6 (QA): only call the parts that were typed "typed" — "$24,098.64 (State $3,000.00 typed, rest estimated)". */
  function annualTaxTypedNote(row, taxes) {
    if (row.taxes != null) return annualMoney(taxes) + " (typed)";
    var typedIds = ANNUAL_TAX_PART_FIELDS.filter(function (id) { return row[id] != null; });
    if (!typedIds.length) return annualMoney(taxes);
    var parts = typedIds.map(function (id) { return ANNUAL_TAX_PART_LABELS[id] + " " + annualMoney(row[id]); }).join(" + ");
    if (typedIds.length === ANNUAL_TAX_PART_FIELDS.length) return annualMoney(taxes) + " (all lines typed)";
    return annualMoney(taxes) + " (" + parts + " typed, rest estimated from pay stubs)";
  }

  function annualInfoCopy(key, year, row, metrics) {
    var y = year;
    var total = metrics.total;
    var taxes = metrics.taxes;
    var opex = row.opex;
    var ocf = metrics.ocf;
    var missing = annualBlankTaxInputs(row, Number(y));
    if (key === "opex") {
      return "Operating expenses are what you spent to live that year — everything except taxes and investments. Typed in on each year (not pulled from Budget). Investments are a record only and do not change operating cash flow.";
    }
    if (key === "ocf") {
      var line = "Operating cash flow = Total income − Taxes − Operating expenses.";
      if (total == null) return line + " Fill in income lines for " + y + " first.";
      if (taxes == null || opex == null) {
        return line + " " + y + ": fill in " + missing.join(" and ") + " to see the number.";
      }
      return line + " " + y + ": " + annualMoney(total) + " − " + annualMoney(taxes) +
        " − " + annualMoney(opex) + " = " + annualMoney(ocf) + ".";
    }
    if (key === "avgTax") {
      var inc = metrics.income || annualIncomeParts(row, Number(y));
      if (inc.source === "stubs") {
        var ab = inc.basis, gp = ab.grossPay;
        var stubTaxes = !annualHasTaxParts(row) && row.taxes == null;
        var extraInc = (Number(row.sideGig) || 0) + (Number(row.other) || 0);
        var denText = "(YTD gross " + annualMoney(gp.ytdStub) + (gp.afterYtd ? " + checks since " + annualMoney(gp.afterYtd) : "") +
          " + projected base pay " + annualMoney(gp.projectedBase) + (gp.projectedBonus ? " + projected bonus " + annualMoney(gp.projectedBonus) : "") +
          (extraInc ? " + side gig/other " + annualMoney(extraInc) : "") + ")";
        var numText = stubTaxes
          ? "(actual withheld " + annualMoney(ab.taxesActual) + " + projected " + annualMoney(ab.taxesProjected) + ")"
          : annualTaxTypedNote(row, taxes);
        if (taxes == null) return "Average tax = Taxes ÷ gross pay. " + y + ": fill in Taxes to see the rate.";
        return "Average tax = Taxes ÷ gross pay — the same actual-plus-projected basis as the deductions. " + y + ": " + numText + " ÷ " + denText +
          " = " + annualMoney(taxes) + " ÷ " + annualMoney(metrics.avgDen) + " = " + annualRateText(metrics.avgTax) + ". Basis: " + ab.short + ". " +
          (ab.bonus && ab.bonus.note ? ab.bonus.note + " " : "") + "Employer 401k (match + base) isn’t pay, so it’s left out.";
      }
      var payDen = metrics.income && metrics.income.taxedIncome != null && metrics.income.taxedIncome > 0;
      var avgLine = payDen
        ? "Average tax = Taxes ÷ gross pay (Salary + Bonus + Side gig + Other). Employer 401k match isn’t pay, so it’s left out — same footing as years priced from pay stubs."
        : "Average tax = Taxes ÷ Total income (no Salary/Bonus/Side gig/Other typed for this year, so the total is used).";
      if (total == null || total === 0) return avgLine + " Fill in income for " + y + " first.";
      if (taxes == null) return avgLine + " " + y + ": type Taxes in Edit year to see the rate.";
      var avgBasis = (!annualHasTaxParts(row) && row.taxes == null && payStubBasisFor(Number(y)))
        ? " Taxes are pay-stub withholding — " + payStubBasisFor(Number(y)).short + "." : "";
      var typedNote = payStubBasisFor(Number(y)) && !payStubBasisFor(Number(y)).hasYtd
        ? " Income is what you typed — no " + y + " stub has YTD columns yet." : "";
      return avgLine + " " + y + ": " + annualMoney(taxes) + " ÷ " + annualMoney(payDen ? metrics.avgDen : total) +
        " = " + annualRateText(metrics.avgTax) + "." + avgBasis + typedNote;
    }
    if (key === "total") {
      var ti = metrics.income || annualIncomeParts(row, Number(y));
      if (ti.source !== "stubs") return "Total income = Salary + Bonus + Side gig + Other + 401k match, as typed for " + y + "." +
        (ti.basis && !ti.basis.hasYtd ? " Your " + y + " stubs have no YTD columns, so typed income is used." : "");
      var tb2 = ti.basis, g2 = tb2.grossPay;
      return "Total income " + y + " comes from your pay stubs, not the typed salary: gross pay " + annualMoney(g2.total) +
        " (YTD gross " + annualMoney(g2.ytdStub) + (g2.afterYtd ? " + checks since " + annualMoney(g2.afterYtd) : "") +
        " + projected base pay " + annualMoney(g2.projectedBase) + (g2.projectedBonus ? " + projected bonus " + annualMoney(g2.projectedBonus) : "") +
        "; shown as Salary " + annualMoney(ti.salary) + (ti.bonus ? " + Bonus/variable " + annualMoney(ti.bonus) : "") + ")" +
        (ti.match ? " + employer 401k " + annualMoney(ti.match) + " (match " + annualMoney(ti.matchOnly) + (ti.matchBase ? " + base contribution " + annualMoney(ti.matchBase) : "") + ")" : "") +
        ((Number(row.sideGig) || 0) + (Number(row.other) || 0) ? " + side gig/other " + annualMoney((Number(row.sideGig) || 0) + (Number(row.other) || 0)) : "") +
        " = " + annualMoney(ti.total) + ". Basis: " + tb2.short + ". " + (tb2.bonus && tb2.bonus.note ? tb2.bonus.note + " " : "") +
        "Typed salary is used only when a year has no stub with YTD.";
    }
    if (key === "savings") {
      var savLine = "Savings rate = Operating cash flow ÷ Total income.";
      if (total == null || total === 0) return savLine + " Fill in income for " + y + " first.";
      if (ocf == null) {
        return savLine + " " + y + ": fill in " + (missing.length ? missing.join(" and ") : "Taxes and Operating expenses") +
          " so operating cash flow can calculate.";
      }
      return savLine + " " + y + ": " + annualMoney(ocf) + " ÷ " + annualMoney(total) +
        " = " + annualRateText(metrics.savings) + ".";
    }
    var filingNow = annualFilingStatus(ensureAnnualStatement());
    if (key === "fedBracket") {
      return "Federal marginal bracket is a reference-only label for the rate on your next dollar of taxable income — not your average tax, and picking it never changes Taxes. Estimate uses 2026 IRS brackets (Rev. Proc. 2025-32). " +
        annualBracketBasisCopy(row, filingNow, "federal", Number(y)) + " Your pick only stores the label.";
    }
    if (key === "stateBracket") {
      return "State marginal bracket is a reference-only label for the rate on your next dollar of Minnesota taxable income — not your average, and picking it never changes Taxes. Estimate uses 2026 MN Department of Revenue brackets and standard deduction. " +
        annualBracketBasisCopy(row, filingNow, "state", Number(y)) + " Choose Other to type a percent. Your pick only stores the label.";
    }
    if (key === "taxes") {
      var tLine = "Taxes = federal + state income tax + FICA (Social Security + Medicare) + other employee taxes.";
      if (annualHasTaxParts(row)) {
        var tbMix = payStubBasisFor(Number(y));
        var typedIds = ANNUAL_TAX_PART_FIELDS.filter(function (id) { return row[id] != null; });
        return tLine + " " + y + ": " + typedIds.map(function (id) { return ANNUAL_TAX_PART_LABELS[id] + " " + annualMoney(row[id]) + " (typed)"; }).join(", ") +
          (tbMix && typedIds.length < ANNUAL_TAX_PART_FIELDS.length ? "; the other lines are your pay-stub estimate (" + tbMix.short + ")" : "") +
          " = " + annualMoney(taxes) + ".";
      }
      if (row.taxes != null) return tLine + " " + y + ": typed in.";
      var tb = payStubBasisFor(Number(y));
      if (!tb) return tLine + " " + y + ": type it in, or confirm a " + y + " pay stub to estimate it.";
      return tLine + " " + y + " (est.) is what your pay stubs withhold — " + tb.short + ". " + tb.long +
        " Federal " + annualMoney(tb.taxes.fed) + " + State " + annualMoney(tb.taxes.state) + " + FICA " + annualMoney(tb.taxes.fica) +
        (tb.taxes.otherTax > 0 ? " + Other " + annualMoney(tb.taxes.otherTax) + " (MN paid leave etc.)" : "") + " = " + annualMoney(tb.taxes.total) +
        ". Withholding, not your final tax bill.";
    }
    return "";
  }

  function annualInfoExampleYear(book, years, highlight, key) {
    var preferred = annualInfoTip && annualInfoTip.year != null ? Number(annualInfoTip.year) : highlight;
    // v37.5.59.6 (QA): a year picked in the popover is explained as-is, even if it's incomplete.
    if (annualInfoTip && annualInfoTip.pinned && years.indexOf(preferred) >= 0) return preferred;
    function usable(year) {
      var row = annualRow(book.years[String(year)]);
      var metrics = annualMetrics(row, year);
      if (key === "ocf" || key === "savings") return metrics.ocf != null;
      if (key === "avgTax") return metrics.avgTax != null;
      if (key === "opex") return true;
      return true;
    }
    if (years.indexOf(preferred) >= 0 && usable(preferred)) return preferred;
    var i;
    for (i = years.length - 1; i >= 0; i--) {
      if (usable(years[i])) return years[i];
    }
    return preferred;
  }

  function annualInfoPopoverHtml(book, years, highlight) {
    if (!annualInfoTip || !annualInfoTip.key) return "";
    var key = annualInfoTip.key;
    var year = annualInfoExampleYear(book, years, highlight, key);
    if (years.indexOf(year) < 0) year = highlight;
    var row = annualRow(book.years[String(year)]);
    var metrics = annualMetrics(row, year);
    var titleMap = {
      opex: "Operating expenses",
      ocf: "Operating cash flow",
      avgTax: "Average tax",
      total: "Total income",
      savings: "Savings rate",
      fedBracket: "Federal marginal bracket",
      stateBracket: "State marginal bracket",
      taxes: "Taxes"
    };
    var copy = annualInfoCopy(key, year, row, metrics);
    if (key === "ocf" || key === "savings") {
      var yoyNote = annualYoYPopoverNote(key, year, years, book);
      if (yoyNote) copy += " " + yoyNote;
    }
    var why = "";
    if (key === "ocf") {
      why = '<p class="annual-info-why">Why it matters: this is the cash you had left after taxes and living costs, the money you\'d have sitting in the bank if you didn\'t invest any of it. It\'s what fuels your saving and investing, so growing it year over year is how you build wealth faster.</p>';
    }
    var yearPills = years.length > 1
      ? '<div class="annual-info-years" role="group" aria-label="Explain year">' + years.map(function (yy) {
        return '<button type="button" class="annual-info-year' + (yy === year ? " is-on" : "") + '" data-act="annual-info-year" data-year="' +
          esc(String(yy)) + '" aria-pressed="' + (yy === year ? "true" : "false") + '">' + esc(String(yy)) + "</button>";
      }).join("") + "</div>"
      : "";
    var topStyle = annualInfoTip.anchorTop != null ? (' style="top:' + Math.round(annualInfoTip.anchorTop) + 'px"') : "";
    return '<div class="annual-info-pop" role="dialog"' + topStyle + ' aria-label="' + esc(titleMap[key] || "About") + '">' +
      '<div class="annual-info-pop-head"><strong>' + esc(titleMap[key] || "About") + "</strong>" +
      '<button class="annual-info-x" type="button" data-act="annual-info-close" aria-label="Close">×</button></div>' +
      yearPills + "<p>" + esc(copy) + "</p>" + why + "</div>";
  }

  function annualLabelCell(spec) {
    var tipKeys = { opex: 1, ocf: 1, avgTax: 1, savings: 1, fedBracket: 1, stateBracket: 1, taxes: 1, total: 1 };
    var html = '<th class="annual-label" scope="row">';
    if (spec.id === "taxes") {
      html += '<button class="annual-tax-toggle" type="button" data-act="toggle-annual-taxes" aria-expanded="' +
        (annualTaxesOpen ? "true" : "false") + '">' +
        '<span class="stmt-chev' + (annualTaxesOpen ? " is-open" : "") + '" aria-hidden="true"></span>' +
        esc(spec.label) + "</button>";
    } else {
      html += '<span class="annual-label-text">' + esc(spec.label) + "</span>";
    }
    if (tipKeys[spec.id]) html += annualInfoButton(spec.id, spec.label);
    html += "</th>";
    return html;
  }

  function annualSelectHtml(name, year, value, options, act) {
    var html = '<select class="annual-pick" data-act="' + act + '" data-year="' + year + '" data-field="' +
      esc(name) + '" aria-label="' + esc(name) + " " + year + '">';
    options.forEach(function (opt) {
      var selected = (value == null && opt.value === "") ||
        (value != null && String(value) === String(opt.value));
      html += '<option value="' + esc(opt.value) + '"' + (selected ? " selected" : "") + ">" +
        esc(opt.label) + "</option>";
    });
    html += "</select>";
    return html;
  }

  /* v37.5.59.3: HSA coverage (sets the HSA cap) + which pay-stub basis the estimates use. */
  /* Small captions under the income summary: year-end target label, synced lines, notes. */
  function annualSyncNoteHtml(year) {
    var t = incomeTargetFor(year);
    var html = "";
    var basis = payStubBasisFor(year);
    if (t.salaryTarget) {
      html += '<p class="caption quiet annual-target-label"><span class="annual-target-chip">year-end target</span> ' +
        esc("Salary " + moneyWhole(t.salaryTarget)) +
        (basis && basis.salaryTarget ? " — " + esc(basis.salaryTarget.note) : " — typed salary uses the target; remaining pay is spread once pay stubs are confirmed.") + "</p>";
    }
    var sync = compSyncValues(year);
    if (t.salaryTarget) delete sync.salary;
    var ids = Object.keys(sync);
    if (ids.length) {
      html += '<p class="caption quiet annual-sync-note">' + esc("Synced from Compensation: " + ids.map(function (id) {
        return SYNC_LINES.filter(function (l) { return l.id === id; })[0].label + " " + moneyWhole(sync[id]);
      }).join(", ") + ". Turn this off in Compensation (“Don’t sync from Compensation”). Nothing you typed is changed.") + "</p>";
    }
    NOTE_LINES.forEach(function (l) {
      if (t.notes[l.id]) html += '<p class="caption quiet annual-line-note"><strong>' + esc(l.label) + ":</strong> " + esc(t.notes[l.id]) + "</p>";
    });
    return html;
  }

  function annualStubBasisHtml(year) {
    var basis = payStubBasisFor(year);
    if (!basis) return "";
    var cov = hsaCoverageOf();
    var html = "";
    if (basis.total.hsa > 0 || basis.total.erHsa > 0) {
      html += '<label class="field annual-hsa-coverage">HSA coverage' +
        '<select data-act="annual-hsa-coverage">' +
        '<option value="self"' + (cov === "self" ? " selected" : "") + ">Self-only (" + moneyWhole(gm().pretaxLimitsFor(year, { hsaCoverage: "self" }) ? gm().pretaxLimitsFor(year, { hsaCoverage: "self" }).hsa : 0) + " limit)</option>" +
        '<option value="family"' + (cov === "family" ? " selected" : "") + ">Family (" + moneyWhole(gm().pretaxLimitsFor(year, { hsaCoverage: "family" }) ? gm().pretaxLimitsFor(year, { hsaCoverage: "family" }).hsa : 0) + " limit)</option>" +
        "</select></label>";
    }
    var bm = bonusMonthOf();
    html += '<label class="field annual-bonus-month">Bonus pays in' +
      '<select data-act="annual-bonus-month"><option value=""' + (bm ? "" : " selected") + ">Not set</option>";
    MONTH_NAMES.forEach(function (name, i) {
      html += '<option value="' + (i + 1) + '"' + (bm === i + 1 ? " selected" : "") + ">" + esc(name) + "</option>";
    });
    html += "</select></label>";
    html += '<p class="caption quiet annual-stub-basis">' + esc(year + (basis.hasYtd ? " income, taxes, average tax and brackets: " : " taxes and brackets: ") + basis.short +
      (basis.hasYtd ? " — gross pay " + money(basis.grossPay.total) : "") +
      ", pre-tax " + moneyWhole(basis.pretax.total) + " (capped at 2026 IRS limits)." +
      (basis.bonus && basis.bonus.status === "projected" ? " Includes a projected bonus of " + moneyWhole(basis.bonus.projected) + "." :
        basis.bonus && basis.bonus.status === "paid" ? " Bonus already paid — nothing more projected." : "") +
      " Tap ⓘ for the math.") + "</p>";
    return html;
  }

  /* v37.5.59.12 (QA M2): stub years keep their Income statement column without needing “Add YYYY”. */
  function ensureStubYearsOnStatement(book) {
    book = book || ensureAnnualStatement();
    var touched = false;
    function ensureYear(y) {
      if (!(y >= 2000 && y <= 2100) || book.years[String(y)]) return;
      book.years[String(y)] = {
        salary: null, bonus: null, sideGig: null, other: null, match: null,
        taxes: null, opex: null, investments: null,
        taxFederal: null, taxState: null, taxFica: null, taxOther: null,
        federalBracket: null, stateBracket: null, stateOtherPct: null
      };
      touched = true;
    }
    confirmedPayStubs().forEach(function (stub) {
      ensureYear(stub && stub.payDate ? Number(String(stub.payDate).slice(0, 4)) : 0);
    });
    var now = currentYearMonth().year;
    for (var y = now - 2; y <= now; y++) {
      var basis = null;
      try { basis = payStubBasisFor(y); } catch (err) { basis = null; }
      if (basis && basis.hasYtd && basis.grossPay && basis.grossPay.total > 0) ensureYear(y);
    }
    return touched;
  }

  function renderAnnualStatement() {
    var book = ensureAnnualStatement();
    var nowYear = currentYearMonth().year;
    var stubTouched = ensureStubYearsOnStatement(book);
    /* v37.5.57: do not invent a year column on an empty statement. */
    if (annualStatementHasYears(book) && !book.years[String(nowYear)]) {
      ensureAnnualYearFromPrior(book, nowYear);
    }
    if (stubTouched) {
      try { saveState(); } catch (err) {}
    }
    var years = annualYearList(book);
    var highlight = annualHighlightYear(years);
    var filing = annualFilingStatus(book);
    var rows = [
      { id: "total", label: "Total income", kind: "total" },
      { id: "salary", label: "Salary", kind: "input" },
      { id: "bonus", label: "Bonus", kind: "input" },
      { id: "sideGig", label: "Side gig", kind: "input" },
      { id: "other", label: "Other", kind: "input" },
      { id: "match", label: "401k match", kind: "input" },
      { id: "taxes", label: "Taxes", kind: "input" },
      { id: "opex", label: "Op. expenses", kind: "input" },
      { id: "investments", label: "Investments", kind: "input" },
      { id: "ocf", label: "Op. cash flow", kind: "flow" },
      { id: "avgTax", label: "Average tax", kind: "rate" },
      { id: "savings", label: "Savings rate", kind: "rate" },
      { id: "fedBracket", label: "Federal marginal", kind: "bracket" },
      { id: "stateBracket", label: "State marginal", kind: "bracket" }
    ];
    var html = '<div class="stmt-pass annual-pass">' + statsSegmentHtml("statement");
    if (!years.length) {
      return html +
        '<div class="annual-empty">' +
        '<p class="empty">No years on your income statement yet.</p>' +
        '<p class="caption">Add a year to start tracking salary, taxes, and savings rate. Nothing is filled in for you.</p>' +
        '<button class="primary" type="button" data-act="add-annual-year">Add ' + currentYearMonth().year + "</button>" +
        "</div></div>";
    }
    /* v37.5.53: same opening as net worth — year, enlarged income total, then the yearly columns.
       Salary and savings rate sit in that summary. Income is annualTotal, which already includes 401k match once. */
    var summaryRow = syncedAnnualRow(annualRow(book.years[String(highlight)]), highlight);
    var summary = annualMetrics(summaryRow, highlight);
    html += '<p class="stmt-year stmt-year-quiet">' + highlight + "</p>" +
      '<div class="sheet-table stmt-sheet">' +
      '<div class="stmt-line is-total is-underlined"><span class="stmt-label">Income</span>' +
      '<span class="mono stmt-amt">' + annualMoney(summary.total) + "</span></div>" +
      '<div class="stmt-line"><span class="stmt-label">Salary</span>' +
      '<span class="mono stmt-amt">' + annualMoney(summary.income && summary.income.source === "stubs" ? summary.income.salary : summaryRow.salary) + "</span></div>" +
      '<div class="stmt-line"><span class="stmt-label">Savings rate</span>' +
      '<span class="mono stmt-amt' + (summary.savings == null ? " is-empty" : "") + '">' +
      annualRateText(summary.savings) + "</span></div>";
    var ytd = ytdSavingsSoFar(highlight);
    if (ytd.applies) {
      html += '<div class="stmt-line is-ytd"><span class="stmt-label">Savings rate so far this year</span>' +
        '<span class="mono stmt-amt' + (ytd.rate == null ? " is-empty" : "") + '">' +
        annualRateText(ytd.rate) + "</span></div>" +
        '<p class="caption quiet ytd-rate-note">' + esc(ytdSavingsNote(ytd)) + "</p>";
    }
    html += "</div>" +
      '<label class="field annual-filing">Filing status' +
      '<select data-act="annual-filing">' +
      '<option value="single"' + (filing === "single" ? " selected" : "") + ">Single</option>" +
      '<option value="mfj"' + (filing === "mfj" ? " selected" : "") + ">Married filing jointly</option>" +
      '<option value="hoh"' + (filing === "hoh" ? " selected" : "") + ">Head of household</option>" +
      "</select></label>" +
      annualStubBasisHtml(highlight) +
      annualSyncNoteHtml(highlight) +
      '<p class="caption quiet annual-filing-hint">Used for marginal bracket estimates (2026 IRS / MN tables).</p>' +
      '<div class="annual-scroll"><table class="annual-table"><thead><tr>' +
      '<th class="annual-label" scope="row"></th>';
    years.forEach(function (year) {
      var on = year === highlight ? " is-current" : "";
      html += '<th class="' + on.trim() + '" scope="col"><button class="annual-year' + on +
        '" type="button" data-act="edit-annual-year" data-year="' + year +
        '" aria-label="Edit ' + year + '">' + year + "</button></th>";
    });
    html += "</tr></thead><tbody>";
    rows.forEach(function (spec) {
      html += '<tr class="' +
        (spec.kind === "total" ? "is-total" : spec.kind === "flow" ? "is-flow" : spec.kind === "bracket" ? "is-bracket" : "") +
        '">' + annualLabelCell(spec);
      years.forEach(function (year) {
        var row = syncedAnnualRow(annualRow(book.years[String(year)]), year);
        var metrics = annualMetrics(row, year);
        var value = null;
        var text = "—";
        var figure = spec.kind === "flow" || spec.kind === "rate" || spec.kind === "total";
        var cellHtml = "";
        if (spec.id === "total") {
          value = metrics.total;
          text = annualMoney(value);
        } else if (spec.id === "taxes") {
          value = metrics.taxes;
          text = annualMoney(value);
          figure = annualHasTaxPartsOrEstimate(row, year);
          if (!annualHasTaxParts(row) && annualTaxEstimateParts(year) && value != null) {
            text += '<span class="annual-est-hint">est.</span>';
          }
        } else if (spec.id === "ocf") {
          value = metrics.ocf;
          text = annualMoney(value);
          var priorOcfYear = annualPriorYear(years, year);
          if (priorOcfYear != null) {
            text += annualYoYHtml("ocf", value,
              annualMetrics(annualRow(book.years[String(priorOcfYear)]), priorOcfYear).ocf);
          }
        } else if (spec.id === "avgTax") {
          value = metrics.avgTax;
          text = annualRateText(value);
        } else if (spec.id === "savings") {
          value = metrics.savings;
          text = annualRateText(value);
          var priorSavYear = annualPriorYear(years, year);
          if (priorSavYear != null) {
            text += annualYoYHtml("savings", value,
              annualMetrics(annualRow(book.years[String(priorSavYear)]), priorSavYear).savings);
          }
        } else if (spec.id === "fedBracket") {
          var fedEst = annualEstimateFederalMarginal(row, filing, year);
          var fedPick = row.federalBracket;
          /* Closed cell shows the rate (e.g. 22%); full list still in the picker. */
          var fedOpts = [{
            value: "",
            label: fedEst == null ? "—" : formatAnnualRateOption(fedEst) // v37.5.59.2: rate only so it never clips; "est." hint sits under it
          }];
          STMT_FED_RATE_OPTIONS.forEach(function (r) {
            if (fedEst != null && Math.abs(r - fedEst) < 1e-9) return;
            fedOpts.push({ value: String(r), label: formatAnnualRateOption(r) });
          });
          cellHtml = annualSelectHtml("federalBracket", year, fedPick == null ? "" : String(fedPick), fedOpts, "annual-bracket");
          if (fedPick == null && fedEst != null) {
            cellHtml += '<span class="annual-est-hint">est.</span>';
          }
          value = fedPick != null ? fedPick : fedEst;
        } else if (spec.id === "stateBracket") {
          var stEst = annualEstimateStateMarginal(row, filing, year);
          var stPick = row.stateBracket;
          var stOpts = [{
            value: "",
            label: stEst == null ? "—" : formatAnnualRateOption(stEst) // v37.5.59.2: rate only so it never clips; "est." hint sits under it
          }];
          STMT_MN_RATE_OPTIONS.forEach(function (r) {
            if (stEst != null && Math.abs(r - stEst) < 1e-9) return;
            stOpts.push({ value: String(r), label: formatAnnualRateOption(r) });
          });
          stOpts.push({ value: "other", label: "Other…" });
          var stVal = stPick == null ? "" : String(stPick);
          cellHtml = annualSelectHtml("stateBracket", year, stVal, stOpts, "annual-bracket");
          if (stPick === "other") {
            var otherPct = row.stateOtherPct;
            var shownPct = otherPct == null ? "" : String(Math.round(otherPct * 10000) / 100);
            cellHtml += '<input class="annual-other-pct" data-act="annual-state-other" data-year="' + year +
              '" inputmode="decimal" type="text" placeholder="%" aria-label="Other state percent ' + year +
              '" value="' + esc(shownPct) + '">';
            value = otherPct;
          } else {
            value = stPick != null ? stPick : stEst;
            if (stPick == null && stEst != null) cellHtml += '<span class="annual-est-hint">est.</span>';
          }
        } else if ((spec.id === "salary" || spec.id === "bonus" || spec.id === "match") && metrics.income && metrics.income.source === "stubs") {
          // v37.5.59.4: stub year — salary / bonus / employer 401k from the pay-stub basis; typed values are the fallback.
          value = metrics.income[spec.id];
          text = annualMoney(value) + (value != null ? '<span class="annual-est-hint">stubs</span>' : "");
          figure = false;
        } else {
          value = row[spec.id];
          text = annualMoney(value);
          figure = false;
        }
        if (!cellHtml) {
          var cls = value == null ? "is-empty" : (figure && value < 0 ? "is-neg" : (figure && spec.kind !== "total" ? "is-figure" : ""));
          cellHtml = text;
          html += '<td class="' + cls + '">' + cellHtml + "</td>";
        } else {
          html += '<td class="is-pick' + (value == null ? " is-empty" : " is-figure") + '">' + cellHtml + "</td>";
        }
      });
      html += "</tr>";
      if (spec.id === "taxes" && annualTaxesOpen) {
        ANNUAL_TAX_PART_FIELDS.forEach(function (partId) {
          html += '<tr class="is-tax-child"><th class="annual-label" scope="row"><span class="annual-label-text is-child">' +
            esc(ANNUAL_TAX_PART_LABELS[partId]) + "</span></th>";
          years.forEach(function (year) {
            var partRow = annualRow(book.years[String(year)]);
            var shown = annualTaxPartDisplay(partRow, partId, year);
            html += '<td class="' + (shown.value == null ? "is-empty" : "") + '">' + annualMoney(shown.value) +
              (shown.estimate ? '<span class="annual-est-hint">est.</span>' : "") + "</td>";
          });
          html += "</tr>";
        });
      }
    });
    html += "</tbody></table></div>" +
      annualInfoPopoverHtml(book, years, highlight) +
      '<p class="caption quiet annual-hint">Tap a year to edit. Older years sit off to the left. Taxes can expand into federal, state, FICA, and other.</p>' +
      // v37.5.59.6 (QA): Compensation was reachable only from a confirmed Vault stub card.
      '<div class="annual-comp-link"><button class="matters-btn" type="button" data-act="open-income-statement">Open Compensation</button>' +
      '<p class="caption quiet">' + (compStubFigures() ? "Your pay-stub breakdown plus a what-if calculator." : "Type salary, deductions and ZIP to estimate take-home and taxes.") + "</p></div></div>";
    return html;
  }

  /* Full replacement, same shape as renderWorthDetails: segment, back arrow, then details only. */
  function renderStatementDetails(month, totals) {
    var previousMonth = statementPreviousMonth(month);
    var year = selectedIncomeYear();
    var takeHome = estimateCompensation(state.compensation).takeHome;
    var html =
      statsSegmentHtml("statement") +
      '<div class="nav-row worth-details-nav">' +
      '<button class="icon-btn worth-back" type="button" data-act="statement-back" aria-label="Back to statement">' +
      '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6 L9 12 L15 18"></path></svg></button>' +
      "<h2>Details</h2></div>" +
      '<header class="stmt-header stmt-hero-center">' +
      '<p class="stmt-year">' + (year || "") + "</p>" +
      '<p class="stmt-hero-label">Net</p>' +
      '<p class="stmt-hero-amount">' + money(takeHome) + "</p></header>" +
      renderCompensation() +
      renderYearlyIncome() +
      '<section class="card"><p class="kicker">Plan</p><p class="caption">Share of income</p>' +
      pieSvg(planSlices(month, totals.income), "Add income, then assign envelopes to see the plan.", "label") +
      "</section>" +
      '<p class="section-label">Month</p>' +
      '<div class="sheet-table">' +
      '<div class="row dense"><div>Take-home planned<span class="caption">Paychecks on this month’s budget · after tax</span></div>' +
      '<span class="mono">' + money(totals.income) + "</span></div>" +
      '<div class="row dense"><div>Take-home received<span class="caption">Actual · paychecks logged as Income transactions</span></div>' +
      '<span class="mono moss">' + money(totals.received) + "</span></div>" +
      '<div class="row dense"><div>Planned spend<span class="caption">This month’s planned spending</span></div>' +
      '<span class="mono">' + money(totals.assigned) + "</span></div>" +
      '<div class="row dense"><div>Left to assign<span class="caption">Take-home planned − assigned</span></div>' +
      '<span class="mono ' + tone(totals.leftover) + '">' + money(totals.leftover) + "</span></div></div>" +
      '<p class="section-label">Envelopes</p>' +
      '<div class="sheet-table">' +
      '<div class="stmt-cols"><span>Envelope</span><span style="text-align:right">Planned</span>' +
      '<span style="text-align:right">Actual last month</span><span style="text-align:right">Versus last month</span></div>';
    var lastMonthActual = 0;
    month.categories.slice().sort(function (a, b) { return a.sortOrder - b.sortOrder; }).forEach(function (cat) {
      var assigned = catAssigned(cat);
      var spent = statementLastMonthSpent(month, previousMonth, cat);
      var left = assigned - spent;
      lastMonthActual += spent;
      html += '<button class="stmt-row row-btn dense" type="button" data-act="open-envelope" data-id="' + cat.id + '">' +
        '<span class="name">' + esc(cat.name) + "</span>" +
        "<span>" + money(assigned) + "</span><span>" + money(spent) + "</span>" +
        '<span class="' + tone(left) + '">' + money(left) + "</span></button>";
    });
    html += "</div>";
    html +=
      '<div class="row"><span>Last month’s actual</span><span class="mono">' + money(lastMonthActual) + "</span></div>" +
      '<div class="row"><span>Versus last month</span><span class="mono ' + tone(totals.assigned - lastMonthActual) + '">' +
      money(totals.assigned - lastMonthActual) + "</span></div>";
    return html;
  }

  function renderYearlyIncome() {
    migrateWorthIncome(state.worth);
    var years = incomeYearList().slice().sort(function (a, b) { return b - a; });
    var shown = recentYears(years, state.incomeYearsExpanded);
    var headline = annualizedIncomeGrowth(state.worth.income);
    var html = '<p class="section-label">Annualized Income Growth Rate' +
      (headline == null ? "" : ' <span class="growth-rate ' + tone(headline) + '">' + percent(headline) + "</span>") +
      "</p>";
    if (!years.length) {
      html += '<p class="empty">No yearly income yet. Add a year on Net Worth, then edit it here.</p>';
      return html;
    }
    shown.forEach(function (year) {
      var note = ((state.worth.notes || {})[year] || "").replace(/^\s+|\s+$/g, "");
      var prior = state.worth.income[year - 1];
      var currentIncome = Number(state.worth.income[year]) || 0;
      var growth = (prior == null || currentIncome === 0) ? null : incomeGrowth(currentIncome, prior);
      html += '<button class="row-btn year-income-row dense" type="button" data-act="open-year-income" data-year="' + year + '">' +
        '<div class="row"><div><div class="name">' + year + "</div>" +
        (note ? '<span class="caption">' + esc(note) + "</span>" : '<span class="caption">Tap to add notes</span>') +
        "</div><span class='mono'>" + money(state.worth.income[year] || 0) +
        (growth == null ? "" : '<span class="caption ' + tone(growth) + '">' + percent(growth) + "</span>") +
        "</span></div></button>";
    });
    html += historyToggleHtml("toggle-income-years", !!state.incomeYearsExpanded, years.length);
    html += headline == null
      ? '<p class="caption">Tap a year to edit income and notes. Same figures as Net Worth. Empty years stay blank.</p>'
      : '<p class="caption">Annualized ' + percent(headline) +
        " since the first year with income. Each year shows growth versus the prior year. Empty years stay blank.</p>";
    return html;
  }

  function renderWorthSummary(current) {
    return '<p class="section-label">Summary</p><div class="planner">' +
      '<div class="row"><span>Net Worth</span><span class="mono">' + money(current.equity) + "</span></div>" +
      '<div class="row"><span>Assets</span><span class="mono">' + money(current.assets) + "</span></div>" +
      '<div class="row"><span>Liabilities</span><span class="mono">' + money(current.liabilities) + "</span></div>" +
      '<button class="planner-apply" type="button" data-act="worth-details">View net worth statement</button>' +
      '<p class="caption">Totals for the selected year. Details opens the full year column.</p></div>';
  }

  function renderWorthYearList(years) {
    var desc = years.slice().sort(function (a, b) { return b - a; });
    var shown = recentYears(desc, state.worthYearsExpanded);
    var html = '<p class="section-label">Years</p>';
    shown.forEach(function (year) {
      var equity = worthTotals(year).equity;
      html += '<button class="row-btn year-income-row dense' + (year === state.worthYear ? " on" : "") +
        '" type="button" data-act="pick-worth-year" data-year="' + year + '">' +
        '<div class="row"><div><div class="name">' + year + "</div>" +
        (year === state.worthYear ? '<span class="caption">Selected</span>' : "") +
        '</div><span class="mono">' + money(equity) + "</span></div></button>";
    });
    html += historyToggleHtml("toggle-worth-years", !!state.worthYearsExpanded, desc.length);
    return html;
  }

  function renderWorth() {
    var years = state.worth.years.slice().sort(function (a, b) { return a - b; });
    if (state.worthDetails) return renderWorthDetails(years);
    var shell = statsSegmentHtml("worth");
    if (!years.length) {
      return '<div class="stmt-pass">' + shell +
        '<div class="stmt-foot">' +
        '<button class="text-btn" type="button" data-act="worth-details">Details</button></div>' +
        '<p class="empty">No annual review yet. Open Details and add a year.</p></div>';
    }
    var year = state.worthYear;
    // v37.5.59.12 (QA L11): don't land the headline on a brand-new $0 year when older years have balances.
    if (years.indexOf(year) < 0) {
      year = years[years.length - 1];
      for (var wi = years.length - 1; wi >= 0; wi--) {
        if (worthTotals(years[wi]).equity) { year = years[wi]; break; }
      }
      state.worthYear = year;
    }
    var current = worthTotals(year);
    /* v37.5.20: year sits quiet above a left/right Net worth row (same language as the
     * bottom total). Not a centered hero. Grouped assets expand in place.
     * Tax triangle, charts, YoY/additions/match live under Details. Year picker is the header calendar. */
    var html = '<div class="stmt-pass">' + shell +
      '<p class="stmt-year stmt-year-quiet">' + worthAddPriorButton() + year + "</p>" +
      '<div class="sheet-table stmt-sheet">' +
      statementRowHtml("Net worth", current.equity, { total: true, underlined: true, whole: true });
    if (!worthHasData()) {
      html += "</div>" +
        '<section class="empty-card worth-empty"><p><strong>Your first Net worth starts here.</strong></p>' +
        "<p>List what you own and what you owe. Charts and year-over-year change appear under Details once there’s a balance.</p>" +
        '<button class="text-btn" type="button" data-act="worth-details">Start my statement</button></section></div>';
      return html;
    }
    /* v37.5.31: Details sits under the hero, before the account list — one control, not the footer. */
    html += "</div>" +
      '<div class="stmt-foot stmt-details-high">' +
      '<button class="text-btn" type="button" data-act="worth-details">Details</button></div>' +
      '<p class="caption quiet stmt-details-note">Line edits, tax triangle, and year-over-year live under Details.</p>' +
      '<div class="sheet-table stmt-sheet">' +
      balanceSheetLinesHtml(year) + statementHairline() +
      statementRowHtml("Net worth", current.equity, { total: true, underlined: true }) +
      "</div></div>";
    return html;
  }


  /* v37.5.28: one row, years as columns. Change is a short percent on the row. */
  function worthDeltaText(delta, ratio) {
    if (delta == null) return "";
    // v37.5.59.12 (QA M8): percent from a ≤0 base is nonsense (−$550k → $0 looked like green −100%).
    if (ratio == null || !isFinite(ratio)) {
      return delta === 0 ? "—" : (delta > 0 ? "+" : "") + moneyWhole(delta);
    }
    var pct = percent(ratio);
    return (ratio > 0 ? "+" : "") + pct;
  }

  function worthYearsHead(priorYear, year) {
    return '<div class="worth-years-head" aria-hidden="true"><span></span><span>' +
      priorYear + "</span><span>" + year + "</span><span>%</span></div>";
  }

  function worthYearsRow(nameHtml, priorText, currentText, delta, ratio, buttonAttrs) {
    var open = buttonAttrs
      ? '<button class="row-btn worth-years-row" type="button" ' + buttonAttrs + ">"
      : '<div class="row worth-years-row">';
    var close = buttonAttrs ? "</button>" : "</div>";
    return open +
      '<span class="worth-years-name">' + nameHtml + "</span>" +
      '<span class="mono worth-col">' + priorText + "</span>" +
      '<span class="mono worth-col">' + currentText + "</span>" +
      '<span class="mono worth-delta ' + (delta == null ? "ink" : tone(delta)) + '">' +
      worthDeltaText(delta, ratio) + "</span>" +
      close;
  }

  function renderWorthAnalytics(years, year, current) {
    var priorYear = years.indexOf(year - 1) >= 0 ? year - 1 : null;
    var prior = priorYear == null ? null : worthTotals(priorYear);
    var delta = prior ? current.equity - prior.equity : 0;
    var ratio = prior && prior.equity > 0 ? (current.equity - prior.equity) / prior.equity : null;
    var trend = [
      {
        name: "Net worth",
        color: CHART_INKS[0],
        points: years.map(function (y) { return { year: y, y: worthTotals(y).equity }; })
      },
      {
        name: "Income",
        color: CHART_INKS[1],
        points: years.map(function (y) { return { year: y, y: Number((state.worth.income || {})[y]) || 0 }; })
      }
    ];
    var pieSlices = GROUPS.filter(function (g) { return g.id !== "debt"; }).map(function (g) {
      return { name: g.title, amount: current.rollup[g.id] || 0 };
    }).filter(function (s) { return s.amount > 0; });
    var shortTitles = {
      cash: "Cash",
      lifestyle: "Lifestyle",
      taxable: "Taxable",
      retirement: "Retirement",
      realEstate: "Property",
      debt: "Debt"
    };
    var bars = GROUPS.map(function (g) {
      return { id: g.id, title: shortTitles[g.id], amount: current.rollup[g.id] || 0 };
    }).filter(function (r) { return r.amount !== 0; });
    var html = taxTriangleHtml({ paycheckStrip: false, context: "worth" });
    html += '<p class="section-label">Versus prior year</p>';
    if (prior) {
      /* v37.5.28: prior year and selected year are columns, not stacked rows. */
      html += worthYearsHead(priorYear, year) +
        worthYearsRow("Net worth", moneyWhole(prior.equity), moneyWhole(current.equity), delta, ratio, "");
    } else {
      html += '<p class="empty">No prior year on file.</p>';
    }
    var startYear = firstEquityYear(years);
    var since = startYear != null && startYear < year
      ? equityCagr(worthTotals(startYear).equity, current.equity, year - startYear)
      : null;
    html +=
      '<p class="section-label">Equity returns</p>' +
      '<div class="row"><span>Y/Y</span><span class="mono ' + tone(ratio) + '">' +
      (ratio == null ? "—" : percent(ratio)) + "</span></div>" +
      '<div class="row"><span>Since inception</span><span class="mono ' + tone(since) + '">' +
      (since == null ? "—" : percent(since)) + "</span></div>" +
      '<p class="section-label">Trend</p>' +
      (years.filter(function (y) { var t = worthTotals(y); return t.assets !== 0 || t.liabilities !== 0; }).length < 2
        ? '<p class="empty">Your trend line appears once a second year has balances.</p>'
        : '<section class="card">' +
          lineChart(trend, {
            interactive: true,
            selectedYear: state.worthScrubYear || year
          }) +
          '<p class="caption">Drag the vertical line to a year. That year’s net worth and income appear under the graph.</p></section>') +
      '<p class="section-label">Allocation</p><section class="card">' +
      pieSvg(pieSlices, "No asset balances this year.") + barChart(bars) + "</section>" +
      '<p class="section-label">Category rollups</p>';
    GROUPS.forEach(function (g) {
      var amount = current.rollup[g.id] || 0;
      html += '<div class="row"><span>' + esc(g.title) + '</span><span class="mono group-amt ' +
        (g.id === "debt" && amount > 0 ? "rust" : "ink") + '">' + money(amount) + "</span></div>";
    });
    html +=
      '<p class="section-label">Annual notes</p>' +
      '<section class="card"><textarea class="notes" data-act="notes" placeholder="What happened this year?">' +
      esc(state.worth.notes[year] || "") + "</textarea></section>";
    return html;
  }

  function nwFooBadge(line, year, amount) {
    if (!line || line.kind !== "liability") return "";
    if (!(amount > 0) && !((Number(line.loanBalance) || 0) > 0)) return "";
    var GM = window.GradeMath;
    var item = GM.classifyDebt({
      name: line.name,
      apr: Number(line.loanApr) || 0,
      balance: (Number(line.loanBalance) || 0) > 0 ? Number(line.loanBalance) : amount,
      debtType: line.loanDebtType || ""
    }, GM.ageYears(birthdayISO()));
    if (item.needsBirthday) {
      return '<span class="foo-badge-caption">Add birthday in Profile</span>';
    }
    if (item.fooStep !== 3 || !item.badge) return "";
    return '<span class="foo-badge-caption">' + esc(item.badge) + "</span>";
  }

  function worthLineCaption(line, year) {
    var kind = line.kind === "liability" ? "Liability" : "Asset";
    if (line.kind !== "liability") return kind;
    var amount = lineAmount(line, year);
    var balance = (Number(line.loanBalance) || 0) > 0 ? Number(line.loanBalance) : amount;
    var bits = [kind];
    if (balance > 0) bits.push(money(balance));
    var rate = aprLabel(line.loanApr);
    if (rate) bits.push(rate);
    return bits.join(" · ");
  }



  /* v37.5.59.16: "+" ahead of the timeline adds a prior year. Hidden until the current calendar year has balances. */
  function worthCurrentYearFilled() {
    var cy = new Date().getFullYear();
    if (state.worth.years.indexOf(cy) < 0) return false;
    var t = worthTotals(cy);
    return t.assets !== 0 || t.liabilities !== 0;
  }

  function worthAddPriorButton() {
    return worthCurrentYearFilled()
      ? '<button class="year-add-prior" type="button" data-act="add-prior-year" aria-label="Add a prior year">+</button>'
      : "";
  }

  function openPriorYearSheet() {
    var cy = new Date().getFullYear();
    var have = state.worth.years;
    var opts = "";
    for (var y = cy - 1; y >= cy - 40; y--) {
      if (have.indexOf(y) < 0) opts += '<option value="' + y + '">' + y + "</option>";
    }
    if (!opts) return;
    var html = '<label class="field">Year<select name="priorYear">' + opts + "</select></label>" +
      '<p class="caption">Enter what you owned and owed at the end of that year. Leave a line at $0 if it didn’t exist yet.</p>';
    ["asset", "liability"].forEach(function (kind) {
      var lines = state.worth.lines.filter(function (l) { return (l.kind === "liability") === (kind === "liability"); });
      if (!lines.length) return;
      html += '<p class="section-label">' + (kind === "asset" ? "Assets" : "Liabilities") + "</p>";
      lines.forEach(function (l) { html += field(l.name, "wl_" + l.id, 0, "number"); });
    });
    openSheet("Add a prior year", html, "save-prior-year");
  }

  function renderWorthYearSlider(years) {
    if (!years || !years.length) return "";
    /* One sticky unit: label, slider, and caption. CSS pins it; do not scroll it to the top. */
    var html = '<div class="year-slider-bar"><p class="section-label">By year</p><div class="year-slider">' + worthAddPriorButton();
    years.forEach(function (year) {
      var equity = worthTotals(year).equity;
      html += '<button class="year-slide' + (year === state.worthYear ? " on" : "") +
        '" type="button" data-act="pick-worth-year" data-year="' + year + '">' +
        '<span class="year-slide-year">' + year + "</span>" +
        '<span class="mono">' + moneyWhole(equity) + "</span></button>";
    });
    html += "</div>" +
      '<p class="caption quiet">Swipe across the years. Tap one to open it.</p></div>';
    return html;
  }

  function renderWorthDetails(years) {
    var year = state.worthYear;
    var totals = worthTotals(year);
    var options = years.slice().reverse();
    var html =
      statsSegmentHtml("worth") +
      '<div class="nav-row worth-details-nav">' +
      '<button class="icon-btn worth-back" type="button" data-act="worth-back" aria-label="Back to statement">' +
      '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6 L9 12 L15 18"></path></svg></button>' +
      "<h2>Details</h2>" +
      '<button class="text-btn" type="button" data-act="add-year">Add year</button></div>' +
      (state.tab === "stats"
        ? ""
        : (years.length
          ? calendarYearPickerHtml("worth-year", options, year, "Net worth year")
          : '<p class="empty">Add a year to start a column.</p>')) +
      '<header class="stmt-header stmt-hero-center">' +
      '<p class="stmt-year">' + (year || "") + "</p>" +
      '<p class="stmt-hero-label">Net worth</p>' +
      '<p class="stmt-hero-amount">' + moneyWhole(totals.equity) + "</p></header>";
    if (years.length && worthHasData()) {
      html += renderWorthAnalytics(years, year, totals);
    } else {
      html += taxTriangleHtml({ paycheckStrip: false, context: "worth" });
    }
    var priorYear = years.indexOf(year - 1) >= 0 ? year - 1 : null;
    var priorTotals = priorYear == null ? null : worthTotals(priorYear);
    var incomeNote = ((state.worth.notes || {})[year] || "").replace(/^\s+|\s+$/g, "");
    html += '<p class="section-label">Year column</p><div class="sheet-table worth-sheet">';
    if (priorTotals) {
      var curInc = yearIncomeFigure(year).amount;
      var priInc = yearIncomeFigure(priorYear).amount;
      var assetDelta = totals.assets - priorTotals.assets;
      var liabDelta = totals.liabilities - priorTotals.liabilities;
      var incDelta = curInc - priInc;
      html += worthYearsHead(priorYear, year) +
        worthYearsRow("Assets", moneyWhole(priorTotals.assets), moneyWhole(totals.assets), assetDelta,
          priorTotals.assets ? assetDelta / priorTotals.assets : null, "") +
        worthYearsRow("Liabilities", moneyWhole(priorTotals.liabilities), moneyWhole(totals.liabilities), liabDelta,
          priorTotals.liabilities ? liabDelta / priorTotals.liabilities : null, "") +
        worthYearsRow(
          '<span class="name">Annual income</span>' +
          (incomeNote ? '<span class="caption">' + esc(state.worth.notes[year]) + "</span>"
            : '<span class="caption">Tap to add notes</span>'),
          moneyWhole(priInc), moneyWhole(curInc), incDelta, priInc ? incDelta / priInc : null,
          'data-act="open-year-income" data-year="' + year + '"') +
        '<p class="empty">Prior year and ' + year + ' are columns on each row. Totals are computed. The percent is versus the prior year. Retirement lines still store Net Additions and computed returns.</p>';
    } else {
      html +=
        '<div class="row"><span>Assets</span><span class="mono">' + money(totals.assets) + "</span></div>" +
        '<div class="row"><span>Liabilities</span><span class="mono">' + money(totals.liabilities) + "</span></div>" +
        '<button class="row-btn year-income-row" type="button" data-act="open-year-income" data-year="' + year + '">' +
        '<div class="row"><div><div class="name">Annual income</div>' +
        (incomeNote
          ? '<span class="caption">' + esc(state.worth.notes[year]) + "</span>"
          : '<span class="caption">Tap to add notes</span>') +
        "</div><span class='mono'>" + money(yearIncomeFigure(year).amount) + "</span></div></button>" +
        '<p class="empty">This is one year column. Totals are computed. Each line shows YoY versus the prior year. Retirement lines store Net Additions and computed returns.</p>';
    }
    html += "</div>";

    /* v37.5.30: year slider sits once, immediately above the first asset group (Cash), and sticks only after scroll reaches it. */
    html += renderWorthYearSlider(years);

    GROUPS.forEach(function (g) {
      var items = state.worth.lines.filter(function (l) { return l.group === g.id; });
      if (!items.length) return;
      if (g.id === "debt") {
        var liabilities = items.filter(function (line) { return line.kind === "liability"; });
        var rest = items.filter(function (line) { return line.kind !== "liability"; });
        if (liabilities.length) {
          html += loanSortControlHtml();
          liabilities = sortedWorthLoans(liabilities, year);
        }
        items = liabilities.concat(rest);
      }
      html += '<p class="section-label">' + esc(g.title) + "</p>";
      if (priorYear != null) html += worthYearsHead(priorYear, year);
      items.forEach(function (line) {
        var current = lineAmount(line, year);
        var prior = priorYear == null ? null : lineAmount(line, priorYear);
        var yoy = prior == null ? null : current - prior;
        // Only show % when the prior year was positive.
        var yoyPct = (prior != null && prior > 0) ? (current - prior) / prior : null;
        html += '<div class="worth-line">';
        html += '<div class="worth-line-head">';
        if (priorYear != null) {
          html += '<button class="row-btn worth-line-main worth-years-row" type="button" data-act="edit-line" data-id="' + line.id + '">' +
            '<span class="worth-years-name"><span class="name">' + esc(line.name) + "</span>" +
            '<span class="caption">' + esc(worthLineCaption(line, year)) + "</span>" +
            nwFooBadge(line, year, current) +
            "</span>" +
            '<span class="mono worth-col">' + moneyWhole(prior) + "</span>" +
            '<span class="mono worth-col">' + moneyWhole(current) + "</span>" +
            '<span class="mono worth-delta ' + tone(yoy) + '">' + worthDeltaText(yoy, yoyPct) + "</span></button>";
        } else {
          html += '<button class="row-btn worth-line-main" type="button" data-act="edit-line" data-id="' + line.id + '">' +
            "<div><div class='name'>" + esc(line.name) + "</div>" +
            '<span class="caption">' + esc(worthLineCaption(line, year)) + "</span>" +
            nwFooBadge(line, year, current) +
            "</div>" +
            '<span class="mono">' + money(current) + "</span></button>";
        }
        if (is401k(line)) html += docCueHtml("k401", line.id, line.name);
        if (line.kind === "liability") html += docCueHtml("loan", line.id, line.name);
        if (/insurance/i.test(line.name || "")) html += docCueHtml("insurance", line.id, line.name);
        html += "</div>";
        /* YoY percent sits in the year columns when a prior year exists. No stacked year row. */
        if (tracksContributions(line)) {
          var add = lineAddition(line, year);
          var match = lineEmployerMatch(line, year);
          var base = lineEmployerBase(line, year);
          var addGains = treatedAdditions(line, year, true);
          var addContrib = treatedAdditions(line, year, false);
          var annGains = prior == null ? null : annualReturn(current, prior, addGains);
          var annContrib = prior == null ? null : annualReturn(current, prior, addContrib);
          var irrGains = irrCashflows(contributionCashflows(line, year, true));
          var irrContrib = irrCashflows(contributionCashflows(line, year, false));
          html += '<div class="worth-metric"><span>' + (is401k(line) ? "Employee additions" : "Net additions") +
            '</span><span class="mono">' + money(add) + "</span></div>";
          if (is401k(line)) {
            html += '<div class="worth-metric"><span>Employer match</span><span class="mono">' + money(match) + "</span></div>";
            html += '<div class="worth-metric"><span>Employer base</span><span class="mono">' + money(base) + "</span></div>";
            html += '<div class="worth-metric"><span>Annual return · employer as gains</span><span class="mono ' +
              (annGains == null ? "ink" : tone(annGains)) + '">' + (annGains == null ? "—" : percent(annGains)) + "</span></div>";
            html += '<div class="worth-metric"><span>Annual return · employer as contributions</span><span class="mono ' +
              (annContrib == null ? "ink" : tone(annContrib)) + '">' + (annContrib == null ? "—" : percent(annContrib)) + "</span></div>";
            html += '<div class="worth-metric"><span>IRR · as gains</span><span class="mono ' +
              (irrGains == null ? "ink" : tone(irrGains)) + '">' + (irrGains == null ? "—" : percent(irrGains)) + "</span></div>";
            html += '<div class="worth-metric"><span>IRR · as contributions</span><span class="mono ' +
              (irrContrib == null ? "ink" : tone(irrContrib)) + '">' + (irrContrib == null ? "—" : percent(irrContrib)) + "</span></div>";
          } else {
            html += '<div class="worth-metric"><span>Annual return</span><span class="mono ' +
              (annGains == null ? "ink" : tone(annGains)) + '">' + (annGains == null ? "—" : percent(annGains)) + "</span></div>";
            html += '<div class="worth-metric"><span>IRR since inception</span><span class="mono ' +
              (irrGains == null ? "ink" : tone(irrGains)) + '">' + (irrGains == null ? "—" : percent(irrGains)) + "</span></div>";
          }
        }
        html += "</div>";
      });
    });
    html += '<div class="nw-add-row"><button class="text-btn" type="button" data-act="add-nw-account">+ Add account</button>' +
      '<button class="text-btn" type="button" data-act="add-nw-loan">+ Add loan</button>' +
      '<p class="caption quiet">Adds a liability you can name and give a balance. Budget loan balances land here too — payment and balance stay separate.</p></div>';
    html += '<p class="empty">Add year copies every line item into a new empty column (amounts start at $0). Annual return is (ending − prior − net additions) / prior. IRR treats each year’s net additions as outflows, then this year’s ending value as a separate final inflow.</p>';
    return html;
  }

  function applyNight() {
    document.body.classList.toggle("night", !!state.nightLedger);
    document.documentElement.classList.toggle("night", !!state.nightLedger);
  }

  function remapDate(iso, destYM) {
    var parts = String(iso || "").split("-");
    var day = parts.length === 3 ? Number(parts[2]) : 1;
    var last = new Date(destYM.year, destYM.month, 0).getDate();
    return isoDate(destYM.year, destYM.month, Math.min(Math.max(day || 1, 1), last));
  }

  /* v37.5.59.12 (QA NEW-M1b): biweekly pay dates from confirmed stubs / received paychecks. */
  function parseIsoLocal(iso) {
    var p = String(iso || "").split("-");
    if (p.length < 3) return null;
    var y = Number(p[0]), m = Number(p[1]), d = Number(p[2]);
    if (!(y > 0) || !(m >= 1 && m <= 12) || !(d >= 1 && d <= 31)) return null;
    return new Date(y, m - 1, d);
  }
  function addDaysLocal(date, n) {
    var d = new Date(date.getFullYear(), date.getMonth(), date.getDate() + n);
    return d;
  }
  function lastPayAnchor() {
    var dates = [];
    var amounts = [];
    try {
      (confirmedPayStubs() || []).forEach(function (stub) {
        var d = parseIsoLocal(stub && stub.payDate);
        if (d) {
          dates.push(d);
          if (Number(stub.net) > 0) amounts.push(Number(stub.net));
          else if (Number(stub.gross) > 0) amounts.push(Number(stub.net) || 0);
        }
      });
    } catch (err) {}
    // Prefer confirmed stub pay dates; fall back to received paycheck rows (not reimbursements).
    if (!dates.length) Object.keys(state.months || {}).forEach(function (k) {
      var m = state.months[k];
      if (!m) return;
      var payLineIds = {};
      (m.incomes || []).forEach(function (i) { if (/paycheck/i.test(String(i.name || ""))) payLineIds[i.id] = true; });
      (m.transactions || []).forEach(function (t) {
        if (!t || t.type !== "income") return;
        if (t.incomeId && !payLineIds[t.incomeId]) return;
        var d = parseIsoLocal(t.date);
        if (!d) return;
        dates.push(d);
        if (Number(t.amount) > 0) amounts.push(Number(t.amount));
      });
    });
    if (!dates.length) return null;
    dates.sort(function (a, b) { return a - b; });
    amounts = amounts.filter(function (n) { return n > 0; }).sort(function (a, b) { return a - b; });
    var amt = amounts.length ? amounts[Math.floor((amounts.length - 1) / 2)] : 0;
    return { date: dates[dates.length - 1], amount: amt };
  }
  function biweeklyIncomesForMonth(year, month, fallbackAmount) {
    var anchor = lastPayAnchor();
    var amount = Number(fallbackAmount) || (anchor && anchor.amount) || 0;
    var out = [];
    if (!anchor) {
      var last = new Date(year, month, 0).getDate();
      out.push({ day: 1 }, { day: Math.min(15, last) });
      return out.map(function (item, i) {
        return {
          id: nextId(),
          name: "Paycheck " + (i + 1),
          amount: amount,
          date: isoDate(year, month, item.day)
        };
      });
    }
    var start = new Date(year, month - 1, 1);
    var end = new Date(year, month, 0);
    var cursor = new Date(anchor.date.getFullYear(), anchor.date.getMonth(), anchor.date.getDate());
    while (cursor > start) cursor = addDaysLocal(cursor, -14);
    while (cursor < start) cursor = addDaysLocal(cursor, 14);
    var n = 0;
    while (cursor <= end) {
      n += 1;
      out.push({
        id: nextId(),
        name: "Paycheck " + n,
        amount: amount,
        date: isoDate(cursor.getFullYear(), cursor.getMonth() + 1, cursor.getDate())
      });
      cursor = addDaysLocal(cursor, 14);
    }
    if (!out.length) {
      out.push({
        id: nextId(),
        name: "Paycheck 1",
        amount: amount,
        date: isoDate(year, month, 1)
      });
    }
    return out;
  }
  function typicalPaycheckAmount(src) {
    var fromSrc = (src && src.incomes || []).map(function (i) { return Number(i.amount) || 0; }).filter(function (n) { return n > 0; });
    if (fromSrc.length) {
      fromSrc.sort(function (a, b) { return a - b; });
      return fromSrc[Math.floor((fromSrc.length - 1) / 2)];
    }
    var a = lastPayAnchor();
    return a ? a.amount : 0;
  }

  function copyPlanFromTo(src, destYM) {
    var destKey = ymKey(destYM.year, destYM.month);
    var amt = typicalPaycheckAmount(src);
    state.months[destKey] = {
      year: destYM.year,
      month: destYM.month,
      /* v37.5.59.12: derive paycheck count/dates from biweekly schedule, not prior month's 3 lines. */
      incomes: biweeklyIncomesForMonth(destYM.year, destYM.month, amt).map(function (inc) { inc.autoCopy = true; return inc; }),
      categories: sortedCategories(src).map(function (cat, i) {
        return {
          id: nextId(),
          name: cat.name,
          assigned: catAssigned(cat),
          sortOrder: i,
          autoCopy: true,
          lines: sortedLines(cat).map(function (line, li) {
            /* v37.5.59.12: autoCopy marks a copied-forward line you haven't touched; an
             * EveryDollar plan refresh may drop it if EveryDollar has no such line and
             * nothing is logged against it. Editing the line clears the mark. */
            return {
              id: nextId(),
              name: line.name,
              assigned: Number(line.assigned) || 0,
              sortOrder: li,
              autoCopy: true
            };
          })
        };
      }),
      transactions: []
    };
    return destKey;
  }

  function copyBudgetTemplate() {
    return copyPlanFromTo(ensureMonth(state.year, state.month), offsetMonth(state.year, state.month, 1));
  }

  function previousPlanMonth() {
    return Object.keys(state.months).map(function (k) {
      return state.months[k];
    }).filter(function (m) {
      migrateSubsections(m);
      return (m.year < state.year || (m.year === state.year && m.month < state.month)) &&
        m.categories.reduce(function (n, c) { return n + catAssigned(c); }, 0) > 0;
    }).sort(function (a, b) {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    })[0] || null;
  }

  function copyLastMonthOntoCurrent() {
    var src = previousPlanMonth();
    if (!src) {
      window.alert("No earlier month with assigned dollars to copy.");
      return;
    }
    copyPlanFromTo(src, { year: state.year, month: state.month });
    saveState();
    window.alert("Copied last month’s plan onto this month. Spending stayed on last month.");
    render();
  }

  function copyBudgetOntoNext() {
    var destYM = offsetMonth(state.year, state.month, 1);
    var destKey = ymKey(destYM.year, destYM.month);
    var destExisting = state.months[destKey];
    var destSpends = destExisting ? (destExisting.transactions || []).length : 0;
    var label = MONTH_NAMES[destYM.month - 1] + " " + destYM.year;
    var msg = "Copy this month’s envelope names, subsection names, assigned dollars, and paychecks onto " +
      label + "? Spending stays on this month.";
    if (destSpends) {
      msg += " This replaces next month’s envelopes and clears its spends.";
    }
    if (!window.confirm(msg)) return;
    copyBudgetTemplate();
    saveState();
    window.alert("Copied the plan onto " + label + ". Spending stayed on this month.");
    render();
  }

  function openRitual() {
    captureModalReturnScreenTop();
    ritual = { step: 1, destKey: "" };
    renderRitual();
  }

  function renderRitual() {
    var destYM = offsetMonth(state.year, state.month, 1);
    var label = MONTH_NAMES[destYM.month - 1] + " " + destYM.year;
    var stepTitle = ritual.step === 1 ? "1 · Copy last month" : ritual.step === 2 ? "2 · Adjust paychecks" : "3 · Assign leftover";
    var body = '<p class="ritual-step">' + stepTitle + "</p>";
    var action = "";
    if (ritual.step === 1) {
      body += '<p class="empty">Copy envelope names, subsection names, assigned dollars, and paychecks onto ' +
        esc(label) + ". Spending stays on this month.</p>";
      action = '<button class="primary" type="button" data-act="ritual-copy">Copy last month’s plan</button>';
    } else if (ritual.step === 2) {
      var dest = state.months[ritual.destKey];
      body += '<p class="empty">Change a check if next month’s pay is different.</p>';
      (dest.incomes || []).forEach(function (item) {
        body += '<div class="planner-row"><label>' + esc(item.name) + "</label>" +
          '<input class="cents-input" data-cents="1" data-act="ritual-paycheck" data-id="' + esc(item.id) +
          '" inputmode="numeric" autocomplete="off" type="text" value="' + esc(money(item.amount)) + '"></div>';
      });
      action = '<button class="primary" type="button" data-act="ritual-continue">Continue</button>';
    } else {
      var dest = state.months[ritual.destKey];
      var leftover = dest ? sums(dest).leftover : 0;
      body += '<div class="row"><span>Left to assign</span><span class="mono ' + tone(leftover) + '">' +
        money(leftover) + "</span></div>" +
        '<p class="empty">Give every leftover dollar a job on next month’s envelopes.</p>';
      action = '<button class="primary" type="button" data-act="ritual-open">Open next month</button>';
    }
    var modal = document.getElementById("modal");
    modal.hidden = false;
    modal.innerHTML =
      '<div class="sheet">' +
      "<h3>New month</h3>" + body +
      '<div class="sheet-actions"><button type="button" data-act="close-modal">Close</button>' +
      action + "</div></div>";
    bindMoneyInputs(modal);
  }

  function openEnvelopeDetail(cat, month) {
    var assigned = catAssigned(cat);
    var spent = spentFor(month, cat.id);
    var remaining = assigned - spent;
    var html = field("Name", "name", cat.name) +
      '<div class="row"><span>Planned</span><span class="mono">' + money(assigned) + "</span></div>" +
      '<div class="row"><span>Spent</span><span class="mono">' + money(spent) + "</span></div>" +
      '<div class="row"><span>Remaining</span><span class="mono ' + (remaining < 0 ? "ink" : tone(remaining)) + '">' + money(remaining) + "</span></div>";
    html += '<p class="section-label">Lines</p>';
    sortedLines(cat).forEach(function (line) {
      var lineSpent = spentOnLine(month, line.id);
      var lineLeft = (Number(line.assigned) || 0) - lineSpent;
      html += '<div class="detail-line">' +
        lineNameButton(line.name, "", 'data-act="edit-line-item" data-id="' + line.id + '"') +
        '<div class="caption">Planned ' + money(line.assigned) + " · Spent " + money(lineSpent) + "</div>" +
        '<div class="caption ' + (lineLeft < 0 ? "ink" : tone(lineLeft)) + '">' + money(lineLeft) + " remaining</div>" +
        "</div>";
    });
    html += '<input type="hidden" name="id" value="' + esc(cat.id) + '">';
    openSheet(cat.name, html, "save-category");
  }

  function lineOptions(month, selectedId) {
    var html = '<label class="field">Envelope<select name="lineKey">';
    sortedCategories(month).forEach(function (cat) {
      sortedLines(cat).forEach(function (line) {
        html += '<option value="' + esc(cat.id + ":" + line.id) + '"' +
          (line.id === selectedId ? " selected" : "") + ">" +
          esc(cat.name + " · " + line.name) + "</option>";
      });
    });
    return html + "</select></label>";
  }

  function cleanEnvName(s) {
    return String(s || "").replace(/^\s+|\s+$/g, "").toLowerCase();
  }

  /* v37.5.59.12 (QA NEW-M2): when a tx moves into a month lacking its envelope, create
   * the matching group+line at $0 assigned (or reuse by name) so the list never says No category. */
  function ensureEnvelopeInMonth(destMonth, srcMonth, categoryId, lineId) {
    function locate(m) {
      var hit = null;
      (m && m.categories || []).forEach(function (c) {
        if (hit) return;
        if (String(c.id) === String(categoryId)) {
          var line = (c.lines || []).filter(function (l) { return String(l.id) === String(lineId); })[0];
          hit = { cat: c, line: line || (c.lines || [])[0] || null };
        } else {
          (c.lines || []).forEach(function (l) {
            if (!hit && String(l.id) === String(lineId)) hit = { cat: c, line: l };
          });
        }
      });
      return hit;
    }
    var found = locate(srcMonth);
    if (!found || !found.cat) {
      Object.keys(state.months || {}).some(function (k) {
        found = locate(state.months[k]);
        return !!(found && found.cat);
      });
    }
    if (!found || !found.cat) return { categoryId: categoryId, lineId: lineId };
    var catName = found.cat.name;
    var lineName = found.line ? found.line.name : catName;
    var byName = findLineByNames(destMonth, catName, lineName);
    if (byName) return { categoryId: byName.categoryId, lineId: byName.lineId };
    var destCat = (destMonth.categories || []).filter(function (c) {
      return cleanEnvName(c.name) === cleanEnvName(catName);
    })[0];
    if (!destCat) {
      destCat = {
        id: nextId(),
        name: catName,
        assigned: 0,
        sortOrder: (destMonth.categories || []).length,
        lines: []
      };
      destMonth.categories = destMonth.categories || [];
      destMonth.categories.push(destCat);
    }
    destCat.lines = Array.isArray(destCat.lines) ? destCat.lines : [];
    var destLine = destCat.lines.filter(function (l) {
      return cleanEnvName(l.name) === cleanEnvName(lineName);
    })[0];
    if (!destLine) {
      destLine = { id: nextId(), name: lineName, assigned: 0, sortOrder: destCat.lines.length };
      destCat.lines.push(destLine);
    }
    destCat.assigned = Math.round(destCat.lines.reduce(function (s, l) {
      return s + (Number(l.assigned) || 0);
    }, 0) * 100) / 100;
    return { categoryId: destCat.id, lineId: destLine.id };
  }

  function findLineByNames(month, categoryName, lineName) {
    var cat = (month.categories || []).filter(function (item) {
      return String(item.name || "").toLowerCase() === String(categoryName || "").toLowerCase();
    })[0];
    if (!cat) return null;
    var line = (cat.lines || []).filter(function (item) {
      return String(item.name || "").toLowerCase() === String(lineName || "").toLowerCase();
    })[0];
    if (!line) return null;
    return { categoryId: cat.id, lineId: line.id, categoryName: cat.name, lineName: line.name };
  }

  function merchantSuggestion(month, payee, amount) {
    var GM = window.GradeMath;
    if (!GM || !GM.normalizeMerchant) return null;
    var key = GM.normalizeMerchant(payee);
    if (!key) return null;
    var rule = (state.merchantRules || {})[key];
    if (!rule) return null;
    var suggested = GM.suggestMerchantLegs(rule, amount);
    if (!suggested || !suggested.length) return null;
    var legs = [];
    for (var i = 0; i < suggested.length; i++) {
      var found = findLineByNames(month, suggested[i].categoryName, suggested[i].lineName);
      if (!found) return null;
      legs.push({
        id: nextId(),
        categoryId: found.categoryId,
        lineId: found.lineId,
        amount: suggested[i].amount,
        note: ""
      });
    }
    return { key: key, legs: legs };
  }

  function rememberMerchant(month, payee, legs) {
    var GM = window.GradeMath;
    if (!GM || !GM.normalizeMerchant || !GM.merchantRule) return;
    var key = GM.normalizeMerchant(payee);
    if (!key || key === "spend") return;
    var named = (legs || []).map(function (leg) {
      var found = findLine(month, leg.lineId);
      return {
        categoryName: found && found.cat ? found.cat.name : "",
        lineName: found && found.line ? found.line.name : "",
        amount: Number(leg.amount) || 0
      };
    }).filter(function (leg) { return leg.categoryName && leg.lineName && leg.amount > 0; });
    var rule = GM.merchantRule(named);
    if (!rule) return;
    if (!state.merchantRules) state.merchantRules = {};
    state.merchantRules[key] = rule;
  }

  function markMerchantHint(payee) {
    state.merchantHint = { payee: payee || "history" };
  }

  function importSpendStub(rows) {
    var month = ensureMonth(state.year, state.month);
    var applied = 0;
    (rows || []).forEach(function (row) {
      var amount = Number(row.amount) || 0;
      if (!(amount > 0)) return;
      var payee = String(row.payee || "").replace(/^\s+|\s+$/g, "") || "Spend";
      var suggestion = merchantSuggestion(month, payee, amount);
      var legs = suggestion && suggestion.legs;
      if (!legs) {
        var firstCat = (month.categories || [])[0];
        var firstLine = firstCat && firstCat.lines && firstCat.lines[0];
        if (!firstCat || !firstLine) return;
        legs = [{
          id: nextId(),
          categoryId: firstCat.id,
          lineId: firstLine.id,
          amount: amount,
          note: ""
        }];
      } else {
        applied += 1;
      }
      var payload = {
        id: nextId(),
        payee: payee,
        amount: amount,
        date: row.date || isoDate(state.year, state.month, new Date().getDate()),
        note: String(row.note || "").replace(/^\s+|\s+$/g, ""),
        categoryId: legs[0].categoryId,
        lineId: legs[0].lineId,
        mappedFromHistory: !!suggestion
      };
      if (legs.length > 1) payload.legs = legs;
      month.transactions.push(payload);
    });
    if (applied) markMerchantHint("import");
    saveState();
    return applied;
  }

  function applyMerchantToDraft(month, payee, force) {
    if (!spendDraft || spendDraft.id || spendDraft.categoryTouched) return false;
    var suggestion = merchantSuggestion(month, payee, Number(spendDraft.amount) || 0);
    if (!suggestion) return false;
    if (!force && spendDraft.mappedKey === suggestion.key && spendDraft.mappedFromHistory) return false;
    spendDraft.legs = suggestion.legs;
    spendDraft.mappedFromHistory = true;
    spendDraft.mappedKey = suggestion.key;
    markMerchantHint(payee);
    return true;
  }


  /* ---- v37.5.18 EveryDollar-style merchant chips + remaining accessory ----
   * Remaining = planned − spent (spent net of refunds via envelopeNetSpent / spentOnLine).
   * When editing, the open transaction’s net on that line is added back so leftover is honest.
   * ≤0 remaining: still shown; tap fills $0 (clearer than a silent no-op).
   * Splits: remaining + chips track the primary (first) leg’s envelope. */
  function lineNetFromTx(tx, lineId) {
    if (!tx || isIncomeTx(tx) || !lineId) return 0;
    var GM = gm();
    var total = 0;
    if (GM.txLegBreakdown) {
      GM.txLegBreakdown(tx).forEach(function (leg) {
        if (String(leg.lineId) === String(lineId)) total += Number(leg.net) || 0;
      });
    }
    return total;
  }

  function remainingForLine(month, lineId, excludeTxId) {
    var found = findLine(month, lineId);
    var assigned = found && found.line ? Number(found.line.assigned) || 0 : 0;
    var spent = spentOnLine(month, lineId);
    if (excludeTxId) {
      var tx = findTx(month, excludeTxId);
      if (tx) spent -= lineNetFromTx(tx, lineId);
    }
    return assigned - spent;
  }

  function collectMerchantStats(matchFn) {
    var byKey = {};
    Object.keys(state.months || {}).forEach(function (key) {
      var m = state.months[key];
      (m && m.transactions || []).forEach(function (tx) {
        if (!matchFn(tx, m)) return;
        var payee = String(tx.payee || "").replace(/^\s+|\s+$/g, "");
        if (!payee) return;
        var k = payee.toLowerCase();
        if (!byKey[k]) byKey[k] = { payee: payee, count: 0, lastDate: "" };
        byKey[k].count += 1;
        var d = String(tx.date || "");
        if (d > byKey[k].lastDate) byKey[k].lastDate = d;
      });
    });
    return byKey;
  }

  function rankMerchants(byKey, limit) {
    return Object.keys(byKey).map(function (k) { return byKey[k]; }).sort(function (a, b) {
      if (a.lastDate !== b.lastDate) return a.lastDate < b.lastDate ? 1 : -1;
      if (a.count !== b.count) return b.count - a.count;
      return String(a.payee).localeCompare(String(b.payee));
    }).slice(0, limit || 7);
  }

  function recommendedMerchants(month, lineId, categoryId, opts) {
    opts = opts || {};
    var limit = opts.limit || 7;
    var income = !!opts.income;
    if (income) {
      return rankMerchants(collectMerchantStats(function (tx) {
        return isIncomeTx(tx);
      }), limit);
    }
    var onLine = collectMerchantStats(function (tx) {
      if (isIncomeTx(tx)) return false;
      return txLegs(tx).some(function (leg) { return String(leg.lineId) === String(lineId); });
    });
    var list = rankMerchants(onLine, limit);
    if (list.length >= 3 || !categoryId) return list;
    var onCat = collectMerchantStats(function (tx) {
      if (isIncomeTx(tx)) return false;
      return txLegs(tx).some(function (leg) { return String(leg.categoryId) === String(categoryId); });
    });
    Object.keys(onCat).forEach(function (k) {
      if (!onLine[k]) onLine[k] = onCat[k];
    });
    list = rankMerchants(onLine, limit);
    if (list.length >= 2) return list;
    var global = collectMerchantStats(function (tx) { return !isIncomeTx(tx); });
    Object.keys(global).forEach(function (k) {
      if (!onLine[k]) onLine[k] = global[k];
    });
    return rankMerchants(onLine, limit);
  }

  /* ---- v37.5.59.2 (owner): add-transaction suggests the MERCHANT / payer, never the envelope ----
   * Suggestions = this device's past transactions of the same kind (expense or income) merged with
   * merchant seeds an import left in state.merchantSeeds (EveryDollar history, e.g. the employer payroll payee).
   * Seeds live only in local state (written by the import page) — nothing about any user's merchants is
   * baked into app.js. Ranking: merchants seen in the last 45 days (vs. the newest activity) first,
   * then most frequent, then most recent. */
  function seedMerchantStats(kind) {
    var byKey = {};
    var seeds = (state.merchantSeeds && state.merchantSeeds[kind]) || [];
    (Array.isArray(seeds) ? seeds : []).forEach(function (item) {
      var payee = String((item && item.payee) || "").replace(/^\s+|\s+$/g, "");
      if (!payee) return;
      var k = payee.toLowerCase();
      byKey[k] = { payee: payee, count: Number(item.count) || 1, lastDate: String(item.lastDate || ""), envelopes: item.envelopes || null };
    });
    return byKey;
  }

  function suggestedPayees(income, limit) {
    var hist = collectMerchantStats(function (tx) { return income ? isIncomeTx(tx) : !isIncomeTx(tx); });
    var seeds = seedMerchantStats(income ? "income" : "expense");
    Object.keys(seeds).forEach(function (k) {
      if (!hist[k]) { hist[k] = { payee: seeds[k].payee, count: 0, lastDate: "" }; }
      hist[k].count += seeds[k].count;
      if (seeds[k].lastDate > hist[k].lastDate) hist[k].lastDate = seeds[k].lastDate;
    });
    var list = Object.keys(hist).map(function (k) { return hist[k]; });
    var newest = list.reduce(function (m, it) { return it.lastDate > m ? it.lastDate : m; }, "");
    var cutoff = "";
    if (newest) {
      var d = new Date(newest + "T12:00:00");
      d.setDate(d.getDate() - 45);
      cutoff = d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
    }
    list.sort(function (a, b) {
      var ra = a.lastDate >= cutoff ? 1 : 0;
      var rb = b.lastDate >= cutoff ? 1 : 0;
      if (ra !== rb) return rb - ra;
      if (a.count !== b.count) return b.count - a.count;
      if (a.lastDate !== b.lastDate) return a.lastDate < b.lastDate ? 1 : -1;
      return String(a.payee).localeCompare(String(b.payee));
    });
    return limit ? list.slice(0, limit) : list;
  }

  /* v37.5.59.6 (QA): lead with the real payer from history ("Acme Payroll, …"), not a generic "Employer". */
  function incomePayeePlaceholder() {
    var top = suggestedPayees(true, 2).map(function (it) { return it.payee; }).filter(Boolean);
    return top.length ? "e.g. " + top.join(", ") + ", …" : "Employer, client, …";
  }

  function payeeDatalistHtml(income) {
    var all = suggestedPayees(income, 40);
    if (!all.length) return "";
    return '<datalist id="payee-suggest">' + all.map(function (item) {
      return '<option value="' + esc(item.payee) + '"></option>';
    }).join("") + "</datalist>";
  }

  function cleanEnvelopeName(name) {
    return String(name || "").replace(/[^\w\/&' -]+/g, "").replace(/^\s+|\s+$/g, "").toLowerCase();
  }

  /* Fill an envelope ONLY when this merchant has always gone to one single envelope before
   * (device history + seeded EveryDollar history). Any split or a second envelope → leave it blank. */
  function merchantOnlyEnvelope(month, payee) {
    var k = String(payee || "").replace(/^\s+|\s+$/g, "").toLowerCase();
    if (!k) return null;
    var seen = {};
    var names = [];
    var mixed = false;
    Object.keys(state.months || {}).forEach(function (key) {
      var m = state.months[key];
      (m && m.transactions || []).forEach(function (tx) {
        if (isIncomeTx(tx)) return;
        if (String(tx.payee || "").replace(/^\s+|\s+$/g, "").toLowerCase() !== k) return;
        var legs = txLegs(tx);
        if (legs.length !== 1) { mixed = true; return; }
        var found = findLine(m, legs[0].lineId);
        if (!found || !found.line) return;
        var nk = String(found.cat.name || "").toLowerCase() + "|" + String(found.line.name || "").toLowerCase();
        if (!seen[nk]) { seen[nk] = true; names.push({ cat: found.cat.name, line: found.line.name }); }
      });
    });
    var seed = seedMerchantStats("expense")[k];
    if (seed && seed.envelopes) {
      Object.keys(seed.envelopes).forEach(function (env) {
        if (env === "split") { mixed = true; return; }
        // Seeds know only the EveryDollar line name; match it to one line here by cleaned name.
        var matches = [];
        (month.categories || []).forEach(function (cat) {
          (cat.lines || []).forEach(function (line) {
            if (cleanEnvelopeName(line.name) === cleanEnvelopeName(env)) matches.push({ cat: cat.name, line: line.name });
          });
        });
        if (matches.length !== 1) { mixed = true; return; }
        var nk = String(matches[0].cat).toLowerCase() + "|" + String(matches[0].line).toLowerCase();
        if (!seen[nk]) { seen[nk] = true; names.push(matches[0]); }
      });
    }
    if (mixed || names.length !== 1) return null;
    return findLineByNames(month, names[0].cat, names[0].line);
  }

  function applyMerchantEnvelope(month, payee) {
    if (!spendDraft || spendDraft.id || spendDraft.categoryTouched || spendDraft.type === "income") return false;
    if (!spendDraft.legs || spendDraft.legs.length !== 1) return false;
    var only = spendDraft.legs[0];
    if (only.lineId && !spendDraft.mappedFromHistory) return false;
    var found = merchantOnlyEnvelope(month, payee);
    if (!found) {
      if (spendDraft.mappedFromHistory) { only.categoryId = ""; only.lineId = ""; spendDraft.mappedFromHistory = false; }
      return false;
    }
    only.categoryId = found.categoryId;
    only.lineId = found.lineId;
    spendDraft.mappedFromHistory = true;
    spendDraft.mappedKey = String(payee || "").toLowerCase();
    return true;
  }

  /* Income saved without a line → the next paycheck line that isn't fully received (never a full one). */
  /* v37.5.59.5: deterministic pick — lowest-numbered "Paycheck N" first, then other lines in list order.
     (Sorting by line date let a Paycheck 3 dated earlier than Paycheck 2 jump the queue.) */
  function incomeLineOrderKey(item, index) {
    var m = String((item && item.name) || "").trim().match(/^Paycheck(?:\s+(\d+))?$/i);
    if (m) return (m[1] ? parseInt(m[1], 10) : 1) * 1000 + index;
    return 1000000 + index;
  }

  function nextOpenIncomeLine(month, extraFromTxId) {
    var lines = (month.incomes || []).map(function (item, index) {
      return { item: item, key: incomeLineOrderKey(item, index) };
    }).sort(function (a, b) { return a.key - b.key; }).map(function (x) { return x.item; });
    return lines.filter(function (item) {
      var planned = Number(item.amount) || 0;
      if (!(planned > 0)) return false;
      var got = receivedFor(month, item.id);
      if (extraFromTxId) {
        (month.transactions || []).forEach(function (tx) {
          if (tx.id === extraFromTxId && isIncomeTx(tx) && String(tx.incomeId) === String(item.id)) got -= Number(tx.amount) || 0;
        });
      }
      return cents(got) < cents(planned);
    })[0] || null;
  }

  /* v37.5.59.5 (QA): Suggested payee chips narrow as you type (in place, so the field keeps focus). */
  function filterMerchantChips(typed) {
    if (!spendDraft || spendDraft.id || spendDraft.type === "income") return;
    var box = document.querySelector('[data-role="merchant-chips"]');
    if (!box) return;
    var list = filteredPayeeChips(false, typed);
    var wrap = box.querySelector(".merchant-chips");
    if (!wrap) return;
    box.hidden = !list.length;
    wrap.innerHTML = list.map(function (item) {
      return '<button type="button" class="merchant-chip" role="listitem" data-act="spend-merchant-chip" data-payee="' +
        esc(item.payee) + '" title="' + esc(item.payee) + '">' + esc(item.payee) + "</button>";
    }).join("");
  }

  /* Top 7 suggestions; narrowed to names containing what's typed (prefix matches first). */
  function filteredPayeeChips(income, typed) {
    var q = String(typed || "").trim().toLowerCase();
    var all = suggestedPayees(income, 0);
    if (!q) return all.slice(0, 7);
    return all.filter(function (it) {
      return String(it.payee).toLowerCase().indexOf(q) >= 0;
    }).sort(function (a, b) {
      var pa = String(a.payee).toLowerCase().indexOf(q) === 0 ? 0 : 1;
      var pb = String(b.payee).toLowerCase().indexOf(q) === 0 ? 0 : 1;
      return pa - pb;
    }).slice(0, 7);
  }

  function merchantChipsHtml(merchants) {
    if (!merchants || !merchants.length) return "";
    return '<div class="spend-accessory" data-role="merchant-chips">' +
      '<p class="spend-accessory-label">Suggested</p>' +
      '<div class="merchant-chips" role="list">' +
      merchants.map(function (item) {
        return '<button type="button" class="merchant-chip" role="listitem" data-act="spend-merchant-chip" data-payee="' +
          esc(item.payee) + '" title="' + esc(item.payee) + '">' + esc(item.payee) + "</button>";
      }).join("") +
      "</div></div>";
  }

  function remainingChipHtml(month, lineId, excludeTxId) {
    if (!lineId) return "";
    var found = findLine(month, lineId);
    if (!found || !found.line) return "";
    var left = remainingForLine(month, lineId, excludeTxId);
    var name = found.line.name || "envelope";
    var over = left < 0;
    var fill = left > 0 ? left : 0;
    return '<button type="button" class="remaining-chip' + (over ? " over" : "") +
      '" data-act="spend-fill-remaining" data-amount="' + esc(String(fill)) +
      '" aria-label="' + esc(money(left) + " left in " + name + ". Tap to fill amount.") + '">' +
      '<span><span class="rem-label">' + esc(money(left) + " left in " + name) + "</span>" +
      '<span class="rem-hint">Tap to fill amount' + (left <= 0 ? " ($0 when overspent)" : "") + "</span></span>" +
      '<span class="rem-amt mono">' + esc(money(left)) + "</span></button>";
  }

  function spendAmountAccessoryHtml(month, income) {
    if (!spendDraft) return "";
    var chips;
    if (income) {
      chips = suggestedPayees(true, 7);
      if (!chips.length) return "";
      return merchantChipsHtml(chips);
    }
    // v37.5.59.2: merchant chips sit under Payee (merchant first); this accessory is the
    // remaining chip only, and only once an envelope has been chosen (or filled from the merchant).
    var primary = (spendDraft.legs && spendDraft.legs[0]) || null;
    var lineId = primary ? primary.lineId : "";
    return remainingChipHtml(month, lineId, spendDraft.id || "");
  }

  function openSpendSheet(tx, month) {
    if (tx) {
      spendDraft = {
        id: tx.id,
        type: isIncomeTx(tx) ? "income" : "expense",
        incomeId: tx.incomeId || "",
        refundKind: isIncomeTx(tx) ? "" : (gm().normalizeRefundKind ? gm().normalizeRefundKind(tx.refundKind) : ""),
        payee: tx.payee || "",
        date: tx.date,
        note: tx.note || "",
        amount: txTotal(tx),
        legs: isIncomeTx(tx) ? [{
          id: nextId(),
          categoryId: "",
          lineId: "",
          amount: 0,
          refund: 0,
          note: ""
        }] : txLegs(tx).map(function (leg) {
          return {
            id: leg.id || nextId(),
            categoryId: leg.categoryId,
            lineId: leg.lineId,
            amount: Number(leg.amount) || 0,
            refund: Number(leg.refund) || 0,
            note: leg.note || ""
          };
        })
      };
    } else {
      spendDraft = {
        id: "",
        type: "expense",
        // v37.5.59.2 (owner): nothing preselected — no income line, no envelope. The merchant comes first.
        incomeId: "",
        refundKind: "",
        payee: "",
        // v37.5.59.12 (QA M1): viewing the current calendar month → today's date; older months keep day-of-month.
        date: (function () {
          var now = new Date();
          var cur = currentYearMonth();
          if (state.year === cur.year && state.month === cur.month) {
            return isoDate(cur.year, cur.month, now.getDate());
          }
          return isoDate(state.year, state.month, Math.min(now.getDate(), 28));
        })(),
        note: "",
        amount: 0,
        legs: [{
          id: nextId(),
          categoryId: "",
          lineId: "",
          amount: 0,
          refund: 0,
          note: ""
        }]
      };
    }
    renderSpendSheet(month);
  }

  function readSpendDraft(form) {
    if (!form || !spendDraft) return;
    spendDraft.payee = form.payee ? form.payee.value : spendDraft.payee;
    if (form.date) {
      // v37.5.59.12: clearing Date keeps the previous value (empty → today only on first open).
      var typedDate = form.date.value;
      if (typedDate) spendDraft.date = typedDate;
      else if (!spendDraft.date) {
        var td = new Date();
        spendDraft.date = isoDate(td.getFullYear(), td.getMonth() + 1, td.getDate());
      }
      if (form.date.value !== spendDraft.date) form.date.value = spendDraft.date;
    }
    spendDraft.note = form.note ? form.note.value : spendDraft.note;
    if (form.amount) spendDraft.amount = centsFromDigits(form.amount.value);
    if (form.incomeId) spendDraft.incomeId = form.incomeId.value;
    if (form.refundKind) spendDraft.refundKind = form.refundKind.value;
    (spendDraft.legs || []).forEach(function (leg, i) {
      var key = form["legLine" + i];
      var amt = form["legAmount" + i];
      var note = form["legNote" + i];
      var refund = form["legRefund" + i];
      if (key) {
        var parts = String(key.value || "").split(":");
        leg.categoryId = parts[0];
        leg.lineId = parts[1] || "";
      }
      if (amt) leg.amount = centsFromDigits(amt.value);
      if (note) leg.note = note.value;
      if (refund) leg.refund = centsFromDigits(refund.value);
    });
    // v37.5.18: single-envelope path uses Total as the amount entry (EveryDollar); keep leg in sync.
    if (spendDraft.type !== "income" && spendDraft.legs && spendDraft.legs.length === 1) {
      var only = spendDraft.legs[0];
      if ((Number(spendDraft.amount) || 0) > 0) only.amount = Number(spendDraft.amount) || 0;
    }
  }

  function spendTypeToggleHtml(type) {
    return '<div class="tx-type-toggle" role="tablist" aria-label="Transaction type">' +
      [["expense", "Expense"], ["income", "Income"]].map(function (item) {
        var on = type === item[0];
        return '<button type="button" role="tab" data-act="spend-type" data-type="' + item[0] + '"' +
          ' class="' + item[0] + (on ? " on" : "") + '" aria-pressed="' + (on ? "true" : "false") + '">' +
          item[1] + "</button>";
      }).join("") + "</div>";
  }

  function incomeLineOptions(month, selectedId) {
    var html = '<label class="field">Income line<select name="incomeId">';
    var auto = nextOpenIncomeLine(month, spendDraft && spendDraft.id);
    html += '<option value=""' + (!selectedId ? " selected" : "") + ">" +
      esc(auto ? "Next paycheck not fully received (auto · " + (auto.name || "Income") + ")" : "Next paycheck not fully received (auto)") + "</option>";
    (month.incomes || []).forEach(function (item) {
      html += '<option value="' + esc(item.id) + '"' + (String(item.id) === String(selectedId) ? " selected" : "") + ">" +
        esc((item.name || "Income") + " · planned " + money(item.amount) + " · received " + money(receivedFor(month, item.id))) +
        "</option>";
    });
    return html + "</select></label>";
  }

  function refundKindSelectHtml(kind) {
    var opts = [
      ["", "No refund"],
      ["full", "Full refund"],
      ["partial", "Partial refund"],
      ["standalone", "Refund only — money back, no purchase here"]
    ];
    return '<label class="field">Refund<select name="refundKind" data-act="spend-refund">' +
      opts.map(function (o) {
        return '<option value="' + o[0] + '"' + (kind === o[0] ? " selected" : "") + ">" + esc(o[1]) + "</option>";
      }).join("") + "</select></label>";
  }

  /* v37.5.59.5 (QA): a Save error below the fold scrolls into view (and the envelope picker with it). */
  function scrollSheetErrorIntoView() {
    var err = document.querySelector(".sheet-error");
    if (!err) return;
    var target = /envelope/i.test(err.textContent || "") ? (document.querySelector('[name="legLine0"]') || err) : err;
    try { target.scrollIntoView({ block: "center", behavior: "smooth" }); } catch (e) { target.scrollIntoView(); }
    if (target !== err) target.classList.add("needs-pick");
  }

  function renderSpendSheet(month) {
    if (!spendDraft) return;
    var income = spendDraft.type === "income";
    var envErrorShown = false;
    var html = spendTypeToggleHtml(income ? "income" : "expense");
    if (income) {
      html += '<label class="field">From<input name="payee" data-act="spend-payee" type="text" list="payee-suggest" autocomplete="off" placeholder="' + esc(incomePayeePlaceholder()) + '" value="' +
        esc(spendDraft.payee || "") + '"></label>' + payeeDatalistHtml(true) +
        spendAmountAccessoryHtml(month, true) +
        field("Amount", "amount", String(spendDraft.amount), "number") +
        field("Date", "date", spendDraft.date, "date") +
        incomeLineOptions(month, spendDraft.incomeId) +
        field("Note", "note", spendDraft.note || "") +
        '<p class="caption">Income counts toward this line’s Received. Leave the line on auto and it goes to the next paycheck that isn’t fully received. It never counts as spending and doesn’t change envelopes.</p>';
    } else {
      var kind = spendDraft.refundKind || "";
      var split = spendDraft.legs.length > 1;
      var legSum = spendDraft.legs.reduce(function (n, leg) { return n + (Number(leg.amount) || 0); }, 0);
      var mismatch = split && cents(legSum) !== cents(spendDraft.amount);
      // v37.5.59.2 (owner): merchant first — Payee + suggested merchants, then the envelope (never preselected).
      html += '<label class="field">Payee<input name="payee" data-act="spend-payee" type="text" list="payee-suggest" autocomplete="off" placeholder="Store, person, …" value="' +
        esc(spendDraft.payee || "") + '"></label>' + payeeDatalistHtml(false);
      if (!spendDraft.id) {
        // v37.5.59.6 (QA): a re-render (e.g. after picking an envelope) keeps the typed-payee filter.
        var payeeChips = filteredPayeeChips(false, spendDraft.payee);
        if (payeeChips.length) html += merchantChipsHtml(payeeChips);
        else if (suggestedPayees(false, 1).length) html += '<div class="spend-accessory" data-role="merchant-chips" hidden><p class="spend-accessory-label">Suggested</p><div class="merchant-chips" role="list"></div></div>';
      }
      // Primary envelope first; accessory (remaining + chips) sits immediately above Total.
      if (!split) {
        html += '<p class="sheet-label">Envelope</p>' +
          lineOptionsNamed("legLine0", month, spendDraft.legs[0] && spendDraft.legs[0].lineId);
        // v37.5.59.5 (QA): the envelope error sits right under the picker it's about.
        if (spendDraft.error && /envelope/i.test(spendDraft.error)) {
          html += '<p class="caption rust sheet-error">' + esc(spendDraft.error) + "</p>";
          envErrorShown = true;
        }
        html += spendAmountAccessoryHtml(month, false);
        html += field(kind === "standalone" ? "Refund total" : "Total", "amount", String(spendDraft.amount), "number") +
          field("Date", "date", spendDraft.date, "date") +
          field("Note", "note", spendDraft.note || "") +
          refundKindSelectHtml(kind);
        if (kind === "partial") {
          html += field("Refund amount", "legRefund0", String((spendDraft.legs[0] && spendDraft.legs[0].refund) || 0), "number");
        }
        html += field("Optional note", "legNote0", (spendDraft.legs[0] && spendDraft.legs[0].note) || "");
        html += '<button class="planner-apply" type="button" data-act="add-split-leg">Add another envelope</button>';
      } else {
        spendDraft.legs.forEach(function (leg, i) {
          html += '<p class="sheet-label">Split ' + (i + 1) + " envelope</p>" +
            lineOptionsNamed("legLine" + i, month, leg.lineId) +
            field(kind === "standalone" ? "Refund amount" : "Amount", "legAmount" + i, String(leg.amount || 0), "number");
          if (kind === "partial") {
            html += field("Refund piece (this envelope)", "legRefund" + i, String(leg.refund || 0), "number");
          }
          html += field("Optional note", "legNote" + i, leg.note || "");
          html += '<button class="text-btn danger" type="button" data-act="remove-split-leg" data-index="' +
            i + '">Remove this split</button>';
        });
        html += '<button class="planner-apply" type="button" data-act="add-split-leg">Add another envelope</button>';
        // Splits: remaining/chips still track primary (first) leg envelope.
        html += spendAmountAccessoryHtml(month, false);
        html += field(kind === "standalone" ? "Refund total" : "Total", "amount", String(spendDraft.amount), "number") +
          field("Date", "date", spendDraft.date, "date") +
          field("Note", "note", spendDraft.note || "") +
          refundKindSelectHtml(kind);
      }
      if (mismatch) {
        html += '<p class="caption rust">Legs are ' + money(legSum) + ". They must equal " +
          money(spendDraft.amount) + ".</p>";
      } else if (split) {
        html += '<p class="caption">One purchase. Legs sum to ' + money(legSum) + ".</p>";
      }
      if (kind === "full") html += '<p class="caption refund-note">Full refund: every envelope on this purchase nets to $0. Never counts as income.</p>';
      if (kind === "partial") html += '<p class="caption refund-note">Partial refund: the refund piece comes back to that envelope only. Never counts as income.</p>';
      if (kind === "standalone") html += '<p class="caption refund-note">Money back from a store (e.g. a return of last month’s purchase). Lowers that envelope’s spent. Never counts as income.</p>';
      if (spendDraft.mappedFromHistory) {
        html += '<p class="caption merchant-hint">Filled from your history — this merchant has always gone to this envelope. Change anytime.</p>';
      }
    }
    if (spendDraft.error && !envErrorShown) html += '<p class="caption rust sheet-error">' + esc(spendDraft.error) + "</p>";
    if (spendDraft.id) {
      html += '<input type="hidden" name="id" value="' + esc(spendDraft.id) + '">';
      // v37.5.14 (owner): Delete lives at the TOP of the transaction detail, Transactions tab only.
      if (state.tab === "spend") {
        html = '<div class="sheet-top-delete"><button class="danger-btn danger-top" type="button" data-act="delete-spend" data-id="' +
          esc(spendDraft.id) + '">' + TRASH_SVG + '<span>Delete transaction</span></button></div>' + html;
      }
    }
    openSheet(spendDraft.id ? "Edit transaction" : "Add transaction", html, "save-spend-sheet");
  }

  function lineOptionsNamed(name, month, selectedId) {
    var html = '<label class="field">Envelope<select name="' + esc(name) + '" data-act="spend-leg">';
    if (!selectedId) html += '<option value="" selected>Choose envelope…</option>';
    sortedCategories(month).forEach(function (cat) {
      sortedLines(cat).forEach(function (line) {
        html += '<option value="' + esc(cat.id + ":" + line.id) + '"' +
          (line.id === selectedId ? " selected" : "") + ">" +
          esc(cat.name + " · " + line.name) + "</option>";
      });
    });
    return html + "</select></label>";
  }

  function openEditSpend(tx, month) {
    openSpendSheet(tx, month);
  }

  function openQuickSpend(month) {
    captureModalReturnScreenTop();
    quickSpendLineId = "";
    var lines = "";
    sortedCategories(month).forEach(function (cat) {
      sortedLines(cat).forEach(function (line) {
        lines += '<button class="quick-line" type="button" data-act="quick-spend-line" data-id="' + line.id + '">' +
          "<div><span class='env'>" + esc(cat.name) + "</span>" +
          lineNameSpan(line.name) + "</div>" +
          '<span class="check" data-check="' + line.id + '"></span></button>';
      });
    });
    var modal = document.getElementById("modal");
    modal.hidden = false;
    modal.innerHTML =
      '<form class="sheet" data-act="save-quick-spend">' +
      "<h3>Quick spend</h3>" +
      field("Amount", "amount", "", "number") +
      '<p class="sheet-label">Envelope</p>' + lines +
      field("Note", "note", "") +
      '<div class="sheet-actions">' +
      '<button type="button" data-act="close-modal">Cancel</button>' +
      '<button class="primary" type="submit">Done</button></div></form>';
    bindMoneyInputs(modal);
  }

  function paintQuickSpendCheck() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-check]"), function (el) {
      el.textContent = el.getAttribute("data-check") === quickSpendLineId ? "✓" : "";
    });
  }

  /* ---- v37.5.14 delete (Transactions tab only) ----
   * Spec change: no Undo toast. Detail-view Delete (top) and the swipe/hover trash can both go
   * through one confirm, then remove the whole transaction (splits, refund pieces, income link). */
  function findTx(month, txId) {
    var list = month.transactions || [];
    for (var i = 0; i < list.length; i++) if (String(list[i].id) === String(txId)) return list[i];
    return null;
  }

  function confirmDeleteTransaction(month, txId) {
    var tx = findTx(month, txId);
    if (!tx) return false;
    var income = isIncomeTx(tx);
    var what = income ? "income" : "transaction";
    var extras = [];
    if (isSplitTx(tx)) extras.push("its " + txLegs(tx).length + " splits");
    if (!income && tx.refundKind) extras.push("its refund");
    var msg = "Delete " + (tx.payee || what) + " " + money(income ? tx.amount : txTotal(tx)) + "?\n\n" +
      "This removes the whole " + what + (extras.length ? ", including " + extras.join(" and ") : "") +
      ". Totals update right away. This can’t be undone.";
    return window.confirm(msg);
  }

  function deleteTransaction(month, txId) {
    var list = month.transactions || [];
    var index = -1;
    list.forEach(function (item, i) { if (String(item.id) === String(txId)) index = i; });
    if (index < 0) return false;
    list.splice(index, 1);
    saveState();
    render();
    return true;
  }

  /* Plain status toast (no action button); used only for the restore confirmation message. */
  var toastTimer = null;

  function showToast(message, ms) {
    var host = document.getElementById("phone") || document.body;
    var toast = document.getElementById("toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "toast";
      toast.className = "toast";
      toast.setAttribute("role", "status");
      toast.setAttribute("aria-live", "polite");
      host.appendChild(toast);
    }
    toast.innerHTML = '<span class="toast-msg">' + esc(message) + "</span>";
    toast.hidden = false;
    toast.classList.add("on");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(hideToast, ms || 4000);
  }

  function hideToast() {
    var toast = document.getElementById("toast");
    if (toastTimer) { clearTimeout(toastTimer); toastTimer = null; }
    if (toast) {
      toast.classList.remove("on");
      toast.hidden = true;
      toast.innerHTML = "";
    }
  }

  /* Swipe-to-delete on Transactions rows. Horizontal pointer drag only; touch-action: pan-y keeps
   * vertical scrolling native. A drag never opens the edit sheet. */
  var swipeSuppressClick = false;

  function hoverRevealOn() {
    return document.body.classList.contains("mouse-hover");
  }

  /* Hover-reveal of the trash can is for a real mouse only: turn it on when a mouse moves, off on touch/pen. */
  if (window.PointerEvent) {
    document.addEventListener("pointermove", function (e) {
      if (e.pointerType === "mouse") document.body.classList.add("mouse-hover");
    }, { passive: true });
    document.addEventListener("pointerdown", function (e) {
      if (e.pointerType && e.pointerType !== "mouse") document.body.classList.remove("mouse-hover");
    }, { passive: true });
  }

  function bindSwipeRows(screen) {
    if (!screen || !window.PointerEvent) return;
    Array.prototype.forEach.call(screen.querySelectorAll(".tx-swipe"), function (wrap) {
      var row = wrap.querySelector(".tx-row");
      var del = wrap.querySelector(".tx-swipe-delete");
      if (!row || !del) return;
      var startX = 0, startY = 0, dx = 0, dragging = false, decided = false, horizontal = false, pid = null, hoverBase = false;
      var OPEN = -72;
      function setX(x, animate) {
        row.style.transition = animate ? "transform 160ms ease" : "none";
        row.style.transform = x ? "translateX(" + x + "px)" : "";
      }
      function closeOthers() {
        Array.prototype.forEach.call(screen.querySelectorAll(".tx-swipe.open"), function (other) {
          if (other === wrap) return;
          other.classList.remove("open");
          var r = other.querySelector(".tx-row");
          if (r) { r.style.transition = "transform 160ms ease"; r.style.transform = ""; }
          var d = other.querySelector(".tx-swipe-delete");
          if (d) { d.setAttribute("tabindex", "-1"); d.setAttribute("aria-hidden", "true"); }
        });
      }
      row.addEventListener("pointerdown", function (e) {
        if (e.button != null && e.button !== 0) return;
        startX = e.clientX; startY = e.clientY; dx = 0;
        dragging = true; decided = false; horizontal = false; pid = e.pointerId;
      });
      row.addEventListener("pointermove", function (e) {
        if (!dragging || e.pointerId !== pid) return;
        var mx = e.clientX - startX;
        var my = e.clientY - startY;
        if (!decided) {
          if (Math.abs(mx) < 8 && Math.abs(my) < 8) return;
          decided = true;
          horizontal = Math.abs(mx) > Math.abs(my) * 1.3;
          if (!horizontal) { dragging = false; return; }
          try { row.setPointerCapture(pid); } catch (err) {}
          closeOthers();
          // Mouse hover already slid the row to the trash can (desktop Preview); start the drag from there.
          hoverBase = e.pointerType === "mouse" && hoverRevealOn() && wrap.matches(":hover");
          wrap.classList.add("dragging");
        }
        var base = (wrap.classList.contains("open") || hoverBase) ? OPEN : 0;
        dx = Math.max(OPEN - 24, Math.min(0, base + mx));
        setX(dx, false);
      });
      function end(e) {
        if (!dragging || (e && e.pointerId !== pid)) return;
        dragging = false;
        if (!horizontal) return;
        swipeSuppressClick = true;
        setTimeout(function () { swipeSuppressClick = false; }, 350);
        var open = dx < OPEN / 2;
        wrap.classList.remove("dragging");
        wrap.classList.toggle("open", open);
        setX(open ? OPEN : 0, true);
        del.setAttribute("tabindex", open ? "0" : "-1");
        del.setAttribute("aria-hidden", open ? "false" : "true");
      }
      row.addEventListener("pointerup", end);
      row.addEventListener("pointercancel", end);
    });
  }

  function modalSheet() {
    var modal = document.getElementById("modal");
    if (!modal || modal.hidden) return null;
    return modal.querySelector(".sheet");
  }

  function captureSheetUi() {
    var sheet = modalSheet();
    var active = document.activeElement;
    var focus = null;
    if (sheet && active && sheet.contains(active) && active.getAttribute) {
      focus = {
        name: active.getAttribute("name") || "",
        act: active.getAttribute("data-act") || "",
        id: active.getAttribute("data-id") || "",
        field: active.getAttribute("data-field") || "",
        flag: active.getAttribute("data-flag") || "",
        kind: active.getAttribute("data-kind") || "",
        start: active.selectionStart,
        end: active.selectionEnd,
        digits: active.dataset ? active.dataset.digits : "",
        replaceAll: active.dataset ? active.dataset.replaceAll : "",
        value: active.value
      };
    }
    return { top: sheet ? sheet.scrollTop : 0, focus: focus };
  }

  function findSheetFocusEl(sheet, focus) {
    if (!sheet || !focus) return null;
    var nodes = sheet.querySelectorAll("input, select, textarea");
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (focus.act && el.getAttribute("data-act") !== focus.act) continue;
      if (focus.name && el.getAttribute("name") !== focus.name) continue;
      if (focus.id && el.getAttribute("data-id") !== focus.id) continue;
      if (focus.field && el.getAttribute("data-field") !== focus.field) continue;
      if (focus.flag && el.getAttribute("data-flag") !== focus.flag) continue;
      if (focus.kind && el.getAttribute("data-kind") !== focus.kind) continue;
      return el;
    }
    return null;
  }

  function isMoneyInput(el) {
    return !!(el && el.getAttribute && (el.getAttribute("data-dollars") === "1" || el.getAttribute("data-cents") === "1"));
  }

  function restoreSheetUi(ui) {
    var sheet = modalSheet();
    if (!sheet || !ui) return;
    sheet.scrollTop = ui.top || 0;
    var focus = ui.focus;
    if (!focus) return;
    var el = findSheetFocusEl(sheet, focus);
    if (!el) return;
    var money = isMoneyInput(el);
    var estimates = document.getElementById("comp-estimates");
    var moneyOutsideEstimates = money && (!estimates || !estimates.contains(el));
    var alreadyFocused = document.activeElement === el;
    // Re-focus only if we lost it. Mid-edit money fields rely on editingMoneyEl so
    // the focus handler does not re-arm replaceAll when this runs.
    if (!alreadyFocused) el.focus();
    if (el.dataset) {
      if (focus.digits != null) el.dataset.digits = focus.digits;
      // Never restore replaceAll onto live money fields (re-focus arms via focus handler otherwise).
      if (focus.replaceAll != null && !money) {
        el.dataset.replaceAll = focus.replaceAll;
      }
    }
    if (focus.value != null && el.type !== "checkbox" && el.tagName !== "SELECT") {
      if (!money) {
        el.value = focus.value;
      }
    }
    if (el.setSelectionRange && focus.start != null && el.type !== "checkbox" && el.tagName !== "SELECT") {
      if (!(moneyOutsideEstimates && (alreadyFocused || editingMoneyEl === el))) {
        try { el.setSelectionRange(focus.start, focus.end); } catch (err) {}
      }
    }
  }

  /* v37.5.59.5 (QA 37.5.59.4): the Compensation sheet shows the SAME numbers as Stats › Income statement
   * when this year has a confirmed pay stub with YTD columns — same engine (payStubBasisFor + annualMetrics +
   * annualTaxPartDisplay), typed tax lines respected. Returns null when there's no such stub. */
  function compStubFigures() {
    var year = currentYearMonth().year;
    var basis = payStubBasisFor(year);
    if (!basis || !basis.hasYtd || !(basis.grossPay && basis.grossPay.total > 0)) return null;
    var raw = state.annualStatement && state.annualStatement.years && state.annualStatement.years[String(year)];
    var row = annualRow(raw);
    var metrics = annualMetrics(row, year);
    var part = function (id) { return annualTaxPartDisplay(row, id, year); };
    var t = basis.total;
    return {
      year: year, basis: basis, row: row, metrics: metrics,
      gross: roundCents(basis.grossPay.total),
      federal: part("taxFederal"), state: part("taxState"), fica: part("taxFica"), other: part("taxOther"),
      taxes: metrics.taxes, avgTax: metrics.avgTax,
      pretax: basis.pretax,
      employee401k: roundCents(t.e401), employerMatch: roundCents(t.er401), employerBase: roundCents(t.er401Base || 0),
      hsa: roundCents((t.hsa || 0) + (t.erHsa || 0)),
      totalIncome: metrics.total,
      typedTaxes: annualHasTaxParts(row) || row.taxes != null
    };
  }

  function compTrueLineHtml() {
    var r = monthSavingsRates();
    var t = r.trueRate;
    var label = MONTH_NAMES[r.month.month - 1] + " " + r.month.year;
    if (t.state === "ok") {
      return '<p class="caption">True savings rate (' + esc(label) + "): " + gm().formatSavingsRate(t.rate) +
        " — savings envelopes + 401k + employer 401k + HSA ÷ gross pay, from your confirmed pay stubs. Details on Insights.</p>";
    }
    if (t.state === "locked") {
      return '<p class="caption">True savings rate is a Premium feature' + (confirmedPayStubSnapshot() || confirmedPayStubs().length ? " — your pay stub is already confirmed." : " and needs a confirmed pay stub.") + "</p>";
    }
    if (t.noMonthStub) return '<p class="caption">True savings rate: no confirmed pay stub covers ' + esc(label) + " yet.</p>";
    return '<p class="caption">True savings rate (Premium) needs a confirmed pay stub.</p>';
  }

  function compStubSummaryHtml(f) {
    var partRow = function (label, p) {
      return '<div class="row"><span>' + esc(label) + (p.estimate ? ' <span class="caption">est.</span>' : (p.value != null ? ' <span class="caption">typed</span>' : "")) +
        '</span><span class="mono">' + (p.value == null ? "—" : money(p.value)) + "</span></div>";
    };
    return '<div class="comp-headline">' +
      '<div><span class="caption">Basic savings rate</span><strong class="moss">' +
      gm().formatSavingsRate(monthSavingsRates().basic.rate) + "</strong></div>" +
      '<div><span class="caption">Average tax</span><strong>' + rateOrDash(f.avgTax) + "</strong></div>" +
      '<div><span class="caption">Gross pay ' + f.year + '</span><strong class="moss">' + money(f.gross) + "</strong></div></div>" +
      '<p class="caption comp-stub-basis">' + esc(f.year + " from your pay stubs — the same numbers as Stats › Income statement: " + f.basis.short + ".") + "</p>" +
      '<p class="sheet-label">' + f.year + ' from your pay stubs</p>' +
      '<div class="row"><span>Gross pay</span><span class="mono">' + money(f.gross) + "</span></div>" +
      '<div class="row"><span>Pre-tax deductions</span><span class="mono">' + money(f.pretax.total) + "</span></div>" +
      '<p class="caption">401k ' + money(f.pretax.e401) + " · HSA " + money(f.pretax.hsa) + " · FSA " + money(f.pretax.fsa) + " · other pre-tax " + money(f.pretax.otherPre) + " (capped at " + f.year + " IRS limits)</p>" +
      partRow("Federal", f.federal) + partRow("State", f.state) + partRow("FICA", f.fica) +
      (f.other.value != null ? partRow("Other employee taxes", f.other) : "") +
      '<div class="row"><span>Taxes</span><span class="mono">' + (f.taxes == null ? "—" : money(f.taxes)) + "</span></div>" +
      '<div class="row"><span>Average tax</span><span class="mono">' + rateOrDash(f.avgTax) + "</span></div>" +
      '<p class="sheet-label">Personal income statement</p>' +
      '<div class="row"><span>Employee 401k</span><span class="mono">' + money(f.employee401k) + "</span></div>" +
      '<div class="row"><span>Employer 401k</span><span class="mono">' + money(f.employerMatch + f.employerBase) + "</span></div>" +
      (f.employerBase > 0 ? '<p class="caption">Match ' + money(f.employerMatch) + " + base contribution " + money(f.employerBase) + " — employer money, not pay.</p>" : "") +
      '<div class="row"><span>HSA</span><span class="mono">' + money(f.hsa) + "</span></div>" +
      (f.totalIncome != null ? '<div class="row"><span>Total income</span><span class="mono">' + money(f.totalIncome) + "</span></div>" : "") +
      compTrueLineHtml() +
      '<p class="caption">Withholding, not your final tax bill. The fields below are a what-if calculator: they never change these pay-stub numbers.</p>';
  }

  /* v37.5.59.6 (QA): with a confirmed stub, the typed what-if (results AND every typed input) lives inside
   * one collapsed <details> after the stub numbers; the results part repaints in #comp-whatif-est. */
  function compensationEstimateHtml(est) {
    var stubFig = compStubFigures();
    if (stubFig) return compStubSummaryHtml(stubFig);
    return compWhatIfHtml(est, false);
  }

  function compWhatIfHtml(est, secondary) {
    if (secondary) {
      return '<p class="caption">From the Base salary, deductions and ZIP you type below — not your pay stubs.</p>' +
        '<div class="row"><span>Gross / cash pay</span><span class="mono">' + money(est.cashPay) + "</span></div>" +
        '<div class="row"><span>Estimated taxes</span><span class="mono">' + money(est.totalTax) + "</span></div>" +
        '<div class="row"><span>Average tax (what-if)</span><span class="mono">' + rateOrDash(est.effectiveTaxRate) + "</span></div>" +
        '<div class="row"><span>Est. take-home</span><span class="mono moss">' + money(est.takeHome) + "</span></div>" +
        '<div class="row"><span>Suggested paycheck</span><span class="mono">' + money(est.suggestedPaycheck) + "</span></div>" +
        (est.zipHelper ? '<p class="caption">' + esc(est.zipHelper) + " (what-if only — your stubs already include state withholding).</p>" : "");
    }
    var localRow = (est.localTax > 0 || est.localityLabel)
      ? '<div class="row"><span>' + esc(est.localityLabel || "Local") + '</span><span class="mono">' + money(est.localTax) + "</span></div>"
      : "";
    return '<div class="comp-headline">' +
      '<div><span class="caption">Basic savings rate</span><strong class="moss">' +
      gm().formatSavingsRate(monthSavingsRates().basic.rate) + "</strong></div>" +
      '<div><span class="caption">Average tax</span><strong>' + rateOrDash(est.effectiveTaxRate) + "</strong></div>" +
      '<div><span class="caption">Est. take-home</span><strong class="moss">' + money(est.takeHome) + "</strong></div></div>" +
      '<p class="sheet-label">Where your money is going</p>' +
      pieSvg(takeHomeSlices(est), "Add salary to see the take-home split.", "label") +
      '<div class="row"><span>Gross / cash pay</span><span class="mono">' + money(est.cashPay) + "</span></div>" +
      '<div class="row"><span>Federal</span><span class="mono">' + money(est.federalTax) + "</span></div>" +
      '<div class="row"><span>' + esc(est.stateLabel) + '</span><span class="mono">' + money(est.stateTax) + "</span></div>" +
      localRow +
      '<div class="row"><span>FICA</span><span class="mono">' + money(est.fica) + "</span></div>" +
      '<div class="row"><span>Pre-tax deductions</span><span class="mono">' + money(est.preTaxTotal) + "</span></div>" +
      '<div class="row"><span>Post-tax deductions</span><span class="mono">' + money(est.postTaxTotal) + "</span></div>" +
      '<div class="row"><span>Take-home</span><span class="mono moss">' + money(est.takeHome) + "</span></div>" +
      '<p class="sheet-label">Personal income statement</p>' +
      (est.bonus ? '<div class="row"><span>Target bonus</span><span class="mono">' + money(est.bonus) + "</span></div>" : "") +
      '<div class="row"><span>Employee 401k</span><span class="mono">' + money(est.employee401k) + "</span></div>" +
      '<div class="row"><span>Employer 401k</span><span class="mono">' + money(est.employerBase + est.employerMatch) + "</span></div>" +
      '<div class="row"><span>HSA</span><span class="mono">' + money(est.hsa) + "</span></div>" +
      '<div class="row"><span>Total compensation</span><span class="mono">' + money(est.totalCompensation) + "</span></div>" +
      '<p class="sheet-label">Estimated taxes</p>' +
      '<div class="row"><span>Federal</span><span class="mono">' + money(est.federalTax) + "</span></div>" +
      '<div class="row"><span>' + esc(est.stateLabel) + '</span><span class="mono">' + money(est.stateTax) + "</span></div>" +
      localRow +
      '<div class="row"><span>Social Security</span><span class="mono">' + money(est.socialSecurity) + "</span></div>" +
      '<div class="row"><span>Medicare</span><span class="mono">' + money(est.medicare) + "</span></div>" +
      '<div class="row"><span>FICA</span><span class="mono">' + money(est.fica) + "</span></div>" +
      '<div class="row"><span>Estimated taxes</span><span class="mono">' + money(est.totalTax) + "</span></div>" +
      '<div class="row"><span>Suggested paycheck</span><span class="mono">' + money(est.suggestedPaycheck) + "</span></div>" +
      '<p class="caption">Estimates only — not tax advice. Rough federal + state/local from job ZIP + FICA for a ' +
      (filingStatusOf(state.compensation) === "married" ? "married" : "single") + " filer.</p>" +
      '<p class="caption">Basic savings rate = this month’s savings envelopes ÷ take-home (finished months use what you received; the current month uses planned take-home until every paycheck arrives, then what you received).</p>' +
      compTrueLineHtml() +
      (est.zipHelper ? '<p class="caption">' + esc(est.zipHelper) + "</p>" : "");
  }

  function moneyRow(label, name, value) {
    return '<div class="planner-row"><label>' + esc(label) + "</label>" +
      '<input name="' + name + '" class="cents-input" data-dollars="1" data-act="comp-field" inputmode="numeric" autocomplete="off" type="text" value="' +
      esc(money(value)) + '"></div>';
  }

  function incomeSyncSectionHtml() {
    var cfg = incomeSyncCfg();
    var html = '<p class="sheet-label">Income statement sync</p>' +
      '<p class="caption">By default Salary, Bonus (while its month is ahead) and 401k match here feed this year’s income statement. Pay stubs still win once confirmed. Nothing you typed there is changed or deleted.</p>' +
      '<label class="sync-toggle"><input type="checkbox" data-act="sync-toggle" data-line="all"' + (cfg.off ? " checked" : "") + '> Don’t sync from Compensation</label>';
    SYNC_LINES.forEach(function (l) {
      html += '<label class="sync-toggle sync-line"><input type="checkbox" data-act="sync-toggle" data-line="' + l.id + '"' +
        (cfg.lines[l.id] ? " checked" : "") + (cfg.off ? " disabled" : "") + "> Don’t sync " + esc(l.label) + "</label>";
    });
    return html;
  }

  function employerToggleRow(label, valueName, flagName, plan, dollars) {
    var isPercent = !!plan[flagName];
    var value = Number(plan[valueName]) || 0;
    var input = isPercent
      ? '<input name="' + valueName + '" data-act="comp-field" inputmode="decimal" type="text" placeholder="0" value="' +
        esc(value || "") + '">'
      : '<input name="' + valueName + '" class="cents-input" data-dollars="1" data-act="comp-field" inputmode="numeric" autocomplete="off" type="text" value="' +
        esc(money(value)) + '">';
    return '<div class="deduct-row">' +
      '<span class="deduct-name">' + esc(label) +
      (valueName.indexOf("401k") >= 0 ? docCueHtml("k401") : "") +
      "</span>" +
      '<label class="employer-dollar-toggle"><input type="checkbox" data-act="employer-mode" data-flag="' + flagName +
      '" data-value="' + valueName + '"' + (isPercent ? "" : " checked") + "> Enter as $ per year</label>" +
      (isPercent ? '<span class="employer-pct-wrap">' + input + "<span>%</span></span>" : input) +
      '<span class="mono deduct-amt" data-employer-amt="' + valueName + '">' + money(dollars) + "</span></div>";
  }

  function methodOptions(selected, includeNet) {
    var options = [
      ["fixed", "$ / yr"],
      ["percentGross", "% gross"]
    ];
    if (includeNet) options.push(["percentNet", "% net"]);
    return options.map(function (pair) {
      return '<option value="' + pair[0] + '"' + (selected === pair[0] ? " selected" : "") + ">" + pair[1] + "</option>";
    }).join("");
  }

  function deductionValueInput(kind, row) {
    var percent = row.method === "percentGross" || row.method === "percentNet";
    if (percent) {
      return '<input data-act="comp-deduct" data-kind="' + kind + '" data-id="' + esc(row.id) +
        '" data-field="value" inputmode="decimal" type="text" value="' + esc(row.value || 0) + '">';
    }
    return '<input class="cents-input" data-dollars="1" data-act="comp-deduct" data-kind="' + kind +
      '" data-id="' + esc(row.id) + '" data-field="value" inputmode="numeric" autocomplete="off" type="text" value="' +
      esc(money(row.value)) + '">';
  }

  function preTaxRowsHtml(plan, est) {
    var cash = est.cashPay;
    return (plan.preTax || []).map(function (row) {
      return '<div class="deduct-row">' +
        '<span class="deduct-name">' + esc(row.name) +
        (row.id === "401k" ? docCueHtml("k401") + docCueHtml("income") : "") +
        "</span>" +
        '<select data-act="comp-deduct" data-kind="preTax" data-id="' + esc(row.id) + '" data-field="method">' +
        methodOptions(row.method, false) + "</select>" +
        deductionValueInput("preTax", row) +
        '<span class="mono deduct-amt">' + money(deductionAmount(row, cash, 0)) + "</span></div>";
    }).join("");
  }

  function postTaxRowsHtml(plan, est) {
    var net = Math.max(0, est.cashPay - est.preTaxTotal - est.totalTax);
    var rows = (plan.postTax || []).map(function (row) {
      return '<div class="deduct-row posttax">' +
        '<input data-act="comp-deduct" data-kind="postTax" data-id="' + esc(row.id) +
        '" data-field="name" type="text" placeholder="Name" value="' + esc(row.name || "") + '">' +
        '<select data-act="comp-deduct" data-kind="postTax" data-id="' + esc(row.id) + '" data-field="method">' +
        methodOptions(row.method, true) + "</select>" +
        deductionValueInput("postTax", row) +
        '<span class="mono deduct-amt">' + money(deductionAmount(row, est.cashPay, net)) + "</span>" +
        '<button class="text-btn danger" type="button" data-act="remove-post-tax" data-id="' +
        esc(row.id) + '">Remove</button></div>';
    }).join("");
    return rows + '<button class="planner-apply" type="button" data-act="add-post-tax">Add another</button>';
  }

  function incomeStatementSheetHtml(plan) {
    plan = migrateCompensation(plan);
    var est = estimateCompensation(plan);
    var resolved = resolveZip(plan.zipCode);
    var locationCaption = est.zipHelper
      ? est.zipHelper
      : (resolved.location
        ? (resolved.location.locality
          ? resolved.location.locality.name + ", " + resolved.location.stateName
          : resolved.location.stateName)
        : "Add ZIP for state tax");
    var stubMode = !!compStubFigures();
    return '<div class="sheet income-sheet">' +
      '<div class="income-sheet-head">' +
      '<button class="icon-btn income-back" type="button" data-act="close-modal" aria-label="Back">' +
      '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6 L9 12 L15 18"></path></svg></button>' +
      '<h3>Compensation</h3><span class="income-sheet-spacer" aria-hidden="true"></span></div>' +
      '<p class="caption">' + (compStubFigures()
        ? "Your confirmed pay stubs set these numbers — the same as Stats › Income statement. The fields below are a what-if and only take over when there’s no stub. Budget paycheck $ stays manual unless you opt in below."
        : "Type compensation here. Estimates update as you go. Budget paycheck $ stays manual unless you opt in below.") + "</p>" +
      '<div id="comp-estimates">' + compensationEstimateHtml(est) + "</div>" +
      (stubMode
        ? '<details class="comp-whatif" id="comp-whatif"' + (compWhatIfOpen ? " open" : "") + '><summary class="sheet-label">What-if from typed compensation</summary>' +
          '<div id="comp-whatif-est">' + compWhatIfHtml(est, true) + "</div>"
        : "") +
      '<p class="sheet-label">Compensation · per year</p>' +
      '<p class="caption annual-note">Every dollar amount on this screen is a yearly (annual) total, not per paycheck. Per-paycheck figures are only the suggested paycheck below.</p>' +
      moneyRow("Base salary (per year)", "baseSalary", plan.baseSalary) +
      '<div class="planner-row"><label>Bonus target (% of base salary)</label>' +
      '<input name="bonusTargetPercent" data-act="comp-field" inputmode="decimal" type="text" value="' +
      esc(plan.bonusTargetPercent || 0) + '"></div>' +
      incomeSyncSectionHtml() +
      '<p class="sheet-label">Employer · per year</p>' +
      employerToggleRow("Employer 401k base", "employer401kBase", "employer401kBaseIsPercent", plan, est.employerBase) +
      employerToggleRow("Employer 401k match", "employer401kMatch", "employer401kMatchIsPercent", plan, est.employerMatch) +
      '<p class="caption">Percent is of yearly pay; dollars are a yearly total. Employer 401k is compensation, not an employee pre-tax row.</p>' +
      '<p class="sheet-label">Pre-tax deductions · per year</p>' +
      '<div class="deduct-head"><span>Name</span><span>Method</span><span>Amount</span><span>Per year</span></div>' +
      preTaxRowsHtml(plan, est) +
      '<div class="row"><span>Pre-tax total (per year)</span><span class="mono" id="pretax-total">' + money(est.preTaxTotal) + "</span></div>" +
      '<p class="caption">Each row is a yearly $ total or a % of yearly gross (defaults $0 / 0%). Not per paycheck. 401k is a percent of gross unless you switch it. Pre-tax reduces taxable income.</p>' +
      '<p class="sheet-label">Post-tax deductions · per year</p>' +
      '<p class="caption">Roth 401(k), voluntary life, short-term disability. Yearly $ total, % of yearly gross, or % of yearly net. Not per paycheck.</p>' +
      postTaxRowsHtml(plan, est) +
      '<div class="row"><span>Post-tax total (per year)</span><span class="mono" id="posttax-total">' + money(est.postTaxTotal) + "</span></div>" +
      '<p class="sheet-label">Job location</p>' +
      '<div class="planner-row"><label>Job location ZIP</label>' +
      '<input name="zipCode" data-act="comp-field" inputmode="numeric" type="text" value="' +
      esc(plan.zipCode || "") + '"></div>' +
      '<p class="caption">' + esc(locationCaption) + ". Empty ZIP means no state or local tax. Not tax advice.</p>" +
      (stubMode ? "</details>" : "") +
      '<p class="sheet-label">Budget paycheck $</p>' +
      '<p class="caption">Pay frequency lives on Profile and is only used here when you tap Suggest paycheck. Budget paycheck $ is never auto-written.</p>' +
      '<button class="planner-apply" type="button" data-act="suggest-paycheck">Suggest paycheck amount</button>' +
      '<p class="caption">Optional and opt-in. Sets each existing paycheck on this month to estimated take-home ÷ paychecks per year. Dates stay.</p>' +
      '<div class="sheet-actions"><button type="button" data-act="close-modal">Done</button></div></div>';
  }

  function openIncomeStatement(opts) {
    opts = opts || {};
    if (!opts.preserveScroll) captureModalReturnScreenTop();
    var ui = opts.preserveScroll ? captureSheetUi() : null;
    var plan = migrateCompensation(state.compensation || defaultCompensation());
    state.compensation = plan;
    var modal = document.getElementById("modal");
    var openWhatIf = document.getElementById("comp-whatif");
    compWhatIfOpen = opts.preserveScroll && openWhatIf ? openWhatIf.open : false;
    modal.hidden = false;
    modal.innerHTML = incomeStatementSheetHtml(plan);
    bindMoneyInputs(modal);
    if (opts.preserveScroll) {
      restoreSheetUi(ui);
      requestAnimationFrame(function () { restoreSheetUi(ui); });
    }
  }

  function paintCompensationEstimates() {
    var root = document.getElementById("comp-estimates");
    if (!root) return;
    var ui = captureSheetUi();
    var active = document.activeElement;
    var keepMoneyFocus = isMoneyInput(active) && !root.contains(active);
    var paintEst = estimateCompensation(state.compensation);
    root.innerHTML = compensationEstimateHtml(paintEst);
    var whatIfRoot = document.getElementById("comp-whatif-est");
    if (whatIfRoot) whatIfRoot.innerHTML = compWhatIfHtml(paintEst, true);
    refreshDeductionTotals(state.compensation);
    if (keepMoneyFocus && document.activeElement === active) {
      var sheet = modalSheet();
      if (sheet && ui) sheet.scrollTop = ui.top || 0;
      if (ui && ui.focus && active.dataset && ui.focus.digits != null) {
        active.dataset.digits = ui.focus.digits;
      }
      return;
    }
    restoreSheetUi(ui);
    requestAnimationFrame(function () { restoreSheetUi(ui); });
  }

  function updateCompensationFromElement(el) {
    var plan = migrateCompensation(state.compensation || defaultCompensation());
    var name = el.getAttribute("name");
    if (!name) return;
    var value = el.value;
    if (el.getAttribute("data-cents") === "1") {
      value = el.dataset.digits != null && el.dataset.digits !== ""
        ? moneyFromDigits(el.dataset.digits, false)
        : centsFromDigits(value);
    } else if (el.getAttribute("data-dollars") === "1") {
      value = el.dataset.digits != null && el.dataset.digits !== ""
        ? moneyFromDigits(el.dataset.digits, true)
        : dollarsFromDigits(value);
    }
    else if (name === "paychecksPerYear") value = Number(value) || 26;
    else if (name === "zipCode") value = String(value || "");
    else if (name === "bonusTargetPercent") value = Number(value) || 0;
    else if (name === "employer401kBase" || name === "employer401kMatch") {
      if (el.getAttribute("data-dollars") === "1") value = dollarsFromDigits(value);
      else value = Number(value) || 0;
    }
    plan[name] = value;
    state.compensation = plan;
    saveState();
    paintCompensationEstimates();
  }

  function findDeduction(plan, kind, id) {
    var list = kind === "postTax" ? plan.postTax : plan.preTax;
    return (list || []).filter(function (row) { return row.id === id; })[0];
  }

  function updateDeductionFromElement(el) {
    var plan = migrateCompensation(state.compensation || defaultCompensation());
    var kind = el.getAttribute("data-kind");
    var id = el.getAttribute("data-id");
    var field = el.getAttribute("data-field");
    var row = findDeduction(plan, kind, id);
    if (!row || !field) return;
    var rebuild = field === "method";
    if (field === "name") {
      row.name = el.value;
    } else if (field === "method") {
      row.method = el.value || "fixed";
    } else if (field === "value") {
      if (el.getAttribute("data-dollars") === "1") {
        row.value = el.dataset.digits != null && el.dataset.digits !== ""
          ? moneyFromDigits(el.dataset.digits, true)
          : dollarsFromDigits(el.value);
      } else {
        row.value = Number(el.value) || 0;
      }
    }
    if (row.id === "401k") {
      plan.employee401kValue = row.value;
      plan.employee401kIsPercent = row.method !== "fixed";
    }
    if (row.id === "hsa") plan.hsaDeferral = row.value;
    state.compensation = plan;
    saveState();
    if (rebuild) openIncomeStatement({ preserveScroll: true });
    else {
      paintCompensationEstimates();
      refreshDeductionTotals(plan);
    }
  }

  function refreshDeductionTotals(plan) {
    var est = estimateCompensation(plan);
    var modal = document.getElementById("modal");
    if (!modal || modal.hidden) return;
    Array.prototype.forEach.call(modal.querySelectorAll(".deduct-row"), function (node) {
      var input = node.querySelector("[data-field='value']") || node.querySelector("[data-field='method']");
      if (!input) return;
      var row = findDeduction(plan, input.getAttribute("data-kind"), input.getAttribute("data-id"));
      var amt = node.querySelector(".deduct-amt");
      if (row && amt) {
        var net = Math.max(0, est.cashPay - est.preTaxTotal - est.totalTax);
        amt.textContent = money(deductionAmount(row, est.cashPay, net));
      }
    });
    var pretaxTotal = document.getElementById("pretax-total");
    var posttaxTotal = document.getElementById("posttax-total");
    if (pretaxTotal) pretaxTotal.textContent = money(est.preTaxTotal);
    if (posttaxTotal) posttaxTotal.textContent = money(est.postTaxTotal);
    var matchAmt = modal.querySelector("[data-employer-amt='employer401kMatch']");
    var baseAmt = modal.querySelector("[data-employer-amt='employer401kBase']");
    if (matchAmt) matchAmt.textContent = money(est.employerMatch);
    if (baseAmt) baseAmt.textContent = money(est.employerBase);
  }

  function addPostTaxRow() {
    var plan = migrateCompensation(state.compensation || defaultCompensation());
    plan.postTax.push({ id: nextId(), name: "", method: "fixed", value: 0 });
    state.compensation = plan;
    saveState();
    openIncomeStatement({ preserveScroll: true });
  }

  function removePostTaxRow(id) {
    var plan = migrateCompensation(state.compensation || defaultCompensation());
    plan.postTax = (plan.postTax || []).filter(function (row) { return row.id !== id; });
    state.compensation = plan;
    saveState();
    openIncomeStatement({ preserveScroll: true });
  }

  function suggestPaycheckAmount() {
    var month = ensureMonth(state.year, state.month);
    var est = estimateCompensation(state.compensation);
    var paychecks = (month.incomes || []).filter(function (item) {
      return isPaycheckName(item.name);
    });
    if (!paychecks.length) {
      window.alert("Add a paycheck on Budget first. This never writes unless you choose it.");
      return;
    }
    if (!window.confirm(
      "Set each existing Budget paycheck on this month to " + money(est.suggestedPaycheck) +
        "? Dates stay. Amounts stay manual unless you choose this."
    )) {
      return;
    }
    paychecks.forEach(function (item) { item.amount = est.suggestedPaycheck; });
    saveState();
    window.alert(
      "Set " + (paychecks.length === 1 ? "1 paycheck" : paychecks.length + " paychecks") +
        " to " + money(est.suggestedPaycheck) + ". Dates were left alone."
    );
  }

  function profileZipHelper() {
    var resolved = resolveZip(state.compensation && state.compensation.zipCode);
    if (resolved.helper) return resolved.helper;
    if (resolved.location) {
      return resolved.location.locality
        ? resolved.location.locality.name + ", " + resolved.location.stateName
        : resolved.location.stateName;
    }
    return "Add ZIP for state tax";
  }

  function paintProfileZipHelper() {
    var el = document.getElementById("profile-zip-helper");
    if (el) el.textContent = profileZipHelper() + ". Empty ZIP means no state or local tax.";
  }

  function openProfile(opts) {
    opts = opts || {};
    if (!opts.preserveScroll) captureModalReturnScreenTop();
    var ui = opts.preserveScroll ? captureSheetUi() : null;
    if (opts.highlightDocId) profileHighlightDocId = opts.highlightDocId;
    mattersReturnToProfile = false;
    state.profile = migrateProfile(state.profile, state.foo, state.compensation);
    state.foo = migrateFoo(state.foo);
    state.compensation = migrateCompensation(state.compensation || defaultCompensation());
    var profile = state.profile;
    var plan = state.compensation;
    var freq = payFrequencyOf(plan);
    var filing = filingStatusOf(plan);
    var html =
      '<div class="sheet profile-sheet">' +
      '<div class="sheet-head"><h3>Profile</h3>' +
      '<button class="sheet-close" type="button" data-act="close-modal" aria-label="Close">×</button></div>' +
      '<p class="caption">Paper on the books. Name can appear on Insights. Birthday drives Accumulation age and whether a loan is Step 3 or Step 9 of the order of operations. Age is never invented.</p>' +
      '<p class="profile-section">Basics</p>' +
      '<label class="field">Name' +
      '<input data-act="profile-name" type="text" autocomplete="name" value="' +
      esc(profile.name || "") + '" placeholder="Your name"></label>' +
      '<label class="field">Phone' +
      '<input data-act="profile-phone" type="tel" autocomplete="tel" inputmode="tel" value="' +
      esc(profile.phone || "") + '" placeholder="(555) 010-0100"></label>' +
      '<p class="caption">Stored on device for a future OTP. No SMS in this preview.</p>' +
      '<p class="profile-section">Plan</p>' +
      '<p class="plan-test-label" id="plan-test-label">Test mode: Premium is free during testing.</p>' +
      '<div class="plan-toggle" role="tablist" aria-labelledby="plan-test-label">' +
      '<button type="button" data-act="set-plan" data-plan="free"' +
      (!isPremium() ? ' class="on" aria-pressed="true"' : ' aria-pressed="false"') + ">Free</button>" +
      '<button type="button" data-act="set-plan" data-plan="premium"' +
      (isPremium() ? ' class="on" aria-pressed="true"' : ' aria-pressed="false"') + ">Premium</button></div>" +
      '<p class="caption">Free keeps Insights lite. Premium unlocks full compare, trends, auto-categorize, insurance detail, and Wrapped.</p>' +
      '<label class="field">Birthday' +
      '<input data-act="profile-birthday" type="date" min="1920-01-01" max="' +
      esc(isoDate(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate())) +
      '" value="' + esc(birthdayISO()) + '"></label>' +
      '<p class="caption">Used for Accumulation and high-interest debt steps. Until set, those stay omitted — never invented.</p>' +
      '<label class="settings-toggle">Dark mode' +
      '<input type="checkbox" data-act="toggle-night"' + (state.nightLedger ? " checked" : "") + "></label>" +
      '<p class="caption">Darkens the paper books.</p>' +
      '<label class="field">Pay frequency' +
      '<select data-act="profile-pay-frequency">' +
      PAY_FREQUENCIES.map(function (item) {
        return '<option value="' + item.id + '"' + (freq === item.id ? " selected" : "") + ">" +
          esc(item.label) + "</option>";
      }).join("") +
      "</select></label>" +
      '<p class="caption">Used only for Suggest paycheck. Never auto-writes Budget paycheck $.</p>' +
      '<p class="profile-section">Household / demographics</p>' +
      '<label class="field">ZIP' +
      '<input data-act="profile-zip" name="zipCode" inputmode="numeric" type="text" value="' +
      esc(plan.zipCode || "") + '"></label>' +
      '<p class="caption" id="profile-zip-helper">' + esc(profileZipHelper()) +
      ". Empty ZIP means no state or local tax.</p>" +
      '<label class="field">Filing status' +
      '<select data-act="profile-filing">' +
      '<option value="single"' + (filing === "single" ? " selected" : "") + ">Single</option>" +
      '<option value="married"' + (filing === "married" ? " selected" : "") + ">Married</option>" +
      "</select></label>" +
      '<label class="field">Dependents' +
      '<input data-act="profile-dependents" inputmode="numeric" type="number" min="0" step="1" value="' +
      esc(profile.dependents || 0) + '"></label>' +
      profileDocumentsHtml(profile) +
      '<button class="matters-btn profile-door" type="button" data-act="open-matters">What matters / Go deeper</button>' +
      '<p class="caption">Insights stays the grade. This is the door into the survey.</p>' +
      profileSharingHtml() +
      profileDataHtml() +
      '<button class="data-btn about-door" type="button" data-act="open-about"><strong>About &amp; Privacy</strong><span class="caption">Backups · what’s stored · tester sharing · version ' + esc(APP_VERSION) + '</span></button>' +
      '<div class="profile-danger" id="profile-danger">' +
      '<p class="caption">Danger zone</p>' +
      '<button class="text-btn danger" type="button" data-act="erase-all">Erase all my data</button>' +
      '<p class="caption">Deletes every month, transaction, Net Worth year, Vault document, and setting on this device. Asks first; can’t be undone.</p>' +
      '<button class="text-btn danger" type="button" data-act="reset-spend">Clear this month\'s spending</button>' +
      '<p class="caption">Removes expenses and refunds. Envelope names, assigned amounts, paychecks, and Income transactions stay. Asks first; can’t be undone.</p>' +
      '<button class="text-btn danger" type="button" data-act="restore">Restore sample data</button>' +
      '<p class="caption">Buried on purpose. Replaces everything with the sample seed. Asks first.</p>' +
      "</div>" +
      '<div class="sheet-actions"><button type="button" data-act="close-modal">Done</button></div></div>';
    var modal = document.getElementById("modal");
    modal.hidden = false;
    modal.innerHTML = html;
    if (!opts.preserveScroll) armSheetA11y(modal);
    if (opts.preserveScroll) {
      restoreSheetUi(ui);
      requestAnimationFrame(function () { restoreSheetUi(ui); });
    }
    if (profileHighlightDocId) {
      var row = modal.querySelector('[data-doc-row="' + profileHighlightDocId + '"]');
      if (row) {
        row.classList.add("is-highlight");
        if (row.scrollIntoView) row.scrollIntoView({ block: "nearest" });
      }
      if (opts.openDoc) openStoredDocument(profileHighlightDocId);
    }
  }

  /* ---- v37.5.15 Welcome survey, guided setup, Budget checklist, demo opt-in ----
   * A brand-new device (no saved Paper Trail data) opens the welcome survey instead of sample data.
   * Existing saved data never sees the survey (loadState marks it done). Sample data is only the opt-in
   * "Show me a demo" on the welcome screen, offered only while there is no real data. */
  var ONBOARD_PAY_CHOICES = [
    { id: "weekly", label: "Weekly", sub: "Every week", perMonth: 4 },
    { id: "biweekly", label: "Every two weeks", sub: "Biweekly", perMonth: 2 },
    { id: "semimonthly", label: "Twice a month", sub: "Semi-monthly, e.g. the 1st and 15th", perMonth: 2 },
    { id: "monthly", label: "Monthly", sub: "Once a month", perMonth: 1 }
  ];
  var BLANK_WORTH_LINES = [
    { name: "Checking", kind: "asset", group: "cash" },
    { name: "Savings", kind: "asset", group: "cash" },
    { name: "401k", kind: "asset", group: "retirement" },
    { name: "IRA", kind: "asset", group: "retirement" },
    { name: "Brokerage", kind: "asset", group: "taxable" },
    { name: "Home", kind: "asset", group: "realEstate" },
    { name: "Car", kind: "asset", group: "realEstate" },
    { name: "Credit cards", kind: "liability", group: "debt" },
    { name: "Student loans", kind: "liability", group: "debt" },
    { name: "Car loan", kind: "liability", group: "debt" },
    { name: "Mortgage", kind: "liability", group: "debt" }
  ];

  function blankWorth(year) {
    var lines = BLANK_WORTH_LINES.map(function (spec, index) {
      var amounts = {};
      amounts[year] = 0;
      var additions = {};
      additions[year] = 0;
      return {
        id: nextId(), name: spec.name, kind: spec.kind, group: spec.group, sortOrder: index,
        amounts: amounts, additions: additions, employerMatch: {}, employerBase: {},
        loanBalance: 0, loanApr: 0, loanMinPayment: 0, loanOriginalBalance: 0,
        loanDebtType: /student/i.test(spec.name) ? "student" : ""
      };
    });
    return { years: [year], notes: {}, lines: lines, income: {}, blank: true };
  }

  /* Empty books for a new person: $0 envelopes (default names), one $0 paycheck, a $0 Net Worth year.
   * Nothing is invented: no salary, no balances, no transactions. */
  function blankState() {
    var s = freshState();
    var cur = currentYearMonth();
    var templates = DEFAULT_ENVELOPES.map(function (name) {
      return { name: name, lineNames: defaultLineNames(name) };
    });
    s.months = {};
    s.months[ymKey(cur.year, cur.month)] = emptyMonth(cur.year, cur.month, templates);
    s.worth = blankWorth(cur.year);
    s.worthYear = cur.year;
    s.worthScrubYear = cur.year;
    s.incomeYear = cur.year;
    s.annualStatement = emptyAnnualStatement();
    s.compensation = defaultCompensation();
    s.compensation.baseSalary = 0;
    s._sampleAnnualMigrated = true;
    s.onboarding = {
      status: "survey",
      screen: "welcome",
      answers: { name: "", payFrequency: "", birthday: "" },
      needsWorth: true,
      skipped: {},
      hidden: false,
      demo: false
    };
    return s;
  }

  function migrateOnboarding(raw) {
    // Saved data without an onboarding record = an existing user: never show the survey or checklist.
    if (!raw || typeof raw !== "object") return { status: "done", legacy: true, skipped: {} };
    var ob = raw;
    if (ob.status !== "survey" && ob.status !== "active" && ob.status !== "done") ob.status = "done";
    if (!ob.answers || typeof ob.answers !== "object") ob.answers = { name: "", payFrequency: "", birthday: "" };
    if (!Array.isArray(ob.answers.decide)) ob.answers.decide = [];
    if (ob.answers.needToSee != null) delete ob.answers.needToSee;
    delete ob.answers.wants;
    delete ob.answers.fears;
    var primaryOk = { significance: 1, approval: 1, acceptance: 1 };
    var secondaryOk = { intelligence: 1, pity: 1, strength: 1 };
    if (!primaryOk[ob.answers.primaryNeed]) ob.answers.primaryNeed = "";
    if (!secondaryOk[ob.answers.secondaryNeed]) ob.answers.secondaryNeed = "";
    if (ob.answers.primaryNeed && ob.answers.secondaryNeed) {
      ob.answers.needs = { primary: ob.answers.primaryNeed, secondary: ob.answers.secondaryNeed };
    } else if (ob.answers.needs != null) {
      delete ob.answers.needs;
    }
    if (ob.screen === "see") ob.screen = "wants";
    if (onboardFlow(ob).indexOf(ob.screen) < 0) ob.screen = onboardFlow(ob)[0];
    if (!ob.skipped || typeof ob.skipped !== "object") ob.skipped = {};
    ob.hidden = !!ob.hidden;
    ob.demo = !!ob.demo;
    return ob;
  }

  function onboarding() {
    state.onboarding = migrateOnboarding(state.onboarding);
    return state.onboarding;
  }

  function worthHasData(worth) {
    var book = worth || state.worth || {};
    return (book.lines || []).some(function (line) {
      return Object.keys(line.amounts || {}).some(function (y) { return (Number(line.amounts[y]) || 0) !== 0; });
    });
  }

  /* "Real data" = anything a person typed that a demo would overwrite. A name alone doesn't count. */
  function hasRealData() {
    if (onboarding().demo) return false;
    var months = state.months || {};
    var any = Object.keys(months).some(function (key) {
      var m = months[key];
      if (!m) return false;
      if ((m.transactions || []).length) return true;
      if ((m.incomes || []).some(function (i) { return (Number(i.amount) || 0) !== 0; })) return true;
      return (m.categories || []).some(function (c) { return catAssigned(c) !== 0; });
    });
    if (any) return true;
    if (worthHasData()) return true;
    if (state.profile && (state.profile.documents || []).length) return true;
    return false;
  }

  function onboardPayChoice(id) {
    return ONBOARD_PAY_CHOICES.filter(function (c) { return c.id === id; })[0] || null;
  }

  /* Checklist status (auto): budget done when this month's Left to assign is exactly $0 with income > 0;
   * Vault done with ≥1 document (or skipped — it's optional); Net Worth done once any balance is entered. */
  function onboardSteps() {
    var ob = onboarding();
    var month = ensureMonth(state.year, state.month);
    var t = sums(month);
    var budgetDone = Object.keys(state.months || {}).some(function (key) {
      var m = state.months[key];
      return m && sums(m).stamped;
    });
    var docs = (state.profile && state.profile.documents) || [];
    var steps = [
      {
        id: "budget", n: 1, title: "Build your first budget",
        done: budgetDone,
        skipped: !!ob.skipped.budget && !budgetDone,
        hint: budgetDone ? "Every dollar has a job."
          : t.income > 0
            ? (t.leftover < 0
              /* v37.5.59: negative = envelopes add up to more than planned take-home. Say so plainly. */
              ? "Assigned " + money(-t.leftover) + " more than planned take-home — trim envelopes until Left to assign reads $0.00."
              : "Left to assign " + money(t.leftover) + " — give every dollar a job until it reads $0.00.")
            : "Add your take-home pay under Income, then assign it to envelopes."
      },
      {
        id: "vault", n: 2, title: "Add documents to your Vault",
        optional: true,
        done: docs.length > 0,
        skipped: !!ob.skipped.vault && !docs.length,
        hint: docs.length ? docs.length + (docs.length === 1 ? " document saved." : " documents saved.")
          : ob.skipped.vault ? "Skipped — optional. Add loans, insurance, or a pay stub anytime."
          : "Optional: loans, insurance, a pay stub."
      }
    ];
    if (ob.needsWorth !== false) {
      var nwDone = worthHasData();
      steps.push({
        id: "worth", n: 3, title: "Your first Net Worth statement",
        done: nwDone,
        skipped: !!ob.skipped.worth && !nwDone,
        hint: nwDone ? "Statement started. Update it once a year."
          : "List what you own and what you owe — about five minutes."
      });
    }
    return steps;
  }

  function onboardProgress() {
    var steps = onboardSteps();
    var resolved = steps.filter(function (s) { return s.done || (s.optional && s.skipped); }).length;
    var done = steps.filter(function (s) { return s.done; }).length;
    return { steps: steps, done: done, resolved: resolved, total: steps.length, complete: resolved === steps.length };
  }

  function onboardChecklistHtml() {
    var ob = onboarding();
    if (ob.status !== "active" || ob.hidden) return "";
    var p = onboardProgress();
    var pct = p.total ? Math.round((p.resolved / p.total) * 100) : 0;
    var html = '<section class="card onboard-checklist" aria-label="Setup checklist">' +
      '<div class="onboard-check-head"><p class="kicker">' + (p.complete ? "You’re set up" : "Get set up") + "</p>" +
      '<span class="caption mono">' + p.resolved + " of " + p.total + "</span></div>" +
      '<div class="onboard-bar" role="progressbar" aria-valuemin="0" aria-valuemax="' + p.total + '" aria-valuenow="' +
      p.resolved + '"><i style="width:' + pct + '%"></i></div>';
    p.steps.forEach(function (s) {
      var mark = s.done ? "✓" : (s.optional && s.skipped ? "–" : String(s.n));
      html += '<div class="onboard-step' + (s.done ? " is-done" : "") + (s.skipped ? " is-skipped" : "") + '">' +
        '<span class="onboard-mark" aria-hidden="true">' + mark + "</span>" +
        '<div class="onboard-step-copy"><div class="name">' + esc(s.title) +
        (s.optional ? ' <span class="caption">(optional)</span>' : "") + "</div>" +
        '<span class="caption">' + esc(s.hint) + "</span></div>" +
        (s.done ? '<span class="caption onboard-state">Done</span>' : "") +
        "</div>";
    });
    if (p.complete) {
      html += '<p class="caption">Every step is done. Nice work.</p>' +
        '<button class="planner-apply" type="button" data-act="ob-dismiss">Dismiss checklist</button>';
    } else {
      html += '<button class="text-btn onboard-hide" type="button" data-act="ob-hide">Hide</button>';
    }
    return html + "</section>";
  }

  function demoBannerHtml() {
    var ob = onboarding();
    if (!ob.demo || ob.legacy) return "";
    return '<section class="card demo-banner"><p class="kicker">Demo data</p>' +
      "<p>You’re looking around with sample numbers. None of it is yours.</p>" +
      '<button class="planner-apply" type="button" data-act="ob-leave-demo">Start my own budget</button></section>';
  }

  /* v37.5.37 yearly survey. One question per screen. Compare shows only after a prior completion. */
  function hasPriorSurvey(ob) {
    return !!(ob && (ob.surveyCompletedAt || ob.surveyYear));
  }

  /* ---- Welcome pages (two minimal screens, first launch only) ----------------------------------
     UPDATE STAT COPY HERE. Every figure is quoted from the source's own wording; keep the source name
     and year in `cap`, keep captions country-neutral, and keep the "association, not cause" note.
     Verified 2026-10: FCAC Canadian Financial Capability Survey 2019 (canada.ca, 45% vs 58% card balance,
     65% vs 39% emergency savings); Howard/Sussman/Hardisty/Lukas, Journal of Marketing Research 2022
     (monthly spend predicted $2,276.74 vs actual $2,693.51 = 15.5% lower); Peetz & Davydenko, J. Exp.
     Social Psychology 2021 (personal-strategy group spent an average $236 less in Study 2, $228 in Study 1);
     Long Angle 2026 High-Net-Worth Financial Products Report (72% track portfolio/net worth, 62% budget). */
  var WELCOME_SEEN_KEY = "PaperTrail.welcomeSeen";
  var WELCOME_PAGES = {
    welcome: {
      kicker: "Welcome to Paper Trail!",
      title: "People who don’t track tend to fare worse.",
      cta: "See the difference",
      stats: [
        ["15.5%", "less than people actually spent: predicted vs. actual monthly spending · Journal of Marketing Research, 2022"],
        ["58%", "of people too time-pressed or overwhelmed to budget carry a credit-card balance, vs. 45% of budgeters · FCAC Financial Capability Survey, 2019"],
        ["39%", "of those same people have emergency savings, vs. 65% of budgeters · FCAC Financial Capability Survey, 2019"]
      ]
    },
    welcome2: {
      kicker: "",
      title: "People who track tend to do better.",
      cta: "Continue",
      stats: [
        ["72%", "of high-net-worth respondents track a portfolio or net worth · Long Angle survey, 2026"],
        ["62%", "of high-net-worth respondents track a budget · Long Angle survey, 2026"],
        ["$236", "less spent in a month, on average, by adults who wrote down their own spending self-control strategies, vs. a comparison group · Peetz & Davydenko, 2021"]
      ]
    }
  };

  function welcomeSeen() {
    try { return localStorage.getItem(WELCOME_SEEN_KEY) === "1"; } catch (err) { return true; }
  }

  function markWelcomeSeen() {
    try { localStorage.setItem(WELCOME_SEEN_KEY, "1"); } catch (err) {}
  }

  function welcomeCardsHtml(page) {
    return page.stats.map(function (st, i) {
      return '<div class="welcome-stat" style="animation-delay:' + (i * 90) + 'ms"><span class="welcome-num">' + esc(st[0]) +
        '</span><span class="welcome-cap">' + esc(st[1]) + "</span></div>";
    }).join("");
  }

  /* Profile › About & Privacy › "Replay intro" */
  function openIntroSheet() {
    captureModalReturnScreenTop();
    var html = '<div class="sheet about-sheet intro-sheet">';
    ["welcome", "welcome2"].forEach(function (k) {
      var pg = WELCOME_PAGES[k];
      html += '<h3>' + esc(pg.title) + '</h3><div class="welcome-stats">' + welcomeCardsHtml(pg) + "</div>";
    });
    html += '<p class="welcome-note">Surveys show association, not cause.</p>' +
      '<div class="sheet-actions"><button type="button" data-act="about-back">Back</button>' +
      '<button class="primary" type="button" data-act="close-modal">Done</button></div></div>';
    var modal = document.getElementById("modal");
    modal.hidden = false;
    modal.innerHTML = html;
  }

  function onboardFlow(ob) {
    var screens = [
      "welcome", "welcome2", "name", "pay", "birthday", "pets", "serious", "confidence", "stress",
      "best", "worst", "wants", "fears", "decide", "education", "advisor", "margin", "insurance",
      "optimize", "target", "diy", "home", "car", "school", "work", "hincome", "hworth",
      "drop", "invest", "cash", "goal", "debt", "sits", "hear", "extra"
    ];
    if (welcomeSeen() || (ob && ob.retake)) screens = screens.filter(function (x) { return x !== "welcome" && x !== "welcome2"; });
    if (hasPriorSurvey(ob)) screens.push("compare");
    screens.push("privacy");
    return screens;
  }

  var SURVEY_ANSWER_KEY = {
    pay: "payFrequency",
    pets: "pets",
    education: "education",
    advisor: "advisor",
    margin: "margin",
    insurance: "insurance",
    optimize: "optimize",
    diy: "diy",
    home: "home",
    car: "car",
    school: "privateSchool",
    work: "work",
    hincome: "householdIncome",
    hworth: "roughNetWorth",
    drop: "drop",
    invest: "investExperience",
    cash: "cashNeed",
    goal: "goal",
    debt: "debt",
    sits: "moneySits",
    hear: "hearFrom",
    extra: "extraIncome",
    compare: "compared"
  };

  function seriousAges(birthday) {
    var age = window.GradeMath && GradeMath.ageYears(birthday);
    if (age == null) return null;
    var floor = age < 16 ? 16 : 10;
    var ages = [];
    var n;
    for (n = age; n >= floor; n--) ages.push(n);
    return ages;
  }

  function surveyReady(screen, a) {
    if (screen === "name" || screen === "best" || screen === "worst" || screen === "welcome" || screen === "welcome2" || screen === "privacy") return true;
    if (screen === "pay") return !!a.payFrequency;
    if (screen === "birthday") return !!a.birthday;
    if (screen === "serious") return a.serious === "today" || Number(a.serious) >= 1;
    if (screen === "confidence") return Number(a.confidence) >= 1 && Number(a.confidence) <= 10;
    if (screen === "stress") return Number(a.stress) >= 1 && Number(a.stress) <= 10;
    if (screen === "wants") return !!a.primaryNeed;
    if (screen === "fears") return !!a.secondaryNeed;
    if (screen === "decide") return (a.decide || []).length === 2;
    if (screen === "target") {
      if (a.targetReturn === "no") return true;
      if (a.targetReturn === "yes") return a.targetPercent !== "" && a.targetPercent != null && isFinite(Number(a.targetPercent));
      return false;
    }
    var key = SURVEY_ANSWER_KEY[screen];
    if (key) return !!a[key];
    return true;
  }

  function surveyError(screen) {
    if (screen === "pay") return "Pick one — you can change it later in Profile.";
    if (screen === "birthday") return "Add your birthday to continue.";
    if (screen === "serious") return "Pick Today or an age.";
    if (screen === "confidence" || screen === "stress") return "Tap a number.";
    if (screen === "wants" || screen === "fears") return "Pick one.";
    if (screen === "decide") return "Pick two.";
    if (screen === "target") return "Add a percent, or choose No.";
    return "Pick one to continue.";
  }

  function onboardDots(screen, flow) {
    flow = flow.filter(function (f) { return f !== "welcome2"; });
    var idx = flow.indexOf(screen);
    if (idx <= 0) return "";
    var total = flow.length - 1;
    var html = '<div class="onboard-progress survey-dots" aria-label="Step ' + idx + " of " + total + '">';
    var i;
    for (i = 1; i <= total; i++) html += '<i class="' + (i <= idx ? "on" : "") + '"></i>';
    return html + '<span class="caption">' + idx + " / " + total + "</span></div>";
  }

  function surveyChoicesHtml(options, selected, multi) {
    var html = '<div class="onboard-choices" role="' + (multi ? "group" : "radiogroup") + '">';
    options.forEach(function (c) {
      var on = multi ? (selected || []).indexOf(c.id) >= 0 : selected === c.id;
      html += '<button type="button" ' + (multi ? 'aria-pressed="' : 'role="radio" aria-checked="') +
        (on ? "true" : "false") + '" class="onboard-choice' + (on ? " on" : "") +
        '" data-act="ob-pick" data-value="' + esc(c.id) + '"><strong>' + esc(c.label) + "</strong>" +
        (c.sub ? '<span class="caption">' + esc(c.sub) + "</span>" : "") + "</button>";
    });
    return html + "</div>";
  }

  function surveyScaleHtml(selected) {
    var html = '<div class="onboard-scale" role="radiogroup" aria-label="1 to 10">';
    var n;
    for (n = 1; n <= 10; n++) {
      var on = Number(selected) === n;
      html += '<button type="button" role="radio" aria-checked="' + (on ? "true" : "false") +
        '" class="' + (on ? "on" : "") + '" data-act="ob-pick" data-value="' + n + '">' + n + "</button>";
    }
    return html + "</div>";
  }

  function surveyActions(back, enabled) {
    return '<div class="onboard-actions">' + back +
      '<button class="primary" type="button" data-act="ob-next"' + (enabled ? "" : " disabled") + ">Next</button></div>";
  }

  var SURVEY_NEED_OPTS = {
    wants: [
        { id: "significance", label: "Do people see that I matter and make an impact?" },
        { id: "approval", label: "Do people recognize what I did and give me confidence?" },
        { id: "acceptance", label: "Do I belong, and can people tell?" }
      ],
    fears: [
        { id: "intelligence", label: "Do people see me as smart?" },
        { id: "pity", label: "Do people realize how hard I’ve had it?" },
        { id: "strength", label: "Do people see me as strong?" }
      ],
    decide: [
        { id: "deviance", label: "Will this help me stand out or break the usual way?" },
        { id: "novelty", label: "Is this new, and will people notice?" },
        { id: "social", label: "Will this make people connect with me?" },
        { id: "conformity", label: "Are people like me already doing this?" },
        { id: "investment", label: "Will this give me a return that’s worth it?" },
        { id: "necessity", label: "What makes this necessary, instead of the other options?" }
      ]
  };

  /* Single source for the choice questions: the survey screens and View survey results both read this. */
  function surveyChoiceSpecs() {
    return {
        pets: ["Dogs or cats?", [
          { id: "dog", label: "Dogs" },
          { id: "cat", label: "Cats" },
          { id: "both", label: "Both" },
          { id: "neither", label: "Neither" }
        ]],
        education: ["Education", [
          { id: "hs", label: "High school" },
          { id: "some", label: "Some college" },
          { id: "college", label: "College" },
          { id: "beyond", label: "Beyond college" }
        ]],
        advisor: ["Do you have a financial advisor, and do you trust them?", [
          { id: "none", label: "No advisor" },
          { id: "trust", label: "Yes and I trust them" },
          { id: "distrust", label: "Yes but I don't" },
          { id: "unsure", label: "Not sure" }
        ]],
        margin: ["This year, which matters more?", [
          { id: "margin", label: "A fatter margin on what I earn" },
          { id: "networth", label: "A higher net worth" }
        ]],
        insurance: ["Would you rather stay with the insurance you have, or switch for a better price?", [
          { id: "stay", label: "Stay" },
          { id: "switch", label: "Switch for a better price" }
        ]],
        optimize: ["Do you prefer to optimize, or keep it simple?", [
          { id: "optimize", label: "Optimize" },
          { id: "simple", label: "Keep it simple" }
        ]],
        diy: ["Do you prefer to do it yourself, or get experienced advice?", [
          { id: "myself", label: "Do it myself" },
          { id: "advice", label: "Experienced advice" }
        ]],
        home: ["Would you rather rent or own your home?", [
          { id: "rent", label: "Rent" },
          { id: "own", label: "Own" }
        ]],
        car: ["How long do you usually keep a car?", [
          { id: "under3", label: "Under 3 years" },
          { id: "mid", label: "3 to 7 years" },
          { id: "over7", label: "Over 7 years" },
          { id: "none", label: "I don't have a car" }
        ]],
        school: ["Did you ever attend a private school?", [
          { id: "yes", label: "Yes" },
          { id: "no", label: "No" }
        ]],
        work: ["Work", [
          { id: "employee", label: "Employee" },
          { id: "self", label: "Self-employed" },
          { id: "both", label: "Both" },
          { id: "notworking", label: "Not working right now" }
        ]],
        hincome: ["Rough household income", [
          { id: "u75", label: "Under $75k" },
          { id: "75to150", label: "$75–150k" },
          { id: "150to300", label: "$150–300k" },
          { id: "over300", label: "Over $300k" }
        ]],
        hworth: ["Rough net worth", [
          { id: "u100", label: "Under $100k" },
          { id: "100to500", label: "$100k–500k" },
          { id: "500to1m", label: "$500k–$1M" },
          { id: "1to5", label: "$1–5M" },
          { id: "over5", label: "Over $5M" }
        ]],
        drop: ["How much of a drop can you sit through?", [
          { id: "little", label: "A little" },
          { id: "some", label: "Some" },
          { id: "lot", label: "A lot" }
        ]],
        invest: ["Investing experience", [
          { id: "new", label: "New to it" },
          { id: "comfortable", label: "Comfortable" },
          { id: "own", label: "I already run my own portfolio" }
        ]],
        cash: ["How much cash do you need within reach?", [
          { id: "little", label: "A little" },
          { id: "months", label: "A few months of spending" },
          { id: "year", label: "A year or more" }
        ]],
        goal: ["Main goal this year", [
          { id: "debt", label: "Get out of debt" },
          { id: "cushion", label: "Build a cushion" },
          { id: "home", label: "Buy a home" },
          { id: "grow", label: "Grow investments" }
        ]],
        debt: ["Do you have debt that bothers you?", [
          { id: "none", label: "No, none that bothers me" },
          { id: "cards", label: "Yes, credit cards" },
          { id: "student", label: "Yes, student loans" },
          { id: "car", label: "Yes, a car loan" },
          { id: "mortgage", label: "Yes, a mortgage" }
        ]],
        sits: ["Where does most of your money sit?", [
          { id: "cash", label: "Cash" },
          { id: "retirement", label: "Retirement accounts" },
          { id: "house", label: "A house" },
          { id: "brokerage", label: "A taxable brokerage" }
        ]],
        hear: ["How do you want to hear from Paper Trail?", [
          { id: "barely", label: "Barely" },
          { id: "monthly", label: "A monthly check-in" },
          { id: "often", label: "Often" }
        ]],
        extra: ["If you wanted extra income, would you double down at work, or start a side gig?", [
          { id: "work", label: "Double down at work" },
          { id: "gig", label: "Start a side gig" }
        ]]
      };
  }

  /* v37.5.59.16: readable survey results + retake. Answers live in state.onboarding.answers (saved state,
   * backups and export/import). Retake pre-fills them, skips the welcome pages, never touches budget, income
   * or net worth data, and puts the user back where they were. */
  function surveyResultRows() {
    var a = onboarding().answers || {};
    var rows = [];
    function add(q, v) { if (v != null && String(v) !== "") rows.push({ q: q, a: String(v) }); }
    function labelOf(list, id) {
      var hit = (list || []).filter(function (c) { return c.id === id; })[0];
      return hit ? hit.label : id;
    }
    add("Your name", a.name);
    var pay = ONBOARD_PAY_CHOICES.filter(function (c) { return c.id === a.payFrequency; })[0];
    add("How often do you get paid?", pay ? pay.label : a.payFrequency);
    add("Birthday", a.birthday);
    add("When did you start taking money seriously?", a.serious === "today" ? "Today" : (a.serious !== "" && a.serious != null ? "Age " + a.serious : ""));
    add("How confident are you making money decisions? (1 unsure – 10 sure)", a.confidence);
    add("Money stress (1 calm – 10 a lot)", a.stress);
    add("Best purchase", a.bestPurchase);
    add("Worst purchase", a.worstPurchase);
    add("When money comes up, which question feels most true?", labelOf(SURVEY_NEED_OPTS.wants, a.primaryNeed));
    add("Which of these is also true?", labelOf(SURVEY_NEED_OPTS.fears, a.secondaryNeed));
    if ((a.decide || []).length) add("When you make a money choice, which two questions do you ask?", a.decide.map(function (id) { return labelOf(SURVEY_NEED_OPTS.decide, id); }).join(" · "));
    var specs = surveyChoiceSpecs();
    ["education", "advisor", "margin", "insurance", "optimize", "diy"].forEach(function (k) {
      add(specs[k][0], labelOf(specs[k][1], a[SURVEY_ANSWER_KEY[k]]));
    });
    if (a.targetReturn) add("Do you have a target return?", a.targetReturn === "yes" ? "Yes" + (a.targetPercent !== "" && a.targetPercent != null ? " — " + a.targetPercent + "% a year" : "") : "No");
    ["pets", "home", "car", "school", "work", "hincome", "hworth", "drop", "invest", "cash", "goal", "debt", "sits", "hear", "extra"].forEach(function (k) {
      add(specs[k][0], labelOf(specs[k][1], a[SURVEY_ANSWER_KEY[k]]));
    });
    if (a.compared) add("Compared with last year, do you feel ahead, the same, or behind?", labelOf([{ id: "ahead", label: "Ahead" }, { id: "same", label: "The same" }, { id: "behind", label: "Behind" }], a.compared));
    return rows;
  }

  function openSurveyResults() {
    captureModalReturnScreenTop();
    var ob = onboarding();
    var rows = surveyResultRows();
    var html = '<div class="sheet about-sheet survey-results"><h3>Your survey answers</h3>';
    if (ob.surveyCompletedAt) html += '<p class="caption">Last saved ' + esc(String(ob.surveyCompletedAt).slice(0, 10)) + ".</p>";
    if (!rows.length) html += '<p class="empty">No survey answers are saved on this device yet.</p>';
    else {
      html += '<dl class="survey-list">';
      rows.forEach(function (row) { html += "<dt>" + esc(row.q) + "</dt><dd>" + esc(row.a) + "</dd>"; });
      html += "</dl>";
    }
    html += '<button class="data-btn" type="button" data-act="retake-survey"><strong>Retake survey</strong><span class="caption">Pre-filled with these answers</span></button>' +
      '<div class="sheet-actions"><button type="button" data-act="about-back">Back</button>' +
      '<button class="primary" type="button" data-act="close-modal">Done</button></div></div>';
    var modal = document.getElementById("modal");
    modal.hidden = false;
    modal.innerHTML = html;
  }

  function startSurveyRetake() {
    var ob = onboarding();
    if (ob.retake) return;
    ob.retake = {
      prevStatus: ob.status,
      prevScreen: ob.screen,
      backup: JSON.parse(JSON.stringify(ob.answers || {}))
    };
    ob.status = "survey";
    ob.screen = "name";
    ob.error = "";
    closeModal();
    saveState();
    render();
  }

  function endSurveyRetake(save) {
    var ob = onboarding();
    var rt = ob.retake;
    if (!rt) return;
    if (save) {
      readOnboardInputs();
      /* Settings the survey asks about (name, birthday, pay frequency) follow the new answers.
       * Budget months, paychecks, income and net worth are never touched. */
      var a = ob.answers;
      state.profile = migrateProfile(state.profile, state.foo, state.compensation);
      if (a.birthday) syncBirthday(a.birthday);
      if (a.name) state.profile.name = a.name;
      if (a.payFrequency && a.payFrequency !== state.profile.payFrequency) {
        state.profile.payFrequency = a.payFrequency;
        state.compensation = migrateCompensation(state.compensation || defaultCompensation());
        state.compensation.paychecksPerYear = checksForFrequency(a.payFrequency);
      }
      ob.surveyCompletedAt = new Date().toISOString();
      ob.surveyYear = new Date().getFullYear();
    } else {
      ob.answers = rt.backup || ob.answers;
    }
    ob.status = rt.prevStatus || "done";
    ob.screen = "privacy";
    ob.error = "";
    delete ob.retake;
    saveState();
    render();
  }

  function onboardScreenHtml() {
    var ob = onboarding();
    var a = ob.answers;
    var flow = onboardFlow(ob);
    var screen = ob.screen;
    if (screen === "serious" && seriousAges(a.birthday || birthdayISO()) == null) {
      ob.screen = "birthday";
      ob.error = ob.error || "Add your birthday first.";
      screen = "birthday";
    }
    var back = screen === "welcome" || screen === "welcome2" ? "" : '<button class="text-btn" type="button" data-act="ob-back">Back</button>';
    var html = '<div class="onboard-inner" data-screen="' + screen + '">' + onboardDots(screen, flow);
    if (screen === "welcome" || screen === "welcome2") {
      var wp = WELCOME_PAGES[screen];
      html = '<div class="onboard-inner welcome-min" data-screen="' + screen + '">' +
        (wp.kicker ? '<p class="welcome-kicker">' + esc(wp.kicker) + "</p>" : "") +
        "<h2>" + esc(wp.title) + "</h2>" +
        '<div class="welcome-stats">' + welcomeCardsHtml(wp) + "</div>" +
        '<p class="welcome-note">Surveys show association, not cause.</p>' +
        '<div class="welcome-foot">' +
        '<button class="primary onboard-primary" type="button" data-act="ob-next">' + esc(wp.cta) + '</button>' +
        '<div class="welcome-dots" aria-hidden="true"><i class="' + (screen === "welcome" ? "on" : "") + '"></i><i class="' + (screen === "welcome2" ? "on" : "") + '"></i></div>';
      if (screen === "welcome2") {
        html += '<button class="text-btn" type="button" data-act="ob-back">Back</button>';
      } else if (!hasRealData()) {
        html += '<button class="text-btn" type="button" data-act="ob-demo">Show me a demo</button>';
      }
      html += "</div>";
    } else if (screen === "name") {
      html += "<h2>First name</h2>" +
        '<label class="field">First name<input name="obName" type="text" autocomplete="given-name" value="' +
        esc(a.name || "") + '" placeholder="Your name"></label>' +
        '<p class="caption">Optional. Shows on Insights and in Profile.</p>' +
        surveyActions(back, true);
    } else if (screen === "pay") {
      html += "<h2>How often do you get paid?</h2>" + surveyChoicesHtml(ONBOARD_PAY_CHOICES, a.payFrequency, false);
      html += surveyActions(back, surveyReady(screen, a));
    } else if (screen === "birthday") {
      html += "<h2>Birthday</h2>" +
        '<label class="field">Birthday<input name="obBirthday" type="date" min="1920-01-01" max="' +
        esc(isoDate(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate())) +
        '" value="' + esc(a.birthday || "") + '"></label>' +
        '<p class="caption">The next question needs it.</p>' +
        surveyActions(back, !!a.birthday);
    } else if (screen === "serious") {
      var ages = seriousAges(a.birthday || birthdayISO()) || [];
      html += "<h2>When did you start taking money seriously?</h2>" +
        '<div class="age-wheel" role="listbox" aria-label="When you started">';
      var todayOn = a.serious === "today";
      html += '<button type="button" role="option" aria-selected="' + (todayOn ? "true" : "false") +
        '" class="' + (todayOn ? "on" : "") + '" data-act="ob-pick" data-value="today">Today</button>';
      ages.forEach(function (age) {
        var on = Number(a.serious) === age;
        html += '<button type="button" role="option" aria-selected="' + (on ? "true" : "false") +
          '" class="' + (on ? "on" : "") + '" data-act="ob-pick" data-value="' + age + '">Age ' + age + "</button>";
      });
      html += "</div>" +
        '<p class="caption">Scroll, then tap. Today is fine.</p>' +
        surveyActions(back, surveyReady(screen, a));
    } else if (screen === "confidence") {
      html += "<h2>How confident are you making money decisions?</h2>" +
        '<p class="caption">1 is unsure. 10 is sure.</p>' +
        surveyScaleHtml(a.confidence) + surveyActions(back, surveyReady(screen, a));
    } else if (screen === "stress") {
      html += "<h2>Money stress</h2>" +
        '<p class="caption">1 is calm. 10 is a lot.</p>' +
        surveyScaleHtml(a.stress) + surveyActions(back, surveyReady(screen, a));
    } else if (screen === "best" || screen === "worst") {
      var best = screen === "best";
      html += "<h2>" + (best ? "Best purchase" : "Worst purchase") + "</h2>" +
        '<label class="field">' + (best ? "One you’re glad you made" : "One you wish you hadn’t") +
        '<textarea name="' + (best ? "obBest" : "obWorst") + '" maxlength="240">' +
        esc(best ? (a.bestPurchase || "") : (a.worstPurchase || "")) + "</textarea></label>" +
        '<p class="caption">Optional.</p>' +
        '<button class="text-btn onboard-skip" type="button" data-act="ob-skip-q">Skip</button>' +
        surveyActions(back, true);
    } else if (screen === "wants" || screen === "fears" || screen === "decide") {
      /* Needs Map, unlabeled. One primary (significance, approval, acceptance) and one secondary (intelligence, pity, strength). */
      var wantOpts = SURVEY_NEED_OPTS.wants;
      var fearOpts = SURVEY_NEED_OPTS.fears;
      var decideOpts = SURVEY_NEED_OPTS.decide;
      var needScreen = screen === "wants" || screen === "fears";
      var multiKey = screen === "wants" ? "primaryNeed" : screen === "fears" ? "secondaryNeed" : "decide";
      var multi = a[multiKey] || (needScreen ? "" : []);
      var multiTitle = screen === "wants"
        ? "When money comes up, which question feels most true?"
        : screen === "fears"
          ? "Which of these is also true?"
          : "When you make a money choice, which two questions do you ask?";
      var multiOpts = screen === "wants" ? wantOpts : screen === "fears" ? fearOpts : decideOpts;
      var picked = needScreen ? !!multi : multi.length === 2;
      html += "<h2>" + multiTitle + "</h2>" +
        '<p class="caption">' + (needScreen ? "Pick one." : "Pick two.") + "</p>" +
        surveyChoicesHtml(multiOpts, multi, !needScreen) +
        surveyActions(back, picked);
    } else if (screen === "target") {
      html += "<h2>Do you have a target return?</h2>" +
        surveyChoicesHtml([
          { id: "no", label: "No" },
          { id: "yes", label: "Yes" }
        ], a.targetReturn, false);
      if (a.targetReturn === "yes") {
        html += '<label class="field">Percent a year<input name="obTargetPct" type="text" inputmode="decimal" autocomplete="off" value="' +
          esc(a.targetPercent === "" || a.targetPercent == null ? "" : String(a.targetPercent)) +
          '" placeholder="Percent"></label>' +
          '<p class="caption">Only the number you type. Nothing is filled in for you.</p>';
      }
      html += surveyActions(back, surveyReady(screen, a));
    } else if (screen === "compare") {
      html += "<h2>Compared with last year, do you feel ahead, the same, or behind?</h2>" +
        surveyChoicesHtml([
          { id: "ahead", label: "Ahead" },
          { id: "same", label: "The same" },
          { id: "behind", label: "Behind" }
        ], a.compared, false) + surveyActions(back, surveyReady(screen, a));
    } else if (screen === "privacy") {
      html += '<div class="onboard-privacy"><p class="onboard-lock" aria-hidden="true">🔒</p>' +
        "<h2>What testers share</h2>" +
        '<p class="onboard-sharing">As a Paper Trail tester, you share app data with your tester code to help find bugs and improve Paper Trail. That includes your survey answers and percentages like savings rate, plus dollar amounts and Vault details (document count and types). You can turn off dollar amounts and Vault details in Profile › Data sharing.</p></div>' +
        '<div class="onboard-actions">' + back +
        '<button class="primary" type="button" data-act="ob-survey-finish">Sounds good</button></div>';
    } else {
      var choiceScreens = surveyChoiceSpecs();
      var spec = choiceScreens[screen];
      if (spec) {
        html += "<h2>" + esc(spec[0]) + "</h2>" +
          surveyChoicesHtml(spec[1], a[SURVEY_ANSWER_KEY[screen]], false) +
          surveyActions(back, surveyReady(screen, a));
      }
    }
    if (ob.error && screen !== "welcome" && screen !== "welcome2") html += '<p class="caption rust">' + esc(ob.error) + "</p>";
    return html + "</div>";
  }

  function renderOnboarding() {
    var phone = document.getElementById("phone");
    if (!phone) return;
    var host = document.getElementById("onboard");
    var ob = state && state.onboarding;
    if (!ob || ob.status !== "survey") {
      if (host) host.remove();
      return;
    }
    if (!host) {
      host = document.createElement("section");
      host.id = "onboard";
      host.className = "onboard";
      host.setAttribute("role", "dialog");
      host.setAttribute("aria-modal", "true");
      host.setAttribute("aria-label", "Welcome to Paper Trail");
      phone.appendChild(host);
    }
    host.innerHTML = onboardScreenHtml();
    if (ob.retake) {
      var inner = host.querySelector(".onboard-inner");
      if (inner) inner.insertAdjacentHTML("afterbegin", '<button class="text-btn onboard-cancel" type="button" data-act="ob-retake-cancel">Cancel retake</button>');
    }
    bindMoneyInputs(host);
    wireSurveyInputs(host);
    host.scrollTop = 0;
    wireAgeWheel(host);
  }

  /* Tap selects the age row in place. Rebuilding the survey (and scroll-snap on focus)
     used to jump the wheel back to Today / the current age, hiding the row that was tapped. */
  var ageWheelScrollLock = null;

  function captureAgeWheelScroll() {
    var wheel = document.querySelector("#onboard .age-wheel");
    var host = document.getElementById("onboard");
    var screen = document.querySelector("#phone .screen");
    var scroller = document.scrollingElement || document.documentElement;
    return {
      wheel: wheel ? wheel.scrollTop : 0,
      host: host ? host.scrollTop : 0,
      screen: screen ? screen.scrollTop : 0,
      winX: window.scrollX || 0,
      winY: window.scrollY || 0,
      doc: scroller ? scroller.scrollTop : 0
    };
  }

  function restoreAgeWheelScroll(lock) {
    if (!lock) return;
    var wheel = document.querySelector("#onboard .age-wheel");
    var host = document.getElementById("onboard");
    var screen = document.querySelector("#phone .screen");
    var scroller = document.scrollingElement || document.documentElement;
    if (wheel) wheel.scrollTop = lock.wheel;
    if (host) host.scrollTop = lock.host;
    if (screen) screen.scrollTop = lock.screen;
    if (scroller && scroller.scrollTop !== lock.doc) scroller.scrollTop = lock.doc;
    if ((window.scrollX || 0) !== lock.winX || (window.scrollY || 0) !== lock.winY) {
      window.scrollTo(lock.winX, lock.winY);
    }
  }

  function paintAgeWheel(value) {
    var wheel = document.querySelector("#onboard .age-wheel");
    if (!wheel) return false;
    var want = value === "today" ? "today" : String(value);
    var buttons = wheel.querySelectorAll("button");
    var i;
    for (i = 0; i < buttons.length; i++) {
      var on = buttons[i].getAttribute("data-value") === want;
      if (on) buttons[i].classList.add("on");
      else buttons[i].classList.remove("on");
      buttons[i].setAttribute("aria-selected", on ? "true" : "false");
    }
    var next = document.querySelector('#onboard [data-act="ob-next"]');
    if (next) next.disabled = !surveyReady("serious", onboarding().answers);
    var err = document.querySelector("#onboard p.caption.rust");
    if (err) err.remove();
    return true;
  }

  function wireAgeWheel(host) {
    var wheel = host.querySelector(".age-wheel");
    if (!wheel) return;
    wheel.addEventListener("pointerdown", function (event) {
      if (!event.target.closest || !event.target.closest("button")) return;
      ageWheelScrollLock = captureAgeWheelScroll();
    });
    /* Mouse focus scrolls the snap target. Keep the row under the pointer. Touch still clicks. */
    wheel.addEventListener("mousedown", function (event) {
      if (event.target.closest && event.target.closest("button")) event.preventDefault();
    });
  }

  function readOnboardInputs() {
    var ob = onboarding();
    var host = document.getElementById("onboard");
    if (!host) return;
    var nameEl = host.querySelector('[name="obName"]');
    if (nameEl) ob.answers.name = String(nameEl.value || "").trim().slice(0, 40);
    var bday = host.querySelector('[name="obBirthday"]');
    if (bday) ob.answers.birthday = String(bday.value || "").slice(0, 10);
    var best = host.querySelector('[name="obBest"]');
    if (best) ob.answers.bestPurchase = String(best.value || "").trim().slice(0, 240);
    var worst = host.querySelector('[name="obWorst"]');
    if (worst) ob.answers.worstPurchase = String(worst.value || "").trim().slice(0, 240);
    var pct = host.querySelector('[name="obTargetPct"]');
    if (pct) {
      var raw = String(pct.value || "").replace(/[^0-9.]/g, "");
      if (!raw) ob.answers.targetPercent = "";
      else {
        var n = Number(raw);
        ob.answers.targetPercent = isFinite(n) ? Math.round(n * 100) / 100 : "";
      }
    }
  }

  function wireSurveyInputs(host) {
    var next = host.querySelector('[data-act="ob-next"]');
    if (!next) return;
    // v37.5.59.2 (QA): Enter in a one-line survey field (First name, etc.) advances like Next.
    Array.prototype.forEach.call(host.querySelectorAll('input[type="text"], input[type="date"], input:not([type])'), function (input) {
      input.addEventListener("keydown", function (event) {
        if (event.key !== "Enter" || event.isComposing) return;
        event.preventDefault();
        if (!next.disabled) next.click();
      });
    });
    var bday = host.querySelector('[name="obBirthday"]');
    if (bday) {
      var syncB = function () { next.disabled = !bday.value; };
      bday.addEventListener("input", syncB);
      bday.addEventListener("change", syncB);
    }
    var pct = host.querySelector('[name="obTargetPct"]');
    if (pct) {
      pct.addEventListener("input", function () {
        next.disabled = String(pct.value || "").trim() === "";
      });
    }
  }

  function finishSurveyToBudget() {
    var ob = onboarding();
    if (ob.retake) { endSurveyRetake(true); return; }
    markWelcomeSeen();
    readOnboardInputs();
    applyOnboardAnswers();
    ob.surveyCompletedAt = new Date().toISOString();
    ob.surveyYear = new Date().getFullYear();
    ob.status = "active";
    ob.screen = "privacy";
    ob.error = "";
    state.tab = "budget";
    saveState();
    try { sendTesterPayload(buildTesterPayload("survey")); } catch (err) {}
    render();
  }

  /* Feed survey answers into the existing profile + this month's income lines.
   * Take-home is no longer asked, so paycheck lines stay $0. Never invent an amount. */
  function applyOnboardAnswers() {
    var ob = onboarding();
    var a = ob.answers;
    state.profile = migrateProfile(state.profile, state.foo, state.compensation);
    if (a.birthday) syncBirthday(a.birthday);
    if (a.name) state.profile.name = a.name;
    if (a.payFrequency) {
      state.profile.payFrequency = a.payFrequency;
      state.compensation = migrateCompensation(state.compensation || defaultCompensation());
      state.compensation.paychecksPerYear = checksForFrequency(a.payFrequency);
    }
    var month = ensureMonth(state.year, state.month);
    var choice = onboardPayChoice(a.payFrequency);
    var count = choice ? choice.perMonth : 1;
    var untouched = !(month.transactions || []).length &&
      (month.incomes || []).every(function (i) { return !(Number(i.amount) > 0); });
    if (untouched) {
      var days = choice && choice.id === "weekly" ? [1, 8, 15, 22]
        : choice && (choice.id === "biweekly" || choice.id === "semimonthly") ? [1, 15] : [1];
      month.incomes = [];
      for (var i = 0; i < count; i++) {
        month.incomes.push({
          id: nextId(),
          name: "Paycheck " + (i + 1),
          amount: 0,
          date: isoDate(month.year, month.month, days[i] || 1)
        });
      }
    }
    ob.needsWorth = !worthHasData();
  }

  function openOnboardGuide(step, page) {
    var ob = onboarding();
    captureModalReturnScreenTop();
    var p = onboardProgress();
    var idx = 0;
    p.steps.forEach(function (s, i) { if (s.id === step) idx = i + 1; });
    var head = '<p class="kicker onboard-guide-kicker">Step ' + idx + " of " + p.total + "</p>" +
      '<div class="onboard-bar"><i style="width:' + Math.round((idx / p.total) * 100) + '%"></i></div>';
    var html = '<div class="sheet onboard-guide" data-guide="' + step + '">' + head;
    if (step === "budget") {
      var month = ensureMonth(state.year, state.month);
      var t = sums(month);
      html += "<h3>Build your first budget</h3>" +
        "<p>Give every dollar a job. Tap an envelope line on Budget and type what you plan to spend or save this month.</p>" +
        '<div class="row"><span>Income this month</span><span class="mono moss">' + money(t.income) + "</span></div>" +
        '<div class="row"><span>Left to assign</span><span class="mono">' + money(t.leftover) + "</span></div>" +
        '<p class="caption">' + (t.income > 0
          ? "Done when Left to assign reads $0.00 — the TRAIL SET stamp appears."
          : "Start with your paychecks: tap Paycheck 1 under Income and enter your take-home.") + "</p>" +
        '<div class="sheet-actions"><button type="button" data-act="ob-skip" data-step="budget">Skip for now</button>' +
        '<button class="primary" type="button" data-act="ob-start" data-step="budget">Let’s go</button></div>';
    } else if (step === "vault") {
      html += "<h3>Add documents to your Vault</h3>" +
        "<p>Keep the papers behind your money in one place. Everything here is optional.</p>" +
        '<div class="onboard-vault-picks">' +
        '<button class="planner-apply" type="button" data-act="ob-vault" data-kind="loan">+ Loan</button>' +
        '<button class="planner-apply" type="button" data-act="ob-vault" data-kind="insurance">+ Insurance</button>' +
        '<button class="planner-apply" type="button" data-act="ob-vault" data-kind="paystub">+ Pay stub (photo or PDF)</button>' +
        "</div>" +
        '<p class="caption">A confirmed pay stub unlocks the True savings rate on Premium.</p>' +
        '<div class="sheet-actions"><button type="button" data-act="ob-skip" data-step="vault">Skip — maybe later</button></div>';
    } else if (step === "worth") {
      var pages = [
        { t: "What you own", b: "Assets: cash in checking and savings, retirement accounts, investments, your home, your car. Use today’s balance or a fair value." },
        { t: "What you owe", b: "Liabilities: credit cards, student loans, a car loan, a mortgage. Use the payoff balance, not the monthly payment." },
        { t: "Own − owe = net worth", b: "Your first statement is a starting line, not a grade. Update it once a year and watch the trend." }
      ];
      var pg = Math.max(0, Math.min(pages.length - 1, Number(page) || 0));
      html += "<h3>Your first Net Worth statement</h3>" +
        '<div class="onboard-walk"><p class="onboard-walk-n">' + (pg + 1) + " / " + pages.length + "</p>" +
        "<h4>" + esc(pages[pg].t) + "</h4><p>" + esc(pages[pg].b) + "</p></div>" +
        '<div class="sheet-actions"><button type="button" data-act="ob-skip" data-step="worth">Skip for now</button>' +
        (pg < pages.length - 1
          ? '<button class="primary" type="button" data-act="ob-walk" data-page="' + (pg + 1) + '">Next</button>'
          : '<button class="primary" type="button" data-act="ob-start" data-step="worth">Start my statement</button>') +
        "</div>";
    }
    html += "</div>";
    var modal = document.getElementById("modal");
    modal.hidden = false;
    modal.innerHTML = html;
    ob.guide = step;
  }

  function handleOnboardAct(act, actEl) {
    var ob = onboarding();
    var flow = onboardFlow(ob);
    var i = flow.indexOf(ob.screen);
    if (act === "ob-next") {
      readOnboardInputs();
      if (ob.screen === "welcome" || ob.screen === "welcome2") {
        ob.error = "";
        ob.screen = ob.screen === "welcome" ? "welcome2" : "name";
        saveState();
        renderOnboarding();
        return;
      }
      if (!surveyReady(ob.screen, ob.answers)) {
        ob.error = surveyError(ob.screen);
        renderOnboarding();
        return;
      }
      if (ob.screen === "birthday") {
        if (!window.GradeMath || GradeMath.ageYears(ob.answers.birthday) == null) {
          ob.error = "That date doesn’t work. Pick your birthday.";
          renderOnboarding();
          return;
        }
        syncBirthday(ob.answers.birthday);
        if (ob.answers.serious && ob.answers.serious !== "today") {
          var agesNow = seriousAges(ob.answers.birthday) || [];
          if (agesNow.indexOf(Number(ob.answers.serious)) < 0) ob.answers.serious = "";
        }
      }
      ob.error = "";
      var next = flow[Math.min(flow.length - 1, i + 1)];
      if (next === "serious" && seriousAges(ob.answers.birthday || birthdayISO()) == null) {
        ob.screen = "birthday";
        ob.error = "Add your birthday first.";
        saveState();
        renderOnboarding();
        return;
      }
      if (next === "privacy" && ob.screen === "privacy") {
        finishSurveyToBudget();
        return;
      }
      ob.screen = next;
      saveState();
      renderOnboarding();
    } else if (act === "ob-back") {
      readOnboardInputs();
      ob.error = "";
      if (i <= 0) return;
      ob.screen = flow[i - 1];
      saveState();
      renderOnboarding();
    } else if (act === "ob-pick") {
      var value = actEl.getAttribute("data-value") || "";
      ob.error = "";
      if (ob.screen === "serious") {
        ob.answers.serious = value === "today" ? "today" : Number(value);
        saveState();
        var lock = ageWheelScrollLock || captureAgeWheelScroll();
        if (paintAgeWheel(ob.answers.serious)) {
          restoreAgeWheelScroll(lock);
          requestAnimationFrame(function () { restoreAgeWheelScroll(lock); });
          setTimeout(function () { restoreAgeWheelScroll(lock); }, 80);
          return;
        }
      } else if (ob.screen === "confidence") {
        ob.answers.confidence = Number(value);
      } else if (ob.screen === "stress") {
        ob.answers.stress = Number(value);
      } else if (ob.screen === "wants" || ob.screen === "fears") {
        var needKey = ob.screen === "wants" ? "primaryNeed" : "secondaryNeed";
        ob.answers[needKey] = ob.answers[needKey] === value ? "" : value;
        if (ob.answers.primaryNeed && ob.answers.secondaryNeed) {
          ob.answers.needs = { primary: ob.answers.primaryNeed, secondary: ob.answers.secondaryNeed };
        } else {
          delete ob.answers.needs;
        }
      } else if (ob.screen === "decide") {
        var list = (ob.answers.decide || []).slice();
        var at = list.indexOf(value);
        if (at >= 0) list.splice(at, 1);
        else if (list.length < 2) list.push(value);
        ob.answers.decide = list;
      } else if (ob.screen === "target") {
        ob.answers.targetReturn = value;
        if (value !== "yes") ob.answers.targetPercent = "";
      } else if (SURVEY_ANSWER_KEY[ob.screen]) {
        ob.answers[SURVEY_ANSWER_KEY[ob.screen]] = value;
      }
      saveState();
      renderOnboarding();
    } else if (act === "ob-skip-q") {
      if (ob.screen === "best") ob.answers.bestPurchase = "";
      if (ob.screen === "worst") ob.answers.worstPurchase = "";
      ob.error = "";
      if (i >= 0 && i < flow.length - 1) ob.screen = flow[i + 1];
      saveState();
      renderOnboarding();
    } else if (act === "ob-retake-cancel") {
      endSurveyRetake(false);
    } else if (act === "ob-survey-finish") {
      finishSurveyToBudget();
    } else if (act === "ob-pay") {
      ob.answers.payFrequency = actEl.getAttribute("data-freq") || "";
      ob.error = "";
      renderOnboarding();
    } else if (act === "ob-demo") {
      if (hasRealData()) return; // never overwrite real data
      state = freshState();
      state.onboarding = { status: "done", demo: true, skipped: {} };
      saveState();
      render();
    } else if (act === "ob-finish" || act === "ob-budget" || act === "ob-worth") {
      /* v37.5.59.12: the budget-vs-net-worth pick is gone. Any stale button (old cached page)
       * closes onboarding the same way the survey does and lands on Budget. */
      applyOnboardAnswers();
      ob.status = "active";
      ob.screen = "plan";
      state.tab = "budget";
      saveState();
      render();
    } else if (act === "ob-guide") {
      openOnboardGuide(actEl.getAttribute("data-step") || "budget");
    } else if (act === "ob-walk") {
      openOnboardGuide("worth", Number(actEl.getAttribute("data-page")) || 0);
    } else if (act === "ob-skip") {
      ob.skipped[actEl.getAttribute("data-step") || ""] = true;
      ob.guide = "";
      saveState();
      closeModal();
      render();
    } else if (act === "ob-start") {
      var step = actEl.getAttribute("data-step");
      ob.guide = "";
      if (step === "worth") {
        state.tab = "stats";
        state.statsDoor = "worth";
        state.worthDetails = true;
      } else {
        state.tab = "budget";
      }
      saveState();
      closeModal();
      render();
    } else if (act === "ob-vault") {
      var kind = actEl.getAttribute("data-kind");
      ob.guide = "";
      closeModal();
      state.tab = "stats";
      state.statsDoor = "vault";
      state.vaultDocId = "";
      if (kind === "paystub") {
        vaultPickMode = true;
      } else {
        state.profile = migrateProfile(state.profile, state.foo, state.compensation);
        var card = emptyVaultDoc(kind);
        var typeLink = suggestDocLink(card.slot);
        applyDocLink(card, typeLink);
        card._vaultDraft = true;
        state.profile.documents.push(card);
        state.vaultDocId = card.id;
      }
      saveState();
      render();
    } else if (act === "ob-hide") {
      ob.hidden = true;
      saveState();
      render();
    } else if (act === "ob-show") {
      ob.hidden = false;
      if (ob.status === "done" && !ob.legacy && !ob.demo) ob.status = "active";
      state.tab = "budget";
      saveState();
      closeModal();
      render();
    } else if (act === "ob-dismiss") {
      if (!onboardProgress().complete) return;
      ob.status = "done";
      ob.completedAt = new Date().toISOString();
      saveState();
      render();
    } else if (act === "ob-leave-demo") {
      if (!window.confirm("Erase the demo and start your own budget?\n\nEvery sample number (and anything you changed while exploring) is removed from this device. This can’t be undone.")) return;
      try { localStorage.removeItem(STORAGE_KEY); } catch (err) {}
      clearDocDb();
      state = blankState();
      state.onboarding.screen = "name";
      envelopeEditMode = false;
      spendSearch = "";
      vaultPickMode = false;
      closeModal();
      saveState();
      render();
    }
  }

  /* ---- v37.5.15 About & Privacy (Profile) ---- */
  function openAbout() {
    captureModalReturnScreenTop();
    var ob = onboarding();
    var html = '<div class="sheet about-sheet">' +
      "<h3>About &amp; Privacy</h3>" +
      '<p class="about-version mono">Paper Trail · version ' + esc(APP_VERSION) + " (browser preview)</p>" +
      '<p class="profile-section">Backups</p>' +
      "<p>Keep a backup: if this device is lost or erased without one, your data may not be recoverable — so save a backup now and then.</p>" +
      '<p class="profile-section">What Paper Trail stores</p>' +
      '<ul class="about-list">' +
      "<li><strong>Budget</strong> — months, envelopes, planned amounts.</li>" +
      "<li><strong>Transactions</strong> — expenses, income, refunds, splits.</li>" +
      "<li><strong>Income</strong> — paychecks, income statement, confirmed pay-stub numbers.</li>" +
      "<li><strong>Net worth</strong> — yearly balances and notes.</li>" +
      "<li><strong>Vault documents</strong> — files you add and the details on each card.</li>" +
      "<li><strong>Settings</strong> — name, birthday, pay frequency, dark mode, plan, setup checklist.</li>" +
      "</ul>" +
      '<p class="profile-section">Tester data sharing</p>' +
      "<p>Testers share app data with their tester code to help find bugs and improve Paper Trail. Rates and changes (savings rate, average tax, year-over-year changes, plan vs. spent %), grade, streaks, feature use, and survey answers are always included. Dollar amounts and Vault details (document count and types) are included unless you turn them off. Tester sharing doesn’t include merchant names, transaction notes, account numbers, or file contents.</p>" +
      "<p>" + (TESTER_ENDPOINT ? "Sharing is connected." : "Not connected yet: nothing has left this device. Shares wait on this device until it connects.") + "</p>" +
      '<button class="data-btn" type="button" data-act="about-go" data-to="sharing"><strong>Go to Profile › Data sharing</strong><span class="caption">Switches · Preview what’s shared</span></button>' +
      '<p class="profile-section">No ads, no tracking</p>' +
      "<p>No ads, no third-party analytics, no crash reporting, no third-party scripts. Code and fonts ship with the app. Right now, tester sharing is the only thing that sends data.</p>" +
      '<p class="profile-section">Export</p>' +
      "<p>Excel workbook, a monthly PDF report, or a full backup file you can restore later.</p>" +
      '<button class="data-btn" type="button" data-act="about-go" data-to="data"><strong>Go to Profile › Data</strong><span class="caption">Export · Backup · Restore</span></button>' +
      '<p class="profile-section">Delete</p>' +
      "<p>Erase everything on this device, or clear one month’s spending, from the danger zone at the bottom of Profile. Each asks first. Single transactions are deleted on the Transactions tab.</p>" +
      '<button class="data-btn" type="button" data-act="about-go" data-to="danger"><strong>Go to the danger zone</strong><span class="caption">Erase all data · Clear this month’s spending</span></button>';
    html += '<p class="profile-section">Intro</p>' +
      '<button class="data-btn" type="button" data-act="show-intro"><strong>Replay the welcome intro</strong><span class="caption">The two stat pages from first launch</span></button>' +
      '<button class="data-btn" type="button" data-act="view-survey"><strong>View survey results</strong><span class="caption">Your saved answers, question by question</span></button>' +
      '<button class="data-btn" type="button" data-act="retake-survey"><strong>Retake survey</strong><span class="caption">Pre-filled with your answers · budget, income and net worth stay as they are</span></button>';
    if (ob.status === "active" && ob.hidden) {
      html += '<p class="profile-section">Setup</p>' +
        '<button class="data-btn" type="button" data-act="ob-show"><strong>Show setup checklist</strong><span class="caption">Back on the Budget tab</span></button>';
    }
    html += '<div class="sheet-actions"><button type="button" data-act="about-back">Back to Profile</button>' +
      '<button class="primary" type="button" data-act="close-modal">Done</button></div></div>';
    var modal = document.getElementById("modal");
    modal.hidden = false;
    modal.innerHTML = html;
  }

  function openProfileAt(anchorId) {
    openProfile();
    var el = document.getElementById(anchorId);
    if (el && el.scrollIntoView) el.scrollIntoView({ block: "start" });
  }

  function eraseAllData() {
    if (!window.confirm("Erase all my data?\n\nThis permanently deletes every budget month, transaction, income record, Net Worth year, Vault document, and setting on this device. It can’t be recovered — make a Full backup first (Profile › Data) if you might want it back.")) return;
    try { localStorage.removeItem(STORAGE_KEY); } catch (err) {}
    try { localStorage.removeItem(TESTER_QUEUE_KEY); } catch (err) {}
    clearDocDb();
    state = blankState();
    envelopeEditMode = false;
    spendSearch = "";
    spendDraft = null;
    profileDocDraft = null;
    pendingDocFile = null;
    profileHighlightDocId = "";
    vaultPickMode = false;
    pendingRestore = null;
    closeModal();
    render();
  }

  /* ---- v37.5.15 Wrapped share card → PNG (canvas; no network) ----
   * Always the light "paper" style so a shared card looks the same from light or night mode.
   * Dollar amounts are hidden by default; the toggle must be switched on before they're drawn. */
  var shareShowAmounts = false;
  var shareCardUrl = "";
  var SHARE_W = 1080;
  var SHARE_H = 1350;
  var SHARE_SERIF = '"Iowan Old Style", Palatino, "Palatino Linotype", Georgia, serif';
  var SHARE_MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, "DejaVu Sans Mono", monospace';
  var SHARE_SCRIPT = '"PaperTrailScript", "PaperTrailScriptAlt", cursive';

  function shareFontsReady() {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    return Promise.all([
      document.fonts.load('500 96px "PaperTrailScript"'),
      document.fonts.load('500 96px "PaperTrailScriptAlt"')
    ]).then(function () { return document.fonts.ready; }, function () { return document.fonts.ready; });
  }

  function shareCardFacts() {
    var month = ensureMonth(state.year, state.month);
    return wrappedFacts(month, "year");
  }

  function fitText(ctx, text, maxWidth, font, startPx, minPx) {
    var px = startPx;
    ctx.font = font.replace("{px}", px);
    while (px > minPx && ctx.measureText(text).width > maxWidth) {
      px -= 2;
      ctx.font = font.replace("{px}", px);
    }
    return px;
  }

  function drawShareCard(model) {
    var canvas = document.createElement("canvas");
    canvas.width = SHARE_W;
    canvas.height = SHARE_H;
    var ctx = canvas.getContext("2d");
    var PAPER = "rgb(250, 250, 248)", INK = "rgb(28, 30, 33)", MUTED = "rgb(92, 96, 102)";
    var MOSS = "rgb(31, 122, 97)", GOLD = "rgb(196, 163, 90)", PLUM = "rgb(107, 76, 122)", RULE = "rgb(226, 228, 231)";
    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, SHARE_W, SHARE_H);
    ctx.strokeStyle = RULE;
    ctx.lineWidth = 2;
    for (var y = 300; y < SHARE_H - 120; y += 64) {
      ctx.beginPath(); ctx.moveTo(72, y); ctx.lineTo(SHARE_W - 72, y); ctx.stroke();
    }
    ctx.fillStyle = GOLD;
    ctx.fillRect(0, 0, SHARE_W, 18);
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = MOSS;
    ctx.font = "500 96px " + SHARE_SCRIPT;
    ctx.fillText("Paper Trail", 72, 150);
    ctx.fillStyle = MUTED;
    ctx.font = "600 30px " + SHARE_SERIF;
    ctx.fillText(model.kicker.toUpperCase(), 76, 215);
    // Headline
    ctx.fillStyle = MOSS;
    fitText(ctx, model.headline.value, SHARE_W - 150, "700 {px}px " + SHARE_SERIF, 190, 90);
    ctx.fillText(model.headline.value, 70, 430);
    ctx.fillStyle = INK;
    ctx.font = "500 40px " + SHARE_SERIF;
    ctx.fillText(model.headline.label, 76, 500);
    if (model.headline.sub) {
      ctx.fillStyle = MUTED;
      ctx.font = "400 28px " + SHARE_SERIF;
      ctx.fillText(model.headline.sub, 76, 545);
    }
    // Rows
    var top = 620;
    model.rows.forEach(function (row, i) {
      var ry = top + i * 108;
      ctx.strokeStyle = "rgb(210, 212, 216)";
      ctx.beginPath(); ctx.moveTo(72, ry + 40); ctx.lineTo(SHARE_W - 72, ry + 40); ctx.stroke();
      ctx.fillStyle = INK;
      ctx.font = "500 38px " + SHARE_SERIF;
      ctx.textAlign = "left";
      ctx.fillText(row.label, 76, ry);
      if (row.note) {
        ctx.fillStyle = MUTED;
        ctx.font = "400 26px " + SHARE_SERIF;
        ctx.fillText(row.note, 76, ry + 30);
      }
      ctx.textAlign = "right";
      ctx.fillStyle = row.masked ? PLUM : INK;
      fitText(ctx, row.value, 560, "600 {px}px " + (row.mono ? SHARE_MONO : SHARE_SERIF), 42, 24);
      ctx.fillText(row.value, SHARE_W - 76, ry);
      ctx.textAlign = "left";
    });
    // Footer
    ctx.fillStyle = model.amountsShown ? MUTED : PLUM;
    ctx.font = "600 28px " + SHARE_SERIF;
    ctx.fillText(model.amountsShown ? "Dollar amounts shown" : "Dollar amounts hidden", 76, SHARE_H - 110);
    ctx.fillStyle = MUTED;
    ctx.font = "400 28px " + SHARE_SERIF;
    ctx.fillText(model.footer, 76, SHARE_H - 66);
    return canvas;
  }

  function renderShareCard() {
    var facts = shareCardFacts();
    var model = gm().shareCardModel(facts, { showAmounts: shareShowAmounts, money: money });
    var modal = document.getElementById("modal");
    var html = '<div class="wrap-stage share-stage">' +
      '<div class="wrap-top"><button type="button" data-act="share-back">Back</button><strong>Share card</strong><span></span></div>' +
      '<div class="share-preview"><img id="share-card-img" alt="Share card preview: ' + esc(model.kicker) + '" width="1080" height="1350"></div>' +
      '<label class="settings-toggle share-toggle">Show dollar amounts' +
      '<input type="checkbox" data-act="share-amounts"' + (shareShowAmounts ? " checked" : "") + "></label>" +
      '<p class="caption">' + (shareShowAmounts
        ? "Dollar amounts are ON. Anyone you share with will see them."
        : "Dollar amounts are hidden. Percentages, envelope names, streak, and grade still show.") + "</p>" +
      '<div class="wrap-nav"><button class="primary" type="button" data-act="share-save" id="share-save">' +
      (canShareFiles() ? "Share image" : "Save image") + "</button></div>" +
      '<p class="caption" id="share-status" aria-live="polite">Made on this device.</p></div>';
    modal.classList.add("wrap-open");
    modal.hidden = false;
    modal.innerHTML = html;
    return shareFontsReady().then(function () {
      var canvas = drawShareCard(model);
      shareCardUrl = canvas.toDataURL("image/png");
      var img = document.getElementById("share-card-img");
      if (img) img.src = shareCardUrl;
      return canvas;
    });
  }

  function canShareFiles() {
    try {
      if (!navigator.share || !navigator.canShare || typeof File === "undefined") return false;
      var probe = new File([new Uint8Array([137, 80, 78, 71])], "probe.png", { type: "image/png" });
      return !!navigator.canShare({ files: [probe] });
    } catch (err) {
      return false;
    }
  }

  function shareCardFileName() {
    var facts = shareCardFacts();
    return "PaperTrail-wrap-" + String(facts.periodName || "period").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "") +
      (shareShowAmounts ? "-amounts" : "") + ".png";
  }

  function saveShareCard() {
    var status = document.getElementById("share-status");
    shareFontsReady().then(function () {
      var model = gm().shareCardModel(shareCardFacts(), { showAmounts: shareShowAmounts, money: money });
      var canvas = drawShareCard(model);
      canvas.toBlob(function (blob) {
        if (!blob) { if (status) status.textContent = "Couldn’t make the image on this device."; return; }
        var name = shareCardFileName();
        var file = null;
        try { file = new File([blob], name, { type: "image/png" }); } catch (err) { file = null; }
        if (file && navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          navigator.share({ files: [file], title: "My Paper Trail wrap" }).then(function () {
            if (status) status.textContent = "Shared.";
          }, function (err) {
            if (err && err.name === "AbortError") { if (status) status.textContent = "Share canceled."; return; }
            downloadBlob(blob, name);
            if (status) status.textContent = "Saved " + name + ".";
          });
        } else {
          downloadBlob(blob, name);
          if (status) status.textContent = "Saved " + name + (shareShowAmounts ? " (dollar amounts shown)." : " (dollar amounts hidden).");
        }
      }, "image/png");
    });
  }

  /* ---- v37.5.14 Profile › Data: Excel, PDF report, full backup / restore (all local) ---- */
  var APP_VERSION = "37.5.59.16";
  var pendingRestore = null;

  function storagePayload() {
    var payload = {};
    Object.keys(state).forEach(function (key) { payload[key] = state[key]; });
    if (state.profile) {
      payload.profile = {};
      Object.keys(state.profile).forEach(function (key) { payload.profile[key] = state.profile[key]; });
      payload.profile.documents = documentsForStorage(state.profile.documents);
    }
    return payload;
  }

  function monthKeyLabel(m) {
    return m.year + "-" + pad(m.month);
  }

  function sortedMonthRecords() {
    return Object.keys(state.months || {}).map(function (k) { return state.months[k]; }).filter(Boolean)
      .sort(function (a, b) { return a.year !== b.year ? a.year - b.year : a.month - b.month; });
  }

  function lineRefunds(month, lineId) {
    var total = 0;
    (month.transactions || []).forEach(function (tx) {
      gm().txLegBreakdown(tx).forEach(function (leg) {
        if (String(leg.lineId) === String(lineId)) total += leg.refund;
      });
    });
    return roundCents(total);
  }

  function refundKindLabel(kind) {
    return kind === "full" ? "Full refund" : kind === "partial" ? "Partial refund" : kind === "standalone" ? "Refund only (money back)" : "";
  }

  function workbookSheets() {
    var M = function (v) { return { v: roundCents(v), s: "money" }; };
    var B = function (v) { return { v: v, s: "bold" }; };
    var BM = function (v) { return { v: roundCents(v), s: "boldMoney" }; };
    var months = sortedMonthRecords();
    months.forEach(function (m) { migrateSubsections(m); migrateIncome(m); });
    var budget = [[B("Month"), B("Group"), B("Envelope"), B("Planned"), B("Spent (net)"), B("Refunds"), B("Remaining")]];
    var txRows = [[B("Month"), B("Date"), B("Type"), B("Payee"), B("Envelope / income line"), B("Amount"),
      B("Refund type"), B("Refund amount"), B("Net spend"), B("Received"), B("Split"), B("Note")]];
    var incomeRows = [[B("Month"), B("Income line"), B("Date"), B("Planned"), B("Received"), B("Left to receive")]];
    months.forEach(function (m) {
      var label = monthKeyLabel(m);
      var totals = sums(m);
      sortedCategories(m).forEach(function (cat) {
        sortedLines(cat).forEach(function (line) {
          var spent = spentOnLine(m, line.id);
          budget.push([label, cat.name, line.name, M(line.assigned), M(spent), M(lineRefunds(m, line.id)), M((Number(line.assigned) || 0) - spent)]);
        });
      });
      budget.push([B(label), B("Month total"), "", BM(totals.assigned), BM(totals.spent), BM(totals.refunds), BM(totals.assigned - totals.spent)]);
      (m.transactions || []).forEach(function (tx) {
        if (isIncomeTx(tx)) {
          txRows.push([label, tx.date || "", "Income", tx.payee || "", incomeLineName(m, tx.incomeId), M(tx.amount), "", "", "", M(tx.amount), "", tx.note || ""]);
          return;
        }
        var legs = txLegs(tx);
        var nets = gm().txLegBreakdown(tx);
        var kind = tx.refundKind || "";
        legs.forEach(function (leg, i) {
          var b = nets[i] || { refund: 0, net: 0 };
          txRows.push([
            label, tx.date || "", "Expense", tx.payee || "", displayLegEnvelope(m, leg), M(leg.amount),
            refundKindLabel(kind), b.refund ? M(b.refund) : "", M(b.net), "",
            legs.length > 1 ? (i + 1) + " of " + legs.length + " · total " + money(txTotal(tx)) : "",
            leg.note || tx.note || ""
          ]);
        });
      });
      (m.incomes || []).forEach(function (item) {
        var got = receivedFor(m, item.id);
        incomeRows.push([label, item.name || "Income", item.date || "", M(item.amount), M(got), M((Number(item.amount) || 0) - got)]);
      });
      incomeRows.push([B(label), B("Month total"), "", BM(totals.income), BM(totals.received), BM(totals.income - totals.received)]);
    });
    var worthRows = [[B("Year"), B("Line"), B("Kind"), B("Group"), B("Amount")]];
    var years = ((state.worth && state.worth.years) || []).slice().sort(function (a, b) { return a - b; });
    var groupTitle = {};
    GROUPS.forEach(function (g) { groupTitle[g.id] = g.title; });
    years.forEach(function (year) {
      (state.worth.lines || []).forEach(function (line) {
        worthRows.push([year, line.name || "", line.kind === "liability" ? "Liability" : "Asset", groupTitle[line.group] || line.group || "", M(lineAmount(line, year))]);
      });
      var t = worthTotals(year);
      worthRows.push([B(String(year)), B("Assets"), "", "", BM(t.assets)]);
      worthRows.push([B(String(year)), B("Liabilities"), "", "", BM(t.liabilities)]);
      worthRows.push([B(String(year)), B("Net worth"), "", "", BM(t.equity)]);
    });
    return [
      { name: "Budget by month", rows: budget, widths: [10, 18, 24, 13, 13, 12, 13], freezeHeader: true },
      { name: "Transactions", rows: txRows, widths: [10, 12, 10, 24, 30, 12, 22, 13, 12, 12, 26, 28], freezeHeader: true },
      { name: "Income", rows: incomeRows, widths: [10, 22, 12, 13, 13, 15], freezeHeader: true },
      { name: "Net Worth", rows: worthRows, widths: [8, 26, 10, 24, 14], freezeHeader: true }
    ];
  }

  function downloadBlob(blob, name) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      URL.revokeObjectURL(url);
      if (a.parentNode) a.parentNode.removeChild(a);
    }, 2000);
  }

  function stampForFile() {
    var d = new Date();
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }

  function setDataStatus(text, isError) {
    var el = document.getElementById("data-status");
    if (el) {
      el.textContent = text;
      el.className = "caption data-status" + (isError ? " rust" : "");
    }
  }

  function exportXlsx() {
    var kit = window.PaperTrailExport;
    var sheets = workbookSheets();
    try {
      if (!kit || !window.fflate) throw new Error("xlsx-unavailable");
      var bytes = kit.buildXlsx(sheets, { title: "Paper Trail export " + stampForFile() });
      downloadBlob(new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
        "PaperTrail-" + stampForFile() + ".xlsx");
      setDataStatus("Excel workbook saved: Budget by month, Transactions, Income, Net Worth.");
    } catch (err) {
      // Fallback: one UTF-8 BOM CSV per sheet (opens cleanly in Excel).
      sheets.forEach(function (sheet) {
        var csv = kit ? kit.csvFromRows(sheet.rows) : "";
        downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8" }),
          "PaperTrail-" + sheet.name.replace(/\s+/g, "-") + "-" + stampForFile() + ".csv");
      });
      setDataStatus("Couldn’t build .xlsx here — saved CSV files instead (UTF-8, open in Excel).", true);
    }
  }

  function buildPrintReport(month) {
    month = month || ensureMonth(state.year, state.month);
    var totals = sums(month);
    var title = MONTH_NAMES[month.month - 1] + " " + month.year;
    var html = '<div class="pr-head"><h1>Paper Trail</h1><p class="pr-sub">Monthly report · ' + esc(title) +
      " · generated " + esc(stampForFile()) + "</p></div>";
    html += '<h2>Budget vs spent</h2><table class="pr-table"><thead><tr><th>Envelope</th><th>Planned</th><th>Spent</th><th>Remaining</th></tr></thead><tbody>';
    sortedCategories(month).forEach(function (cat) {
      var assigned = catAssigned(cat);
      var spent = spentFor(month, cat.id);
      html += '<tr class="pr-group"><td>' + esc(cat.name) + "</td><td>" + money(assigned) + "</td><td>" + money(spent) +
        "</td><td>" + money(assigned - spent) + "</td></tr>";
      sortedLines(cat).forEach(function (line) {
        if (sortedLines(cat).length === 1 && line.name === cat.name) return;
        var ls = spentOnLine(month, line.id);
        html += '<tr class="pr-line"><td>' + esc(line.name) + "</td><td>" + money(line.assigned) + "</td><td>" + money(ls) +
          "</td><td>" + money((Number(line.assigned) || 0) - ls) + "</td></tr>";
      });
    });
    html += '<tr class="pr-total"><td>Total</td><td>' + money(totals.assigned) + "</td><td>" + money(totals.spent) +
      "</td><td>" + money(totals.assigned - totals.spent) + "</td></tr></tbody></table>";
    if (totals.refunds > 0) html += '<p class="pr-note">Spent is net of ' + money(totals.refunds) + " in refunds. Refunds never count as income.</p>";
    html += '<h2>Income</h2><table class="pr-table"><thead><tr><th>Income line</th><th>Planned</th><th>Received</th><th>Left to receive</th></tr></thead><tbody>';
    (month.incomes || []).forEach(function (item) {
      var got = receivedFor(month, item.id);
      html += "<tr><td>" + esc(item.name || "Income") + "</td><td>" + money(item.amount) + "</td><td>" + money(got) +
        "</td><td>" + money((Number(item.amount) || 0) - got) + "</td></tr>";
    });
    html += '<tr class="pr-total"><td>Total</td><td>' + money(totals.income) + "</td><td>" + money(totals.received) +
      "</td><td>" + money(totals.income - totals.received) + "</td></tr></tbody></table>";
    var rates = monthSavingsRates(month);
    html += '<p class="pr-note">Left to budget ' + money(totals.leftover) + " · Basic savings rate " +
      gm().formatSavingsRate(rates.basic.rate) + (rates.trueRate.state === "ok" ? " · True savings rate " + gm().formatSavingsRate(rates.trueRate.rate) : "") + "</p>";
    var nw = latestNetWorthHeadline();
    var nwYear = nw.year;
    html += "<h2>Net worth</h2>";
    if (nwYear) {
      var t = worthTotals(nwYear);
      var prior = worthTotals(nwYear - 1);
      var hasPrior = (state.worth.years || []).indexOf(nwYear - 1) >= 0;
      html += '<table class="pr-table"><tbody>' +
        "<tr><td>Assets (" + nwYear + ")</td><td>" + money(t.assets) + "</td></tr>" +
        "<tr><td>Liabilities</td><td>" + money(t.liabilities) + "</td></tr>" +
        '<tr class="pr-total"><td>Net worth</td><td>' + money(t.equity) + "</td></tr>" +
        (hasPrior ? "<tr><td>Change vs " + (nwYear - 1) + "</td><td>" + signedMoney(t.equity - prior.equity) + "</td></tr>" : "") +
        "</tbody></table>";
    } else {
      html += '<p class="pr-note">No Net Worth years on file.</p>';
    }
    html += '<p class="pr-foot">Report made on this device by Paper Trail preview v' + APP_VERSION + ". Only numbers you entered — nothing estimated.</p>";
    var el = document.getElementById("print-report");
    if (!el) {
      el = document.createElement("div");
      el.id = "print-report";
      el.className = "print-report";
      document.body.appendChild(el);
    }
    el.innerHTML = html;
    document.body.classList.add("print-report-on");
    return el;
  }

  function clearPrintReport() {
    document.body.classList.remove("print-report-on");
    var el = document.getElementById("print-report");
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }

  function exportPdf() {
    buildPrintReport();
    var done = false;
    function cleanup() {
      if (done) return;
      done = true;
      window.removeEventListener("afterprint", cleanup);
      clearPrintReport();
    }
    window.addEventListener("afterprint", cleanup);
    setDataStatus("Print dialog opened — choose “Save as PDF”.");
    try { window.print(); } catch (err) {}
    setTimeout(cleanup, 60000);
  }

  function blobToDataUrl(blob, done) {
    try {
      var reader = new FileReader();
      reader.onload = function () { done(null, String(reader.result || "")); };
      reader.onerror = function () { done(reader.error || new Error("read")); };
      reader.readAsDataURL(blob);
    } catch (err) {
      done(err);
    }
  }

  function buildBackup(done) {
    var payload = storagePayload();
    var docs = (payload.profile && payload.profile.documents) || [];
    var files = {};
    var excluded = [];
    var pending = docs.filter(function (d) { return d.hasBlob; });
    docs.forEach(function (d) {
      if (!d.hasBlob && d.dataUrl) files[d.id] = d.dataUrl;
    });
    var i = 0;
    function next() {
      if (i >= pending.length) {
        docs.forEach(function (d) { if (files[d.id]) delete d.dataUrl; });
        done({
          kind: window.PaperTrailExport ? window.PaperTrailExport.BACKUP_KIND : "PaperTrail.backup",
          format: 1,
          appVersion: APP_VERSION,
          exportedAt: new Date().toISOString(),
          storageKey: STORAGE_KEY,
          state: payload,
          documents: files,
          excluded: excluded
        });
        return;
      }
      var doc = pending[i++];
      getDocBlob(doc.id, function (err, blob) {
        if (err || !blob) {
          excluded.push((doc.fileName || doc.id) + " — file not readable on this device (card fields kept)");
          return next();
        }
        blobToDataUrl(blob, function (readErr, url) {
          if (readErr || !url) excluded.push((doc.fileName || doc.id) + " — couldn’t encode file (card fields kept)");
          else files[doc.id] = url;
          next();
        });
      });
    }
    next();
  }

  function exportBackup() {
    setDataStatus("Building backup…");
    buildBackup(function (backup) {
      var text = JSON.stringify(backup);
      downloadBlob(new Blob([text], { type: "application/json" }), "PaperTrail-backup-" + stampForFile() + ".json");
      var n = Object.keys(backup.documents).length;
      setDataStatus("Backup saved · " + Object.keys(backup.state.months || {}).length + " months · " + n + " Vault file" + (n === 1 ? "" : "s") +
        (backup.excluded.length ? " · excluded: " + backup.excluded.join("; ") : " · nothing excluded"), !!backup.excluded.length);
    });
  }

  function readRestoreFile(file) {
    // v37.5.59.12 (QA NEW-H1): no whole-file size precheck — Vault PDFs live in IndexedDB;
    // only the localStorage state payload matters, and applyRestore tests that write.
    var reader = new FileReader();
    reader.onload = function () {
      var parsed = null;
      try { parsed = JSON.parse(String(reader.result || "")); } catch (err) { parsed = null; }
      var check = window.PaperTrailExport ? window.PaperTrailExport.validateBackup(parsed) : { ok: false, error: "Restore unavailable." };
      if (!check.ok) {
        pendingRestore = null;
        setDataStatus("Can’t restore: " + (parsed ? check.error : "file is not valid JSON.") + " Nothing was changed.", true);
        return;
      }
      pendingRestore = { backup: parsed, summary: check.summary, fileName: file.name || "backup.json" };
      openRestoreConfirm();
    };
    reader.onerror = function () { setDataStatus("Couldn’t read that file. Nothing was changed.", true); };
    reader.readAsText(file);
  }

  function openRestoreConfirm() {
    if (!pendingRestore) return;
    var sm = pendingRestore.summary;
    var modal = document.getElementById("modal");
    modal.hidden = false;
    modal.innerHTML = '<div class="sheet restore-confirm">' +
      "<h3>Replace all data?</h3>" +
      '<p class="restore-warning">Restoring replaces <strong>everything</strong> in Paper Trail on this device — every budget month, transaction, income, Net Worth year, profile, and Vault file — with the backup below. Your current data is not kept. This can’t be undone.</p>' +
      '<div class="sheet-table">' +
      '<div class="row dense"><span>File</span><span class="mono">' + esc(pendingRestore.fileName) + "</span></div>" +
      '<div class="row dense"><span>Backed up</span><span class="mono">' + esc(sm.exportedAt ? sm.exportedAt.slice(0, 16).replace("T", " ") + " UTC" : "—") + "</span></div>" +
      '<div class="row dense"><span>App version</span><span class="mono">' + esc(sm.version || "—") + "</span></div>" +
      '<div class="row dense"><span>Budget months</span><span class="mono">' + sm.months + "</span></div>" +
      '<div class="row dense"><span>Transactions</span><span class="mono">' + sm.transactions + "</span></div>" +
      '<div class="row dense"><span>Vault cards / files</span><span class="mono">' + sm.documents + " / " + sm.files + "</span></div>" +
      "</div>" +
      (sm.excluded.length ? '<p class="caption rust">Not in this backup: ' + esc(sm.excluded.join("; ")) + "</p>" : "") +
      '<p class="caption">Tip: make a fresh Full backup first if you might want today’s data back.</p>' +
      '<div class="sheet-actions">' +
      '<button type="button" data-act="restore-cancel">Cancel</button>' +
      '<button class="danger-fill" type="button" data-act="restore-apply">Replace all my data</button></div></div>';
  }

  /* v37.5.59.12 (QA H2/H3): validate → size/quota check → write localStorage first → only then
   * touch IndexedDB. Any failure leaves the previous books untouched and never toasts success. */
  function estimateBackupBytes(backup) {
    try { return JSON.stringify(backup.state || {}).length + JSON.stringify(backup.documents || {}).length; }
    catch (err) { return Infinity; }
  }

  function localStorageFreeEnough(needChars) {
    try {
      var probe = "pt-quota-probe";
      var pad = "";
      // leave headroom for the key name and JSON overhead
      var target = Math.min(Math.max(needChars + 2048, 4096), 2 * 1024 * 1024);
      while (pad.length < target) pad += "0123456789abcdef";
      localStorage.setItem(probe, pad.slice(0, target));
      localStorage.removeItem(probe);
      return true;
    } catch (err) {
      try { localStorage.removeItem("pt-quota-probe"); } catch (e2) {}
      return false;
    }
  }

  function applyRestore() {
    if (!pendingRestore) return;
    var backup = pendingRestore.backup;
    var check = window.PaperTrailExport.validateBackup(backup);
    if (!check.ok) {
      pendingRestore = null;
      closeModal();
      setDataStatus("Can't restore: " + (check.error || "invalid backup") + " Nothing was changed.", true);
      showToast("Can't restore — nothing was changed", 5000);
      return;
    }
    var st;
    try { st = JSON.parse(JSON.stringify(backup.state)); }
    catch (err) {
      pendingRestore = null;
      closeModal();
      setDataStatus("Can't restore: backup could not be read. Nothing was changed.", true);
      return;
    }
    // Soft-load to catch anything validateBackup missed that loadState would throw on.
    var prevRaw = null;
    try { prevRaw = localStorage.getItem(STORAGE_KEY); } catch (err) { prevRaw = null; }
    var text;
    try { text = JSON.stringify(st); } catch (err) {
      pendingRestore = null; closeModal();
      setDataStatus("Can't restore: backup is too complex to save. Nothing was changed.", true);
      return;
    }
    // v37.5.59.12: only the real write decides quota — no hard byte gate (Vault blobs go to IDB).
    try {
      localStorage.setItem(STORAGE_KEY, text);
      if (localStorage.getItem(STORAGE_KEY) !== text) throw new Error("verify-mismatch");
    } catch (err) {
      try { if (prevRaw != null) localStorage.setItem(STORAGE_KEY, prevRaw); } catch (e2) {}
      pendingRestore = null; closeModal();
      setDataStatus("Backup too large for this browser's storage. Nothing was changed.", true);
      showToast("Backup too large — nothing was changed", 5000);
      return;
    }
    var loaded;
    try {
      loaded = loadState();
      if (!loaded || !loaded.months || !loaded.worth) throw new Error("load-blank");
      // Refuse a "successful" restore that wiped the books when the backup had data.
      var hadTx = check.summary.transactions > 0;
      var gotTx = 0;
      Object.keys(loaded.months).forEach(function (k) { gotTx += ((loaded.months[k] && loaded.months[k].transactions) || []).length; });
      if (hadTx && gotTx === 0) throw new Error("load-wiped");
    } catch (err) {
      try { if (prevRaw != null) localStorage.setItem(STORAGE_KEY, prevRaw); else localStorage.removeItem(STORAGE_KEY); } catch (e2) {}
      pendingRestore = null; closeModal();
      setDataStatus("Can't restore: backup failed a safety check. Nothing was changed.", true);
      showToast("Can't restore — nothing was changed", 5000);
      return;
    }
    var files = backup.documents || {};
    var docs = (st.profile && Array.isArray(st.profile.documents)) ? st.profile.documents : [];
    clearDocDb(function () {
      var i = 0;
      function next() {
        if (i >= docs.length) return finish();
        var doc = docs[i++];
        var url = files[doc.id];
        if (!url) {
          if (doc.hasBlob) doc.hasBlob = false;
          return next();
        }
        var blob = dataUrlToBlob(url);
        if (!blob) { doc.hasBlob = false; return next(); }
        putDocBlob(doc.id, blob, function (err) {
          if (err) { doc.hasBlob = false; doc.dataUrl = url; }
          else { doc.hasBlob = true; delete doc.dataUrl; }
          next();
        });
      }
      function finish() {
        // Rewrite state once more so hasBlob flags match what landed in IDB.
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(st));
        } catch (err) {
          // State already written above; IDB may be partial — keep cards, drop missing blobs.
        }
        state = loadState();
        ensureMonth(state.year, state.month);
        migrateProfileDocBlobs();
        envelopeEditMode = false;
        spendSearch = "";
        spendDraft = null;
        profileDocDraft = null;
        pendingDocFile = null;
        profileHighlightDocId = "";
        vaultPickMode = false;
        pendingRestore = null;
        saveBlocked = false;
        saveBlockedDetail = "";
        paintSaveWarning();
        closeModal();
        render();
        showToast("Restored from backup · " + check.summary.months + " months · " + check.summary.transactions + " transactions", 5000);
      }
      next();
    });
  }

  /* ---- v37.5.57 Tester data sharing ----
   * the owner's locked rules:
   *  ALWAYS (no opt-out): rates and changes — Basic/True savings rate, average tax, marginal brackets,
   *    YoY changes, plan-vs-spent % per category, category share % of spending, grade, streaks,
   *    feature usage counts, survey answers (choice answers only).
   *  OPT-OUT, on by default: (a) income dollars, (b) other dollar amounts, (c) Vault details (metadata only).
   *  NEVER: merchant names, transaction notes, account numbers, file contents (plus name, phone,
   *    birthday, ZIP, free-text survey answers, account/line names).
   * TESTER_ENDPOINT empty = never touch the network; payloads queue in localStorage only. */
  var TESTER_ENDPOINT = "";
  var TESTER_QUEUE_KEY = "PaperTrail.testerQueue.v1";
  var TESTER_QUEUE_MAX = 50;
  var TESTER_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
  var TESTER_SCHEMA = "papertrail.tester.v1";
  var TESTER_CODE_RE = /^PT-\d{3}$/;
  var TESTER_SURVEY_EXTRA_KEYS = ["serious", "decide", "needToSee", "primaryNeed", "secondaryNeed", "needs",
    "stress", "confidence", "targetReturn", "targetPercent"];
  var TESTER_MATTERS_KEYS = ["financeStart", "usesBudget", "budgetMethod", "aspireWealthy", "wealthPossible",
    "education", "millionaireGeneration", "frugal", "riskTolerance", "okIlliquidity",
    "needSignificance", "needAcceptance", "needIntelligence", "needPity", "needStrength", "goals"];
  var testerTimer = null;

  function migrateTesterShare(raw) {
    var s = raw && typeof raw === "object" ? raw : {};
    var usage = {};
    if (s.usage && typeof s.usage === "object" && !Array.isArray(s.usage)) {
      Object.keys(s.usage).forEach(function (k) {
        var n = Number(s.usage[k]);
        if (/^[a-z0-9-]{1,40}$/.test(k) && n > 0) usage[k] = Math.floor(n);
      });
    }
    return {
      code: normalizeTesterCode(s.code),
      shareIncomeDollars: s.shareIncomeDollars !== false,
      shareOtherDollars: s.shareOtherDollars !== false,
      shareVaultDetails: s.shareVaultDetails !== false,
      usage: usage,
      lastWeeklyAt: typeof s.lastWeeklyAt === "string" ? s.lastWeeklyAt : "",
      lastMonthKey: typeof s.lastMonthKey === "string" ? s.lastMonthKey : "",
      lastClosedMonth: typeof s.lastClosedMonth === "string" ? s.lastClosedMonth : "",
      lastSentAt: typeof s.lastSentAt === "string" ? s.lastSentAt : ""
    };
  }

  function testerShare() {
    state.testerShare = migrateTesterShare(state.testerShare);
    return state.testerShare;
  }

  /* "pt-7", "PT 007", "pt007" → "PT-007". Anything else → "" (not saved). */
  function normalizeTesterCode(value) {
    var raw = String(value == null ? "" : value).trim().toUpperCase();
    var m = raw.match(/^PT[\s-]?(\d{1,3})$/);
    if (!m) return "";
    var n = Number(m[1]);
    if (!(n >= 1)) return "";
    var code = "PT-" + ("00" + n).slice(-3);
    return TESTER_CODE_RE.test(code) ? code : "";
  }

  /* Local assignment only (no server yet): random PT-001…PT-999. */
  function assignTesterCode() {
    var n = 1 + Math.floor(Math.random() * 999);
    return "PT-" + ("00" + n).slice(-3);
  }

  function countFeatureUse(act) {
    if (!act || !/^[a-z0-9-]{1,40}$/.test(act)) return;
    var ts = testerShare();
    ts.usage[act] = (ts.usage[act] || 0) + 1;
  }

  function testerRound(n, places) {
    if (n == null || !isFinite(Number(n))) return null;
    var f = Math.pow(10, places == null ? 4 : places);
    return Math.round(Number(n) * f) / f;
  }

  function testerDollars(n) {
    if (n == null || !isFinite(Number(n))) return null;
    return Math.round(Number(n) * 100) / 100;
  }

  function testerMonthKey(month) {
    return month.year + "-" + ("0" + month.month).slice(-2);
  }

  function testerLocalDate(iso) {
    if (!iso) return null;
    var d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    return isoDate(d.getFullYear(), d.getMonth() + 1, d.getDate());
  }

  function testerTodayIso() {
    var d = new Date();
    return isoDate(d.getFullYear(), d.getMonth() + 1, d.getDate());
  }

  function testerAnnualYears() {
    var book = ensureAnnualStatement();
    var years = annualYearList(book);
    var filing = annualFilingStatus(book);
    return years.map(function (year) {
      var row = annualRow(book.years[year]);
      var m = annualMetrics(row, Number(year));
      var prior = annualPriorYear(years, year);
      var pm = prior != null ? annualMetrics(annualRow(book.years[prior]), Number(prior)) : null;
      var fedEst = annualEstimateFederalMarginal(row, filing, Number(year));
      var stEst = annualEstimateStateMarginal(row, filing, Number(year));
      var stRate = row.stateBracket === "other" ? row.stateOtherPct : (row.stateBracket != null ? row.stateBracket : stEst);
      return {
        year: year, prior: prior, row: row, metrics: m, priorMetrics: pm, filing: filing,
        federalMarginal: row.federalBracket != null ? row.federalBracket : fedEst,
        federalSource: row.federalBracket != null ? "picked" : (fedEst != null ? "estimate" : null),
        stateMarginal: stRate,
        stateSource: row.stateBracket === "other" ? "other" : (row.stateBracket != null ? "picked" : (stEst != null ? "estimate" : null))
      };
    });
  }

  function testerPctChange(now, before) {
    if (now == null || before == null || !(Math.abs(before) > 0)) return null;
    return testerRound((now - before) / Math.abs(before));
  }

  function testerAlwaysBlock(month) {
    var out = {};
    try {
      var r = monthSavingsRates(month);
      out.savingsRate = {
        month: testerMonthKey(month),
        basic: testerRound(r.basic && r.basic.rate),
        true: testerRound(r.trueRate && r.trueRate.rate),
        takeHomeSource: r.takeHomeSource || null
      };
    } catch (err) { out.savingsRate = null; }
    out.yearly = testerAnnualYears().map(function (y) {
      var m = y.metrics;
      var pm = y.priorMetrics;
      return {
        year: y.year,
        averageTax: testerRound(m.avgTax),
        savingsRate: testerRound(m.savings),
        federalMarginal: testerRound(y.federalMarginal),
        federalMarginalSource: y.federalSource,
        stateMarginal: testerRound(y.stateMarginal),
        stateMarginalSource: y.stateSource,
        filingStatus: y.filing,
        yoy: pm ? {
          vsYear: y.prior,
          totalIncomeChangePct: testerPctChange(m.total, pm.total),
          operatingCashFlowChangePct: testerPctChange(m.ocf, pm.ocf),
          savingsRateChangePts: (m.savings != null && pm.savings != null) ? testerRound((m.savings - pm.savings) * 100, 2) : null,
          averageTaxChangePts: (m.avgTax != null && pm.avgTax != null) ? testerRound((m.avgTax - pm.avgTax) * 100, 2) : null
        } : null
      };
    });
    var totals = sums(month);
    out.categories = (month.categories || []).map(function (c) {
      var assigned = catAssigned(c);
      var spent = spentFor(month, c.id);
      return {
        category: c.name || "",
        planVsSpentPct: assigned > 0 ? testerRound((spent - assigned) / assigned) : null,
        shareOfSpendingPct: totals.spent > 0 ? testerRound(Math.max(0, spent) / totals.spent) : null
      };
    });
    try {
      if (window.GradeMath && GradeMath.evaluate) {
        var g = GradeMath.evaluate(buildGradeInput(month));
        var band = g && g.band;
        out.grade = g ? {
          score: g.score != null ? g.score : null,
          band: band && typeof band === "object" ? (band.id || null) : (band || null),
          bandTitle: band && typeof band === "object" ? (band.title || null) : null
        } : null;
      }
    } catch (err) { out.grade = null; }
    out.streaks = { noSpendDays: hasExpenseHistory() ? currentNoSpendStreak() : null };
    out.featureUsage = JSON.parse(JSON.stringify(testerShare().usage));
    out.survey = testerSurveyBlock();
    return out;
  }

  function testerSurveyBlock() {
    var ob = onboarding();
    var a = (ob && ob.answers) || {};
    var welcome = {};
    var keys = Object.keys(SURVEY_ANSWER_KEY).map(function (k) { return SURVEY_ANSWER_KEY[k]; }).concat(TESTER_SURVEY_EXTRA_KEYS);
    keys.forEach(function (k) {
      var v = a[k];
      if (v == null || v === "" || (Array.isArray(v) && !v.length)) return;
      welcome[k] = Array.isArray(v) ? v.slice() : v;
    });
    var matters = {};
    var mt = state.matters || {};
    TESTER_MATTERS_KEYS.forEach(function (k) {
      var v = mt[k];
      if (v == null || v === "" || (Array.isArray(v) && !v.length)) return;
      matters[k] = Array.isArray(v) ? v.slice() : v;
    });
    return {
      completedAt: testerLocalDate(ob && ob.surveyCompletedAt),
      welcome: welcome,
      whatMatters: matters
    };
  }

  function testerIncomeBlock(month, includeOcf) {
    var years = testerAnnualYears().map(function (y) {
      var row = y.row;
      var m = y.metrics;
      var out = { year: y.year };
      ["salary", "bonus", "sideGig", "other", "match"].forEach(function (k) { out[k] = testerDollars(row[k]); });
      out.totalIncome = testerDollars(m.total);
      out.taxes = testerDollars(m.taxes);
      ANNUAL_TAX_PART_FIELDS.forEach(function (k) { if (row[k] != null) out[k] = testerDollars(row[k]); });
      if (includeOcf) {
        out.operatingCashFlow = testerDollars(m.ocf);
        out.operatingCashFlowChange = (y.priorMetrics && m.ocf != null && y.priorMetrics.ocf != null)
          ? testerDollars(m.ocf - y.priorMetrics.ocf) : null;
      }
      return out;
    });
    var est = null;
    try {
      var plan = state.compensation || defaultCompensation();
      if (Number(plan.baseSalary) > 0) {
        var c = estimateCompensation(plan);
        est = { baseSalary: testerDollars(c.baseSalary), bonus: testerDollars(c.bonus), takeHomeYear: testerDollars(c.takeHome), perPaycheck: testerDollars(c.suggestedPaycheck), totalTax: testerDollars(c.totalTax) };
      }
    } catch (err) { est = null; }
    var stub = null;
    var snap = state.compensation && state.compensation.payStubSnapshot;
    if (snap && typeof snap === "object") {
      stub = {};
      Object.keys(snap).forEach(function (k) {
        if (typeof snap[k] === "number" && isFinite(snap[k])) stub[k] = testerDollars(snap[k]);
      });
    }
    var totals = sums(month);
    return {
      yearly: years,
      compensationEstimate: est,
      payStub: stub,
      month: {
        month: testerMonthKey(month),
        paychecksPlanned: (month.incomes || []).map(function (i) { return testerDollars(i.amount); }),
        plannedTotal: testerDollars(totals.income),
        receivedTotal: testerDollars(totals.received)
      }
    };
  }

  function testerOtherDollarsBlock(month) {
    var totals = sums(month);
    var cats = (month.categories || []).map(function (c) {
      return { category: c.name || "", assigned: testerDollars(catAssigned(c)), spent: testerDollars(spentFor(month, c.id)) };
    });
    var years = testerAnnualYears().map(function (y) {
      return { year: y.year, operatingExpenses: testerDollars(y.row.opex), investments: testerDollars(y.row.investments) };
    });
    var worthYears = {};
    (state.worth.lines || []).forEach(function (line) {
      Object.keys(line.amounts || {}).forEach(function (yr) { if ((Number(line.amounts[yr]) || 0) !== 0) worthYears[yr] = true; });
    });
    var netWorth = Object.keys(worthYears).map(Number).sort(function (a, b) { return a - b; }).map(function (yr) {
      var t = worthTotals(yr);
      return { year: yr, assets: testerDollars(t.assets), liabilities: testerDollars(t.liabilities), netWorth: testerDollars(t.equity) };
    });
    var latest = netWorth.length ? netWorth[netWorth.length - 1].year : null;
    var debts = (state.worth.lines || []).filter(function (line) { return line.kind === "liability"; }).map(function (line) {
      return {
        type: line.loanDebtType || line.group || "other",
        balance: testerDollars(Number(line.loanBalance) > 0 ? line.loanBalance : (latest != null ? lineAmount(line, latest) : 0)),
        apr: testerRound(line.loanApr),
        minPayment: testerDollars(line.loanMinPayment)
      };
    }).filter(function (d) { return d.balance > 0 || d.minPayment > 0; });
    return {
      month: {
        month: testerMonthKey(month),
        assignedTotal: testerDollars(totals.assigned),
        spentTotal: testerDollars(totals.spent),
        categories: cats
      },
      yearly: years,
      netWorth: netWorth,
      debts: debts
    };
  }

  /* Metadata only. Never file names, titles, providers, policy numbers, notes, or file bytes. */
  function testerVaultBlock() {
    var docs = (state.profile && state.profile.documents) || [];
    var byType = {};
    var bySlot = {};
    docs.forEach(function (d) {
      var t = d.vaultType || "unsorted";
      byType[t] = (byType[t] || 0) + 1;
      var s = d.slot || "other";
      bySlot[s] = (bySlot[s] || 0) + 1;
    });
    return {
      documentCount: docs.length,
      byType: byType,
      bySlot: bySlot,
      withFile: docs.filter(function (d) { return d.hasBlob; }).length,
      payStubsConfirmed: docs.filter(function (d) { return d.payStubConfirmed; }).length
    };
  }

  function buildTesterPayload(trigger) {
    var ts = testerShare();
    if (!ts.code) {
      ts.code = assignTesterCode();
      saveState();
    }
    var month = ensureMonth(state.year, state.month);
    var payload = {
      schema: TESTER_SCHEMA,
      testerCode: ts.code,
      appVersion: APP_VERSION,
      date: testerTodayIso(),
      createdAt: new Date().toISOString(),
      trigger: trigger || "manual",
      sharing: {
        ratesAndChanges: "always",
        incomeDollars: ts.shareIncomeDollars,
        otherDollars: ts.shareOtherDollars,
        vaultDetails: ts.shareVaultDetails
      },
      always: testerAlwaysBlock(month)
    };
    /* OCF dollars mix income and spending, so they go out only when both dollar switches are on. */
    if (ts.shareIncomeDollars) payload.incomeDollars = testerIncomeBlock(month, ts.shareOtherDollars);
    if (ts.shareOtherDollars) payload.otherDollars = testerOtherDollarsBlock(month);
    if (ts.shareVaultDetails) payload.vault = testerVaultBlock();
    return payload;
  }

  function readTesterQueue() {
    try {
      var list = JSON.parse(localStorage.getItem(TESTER_QUEUE_KEY) || "[]");
      return Array.isArray(list) ? list : [];
    } catch (err) { return []; }
  }

  function writeTesterQueue(list) {
    try { localStorage.setItem(TESTER_QUEUE_KEY, JSON.stringify(list.slice(-TESTER_QUEUE_MAX))); } catch (err) {}
  }

  function queueTesterPayload(payload) {
    var list = readTesterQueue();
    list.push(payload);
    writeTesterQueue(list);
    return list.length;
  }

  /* Turning a switch off also strips that block from anything still waiting in the queue. */
  function scrubTesterQueue() {
    var ts = testerShare();
    var list = readTesterQueue();
    if (!list.length) return;
    list.forEach(function (p) {
      if (!p || typeof p !== "object") return;
      p.sharing = p.sharing || {};
      if (!ts.shareIncomeDollars) { delete p.incomeDollars; p.sharing.incomeDollars = false; }
      if (!ts.shareOtherDollars) {
        delete p.otherDollars;
        p.sharing.otherDollars = false;
        (p.incomeDollars && p.incomeDollars.yearly || []).forEach(function (y) { delete y.operatingCashFlow; delete y.operatingCashFlowChange; });
      }
      if (!ts.shareVaultDetails) { delete p.vault; p.sharing.vaultDetails = false; }
    });
    writeTesterQueue(list);
  }

  /* POST JSON to TESTER_ENDPOINT. Empty endpoint → no network at all; queue locally. */
  function sendTesterPayload(payload) {
    if (!payload || typeof payload !== "object") return Promise.resolve({ status: "skipped" });
    if (!TESTER_ENDPOINT) {
      var n = queueTesterPayload(payload);
      return Promise.resolve({ status: "queued", reason: "not-connected", queued: n });
    }
    if (typeof fetch !== "function") {
      return Promise.resolve({ status: "queued", reason: "no-fetch", queued: queueTesterPayload(payload) });
    }
    return fetch(TESTER_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true
    }).then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      testerShare().lastSentAt = new Date().toISOString();
      saveState();
      flushTesterQueue();
      return { status: "sent" };
    }).catch(function () {
      return { status: "queued", reason: "error", queued: queueTesterPayload(payload) };
    });
  }

  /* Only runs once an endpoint is configured; sends queued payloads oldest first. */
  function flushTesterQueue() {
    if (!TESTER_ENDPOINT || typeof fetch !== "function") return;
    var list = readTesterQueue();
    if (!list.length) return;
    writeTesterQueue([]);
    list.reduce(function (chain, p) {
      return chain.then(function () {
        return fetch(TESTER_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(p) })
          .then(function (res) { if (!res.ok) throw new Error("HTTP " + res.status); })
          .catch(function () { queueTesterPayload(p); });
      });
    }, Promise.resolve());
  }

  function testerReady() {
    var ob = state.onboarding;
    return !(ob && ob.status === "survey");
  }

  /* Month close (calendar month changed since last check) or weekly while the app is open. */
  function maybeQueueScheduledTester() {
    if (!testerReady()) return;
    var ts = testerShare();
    var now = new Date();
    var mk = ymKey(now.getFullYear(), now.getMonth() + 1);
    var changed = false;
    if (!ts.lastMonthKey) {
      ts.lastMonthKey = mk;
      changed = true;
    } else if (ts.lastMonthKey !== mk) {
      /* Skip if Start next month already sent this month's close. */
      if (ts.lastClosedMonth !== ts.lastMonthKey) sendTesterPayload(buildTesterPayload("month-close"));
      ts.lastClosedMonth = ts.lastMonthKey;
      ts.lastMonthKey = mk;
      ts.lastWeeklyAt = now.toISOString();
      changed = true;
    }
    var last = ts.lastWeeklyAt ? Date.parse(ts.lastWeeklyAt) : 0;
    if (!(last > 0) || now.getTime() - last >= TESTER_WEEK_MS) {
      sendTesterPayload(buildTesterPayload("weekly"));
      ts.lastWeeklyAt = now.toISOString();
      changed = true;
    }
    if (changed) saveState();
  }

  /* Start next month ritual = closing the budget month. One close share per month. */
  function queueTesterMonthClose(closingKey) {
    if (!testerReady()) return;
    var ts = testerShare();
    if (ts.lastClosedMonth === closingKey) return;
    sendTesterPayload(buildTesterPayload("month-close"));
    ts.lastClosedMonth = closingKey;
    ts.lastWeeklyAt = new Date().toISOString();
    saveState();
  }

  function startTesterSchedule() {
    try { maybeQueueScheduledTester(); } catch (err) {}
    if (testerTimer) clearInterval(testerTimer);
    testerTimer = setInterval(function () {
      try { maybeQueueScheduledTester(); } catch (err) {}
    }, 60 * 60 * 1000);
  }

  function testerToggleHtml(field, label, caption, on) {
    return '<label class="settings-toggle tester-toggle">' + esc(label) +
      '<input type="checkbox" data-act="tester-toggle" data-field="' + field + '"' + (on ? " checked" : "") + "></label>" +
      '<p class="caption tester-toggle-caption">' + caption + "</p>";
  }

  function profileSharingHtml() {
    var ts = testerShare();
    var queued = readTesterQueue().length;
    return '<div class="profile-sharing" id="profile-sharing">' +
      '<p class="profile-section">Data sharing</p>' +
      '<p class="caption">Testers share app data to help find bugs and improve Paper Trail. Rates and percentages (like savings rate and how it moves year to year) are always included. Dollar amounts and Vault details are included unless you switch them off below.</p>' +
      '<label class="field">Tester code' +
      '<input data-act="tester-code" type="text" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="6" placeholder="PT-001" value="' + esc(ts.code) + '"></label>' +
      (ts.code ? "" : '<button class="text-btn tester-assign" type="button" data-act="tester-assign">Assign me a code</button>') +
      '<p class="caption" id="tester-code-hint">' + (ts.code
        ? "Sent with every share, along with the app version and date."
        : "Format PT-001. Type the code you were given, or assign one.") + "</p>" +
      '<div class="tester-always">' +
      '<p class="tester-kicker">Always shared · rates and percentages</p>' +
      '<p class="caption">Savings rates (Basic and True), average tax, marginal tax brackets, year-over-year changes, plan vs. spent % by category, and each category’s share of spending — plus your grade, streaks, how often you use each feature, and your survey answers. This group stays on for every tester.</p>' +
      "</div>" +
      '<p class="tester-kicker">Shared unless you turn it off · dollar amounts and Vault details</p>' +
      testerToggleHtml("shareIncomeDollars", "Income dollars", "Salary, bonus, side gig, other income, 401k match, taxes, take-home, and paycheck amounts.", ts.shareIncomeDollars) +
      testerToggleHtml("shareOtherDollars", "Other dollar amounts", "Budget and spending totals by category, net worth, and debts.", ts.shareOtherDollars) +
      testerToggleHtml("shareVaultDetails", "Vault details", "How many documents you have and their types — not the files.", ts.shareVaultDetails) +
      '<p class="tester-kicker">Not included</p>' +
      '<p class="caption">Tester sharing doesn’t collect merchant names, transaction notes, account numbers, file contents, or your name, phone, birthday, or ZIP.</p>' +
      '<button class="data-btn tester-preview-btn" type="button" data-act="tester-preview"><strong>Preview what’s shared</strong><span class="caption">The exact data that would go out, with your switches applied</span></button>' +
      '<p class="caption tester-status">' + (TESTER_ENDPOINT
        ? "Connected. " + (queued ? queued + " waiting to send." : "")
        : "Not connected yet — nothing leaves this device. " + (queued === 1 ? "1 share is" : queued + " shares are") + " saved here until it connects.") + "</p>" +
      "</div>";
  }

  function testerSummaryRows(p) {
    var a = p.always || {};
    var sr = a.savingsRate || {};
    var fmtPct = function (v) { return v == null ? "—" : (Math.round(v * 1000) / 10) + "%"; };
    var latestYear = (a.yearly || []).length ? a.yearly[a.yearly.length - 1] : null;
    var rows = [
      ["Tester code", p.testerCode],
      ["App version", p.appVersion],
      ["Date", p.date],
      ["Basic / True savings rate", fmtPct(sr.basic) + " / " + fmtPct(sr.true)],
      ["Yearly statement", (a.yearly || []).length + " year" + ((a.yearly || []).length === 1 ? "" : "s") +
        (latestYear ? " · " + latestYear.year + " avg tax " + fmtPct(latestYear.averageTax) : "")],
      ["Categories (% only)", (a.categories || []).length + ""],
      ["Grade", a.grade && a.grade.score != null ? a.grade.score + (a.grade.bandTitle ? " · " + a.grade.bandTitle : "") : "—"],
      ["No-spend streak", a.streaks && a.streaks.noSpendDays != null ? a.streaks.noSpendDays + " days" : "—"],
      ["Feature uses tracked", Object.keys(a.featureUsage || {}).length + " features"],
      ["Survey answers", Object.keys((a.survey && a.survey.welcome) || {}).length + Object.keys((a.survey && a.survey.whatMatters) || {}).length + ""]
    ];
    return rows;
  }

  function openTesterPreview() {
    captureModalReturnScreenTop();
    var p = buildTesterPayload("preview");
    var ts = testerShare();
    var queued = readTesterQueue().length;
    var modal = document.getElementById("modal");
    var onOff = function (on) { return on ? '<span class="tester-on">Shared</span>' : '<span class="tester-off">Off · not sent</span>'; };
    var html = '<div class="sheet tester-preview-sheet">' +
      '<button class="text-btn about-back" type="button" data-act="tester-preview-back">‹ Profile</button>' +
      "<h2>What’s shared</h2>" +
      '<p class="tester-conn">' + (TESTER_ENDPOINT ? "Connected" : "Not connected yet") + "</p>" +
      '<p class="caption">' + (TESTER_ENDPOINT
        ? "This is exactly what the next share sends."
        : "Nothing has left this device. When sharing connects, this is exactly what would be sent. " +
          (queued === 1 ? "1 share is" : queued + " shares are") + " saved on this device for now.") + "</p>" +
      '<dl class="tester-summary">' +
      testerSummaryRows(p).map(function (r) { return "<dt>" + esc(r[0]) + "</dt><dd>" + esc(r[1]) + "</dd>"; }).join("") +
      "<dt>Rates &amp; changes (percentages only)</dt><dd>" + '<span class="tester-on">Always shared</span>' + "</dd>" +
      "<dt>Income dollars</dt><dd>" + onOff(ts.shareIncomeDollars) + "</dd>" +
      "<dt>Other dollar amounts</dt><dd>" + onOff(ts.shareOtherDollars) + "</dd>" +
      "<dt>Vault details (count and types only)</dt><dd>" + onOff(ts.shareVaultDetails) + "</dd>" +
      "<dt>Merchants, notes, account numbers, files</dt><dd>" + '<span class="tester-off">Not included</span>' + "</dd>" +
      "</dl>" +
      '<p class="tester-kicker">Exact payload (JSON)</p>' +
      '<pre class="tester-json">' + esc(JSON.stringify(p, null, 2)) + "</pre>" +
      '<div class="sheet-actions"><button class="primary" type="button" data-act="tester-preview-back">Done</button></div>' +
      "</div>";
    modal.hidden = false;
    modal.innerHTML = html;
    var sheet = modal.querySelector(".sheet");
    if (sheet) sheet.scrollTop = 0;
  }

  function profileDataHtml() {
    return '<div class="profile-data" id="profile-data">' +
      '<p class="profile-section">Data</p>' +
      '<p class="caption">Exports and backups are files you save yourself.</p>' +
      '<button class="data-btn" type="button" data-act="export-xlsx"><strong>Export to Excel</strong><span class="caption">.xlsx · Budget by month, Transactions, Income, Net Worth</span></button>' +
      '<button class="data-btn" type="button" data-act="export-pdf"><strong>Monthly report (PDF)</strong><span class="caption">Budget vs spent, income planned vs received, net worth · opens Print → Save as PDF</span></button>' +
      '<button class="data-btn" type="button" data-act="export-backup"><strong>Full backup</strong><span class="caption">.json · all app data + Vault files inlined as base64</span></button>' +
      '<button class="data-btn" type="button" data-act="restore-file"><strong>Restore from file…</strong><span class="caption">Checks the file first, then asks before replacing anything</span></button>' +
      '<input id="restore-file" data-act="restore-file-input" type="file" accept="application/json,.json" hidden>' +
      '<p class="caption" id="data-status" aria-live="polite"></p>' +
      '<p class="caption">Backup includes budgets, transactions (type, splits, refunds), income, Net Worth, Income statement / pay-stub snapshot, goals, settings, and Vault cards + files. Not included: nothing else is stored. A Vault file that can’t be read on this device is listed by name after export.</p>' +
      "</div>";
  }

  function profileDocumentsHtml(profile) {
    var docs = profile.documents || [];
    var html = '<div id="profile-docs" class="doc-slot">' +
      '<p class="profile-section">Documents</p>' +
      '<p class="caption">Numbers stay in the tracker; papers live here. Tester sharing can include only the document count and types (Data sharing below).</p>' +
      '<button class="doc-add" type="button" data-act="profile-doc-plus" aria-label="Add paper">+</button>';
    if (profileDocDraft && profileDocDraft.mode === "pick") {
      html += '<div class="doc-picker">' +
        '<button class="planner-apply" type="button" data-act="profile-doc-camera">Take photo</button>' +
        '<button class="planner-apply" type="button" data-act="profile-doc-choose">Choose file</button>' +
        '<p class="caption">Camera on a phone.</p></div>';
    }
    html += '<input id="profile-doc-camera" data-act="profile-doc-file" accept="image/*" capture="environment" type="file" hidden>' +
      '<input id="profile-doc-file" data-act="profile-doc-file" accept="image/*,application/pdf,.pdf,.png,.jpg,.jpeg,.heic,.webp" type="file" hidden>';
    if (profileDocDraft && profileDocDraft.mode === "edit") {
      html += documentEditFormHtml(profileDocDraft);
    }
    if (!docs.length && !(profileDocDraft && profileDocDraft.mode === "edit")) {
      html += '<p class="caption">Empty — that’s OK.</p>';
    }
    docs.forEach(function (doc) {
      var highlight = doc.id === profileHighlightDocId ? " is-highlight" : "";
      html += '<div class="doc-file' + highlight + '" data-doc-row="' + esc(doc.id) + '">' +
        '<div class="doc-file-main"><span class="doc-cue-static" aria-hidden="true">📎</span><strong>' +
        esc(doc.fileName || "File") + "</strong>" +
        '<span class="caption">' + esc(docCaption(doc)) + "</span></div>" +
        '<div class="doc-file-actions">' +
        '<button class="text-btn" type="button" data-act="open-profile-doc" data-id="' + esc(doc.id) + '">Open</button>' +
        '<button class="text-btn" type="button" data-act="edit-profile-doc" data-id="' + esc(doc.id) + '">Rename / tag</button>' +
        '<button class="text-btn danger" type="button" data-act="remove-profile-doc" data-id="' +
        esc(doc.id) + '">Delete</button></div></div>';
    });
    html += "</div>";
    return html;
  }

  function docCaption(doc) {
    var tag = docSlotTitle(doc.slot);
    var bits = [tag];
    if (doc.title && doc.title !== doc.fileName) bits.push(doc.title);
    if (doc.linkedName) bits.push("linked to " + doc.linkedName);
    else if (doc.linkedKind === "income") bits.push("linked to Income");
    return bits.join(" · ");
  }

  function documentEditFormHtml(draft) {
    var targets = docLinkTargets();
    var selected = (draft.linkedKind || "") + "|" + (draft.linkedId || "") + "|" + (draft.linkedName || "");
    return '<form class="doc-edit" data-act="save-profile-doc">' +
      '<label class="field">Name<input name="fileName" type="text" value="' + esc(draft.fileName || "") + '"></label>' +
      '<label class="field">Tag<select name="slot">' +
      DOC_SLOTS.map(function (item) {
        return '<option value="' + item.id + '"' + (draft.slot === item.id ? " selected" : "") + ">" +
          esc(item.title) + "</option>";
      }).join("") +
      "</select></label>" +
      '<label class="field">Linked entry<select name="link">' +
      targets.map(function (row) {
        var value = row.kind + "|" + row.id + "|" + row.name;
        return '<option value="' + esc(value) + '"' + (value === selected ? " selected" : "") + ">" +
          esc(row.label) + "</option>";
      }).join("") +
      "</select></label>" +
      '<p class="caption">Link the paper to the matching tracker line when you can.</p>' +
      '<div class="sheet-actions">' +
      '<button type="button" data-act="cancel-profile-doc">Cancel</button>' +
      '<button class="primary" type="submit">Save</button></div></form>';
  }

  function addProfileDocument(file, opts) {
    if (!file) return;
    opts = opts || {};
    state.profile = migrateProfile(state.profile, state.foo, state.compensation);
    var replacing = opts.replaceId ? findProfileDoc(opts.replaceId) : null;
    // v37.5.59.6 (QA): remember the pay stub card as it was, so Cancel on the review puts it back.
    if (replacing && normalizeDocSlot(replacing.slot) === "payStubs") {
      payStubUndo[replacing.id] = JSON.parse(JSON.stringify(replacing));
    }
    var slot = replacing && normalizeDocSlot(replacing.slot) === "payStubs"
      ? "payStubs"
      : guessDocSlot(file.name);
    var link = suggestDocLink(slot);
    var blanks = emptyVaultFields();
    var doc = {
      id: opts.replaceId || nextId(),
      slot: slot,
      fileName: file.name || "Photo",
      mime: file.type || "",
      hasBlob: false,
      dataUrl: "",
      linkedKind: link ? link.kind : defaultLinkedKind(slot),
      linkedId: link ? link.id : "",
      linkedName: link ? link.name : "",
      title: blanks.title,
      titleCustomized: false,
      vaultType: blanks.vaultType,
      vaultTypeCustomized: false,
      provider: blanks.provider,
      policyNumber: "",
      insuredItems: "",
      premium: 0,
      premiumFrequency: "monthly",
      deductibles: "",
      limits: "",
      termRenewal: "",
      notes: "",
      balance: 0,
      rate: 0,
      payment: 0,
      escrow: "",
      term: "",
      property: "",
      minPayment: 0,
      originalBalance: 0,
      addToNetWorth: null,
      touchedFields: {},
      pdfAutofillReview: false,
      pdfAutofilledFields: [],
      pdfScanned: false,
      pdfQuickReadFailed: false,
      collateral: ""
    };
    function finish() {
      if (window.GradeMath && window.GradeMath.enrichVaultDoc) window.GradeMath.enrichVaultDoc(doc);
      function afterPdf() {
        if (window.GradeMath && window.GradeMath.enrichVaultDoc) window.GradeMath.enrichVaultDoc(doc);
        if (opts.replaceId) {
          var existing = findProfileDoc(opts.replaceId);
          if (existing) {
            existing.fileName = doc.fileName;
            existing.mime = doc.mime;
            existing.hasBlob = doc.hasBlob;
            existing.dataUrl = doc.dataUrl;
            mergeVaultPdfInto(existing, doc);
            if (!existing.provider) {
              existing.provider = guessVaultProvider(
                existing.fileName,
                existing.vaultType || inferVaultType(existing)
              ) || "";
            }
            if (!existing.titleCustomized) applyVaultTitle(existing);
            doc = existing;
          } else {
            state.profile.documents.push(doc);
          }
        } else {
          state.profile.documents.push(doc);
        }
        if (shouldAddVaultToNetWorth(doc)) syncVaultLoanToNetWorth(doc);
        saveState();
        pendingDocFile = null;
        if (opts.fromVault || state.statsDoor === "vault") {
          vaultPickMode = false;
          state.vaultDocId = doc.id;
          saveState();
          renderVaultPreserve();
          return;
        }
        profileDocDraft = {
          mode: "edit",
          id: doc.id,
          slot: doc.slot,
          fileName: doc.fileName,
          linkedKind: doc.linkedKind,
          linkedId: doc.linkedId,
          linkedName: doc.linkedName
        };
        openProfile({ preserveScroll: true, highlightDocId: doc.id });
      }
      maybeAutofillVaultPdf(doc, file, afterPdf);
    }
    putDocBlob(doc.id, file, function (err) {
      if (!err) {
        doc.hasBlob = true;
        finish();
        return;
      }
      var reader = new FileReader();
      reader.onload = function () {
        doc.dataUrl = typeof reader.result === "string" ? reader.result : "";
        finish();
      };
      try {
        reader.readAsDataURL(file);
      } catch (readErr) {
        finish();
      }
    });
  }

  function findProfileDoc(id) {
    return ((state.profile && state.profile.documents) || []).filter(function (doc) {
      return doc.id === id;
    })[0];
  }

  function confirmDeleteVaultDoc(doc) {
    var label = (doc && String(doc.title || doc.fileName || "").replace(/^\s+|\s+$/g, "")) || "this card";
    if (findLinkedNwLiability(doc)) {
      return window.confirm("Delete " + label + "? This removes the Vault card and unlinks it from Net Worth. The Net Worth row stays.");
    }
    return window.confirm("Delete " + label + "? This removes only this Vault card.");
  }

  function isEmptyVaultDraft(doc) {
    if (!doc || !doc._vaultDraft) return false;
    if (doc.hasBlob || doc.dataUrl) return false;
    if (doc.payStubConfirmed || doc.payStubPending) return false;
    if (vaultNum(doc.balance) > 0 || vaultNum(doc.payment) > 0 || vaultNum(doc.premium) > 0) return false;
    if (vaultNum(doc.minPayment) > 0 || vaultNum(doc.rate) > 0) return false;
    var title = String(doc.title || "").replace(/^\s+|\s+$/g, "");
    var type = doc.vaultType || inferVaultType(doc);
    var defaultTitle = defaultVaultTitle(type, "", "");
    if (title && title !== defaultTitle && title !== "Pay stub" && title !== "Loan") return false;
    if (String(doc.provider || "").replace(/^\s+|\s+$/g, "")) return false;
    if (String(doc.notes || "").replace(/^\s+|\s+$/g, "")) return false;
    return true;
  }

  function discardEmptyVaultDraft(docId) {
    var doc = findProfileDoc(docId || "");
    if (!doc || !isEmptyVaultDraft(doc)) return false;
    unlinkVaultFromNetWorth(doc);
    /* Also drop a $0 liability created earlier for this draft. */
    if (doc.linkedId && state.worth && state.worth.lines) {
      state.worth.lines = state.worth.lines.filter(function (line) {
        return !(line && line.id === doc.linkedId && line.kind === "liability" &&
          !(vaultNum(line.loanBalance) > 0) && !(lineAmount(line, currentWorthYear()) > 0));
      });
    }
    return removeVaultDocumentById(doc.id);
  }

  function removeVaultDocumentById(id) {
    id = String(id || "");
    if (!id || !state.profile) return false;
    var docs = state.profile.documents || [];
    var removed = gm().findVaultDocForWrite ? gm().findVaultDocForWrite(docs, id) : findProfileDoc(id);
    if (!removed) return false;
    state.profile.documents = gm().removeVaultDocById
      ? gm().removeVaultDocById(docs, id)
      : docs.filter(function (doc) { return !(doc && doc.id === id); });
    removed.dataUrl = "";
    deleteDocBlob(id);
    if (state.vaultDocId === id) state.vaultDocId = "";
    if (profileDocDraft && profileDocDraft.id === id) profileDocDraft = null;
    saveState();
    return true;
  }

  function openStoredDocument(id) {
    captureModalReturnScreenTop();
    var doc = findProfileDoc(id);
    if (!doc) return;
    function showBlob(blob, fallbackUrl) {
      var url = fallbackUrl || ((blob && window.URL && URL.createObjectURL) ? URL.createObjectURL(blob) : "");
      if (!url) return;
      var modal = document.getElementById("modal");
      var mime = (blob && blob.type) || doc.mime || "";
      var isImage = /^image\//.test(mime) || /\.(png|jpe?g|gif|webp|heic)$/i.test(doc.fileName || "");
      var body = isImage
        ? '<img class="doc-preview-img" alt="' + esc(doc.fileName || "Document") + '" src="' + url + '">'
        : '<p class="caption">' + esc(doc.fileName || "File") + '</p>' +
          '<a class="planner-apply" href="' + url + '" target="_blank" rel="noopener">Open file</a>';
      modal.hidden = false;
      modal.innerHTML = '<div class="sheet doc-preview-sheet">' +
        "<h3>" + esc(doc.fileName || "Paper") + "</h3>" + body +
        '<div class="sheet-actions">' +
        '<button type="button" data-act="' +
        (state.statsDoor === "vault" ? "back-to-vault-doc" : "back-to-profile-docs") +
        '">' + (state.statsDoor === "vault" ? "Vault" : "Documents") + "</button>" +
        '<button type="button" data-act="close-modal">Done</button></div></div>';
    }
    if (doc.hasBlob) {
      getDocBlob(doc.id, function (err, blob) {
        if (!err && blob) showBlob(blob);
        else if (doc.dataUrl) showBlob(null, doc.dataUrl);
      });
    } else if (doc.dataUrl) {
      showBlob(null, doc.dataUrl);
    }
  }

  function bindDollarInputs(root) {
    bindMoneyInputs(root);
  }

  function renderFab() {
    var el = document.getElementById("fab-add");
    if (!el) return;
    // v37.5.59.2 (QA L02/L04): the floating + covered the Insights lock and Net worth values
    // (annual income, Mortgage). It now lives only where you add transactions — Budget and
    // Transactions — and those screens reserve bottom room so the last row scrolls clear of it.
    var show = state.tab === "budget" || state.tab === "spend";
    el.hidden = !show;
    var scr = document.getElementById("screen");
    if (scr) scr.classList.toggle("has-fab", show);
  }

  function bindNwScrubber(root) {
    var wrap = root && root.querySelector("[data-nw-scrub]");
    if (!wrap || wrap.dataset.scrubBound === "1") return;
    wrap.dataset.scrubBound = "1";
    var years = [];
    try { years = JSON.parse(wrap.getAttribute("data-years") || "[]"); } catch (err) { years = []; }
    if (years.length < 2) return;
    var dragging = false;
    function yearAt(clientX) {
      var svg = wrap.querySelector("svg") || wrap;
      var rect = svg.getBoundingClientRect();
      var t = (clientX - rect.left) / Math.max(1, rect.width);
      var i = Math.round(t * (years.length - 1));
      return years[Math.max(0, Math.min(years.length - 1, i))];
    }
    function apply(year) {
      if (year == null) return;
      state.worthScrubYear = year;
      saveState();
      var i = years.indexOf(year);
      var svg = wrap.querySelector("svg");
      var line = svg && svg.querySelector(".nw-rule");
      if (line && i >= 0) {
        var w = 320;
        var padL = 8;
        var padR = 8;
        var x = padL + i * (w - padL - padR) / (years.length - 1);
        line.setAttribute("x1", x.toFixed(1));
        line.setAttribute("x2", x.toFixed(1));
      }
      var readout = wrap.querySelector(".scrub-readout");
      var nw = Number(wrap.getAttribute("data-nw-" + year)) || 0;
      var inc = Number(wrap.getAttribute("data-inc-" + year)) || 0;
      if (readout) {
        readout.textContent = year + " · Net worth " + money(nw) + " · Income " + money(inc);
      }
    }
    wrap.addEventListener("pointerdown", function (event) {
      dragging = true;
      if (wrap.setPointerCapture) wrap.setPointerCapture(event.pointerId);
      apply(yearAt(event.clientX));
    });
    wrap.addEventListener("pointermove", function (event) {
      if (!dragging) return;
      apply(yearAt(event.clientX));
    });
    wrap.addEventListener("pointerup", function () { dragging = false; });
    wrap.addEventListener("pointercancel", function () { dragging = false; });
  }

  function paintKey() {
    return [
      state.tab,
      state.statsDoor || "",
      state.vaultDocId || "",
      state.worthDetails ? "1" : "0",
      state.statementDetails ? "1" : "0",
      state.insightsDoor || ""
    ].join("/");
  }

  function captureModalReturnScreenTop() {
    var screen = document.getElementById("screen");
    modalReturnScreenTop = screen ? screen.scrollTop : 0;
    modalReturnAnchor = clickAnchor && Date.now() - clickAnchor.t < 1500 ? clickAnchor : null;
    clickAnchor = null;
  }

  /* Scroll so the anchored row sits where it was; falls back to the saved scrollTop.
   * v37.5.59.12 (QA M6): retry across several frames — Equity/Trend/Allocation can land after 80ms. */
  function applyReturnScroll(top, anchor) {
    var cancelled = false;
    var lastUserScroll = null;
    function onUserScroll() {
      var screen = document.getElementById("screen");
      if (screen) lastUserScroll = screen.scrollTop;
    }
    function once() {
      var screen = document.getElementById("screen");
      if (!screen) return null;
      var el = null;
      if (anchor) {
        var sel = '[data-act="' + anchor.act + '"][data-id="' + String(anchor.id).replace(/["\\]/g, "\\$&") + '"]';
        try { el = screen.querySelector(sel); } catch (e) { el = null; }
        if (!el && anchor.act === "edit-line") {
          // Fallback: match by visible name if id ever churns.
          el = screen.querySelector('[data-act="edit-line"][data-id="' + String(anchor.id) + '"]');
        }
      }
      if (el) {
        var screenTop = screen.getBoundingClientRect().top;
        var desired = screenTop + anchor.offset;
        screen.scrollTop += el.getBoundingClientRect().top - desired;
      } else {
        screen.scrollTop = top;
      }
      return screen.scrollTop;
    }
    var screen0 = document.getElementById("screen");
    if (screen0) screen0.addEventListener("scroll", onUserScroll, { passive: true });
    var set = once();
    [16, 50, 100, 200, 350, 500].forEach(function (ms) {
      setTimeout(function () {
        if (cancelled) return;
        var cur = document.getElementById("screen");
        if (!cur) return;
        // Stop chasing if the user scrolled away from our last set point.
        if (lastUserScroll != null && set != null && Math.abs(lastUserScroll - set) > 8) {
          cancelled = true;
          cur.removeEventListener("scroll", onUserScroll);
          return;
        }
        set = once();
        if (ms >= 500) cur.removeEventListener("scroll", onUserScroll);
      }, ms);
    });
  }

  function restoreModalReturnScreenTop() {
    var top = modalReturnScreenTop;
    var anchor = modalReturnAnchor;
    modalReturnScreenTop = null;
    modalReturnAnchor = null;
    if (top == null) return;
    applyReturnScroll(top, anchor);
  }

  function captureScreenUi() {
    var screen = document.getElementById("screen");
    var active = document.activeElement;
    var focus = null;
    if (screen && active && screen.contains(active) && active.getAttribute) {
      focus = {
        name: active.getAttribute("name") || "",
        act: active.getAttribute("data-act") || "",
        id: active.getAttribute("data-id") || "",
        field: active.getAttribute("data-field") || "",
        start: active.selectionStart,
        end: active.selectionEnd,
        digits: active.dataset ? active.dataset.digits : "",
        replaceAll: active.dataset ? active.dataset.replaceAll : "",
        value: active.value
      };
    }
    return { top: screen ? screen.scrollTop : 0, focus: focus };
  }

  function findScreenFocusEl(screen, focus) {
    if (!screen || !focus) return null;
    var nodes = screen.querySelectorAll("input, select, textarea");
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (focus.act && el.getAttribute("data-act") !== focus.act) continue;
      if (focus.act === "vault-field") {
        if (!focus.id || el.getAttribute("data-id") !== focus.id) continue;
        if (focus.field && el.getAttribute("data-field") !== focus.field) continue;
        return el;
      }
      if (focus.name && el.getAttribute("name") !== focus.name) continue;
      if (focus.id && el.getAttribute("data-id") !== focus.id) continue;
      if (focus.field && el.getAttribute("data-field") !== focus.field) continue;
      return el;
    }
    return null;
  }

  function restoreScreenUi(ui) {
    var screen = document.getElementById("screen");
    if (!screen || !ui) return;
    screen.scrollTop = ui.top || 0;
    var focus = ui.focus;
    if (!focus) return;
    var el = findScreenFocusEl(screen, focus);
    if (!el) return;
    var money = isMoneyInput(el);
    if (document.activeElement !== el) el.focus();
    if (el.dataset) {
      if (focus.digits != null) el.dataset.digits = focus.digits;
      // Never restore replaceAll onto live money fields (vault and elsewhere).
      if (focus.replaceAll != null && !money) {
        el.dataset.replaceAll = focus.replaceAll;
      }
    }
    if (focus.value != null && el.type !== "checkbox" && el.tagName !== "SELECT") {
      if (!money) {
        el.value = focus.value;
      }
    }
    if (el.setSelectionRange && focus.start != null && el.type !== "checkbox" && el.tagName !== "SELECT") {
      if (!(money && editingMoneyEl === el)) {
        try { el.setSelectionRange(focus.start, focus.end); } catch (err) {}
      }
    }
  }

  function renderVaultPreserve() {
    pendingScreenUi = captureScreenUi();
    render();
  }

  function paintVaultTitleInputs(docId, title) {
    if (!docId) return;
    var nodes = document.querySelectorAll('[data-act="vault-field"][data-field="title"]');
    var i;
    for (i = 0; i < nodes.length; i++) {
      if (nodes[i].getAttribute("data-id") === docId) nodes[i].value = title;
    }
  }

  function paintVaultReview(doc) {
    var banner = document.getElementById("vault-review");
    if (!banner) return;
    doc = doc || findProfileDoc(state.vaultDocId);
    if (!doc || (state.vaultDocId && doc.id !== state.vaultDocId)) return;
    var review = docNeedsReview(doc);
    banner.hidden = !review;
    banner.classList.toggle("is-clear", !review);
    banner.textContent = review
      ? "Needs review — add a money field or attach a file" +
        (doc.vaultType !== "other" ? " (and a provider / lender)" : "") + "."
      : "Looks complete.";
    var pdfBanner = document.querySelector(".vault-pdf-review");
    if (pdfBanner) {
      pdfBanner.hidden = !doc.pdfAutofillReview;
    }
  }

  /* v37.5.59.13: first-visit mini tour for Stats and Transactions. Seen flags live in their own
     localStorage keys (never in app state, backups, or tester-shared data). Next-only; never blocks the page. */
  var TOUR_STEPS = {
    stats: [
      { sel: ".stats-doors", title: "Two statements", text: "Income statement shows what came in and went out. Net worth shows what you own and owe." },
      { sel: ".stats-vault", title: "Vault", text: "Vault keeps papers like loans, insurance and pay stubs in one place." },
      { sel: "#month-bar .icon-btn", title: "Year and Profile", text: "The calendar button picks the year. The gear opens Profile and settings." }
    ],
    spend: [
      { sel: "[data-act=add-spend]", title: "Add a transaction", text: "Tap Add, or the + button, to log spending or income." },
      { sel: ".search-field", title: "Search", text: "Search this month’s transactions by payee or envelope." },
      { sel: ".swipe-hint, .tx-row, .row", title: "Edit or delete", text: "Tap a row to edit it. Swipe a row left to reveal delete." }
    ]
  };
  var tourState = null;

  function tourSeen(tab) {
    try { return localStorage.getItem("PaperTrail.tourSeen." + tab) === "1"; } catch (err) { return true; }
  }

  function tourMarkSeen(tab) {
    try { localStorage.setItem("PaperTrail.tourSeen." + tab, "1"); } catch (err) {}
  }

  function tourClose() {
    var el = document.getElementById("tour-coach");
    if (el) el.remove();
    var hl = document.querySelectorAll(".tour-hl");
    for (var i = 0; i < hl.length; i++) hl[i].classList.remove("tour-hl");
    tourState = null;
  }

  function tourShow() {
    var phone = document.getElementById("phone");
    if (!phone || !tourState) return;
    var steps = TOUR_STEPS[tourState.tab];
    var step = steps[tourState.i];
    var old = document.querySelectorAll(".tour-hl");
    for (var k = 0; k < old.length; k++) old[k].classList.remove("tour-hl");
    var target = document.querySelector("#phone " + step.sel.split(",")[0].trim()) || document.querySelector("#phone " + step.sel);
    if (target) target.classList.add("tour-hl");
    var el = document.getElementById("tour-coach");
    if (!el) {
      el = document.createElement("div");
      el.id = "tour-coach";
      el.className = "tour-coach";
      el.setAttribute("role", "status");
      phone.appendChild(el);
    }
    var last = tourState.i === steps.length - 1;
    el.innerHTML = '<div class="tour-card"><p class="kicker">Quick tour · ' + (tourState.i + 1) + " of " + steps.length + "</p>" +
      "<strong>" + esc(step.title) + "</strong><p>" + esc(step.text) + "</p>" +
      '<div class="tour-actions">' + (last ? '<button class="text-btn" type="button" data-tour="close">Close</button>' : "") +
      '<button class="planner-apply" type="button" data-tour="next">' + (last ? "Done" : "Next") + "</button></div></div>";
  }

  function maybeStartTour() {
    if (tourState) {
      if (tourState.tab !== state.tab) tourClose(); else { tourShow(); return; }
    }
    var tab = state.tab;
    if (!TOUR_STEPS[tab] || tourSeen(tab)) return;
    var ob = state.onboarding;
    if (ob && ob.status === "survey") return;
    if (tab === "stats" && state.statsDoor === "vault") return;
    if (document.querySelector(".modal:not([hidden]), .sheet")) return;
    tourMarkSeen(tab);
    tourState = { tab: tab, i: 0 };
    tourShow();
  }

  document.addEventListener("click", function (ev) {
    var b = ev.target && ev.target.closest ? ev.target.closest("[data-tour]") : null;
    if (!b || !tourState) return;
    ev.preventDefault();
    ev.stopPropagation();
    if (b.getAttribute("data-tour") === "close") { tourClose(); return; }
    var steps = TOUR_STEPS[tourState.tab];
    if (tourState.i >= steps.length - 1) { tourClose(); return; }
    tourState.i++;
    tourShow();
  }, true);

  function render() {
    applyNight();
    paintSaveWarning();
    renderMonthBar();
    renderTabs();
    renderFab();
    var screen = document.getElementById("screen");
    var key = paintKey();
    var keepTop = (key === lastPaintKey && screen) ? screen.scrollTop : 0;
    var month;
    var totals;
    var searchActive;
    var caret;
    if (state.tab === "stats" && state.statsDoor === "worth") {
      screen.innerHTML = renderWorth();
      bindMoneyInputs(screen);
      bindNwScrubber(screen);
    } else if (state.tab === "worth") {
      screen.innerHTML = renderWorth();
      bindMoneyInputs(screen);
      bindNwScrubber(screen);
    } else if (state.tab === "stats" && !state.statsDoor) {
      state.statsDoor = "worth";
      screen.innerHTML = renderWorth();
      bindMoneyInputs(screen);
      bindNwScrubber(screen);
    } else if (state.tab === "stats" && state.statsDoor === "vault") {
      screen.innerHTML = renderVault();
      bindMoneyInputs(screen);
    } else if (state.tab === "stats" && state.statsDoor === "statement") {
      screen.innerHTML = renderAnnualStatement();
      bindMoneyInputs(screen);
    } else if (state.tab === "insights") {
      screen.innerHTML = renderInsights(ensureMonth(state.year, state.month));
      bindMoneyInputs(screen);
    } else {
      month = ensureMonth(state.year, state.month);
      totals = sums(month);
      if (state.tab === "income") state.tab = "budget";
      searchActive = document.activeElement && document.activeElement.getAttribute("data-act") === "spend-search";
      caret = searchActive ? document.activeElement.selectionStart : null;
      if (state.tab === "budget") screen.innerHTML = renderBudget(month, totals);
      else if (state.tab === "spend") {
        screen.innerHTML = renderSpend(month, totals);
        bindSwipeRows(screen);
      }
      else screen.innerHTML = renderStatement(month, totals);
      bindCentsInputs(screen);
      bindDollarInputs(screen);
      if (searchActive) {
        var searchEl = screen.querySelector("[data-act='spend-search']");
        if (searchEl) {
          searchEl.focus();
          var pos = caret == null ? searchEl.value.length : caret;
          searchEl.setSelectionRange(pos, pos);
        }
      }
    }
    lastPaintKey = key;
    requestAnimationFrame(function () {
      var scroller = document.querySelector("#screen .annual-scroll");
      var current = scroller && scroller.querySelector("th.is-current, th .is-current");
      if (!scroller) return;
      if (current && current.closest) current = current.closest("th") || current;
      if (!current) {
        scroller.scrollLeft = scroller.scrollWidth;
        return;
      }
      var delta = current.getBoundingClientRect().right - scroller.getBoundingClientRect().right;
      scroller.scrollLeft = Math.max(0, scroller.scrollLeft + delta + 8);
    });
    renderOnboarding();
    maybeStartTour();
    if (pendingScreenUi) {
      restoreScreenUi(pendingScreenUi);
      requestAnimationFrame(function () { restoreScreenUi(pendingScreenUi); pendingScreenUi = null; });
    } else if (screen) {
      screen.scrollTop = keepTop;
      var slide = screen.querySelector(".year-slide.on");
      if (slide && slide.parentElement) {
        var deck = slide.parentElement;
        deck.scrollLeft = Math.max(0, slide.offsetLeft - (deck.clientWidth - slide.offsetWidth) / 2);
      }
    }
    if (modalReturnScreenTop != null) {
      var modalTop = modalReturnScreenTop;
      var modalAnchor = modalReturnAnchor;
      modalReturnScreenTop = null;
      modalReturnAnchor = null;
      if (screen) applyReturnScroll(modalTop, modalAnchor);
    }
  
    applyPendingFocusRestore();
}

  function showSheetFieldError(form, name, msg) {
    var input = form && form.querySelector('[name="' + name + '"]');
    var prior = form && form.querySelector(".sheet-field-error");
    if (prior) prior.parentNode.removeChild(prior);
    if (!input) { showToast(msg, 3000); return; }
    input.setAttribute("aria-invalid", "true");
    var p = document.createElement("p");
    p.className = "caption rust sheet-field-error";
    p.setAttribute("role", "alert");
    p.textContent = msg;
    var host = input.closest("label") || input;
    host.parentNode.insertBefore(p, host.nextSibling);
    try { input.focus(); } catch (err) {}
  }

  function applyPendingFocusRestore() {
    var ref = pendingFocusRestore;
    pendingFocusRestore = null;
    if (!ref) return;
    var nodes = document.querySelectorAll("[data-act]");
    var hit = null;
    Array.prototype.forEach.call(nodes, function (el) {
      if (hit) return;
      if ((ref.act && el.getAttribute("data-act") !== ref.act)) return;
      if (ref.id && el.getAttribute("data-id") !== ref.id) return;
      if (ref.tab && el.getAttribute("data-tab") && el.getAttribute("data-tab") !== ref.tab) return;
      hit = el;
    });
    if (!hit && ref.act) {
      hit = document.querySelector('[data-act="' + ref.act + '"]');
    }
    if (hit && hit.focus) {
      try { hit.focus(); } catch (err) {}
    }
  }

  function closeModal() {
    ritual = { step: 0, destKey: ritual.destKey };
    var modal = document.getElementById("modal");
    modal.classList.remove("wrap-open");
    modal.removeAttribute("role");
    modal.removeAttribute("aria-modal");
    modal.hidden = true;
    modal.innerHTML = "";
    // v37.5.59.12: restore focus after render; ignoreClicksUntil only set by Save paths.
    // v37.5.59.12 (QA 598): a rollover deferred by this sheet runs as soon as it closes.
    if (pendingClockAdvance) setTimeout(function () { if (pendingClockAdvance) maybeAdvanceMonthFromClock(); }, 0);
    var trigger = sheetTriggerEl;
    sheetTriggerEl = null;
    if (trigger) {
      pendingFocusRestore = {
        act: trigger.getAttribute("data-act") || "",
        id: trigger.getAttribute("data-id") || "",
        tab: trigger.getAttribute("data-tab") || "",
        name: trigger.getAttribute("name") || ""
      };
    }
  }

  function sheetFocusables(root) {
    if (!root) return [];
    return Array.prototype.filter.call(
      root.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'),
      function (el) { return !el.disabled && el.offsetParent !== null && el.getAttribute("aria-hidden") !== "true"; }
    );
  }

  function armSheetA11y(modal) {
    if (!modal) return;
    sheetTriggerEl = document.activeElement && document.activeElement !== document.body ? document.activeElement : sheetTriggerEl;
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    var nodes = sheetFocusables(modal);
    var first = nodes[0];
    if (first) {
      try { first.focus(); } catch (err) {}
    }
  }

  function trapSheetTab(event) {
    var modal = document.getElementById("modal");
    if (!modal || modal.hidden || event.key !== "Tab") return;
    var nodes = sheetFocusables(modal);
    if (!nodes.length) return;
    var first = nodes[0], last = nodes[nodes.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    } else if (!modal.contains(document.activeElement)) {
      event.preventDefault();
      first.focus();
    }
  }

  function openSheet(title, fieldsHtml, saveAct) {
    captureModalReturnScreenTop();
    var modal = document.getElementById("modal");
    modal.hidden = false;
    modal.innerHTML =
      '<form class="sheet" data-act="' + saveAct + '">' +
      "<h3>" + esc(title) + "</h3>" + fieldsHtml +
      '<div class="sheet-actions">' +
      '<button type="button" data-act="close-modal">Cancel</button>' +
      '<button class="primary" type="submit">Save</button></div></form>';
    bindMoneyInputs(modal);
    armSheetA11y(modal);
  }

  function readOptionalCents(el) {
    if (!el) return null;
    var digits = el.dataset && el.dataset.digits != null ? String(el.dataset.digits).replace(/\D/g, "") : "";
    if (digits !== "") return parseInt(digits, 10) / 100;
    var text = String(el.value || "").trim();
    if (!text || text === "—" || text === "-" || text === "–") return null;
    if (!/\d/.test(text)) return null;
    return centsFromDigits(text);
  }

  function openAnnualYear(year) {
    ensureAnnualStatement();
    year = Number(year);
    if (!state.annualStatement.years[String(year)]) ensureAnnualYearFromPrior(state.annualStatement, year);
    var row = annualRow(state.annualStatement.years[String(year)]);
    var labels = {
      salary: "Salary",
      bonus: "Bonus",
      sideGig: "Side gig",
      other: "Other",
      match: "401k match",
      taxes: "Taxes",
      opex: "Operating expenses",
      investments: "Investments"
    };
    var fields = ANNUAL_FIELDS.map(function (id) {
      var value = id === "taxes" ? annualTaxesAmount(row, year) : row[id];
      var shown = value == null ? "" : money(value);
      var extra = id === "taxes" && (annualHasTaxParts(row) || (annualTaxEstimateParts(year) && row.taxes == null))
        ? ' data-tax-total="1" readonly'
        : (id === "taxes" ? ' data-tax-total="1"' : "");
      return '<label class="field">' + esc(labels[id]) +
        '<input name="' + id + '" class="cents-input" data-cents="1" data-allow-blank="1"' + extra +
        ' inputmode="numeric" autocomplete="off" type="text" placeholder="—" value="' +
        esc(shown) + '"></label>';
    }).join("");
    var taxParts = ANNUAL_TAX_PART_FIELDS.map(function (id) {
      var shownPart = annualTaxPartDisplay(row, id, year);
      var shown = shownPart.value == null ? "" : money(shownPart.value);
      var estAttr = shownPart.estimate ? ' data-tax-estimate="1"' : "";
      return '<label class="field annual-tax-part">' + esc(ANNUAL_TAX_PART_LABELS[id]) +
        (shownPart.estimate ? ' <span class="caption">(estimate from pay stub)</span>' : "") +
        '<input name="' + id + '" class="cents-input" data-cents="1" data-allow-blank="1" data-tax-part="1"' + estAttr +
        ' inputmode="numeric" autocomplete="off" type="text" placeholder="—" value="' +
        esc(shown) + '"></label>';
    }).join("");
    var sheetParts = annualIncomeParts(row, year);
    var stubNote = sheetParts.source === "stubs"
      ? '<p class="caption annual-stub-sheet-note">' + esc(year + " uses your pay stubs for Salary, Bonus and 401k match (" + sheetParts.basis.short +
        "): gross pay " + money(sheetParts.grossPay) + ". What you type here is the fallback if there’s no stub; a typed Bonus is projected only if its month is still ahead.") + "</p>"
      : "";
    var tg = incomeTargetFor(year);
    var syncNow = compSyncValues(year);
    var syncNote = Object.keys(syncNow).length
      ? '<p class="caption annual-sync-note">' + esc("Synced from Compensation right now: " + Object.keys(syncNow).map(function (id) {
          return SYNC_LINES.filter(function (l) { return l.id === id; })[0].label + " " + money(syncNow[id]);
        }).join(", ") + ". What you type below stays saved and comes back if you turn sync off.") + "</p>"
      : "";
    var targetBlock = '<p class="section-label">Year-end salary target</p>' +
      '<label class="field">Projected full-year salary' +
      '<input name="salaryTarget" class="cents-input" data-cents="1" data-allow-blank="1" inputmode="numeric" autocomplete="off" type="text" placeholder="—" value="' +
      esc(tg.salaryTarget ? money(tg.salaryTarget) : "") + '"></label>' +
      '<p class="caption">Optional. With pay stubs, remaining paychecks = (target − salary already paid) ÷ checks left, within IRS limits. Blank means no target.</p>' +
      (tg.salaryTarget ? '<button class="text-btn" type="button" data-act="clear-salary-target" data-year="' + year + '">Clear year-end target</button>' : "") +
      '<p class="section-label">Notes</p>' +
      NOTE_LINES.map(function (l) {
        return '<label class="field">' + esc(l.label) + ' note<input name="note_' + l.id + '" type="text" maxlength="300" placeholder="Optional" value="' + esc(tg.notes[l.id] || "") + '"></label>';
      }).join("") +
      '<p class="caption">Targets and notes stay on this device and are not part of tester sharing.</p>';
    openSheet(year + " income",
      stubNote + syncNote + fields + targetBlock +
      '<p class="section-label">Tax breakdown</p>' +
      taxParts +
      '<p class="caption">Blank stays blank. Pay-stub estimates stay live estimates when you Save — only a line you type over becomes yours. If you type a tax sub-line, Taxes = your typed lines + the estimate for the rest (read-only). Bracket picks are reference-only and never change Taxes. Saving writes only ' +
      year + '.</p>' +
      '<input type="hidden" name="year" value="' + year + '">',
      "save-annual-year");
    var modal = document.getElementById("modal");
    if (!modal) return;
    Array.prototype.forEach.call(modal.querySelectorAll("[data-allow-blank]"), function (el) {
      var textVal = String(el.value || "").trim();
      if (!textVal) el.dataset.digits = "";
      else if (centsFromDigits(textVal) === 0) el.dataset.digits = "0";
    });
    bindAnnualTaxPartSync(modal);
  }

  function bindAnnualTaxPartSync(modal) {
    if (!modal || modal.dataset.annualTaxBound === "1") return;
    modal.dataset.annualTaxBound = "1";
    function syncTaxTotal() {
      var totalEl = modal.querySelector('input[name="taxes"]');
      if (!totalEl) return;
      var any = false;
      var sum = 0;
      ANNUAL_TAX_PART_FIELDS.forEach(function (id) {
        var el = modal.querySelector('input[name="' + id + '"]');
        var cents = readOptionalCents(el);
        if (cents != null) {
          any = true;
          sum += cents;
        }
      });
      if (any) {
        totalEl.readOnly = true;
        totalEl.value = money(roundCents(sum));
        totalEl.dataset.digits = String(Math.round(roundCents(sum) * 100));
      } else {
        totalEl.readOnly = false;
      }
    }
    function onPartEdit(event) {
      var t = event.target;
      if (t && t.getAttribute && t.getAttribute("data-tax-part") === "1") {
        t.removeAttribute("data-tax-estimate");
        syncTaxTotal();
      }
    }
    modal.addEventListener("input", onPartEdit);
    // v37.5.59.5: money inputs handle keys themselves (no native "input" event) — they fire "money-edit".
    modal.addEventListener("money-edit", onPartEdit);
    syncTaxTotal();
  }

  function openYearIncome(year) {
    migrateWorthIncome(state.worth);
    year = Number(year);
    if (!state.worth.notes) state.worth.notes = {};
    if (state.worth.income[year] == null) state.worth.income[year] = 0;
    openSheet(year + " income",
      '<label class="field">Income' +
      '<input name="yearIncome" class="cents-input" data-dollars="1" inputmode="numeric" autocomplete="off" type="text" value="' +
      esc(money(state.worth.income[year] || 0)) + '"></label>' +
      '<label class="field">Notes' +
      '<textarea name="notes" rows="5" placeholder="June prior year pay bump to $75k; May this year $87,885 with 20% target bonus.">' +
      esc(state.worth.notes[year] || "") + "</textarea></label>" +
      '<input type="hidden" name="year" value="' + year + '">',
      "save-year-income");
  }

  function moneyDigitsFromValue(value, asDollars) {
    if (asDollars) {
      var dollars = dollarsFromDigits(value);
      return dollars ? String(dollars) : "";
    }
    var cents = Math.round(centsFromDigits(value) * 100);
    return cents ? String(cents) : "";
  }

  /* v37.5.59.12 (QA M3): hard cap so a 20-digit paste can't become $1.22 or overflow totals. */
  var MONEY_MAX = 9999999.99;
  /* v37.5.59.16 (owner): no on-screen entry hints. Cents-mode behavior is unchanged; only the helper text is gone. */
  var MONEY_HINT_HTML = "";
  var moneyCapWarned = false;

  function clampMoney(n) {
    n = Number(n) || 0;
    if (!isFinite(n) || n < 0) return 0;
    if (n > MONEY_MAX) {
      moneyCapWarned = true;
      return MONEY_MAX;
    }
    return Math.round(n * 100) / 100;
  }

  function moneyFromDigits(digits, asDollars) {
    if (!digits) return 0;
    if (asDollars && String(digits).indexOf(".") >= 0) {
      var parsed = parseFloat(digits);
      return clampMoney(parsed);
    }
    // Cap digit length before parseInt so 20 nines don't go through scientific notation.
    var raw = String(digits).replace(/\D/g, "");
    if (asDollars) {
      if (raw.length > 9) { moneyCapWarned = true; raw = raw.slice(0, 9); }
      return clampMoney(parseInt(raw, 10) || 0);
    }
    if (raw.length > 11) { moneyCapWarned = true; raw = raw.slice(0, 11); }
    return clampMoney((parseInt(raw, 10) || 0) / 100);
  }

  function normalizeDollarEntry(raw) {
    var s = String(raw || "").replace(/[^0-9.]/g, "");
    if (!s) return "";
    var dot = s.indexOf(".");
    if (dot < 0) {
      s = s.replace(/^0+(?=\d)/, "");
      if (s.length > 9) { moneyCapWarned = true; s = s.slice(0, 9); }
      return s;
    }
    var whole = s.slice(0, dot).replace(/\./g, "").replace(/^0+(?=\d)/, "");
    if (!whole) whole = "0";
    if (whole.length > 9) { moneyCapWarned = true; whole = whole.slice(0, 9); }
    var frac = s.slice(dot + 1).replace(/\./g, "").slice(0, 2);
    if (frac) return whole + "." + frac;
    if (s.charAt(s.length - 1) === ".") return whole + ".";
    return whole;
  }

  function stripMoneyDigits(digits) {
    return String(digits || "").replace(/\D/g, "").replace(/^0+/, "");
  }

  function bindCentsInputs(root) {
    bindMoneyInputs(root);
  }

  function bindMoneyInputs(root) {
    if (!root) return;
    Array.prototype.forEach.call(root.querySelectorAll("[data-cents], [data-dollars]"), function (el) {
      if (el.dataset.moneyBound === "1") return;
      el.dataset.moneyBound = "1";
      el.setAttribute("placeholder", "$0.00");
      // v37.5.59.12 (QA L4): Enter in a money field submits the sheet form.
      el.addEventListener("keydown", function (event) {
        if (event.key !== "Enter") return;
        var form = el.closest("form[data-act]");
        if (!form) return;
        event.preventDefault();
        if (typeof form.requestSubmit === "function") form.requestSubmit();
        else form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      });
      var asDollars = el.getAttribute("data-dollars") === "1";
      if (asDollars) el.setAttribute("inputmode", "decimal");
      el.dataset.digits = moneyDigitsFromValue(el.value, asDollars);
      el.dataset.lastPainted = el.value;
      el.dataset.replaceAll = "";

      function paint(digits) {
        if (el.getAttribute("data-allow-blank") === "1" && !stripMoneyDigits(digits)) {
          el.dataset.digits = "";
          el.value = "";
          el.dataset.lastPainted = "";
          moneyCapWarned = false;
          return;
        }
        var priorWarn = moneyCapWarned;
        moneyCapWarned = false;
        var next = asDollars ? normalizeDollarEntry(digits) : stripMoneyDigits(digits);
        // v37.5.59.12 (QA M3): cents digit cap = $9,999,999.99 → 9 whole + 2 cents = 11 digits max
        if (!asDollars && next.length > 11) { moneyCapWarned = true; next = next.slice(0, 11); }
        if (!asDollars) {
          var asNum = (parseInt(next || "0", 10) || 0) / 100;
          if (asNum > MONEY_MAX) {
            moneyCapWarned = true;
            next = String(Math.round(MONEY_MAX * 100));
          }
        }
        el.dataset.digits = next;
        el.dataset.painting = "1";
        el.value = money(moneyFromDigits(next, asDollars));
        el.dataset.lastPainted = el.value;
        el.dataset.painting = "";
        if (moneyCapWarned || priorWarn) {
          el.setAttribute("aria-invalid", "true");
          showToast("Amount capped at " + money(MONEY_MAX) + ".", 3500);
        } else {
          el.removeAttribute("aria-invalid");
        }
        // v37.5.59.12: one warning per capped keystroke (the flag no longer sticks to later fields).
        moneyCapWarned = false;
        // Caret to the end now (a deferred move could undo a select-all the user makes next).
        try {
          if (el.setSelectionRange && document.activeElement === el) {
            var end = el.value.length;
            el.setSelectionRange(end, end);
          }
        } catch (e) {}
        if (el.getAttribute("data-act") === "comp-field") {
          updateCompensationFromElement(el);
        } else if (el.getAttribute("data-act") === "comp-deduct") {
          updateDeductionFromElement(el);
        } else if (el.getAttribute("data-act") === "insight-extra") {
          state.insightExtra = moneyFromDigits(el.dataset.digits, true) || 100;
          saveState();
        } else if (el.getAttribute("data-act") === "foo-money") {
          state.foo = migrateFoo(state.foo);
          state.foo[el.getAttribute("data-field")] = moneyFromDigits(el.dataset.digits, true);
          saveState();
        } else if (el.getAttribute("data-act") === "payoff-extra") {
          state.payoffExtra = moneyFromDigits(el.dataset.digits, true) || 100;
          saveState();
          paintPayoffCard();
        } else if (el.getAttribute("data-act") === "loan-extra") {
          state.foo = migrateFoo(state.foo);
          var loanName = el.getAttribute("data-loan") || "";
          state.foo.loanExtras[loanName] = moneyFromDigits(el.dataset.digits, true) || 100;
          saveState();
          paintLoanPayoff(el, loanName);
        } else if (el.getAttribute("data-act") === "vault-field") {
          updateVaultField(el);
        } else if (el.getAttribute("data-act") === "paystub-field") {
          updatePayStubField(el);
        }
      }

      /* v37.5.59.12 (owner): cash-register entry for EVERY money field — typed digits fill from the
       * cents ("1234" → $12.34, "2600" → $26.00). An explicit "." switches to natural entry
       * ("12.5" → $12.50, "2500.00" → $2,500.00). Pasted / autofilled / dictated text that is already
       * an amount ("$5,000", "5000.00", "5,000", "5000") is read literally as dollars.
       * el.dataset.entry = "c:<cents digits>" or "d:<natural dollars text>". */
      var memoKey = (el.name || "") + "|" + (el.getAttribute("data-act") || "") + "|" +
        (el.getAttribute("data-field") || "") + "|" + (el.getAttribute("data-loan") || "") + "|" + (el.getAttribute("data-year") || "");
      el.dataset.entry = "";
      if (moneyEntryMemo && moneyEntryMemo.key === memoKey && moneyEntryMemo.value === el.value) {
        el.dataset.entry = moneyEntryMemo.entry;
      }
      var MAX_CENTS = Math.round(MONEY_MAX * 100);

      function takeReplace() {
        var replace = el.dataset.replaceAll === "1";
        try {
          if (el.selectionStart != null && el.selectionEnd != null && el.selectionEnd > el.selectionStart) replace = true;
        } catch (e) { /* some input types throw on selection access */ }
        el.dataset.replaceAll = "";
        if (replace) el.dataset.entry = "";
        return replace;
      }

      function currentCents() {
        if (asDollars) return Math.round((moneyFromDigits(el.dataset.digits || "", true) || 0) * 100);
        return parseInt(stripMoneyDigits(el.dataset.digits || "") || "0", 10) || 0;
      }

      function readEntry() {
        var e = el.dataset.entry || "";
        if (/^[cd]:/.test(e)) return { mode: e.charAt(0), text: e.slice(2) };
        var c = currentCents();
        return { mode: "c", text: c ? String(c) : "" };
      }

      function centsOfEntry(en) {
        if (en.mode === "c") {
          var digits = en.text.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
          if (digits.length > 11) return Infinity;
          return parseInt(digits || "0", 10) || 0;
        }
        var dot = en.text.indexOf(".");
        var whole = (dot < 0 ? en.text : en.text.slice(0, dot)).replace(/\D/g, "").replace(/^0+(?=\d)/, "");
        var frac = dot < 0 ? "" : en.text.slice(dot + 1).replace(/\D/g, "").slice(0, 2);
        if (whole.length > 9) return Infinity;
        return (parseInt(whole || "0", 10) || 0) * 100 + (parseInt((frac + "00").slice(0, 2), 10) || 0);
      }

      function paintCents(cents, blank) {
        if (blank && el.getAttribute("data-allow-blank") === "1") { paint(""); return; }
        if (asDollars) {
          var w = Math.floor(cents / 100), f = cents % 100;
          paint(cents ? (f ? w + "." + (f < 10 ? "0" : "") + f : String(w)) : "");
        } else {
          paint(cents ? String(cents) : "");
        }
      }

      function writeEntry(en) {
        var cents = centsOfEntry(en);
        if (!(cents <= MAX_CENTS)) {
          moneyCapWarned = true;
          cents = MAX_CENTS;
          en = { mode: "d", text: String(Math.floor(MONEY_MAX)) + "." + String(MAX_CENTS % 100) };
        }
        paintCents(cents, !en.text);
        var tag = en.mode + ":" + en.text;
        el.dataset.entry = tag;
        moneyEntryMemo = { key: memoKey, entry: tag, value: el.value };
      }

      /* v37.5.59.5: remember a real edit (Save keeps untouched estimates live) and tell listeners. */
      function markEdited() {
        el.dataset.userEdited = "1";
        try {
          el.dispatchEvent(new CustomEvent("money-edit", { bubbles: true }));
        } catch (e) { /* old browsers */ }
      }

      function insertDecimal() {
        if (el.readOnly) return;
        editingMoneyEl = el;
        var replace = takeReplace();
        var en = replace ? { mode: "c", text: "" } : readEntry();
        if (en.mode === "d") { if (en.text.indexOf(".") >= 0) return; writeEntry({ mode: "d", text: (en.text || "0") + "." }); markEdited(); return; }
        // Digits typed so far become whole dollars: "12" then "." → $12.
        var whole = en.text.replace(/\D/g, "").replace(/^0+(?=\d)/, "") || "0";
        writeEntry({ mode: "d", text: whole + "." });
        markEdited();
      }

      function insertDigits(added) {
        var clean = String(added || "").replace(/\D/g, "");
        if (!clean || el.readOnly) return;
        editingMoneyEl = el;
        var replace = takeReplace();
        var en = replace ? { mode: "c", text: "" } : readEntry();
        if (en.mode === "d") {
          var dot = en.text.indexOf(".");
          if (dot >= 0) {
            var room = 2 - (en.text.length - dot - 1);
            if (room <= 0) return; // already two cents digits
            clean = clean.slice(0, room);
          }
          writeEntry({ mode: "d", text: en.text + clean });
        } else {
          writeEntry({ mode: "c", text: (en.text + clean).replace(/^0+(?=\d)/, "") });
        }
        markEdited();
      }

      function popDigit() {
        if (el.readOnly) return;
        editingMoneyEl = el;
        var replace = takeReplace();
        if (replace) { writeEntry({ mode: "c", text: "" }); markEdited(); return; }
        var en = readEntry();
        writeEntry({ mode: en.mode, text: en.text.slice(0, -1) });
        markEdited();
      }

      /* Literal amount (paste, autofill, dictation): "$5,000" / "5000.00" / "5,000" / "5000" → dollars. */
      function insertLiteral(text) {
        if (el.readOnly) return false;
        var s = String(text || "").replace(/[\s$\u00a0]/g, "");
        if (/^-/.test(s)) { showToast("Amount can’t be negative.", 2500); s = s.slice(1); }
        s = s.replace(/,(?=\d{3}(\D|$))/g, "");
        var m = /^(\d*)(?:\.(\d*))?$/.exec(s);
        if (!m || (!m[1] && !m[2])) return false;
        editingMoneyEl = el;
        el.dataset.replaceAll = "";
        writeEntry({ mode: "d", text: (m[1] || "0") + (m[2] != null ? "." + m[2].slice(0, 2) : "") });
        markEdited();
        return true;
      }

      function typeText(text) {
        String(text || "").split("").forEach(function (ch) {
          if (ch === ".") insertDecimal();
          else if (/\d/.test(ch)) insertDigits(ch);
        });
      }

      el.addEventListener("focus", function () {
        el.classList.add("is-focused");
        // Fresh focus from outside: type-to-replace. Re-focus after estimate paint
        // while mid-edit must NOT re-arm replaceAll (that caused the $4 lock).
        if (editingMoneyEl !== el) {
          el.dataset.replaceAll = "1";
          el.dataset.entry = "";
          el.dataset.sessionTyped = "";
          moneyEntryMemo = null;
          requestAnimationFrame(function () {
            // Only if nothing was typed yet — a fast first key must not be selected away.
            if (el.dataset.replaceAll === "1" && document.activeElement === el) el.select();
          });
        }
      });
      el.addEventListener("blur", function () {
        el.classList.remove("is-focused");
        el.dataset.replaceAll = "";
        var blurred = el;
        // Delay clear so sync restoreSheetUi re-focus after estimate paint still
        // counts as the same editing session (focus handler checks editingMoneyEl).
        requestAnimationFrame(function () {
          if (editingMoneyEl === blurred && document.activeElement !== blurred) {
            editingMoneyEl = null;
          }
        });
        var keepEntry = el.dataset.entry;
        paint(el.dataset.digits || "");
        el.dataset.entry = keepEntry;
      });
      // keydown handles hardware keys (and prevents the browser's own insert, so no beforeinput).
      // beforeinput only sees what keydown didn't take: soft keyboards, IME, paste, autofill.
      el.addEventListener("beforeinput", function (event) {
        var type = event.inputType || "";
        if (type.indexOf("delete") === 0) {
          event.preventDefault();
          popDigit();
          return;
        }
        if (type.indexOf("insert") === 0) {
          var raw = String(event.data || "");
          if (!raw && event.dataTransfer && event.dataTransfer.getData) raw = event.dataTransfer.getData("text") || "";
          event.preventDefault();
          // Paste / autofill / dictation / multi-char IME: a literal dollar amount.
          if (type === "insertFromPaste" || type === "insertReplacementText" || type === "insertFromDrop" || raw.length > 1) {
            if (!insertLiteral(raw)) typeText(raw);
            return;
          }
          if (raw === "-" || raw === "−") { showToast("Amount can’t be negative.", 2500); return; }
          if (raw === "," ) return;
          typeText(raw);
        }
      });
      el.addEventListener("paste", function (event) {
        // Fallback for browsers without insertFromPaste in beforeinput.
        var text = (event.clipboardData && event.clipboardData.getData("text")) || "";
        if (!text) return;
        event.preventDefault();
        if (!insertLiteral(text)) typeText(text);
      });
      el.addEventListener("keydown", function (event) {
        if (event.metaKey || event.ctrlKey || event.altKey) return; // select-all, copy, paste shortcuts
        if (event.key === "Backspace" || event.key === "Delete") {
          event.preventDefault();
          popDigit();
          return;
        }
        if (event.key === "-" || event.key === "−" || event.key === "–") {
          // v37.5.59.12 (QA L2): don't silently turn -50 into $50.
          event.preventDefault();
          showToast("Amount can’t be negative.", 2500);
          return;
        }
        if (event.key === ",") { event.preventDefault(); return; }
        if (event.key === ".") {
          event.preventDefault();
          insertDecimal();
          return;
        }
        if (event.key && event.key.length === 1) {
          event.preventDefault();
          if (/\d/.test(event.key)) insertDigits(event.key);
        }
      });
      // v37.5.59.12: native keystroke → cents; autofill/dictation/replacement text → literal dollars.
      // A native insert into the painted value (execCommand, some dictation) is treated as typed
      // characters; anything else (autofill/replacement) replaces the whole amount.
      el.addEventListener("input", function () {
        if (el.dataset.painting === "1" || el.readOnly) return;
        var cur = String(el.value || "");
        var prev = String(el.dataset.lastPainted || "");
        var i = 0;
        while (i < prev.length && i < cur.length && prev.charAt(i) === cur.charAt(i)) i++;
        var j = 0;
        while (j < prev.length - i && j < cur.length - i &&
          prev.charAt(prev.length - 1 - j) === cur.charAt(cur.length - 1 - j)) j++;
        var pureInsert = prev && cur.length > prev.length && i + j === prev.length;
        var text = pureInsert ? cur.slice(i, cur.length - j) : cur;
        var raw = text.replace(/[$,\s]/g, "");
        if (!raw || !/^\d*(\.\d*)?$/.test(raw)) {
          // Not money text: put the last good amount back.
          el.dataset.painting = "1";
          el.value = prev;
          el.dataset.painting = "";
          return;
        }
        el.dataset.painting = "1";
        // One native keystroke into the painted value = a typed key (cents); anything else is literal.
        if (pureInsert && raw.length === 1) typeText(raw);
        else if (!insertLiteral(text)) { el.value = prev; }
        el.dataset.painting = "";
        markEdited();
      });
    });
  }

  function field(label, name, value, type) {
    if (type === "dollars") {
      return '<label class="field">' + esc(label) +
        '<input name="' + name + '" class="cents-input" data-dollars="1" inputmode="numeric" autocomplete="off" type="text" value="' +
        esc(money(Number(value) || 0)) + '">' + MONEY_HINT_HTML + '</label>';
    }
    if (type === "number" || type === "money") {
      return '<label class="field">' + esc(label) +
        '<input name="' + name + '" class="cents-input" data-cents="1" inputmode="numeric" autocomplete="off" type="text" value="' +
        esc(money(Number(value) || 0)) + '">' + MONEY_HINT_HTML + '</label>';
    }
    return '<label class="field">' + esc(label) +
      '<input name="' + name + '" type="' + (type || "text") + '" value="' + esc(value == null ? "" : value) +
      '"></label>';
  }

  function onTab(tab) {
    if (tab === "income") tab = "budget";
    if (tab === "worth") {
      state.tab = "stats";
      state.statsDoor = "worth";
    } else if (tab === "statement") {
      state.tab = "stats";
      state.statsDoor = "statement";
    } else {
      state.tab = tab;
      if (tab === "stats") {
        /* Keep the current door when returning to Stats; only default when unset. */
        if (!state.statsDoor) state.statsDoor = "worth";
        if (state.statsDoor !== "vault") state.vaultDocId = "";
        if (state.statsDoor !== "worth") state.worthDetails = false;
        if (state.statsDoor !== "statement") state.statementDetails = false;
      }
    }
    if (state.tab !== "stats" || state.statsDoor !== "worth") state.worthDetails = false;
    if (state.tab !== "stats" || state.statsDoor !== "statement") state.statementDetails = false;
    if (state.statsDoor !== "vault") vaultPickMode = false;
    saveState();
    render();
  }

  /* v37.5.59.12 (QA M1): on open, land on the device's current calendar month. Create it from the
   * prior plan the same way "Copy last month" does. Does not yank the user mid-session — only when
   * the saved view is behind the clock. */
  function monthPlanIsBlank(m) {
    if (!m) return true;
    var assigned = (m.categories || []).reduce(function (n, c) { return n + catAssigned(c); }, 0);
    var planned = (m.incomes || []).reduce(function (n, i) { return n + (Number(i.amount) || 0); }, 0);
    return assigned <= 0 && planned <= 0 && !(m.transactions || []).length;
  }

  function ensureCurrentMonthFromPlan(now) {
    now = now || currentYearMonth();
    var key = ymKey(now.year, now.month);
    var existing = state.months[key];
    if (existing && !monthPlanIsBlank(existing)) return existing;
    var prior = Object.keys(state.months).map(function (k) { return state.months[k]; }).filter(function (m) {
      return m && (m.year < now.year || (m.year === now.year && m.month < now.month)) && !monthPlanIsBlank(m);
    }).sort(function (a, b) {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    })[0];
    if (prior && (!existing || monthPlanIsBlank(existing))) {
      copyPlanFromTo(prior, now);
      return state.months[key];
    }
    return ensureMonth(now.year, now.month);
  }

  /* v37.5.59.12 (QA NEW-M1c): create every skipped month between the latest stored month and now. */
  function ensureMonthsThroughClock(now) {
    now = now || currentYearMonth();
    var all = Object.keys(state.months || {}).map(function (k) { return state.months[k]; }).filter(function (m) {
      return m && Number(m.year) > 0 && Number(m.month) >= 1 && Number(m.month) <= 12;
    }).sort(function (a, b) {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });
    if (!all.length) {
      ensureCurrentMonthFromPlan(now);
      return;
    }
    var latest = all[all.length - 1];
    var cursor = { year: latest.year, month: latest.month };
    // Walk forward inclusive of `now`.
    while (cursor.year < now.year || (cursor.year === now.year && cursor.month < now.month)) {
      cursor = offsetMonth(cursor.year, cursor.month, 1);
      ensureCurrentMonthFromPlan(cursor);
    }
    ensureCurrentMonthFromPlan(now);
  }

  function syncViewedMonthToClock() {
    var now = currentYearMonth();
    if (!(Number(state.year) > 0) || !(Number(state.month) >= 1 && Number(state.month) <= 12)) {
      state.year = now.year;
      state.month = now.month;
    }
    ensureMonthsThroughClock(now);
    var behind = state.year < now.year || (state.year === now.year && state.month < now.month);
    if (!behind) {
      ensureMonth(state.year, state.month);
      return false;
    }
    ensureCurrentMonthFromPlan(now);
    state.year = now.year;
    state.month = now.month;
    return true;
  }

  function sheetOrVaultOpen() {
    var modal = document.getElementById("modal");
    if (modal && !modal.hidden) return true;
    if (state && state.vaultDocId) return true;
    return false;
  }

  function maybeAdvanceMonthFromClock() {
    if (sheetOrVaultOpen()) {
      pendingClockAdvance = true;
      return false;
    }
    var changed = syncViewedMonthToClock();
    if (changed || pendingClockAdvance) {
      pendingClockAdvance = false;
      try { saveState(); } catch (err) {}
      if (spendDraft && spendDraft.date) {
        var today = new Date();
        var cur = currentYearMonth();
        if (cur.year === state.year && cur.month === state.month) {
          spendDraft.date = isoDate(today.getFullYear(), today.getMonth() + 1, today.getDate());
        }
      }
      render();
      return true;
    }
    return false;
  }

  function msUntilNextLocalMidnight() {
    var n = new Date();
    var next = new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1, 0, 0, 2);
    return Math.max(1000, next.getTime() - n.getTime());
  }

  function scheduleMidnightAdvance() {
    if (midnightTimer) clearTimeout(midnightTimer);
    midnightTimer = setTimeout(function () {
      maybeAdvanceMonthFromClock();
      scheduleMidnightAdvance();
    }, msUntilNextLocalMidnight());
  }

  function shiftMonth(delta) {
    if (state.tab === "insights") return;
    var next = offsetMonth(state.year, state.month, delta);
    state.year = next.year;
    state.month = next.month;
    ensureMonth(state.year, state.month);
    saveState();
    render();
  }

  function handleClick(event) {
    /* v37.5.59.12 (QA NEW-L1): short swallow only after Save. */
    if (ignoreClicksUntil && Date.now() < ignoreClicksUntil) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    clickAnchor = null;
    var anchorEl = event.target.closest && event.target.closest("#screen [data-act][data-id]");
    if (anchorEl) {
      var anchorScreen = document.getElementById("screen");
      clickAnchor = {
        act: anchorEl.getAttribute("data-act"),
        id: anchorEl.getAttribute("data-id"),
        offset: anchorEl.getBoundingClientRect().top - (anchorScreen ? anchorScreen.getBoundingClientRect().top : 0),
        t: Date.now()
      };
    }
    if (swipeSuppressClick && event.target.closest && event.target.closest(".tx-row")) {
      swipeSuppressClick = false;
      event.preventDefault();
      return;
    }
    if (annualInfoTip) {
      var tipEl = event.target.closest && event.target.closest(".annual-info-pop, .annual-info, [data-act='annual-info'], [data-act='annual-info-close']");
      if (!tipEl) {
        /* v37.5.59: an open ⓘ tip used to swallow the next click anywhere (gear, tabs, the
         * Free/Premium switch) — so that control needed a second click. Close the tip, then let
         * the same click do its job. A click on plain background still just closes the tip. */
        annualInfoTip = null;
        var passThrough = event.target.closest && (event.target.closest("[data-act]") || event.target.closest(".plan-toggle"));
        render();
        if (!passThrough) return;
      }
    }
    var openSwipe = event.target.closest && event.target.closest(".tx-swipe.open");
    if (openSwipe && event.target.closest(".tx-row")) {
      openSwipe.classList.remove("open");
      var openRow = openSwipe.querySelector(".tx-row");
      if (openRow) { openRow.style.transition = "transform 160ms ease"; openRow.style.transform = ""; }
      return;
    }
    var restore = event.target.closest("#restore");
    if (restore || (event.target.closest("[data-act]") && event.target.closest("[data-act]").getAttribute("data-act") === "restore")) {
      if (window.confirm("Replace preview data with the iOS sample seed?")) {
        try {
          [
            "PaperTrail.preview.v1",
            "PaperTrail.preview.v2",
            "PaperTrail.preview.v3",
            "PaperTrail.preview.v4",
            "PaperTrail.preview.v5",
            "PaperTrail.preview.v6"
          ].forEach(function (key) {
            localStorage.removeItem(key);
          });
        } catch (err) {}
        state = freshState();
        envelopeEditMode = false;
        spendSearch = "";
        ritual = { step: 0, destKey: "" };
        profileDocDraft = null;
        pendingDocFile = null;
        profileHighlightDocId = "";
        vaultPickMode = false;
        clearDocDb();
        saveState();
        closeModal();
        render();
      }
      return;
    }

    var actEl = event.target.closest("[data-act]");
    /* v37.5.59: the Free/Premium switch has a 3px inset track; a click on the track (between or
     * around the two buttons) used to do nothing. Treat it as a click on the nearer half. */
    if (!actEl) {
      var planTrack = event.target.closest(".plan-toggle");
      if (planTrack) {
        var planBtns = planTrack.querySelectorAll("[data-act='set-plan']");
        var trackBox = planTrack.getBoundingClientRect();
        if (planBtns.length === 2) actEl = planBtns[event.clientX < trackBox.left + trackBox.width / 2 ? 0 : 1];
      }
    }
    if (!actEl) {
      if (event.target.id === "modal") {
        var backToProfile = mattersReturnToProfile;
        mattersReturnToProfile = false;
        pendingScreenUi = captureScreenUi();
        closeModal();
        if (backToProfile) openProfile();
        else render();
      }
      return;
    }
    var act = actEl.getAttribute("data-act");
    /* v37.5.57: feature usage counts for tester sharing (taps on buttons/switches only; nothing typed). */
    if (!(actEl.tagName === "INPUT" && actEl.type !== "checkbox") && actEl.tagName !== "SELECT" && actEl.tagName !== "TEXTAREA") countFeatureUse(act);
    if (act.indexOf("ob-") === 0) { handleOnboardAct(act, actEl); return; }
    if (act === "tester-preview") { openTesterPreview(); return; }
    if (act === "tester-preview-back") { openProfileAt("profile-sharing"); return; }
    if (act === "tester-assign") {
      testerShare().code = assignTesterCode();
      saveState();
      openProfileAt("profile-sharing");
      return;
    }
    if (act === "tester-toggle") {
      var tsField = actEl.getAttribute("data-field");
      if (tsField === "shareIncomeDollars" || tsField === "shareOtherDollars" || tsField === "shareVaultDetails") {
        testerShare()[tsField] = !!actEl.checked;
        saveState();
        if (!actEl.checked) scrubTesterQueue();
      }
      return;
    }
    if (act === "open-about") { openAbout(); return; }
    if (act === "show-intro") { openIntroSheet(); return; }
    if (act === "view-survey") { openSurveyResults(); return; }
    if (act === "retake-survey") { startSurveyRetake(); return; }
    if (act === "about-back") { openProfile(); return; }
    if (act === "about-go") {
      var aboutTo = actEl.getAttribute("data-to");
      openProfileAt(aboutTo === "danger" ? "profile-danger" : (aboutTo === "sharing" ? "profile-sharing" : "profile-data"));
      return;
    }
    if (act === "erase-all") { eraseAllData(); return; }
    if (act === "share-card-open") { shareShowAmounts = false; renderShareCard(); return; }
    if (act === "share-back") { renderWrapped(ensureMonth(state.year, state.month)); return; }
    if (act === "share-save") { saveShareCard(); return; }
    var month = ensureMonth(state.year, state.month);

    if (act === "tx-show-more") {
      spendShowLimit += TX_PAGE;
      pendingScreenUi = captureScreenUi();
      render();
      return;
    }
    if (act === "tab") onTab(actEl.getAttribute("data-tab"));
    else if (act === "stats-back") {
      if (state.statsDoor === "vault" && state.vaultDocId) {
        pendingFocusRestore = { act: "vault-open", id: state.vaultDocId, tab: "", name: "" };
        discardEmptyVaultDraft(state.vaultDocId);
        state.vaultDocId = "";
        vaultPickMode = false;
      } else if (state.statsDoor === "vault") {
        state.statsDoor = "worth";
        state.vaultDocId = "";
        vaultPickMode = false;
      } else if (state.worthDetails) {
        state.worthDetails = false;
      } else if (state.statementDetails) {
        state.statementDetails = false;
      } else {
        /* Stay on Balance sheet / Income — no busy landing wall. */
        state.statsDoor = state.statsDoor || "worth";
        vaultPickMode = false;
      }
      saveState();
      render();
    } else if (act === "toggle-bs-group") {
      var gid = actEl.getAttribute("data-group") || "";
      if (gid) bsGroupOpen[gid] = !bsGroupOpen[gid];
      render();
    } else if (act === "stats-door") {
      if (state.statsDoor === "vault" && state.vaultDocId) discardEmptyVaultDraft(state.vaultDocId);
      state.statsDoor = actEl.getAttribute("data-door") || "";
      if (state.statsDoor !== "vault") state.vaultDocId = "";
      else state.vaultDocId = "";
      /* v37.5.31: Net worth pill always opens the statement. Tapping it inside Details clears worthDetails. */
      state.worthDetails = false;
      if (state.statsDoor !== "statement") state.statementDetails = false;
      vaultPickMode = false;
      saveState();
      render();
    } else if (act === "vault-open") {
      state.statsDoor = "vault";
      state.vaultDocId = actEl.getAttribute("data-id") || "";
      saveState();
      render();
      var vBack = document.querySelector('[data-act="stats-back"]');
      if (vBack) { try { vBack.focus(); } catch (err) {} }
    } else if (act === "vault-add-type") {
      state.profile = migrateProfile(state.profile, state.foo, state.compensation);
      var card = emptyVaultDoc(actEl.getAttribute("data-type"));
      var typeLink = suggestDocLink(card.slot);
      applyDocLink(card, typeLink);
      card._vaultDraft = true;
      /* v37.5.57: never create a $0 NW liability on cancelable add. */
      state.profile.documents.push(card);
      state.statsDoor = "vault";
      state.vaultDocId = card.id;
      saveState();
      render();
    } else if (act === "vault-add-paystub") {
      state.profile = migrateProfile(state.profile, state.foo, state.compensation);
      var payStubCard = emptyVaultDoc("other");
      payStubCard.slot = "payStubs";
      payStubCard.linkedKind = "income";
      payStubCard.linkedId = "compensation";
      payStubCard.linkedName = "Income statement";
      payStubCard.title = "Pay stub";
      payStubCard._vaultDraft = true;
      state.profile.documents.push(payStubCard);
      state.statsDoor = "vault";
      state.vaultDocId = payStubCard.id;
      saveState();
      render();
    } else if (act === "vault-doc-plus") {
      vaultPickMode = true;
      renderVaultPreserve();
    } else if (act === "vault-doc-camera") {
      var vaultCam = document.getElementById("vault-doc-camera");
      if (vaultCam) vaultCam.click();
    } else if (act === "vault-doc-choose") {
      var vaultChooser = document.getElementById("vault-doc-file");
      if (vaultChooser) vaultChooser.click();
    } else if (act === "vault-pay-monthly") {
      var payDoc = findProfileDoc(actEl.getAttribute("data-id") || state.vaultDocId || "");
      if (payDoc) {
        if (actEl.getAttribute("data-answer") === "yes") payDoc.premiumFrequency = "monthly";
        markVaultFieldTouched(payDoc, "premiumFrequency");
        saveState();
        renderVaultPreserve();
      }
    } else if (act === "vault-pdf-retry") {
      retryVaultPdfRead(actEl.getAttribute("data-id") || state.vaultDocId || "");
    } else if (act === "paystub-dup-open" || act === "paystub-dup-discard") {
      // v37.5.59.6: drop the duplicate copy (or put the card back as it was, if it was an existing card).
      var dupId = actEl.getAttribute("data-id") || "";
      var dupDoc = findProfileDoc(dupId);
      if (dupDoc && payStubUndo[dupId] && !payStubUndo[dupId]._vaultDraft && payStubUndo[dupId].hasBlob) {
        cancelPayStubReview(dupId);
      } else if (dupDoc) {
        delete payStubUndo[dupId];
        removeVaultDocumentById(dupId);
      }
      state.statsDoor = "vault";
      state.vaultDocId = act === "paystub-dup-open" ? (actEl.getAttribute("data-keep") || "") : "";
      vaultPickMode = false;
      saveState();
      render();
    } else if (act === "paystub-confirm") {
      confirmPayStubToIncome(actEl.getAttribute("data-id") || state.vaultDocId || "");
    } else if (act === "paystub-cancel") {
      cancelPayStubReview(actEl.getAttribute("data-id") || state.vaultDocId || "");
    } else if (act === "paystub-manual") {
      var manualDoc = findProfileDoc(actEl.getAttribute("data-id") || state.vaultDocId || "");
      if (manualDoc) {
        manualDoc.payStubReview = true;
        manualDoc.payStubManual = true;
        manualDoc.payStubReadFailed = false;
        manualDoc.payStubManualError = "";
        if (!manualDoc.payStubPending || typeof manualDoc.payStubPending !== "object") {
          manualDoc.payStubPending = { confidence: 0, adapterId: "manual", otherDeductions: [], employer: manualDoc.provider || "" };
        }
        saveState();
        renderVaultPreserve();
      }
    } else if (act === "loan-sort") {
      var sortKey = actEl.getAttribute("data-key") || "balance";
      var currentSort = loanSortSpec();
      if (currentSort.key === sortKey) {
        currentSort.dir = currentSort.dir === "desc" ? "asc" : "desc";
      } else {
        currentSort.key = sortKey;
        currentSort.dir = sortKey === "time" ? "asc" : "desc";
      }
      state.loanSort = currentSort;
      saveState();
      render();
    } else if (act === "payoff-pick") {
      var pickId = actEl.getAttribute("data-id") || "";
      state.payoffLoanId = state.payoffLoanId === pickId ? "" : pickId;
      saveState();
      paintPayoffCard();
    } else if (act === "open-matters") {
      mattersReturnToProfile = !!actEl.closest(".profile-sheet");
      openMattersSurvey();
    } else if (act === "open-insights-foo") {
      state.tab = "insights";
      state.insightsDoor = "";
      saveState();
      closeModal();
      render();
    } else if (act === "open-wrapped") {
      openWrapped(month);
    } else if (act === "set-plan") {
      setPlan(actEl.getAttribute("data-plan"));
      /* v37.5.59: repaint the screen behind the Profile sheet too, so one click visibly flips
       * Insights / Wrap entry under the scrim instead of looking unchanged until close. */
      if (actEl.closest(".profile-sheet")) { render(); openProfile({ preserveScroll: true }); }
      else if (actEl.closest(".wrap-stage")) {
        wrapSlideIndex = 0;
        render();
        renderWrapped(month);
      } else render();
    } else if (act === "toggle-goal") {
      state.matters = migrateMatters(state.matters);
      var goalId = actEl.getAttribute("data-id") || "";
      var list = state.matters.goals || [];
      var idx = list.indexOf(goalId);
      if (idx >= 0) list.splice(idx, 1);
      else list.push(goalId);
      state.matters.goals = list;
      saveState();
      if (actEl.closest(".matters-sheet")) openMattersSurvey({ preserveScroll: true });
      else render();
    } else if (act === "add-custom-goal") {
      var input = document.querySelector("[data-act='custom-goal']");
      var label = String(input && input.value || "").replace(/^\s+|\s+$/g, "");
      if (label) openGoalEditor({ isNew: true, label: label, returnTo: "stats" });
    } else if (act === "edit-goal") {
      state.matters = migrateMatters(state.matters);
      var goalId = actEl.getAttribute("data-id") || "";
      var goalChip = goalCatalog().filter(function (chip) { return chip.id === goalId; })[0];
      if (goalChip) {
        openGoalEditor({
          id: goalChip.id,
          label: goalChip.label,
          isNew: false,
          returnTo: actEl.getAttribute("data-return") || "stats"
        });
      }
    } else if (act === "remove-goal") {
      state.matters = migrateMatters(state.matters);
      var removeId = actEl.getAttribute("data-id") || "";
      state.matters.goals = (state.matters.goals || []).filter(function (id) { return id !== removeId; });
      state.matters.goalPlans = (state.matters.goalPlans || []).filter(function (plan) { return plan.id !== removeId; });
      var backTo = actEl.getAttribute("data-return") || "stats";
      saveState();
      closeModal();
      if (backTo === "matters") openMattersSurvey();
      else render();
    } else if (act === "wrap-cadence") {
      /* v37.5.55: cadence picker parked — annual only. */
      state.wrapCadence = "year";
      wrapSlideIndex = 0;
      saveState();
      renderWrapped(month);
    } else if (act === "wrap-next") {
      wrapSlideIndex += 1;
      renderWrapped(month);
    } else if (act === "wrap-prev") {
      wrapSlideIndex = Math.max(0, wrapSlideIndex - 1);
      renderWrapped(month);
    } else if (act === "open-full-foo") {
      state.insightsDoor = "foo";
      saveState();
      render();
    } else if (act === "insights-back") {
      state.insightsDoor = "";
      saveState();
      render();
    } else if (act === "grade-bar") {
      openGradeSheet(actEl.getAttribute("data-section"));
    } else if (act === "foo-explain") {
      event.preventDefault();
      event.stopPropagation();
      openFooExplainer(Number(actEl.getAttribute("data-step")));
    } else if (act === "foo3-callout") {
      var callId = actEl.getAttribute("data-id") || "";
      var callSource = actEl.getAttribute("data-source") || "";
      if (callSource === "envelope") {
        var foundLine = findLine(month, callId);
        if (foundLine) {
          var lineFields = field("Name", "name", foundLine.line.name) +
            field("This month’s payment", "assigned", String(foundLine.line.assigned), "number") +
            field("Balance", "loanBalance", String(foundLine.line.loanBalance || 0), "number") +
            '<label class="field">APR %<input name="loanApr" inputmode="decimal" type="text" value="' +
            esc(foundLine.line.loanApr || 0) + '"></label>' +
            field("Min payment", "loanMinPayment", String(foundLine.line.loanMinPayment || 0), "number") +
            field("Original balance", "loanOriginalBalance", String(foundLine.line.loanOriginalBalance || 0), "number") +
            debtTypeSelect("loanDebtType", foundLine.line.loanDebtType || "", foundLine.line.name) +
            '<input type="hidden" name="id" value="' + esc(foundLine.line.id) + '">';
          openSheet((foundLine.cat ? foundLine.cat.name + " · " : "") + foundLine.line.name,
            lineFields, "save-line-item");
        } else {
          state.tab = "insights";
          state.insightsDoor = "foo";
          saveState();
          closeModal();
          render();
        }
      } else if (callSource === "nw") {
        state.tab = "stats";
        state.statsDoor = "worth";
        state.worthDetails = true;
        saveState();
        closeModal();
        render();
        var nwBtn = document.querySelector('[data-act="edit-line"][data-id="' + callId + '"]');
        if (nwBtn) nwBtn.click();
      } else {
        state.tab = "insights";
        state.insightsDoor = "foo";
        saveState();
        closeModal();
        render();
      }
    } else if (act === "vault-delete") {
      var vaultDeleteId = actEl.getAttribute("data-id") || "";
      var vaultDeleteDoc = findProfileDoc(vaultDeleteId);
      if (!vaultDeleteDoc || !confirmDeleteVaultDoc(vaultDeleteDoc)) return;
      removeVaultDocumentById(vaultDeleteId);
      vaultPickMode = false;
      render();
    } else if (act === "remove-profile-doc") {
      var docId = actEl.getAttribute("data-id") || "";
      if (!docId) return;
      removeVaultDocumentById(docId);
      openProfile({ preserveScroll: true });
    } else if (act === "profile-doc-plus") {
      profileDocDraft = { mode: "pick" };
      openProfile({ preserveScroll: true });
    } else if (act === "profile-doc-camera") {
      var cam = document.getElementById("profile-doc-camera");
      if (cam) cam.click();
    } else if (act === "profile-doc-choose") {
      var chooser = document.getElementById("profile-doc-file");
      if (chooser) chooser.click();
    } else if (act === "cancel-profile-doc") {
      profileDocDraft = null;
      openProfile({ preserveScroll: true });
    } else if (act === "open-profile-doc") {
      openStoredDocument(actEl.getAttribute("data-id"));
    } else if (act === "edit-profile-doc") {
      var editDoc = findProfileDoc(actEl.getAttribute("data-id"));
      if (editDoc) {
        profileDocDraft = {
          mode: "edit",
          id: editDoc.id,
          slot: editDoc.slot,
          fileName: editDoc.fileName,
          linkedKind: editDoc.linkedKind,
          linkedId: editDoc.linkedId,
          linkedName: editDoc.linkedName
        };
        openProfile({ preserveScroll: true, highlightDocId: editDoc.id });
      }
    } else if (act === "open-linked-doc") {
      event.preventDefault();
      event.stopPropagation();
      var linkedId = actEl.getAttribute("data-id");
      profileHighlightDocId = linkedId || "";
      openProfile({ highlightDocId: linkedId, openDoc: true });
    } else if (act === "back-to-profile-docs") {
      openProfile({ highlightDocId: profileHighlightDocId });
    } else if (act === "back-to-vault-doc") {
      closeModal();
      render();
    } else if (act === "foo-answer") {
      state.foo = migrateFoo(state.foo);
      var answerField = actEl.getAttribute("data-field");
      var yes = actEl.getAttribute("data-value") === "yes";
      if (answerField === "deductiblesCovered") state.foo.deductiblesCovered = yes;
      else if (answerField === "matchCaptured") state.foo.matchFull = yes;
      else if (answerField === "prepayFuture") state.foo.prepayFuture = yes;
      else if (answerField === "prepayLowInterest") state.foo.prepayLowInterest = yes;
      saveState();
      render();
    } else if (act === "matters-yn") {
      state.matters = migrateMatters(state.matters);
      var ynField = actEl.getAttribute("data-field");
      var ynValue = actEl.getAttribute("data-value") || "";
      state.matters[ynField] = ynValue;
      saveState();
      if (ynField === "usesBudget" || ynField === "budgetMethod") {
        openMattersSurvey({ preserveScroll: true });
      } else {
        paintMattersYesNo(actEl.closest(".scale-row"), ynField, ynValue);
      }
    } else if (act === "matters-deeper") {
      state.matters = migrateMatters(state.matters);
      state.matters.deeperOpen = !state.matters.deeperOpen;
      saveState();
      openMattersSurvey({ preserveScroll: true });
    } else if (act === "foo-check") {
      state.foo = migrateFoo(state.foo);
      state.foo[actEl.getAttribute("data-field")] = !!actEl.checked;
      saveState();
      render();
    } else if (act === "nw-scrub-year") {
      state.worthScrubYear = Number(actEl.getAttribute("data-year"));
      saveState();
      var wrap = actEl.closest("[data-nw-scrub]");
      if (wrap) {
        var years = [];
        try { years = JSON.parse(wrap.getAttribute("data-years") || "[]"); } catch (err) {}
        var year = state.worthScrubYear;
        var i = years.indexOf(year);
        var svg = wrap.querySelector("svg");
        var line = svg && svg.querySelector(".nw-rule");
        if (line && i >= 0) {
          var x = 8 + i * (320 - 16) / Math.max(1, years.length - 1);
          line.setAttribute("x1", x.toFixed(1));
          line.setAttribute("x2", x.toFixed(1));
        }
        var readout = wrap.querySelector(".scrub-readout");
        var nw = Number(wrap.getAttribute("data-nw-" + year)) || 0;
        var inc = Number(wrap.getAttribute("data-inc-" + year)) || 0;
        if (readout) readout.textContent = year + " · Net worth " + money(nw) + " · Income " + money(inc);
      }
    } else if (act === "add-foo-debt") {
      addFooDebt(actEl.closest(".foo-step") || document.getElementById("screen"));
    } else if (act === "add-split-leg") {
      var addForm = actEl.closest("form");
      readSpendDraft(addForm);
      if (spendDraft) {
        spendDraft.legs.push({ id: nextId(), categoryId: "", lineId: "", amount: Math.max(0, (Number(spendDraft.amount) || 0) - spendDraft.legs.reduce(function (n, l) { return n + (Number(l.amount) || 0); }, 0)), note: "" });
        renderSpendSheet(month);
      }
    } else if (act === "remove-split-leg") {
      var rmForm = actEl.closest("form");
      readSpendDraft(rmForm);
      var rmIndex = Number(actEl.getAttribute("data-index"));
      if (spendDraft && spendDraft.legs.length > 1) {
        spendDraft.legs.splice(rmIndex, 1);
        renderSpendSheet(month);
      }
    } else if (act === "spend-type") {
      readSpendDraft(actEl.closest("form"));
      if (spendDraft) {
        spendDraft.type = actEl.getAttribute("data-type") === "income" ? "income" : "expense";
        spendDraft.error = "";
        if (spendDraft.type === "income") spendDraft.refundKind = "";
        renderSpendSheet(month);
      }
    } else if (act === "spend-merchant-chip") {
      // Fill payee only — never wipe an amount the user already typed.
      var chipForm = actEl.closest("form");
      readSpendDraft(chipForm);
      if (spendDraft) {
        spendDraft.payee = actEl.getAttribute("data-payee") || spendDraft.payee;
        spendDraft.error = "";
        if (spendDraft.type !== "income") {
          applyMerchantEnvelope(month, spendDraft.payee);
        }
        renderSpendSheet(month);
      }
    } else if (act === "spend-fill-remaining") {
      var remForm = actEl.closest("form");
      readSpendDraft(remForm);
      if (spendDraft && spendDraft.type !== "income") {
        var fillAmt = Number(actEl.getAttribute("data-amount"));
        if (!(fillAmt >= 0)) fillAmt = 0;
        spendDraft.amount = fillAmt;
        if (spendDraft.legs && spendDraft.legs.length === 1) {
          spendDraft.legs[0].amount = fillAmt;
        }
        spendDraft.error = "";
        renderSpendSheet(month);
      }
    } else if (act === "delete-spend" || act === "swipe-delete") {
      // Transactions tab only; never offered from Budget/envelope views or other sheets.
      var delId = actEl.getAttribute("data-id") || "";
      if (state.tab !== "spend") return;
      if (!confirmDeleteTransaction(month, delId)) return;
      if (act === "delete-spend") { spendDraft = null; closeModal(); }
      deleteTransaction(month, delId);
    } else if (act === "export-xlsx") {
      exportXlsx();
    } else if (act === "export-pdf") {
      exportPdf();
    } else if (act === "export-backup") {
      exportBackup();
    } else if (act === "restore-file") {
      var restoreInput = document.getElementById("restore-file");
      if (restoreInput) restoreInput.click();
    } else if (act === "restore-cancel") {
      pendingRestore = null;
      openProfile();
      setDataStatus("Restore cancelled. Nothing was changed.");
    } else if (act === "restore-apply") {
      applyRestore();
    } else if (act === "open-vault-paystubs") {
      closeModal();
      state.tab = "stats";
      state.statsDoor = "vault";
      state.vaultDocId = "";
      saveState();
      render();
    }
    else if (act === "prev-month") shiftMonth(-1);
    else if (act === "next-month") shiftMonth(1);
    else if (act === "open-settings" || act === "open-profile") openProfile();
    else if (act === "copy-month") copyBudgetOntoNext();
    else if (act === "copy-last-month") copyLastMonthOntoCurrent();
    else if (act === "start-month") openRitual();
    else if (act === "ritual-copy") {
      ritual.destKey = copyBudgetTemplate();
      ritual.step = 2;
      saveState();
      renderRitual();
    } else if (act === "ritual-continue") {
      ritual.step = 3;
      renderRitual();
    } else if (act === "ritual-open") {
      try { queueTesterMonthClose(ymKey(state.year, state.month)); } catch (err) {}
      var destYM = offsetMonth(state.year, state.month, 1);
      state.year = destYM.year;
      state.month = destYM.month;
      ritual = { step: 0, destKey: "" };
      saveState();
      closeModal();
      render();
    } else if (act === "envelope-mode") {
      state.envelopeMode = actEl.getAttribute("data-mode") || "remaining";
      saveState();
      render();
    } else if (act === "open-envelope") {
      var openCat = month.categories.filter(function (c) { return c.id === actEl.getAttribute("data-id"); })[0];
      if (openCat) openEnvelopeDetail(openCat, month);
    } else if (act === "rename-envelope") {
      var renameCat = month.categories.filter(function (c) { return c.id === actEl.getAttribute("data-id"); })[0];
      if (!renameCat) return;
      openSheet("Rename envelope",
        field("Name", "name", renameCat.name) +
        '<input type="hidden" name="id" value="' + esc(renameCat.id) + '">',
        "save-category");
    } else if (act === "quick-spend-line") {
      quickSpendLineId = actEl.getAttribute("data-id") || "";
      paintQuickSpendCheck();
    }
    else if (act === "open-income-statement") openIncomeStatement();
    else if (act === "suggest-paycheck") suggestPaycheckAmount();
    else if (act === "add-post-tax") addPostTaxRow();
    else if (act === "remove-post-tax") removePostTaxRow(actEl.getAttribute("data-id"));
    else if (act === "toggle-night") {
      state.nightLedger = actEl.checked;
      saveState();
      applyNight();
    }
    else if (act === "close-modal") {
      var returnProfile = mattersReturnToProfile;
      mattersReturnToProfile = false;
      pendingScreenUi = captureScreenUi();
      closeModal();
      if (returnProfile) openProfile();
      else {
        render();
        restoreModalReturnScreenTop();
      }
    }
    else if (act === "edit-annual-year") openAnnualYear(actEl.getAttribute("data-year"));
    else if (act === "add-annual-year") {
      ensureAnnualStatement();
      var addY = currentYearMonth().year;
      ensureAnnualYearFromPrior(state.annualStatement, addY);
      /* Fresh empty year — do not copy prior numbers into a first year. */
      if (annualYearList(state.annualStatement).length === 1) {
        state.annualStatement.years[String(addY)] = {
          salary: null, bonus: null, sideGig: null, other: null, match: null,
          taxes: null, opex: null, investments: null,
          taxFederal: null, taxState: null, taxFica: null, taxOther: null,
          federalBracket: null, stateBracket: null, stateOtherPct: null
        };
      }
      saveState();
      openAnnualYear(addY);
    }
    else if (act === "toggle-annual-taxes") {
      annualTaxesOpen = !annualTaxesOpen;
      render();
    } else if (act === "annual-info") {
      var tipKey = actEl.getAttribute("data-key") || "";
      var tipYear = annualHighlightYear(annualYearList(ensureAnnualStatement()));
      if (annualInfoTip && annualInfoTip.key === tipKey) annualInfoTip = null;
      else {
        var tipRect = actEl.getBoundingClientRect();
        var pass = document.querySelector(".annual-pass") || document.getElementById("screen");
        var passRect = pass ? pass.getBoundingClientRect() : { top: 0 };
        annualInfoTip = {
          key: tipKey,
          year: tipYear,
          anchorTop: Math.max(0, tipRect.bottom - passRect.top + (pass.scrollTop || 0) + 6)
        };
      }
      render();
      var tipX = document.querySelector(".annual-info-pop .annual-info-x");
      if (tipX) { try { tipX.focus(); } catch (err) {} }
    } else if (act === "annual-info-year") {
      if (annualInfoTip) {
        annualInfoTip.year = Number(actEl.getAttribute("data-year"));
        annualInfoTip.pinned = true;
      }
      render();
    } else if (act === "annual-info-close") {
      var tipKeyX = annualInfoTip && annualInfoTip.key;
      annualInfoTip = null;
      render();
      var tipBtnX = tipKeyX && document.querySelector('[data-act="annual-info"][data-key="' + tipKeyX + '"]');
      if (tipBtnX) { try { tipBtnX.focus(); } catch (err) {} }
    } else if (act === "open-year-income") openYearIncome(actEl.getAttribute("data-year"));
    else if (act === "toggle-income-years") {
      state.incomeYearsExpanded = !state.incomeYearsExpanded;
      saveState();
      render();
    } else if (act === "toggle-worth-years") {
      state.worthYearsExpanded = !state.worthYearsExpanded;
      saveState();
      render();
    } else if (act === "pick-worth-year") {
      state.worthYear = Number(actEl.getAttribute("data-year"));
      saveState();
      /* render() keeps #screen.scrollTop when the paint key is unchanged.
         Do not scroll the year bar to the top. */
      render();
    }
    else if (act === "worth-details") {
      state.worthDetails = true;
      saveState();
      render();
    } else if (act === "worth-back") {
      state.worthDetails = false;
      saveState();
      render();
    } else if (act === "statement-details") {
      state.statementDetails = true;
      saveState();
      render();
    } else if (act === "statement-back") {
      state.statementDetails = false;
      saveState();
      render();
    } else if (act === "clear-salary-target") {
      var clrYear = Number(actEl.getAttribute("data-year"));
      var clrT = incomeTargetFor(clrYear);
      writeIncomeTarget(clrYear, null, clrT.notes);
      payStubBasisCache = {};
      saveState();
      closeModal();
      render();
      openAnnualYear(clrYear);
    } else if (act === "add-prior-year") {
      openPriorYearSheet();
    } else if (act === "add-year") {
      var max = state.worth.years.length ? Math.max.apply(null, state.worth.years) : new Date().getFullYear() - 1;
      var nextYear = max + 1;
      state.worth.years.push(nextYear);
      state.worth.lines.forEach(function (line) {
        line.amounts[nextYear] = 0;
        if (!line.additions) line.additions = {};
        line.additions[nextYear] = 0;
      });
      if (!state.worth.income) state.worth.income = {};
      if (!state.worth.notes) state.worth.notes = {};
      state.worth.income[nextYear] = 0;
      state.worth.notes[nextYear] = "";
      // Stay on the year that has real balances; the new column is available in Details.
      if (!worthHasData() || !worthTotals(state.worthYear).equity) state.worthYear = nextYear;
      state.worthDetails = true;
      ensureAnnualStatement();
      if (!state.annualStatement.years[String(nextYear)]) ensureAnnualYearFromPrior(state.annualStatement, nextYear);
      saveState();
      render();
    } else if (act === "toggle-edit-envelopes") {
      envelopeEditMode = !envelopeEditMode;
      render();
    } else if (act === "add-category") {
      openSheet("New envelope", field("Name", "name", "") + field("Assigned", "assigned", "0", "number"), "save-category");
    } else if (act === "edit-category") {
      var cat = month.categories.filter(function (c) { return c.id === actEl.getAttribute("data-id"); })[0];
      if (!cat) return;
      openEnvelopeDetail(cat, month);
    } else if (act === "add-line") {
      var addCat = month.categories.filter(function (c) { return c.id === actEl.getAttribute("data-id"); })[0];
      var addFields = field("Name", "name", "") +
        field(addCat && /^debt$/i.test(addCat.name) ? "This month’s payment" : "Assigned",
          "assigned", "0", "number");
      if (addCat && /^debt$/i.test(addCat.name)) {
        addFields += field("Balance", "loanBalance", "0", "number") +
          '<p class="caption">Payment is this month’s assigned amount. Balance is what you still owe — it also appears on the net worth statement.</p>';
      }
      openSheet("New line",
        addFields +
        '<input type="hidden" name="categoryId" value="' + esc(actEl.getAttribute("data-id")) + '">',
        "save-new-line");
    } else if (act === "edit-line-item") {
      var found = findLine(month, actEl.getAttribute("data-id"));
      if (!found) return;
      var lineFields = field("Name", "name", found.line.name) +
        field(found.cat && /^debt$/i.test(found.cat.name) ? "This month’s payment" : "Assigned",
          "assigned", String(found.line.assigned), "number");
      if (found.cat && /^debt$/i.test(found.cat.name)) {
        lineFields += field("Balance", "loanBalance", String(found.line.loanBalance || 0), "number") +
          '<label class="field">APR %<input name="loanApr" inputmode="decimal" type="text" value="' +
          esc(found.line.loanApr || 0) + '"></label>' +
          field("Min payment", "loanMinPayment", String(found.line.loanMinPayment || 0), "number") +
          field("Original balance", "loanOriginalBalance", String(found.line.loanOriginalBalance || 0), "number") +
          debtTypeSelect("loanDebtType", found.line.loanDebtType || "", found.line.name) +
          '<p class="caption">Assigned is this month’s payment. Balance, APR, min, and type persist on the line. In the spirit of Money Guy’s Financial Order of Operations — estimates, not advice.</p>';
      }
      openSheet((found.cat ? found.cat.name + " · " : "") + found.line.name,
        lineFields +
        lineSpendList(month, found.line.id) +
        '<input type="hidden" name="id" value="' + esc(found.line.id) + '">',
        "save-line-item");
      /* v37.5.59.16 (owner): tapping the $ amount lands on the amount field; tapping the name keeps the name field. */
      if (actEl.getAttribute("data-focus") === "assigned") {
        var focusAmount = function () {
          var amt = document.querySelector('#modal input[name="assigned"]');
          if (amt) { amt.focus(); try { amt.select(); } catch (err) {} }
        };
        focusAmount();
        setTimeout(focusAmount, 60);
      }
    } else if (act === "envmenu-line-up" || act === "envmenu-line-down") {
      closeModal();
      moveLine(month, actEl.getAttribute("data-id"), act === "envmenu-line-up" ? -1 : 1);
    } else if (act === "envmenu-line-to") {
      moveLineToCategory(month, actEl.getAttribute("data-id"), actEl.getAttribute("data-to"));
    } else if (act === "envmenu-line-delete") {
      deleteLineKeepHistory(month, actEl.getAttribute("data-id"));
    } else if (act === "envmenu-cat-up" || act === "envmenu-cat-down") {
      closeModal();
      moveEnvelope(month, actEl.getAttribute("data-id"), act === "envmenu-cat-up" ? -1 : 1);
    } else if (act === "envmenu-cat-delete") {
      deleteEnvelopeKeepHistory(month, actEl.getAttribute("data-id"));
    } else if (act === "delete-line") {
      deleteLine(month, actEl.getAttribute("data-id"));
    } else if (act === "move-line-up") {
      moveLine(month, actEl.getAttribute("data-id"), -1);
    } else if (act === "move-line-down") {
      moveLine(month, actEl.getAttribute("data-id"), 1);
    } else if (act === "delete-category") {
      deleteEnvelope(month, actEl.getAttribute("data-id"));
    } else if (act === "move-up") {
      moveEnvelope(month, actEl.getAttribute("data-id"), -1);
    } else if (act === "move-down") {
      moveEnvelope(month, actEl.getAttribute("data-id"), 1);
    } else if (act === "add-income") {
      openSheet("Add paycheck",
        field("Name", "name", nextPaycheckName(month)) + field("Amount", "amount", "0", "money") +
        field("Date", "date", isoDate(state.year, state.month, 1), "date"),
        "save-income");
    } else if (act === "edit-income") {
      var income = month.incomes.filter(function (item) { return item.id === actEl.getAttribute("data-id"); })[0];
      if (!income) return;
      openSheet("Edit income",
        field("Name", "name", income.name) + field("Amount", "amount", String(income.amount), "money") +
        field("Date", "date", income.date, "date") +
        '<input type="hidden" name="id" value="' + esc(income.id) + '">',
        "save-income");
    }     else if (act === "add-spend") {
      openSpendSheet(null, month);
    } else if (act === "edit-spend") {
      var tx = (month.transactions || []).filter(function (item) { return item.id === actEl.getAttribute("data-id"); })[0];
      if (tx) openEditSpend(tx, month);
    } else if (act === "reset-spend") {
      if (window.confirm("Clear this month’s spending?\n\nThis permanently removes every expense and refund in " +
          MONTH_NAMES[month.month - 1] + " " + month.year + ". Envelope names, assigned amounts, paychecks, and Income transactions stay. This can’t be undone.")) {
        month.transactions = (month.transactions || []).filter(isIncomeTx);
        saveState();
        render();
      }
    } else if (act === "add-nw-account") {
      openSheet("Add account",
        field("Name", "name", "") +
        '<label class="field">Group<select name="group">' +
        '<option value="cash">Cash</option>' +
        '<option value="retirement">Retirement</option>' +
        '<option value="taxable">Investments (taxable)</option>' +
        '<option value="realEstate">Property</option>' +
        '<option value="lifestyle">Other</option>' +
        "</select></label>" +
        field(String(state.worthYear) + " amount", "amount", "0", "number") +
        '<p class="caption">Adds an account on this year’s statement. You can rename it later.</p>',
        "save-nw-account");
    } else if (act === "add-nw-loan") {
      openSheet("Add loan",
        field("Name", "name", "") +
        field("Balance", "loanBalance", "0", "number") +
        '<p class="caption">Creates a liability on this year’s statement. Name it and enter what you still owe.</p>',
        "save-nw-loan");
    } else if (act === "edit-line") {
      var line = state.worth.lines.filter(function (l) { return l.id === actEl.getAttribute("data-id"); })[0];
      if (!line) return;
      var fields = field("Name", "name", line.name);
      // v37.5.59.12 (QA M9): liabilities show one Balance field (writes the year amount). Assets keep "YYYY amount".
      if (line.kind === "liability") {
        fields += field("Balance", "amount", String(lineAmount(line, state.worthYear)), "number") +
          '<p class="caption">What you still owe on this statement year. This is the number Net worth uses.</p>';
      } else {
        fields += field(String(state.worthYear) + " amount", "amount", String(lineAmount(line, state.worthYear)), "number");
      }
      if (line.kind !== "liability" && line.group !== "debt") {
        /* v37.5.55: move an asset between groups (e.g. car to Property). */
        var grpOpts = [["cash", "Cash"], ["retirement", "Retirement"], ["taxable", "Investments (taxable)"],
          ["realEstate", "Property"], ["lifestyle", "Other"]];
        var curGrp = line.group === "investment" ? "taxable" : line.group;
        fields += '<label class="field">Group<select name="group">' + grpOpts.map(function (o) {
          return '<option value="' + o[0] + '"' + (o[0] === curGrp ? " selected" : "") + ">" + o[1] + "</option>";
        }).join("") + "</select></label>";
      }
      if (tracksContributions(line)) {
        fields += field(String(state.worthYear) + (is401k(line) ? " employee additions" : " net additions"),
          "additions", String(lineAddition(line, state.worthYear)), "number");
        if (is401k(line)) {
          fields += field(String(state.worthYear) + " employer match", "match", String(lineEmployerMatch(line, state.worthYear)), "number");
          fields += field(String(state.worthYear) + " employer base", "base", String(lineEmployerBase(line, state.worthYear)), "number");
        }
      }
      if (line.kind === "liability" && debtLineNames().indexOf(String(line.name || "").toLowerCase()) < 0) {
        fields += '<label class="field">APR %<input name="loanApr" inputmode="decimal" type="text" value="' +
          esc(line.loanApr || 0) + '"></label>' +
          field("Min payment", "loanMinPayment", String(line.loanMinPayment || 0), "number") +
          field("Original balance", "loanOriginalBalance", String(line.loanOriginalBalance || 0), "number") +
          debtTypeSelect("loanDebtType", line.loanDebtType || "", line.name) +
          '<p class="caption">No matching Debt envelope line. Insights uses APR, min payment and type for payoff estimates (Money Guy order of operations — estimates, not advice).</p>';
      }
      fields += '<input type="hidden" name="id" value="' + esc(line.id) + '">';
      openSheet("Edit " + line.name, fields, "save-line");
    }
  }

  function handleSubmit(event) {
    var form = event.target.closest("form[data-act]");
    if (!form) return;
    event.preventDefault();
    var act = form.getAttribute("data-act");
    var data = {};
    Array.prototype.forEach.call(form.elements, function (el) {
      if (el.name) data[el.name] = el.value;
    });
    var month = ensureMonth(state.year, state.month);
    if (act === "save-profile-doc") {
      state.profile = migrateProfile(state.profile, state.foo, state.compensation);
      var draftId = profileDocDraft && profileDocDraft.id;
      var doc = findProfileDoc(draftId);
      if (doc) {
        doc.fileName = String(data.fileName || doc.fileName).replace(/^\s+|\s+$/g, "") || doc.fileName;
        doc.slot = normalizeDocSlot(data.slot);
        if (!doc.vaultTypeCustomized) {
          doc.vaultType = inferVaultType(doc);
          if (!doc.titleCustomized) applyVaultTitle(doc, { force: true });
        }
        var parts = String(data.link || "").split("|");
        if (!parts[0]) {
          applyDocLink(doc, null);
        } else {
          doc.linkedKind = parts[0] || "";
          doc.linkedId = parts[1] || "";
          doc.linkedName = parts[2] || "";
        }
        saveState();
      }
      profileDocDraft = null;
      openProfile({ preserveScroll: true, highlightDocId: draftId });
      return;
    }
    if (Object.prototype.hasOwnProperty.call(data, "assigned")) {
      data.assigned = centsFromDigits(data.assigned);
    }
    if (Object.prototype.hasOwnProperty.call(data, "amount")) {
      data.amount = centsFromDigits(data.amount);
    }
    if (Object.prototype.hasOwnProperty.call(data, "additions")) {
      data.additions = centsFromDigits(data.additions);
    }
    if (Object.prototype.hasOwnProperty.call(data, "match")) {
      data.match = centsFromDigits(data.match);
    }
    if (Object.prototype.hasOwnProperty.call(data, "base")) {
      data.base = centsFromDigits(data.base);
    }
    if (Object.prototype.hasOwnProperty.call(data, "loanBalance")) {
      data.loanBalance = centsFromDigits(data.loanBalance);
    }
    if (Object.prototype.hasOwnProperty.call(data, "loanMinPayment")) {
      data.loanMinPayment = centsFromDigits(data.loanMinPayment);
    }
    if (Object.prototype.hasOwnProperty.call(data, "loanOriginalBalance")) {
      data.loanOriginalBalance = centsFromDigits(data.loanOriginalBalance);
    }
    if (Object.prototype.hasOwnProperty.call(data, "loanApr")) {
      data.loanApr = Number(String(data.loanApr || "").replace(/[^0-9.]/g, "")) || 0;
    }
    if (act === "save-prior-year") {
      var py = Number(data.priorYear);
      if (py && state.worth.years.indexOf(py) < 0) {
        state.worth.lines.forEach(function (line) {
          line.amounts[py] = Math.abs(centsFromDigits(data["wl_" + line.id])) || 0;
          if (!line.additions) line.additions = {};
          line.additions[py] = 0;
        });
        state.worth.years.push(py);
        state.worth.years.sort(function (a, b) { return a - b; });
        if (!state.worth.income) state.worth.income = {};
        if (!state.worth.notes) state.worth.notes = {};
        if (state.worth.income[py] == null) state.worth.income[py] = 0;
        if (state.worth.notes[py] == null) state.worth.notes[py] = "";
        state.worthYear = py;
        saveState();
      }
      closeModal();
      render();
      return;
    }
    if (act === "save-category") {
      var assigned = Number(data.assigned) || 0;
      var name = (data.name || "").replace(/^\s+|\s+$/g, "") || "Envelope";
      if (data.id) {
        month.categories.forEach(function (c) {
          if (c.id === data.id) { c.name = name; delete c.autoCopy; }
        });
      } else {
        var lines = name === "Food"
          ? makeLines([{ name: "Groceries", assigned: assigned }, { name: "Restaurants", assigned: 0 }])
          : makeLines([{ name: name, assigned: assigned }]);
        month.categories.push({
          id: nextId(),
          name: name,
          assigned: assigned,
          sortOrder: month.categories.length,
          lines: lines
        });
        reindexCategories(month);
      }
    } else if (act === "save-new-line") {
      var parent = month.categories.filter(function (c) { return c.id === data.categoryId; })[0];
      if (parent) {
        if (!parent.lines) parent.lines = [];
        var createdLine = {
          id: nextId(),
          name: (data.name || "").replace(/^\s+|\s+$/g, "") || "Line",
          assigned: Number(data.assigned) || 0,
          sortOrder: parent.lines.length,
          loanBalance: Object.prototype.hasOwnProperty.call(data, "loanBalance")
            ? (Number(data.loanBalance) || 0)
            : 0,
          loanApr: 0,
          loanMinPayment: 0,
          loanOriginalBalance: 0,
          loanDebtType: ""
        };
        parent.lines.push(createdLine);
        reindexLines(parent);
        if (/^debt$/i.test(parent.name)) syncBudgetLoanToNetWorth(createdLine);
      }
    } else if (act === "save-line-item") {
      // v37.5.59.12 (QA 598): an empty line name says so instead of silently keeping the old one.
      if (!(data.name || "").replace(/^\s+|\s+$/g, "") && form.querySelector('input[name="name"]')) {
        showSheetFieldError(form, "name", "Give this line a name.");
        return;
      }
      var editFound = findLine(month, data.id);
      if (editFound) {
        var priorDebtName = editFound.line.name;
        editFound.line.name = (data.name || "").replace(/^\s+|\s+$/g, "") || editFound.line.name;
        editFound.line.assigned = Number(data.assigned) || 0;
        delete editFound.line.autoCopy;
        if (editFound.cat && /^debt$/i.test(editFound.cat.name)) {
          editFound.line.loanBalance = Number(data.loanBalance) || 0;
          editFound.line.loanApr = Number(data.loanApr) || 0;
          editFound.line.loanMinPayment = Number(data.loanMinPayment) || 0;
          if (Object.prototype.hasOwnProperty.call(data, "loanOriginalBalance")) {
            editFound.line.loanOriginalBalance = Number(data.loanOriginalBalance) || 0;
          }
          if (Object.prototype.hasOwnProperty.call(data, "loanDebtType")) {
            editFound.line.loanDebtType = data.loanDebtType || "";
          }
          syncBudgetLoanToNetWorth(editFound.line, priorDebtName);
        }
      }
    } else if (act === "save-income") {
      var incomeName = (data.name || "").replace(/^\s+|\s+$/g, "") || "Paycheck 1";
      if (data.id) {
        month.incomes.forEach(function (item) {
          if (item.id === data.id) {
            item.name = incomeName;
            item.amount = Number(data.amount) || 0;
            item.date = data.date || item.date;
            delete item.autoCopy;
          }
        });
      } else {
        month.incomes.push({
          id: nextId(),
          name: incomeName,
          amount: Number(data.amount) || 0,
          date: data.date || isoDate(state.year, state.month, 1)
        });
      }
    } else if (act === "save-year-income") {
      var yearKey = Number(data.year);
      if (!state.worth.income) state.worth.income = {};
      if (!state.worth.notes) state.worth.notes = {};
      state.worth.income[yearKey] = dollarsFromDigits(data.yearIncome);
      state.worth.notes[yearKey] = (data.notes || "").replace(/^\s+|\s+$/g, "");
    } else if (act === "save-spend-sheet") {
      readSpendDraft(form);
      if (!spendDraft) return;
      spendDraft.error = "";
      var payload;
      if (spendDraft.type === "income") {
        var incAmount = Number(spendDraft.amount) || 0;
        var incLine = (month.incomes || []).filter(function (item) { return String(item.id) === String(spendDraft.incomeId); })[0];
        // v37.5.59.2: no line picked → quietly the next paycheck that isn't fully received.
        if (!incLine && !spendDraft.incomeId) incLine = nextOpenIncomeLine(month, spendDraft.id);
        if (!(incAmount > 0) || !incLine) {
          spendDraft.error = !(incAmount > 0) ? "Enter an amount greater than $0."
            : "Every paycheck this month is fully received — pick an income line or add a paycheck.";
          renderSpendSheet(month);
          return;
        }
        if (incAmount > MONEY_MAX) {
          spendDraft.error = "Amount can’t be more than " + money(MONEY_MAX) + ".";
          renderSpendSheet(month);
          return;
        }
        payload = {
          id: spendDraft.id || nextId(),
          type: "income",
          payee: String(spendDraft.payee || "").replace(/^\s+|\s+$/g, "") || incLine.name || "Income",
          amount: incAmount,
          date: spendDraft.date || isoDate(state.year, state.month, new Date().getDate()),
          note: String(spendDraft.note || "").replace(/^\s+|\s+$/g, ""),
          incomeId: incLine.id
        };
      } else {
        if (!spendDraft.id && !spendDraft.categoryTouched) applyMerchantEnvelope(month, spendDraft.payee);
        var kind = gm().normalizeRefundKind ? gm().normalizeRefundKind(spendDraft.refundKind) : "";
        var legs = (spendDraft.legs || []).map(function (leg) {
          return {
            id: leg.id || nextId(),
            categoryId: leg.categoryId,
            lineId: leg.lineId,
            amount: Number(leg.amount) || 0,
            refund: kind === "partial" ? (Number(leg.refund) || 0) : 0,
            note: String(leg.note || "").replace(/^\s+|\s+$/g, "")
          };
        }).filter(function (leg) { return leg.lineId && leg.amount > 0; });
        if (!legs.length) {
          var anyEnv = (spendDraft.legs || []).some(function (leg) { return leg.lineId; });
          var typedAmt = Number(spendDraft.amount);
          spendDraft.error = !anyEnv ? "Pick an envelope."
            : (!(typedAmt > 0) ? "Enter an amount greater than $0." : "Enter an amount and pick an envelope.");
          renderSpendSheet(month);
          scrollSheetErrorIntoView();
          return;
        }
        if ((Number(spendDraft.amount) || 0) > MONEY_MAX) {
          spendDraft.error = "Amount can’t be more than " + money(MONEY_MAX) + ".";
          renderSpendSheet(month);
          return;
        }
        var total = Number(spendDraft.amount) || 0;
        if (legs.length === 1 && !(total > 0)) total = legs[0].amount;
        if (legs.length === 1) {
          legs[0].amount = total > 0 ? total : legs[0].amount;
          total = legs[0].amount;
        }
        var splitSum = legs.reduce(function (n, leg) { return n + leg.amount; }, 0);
        if (legs.length > 1 && cents(splitSum) !== cents(total)) {
          spendDraft.error = "Split legs must add up to the total.";
          renderSpendSheet(month);
          return;
        }
        var refundError = gm().refundDraftError ? gm().refundDraftError(kind, legs) : "";
        if (refundError) {
          spendDraft.error = refundError;
          renderSpendSheet(month);
          return;
        }
        var payee = String(spendDraft.payee || "").replace(/^\s+|\s+$/g, "") || "Spend";
        var note = String(spendDraft.note || "").replace(/^\s+|\s+$/g, "");
        payload = {
          id: spendDraft.id || nextId(),
          payee: payee,
          amount: total,
          date: spendDraft.date || isoDate(state.year, state.month, new Date().getDate()),
          note: note,
          categoryId: legs[0].categoryId,
          lineId: legs[0].lineId,
          legs: legs.length > 1 ? legs : undefined
        };
        if (kind) payload.refundKind = kind;
        if (kind === "partial" && legs.length === 1) payload.refund = legs[0].refund;
        if (kind !== "standalone") rememberMerchant(month, payee, legs);
        if (spendDraft.mappedFromHistory && !spendDraft.categoryTouched) markMerchantHint(payee);
      }
      // v37.5.59.12 (QA H1 + NEW-M2): move row; create matching envelope in dest if missing.
      var destYM = parseTxYearMonth(payload.date) || { year: state.year, month: state.month };
      var destMonth = ensureMonth(destYM.year, destYM.month);
      if (destMonth !== month && payload.type !== "income") {
        function remapLegIds(leg) {
          if (!leg || !leg.lineId) return leg;
          var mapped = ensureEnvelopeInMonth(destMonth, month, leg.categoryId, leg.lineId);
          leg.categoryId = mapped.categoryId;
          leg.lineId = mapped.lineId;
          return leg;
        }
        remapLegIds(payload);
        if (payload.legs) payload.legs.forEach(remapLegIds);
      }
      if (spendDraft.id) {
        month.transactions = (month.transactions || []).filter(function (item) { return item.id !== spendDraft.id; });
        if (destMonth !== month) {
          destMonth.transactions = (destMonth.transactions || []).filter(function (item) { return item.id !== spendDraft.id; });
        }
        destMonth.transactions.push(payload);
      } else {
        destMonth.transactions.push(payload);
      }
      spendDraft = null;
    } else if (act === "save-spend" || act === "save-quick-spend") {
      var foundLine = findLine(month, act === "save-quick-spend" ? quickSpendLineId : "");
      var parts = String(data.lineKey || data.categoryId || "").split(":");
      var categoryId = foundLine ? foundLine.cat.id : parts[0];
      var lineId = foundLine ? foundLine.line.id : (parts[1] || "");
      if (act === "save-quick-spend" && (!foundLine || !(Number(data.amount) > 0))) return;
      var note = (data.note || "").replace(/^\s+|\s+$/g, "");
      var quickPayee = note || (data.payee || "Spend").replace(/^\s+|\s+$/g, "") || "Spend";
      var quickAmount = Number(data.amount) || 0;
      var suggestion = merchantSuggestion(month, quickPayee, quickAmount);
      if (suggestion && suggestion.legs[0]) {
        categoryId = suggestion.legs[0].categoryId;
        lineId = suggestion.legs[0].lineId;
        markMerchantHint(quickPayee);
      }
      month.transactions.push({
        id: nextId(),
        payee: quickPayee,
        amount: quickAmount,
        date: data.date || isoDate(state.year, state.month, new Date().getDate()),
        categoryId: categoryId,
        lineId: lineId,
        note: note,
        mappedFromHistory: !!suggestion
      });
      rememberMerchant(month, quickPayee, [{ categoryId: categoryId, lineId: lineId, amount: quickAmount }]);
      quickSpendLineId = "";
    } else if (act === "save-edit-spend") {
      var editParts = String(data.lineKey || "").split(":");
      month.transactions.forEach(function (item) {
        if (item.id === data.id) {
          item.payee = (data.payee || "").replace(/^\s+|\s+$/g, "") || "Spend";
          item.amount = Number(data.amount) || 0;
          item.date = data.date || item.date;
          item.note = (data.note || "").replace(/^\s+|\s+$/g, "");
          if (editParts[0]) item.categoryId = editParts[0];
          if (editParts[1]) item.lineId = editParts[1];
          rememberMerchant(month, item.payee, [{
            categoryId: item.categoryId,
            lineId: item.lineId,
            amount: item.amount
          }]);
        }
      });
    } else if (act === "save-goal") {
      state.matters = migrateMatters(state.matters);
      var goalDate = data.goalDate || "";
      var goalAmount = centsFromDigits(data.goalAmount);
      var goalLabel = String(data.goalLabel || "").replace(/^\s+|\s+$/g, "");
      var goalId = data.goalId || "";
      if (!goalDate || !(goalAmount > 0) || (data.goalIsNew === "1" && !goalLabel)) {
        openGoalEditor({
          id: goalId,
          label: goalLabel,
          isNew: data.goalIsNew === "1",
          returnTo: data.goalReturn || "stats",
          date: goalDate,
          amount: goalAmount,
          error: "Add a target date and a dollar amount."
        });
        return;
      }
      if (data.goalIsNew === "1") {
        var created = { id: "custom-" + nextId(), label: goalLabel };
        state.matters.customGoals.push(created);
        goalId = created.id;
      }
      if (goalId && state.matters.goals.indexOf(goalId) < 0) state.matters.goals.push(goalId);
      var plans = state.matters.goalPlans.filter(function (plan) { return plan.id !== goalId; });
      plans.push({ id: goalId, targetDate: goalDate, amount: goalAmount });
      state.matters.goalPlans = plans;
      saveState();
      closeModal();
      if (data.goalReturn === "matters") openMattersSurvey();
      else render();
      return;
    } else if (act === "save-nw-account") {
      if (!state.worth.lines) state.worth.lines = [];
      var acctName = (data.name || "").replace(/^\s+|\s+$/g, "") || "Account";
      var acctGroup = data.group || "cash";
      if (acctGroup !== "cash" && acctGroup !== "retirement" && acctGroup !== "taxable" &&
          acctGroup !== "realEstate" && acctGroup !== "lifestyle") {
        acctGroup = "cash";
      }
      var acctAmounts = {};
      var acctAdditions = {};
      (state.worth.years || []).forEach(function (year) {
        acctAmounts[year] = 0;
        acctAdditions[year] = 0;
      });
      acctAmounts[state.worthYear] = Number(data.amount) || 0;
      state.worth.lines.push({
        id: nextId(),
        name: acctName,
        kind: "asset",
        group: acctGroup,
        sortOrder: state.worth.lines.length,
        amounts: acctAmounts,
        additions: acctAdditions,
        employerMatch: {},
        employerBase: {},
        loanBalance: 0,
        loanApr: 0,
        loanMinPayment: 0,
        loanOriginalBalance: 0,
        loanDebtType: ""
      });
    } else if (act === "save-nw-loan") {
      var loanName = (data.name || "").replace(/^\s+|\s+$/g, "") || "Loan";
      var loanBal = Number(data.loanBalance) || 0;
      var draftLoan = {
        name: loanName,
        loanBalance: loanBal,
        loanApr: 0,
        loanMinPayment: 0,
        loanOriginalBalance: 0,
        loanDebtType: ""
      };
      /* Details › Add loan always creates (or updates) a statement liability — even at $0. */
      var nwLoan = findNwLiabilityByName(loanName) || ensureBudgetNwLiability(draftLoan);
      if (nwLoan) {
        var nwYear = currentWorthYear();
        if (!nwLoan.amounts) nwLoan.amounts = {};
        nwLoan.amounts[nwYear] = loanBal;
        nwLoan.loanBalance = loanBal;
        nwLoan.name = loanName;
      }
    } else if (act === "save-line") {
      state.worth.lines.forEach(function (line) {
        if (line.id === data.id) {
          line.name = (data.name || line.name).replace(/^\s+|\s+$/g, "") || line.name;
          line.amounts[state.worthYear] = clampMoney(Number(data.amount) || 0);
          if (line.kind === "liability") {
            line.loanBalance = line.amounts[state.worthYear];
            if (Object.prototype.hasOwnProperty.call(data, "loanApr")) line.loanApr = Number(data.loanApr) || 0;
            if (Object.prototype.hasOwnProperty.call(data, "loanMinPayment")) line.loanMinPayment = clampMoney(Number(data.loanMinPayment) || 0);
            if (Object.prototype.hasOwnProperty.call(data, "loanOriginalBalance")) line.loanOriginalBalance = clampMoney(Number(data.loanOriginalBalance) || 0);
            if (Object.prototype.hasOwnProperty.call(data, "loanDebtType")) line.loanDebtType = data.loanDebtType || "";
            syncNwLiabilityToVault(line);
          }
          if (data.group && line.kind !== "liability" && line.group !== "debt" &&
              ["cash", "retirement", "taxable", "realEstate", "lifestyle"].indexOf(data.group) >= 0 &&
              !(line.group === "investment" && data.group === "taxable")) {
            line.group = data.group;
          }
          if (!line.additions) line.additions = {};
          if (Object.prototype.hasOwnProperty.call(data, "additions")) {
            line.additions[state.worthYear] = Number(data.additions) || 0;
          }
          if (!line.employerMatch) line.employerMatch = {};
          if (!line.employerBase) line.employerBase = {};
          if (Object.prototype.hasOwnProperty.call(data, "match")) {
            line.employerMatch[state.worthYear] = Number(data.match) || 0;
          }
          if (Object.prototype.hasOwnProperty.call(data, "base")) {
            line.employerBase[state.worthYear] = Number(data.base) || 0;
          }
          if (Object.prototype.hasOwnProperty.call(data, "loanBalance")) {
            line.loanBalance = Number(data.loanBalance) || 0;
            line.loanApr = Number(data.loanApr) || 0;
            line.loanMinPayment = Number(data.loanMinPayment) || 0;
            if (Object.prototype.hasOwnProperty.call(data, "loanOriginalBalance")) {
              line.loanOriginalBalance = Number(data.loanOriginalBalance) || 0;
            }
            if (Object.prototype.hasOwnProperty.call(data, "loanDebtType")) {
              line.loanDebtType = data.loanDebtType || "";
            }
            syncNwLiabilityToVault(line);
          }
        }
      });
    }
    if (act === "save-annual-year") {
      var annualYearKey = String(Number(data.year));
      ensureAnnualStatement();
      var priorAnnual = annualRow(state.annualStatement.years[annualYearKey]);
      var annualNext = {};
      /* v37.5.59.5 (QA 37.5.59.4): only what the tester actually edited becomes typed. An untouched
       * estimate (Taxes total or a tax sub-line from the pay stubs) stays live — never frozen by Save. */
      var userEdited = function (el) { return !!(el && el.dataset && el.dataset.userEdited === "1"); };
      ANNUAL_FIELDS.forEach(function (fieldId) {
        var input = form.elements[fieldId];
        if (!input) { annualNext[fieldId] = null; return; }
        if (fieldId === "taxes" && input.getAttribute("data-tax-total") === "1" && !userEdited(input)) {
          annualNext[fieldId] = priorAnnual.taxes; // derived/estimated on screen — keep what was stored
          return;
        }
        annualNext[fieldId] = readOptionalCents(input);
      });
      ANNUAL_TAX_PART_FIELDS.forEach(function (fieldId) {
        var partInput = form.elements[fieldId];
        if (!partInput) { annualNext[fieldId] = null; return; }
        /* Leave stub estimates unpersisted until the tester types over them. */
        if (partInput.getAttribute("data-tax-estimate") === "1" && !userEdited(partInput)) {
          annualNext[fieldId] = null;
          return;
        }
        annualNext[fieldId] = readOptionalCents(partInput);
      });
      if (annualHasTaxParts(annualNext)) {
        annualNext.taxes = null; // the sub-lines (typed + live estimates for blank ones) make Taxes
      }
      annualNext.federalBracket = priorAnnual.federalBracket;
      annualNext.stateBracket = priorAnnual.stateBracket;
      annualNext.stateOtherPct = priorAnnual.stateOtherPct;
      state.annualStatement.years[annualYearKey] = annualNext;
      if (form.elements.salaryTarget) {
        var tgtVal = readOptionalCents(form.elements.salaryTarget);
        var noteVals = {};
        NOTE_LINES.forEach(function (l) { var ni = form.elements["note_" + l.id]; if (ni) noteVals[l.id] = ni.value; });
        writeIncomeTarget(annualYearKey, tgtVal, noteVals);
        payStubBasisCache = {};
      }
    }
    ignoreClicksUntil = Date.now() + 100; // v37.5.59.12: swallow only the closing Save click
    closeModal();
    saveState();
    render();
    applyPendingFocusRestore();
    if (pendingClockAdvance) maybeAdvanceMonthFromClock();
  }

  function updateVaultField(el) {
    if (!el || !el.getAttribute) return;
    var id = el.getAttribute("data-id") || "";
    if (!id) return;
    var docs = (state.profile && state.profile.documents) || [];
    var doc = gm().findVaultDocForWrite ? gm().findVaultDocForWrite(docs, id) : findProfileDoc(id);
    if (!doc) return;
    var field = el.getAttribute("data-field") || "";
    var rebuild = false;
    if (doc._vaultDraft && field && field !== "title" && field !== "vaultType") doc._vaultDraft = false;
    if (field === "addToNetWorth") {
      doc.addToNetWorth = !!el.checked;
      if (doc.addToNetWorth) syncVaultLoanToNetWorth(doc);
      else unlinkVaultFromNetWorth(doc);
      rebuild = true;
    } else if (field === "vaultType") {
      doc.vaultType = gm().normalizeVaultType ? gm().normalizeVaultType(el.value) : el.value;
      doc.vaultTypeCustomized = true;
      applyVaultTypeToSlot(doc);
      if (!doc.titleCustomized) applyVaultTitle(doc, { force: true });
      rebuild = true;
    } else if (field === "title") {
      doc.title = el.value || "";
      doc.titleCustomized = true;
      markVaultFieldTouched(doc, field);
    } else if (field === "provider") {
      doc.provider = el.value || "";
      markVaultFieldTouched(doc, field);
      if (!doc.titleCustomized) {
        applyVaultTitle(doc, { force: true });
        paintVaultTitleInputs(id, doc.title);
      }
    } else if (field === "premium" || field === "payment" || field === "balance" || field === "minPayment" ||
        field === "originalBalance") {
      if (el.dataset && el.dataset.digits != null) {
        doc[field] = moneyFromDigits(el.dataset.digits, false);
      } else {
        doc[field] = centsFromDigits(el.value);
      }
      markVaultFieldTouched(doc, field);
    } else if (field === "rate") {
      doc.rate = Number(String(el.value || "").replace(/[^0-9.]/g, "")) || 0;
      markVaultFieldTouched(doc, field);
    } else if (field === "limitPerPerson" || field === "limitPerAccident" || field === "limitProperty") {
      var parsedLimits = gm().parseLiabilityLimits ? gm().parseLiabilityLimits(doc.limits || "") : {
        perPerson: 0, perAccident: 0, property: 0
      };
      var limitDollars = 0;
      if (el.dataset && el.dataset.digits != null) limitDollars = moneyFromDigits(el.dataset.digits, false);
      else limitDollars = centsFromDigits(el.value);
      if (field === "limitPerPerson") parsedLimits.perPerson = limitDollars;
      if (field === "limitPerAccident") parsedLimits.perAccident = limitDollars;
      if (field === "limitProperty") parsedLimits.property = limitDollars;
      doc.limits = gm().formatLiabilityLimits
        ? gm().formatLiabilityLimits(parsedLimits, doc.limits)
        : (doc.limits || "");
      markVaultFieldTouched(doc, "limits");
    } else if (field === "premiumFrequency" || field === "escrow" || field === "policyNumber" ||
        field === "insuredItems" || field === "deductibles" || field === "limits" ||
        field === "termRenewal" || field === "notes" || field === "term" || field === "property" ||
        field === "collateral") {
      doc[field] = el.value || "";
      markVaultFieldTouched(doc, field);
    }
    if (field === "premium" || field === "premiumFrequency") paintVaultMonthly(doc);
    if (shouldAddVaultToNetWorth(doc) &&
        (field === "balance" || field === "rate" || field === "payment" || field === "minPayment" ||
          field === "originalBalance" || field === "title" || field === "vaultType")) {
      syncVaultLoanToNetWorth(doc);
    }
    saveState();
    paintVaultReview(doc);
    if (rebuild) renderVaultPreserve();
  }

  function handleChange(event) {
    var el = event.target;
    if (el.getAttribute("data-act") === "worth-year") {
      state.worthYear = Number(el.value);
      saveState();
      render();
    } else if (el.getAttribute("data-act") === "income-year") {
      state.incomeYear = Number(el.value);
      saveState();
      render();
    } else if (el.getAttribute("data-act") === "notes") {
      state.worth.notes[state.worthYear] = el.value;
      saveState();
    } else if (el.getAttribute("data-act") === "comp-field") {
      updateCompensationFromElement(el);
    } else if (el.getAttribute("data-act") === "paystub-field") {
      updatePayStubField(el);
    } else if (el.getAttribute("data-act") === "comp-deduct") {
      updateDeductionFromElement(el);
    } else if (el.getAttribute("data-act") === "worth-income" || el.getAttribute("data-act") === "year-income") {
      if (!state.worth.income) state.worth.income = {};
      var year = Number(el.getAttribute("data-year") || state.worthYear);
      state.worth.income[year] = el.getAttribute("data-dollars")
        ? dollarsFromDigits(el.value)
        : centsFromDigits(el.value);
      saveState();
    } else if (el.getAttribute("data-act") === "ritual-paycheck") {
      var dest = state.months[ritual.destKey];
      if (dest) {
        dest.incomes.forEach(function (item) {
          if (item.id === el.getAttribute("data-id")) item.amount = centsFromDigits(el.value);
        });
        saveState();
      }
    } else if (el.getAttribute("data-act") === "spend-search") {
      // v37.5.59.12 (QA M10): debounce typing; clear search re-renders immediately.
      var pendingSearch = el.value;
      if (searchTimer) clearTimeout(searchTimer);
      spendShowLimit = TX_PAGE;
      if (!pendingSearch) {
        spendSearch = "";
        pendingScreenUi = captureScreenUi();
        render();
        return;
      }
      searchTimer = setTimeout(function () {
        searchTimer = null;
        spendSearch = pendingSearch;
        pendingScreenUi = captureScreenUi();
        render();
      }, 100);
      return;
    } else if (el.getAttribute("data-act") === "spend-payee") {
      if (spendDraft && event.type === "change") {
        readSpendDraft(el.form);
        var payeeMonth = ensureMonth(state.year, state.month);
        if (spendDraft.type !== "income") {
          var beforeLine = spendDraft.legs && spendDraft.legs[0] ? spendDraft.legs[0].lineId : "";
          applyMerchantEnvelope(payeeMonth, el.value);
          var afterLine = spendDraft.legs && spendDraft.legs[0] ? spendDraft.legs[0].lineId : "";
          if (beforeLine !== afterLine) renderSpendSheet(payeeMonth);
        }
      }
    } else if (el.getAttribute("data-act") === "spend-refund") {
      if (spendDraft && event.type === "change") {
        readSpendDraft(el.form);
        spendDraft.error = "";
        if (spendDraft.refundKind === "partial") {
          spendDraft.legs.forEach(function (leg) { if (!(Number(leg.refund) > 0)) leg.refund = 0; });
        }
        renderSpendSheet(ensureMonth(state.year, state.month));
      }
    } else if (el.getAttribute("data-act") === "spend-leg") {
      if (spendDraft) {
        spendDraft.categoryTouched = true;
        spendDraft.mappedFromHistory = false;
        state.merchantHint = null;
        readSpendDraft(el.form);
        // v37.5.59.5 (QA): picking an envelope clears the stale "Pick an envelope." message.
        if (/pick an envelope/i.test(spendDraft.error || "") &&
          (spendDraft.legs || []).some(function (leg) { return leg.lineId; })) spendDraft.error = "";
        saveState();
        renderSpendSheet(ensureMonth(state.year, state.month));
      }
    } else if (el.getAttribute("data-act") === "share-amounts") {
      shareShowAmounts = !!el.checked;
      renderShareCard();
    } else if (el.getAttribute("data-act") === "toggle-night") {
      state.nightLedger = el.checked;
      saveState();
      applyNight();
    } else if (el.getAttribute("data-act") === "insight-extra") {
      state.insightExtra = dollarsFromDigits(el.value) || 100;
      saveState();
    } else if (el.getAttribute("data-act") === "foo-percent") {
      state.foo = migrateFoo(state.foo);
      state.foo[el.getAttribute("data-field")] = el.value;
      saveState();
      if (event.type === "change") render();
    } else if (el.getAttribute("data-act") === "foo-birthday") {
      syncBirthday(el.value || "");
      saveState();
      if (event.type === "change") render();
    } else if (el.getAttribute("data-act") === "tester-code") {
      var codeHint = document.getElementById("tester-code-hint");
      var typed = String(el.value || "").trim();
      var code = normalizeTesterCode(typed);
      if (code) {
        testerShare().code = code;
        saveState();
        if (event.type === "change") el.value = code;
        if (codeHint) codeHint.textContent = "Sent with every share, along with the app version and date.";
      } else if (!typed) {
        testerShare().code = "";
        saveState();
        if (codeHint) codeHint.textContent = "Format PT-001. Type the code you were given, or assign one.";
      } else if (codeHint) {
        codeHint.textContent = "Use the format PT-001 (PT, a dash, three digits). Not saved yet.";
      }
    } else if (el.getAttribute("data-act") === "profile-name") {
      state.profile = migrateProfile(state.profile, state.foo, state.compensation);
      state.profile.name = el.value || "";
      saveState();
    } else if (el.getAttribute("data-act") === "profile-phone") {
      state.profile = migrateProfile(state.profile, state.foo, state.compensation);
      state.profile.phone = el.value || "";
      saveState();
    } else if (el.getAttribute("data-act") === "profile-birthday") {
      syncBirthday(el.value || "");
      saveState();
    } else if (el.getAttribute("data-act") === "profile-zip") {
      state.compensation = migrateCompensation(state.compensation || defaultCompensation());
      state.compensation.zipCode = String(el.value || "");
      saveState();
      paintProfileZipHelper();
    } else if (el.getAttribute("data-act") === "profile-filing") {
      state.profile = migrateProfile(state.profile, state.foo, state.compensation);
      state.compensation = migrateCompensation(state.compensation || defaultCompensation());
      state.profile.filingStatus = el.value === "married" ? "married" : "single";
      state.compensation.filingStatus = state.profile.filingStatus;
      saveState();
    } else if (el.getAttribute("data-act") === "annual-filing") {
      ensureAnnualStatement();
      var filingVal = el.value;
      state.annualStatement.filingStatus = (filingVal === "mfj" || filingVal === "hoh") ? filingVal : "single";
      saveState();
      render();
    } else if (el.getAttribute("data-act") === "annual-bonus-month") {
      state.compensation = migrateCompensation(state.compensation || defaultCompensation());
      var bmv = Number(el.value);
      state.compensation.bonusMonth = bmv >= 1 && bmv <= 12 ? bmv : null;
      saveState();
      render();
    } else if (el.getAttribute("data-act") === "annual-hsa-coverage") {
      state.compensation = migrateCompensation(state.compensation || defaultCompensation());
      state.compensation.hsaCoverage = el.value === "family" ? "family" : "self";
      saveState();
      render();
    } else if (el.getAttribute("data-act") === "annual-bracket") {
      ensureAnnualStatement();
      var bracketYear = String(Number(el.getAttribute("data-year")));
      var field = el.getAttribute("data-field") || "";
      if (!state.annualStatement.years[bracketYear]) ensureAnnualYearFromPrior(state.annualStatement, Number(bracketYear));
      var bracketRow = annualCloneYearRow(state.annualStatement.years[bracketYear]);
      if (field === "federalBracket") {
        bracketRow.federalBracket = annualBracketRate(el.value);
      } else if (field === "stateBracket") {
        bracketRow.stateBracket = annualStateBracketValue(el.value);
        if (bracketRow.stateBracket !== "other") bracketRow.stateOtherPct = null;
      }
      state.annualStatement.years[bracketYear] = bracketRow;
      saveState();
      render();
    } else if (el.getAttribute("data-act") === "annual-state-other") {
      ensureAnnualStatement();
      var otherYear = String(Number(el.getAttribute("data-year")));
      if (!state.annualStatement.years[otherYear]) ensureAnnualYearFromPrior(state.annualStatement, Number(otherYear));
      var otherRow = annualCloneYearRow(state.annualStatement.years[otherYear]);
      var rawPct = String(el.value || "").replace(/[^0-9.]/g, "");
      if (!rawPct) otherRow.stateOtherPct = null;
      else {
        var pctNum = parseFloat(rawPct);
        otherRow.stateOtherPct = isFinite(pctNum) ? pctNum / 100 : null;
      }
      otherRow.stateBracket = "other";
      state.annualStatement.years[otherYear] = otherRow;
      saveState();
      if (event.type !== "input") render();
    } else if (el.getAttribute("data-act") === "profile-pay-frequency") {
      applyPayFrequency(el.value);
      saveState();
    } else if (el.getAttribute("data-act") === "matters-text") {
      state.matters = migrateMatters(state.matters);
      var mattersField = el.getAttribute("data-field") || "";
      if (mattersField === "budgetMethodOther" || mattersField === "budgetAppName") {
        state.matters[mattersField] = el.value || "";
        saveState();
      }
    } else if (el.getAttribute("data-act") === "profile-dependents") {
      state.profile = migrateProfile(state.profile, state.foo, state.compensation);
      var deps = parseInt(el.value, 10);
      state.profile.dependents = deps >= 0 && isFinite(deps) ? deps : 0;
      saveState();
    } else if (el.getAttribute("data-act") === "profile-doc" || el.getAttribute("data-act") === "profile-doc-file") {
      var file = el.files && el.files[0];
      if (file) addProfileDocument(file);
      el.value = "";
    } else if (el.getAttribute("data-act") === "restore-file-input") {
      var restoreFile = el.files && el.files[0];
      if (restoreFile) readRestoreFile(restoreFile);
      el.value = "";
    } else if (el.getAttribute("data-act") === "vault-doc-file") {
      var vaultFile = el.files && el.files[0];
      if (vaultFile) {
        addProfileDocument(vaultFile, {
          fromVault: true,
          replaceId: state.statsDoor === "vault" && state.vaultDocId ? state.vaultDocId : ""
        });
      }
      el.value = "";
    } else if (el.getAttribute("data-act") === "vault-field") {
      updateVaultField(el);
    } else if (el.getAttribute("data-act") === "foo-money") {
      state.foo = migrateFoo(state.foo);
      state.foo[el.getAttribute("data-field")] = el.getAttribute("data-dollars") === "1"
        ? dollarsFromDigits(el.value)
        : centsFromDigits(el.value);
      saveState();
      if (event.type === "change" && el.getAttribute("data-field") === "emergencyAmount" && state.insightsDoor === "foo") {
        render();
      }
    } else if (el.getAttribute("data-act") === "payoff-extra") {
      state.payoffExtra = dollarsFromDigits(el.value) || 100;
      saveState();
      paintPayoffCard();
    } else if (el.getAttribute("data-act") === "loan-extra") {
      state.foo = migrateFoo(state.foo);
      state.foo.loanExtras[el.getAttribute("data-loan") || ""] = dollarsFromDigits(el.value) || 100;
      saveState();
    } else if (el.getAttribute("data-act") === "sync-toggle") {
      var syncCfg = incomeSyncCfg();
      var syncLine = el.getAttribute("data-line");
      if (syncLine === "all") syncCfg.off = !!el.checked;
      else syncCfg.lines[syncLine] = !!el.checked;
      state.incomeSync = syncCfg;
      payStubBasisCache = {};
      saveState();
      openIncomeStatement({ preserveScroll: true });
    } else if (el.getAttribute("data-act") === "employer-mode") {
      var employerPlan = migrateCompensation(state.compensation || defaultCompensation());
      var eFlag = el.getAttribute("data-flag");
      var eValue = el.getAttribute("data-value");
      var toPercent = !el.checked;
      var eEst = estimateCompensation(employerPlan);
      var curDollars = eValue === "employer401kBase" ? eEst.employerBase : eEst.employerMatch;
      var altKey = eValue + (toPercent ? "AltPercent" : "AltDollars");
      var oldKey = eValue + (toPercent ? "AltDollars" : "AltPercent");
      employerPlan[oldKey] = Number(employerPlan[eValue]) || 0; /* remember the value we are leaving */
      if (toPercent) {
        employerPlan[eValue] = eEst.cashPay > 0 ? Math.round((Number(curDollars) || 0) / eEst.cashPay * 10000) / 100
          : (Number(employerPlan[altKey]) || 0);
      } else {
        employerPlan[eValue] = eEst.cashPay > 0 ? Math.round((Number(curDollars) || 0) * 100) / 100
          : (Number(employerPlan[altKey]) || 0);
      }
      employerPlan[eFlag] = toPercent;
      state.compensation = employerPlan;
      saveState();
      openIncomeStatement({ preserveScroll: true });
    } else if (el.getAttribute("data-act") === "matters-scale") {
      state.matters = migrateMatters(state.matters);
      state.matters[el.getAttribute("data-field")] = Number(el.value) || 0;
      saveState();
      var ends = el.parentNode && el.parentNode.querySelector(".scale-ends span:nth-child(2)");
      if (ends) ends.textContent = String(state.matters[el.getAttribute("data-field")]);
    }
  }

  // v37.5.59.12: any sheet shown without armSheetA11y (e.g. grade bar) still gets dialog role, focus and focus return.
  (function () {
    var modalEl = document.getElementById("modal");
    if (!modalEl || typeof MutationObserver === "undefined") return;
    new MutationObserver(function () {
      if (!modalEl.hidden && modalEl.innerHTML && !modalEl.hasAttribute("role")) armSheetA11y(modalEl);
    }).observe(modalEl, { attributes: true, attributeFilter: ["hidden"], childList: true });
  })();
  document.addEventListener("keydown", trapSheetTab);
  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape" && event.key !== "Esc") return;
    var modal = document.getElementById("modal");
    if (modal && !modal.hidden) {
      event.preventDefault();
      var backToProfile = mattersReturnToProfile;
      mattersReturnToProfile = false;
      pendingScreenUi = captureScreenUi();
      closeModal();
      if (backToProfile) openProfile();
      else render();
      return;
    }
    // v37.5.59.12 (QA L5): Vault full-screen card — Escape goes Back.
    if (annualInfoTip) {
      event.preventDefault();
      var tipKeyEsc = annualInfoTip.key;
      annualInfoTip = null;
      render();
      var tipBtn = document.querySelector('[data-act="annual-info"][data-key="' + tipKeyEsc + '"]');
      if (tipBtn) { try { tipBtn.focus(); } catch (err) {} }
      return;
    }
    if (state.tab === "stats" && state.statsDoor === "vault" && state.vaultDocId) {
      event.preventDefault();
      pendingFocusRestore = { act: "vault-open", id: state.vaultDocId, tab: "", name: "" };
      discardEmptyVaultDraft(state.vaultDocId);
      state.vaultDocId = "";
      vaultPickMode = false;
      saveState();
      render();
      if (pendingClockAdvance) maybeAdvanceMonthFromClock();
    }
  });
  document.addEventListener("click", handleClick);
  document.addEventListener("submit", handleSubmit);
  document.addEventListener("change", handleChange);
  document.addEventListener("input", function (event) {
    var act = event.target.getAttribute("data-act");
    if (act === "spend-payee") { filterMerchantChips(event.target.value); return; }
    if (act === "notes" || act === "spend-search" || act === "comp-field" || act === "comp-deduct" ||
        act === "insight-extra" || act === "foo-percent" || act === "foo-money" || act === "loan-extra" ||
        act === "payoff-extra" ||
        act === "foo-birthday" || act === "profile-name" || act === "profile-phone" || act === "profile-birthday" ||
        act === "profile-zip" || act === "profile-filing" || act === "profile-pay-frequency" ||
        act === "annual-filing" || act === "annual-hsa-coverage" || act === "annual-bonus-month" || act === "annual-bracket" || act === "annual-state-other" ||
        act === "profile-dependents" || act === "vault-field" || act === "paystub-field" ||
        act === "matters-text" || act === "matters-scale" || act === "tester-code") handleChange(event);
  });

  window.PaperTrailPreview = {
    importSpendStub: importSpendStub,
    // Test hooks for headless VERIFY (no network): same builders the Data buttons use.
    workbookSheets: workbookSheets,
    buildPrintReport: buildPrintReport,
    clearPrintReport: clearPrintReport,
    buildBackup: buildBackup,
    buildTesterPayload: buildTesterPayload,
    sendTesterPayload: sendTesterPayload,
    readTesterQueue: readTesterQueue
  };

  state = loadState();
  try {
    if (migrateFrozenStubTaxes()) saveState();
  } catch (e) { /* never block startup on a repair */ }
  // v37.5.59.12 (QA M1): open on the device clock's current month (create from prior plan if needed).
  if (syncViewedMonthToClock()) {
    try { saveState(); } catch (e) {}
  } else {
    ensureMonthsThroughClock(currentYearMonth());
    ensureMonth(state.year, state.month);
  }
  checkStorageHealthOnLoad();
  try {
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "visible") maybeAdvanceMonthFromClock();
    });
    window.addEventListener("focus", function () { maybeAdvanceMonthFromClock(); });
    scheduleMidnightAdvance();
  } catch (err) {}
  if (incomeYearList().indexOf(Number(state.incomeYear)) < 0) {
    state.incomeYear = defaultIncomeYear();
  }
  migrateProfileDocBlobs();
  if (window.GradeMath && window.GradeMath.runFixtureTests) {
    var gradeErrors = window.GradeMath.runFixtureTests();
    if (gradeErrors.length) console.error("Grade fixtures failed", gradeErrors);
  }
  render();
  startTesterSchedule();
})();
