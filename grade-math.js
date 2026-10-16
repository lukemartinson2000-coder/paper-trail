/* Paper Trail Grade engine. Cache bust v37.5.33. Fixtures A/B/C live here. */
(function (root) {
  "use strict";

  var FOO_NAMES = {
    1: "Deductibles covered",
    2: "Employer match",
    3: "High-interest debt",
    4: "Emergency reserves",
    5: "Roth IRA + HSA",
    6: "Max retirement",
    7: "Hyper-accumulation (25% of gross)",
    8: "Prepaid future expenses",
    9: "Low-interest debt pre-pay"
  };
  var FOO_DEFS = {
    1: "Cash set aside to cover insurance deductibles.",
    2: "Capture every dollar of employer match.",
    3: "Pay down high-interest consumer debt.",
    4: "Build 3–6 months of essential expenses in cash.",
    5: "Fund Roth IRA and HSA.",
    6: "Max workplace retirement accounts.",
    7: "Aim for 25% of gross across Roth, HSA, match, and deferral.",
    8: "Prepay known future expenses.",
    9: "Extra to low-interest debt only after the rest."
  };
  var FOO_EXPLAINERS = {
    1: {
      what: "A cash cushion equal to your insurance deductibles, sitting before the rest of the order of operations.",
      why: "A claim should be an inconvenience, not a credit-card event. Cover the deductible so one ER visit or fender-bender doesn’t become 22% debt.",
      examples: [
        "Auto collision deductible parked in savings",
        "Health-plan deductible for the year",
        "Renters or homeowners deductible",
        "A known pet-insurance deductible"
      ]
    },
    2: {
      what: "Contribute enough to the workplace plan to collect every matching dollar.",
      why: "That’s an instant 50–100% return you will not find in a brokerage. Skip it and you are leaving free money on the table.",
      examples: [
        "Defer 6% to collect a 3% match",
        "Hit the full 4% if that’s what the plan matches",
        "Use a true-up if the plan offers one later in the year",
        "Confirm the match % from the plan — never guess"
      ]
    },
    3: {
      what: "Knock out expensive consumer debt before you invest extra. Credit cards and high-APR loans live here.",
      why: "A 22% card rate beats almost any market return. The order of operations parks extra dollars here until that fire is out.",
      examples: [
        "Credit cards — even 0% teasers that will reprice",
        "A student loan above your age band (6% in your 20s, 5% in your 30s, 4% in your 40s; any student loan at 50+)",
        "A car note that misses the 20/3/8 vibe or is high-APR for your age",
        "A 12% personal loan"
      ]
    },
    4: {
      what: "3–6 months of essential expenses in cash — not the market, not the house fund.",
      why: "Job loss or a broken transmission shouldn’t force a high-interest card. This is the shock absorber after deductibles.",
      examples: [
        "3 months if two incomes and stable work",
        "6 months if one income or uneven pay",
        "Checking + savings that can cover rent, food, insurance, and minimums",
        "Keep it liquid; this is not a brokerage"
      ]
    },
    5: {
      what: "The tax-free slot: Roth IRA and HSA after the match and expensive debt.",
      why: "Roth grows tax-free. An HSA can be triple tax-advantaged if you can pay medical from cash. This is where extra dollars go once Steps 1–4 are steady.",
      examples: [
        "This year’s Roth IRA contribution",
        "Family HSA funded up to the IRS limit",
        "Splitting room between Roth and HSA",
        "Leaving a little Roth room if income is near the phase-out — estimate only"
      ]
    },
    6: {
      what: "Max the workplace retirement plan after Roth and HSA.",
      why: "More tax-advantaged room before taxable brokerage. If you’re already at 25% of gross, this step is complete — no nag to max the plan.",
      examples: [
        "Max the 401(k) for the year",
        "A 403(b) or 457 at work",
        "A solo 401(k) if you have self-employment income",
        "Skip the nag when Roth + HSA + match + deferral already hit 25%"
      ]
    },
    7: {
      what: "Aim for 25% of gross across Roth, HSA, match, and deferral — the hyper-accumulation pace.",
      why: "That’s the path that tends to replace working income later. Count every tax-advantaged dollar toward the 25%.",
      examples: [
        "401(k) + Roth + HSA totaling 25% of gross",
        "A 25% number you typed on Full order of operations",
        "Match + deferral covering a big slice, Roth filling the rest",
        "If you’re already at 25%, you’re on this step"
      ]
    },
    8: {
      what: "Save ahead for known, irregular costs so they never become debt or raid the emergency fund.",
      why: "A predictable bill isn’t an emergency if you pre-fund it. Sinking funds keep Step 4 honest.",
      examples: [
        "Sinking fund for an insurance deductible",
        "Car replacement",
        "Christmas and travel",
        "House Fund and known tuition"
      ]
    },
    9: {
      what: "Extra to cheap debt only after the rest of the order of operations — mortgage and low-APR student or auto loans.",
      why: "A 3% mortgage can wait while tax-free accounts compound. Extra principal here is optional, not the fire.",
      examples: [
        "Extra mortgage principal on Home loan",
        "A student loan under your age-band rate",
        "A cheap auto loan that already fits 20/3/8",
        "A 0% furniture note after Steps 1–8"
      ]
    }
  };
  var DEBT_TYPES = ["creditCard", "student", "auto", "personal", "mortgage", "other"];
  var SAVINGS_LINES = {
    "emergency fund": 1,
    house: 1,
    "401k": 1,
    "roth ira": 1,
    savings: 1,
    travel: 1,
    "checking leftovers": 1
  };
  var ESSENTIALS = { housing: 1, food: 1, transportation: 1, insurance: 1, health: 1 };

  function interpolate(x, points) {
    var pts = points.slice().sort(function (a, b) { return a[0] - b[0]; });
    if (!pts.length) return 0;
    if (x <= pts[0][0]) return pts[0][1];
    if (x >= pts[pts.length - 1][0]) return pts[pts.length - 1][1];
    for (var i = 0; i < pts.length - 1; i++) {
      var a = pts[i];
      var b = pts[i + 1];
      if (x <= b[0]) {
        if (b[0] === a[0]) return b[1];
        var t = (x - a[0]) / (b[0] - a[0]);
        return a[1] + t * (b[1] - a[1]);
      }
    }
    return pts[pts.length - 1][1];
  }

  function parseISODate(iso) {
    if (!iso) return null;
    var m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return null;
    return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  }

  function isoDate(date) {
    var y = date.getUTCFullYear();
    var mo = date.getUTCMonth() + 1;
    var d = date.getUTCDate();
    return y + "-" + (mo < 10 ? "0" : "") + mo + "-" + (d < 10 ? "0" : "") + d;
  }

  function ageYears(birthdayISO, asOf) {
    var birthday = parseISODate(birthdayISO);
    if (!birthday) return null;
    var asOfDate = asOf || new Date();
    var years = asOfDate.getUTCFullYear() - birthday.getUTCFullYear();
    var md = asOfDate.getUTCMonth() - birthday.getUTCMonth();
    if (md < 0 || (md === 0 && asOfDate.getUTCDate() < birthday.getUTCDate())) years -= 1;
    if (years < 0 || years >= 130) return null;
    return years;
  }

  function ageTargetMultiple(age) {
    return interpolate(age, [[25, 0.5], [30, 1], [40, 3], [50, 6], [60, 8], [67, 10]]);
  }

  function isSavingsLine(envelope, name) {
    if (String(envelope || "").replace(/^\s+|\s+$/g, "").toLowerCase() === "savings") return true;
    return !!SAVINGS_LINES[String(name || "").replace(/^\s+|\s+$/g, "").toLowerCase()];
  }

  function isMortgageName(name) {
    var lowered = String(name || "").toLowerCase();
    if (lowered.indexOf("home loan") >= 0) return true;
    if (lowered.indexOf("mortgage") >= 0) return true;
    if (lowered.indexOf("home loan") >= 0) return true;
    if (lowered.indexOf("house loan") >= 0) return true;
    if (lowered.indexOf("housing") >= 0 && (lowered.indexOf("loan") >= 0 || lowered.indexOf("liability") >= 0)) return true;
    return false;
  }

  function debtTypeFromName(name) {
    var lowered = String(name || "").toLowerCase();
    if (isMortgageName(name)) return "mortgage";
    if (/\bstudent\b|stafford|perkins|plus loan/.test(lowered)) return "student";
    if (/\b(visa|mastercard|amex|discover|credit card|\bcard\b|wings|revolving|charge card)\b/.test(lowered) ||
        lowered.indexOf("credit card") >= 0 || lowered.indexOf("wings") >= 0) {
      return "creditCard";
    }
    if (/\b(car|auto|vehicle|truck)\b/.test(lowered) || lowered.indexOf("car loan") >= 0) return "auto";
    if (lowered.indexOf("personal") >= 0) return "personal";
    return "other";
  }

  function normalizeDebtType(raw, name) {
    var key = String(raw || "").toLowerCase().replace(/[_\s-]/g, "");
    var map = {
      creditcard: "creditCard",
      card: "creditCard",
      revolving: "creditCard",
      student: "student",
      studentloan: "student",
      auto: "auto",
      car: "auto",
      autoloan: "auto",
      personal: "personal",
      mortgage: "mortgage",
      meinhaus: "mortgage",
      other: "other"
    };
    if (map[key]) return map[key];
    return debtTypeFromName(name);
  }

  function debtTypeLabel(type) {
    return {
      creditCard: "Credit card",
      student: "Student",
      auto: "Auto",
      personal: "Personal",
      mortgage: "Mortgage",
      other: "Other"
    }[type] || "Other";
  }

  function studentAprCutoff(age) {
    if (age == null) return null;
    if (age >= 50) return 0;
    if (age >= 40) return 4;
    if (age >= 30) return 5;
    return 6;
  }

  function autoAprCutoff(age) {
    if (age == null) return null;
    if (age >= 50) return 0;
    if (age >= 40) return 8;
    if (age >= 30) return 9;
    return 10;
  }

  function classifyDebt(debt, ageYears) {
    var name = (debt && debt.name) || "";
    var apr = Number(debt && debt.apr) || 0;
    var type = normalizeDebtType(debt && debt.debtType, name);
    var result = {
      name: name,
      type: type,
      apr: apr,
      fooStep: 9,
      needsBirthday: false,
      isEstimate: false,
      badge: "",
      caption: ""
    };
    function markStep3(badge, estimate) {
      result.fooStep = 3;
      result.isEstimate = !!estimate;
      result.badge = badge;
      result.caption = badge;
      return result;
    }
    if (type === "mortgage") {
      result.caption = "Mortgage / Home loan → Step 9 (never consumer Step 3)";
      return result;
    }
    if (type === "creditCard") {
      var cardBadge = /wings/i.test(name) || /card/i.test(name)
        ? (name || "Card") + " / card → Step 3"
        : (name || "Card") + " → Step 3";
      return markStep3(cardBadge, false);
    }
    if (type === "student") {
      if (ageYears == null) {
        if (apr > 6) return markStep3((name || "Student loan") + " " + apr.toFixed(1) + "% → Step 3", false);
        result.needsBirthday = true;
        result.fooStep = null;
        result.caption = "Add birthday in Profile";
        return result;
      }
      var studentCut = studentAprCutoff(ageYears);
      if (studentCut === 0 || apr > studentCut) {
        return markStep3((name || "Student loan") + " " + apr.toFixed(1) + "% → Step 3 at your age", false);
      }
      result.caption = (name || "Student loan") + " " + apr.toFixed(1) + "% → Step 9 at your age";
      return result;
    }
    if (type === "auto") {
      result.isEstimate = true;
      if (ageYears == null) {
        if (apr > 10) {
          return markStep3((name || "Car") + " " + apr.toFixed(1) + "% → Step 3 (estimate)", true);
        }
        result.needsBirthday = true;
        result.fooStep = null;
        result.caption = "Add birthday in Profile";
        return result;
      }
      var autoCut = autoAprCutoff(ageYears);
      if (autoCut === 0 || apr > autoCut) {
        return markStep3((name || "Car") + " " + apr.toFixed(1) + "% → Step 3 at your age (estimate)", true);
      }
      result.caption = (name || "Car") + " → Step 9 (20/3/8 estimate)";
      return result;
    }
    if (type === "personal") {
      if (ageYears == null) {
        if (apr > 6) return markStep3((name || "Personal") + " " + apr.toFixed(1) + "% → Step 3", true);
        result.needsBirthday = true;
        result.fooStep = null;
        result.caption = "Add birthday in Profile";
        return result;
      }
      var personalCut = studentAprCutoff(ageYears);
      if (personalCut === 0 || apr > personalCut) {
        return markStep3((name || "Personal") + " " + apr.toFixed(1) + "% → Step 3 at your age", true);
      }
      result.caption = (name || "Personal") + " → Step 9 at your age";
      return result;
    }
    if (apr > 0) {
      if (ageYears == null) {
        if (apr > 6) return markStep3((name || "Loan") + " " + apr.toFixed(1) + "% → Step 3 (estimate)", true);
        result.needsBirthday = true;
        result.fooStep = null;
        result.caption = "Add birthday in Profile";
        return result;
      }
      var otherCut = studentAprCutoff(ageYears);
      if (otherCut === 0 || apr > otherCut) {
        return markStep3((name || "Loan") + " " + apr.toFixed(1) + "% → Step 3 (estimate)", true);
      }
    }
    result.caption = (name || "Loan") + " → Step 9";
    return result;
  }

  function classifyDebts(debts, ageYears) {
    var items = (debts || []).map(function (debt) {
      return classifyDebt(debt, ageYears);
    });
    var high = 0;
    var cheap = 0;
    var needsBirthday = false;
    items.forEach(function (item, i) {
      var balance = Math.max(0, Number((debts[i] && (debts[i].balance != null ? debts[i].balance : debts[i].amount)) || 0));
      if (item.needsBirthday) needsBirthday = true;
      if (!(balance > 0)) return;
      if (item.fooStep === 3) high += balance;
      else if (item.fooStep === 9) cheap += balance;
    });
    return {
      items: items,
      highInterestTotal: high,
      cheapTotal: cheap,
      needsBirthday: needsBirthday,
      hasHighInterest: high > 0,
      hasOnlyCheapDebt: high <= 0 && cheap > 0 && !needsBirthday
    };
  }

  function isConsumerDebtName(name) {
    return classifyDebt({ name: name, apr: 0 }, 30).fooStep === 3;
  }

  function fooExplainer(step) {
    var number = Number(step) || 0;
    var copy = FOO_EXPLAINERS[number];
    if (!copy) return null;
    return {
      number: number,
      name: FOO_NAMES[number],
      definition: FOO_DEFS[number],
      what: copy.what,
      why: copy.why,
      examples: copy.examples.slice(),
      affiliation: "In the spirit of Money Guy’s Financial Order of Operations. Estimates, not advice. Paper Trail isn’t affiliated."
    };
  }

  function enteredEmployerPercent(value, isPercent) {
    if (!isPercent) return null;
    var n = Number(value);
    if (!isFinite(n) || n <= 0) return null;
    return n;
  }

  function taxFreeRoom(input) {
    input = input || {};
    var year = Number(input.year) || new Date().getFullYear();
    var age = input.ageYears;
    var filing = input.filingStatus === "married" ? "married" : "single";
    var income = Number(input.annualIncome) || 0;
    var ytdRoth = Math.max(0, Number(input.ytdRoth) || 0);
    var ytdHsa = Math.max(0, Number(input.ytdHsa) || 0);
    var familyHsa = input.hsaCoverage === "family" || (input.hsaCoverage == null && filing === "married");
    var rothLimit = year >= 2026 ? 7500 : 7000;
    var rothCatchup = year >= 2026 ? 1100 : 1000;
    if (age != null && age >= 50) rothLimit += rothCatchup;
    var hsaLimit = familyHsa ? (year >= 2026 ? 8750 : 8550) : (year >= 2026 ? 4400 : 4300);
    if (age != null && age >= 55) hsaLimit += 1000;
    var phaseLow = filing === "married" ? 242000 : 153000;
    var phaseHigh = filing === "married" ? 252000 : 168000;
    if (year < 2026) {
      phaseLow = filing === "married" ? 236000 : 150000;
      phaseHigh = filing === "married" ? 246000 : 165000;
    }
    var rothEligible = "full";
    if (income > 0 && income >= phaseHigh) rothEligible = "none";
    else if (income > 0 && income >= phaseLow) rothEligible = "partial";
    var rothCap = rothEligible === "none" ? 0 : rothLimit;
    return {
      year: year,
      rothLimit: rothLimit,
      rothLeft: Math.max(0, rothCap - ytdRoth),
      hsaLimit: hsaLimit,
      hsaLeft: Math.max(0, hsaLimit - ytdHsa),
      rothEligible: rothEligible,
      needsBirthday: age == null,
      familyHsa: familyHsa
    };
  }

  function extraPrincipal(line) {
    var envelope = String(line.envelope || "").toLowerCase();
    var isDebt = envelope === "debt" || (Number(line.minPayment) || 0) > 0;
    var minPay = Number(line.minPayment) || 0;
    if (!isDebt || !(minPay > 0)) return 0;
    return Math.max(0, (Number(line.assigned) || 0) - minPay);
  }

  function monthlySpend(lines) {
    return (lines || []).reduce(function (sum, line) {
      if (isSavingsLine(line.envelope, line.name)) return sum;
      return sum + Math.max(0, (Number(line.assigned) || 0) - extraPrincipal(line));
    }, 0);
  }

  function monthlyEssentials(lines) {
    return (lines || []).reduce(function (sum, line) {
      var envelope = String(line.envelope || "").replace(/^\s+|\s+$/g, "").toLowerCase();
      if (ESSENTIALS[envelope]) return sum + Math.max(0, Number(line.assigned) || 0);
      if (envelope === "debt") {
        var minPay = Number(line.minPayment) || 0;
        return sum + (minPay > 0 ? minPay : Math.max(0, Number(line.assigned) || 0));
      }
      return sum;
    }, 0);
  }

  function spendScore(rate) {
    if (rate < 0) return 0;
    return interpolate(rate, [[0, 15], [0.05, 35], [0.1, 60], [0.15, 80], [0.2, 90], [0.3, 100]]);
  }

  function resilienceScore(months) {
    return Math.min(100, interpolate(months, [[0, 0], [1, 30], [3, 70], [6, 100]]));
  }

  function consumerDebtScore(ratio) {
    return interpolate(ratio, [[0, 100], [0.1, 80], [0.25, 50], [0.5, 0]]);
  }

  function debtToAssetsScore(ratio) {
    return interpolate(ratio, [[0, 100], [0.2, 100], [0.4, 70], [0.6, 40], [0.8, 0]]);
  }

  function accumulationScore(netWorth, age, income) {
    if (!(income > 0)) return null;
    var target = ageTargetMultiple(age) * income;
    if (!(target > 0)) return null;
    return Math.max(0, Math.min(100, (netWorth / target) * 100));
  }

  function consistencyFactor(completedYears, hasGap) {
    var raw;
    if (completedYears <= 0) return 0;
    if (completedYears === 1) raw = 0.4;
    else if (completedYears === 2) raw = 0.7;
    else if (completedYears === 3) raw = 0.9;
    else raw = 1;
    return hasGap ? raw * 0.85 : raw;
  }

  function consecutiveBonus(consecutive) {
    if (consecutive <= 1) return 0;
    if (consecutive === 2) return 3;
    if (consecutive === 3) return 6;
    return 8;
  }

  function trajectoryRaw(delta) {
    return interpolate(delta, [[0, 0], [0.05, 50], [0.15, 80], [0.25, 100]]);
  }

  function trajectoryScore(delta, completedYears, consecutive, hasGap) {
    if (!(completedYears >= 1) || delta == null) return null;
    return Math.min(100, trajectoryRaw(delta) * consistencyFactor(completedYears, hasGap) + consecutiveBonus(consecutive));
  }

  function weightedMean(parts) {
    var total = 0;
    var i;
    for (i = 0; i < parts.length; i++) total += parts[i].weight;
    if (!(total > 0)) return null;
    var sum = 0;
    for (i = 0; i < parts.length; i++) sum += parts[i].score * (parts[i].weight / total);
    return sum;
  }

  function leverageScore(consumer, da) {
    var parts = [];
    if (consumer != null) parts.push({ score: consumerDebtScore(consumer), weight: 0.6 });
    if (da != null) parts.push({ score: debtToAssetsScore(da), weight: 0.4 });
    return weightedMean(parts);
  }

  function bandFrom(score) {
    if (score >= 90) return { id: "excellent", title: "Excellent", range: "90–100" };
    if (score >= 75) return { id: "strong", title: "Strong", range: "75–89" };
    if (score >= 60) return { id: "onTrack", title: "On track", range: "60–74" };
    if (score >= 40) return { id: "fragile", title: "Fragile", range: "40–59" };
    return { id: "distressed", title: "Distressed", range: "0–39" };
  }

  function diagnosis(band, lowest, perfectScore, fooStep) {
    var lead = {
      excellent: "Excellent and compounding.",
      strong: "Strong and building.",
      onTrack: "On track and growing.",
      fragile: "Fragile, with room to steady.",
      distressed: "Under strain — small steps still count."
    }[band.id];
    if (perfectScore) {
      return lead + " Nothing is weak here. Keep going — look for ways to optimize.";
    }
    if (fooStep >= 1 && fooStep < 5) {
      var fooWeak = {
        1: "Cash set aside for deductibles is the next dollar.",
        2: "The employer match is the next dollar.",
        3: "High-interest debt is the next dollar.",
        4: "Emergency reserves are the next dollar."
      }[fooStep];
      return lead + " " + fooWeak;
    }
    var weak = {
      spend: "Spending is the weak point.",
      resilience: "Cash is the weak point.",
      leverage: "Debt load is the weak point.",
      accumulation: "Investing pace is the weak point.",
      trajectory: "Consistency is the weak point."
    }[lowest] || "Fill in a few more figures to sharpen this read.";
    return lead + " " + weak;
  }

  function landingQuestion(step, input) {
    if (step === 1) return { prompt: "Are your insurance deductibles covered?", field: "deductiblesCovered" };
    if (step === 2) return { prompt: "Are you capturing the full employer match?", field: "matchCaptured" };
    if (step === 3 && input && input.needsBirthdayForDebt && !input.hasHighInterestConsumerDebt) {
      return { prompt: "Add birthday in Profile so student and auto loans can be classified.", field: "needsBirthday" };
    }
    if (step === 8) return { prompt: "Are you prepaying upcoming expenses?", field: "prepayFuture" };
    if (step === 9) return { prompt: "Putting extra toward low-interest debt already?", field: "prepayLowInterest" };
    return null;
  }

  function fooSummary(input) {
    var hit25 = (input.retirementRateOfGross || 0) >= 0.25 || !!input.hyperOnTrack;
    var emergencyOK = input.emergencyFunded === true || (input.liquidMonths || 0) >= 3;
    var debtOK = input.hasHighInterestConsumerDebt
      ? false
      : (input.needsBirthdayForDebt ? null : true);
    var matchCaptured = input.matchCaptured;
    var matchOK = matchCaptured === true || hit25;
    var deductiblesOK = input.deductiblesCovered;
    var rothOK = input.rothOnTrack === true || hit25;
    var maxOK = hit25 || !!input.maxEmployerPlans;
    var done = {
      1: input.deductiblesHidden ? true : deductiblesOK, /* v37.5.59.13: step 1 stays out of the way until the user has entered budget data */
      2: matchOK ? true : matchCaptured,
      3: debtOK,
      4: emergencyOK,
      5: rothOK ? true : input.rothOnTrack,
      6: maxOK,
      7: hit25,
      8: !!input.prepayFuture,
      9: !!input.prepayLowInterest
    };
    var current = 10;
    var question = null;
    var step;
    for (step = 1; step <= 9; step++) {
      var state = done[step];
      if (state === true) continue;
      current = step;
      if (state == null) question = landingQuestion(step, input);
      break;
    }
    if (current === 10) current = 9;
    var steps = [];
    for (step = 1; step <= 9; step++) {
      steps.push({
        number: step,
        name: FOO_NAMES[step],
        definition: FOO_DEFS[step],
        status: step < current ? "done" : step === current ? "current" : "locked"
      });
    }
    return {
      steps: steps,
      currentStep: current,
      nextDollarLine: "Next dollar → " + FOO_NAMES[current],
      question: question,
      hit25Percent: hit25
    };
  }

  function clampNextAction(action, current) {
    if (!action || !(Number(current) >= 1)) return action;
    if (!(action.fooStep > current)) return action;
    var name = FOO_NAMES[current] || "this step";
    return {
      title: "Next dollar stays on " + name,
      why: "The weak bar points further along the order of operations, but the next dollar still follows Step " + current + " · " + name + ".",
      fooStep: current
    };
  }

  function nextAction(lowest, foo, input, perfectScore) {
    var current = foo.currentStep;
    var action;
    if (perfectScore) {
      action = {
        title: "Keep going — optimize the edges",
        why: "Every bar is maxed. Next dollar follows the order of operations; tighten insurance, match, and tax-free room if you want more juice.",
        fooStep: current
      };
    } else {
      var steps1to4Done = current >= 5;
      if (lowest === "spend") {
        action = {
          title: "Raise this month’s savings rate",
          why: "Spend is the lowest bar — keeping more of this month’s income lifts the grade without mixing in order-of-operations math.",
          fooStep: steps1to4Done ? 7 : current
        };
      } else if (lowest === "resilience") {
        action = {
          title: "Park more cash toward 3, then 6, months of essentials",
          why: "Cash runway is the weak bar. Emergency reserves are the matching order-of-operations step.",
          fooStep: 4
        };
      } else if (lowest === "leverage") {
        if (input.hasOnlyCheapDebt && !input.hasHighInterestConsumerDebt) {
          action = {
            title: "Extra dollars to low-interest debt can wait their turn",
            why: "Consumer leverage is mostly cheap debt — the order of operations parks extra payments at the end.",
            fooStep: 9
          };
        } else {
          action = {
            title: "Send extra dollars to high-APR consumer debt",
            why: "Leverage is the weak bar. High-interest balances are the matching order-of-operations step.",
            fooStep: 3
          };
        }
      } else if (lowest === "accumulation") {
        var step = 5;
        var early = current < 5;
        if (early) step = current;
        else if (foo.hit25Percent) step = 7;
        else if (current >= 5 && current <= 7) step = current === 6 && foo.hit25Percent ? 7 : current;
        else step = 7;
        if (step > current) step = current;
        if (early) {
          action = {
            title: "Next dollar stays on " + FOO_NAMES[step],
            why: "Investing pace is the weak bar, but the next dollar still follows Step " + step + " · " + FOO_NAMES[step] + ".",
            fooStep: step
          };
        } else {
          action = {
            title: "Aim for 25% of gross across Roth, HSA, match, and deferral",
            why: foo.hit25Percent
              ? "The 25% rule already covers hyper-accumulation — no need to nag maxing the employer plan."
              : "Investing pace is the weak bar. Roth, HSA, match, and deferral toward 25% of gross is the lift.",
            fooStep: step
          };
        }
      } else if (lowest === "trajectory") {
        action = {
          title: "Log this year’s statement and stay the course",
          why: "Trajectory rewards completed years. Consistency is the weak bar, not an order-of-operations score.",
          fooStep: 7
        };
      } else {
        action = {
          title: "Fill in this month’s plan",
          why: "A little more on the books makes the grade and the next dollar obvious.",
          fooStep: current
        };
      }
    }
    return clampNextAction(action, current);
  }

  function pctLabel(rate) {
    return Math.round(rate * 100) + "%";
  }

  function evaluate(input) {
    var spend = spendSection(input);
    var resilience = resilienceSection(input);
    var leverage = leverageSection(input);
    var accumulation = accumulationSection(input);
    var trajectory = trajectorySection(input);
    var sections = [spend, resilience, leverage, accumulation, trajectory];
    var parts = [];
    sections.forEach(function (section) {
      if (section.score != null) parts.push({ score: section.score, weight: section.weight });
    });
    var composite = weightedMean(parts) || 0;
    var rounded = Math.round(composite);
    if (rounded < 0) rounded = 0;
    if (rounded > 100) rounded = 100;
    var band = bandFrom(rounded);
    var visible = sections.filter(function (s) { return s.score != null; });
    var lowest = null;
    visible.forEach(function (section) {
      if (!lowest || section.score < lowest.score) lowest = section;
    });
    var foo = fooSummary(input);
    var lowestId = lowest && lowest.id;
    var allBarsMaxed = visible.length > 0 && visible.every(function (section) {
      return section.score >= 100 - 1e-9;
    });
    var perfectScore = rounded === 100;
    return {
      score: rounded,
      band: band,
      diagnosis: diagnosis(band, lowestId, perfectScore, foo.currentStep),
      provisional: (input.completedStatementYears || 0) < 2,
      sections: sections,
      lowestVisible: lowestId,
      perfectScore: perfectScore,
      allBarsMaxed: allBarsMaxed,
      nextAction: nextAction(lowestId, foo, input, perfectScore),
      foo: foo
    };
  }

  function spendSection(input) {
    if (input.savingsRate != null) {
      var rate = input.savingsRate;
      return {
        id: "spend",
        title: "Spend",
        score: spendScore(rate),
        weight: 0.2,
        // v37.5.59.2: Insights precision (43.6%) + say which basis is in use.
        whatWentIn: "Basic savings rate " + formatSavingsRate(rate) + " this month (savings envelopes ÷ " +
          monthBasisPhrase(input.takeHomeBasis) + ").",
        sentence: rate >= 0.2
          ? "A healthy share of income is staying invested or reserved."
          : "Raising the savings rate this month is the most direct lift here.",
        provisional: false,
        omittedReason: null
      };
    }
    return {
      id: "spend",
      title: "Spend",
      score: null,
      weight: 0.2,
      whatWentIn: "Needs a month of income to form a savings rate.",
      sentence: "Spend is omitted until income is on file — not scored as zero.",
      provisional: false,
      omittedReason: "Needs income"
    };
  }

  function resilienceSection(input) {
    if (input.liquidMonths != null) {
      var months = input.liquidMonths;
      return {
        id: "resilience",
        title: "Resilience",
        score: resilienceScore(months),
        weight: 0.25,
        whatWentIn: months.toFixed(1) + " months of essentials in Checking + Saving.",
        sentence: months >= 6
          ? "Cash covers a full half-year of essentials."
          : "Park more cash toward 3, then 6, months of essentials.",
        provisional: false,
        omittedReason: null
      };
    }
    return {
      id: "resilience",
      title: "Resilience",
      score: null,
      weight: 0.25,
      whatWentIn: "Needs essential monthly costs to measure cash runway.",
      sentence: "Resilience is omitted until essentials are on the budget — not scored as zero.",
      provisional: false,
      omittedReason: "Needs essentials"
    };
  }

  function leverageSection(input) {
    var score = leverageScore(input.consumerDebtToIncome, input.totalDebtToAssets);
    if (score != null) {
      var bits = [];
      if (input.consumerDebtToIncome != null) bits.push("consumer debt " + pctLabel(input.consumerDebtToIncome) + " of income");
      if (input.totalDebtToAssets != null) bits.push("total debt " + pctLabel(input.totalDebtToAssets) + " of assets");
      return {
        id: "leverage",
        title: "Leverage",
        score: score,
        weight: 0.2,
        whatWentIn: bits.join("; ") + ". Mortgage counts in the assets ratio only.",
        sentence: input.hasHighInterestConsumerDebt
          ? "High-APR consumer debt is the pressure point."
          : "Leverage is contained; extra to cheap debt waits until later order-of-operations steps.",
        provisional: false,
        omittedReason: null
      };
    }
    return {
      id: "leverage",
      title: "Leverage",
      score: null,
      weight: 0.2,
      whatWentIn: "Needs income or assets to form a debt ratio.",
      sentence: "Leverage is omitted until those figures exist — not scored as zero.",
      provisional: false,
      omittedReason: "Needs income or assets"
    };
  }

  function accumulationSection(input) {
    if (input.ageYears != null && input.netWorth != null && input.annualIncome != null) {
      var score = accumulationScore(input.netWorth, input.ageYears, input.annualIncome);
      if (score != null) {
        return {
          id: "accumulation",
          title: "Accumulation",
          score: score,
          weight: 0.2,
          whatWentIn: "Net worth vs " + ageTargetMultiple(input.ageYears).toFixed(1) + "× income at age " + Math.round(input.ageYears) + ".",
          sentence: score >= 90
            ? "Net worth is keeping pace with the age target."
            : "A 25% of gross pace (Roth, HSA, match, deferral) closes this gap.",
          provisional: false,
          omittedReason: null
        };
      }
    }
    return {
      id: "accumulation",
      title: "Accumulation",
      score: null,
      weight: 0.2,
      whatWentIn: "Birthday is required to set the age target. Age is never invented.",
      sentence: "Accumulation is omitted until a birthday is on Profile — not scored as zero.",
      provisional: false,
      omittedReason: input.ageYears == null ? "Needs birthday" : "Needs net worth and income"
    };
  }

  function trajectorySection(input) {
    var provisional = (input.completedStatementYears || 0) < 2;
    var score = trajectoryScore(
      input.deltaNWToIncome,
      input.completedStatementYears || 0,
      input.consecutiveCompletedYears || 0,
      !!input.completedYearsHaveGap
    );
    if (score != null) {
      var years = input.completedStatementYears || 0;
      return {
        id: "trajectory",
        title: "Trajectory",
        score: score,
        weight: 0.15,
        whatWentIn: "Last-year ΔNW vs income, times consistency from " + years + " completed statement" + (years === 1 ? "" : "s") + ".",
        sentence: provisional
          ? "Early statements: the number is real, the trend is still provisional."
          : "Keep logging the annual statement and stay the course.",
        provisional: provisional,
        omittedReason: null
      };
    }
    return {
      id: "trajectory",
      title: "Trajectory",
      score: null,
      weight: 0.15,
      whatWentIn: "Needs a completed statement year with a prior net-worth figure to see ΔNW.",
      sentence: "Trajectory is omitted until that history exists — not scored as zero.",
      provisional: provisional,
      omittedReason: "Needs statements"
    };
  }

  var fixtureA = {
    savingsRate: 0.3,
    liquidMonths: 6,
    consumerDebtToIncome: 0,
    totalDebtToAssets: 0,
    netWorth: 100000,
    annualIncome: 100000,
    ageYears: 30,
    deltaNWToIncome: 0.25,
    completedStatementYears: 2,
    consecutiveCompletedYears: 2,
    completedYearsHaveGap: false,
    hasHighInterestConsumerDebt: false,
    hasOnlyCheapDebt: false,
    retirementRateOfGross: 0.25,
    deductiblesCovered: true,
    matchCaptured: true,
    emergencyFunded: true,
    rothOnTrack: true,
    maxEmployerPlans: false,
    hyperOnTrack: true,
    prepayFuture: false,
    prepayLowInterest: false
  };

  var fixtureB = {
    savingsRate: 0.2,
    liquidMonths: 1,
    consumerDebtToIncome: 0.12,
    totalDebtToAssets: 0.28,
    netWorth: 40000,
    annualIncome: 80000,
    ageYears: 32,
    deltaNWToIncome: 0.1,
    completedStatementYears: 2,
    consecutiveCompletedYears: 2,
    completedYearsHaveGap: false,
    hasHighInterestConsumerDebt: true,
    hasOnlyCheapDebt: false,
    retirementRateOfGross: 0.08,
    deductiblesCovered: true,
    matchCaptured: true,
    emergencyFunded: false,
    rothOnTrack: false,
    maxEmployerPlans: false,
    hyperOnTrack: false,
    prepayFuture: false,
    prepayLowInterest: false
  };

  var fixtureC = {
    savingsRate: 0.15,
    liquidMonths: 3,
    consumerDebtToIncome: 0,
    totalDebtToAssets: 0.1,
    netWorth: 50000,
    annualIncome: 90000,
    ageYears: null,
    deltaNWToIncome: 0.1,
    completedStatementYears: 1,
    consecutiveCompletedYears: 1,
    completedYearsHaveGap: false,
    hasHighInterestConsumerDebt: false,
    hasOnlyCheapDebt: false,
    retirementRateOfGross: 0.1,
    deductiblesCovered: true,
    matchCaptured: true,
    emergencyFunded: true,
    rothOnTrack: false,
    maxEmployerPlans: false,
    hyperOnTrack: false,
    prepayFuture: false,
    prepayLowInterest: false
  };

  function assert(cond, message, errors) {
    if (!cond) errors.push(message);
  }

  function runFixtureTests() { return []; }

  var VAULT_TYPES = [
    { id: "insurance", title: "Insurance" },
    { id: "mortgage", title: "Mortgage" },
    { id: "loan", title: "Loan" },
    { id: "other", title: "Other" }
  ];
  var VAULT_INSURANCE_PROVIDERS = [
    "State Farm", "Geico", "Progressive", "Allstate", "USAA", "Liberty Mutual", "Farmers",
    "Nationwide", "Travelers", "American Family", "Hartford", "Amica", "Erie"
  ];
  var VAULT_LENDER_PROVIDERS = [
    "Rocket", "Quicken", "Wells Fargo", "Chase", "Bank of America", "Navy Federal",
    "Pennymac", "Better", "SoFi", "LendingClub", "Navient", "Nelnet", "Sallie Mae",
    "Capital One", "Discover", "Toyota", "Honda", "Ford", "Nissan"
  ];
  var VAULT_FREQ = [
    { id: "monthly", title: "Monthly", suffix: "/ mo" },
    { id: "quarterly", title: "Quarterly", suffix: "/ qtr" },
    { id: "semiannual", title: "Semiannual", suffix: "/ 6 mo" },
    { id: "annual", title: "Annual", suffix: "/ yr" }
  ];

  function normalizeVaultType(raw) {
    var key = String(raw || "").replace(/^\s+|\s+$/g, "").toLowerCase();
    if (key === "insurance" || key === "mortgage" || key === "loan" || key === "other") return key;
    return "other";
  }

  function vaultTypeTitle(type) {
    var id = normalizeVaultType(type);
    var row = VAULT_TYPES.filter(function (item) { return item.id === id; })[0];
    return row ? row.title : "Other";
  }

  function inferVaultType(doc) {
    var file = String((doc && doc.fileName) || "").toLowerCase();
    var slot = String((doc && doc.slot) || "");
    if (/mortgage|heloc|home\s*loan/.test(file)) return "mortgage";
    if (/insur|policy/.test(file) || slot === "insurance") return "insurance";
    if (/loan|note|apr/.test(file) || slot === "loans") return "loan";
    // Pay stubs stay vaultType "other" with slot payStubs (Income link).
    if (/stub|earnings\s*statement|paycheck|pay\s*stub/.test(file) || slot === "payStubs") {
      if (doc && doc.vaultType) return normalizeVaultType(doc.vaultType);
      return "other";
    }
    if (doc && doc.vaultType) return normalizeVaultType(doc.vaultType);
    return "other";
  }

  function providerListForType(type) {
    type = normalizeVaultType(type);
    if (type === "insurance") return VAULT_INSURANCE_PROVIDERS;
    if (type === "loan" || type === "mortgage") return VAULT_LENDER_PROVIDERS;
    return [];
  }

  function guessProviderTypeFromFile(fileName) {
    var file = String(fileName || "").toLowerCase();
    if (/mortgage|heloc|home\s*loan/.test(file)) return "mortgage";
    if (/insur|policy/.test(file)) return "insurance";
    if (/loan|note|apr/.test(file)) return "loan";
    return "";
  }

  function matchKnownProvider(fileName, list) {
    var raw = String(fileName || "").replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ");
    var lower = raw.toLowerCase();
    var i;
    for (i = 0; i < list.length; i++) {
      if (lower.indexOf(list[i].toLowerCase()) >= 0) return list[i];
    }
    var dash = raw.split(/\s+[—–-]\s+/);
    if (dash.length >= 2) {
      var maybe = dash[dash.length - 1].replace(/^\s+|\s+$/g, "");
      if (maybe && !/policy|statement|scan|photo|doc/i.test(maybe)) return maybe;
    }
    return "";
  }

  function guessVaultProvider(fileName, type) {
    var key = String(type || "").replace(/^\s+|\s+$/g, "");
    if (!key) key = guessProviderTypeFromFile(fileName);
    else key = normalizeVaultType(key);
    var list = providerListForType(key);
    if (!list.length) return "";
    return matchKnownProvider(fileName, list);
  }

  function findVaultDocForWrite(docs, id) {
    id = String(id == null ? "" : id);
    if (!id) return null;
    var list = Array.isArray(docs) ? docs : [];
    var i;
    for (i = 0; i < list.length; i++) {
      if (list[i] && String(list[i].id) === id) return list[i];
    }
    return null;
  }

  function removeVaultDocById(docs, id) {
    id = String(id == null ? "" : id);
    var list = Array.isArray(docs) ? docs : [];
    if (!id) return list.slice();
    return list.filter(function (doc) {
      return !(doc && String(doc.id) === id);
    });
  }

  function vaultTypeLabel(type, fileName) {
    var file = String(fileName || "").toLowerCase();
    type = normalizeVaultType(type);
    if (type === "insurance") {
      if (/auto|car|vehicle/.test(file)) return "Auto Insurance";
      if (/homeowner|home\b/.test(file)) return "Home Insurance";
      if (/renter/.test(file)) return "Renters Insurance";
      if (/\blife\b/.test(file)) return "Life Insurance";
      if (/health|medical/.test(file)) return "Health Insurance";
      if (/umbrella/.test(file)) return "Umbrella Insurance";
    }
    if (type === "loan") {
      if (/auto|car|vehicle/.test(file)) return "Auto Loan";
      if (/student/.test(file)) return "Student Loan";
      if (/personal/.test(file)) return "Personal Loan";
    }
    if (type === "other") {
      if (/stub|pay/.test(file)) return "Pay stub";
      if (/401/.test(file)) return "401k";
    }
    return vaultTypeTitle(type);
  }

  function defaultVaultTitle(type, provider, fileName) {
    var label = vaultTypeLabel(type, fileName);
    var who = String(provider || "").replace(/^\s+|\s+$/g, "");
    if (who) return label + " — " + who;
    return label;
  }

  function vaultMoneyAmount(value) {
    var n = Number(value);
    return isFinite(n) && n > 0 ? n : 0;
  }

  function hasVaultMoney(doc) {
    if (!doc) return false;
    return vaultMoneyAmount(doc.premium) > 0 ||
      vaultMoneyAmount(doc.payment) > 0 ||
      vaultMoneyAmount(doc.balance) > 0 ||
      vaultMoneyAmount(doc.minPayment) > 0 ||
      vaultMoneyAmount(doc.originalBalance) > 0;
  }

  function hasVaultFile(doc) {
    if (!doc) return false;
    return !!(doc.hasBlob || doc.dataUrl || (doc.relativePath && String(doc.relativePath).length));
  }

  function hasVaultProvider(doc) {
    return !!(doc && String(doc.provider || "").replace(/^\s+|\s+$/g, ""));
  }

  function docNeedsReview(doc) {
    if (!doc) return true;
    if (doc.payStubConfirmed) return false;
    var slot = String(doc.slot || "");
    if (slot === "payStubs" && (doc.payStubPending || hasVaultFile(doc))) return false;
    var type = normalizeVaultType(doc.vaultType || inferVaultType(doc));
    var title = String(doc.title || "").replace(/^\s+|\s+$/g, "");
    if (!type || !title) return true;
    if (hasVaultMoney(doc)) return false;
    if (hasVaultFile(doc) && (type === "other" || hasVaultProvider(doc))) return false;
    return true;
  }

  function vaultBadges(docs) {
    var list = Array.isArray(docs) ? docs : [];
    var review = 0;
    list.forEach(function (doc) {
      if (docNeedsReview(doc)) review += 1;
    });
    return { total: list.length, review: review };
  }

  function vaultFreqSuffix(freq) {
    var id = String(freq || "");
    var row = VAULT_FREQ.filter(function (item) { return item.id === id; })[0];
    return row ? row.suffix : "";
  }

  function frequencyMonths(freq) {
    var id = String(freq || "monthly");
    if (id === "quarterly") return 3;
    if (id === "semiannual") return 6;
    if (id === "annual") return 12;
    return 1;
  }

  function insuranceMonthlyCost(doc) {
    if (!doc) return null;
    var premium = vaultMoneyAmount(doc.premium);
    if (!(premium > 0)) return null;
    var freq = String(doc.premiumFrequency || "monthly");
    var months = frequencyMonths(freq);
    var amount = Math.round(monthlyPremium(premium, freq) * 100) / 100;
    return {
      amount: amount,
      estimated: freq !== "monthly",
      months: months,
      frequency: freq
    };
  }

  function insuranceBillingNeedsPrompt(doc) {
    if (!doc) return false;
    var type = normalizeVaultType(doc.vaultType);
    if (type !== "insurance" && doc.slot !== "insurance") return false;
    if (!(vaultMoneyAmount(doc.premium) > 0)) return false;
    var touched = doc.touchedFields || {};
    if (touched.premiumFrequency) return false;
    var freq = String(doc.premiumFrequency || "");
    return !freq || freq !== "monthly";
  }

  function vaultRowMoney(doc) {
    if (!doc) return null;
    var type = normalizeVaultType(doc.vaultType);
    if (type === "insurance" && vaultMoneyAmount(doc.premium) > 0) {
      var cost = insuranceMonthlyCost(doc);
      if (!cost) return null;
      return { amount: cost.amount, suffix: cost.estimated ? "est. / mo" : "/ mo", estimated: cost.estimated };
    }
    if (type === "mortgage") {
      if (vaultMoneyAmount(doc.payment) > 0) return { amount: vaultMoneyAmount(doc.payment), suffix: "/ mo" };
      if (vaultMoneyAmount(doc.balance) > 0) return { amount: vaultMoneyAmount(doc.balance), suffix: "" };
    }
    if (type === "loan") {
      if (vaultMoneyAmount(doc.minPayment) > 0) return { amount: vaultMoneyAmount(doc.minPayment), suffix: "/ mo" };
      if (vaultMoneyAmount(doc.payment) > 0) return { amount: vaultMoneyAmount(doc.payment), suffix: "/ mo" };
      if (vaultMoneyAmount(doc.balance) > 0) return { amount: vaultMoneyAmount(doc.balance), suffix: "" };
    }
    if (vaultMoneyAmount(doc.premium) > 0) {
      return { amount: vaultMoneyAmount(doc.premium), suffix: vaultFreqSuffix(doc.premiumFrequency) };
    }
    if (vaultMoneyAmount(doc.payment) > 0) return { amount: vaultMoneyAmount(doc.payment), suffix: "" };
    return null;
  }

  function slotFromVaultType(type) {
    type = normalizeVaultType(type);
    if (type === "insurance") return "insurance";
    if (type === "mortgage" || type === "loan") return "loans";
    return "other";
  }

  function enrichVaultDoc(doc) {
    if (!doc || typeof doc !== "object") return doc;
    if (!doc.vaultType) doc.vaultType = inferVaultType(doc);
    else doc.vaultType = normalizeVaultType(doc.vaultType);
    if (!doc.provider) {
      doc.provider = guessVaultProvider(doc.fileName, doc.vaultType);
    }
    if (!doc.title) {
      doc.title = defaultVaultTitle(doc.vaultType, doc.provider, doc.fileName);
      doc.titleCustomized = false;
    }
    if (doc.titleCustomized == null) doc.titleCustomized = false;
    if (doc.vaultTypeCustomized == null) doc.vaultTypeCustomized = false;
    if (doc.originalBalance == null) doc.originalBalance = 0;
    if (doc.addToNetWorth == null && (doc.vaultType === "loan" || doc.vaultType === "mortgage")) {
      doc.addToNetWorth = true;
    }
    if (!doc.touchedFields || typeof doc.touchedFields !== "object") doc.touchedFields = {};
    if (!Array.isArray(doc.pdfAutofilledFields)) doc.pdfAutofilledFields = [];
    if (doc.pdfAutofillReview == null) doc.pdfAutofillReview = false;
    if (doc.vaultType === "loan" && !String(doc.term || "").replace(/^\s+|\s+$/g, "") && !doc.hasBlob && !doc.dataUrl) {
      var payoff = estimateLoanPayoff(doc);
      if (payoff) doc.term = payoff;
    }
    return doc;
  }

  var FIXTURE_INSURANCE_LINES = [
    "GEICO AUTO INSURANCE POLICY",
    "Provider: Geico",
    "Policy Number: 4412-8871",
    "Named insured: 2018 Honda Civic",
    "Premium: $165.00 monthly",
    "Collision deductible: $500",
    "Comprehensive deductible: $250",
    "Policy period: 01/01/2026 to 07/01/2026",
    "Insured vehicle: 2018 Honda Civic"
  ];
  var FIXTURE_LOAN_LINES = [
    "NAVY FEDERAL AUTO LOAN STATEMENT",
    "Lender: Navy Federal",
    "Account Number: 90011234",
    "Original Balance: $24,500.00",
    "Current Balance: $18,240.00",
    "Interest Rate: 5.9%",
    "Minimum Payment: $385.00",
    "Term: 60 months 01/15/2024 to 01/15/2029",
    "Collateral: 2018 Honda Civic"
  ];
  var UNREAD_PREMIUM_COPY = "Policy on file — could not read premium; edit the Vault card or re-upload.";
  var PDF_QUICK_READ_COPY = "Couldn’t read this PDF quickly — edit premium or try a shorter declarations page";
  var PDF_TEXT_MAX_PAGES = 3;
  var PDF_TEXT_BUDGET_MS = 200;
  var PDF_AUTOFILL_MAX_BYTES = 1500000;
  var PDF_STREAM_CAP = 600000;

  function insuranceUnreadPremiumCopy() {
    return UNREAD_PREMIUM_COPY;
  }

  function pdfQuickReadCopy() {
    return PDF_QUICK_READ_COPY;
  }

  function vaultPdfNeedsAutofill(doc) {
    return !doc.pdfScanned;
  }

  function getFflate() {
    if (root.fflate && root.fflate.unzlibSync) return root.fflate;
    if (typeof require === "function") {
      try { return require("./vendor/fflate.js"); } catch (err) {}
    }
    return null;
  }

  function pdfEscape(text) {
    return String(text || "").replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
  }

  function toPdfBytes(input) {
    if (!input) return new Uint8Array(0);
    if (input instanceof Uint8Array) return input;
    if (typeof ArrayBuffer !== "undefined" && input instanceof ArrayBuffer) return new Uint8Array(input);
    if (typeof Buffer !== "undefined" && Buffer.isBuffer && Buffer.isBuffer(input)) {
      return new Uint8Array(input);
    }
    var str = String(input);
    var out = new Uint8Array(str.length);
    var i;
    for (i = 0; i < str.length; i++) out[i] = str.charCodeAt(i) & 255;
    return out;
  }

  function latin1FromBytesChunked(bytes) {
    var out = "";
    var size = 0x8000;
    var i;
    var end;
    for (i = 0; i < bytes.length; i += size) {
      end = i + size;
      if (end > bytes.length) end = bytes.length;
      out += String.fromCharCode.apply(null, bytes.subarray(i, end));
    }
    return out;
  }

  var latin1Decoder = null;
  var latin1DecoderChecked = false;

  function bytePreservingLatin1Decoder() {
    if (latin1DecoderChecked) return latin1Decoder;
    latin1DecoderChecked = true;
    latin1Decoder = null;
    if (typeof TextDecoder !== "function") return null;
    try {
      var decoder = new TextDecoder("latin1");
      var sample = new Uint8Array([0x00, 0x80, 0x93, 0xFF]);
      var text = decoder.decode(sample);
      if (text.length === 4 && text.charCodeAt(1) === 0x80 && text.charCodeAt(2) === 0x93 && text.charCodeAt(3) === 0xFF) {
        latin1Decoder = decoder;
      }
    } catch (err) {}
    return latin1Decoder;
  }

  function latin1FromBytes(bytes) {
    if (!bytes || !bytes.length) return "";
    var decoder = bytePreservingLatin1Decoder();
    if (decoder) {
      try { return decoder.decode(bytes); } catch (err) {}
    }
    return latin1FromBytesChunked(bytes);
  }

  function bytesFromLatin1(str) {
    var out = new Uint8Array(str.length);
    var i;
    for (i = 0; i < str.length; i++) out[i] = str.charCodeAt(i) & 255;
    return out;
  }

  function inflatePdfBytes(bytes) {
    var lib = getFflate();
    if (lib) {
      try { return lib.unzlibSync(bytes); } catch (err) {}
      try { return lib.inflateSync(bytes); } catch (err2) {}
    }
    if (typeof require === "function") {
      try {
        var zlib = require("zlib");
        var buf = Buffer.from(bytes);
        try { return new Uint8Array(zlib.inflateSync(buf)); } catch (err3) {}
        try { return new Uint8Array(zlib.inflateRawSync(buf)); } catch (err4) {}
      } catch (err5) {}
    }
    return null;
  }

  function contentStreamForLines(lines) {
    var content = "BT\n/F1 11 Tf\n50 720 Td\n14 TL\n";
    (lines || []).forEach(function (line, i) {
      var cmd = "(" + pdfEscape(line) + ") Tj\n";
      content += i === 0 ? cmd : "T* " + cmd;
    });
    content += "ET\n";
    return content;
  }

  function assemblePdfFromBodies(bodies) {
    var out = "%PDF-1.4\n";
    var xref = [0];
    var i;
    for (i = 0; i < bodies.length; i++) {
      xref.push(out.length);
      out += (i + 1) + " 0 obj\n" + bodies[i] + "\nendobj\n";
    }
    var startxref = out.length;
    out += "xref\n0 " + (bodies.length + 1) + "\n";
    out += "0000000000 65535 f \n";
    for (i = 1; i < xref.length; i++) {
      var off = String(xref[i]);
      while (off.length < 10) off = "0" + off;
      out += off + " 00000 n \n";
    }
    out += "trailer\n<< /Size " + (bodies.length + 1) + " /Root 1 0 R >>\nstartxref\n" + startxref + "\n%%EOF\n";
    return out;
  }

  function assemblePdf(contentBody) {
    return assemblePdfFromBodies([
      "<< /Type /Catalog /Pages 2 0 R >>",
      "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
      "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
      contentBody,
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"
    ]);
  }

  function makeBoundPdf(pageLineGroups, opts) {
    opts = opts || {};
    var groups = pageLineGroups || [];
    var nPages = groups.length || 1;
    if (!groups.length) groups = [[]];
    var fontId = 3 + nPages * 2;
    var kids = [];
    var bodies = [];
    var p;
    for (p = 0; p < nPages; p++) kids.push((3 + p) + " 0 R");
    bodies.push("<< /Type /Catalog /Pages 2 0 R >>");
    bodies.push("<< /Type /Pages /Kids [" + kids.join(" ") + "] /Count " + nPages + " >>");
    for (p = 0; p < nPages; p++) {
      var contentId = 3 + nPages + p;
      bodies.push("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents " + contentId +
        " 0 R /Resources << /Font << /F1 " + fontId + " 0 R >> >> >>");
    }
    for (p = 0; p < nPages; p++) {
      var content = contentStreamForLines(groups[p]);
      bodies.push("<< /Length " + content.length + " >>\nstream\n" + content + "\nendstream");
    }
    bodies.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
    if (opts.decoy) {
      var decoy = String(opts.decoy);
      bodies.push("<< /Length " + decoy.length + " >>\nstream\n" + decoy + "\nendstream");
    }
    return assemblePdfFromBodies(bodies);
  }

  function makeUncompressedPdf(lines) {
    var content = contentStreamForLines(lines);
    return assemblePdf("<< /Length " + content.length + " >>\nstream\n" + content + "endstream");
  }

  function makeFlatePdf(lines) {
    var content = contentStreamForLines(lines);
    var lib = getFflate();
    if (!lib || !lib.zlibSync) return makeUncompressedPdf(lines);
    var compressed = lib.zlibSync(bytesFromLatin1(content));
    return assemblePdf("<< /Length " + compressed.length + " /Filter /FlateDecode >>\nstream\n" + latin1FromBytes(compressed) + "\nendstream");
  }

  function makeContentPdf(content, opts) {
    opts = opts || {};
    var body = content;
    var extra = "";
    if (opts.flate) {
      var lib = getFflate();
      if (lib && lib.zlibSync) {
        var compressed = lib.zlibSync(bytesFromLatin1(content));
        body = latin1FromBytes(compressed);
        extra = " /Filter /FlateDecode";
      }
    }
    return assemblePdf("<< /Length " + body.length + extra + " >>\nstream\n" + body + "\nendstream");
  }

  var TINY_JPEG_B64 = "/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxISEhUQEhIVFRUVFRUVFRUVFRUVFRUWFxUVFRUYHSggGBolGxUVITEhJSkrLi4uFx8zODMtNygtLisBCgoKDg0OGhAQGy0lHyUtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLf/AABEIAAcABwMBIgACEQEDEQH/xAAbAAABBQEBAAAAAAAAAAAAAAADAAIEBQYBB//EABQBAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8Aqo4A//9k";

  function makeImageOnlyPdf() {
    var jpeg = "";
    if (typeof Buffer !== "undefined") jpeg = Buffer.from(TINY_JPEG_B64, "base64").toString("latin1");
    else if (typeof atob === "function") jpeg = atob(TINY_JPEG_B64);
    else return "%PDF-1.4\n";
    var page = "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] /Resources << /XObject << /Im1 4 0 R >> >> >>";
    var image = "<< /Type /XObject /Subtype /Image /Width 1 /Height 1 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length " + jpeg.length + " >>\nstream\n" + jpeg + "\nendstream";
    var bodies = [
      "<< /Type /Catalog /Pages 2 0 R >>",
      "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
      page,
      image
    ];
    var out = "%PDF-1.4\n";
    var xref = [0];
    var i;
    for (i = 0; i < bodies.length; i++) {
      xref.push(out.length);
      out += (i + 1) + " 0 obj\n" + bodies[i] + "\nendobj\n";
    }
    var startxref = out.length;
    out += "xref\n0 " + (bodies.length + 1) + "\n0000000000 65535 f \n";
    for (i = 1; i < xref.length; i++) {
      var off = String(xref[i]);
      while (off.length < 10) off = "0" + off;
      out += off + " 00000 n \n";
    }
    out += "trailer\n<< /Size " + (bodies.length + 1) + " /Root 1 0 R >>\nstartxref\n" + startxref + "\n%%EOF\n";
    return out;
  }

  function dictByteLength(dict, objects) {
    var indirect = String(dict || "").match(/\/Length\s+(\d+)\s+\d+\s+R/);
    if (indirect && objects && objects[indirect[1]]) {
      var raw = objects[indirect[1]].dict || "";
      var n = raw.match(/(\d+)/);
      if (n) return Number(n[1]);
    }
    if (indirect) return -1;
    var direct = String(dict || "").match(/\/Length\s+(\d+)/);
    return direct ? Number(direct[1]) : -1;
  }

  function splitDictAndStream(raw, start) {
    var i = start;
    while (i < raw.length && raw.charCodeAt(i) <= 32) i++;
    if (raw.slice(i, i + 2) !== "<<") {
      var end = raw.indexOf("endobj", i);
      return { dict: raw.slice(i, end < 0 ? Math.min(raw.length, i + 800) : end), stream: "", dataAt: -1 };
    }
    var depth = 0;
    var j = i;
    while (j < raw.length) {
      if (raw.slice(j, j + 2) === "<<") { depth++; j += 2; continue; }
      if (raw.slice(j, j + 2) === ">>") {
        depth--;
        j += 2;
        if (depth === 0) break;
        continue;
      }
      j++;
    }
    var dict = raw.slice(i, j);
    var k = j;
    while (k < raw.length && raw.charCodeAt(k) <= 32) k++;
    if (raw.slice(k, k + 6) !== "stream") return { dict: dict, stream: "", dataAt: -1 };
    k += 6;
    if (raw.charCodeAt(k) === 13) k++;
    if (raw.charCodeAt(k) === 10) k++;
    return { dict: dict, stream: "", dataAt: k };
  }

  function readObjectAt(raw, offset) {
    var head = raw.slice(offset, Math.min(raw.length, offset + 64));
    var marker = head.match(/(\d+)\s+\d+\s+obj\b/);
    var start = offset;
    if (marker) start = offset + head.indexOf(marker[0]) + marker[0].length;
    return splitDictAndStream(raw, start);
  }

  function readClassicXref(raw) {
    var start = raw.lastIndexOf("startxref");
    if (start < 0) return null;
    var m = raw.slice(start).match(/startxref\s+(\d+)/);
    if (!m) return null;
    var pos = Number(m[1]);
    if (raw.slice(pos, pos + 4) !== "xref") return null;
    var body = raw.slice(pos, pos + 20000);
    var header = body.match(/xref\s+(\d+)\s+(\d+)/);
    if (!header) return null;
    var first = Number(header[1]);
    var map = {};
    var re = /(\d{10})\s+(\d{5})\s+([nf])/g;
    var em;
    var index = 0;
    while ((em = re.exec(body))) {
      if (em[3] === "n") map[String(first + index)] = Number(em[1]);
      index++;
    }
    return index ? map : null;
  }

  function collectPdfObjects(raw) {
    var xref = readClassicXref(raw);
    var spots = [];
    if (xref) {
      Object.keys(xref).forEach(function (num) { spots.push({ num: num, at: xref[num] }); });
    } else {
      var re = /(\d+)\s+\d+\s+obj\b/g;
      var m;
      while ((m = re.exec(raw))) spots.push({ num: m[1], at: m.index });
    }
    var objects = {};
    spots.forEach(function (spot) {
      var piece = readObjectAt(raw, spot.at);
      objects[spot.num] = piece;
    });
    Object.keys(objects).forEach(function (num) {
      var obj = objects[num];
      if (obj.dataAt < 0) return;
      var len = dictByteLength(obj.dict, objects);
      if (len >= 0) obj.stream = raw.slice(obj.dataAt, obj.dataAt + len);
    });
    return objects;
  }

  function canonicalPdfFilter(name) {
    switch (name) {
      case "Fl": return "FlateDecode";
      case "DCT": return "DCTDecode";
      case "JPX": return "JPXDecode";
      case "CCF": return "CCITTFaxDecode";
      case "JBIG2": return "JBIG2Decode";
      case "A85": return "ASCII85Decode";
      case "AHx": return "ASCIIHexDecode";
      case "LZW": return "LZWDecode";
      case "RL": return "RunLengthDecode";
      default: return name;
    }
  }

  function filterNames(dict) {
    var text = String(dict || "");
    var arr = text.match(/\/Filter\s*\[([^\]]+)\]/);
    if (arr) {
      var names = [];
      var re = /\/([A-Za-z0-9]+)/g;
      var m;
      while ((m = re.exec(arr[1]))) names.push(canonicalPdfFilter(m[1]));
      return names;
    }
    var one = text.match(/\/Filter\s*\/([A-Za-z0-9]+)/);
    return one ? [canonicalPdfFilter(one[1])] : [];
  }

  function pdfFilterIsImage(filters) {
    var i;
    for (i = 0; i < (filters || []).length; i++) {
      var name = filters[i];
      if (name === "DCTDecode" || name === "JPXDecode" || name === "CCITTFaxDecode" || name === "JBIG2Decode") return true;
    }
    return false;
  }

  function asciiHexDecode(bytes) {
    var hex = latin1FromBytes(bytes).replace(/[^0-9A-Fa-f]/g, "");
    if (hex.length % 2) hex += "0";
    var out = new Uint8Array(hex.length / 2);
    var i;
    for (i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16) || 0;
    return out;
  }

  function ascii85Decode(bytes) {
    var str = latin1FromBytes(bytes).replace(/\s+/g, "").replace(/^<~/, "").replace(/~>$/, "");
    var out = [];
    var i = 0;
    while (i < str.length) {
      if (str.charAt(i) === "z") { out.push(0, 0, 0, 0); i++; continue; }
      var chunk = str.slice(i, i + 5);
      if (!chunk) break;
      var pad = 5 - chunk.length;
      var c = chunk;
      while (c.length < 5) c += "u";
      var value = 0;
      var k;
      for (k = 0; k < 5; k++) value = value * 85 + (c.charCodeAt(k) - 33);
      var produced = 4 - (pad > 0 ? pad : 0);
      if (chunk.length < 5) produced = chunk.length - 1;
      var b3 = (value >>> 24) & 255;
      var b2 = (value >>> 16) & 255;
      var b1 = (value >>> 8) & 255;
      var b0 = value & 255;
      var all = [b3, b2, b1, b0];
      for (k = 0; k < produced && k < 4; k++) out.push(all[k]);
      i += chunk.length >= 5 ? 5 : chunk.length;
      if (chunk.length < 5) break;
    }
    return new Uint8Array(out);
  }

  function paeth(a, b, c) {
    var p = a + b - c;
    var pa = Math.abs(p - a);
    var pb = Math.abs(p - b);
    var pc = Math.abs(p - c);
    if (pa <= pb && pa <= pc) return a;
    if (pb <= pc) return b;
    return c;
  }

  function pngUnpredict(data, columns) {
    columns = columns || 1;
    if (!(data instanceof Uint8Array)) data = new Uint8Array(data);
    var out = [];
    var prev = new Uint8Array(columns);
    var i = 0;
    while (i + 1 + columns <= data.length) {
      var filter = data[i];
      i++;
      var row = data.subarray(i, i + columns);
      i += columns;
      var cur = new Uint8Array(columns);
      var c;
      for (c = 0; c < columns; c++) {
        var left = c > 0 ? cur[c - 1] : 0;
        var up = prev[c] || 0;
        var ul = c > 0 ? prev[c - 1] : 0;
        var x = row[c];
        if (filter === 1) cur[c] = (x + left) & 255;
        else if (filter === 2) cur[c] = (x + up) & 255;
        else if (filter === 3) cur[c] = (x + ((left + up) >> 1)) & 255;
        else if (filter === 4) cur[c] = (x + paeth(left, up, ul)) & 255;
        else cur[c] = x;
      }
      for (c = 0; c < columns; c++) out.push(cur[c]);
      prev = cur;
    }
    return new Uint8Array(out);
  }

  function decodeParms(dict) {
    var block = String(dict || "").match(/\/DecodeParms\s*<<([\s\S]*?)>>/);
    if (!block) return { predictor: 1, columns: 1 };
    var pred = block[1].match(/\/Predictor\s+(\d+)/);
    var cols = block[1].match(/\/Columns\s+(\d+)/);
    return {
      predictor: pred ? Number(pred[1]) : 1,
      columns: cols ? Number(cols[1]) : 1
    };
  }

  function decodePdfStream(obj) {
    if (!obj || !obj.stream) return null;
    var filters = filterNames(obj.dict);
    var data = bytesFromLatin1(obj.stream);
    var i;
    for (i = 0; i < filters.length; i++) {
      var name = filters[i];
      if (name === "FlateDecode") {
        data = inflatePdfBytes(data);
        if (!data) return null;
      } else if (name === "ASCIIHexDecode") data = asciiHexDecode(data);
      else if (name === "ASCII85Decode") data = ascii85Decode(data);
      else if (name === "DCTDecode" || name === "JPXDecode" || name === "CCITTFaxDecode" || name === "JBIG2Decode") return null;
      else return null;
    }
    var parms = decodeParms(obj.dict);
    if (parms.predictor >= 10) data = pngUnpredict(data, parms.columns);
    return data;
  }

  function pdfBytesToText(bytes) {
    var out = "";
    var i;
    for (i = 0; i < bytes.length; i++) {
      var c = bytes[i];
      if (c === 10 || c === 13) out += "\n";
      else if (c === 9) out += " ";
      else if (c >= 32 && c <= 126) out += String.fromCharCode(c);
      else if (c >= 160) out += String.fromCharCode(c);
      else out += " ";
    }
    return out;
  }

  function unicodeFromHex(hex) {
    hex = String(hex || "");
    if (!hex) return "";
    var out = "";
    var i;
    if (hex.length % 4 === 0) {
      for (i = 0; i < hex.length; i += 4) {
        var cp = parseInt(hex.substr(i, 4), 16);
        if (cp) out += String.fromCharCode(cp);
      }
      return out;
    }
    for (i = 0; i + 1 < hex.length; i += 2) {
      out += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    }
    return out;
  }

  function parseToUnicode(text) {
    var map = {};
    function put(src, dest) {
      map[String(src).toUpperCase()] = dest;
    }
    var sections = String(text || "").split(/endbfchar|endbfrange/);
    sections.forEach(function (section) {
      if (section.indexOf("beginbfchar") >= 0) {
        var body = section.split("beginbfchar").pop();
        var re = /<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g;
        var m;
        while ((m = re.exec(body))) put(m[1], unicodeFromHex(m[2]));
      } else if (section.indexOf("beginbfrange") >= 0) {
        var rangeBody = section.split("beginbfrange").pop();
        var rangeRe = /<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*(?:<([0-9A-Fa-f]+)>|\[([^\]]+)\])/g;
        var rm;
        while ((rm = rangeRe.exec(rangeBody))) {
          var start = parseInt(rm[1], 16);
          var end = parseInt(rm[2], 16);
          var width = rm[1].length;
          if (end < start || end - start > 512) continue;
          if (rm[3]) {
            var dest = parseInt(rm[3], 16);
            var n;
            for (n = start; n <= end; n++) {
              var key = n.toString(16).toUpperCase();
              while (key.length < width) key = "0" + key;
              put(key, String.fromCharCode(dest + (n - start)));
            }
          } else if (rm[4]) {
            var dests = [];
            var destRe = /<([0-9A-Fa-f]+)>/g;
            var dm;
            while ((dm = destRe.exec(rm[4]))) dests.push(unicodeFromHex(dm[1]));
            var idx;
            for (idx = 0; idx < dests.length && start + idx <= end; idx++) {
              var rkey = (start + idx).toString(16).toUpperCase();
              while (rkey.length < width) rkey = "0" + rkey;
              put(rkey, dests[idx]);
            }
          }
        }
      }
    });
    return Object.keys(map).length ? map : null;
  }

  function decodeGlyphs(bytes, cmap) {
    if (!bytes || !bytes.length) return "";
    if (!cmap) return pdfBytesToText(bytes);
    var out = "";
    var i = 0;
    while (i < bytes.length) {
      var found = null;
      var used = 0;
      var n;
      for (n = Math.min(4, bytes.length - i); n >= 1; n--) {
        var hex = "";
        var k;
        for (k = 0; k < n; k++) {
          var h = bytes[i + k].toString(16).toUpperCase();
          if (h.length < 2) h = "0" + h;
          hex += h;
        }
        if (cmap[hex] != null) { found = cmap[hex]; used = n; break; }
      }
      if (used) {
        out += found;
        i += used;
      } else {
        out += pdfBytesToText([bytes[i]]);
        i++;
      }
    }
    return out;
  }

  function readLiteralBytes(content, i) {
    var bytes = [];
    var depth = 1;
    i++;
    while (i < content.length && depth > 0) {
      var c = content.charCodeAt(i);
      if (c === 92) {
        i++;
        if (i >= content.length) break;
        var e = content.charAt(i);
        var map = { n: 10, r: 13, t: 9, b: 8, f: 12, "(": 40, ")": 41, "\\": 92 };
        if (map[e] != null) { bytes.push(map[e]); i++; continue; }
        if (e >= "0" && e <= "7") {
          var oct = e;
          i++;
          var extra = 0;
          while (extra < 2 && i < content.length) {
            var digit = content.charAt(i);
            if (digit < "0" || digit > "7") break;
            oct += digit;
            i++;
            extra++;
          }
          bytes.push(parseInt(oct, 8) & 255);
          continue;
        }
        if (e === "\n") { i++; continue; }
        if (e === "\r") {
          i++;
          if (content.charAt(i) === "\n") i++;
          continue;
        }
        bytes.push(content.charCodeAt(i) & 255);
        i++;
        continue;
      }
      if (c === 40) { depth++; bytes.push(40); i++; continue; }
      if (c === 41) {
        depth--;
        if (depth === 0) { i++; break; }
        bytes.push(41);
        i++;
        continue;
      }
      bytes.push(c & 255);
      i++;
    }
    return { bytes: bytes, end: i };
  }

  function readHexBytes(content, i) {
    i++;
    var hex = "";
    while (i < content.length && content.charAt(i) !== ">") {
      var ch = content.charAt(i);
      if (/[0-9A-Fa-f]/.test(ch)) hex += ch;
      i++;
    }
    if (content.charAt(i) === ">") i++;
    if (hex.length % 2) hex += "0";
    var bytes = [];
    var k;
    for (k = 0; k < hex.length; k += 2) bytes.push(parseInt(hex.substr(k, 2), 16) || 0);
    return { bytes: bytes, end: i };
  }

  function textFromContentStream(content, cmapForFont) {
    var stack = [];
    var chunks = [];
    var x = 0;
    var y = 0;
    var lineX = 0;
    var leading = 14;
    var fontSize = 12;
    var fontName = "";
    function popNum() {
      var item = stack.pop();
      return item && item.t === "num" ? item.v : 0;
    }
    function decode(bytes) {
      var cmap = cmapForFont ? cmapForFont(fontName) : null;
      return decodeGlyphs(bytes, cmap);
    }
    /* v37.5.59.5: graphics-state CTM (q / Q / cm). Workday pay stubs place every text run with
     * "1 0 0 1 x y cm" + "1 0 0 1 0 0 Tm", so without the CTM every run landed on one line at x = 0. */
    var ctm = [1, 0, 0, 1, 0, 0];
    var ctmStack = [];
    function pushChunk(text) {
      if (!text) return;
      var width = Math.max(fontSize * 0.35, text.length * fontSize * 0.45);
      var sx = Math.abs(ctm[0]) || 1;
      var dx = ctm[0] * x + ctm[2] * y + ctm[4];
      var dy = ctm[1] * x + ctm[3] * y + ctm[5];
      chunks.push({ x: dx, y: Math.round(dy * 2) / 2, text: text, end: dx + width * sx, fs: fontSize * (Math.abs(ctm[3]) || 1), op: ++chunkSeq });
      x += width;
    }
    var chunkSeq = 0;
    var i = 0;
    var n = content.length;
    while (i < n) {
      var c = content.charCodeAt(i);
      if (c <= 32) { i++; continue; }
      if (c === 37) {
        while (i < n && content.charCodeAt(i) !== 10 && content.charCodeAt(i) !== 13) i++;
        continue;
      }
      if (c === 40) {
        var lit = readLiteralBytes(content, i);
        stack.push({ t: "bytes", bytes: lit.bytes });
        i = lit.end;
        continue;
      }
      if (c === 60 && content.charCodeAt(i + 1) === 60) { i += 2; continue; }
      if (c === 62 && content.charCodeAt(i + 1) === 62) { i += 2; continue; }
      if (c === 60) {
        var hex = readHexBytes(content, i);
        stack.push({ t: "bytes", bytes: hex.bytes });
        i = hex.end;
        continue;
      }
      if (c === 91) { stack.push({ t: "mark" }); i++; continue; }
      if (c === 93) {
        var arr = [];
        while (stack.length && stack[stack.length - 1].t !== "mark") arr.unshift(stack.pop());
        if (stack.length && stack[stack.length - 1].t === "mark") stack.pop();
        stack.push({ t: "arr", v: arr });
        i++;
        continue;
      }
      if (c === 47) {
        i++;
        var name = "";
        while (i < n) {
          var nc = content.charCodeAt(i);
          if (nc <= 32 || nc === 47 || nc === 91 || nc === 93 || nc === 40 || nc === 60 || nc === 62 || nc === 37) break;
          name += content.charAt(i);
          i++;
        }
        stack.push({ t: "name", v: name });
        continue;
      }
      if (c === 45 || c === 43 || c === 46 || (c >= 48 && c <= 57)) {
        var numStart = i;
        if (c === 43 || c === 45) i++;
        var saw = false;
        while (i < n && content.charCodeAt(i) >= 48 && content.charCodeAt(i) <= 57) { saw = true; i++; }
        if (i < n && content.charAt(i) === ".") {
          i++;
          while (i < n && content.charCodeAt(i) >= 48 && content.charCodeAt(i) <= 57) { saw = true; i++; }
        }
        if (!saw) { i = numStart + 1; continue; }
        stack.push({ t: "num", v: parseFloat(content.slice(numStart, i)) });
        continue;
      }
      var opStart = i;
      while (i < n) {
        var oc = content.charCodeAt(i);
        if (oc <= 32 || oc === 40 || oc === 60 || oc === 62 || oc === 91 || oc === 93 || oc === 47 || oc === 37) break;
        i++;
      }
      var op = content.slice(opStart, i);
      if (op === "Tj") {
        var shown = stack.pop();
        if (shown && shown.t === "bytes") pushChunk(decode(shown.bytes));
      } else if (op === "TJ") {
        var arrItem = stack.pop();
        var parts = [];
        if (arrItem && arrItem.t === "arr") {
          arrItem.v.forEach(function (part) {
            if (part.t === "bytes") parts.push(decode(part.bytes));
            else if (part.t === "num" && part.v <= -140) parts.push(" ");
          });
        }
        pushChunk(parts.join(""));
      } else if (op === "'") {
        y -= leading;
        x = lineX;
        var quoted = stack.pop();
        if (quoted && quoted.t === "bytes") pushChunk(decode(quoted.bytes));
      } else if (op === "\"") {
        var quoted2 = stack.pop();
        popNum();
        popNum();
        y -= leading;
        x = lineX;
        if (quoted2 && quoted2.t === "bytes") pushChunk(decode(quoted2.bytes));
      } else if (op === "Tm") {
        var fy = popNum();
        var fx = popNum();
        popNum(); popNum(); popNum(); popNum();
        x = fx;
        y = fy;
        lineX = x;
      } else if (op === "Td" || op === "TD") {
        var ty = popNum();
        var tx = popNum();
        x = lineX + tx;
        y += ty;
        lineX = x;
        if (op === "TD" && ty) leading = Math.abs(ty);
      } else if (op === "T*") {
        y -= leading;
        x = lineX;
      } else if (op === "TL") {
        leading = Math.abs(popNum()) || leading;
      } else if (op === "Tf") {
        fontSize = Math.abs(popNum()) || fontSize;
        var fname = stack.pop();
        if (fname && fname.t === "name") fontName = fname.v;
      } else if (op === "q") {
        ctmStack.push(ctm.slice());
      } else if (op === "Q") {
        if (ctmStack.length) ctm = ctmStack.pop();
      } else if (op === "cm") {
        var mf = popNum(), me = popNum(), md = popNum(), mc = popNum(), mb = popNum(), ma = popNum();
        // new CTM = M × CTM
        ctm = [
          ma * ctm[0] + mb * ctm[2], ma * ctm[1] + mb * ctm[3],
          mc * ctm[0] + md * ctm[2], mc * ctm[1] + md * ctm[3],
          me * ctm[0] + mf * ctm[2] + ctm[4], me * ctm[1] + mf * ctm[3] + ctm[5]
        ];
      }
      if (op) stack.length = 0; // an operator consumes its operands
    }
    if (!chunks.length) return "";
    var rows = [];
    chunks.forEach(function (ch) {
      var row = null;
      var r;
      for (r = 0; r < rows.length; r++) {
        if (Math.abs(rows[r].y - ch.y) <= 2) { row = rows[r]; break; }
      }
      if (!row) {
        row = { y: ch.y, parts: [] };
        rows.push(row);
      }
      row.parts.push(ch);
    });
    rows.sort(function (a, b) { return b.y - a.y; });
    return rows.map(function (row) {
      row.parts.sort(function (a, b) { return a.x - b.x; });
      var text = "";
      var prev = null;
      row.parts.forEach(function (part) {
        if (!part.text) return;
        if (prev) {
          var gap = part.x - prev.end;
          if (gap > Math.max(1.5, fontSize * 0.25) && !/\s$/.test(text) && !/^\s/.test(part.text)) text += " ";
        }
        text += part.text;
        prev = part;
      });
      return text.replace(/[ \t]+/g, " ").replace(/^\s+|\s+$/g, "");
    }).filter(Boolean).join("\n");
  }

  function contentObjectNumbers(dict) {
    var text = String(dict || "");
    var single = text.match(/\/Contents\s+(\d+)\s+\d+\s+R/);
    if (single) return [single[1]];
    var arr = text.match(/\/Contents\s*\[([\s\S]*?)\]/);
    if (!arr) return [];
    var nums = [];
    var re = /(\d+)\s+\d+\s+R/g;
    var m;
    while ((m = re.exec(arr[1]))) nums.push(m[1]);
    return nums;
  }

  function loadPdfObject(doc, num) {
    num = String(num);
    if (!doc || !doc.xref || doc.xref[num] == null) return null;
    if (doc.cache[num]) return doc.cache[num];
    if (doc.xref[num] < 0) return null;
    var piece = readObjectAt(doc.raw, doc.xref[num]);
    doc.cache[num] = piece;
    return piece;
  }

  function materializePdfStream(doc, obj, note) {
    if (!obj || obj.stream || obj.dataAt < 0) return obj && obj.stream ? obj.stream : "";
    var filters = filterNames(obj.dict);
    if (pdfFilterIsImage(filters) || /\/Subtype\s*\/Image\b/.test(obj.dict || "")) return "";
    var len = dictByteLength(obj.dict, null);
    if (len < 0) {
      var indirect = String(obj.dict || "").match(/\/Length\s+(\d+)\s+\d+\s+R/);
      if (indirect) {
        var lenObj = loadPdfObject(doc, indirect[1]);
        var n = lenObj && String(lenObj.dict || "").match(/(\d+)/);
        if (n) len = Number(n[1]);
      }
    }
    if (!(len >= 0)) {
      var end = doc.raw.indexOf("endstream", obj.dataAt);
      if (end < 0 || end - obj.dataAt > PDF_STREAM_CAP) {
        if (note) note.budgetHit = true;
        return "";
      }
      len = end - obj.dataAt;
    }
    if (len > PDF_STREAM_CAP) {
      if (note) note.budgetHit = true;
      return "";
    }
    obj.stream = doc.raw.slice(obj.dataAt, obj.dataAt + len);
    return obj.stream;
  }

  function scanPdfObjectOffsets(raw, over) {
    var map = {};
    var re = /(\d+)\s+\d+\s+obj\b/g;
    var found = 0;
    var m;
    while ((m = re.exec(raw))) {
      map[m[1]] = m.index;
      found++;
      if (found > 5000) break;
      if ((found % 200) === 0 && over && over()) break;
    }
    return map;
  }

  function indexPdfObjects(raw, over) {
    var xref = readClassicXref(raw);
    if (!xref || !Object.keys(xref).length) xref = scanPdfObjectOffsets(raw, over);
    var doc = { raw: raw, xref: xref || {}, cache: {} };
    unpackPdfObjectStreams(doc, over);
    return doc;
  }

  /* v37.5.59.5: PDF 1.5+ compressed object streams (/Type /ObjStm). Workday pay stubs (and most modern
   * generators) keep the Catalog, Pages and every Page dict inside one — without this, 0 pages were found.
   * Each embedded object becomes a cached dict-only object (no stream) under its own number. */
  function unpackPdfObjectStreams(doc, over) {
    var nums = Object.keys(doc.xref);
    var i;
    for (i = 0; i < nums.length && i < 5000; i++) {
      if (over && over()) return;
      var at = doc.xref[nums[i]];
      var head = doc.raw.slice(at, Math.min(doc.raw.length, at + 400));
      if (!/\/Type\s*\/ObjStm\b/.test(head)) continue;
      var obj = loadPdfObject(doc, nums[i]);
      if (!obj || !/\/Type\s*\/ObjStm\b/.test(obj.dict || "")) continue;
      materializePdfStream(doc, obj, null);
      var bytes = decodePdfStream(obj);
      if (!bytes) continue;
      var text = latin1FromBytes(bytes);
      var nMatch = String(obj.dict).match(/\/N\s+(\d+)/);
      var fMatch = String(obj.dict).match(/\/First\s+(\d+)/);
      if (!nMatch || !fMatch) continue;
      var count = Number(nMatch[1]);
      var first = Number(fMatch[1]);
      var header = text.slice(0, first).match(/\d+/g) || [];
      var k;
      for (k = 0; k + 1 < header.length && k / 2 < count; k += 2) {
        var objNum = header[k];
        var start = first + Number(header[k + 1]);
        var end = k + 3 < header.length ? first + Number(header[k + 3]) : text.length;
        if (doc.cache[objNum]) continue;
        var body = text.slice(start, end).replace(/^\s+|\s+$/g, "");
        doc.cache[objNum] = { dict: body, dataAt: -1, stream: "" };
        if (doc.xref[objNum] == null) doc.xref[objNum] = -1;
      }
    }
  }

  function catalogPagesNum(doc) {
    var trailer = doc.raw.lastIndexOf("trailer");
    if (trailer >= 0) {
      var slice = doc.raw.slice(trailer, trailer + 1500);
      var root = slice.match(/\/Root\s+(\d+)\s+\d+\s+R/);
      if (root) {
        var cat = loadPdfObject(doc, root[1]);
        var pages = cat && String(cat.dict || "").match(/\/Pages\s+(\d+)\s+\d+\s+R/);
        if (pages) return pages[1];
      }
    }
    var catMatch = doc.raw.match(/\/Type\s*\/Catalog\b[\s\S]{0,400}?\/Pages\s+(\d+)\s+\d+\s+R/);
    if (catMatch) return catMatch[1];
    // v37.5.59.5: cross-reference streams carry /Root in the XRef stream dict (no "trailer" keyword).
    var rootRef = doc.raw.match(/\/Type\s*\/XRef\b[^>]*?\/Root\s+(\d+)\s+\d+\s+R/) || doc.raw.match(/\/Root\s+(\d+)\s+\d+\s+R/);
    if (rootRef) {
      var cat2 = loadPdfObject(doc, rootRef[1]);
      var pages2 = cat2 && String(cat2.dict || "").match(/\/Pages\s+(\d+)\s+\d+\s+R/);
      if (pages2) return pages2[1];
    }
    var k;
    for (k in doc.cache) {
      if (Object.prototype.hasOwnProperty.call(doc.cache, k) && doc.cache[k] && /\/Type\s*\/Catalog\b/.test(doc.cache[k].dict || "")) {
        var pages3 = String(doc.cache[k].dict).match(/\/Pages\s+(\d+)\s+\d+\s+R/);
        if (pages3) return pages3[1];
      }
    }
    return null;
  }

  function kidsFromPagesDict(doc, dict) {
    var inline = String(dict || "").match(/\/Kids\s*\[([\s\S]*?)\]/);
    var body = inline ? inline[1] : "";
    if (!inline) {
      var ref = String(dict || "").match(/\/Kids\s+(\d+)\s+\d+\s+R/);
      if (ref) {
        var obj = loadPdfObject(doc, ref[1]);
        body = obj ? (obj.dict || "") : "";
      }
    }
    var nums = [];
    var re = /(\d+)\s+\d+\s+R/g;
    var m;
    while ((m = re.exec(body))) nums.push(m[1]);
    return nums;
  }

  function walkPageTree(doc, num, out, limit, over, seen, depth) {
    if (out.length >= limit || (over && over()) || depth > 16) return;
    num = String(num);
    if (seen[num]) return;
    seen[num] = true;
    var obj = loadPdfObject(doc, num);
    if (!obj) return;
    var dict = obj.dict || "";
    var isPage = /\/Type\s*\/Page\b/.test(dict) || (/\/Contents\b/.test(dict) && !/\/Kids\b/.test(dict));
    var isPages = !isPage && (/\/Type\s*\/Pages\b/.test(dict) || /\/Kids\b/.test(dict));
    if (isPages) {
      var kids = kidsFromPagesDict(doc, dict);
      var i;
      for (i = 0; i < kids.length; i++) {
        walkPageTree(doc, kids[i], out, limit, over, seen, depth + 1);
        if (out.length >= limit || (over && over())) return;
      }
      return;
    }
    if (isPage) out.push(num);
  }

  function collectContentPages(doc, maxPages, over) {
    var pages = [];
    var rootPages = catalogPagesNum(doc);
    if (rootPages) walkPageTree(doc, rootPages, pages, maxPages, over, {}, 0);
    if (pages.length || (over && over())) return pages;
    var nums = Object.keys(doc.xref);
    var i;
    for (i = 0; i < nums.length && pages.length < maxPages && i < 500; i++) {
      if (over && over()) break;
      var obj = loadPdfObject(doc, nums[i]);
      if (!obj) continue;
      var dict = obj.dict || "";
      if (/\/Type\s*\/Page\b/.test(dict)) pages.push(String(nums[i]));
    }
    return pages;
  }

  function dictForPageFonts(doc, pageNum, seen) {
    var page = loadPdfObject(doc, pageNum);
    if (!page) return "";
    var dict = page.dict || "";
    if (/\/Font\s*<</.test(dict) || /\/Resources\b/.test(dict)) return dict;
    var parent = dict.match(/\/Parent\s+(\d+)\s+\d+\s+R/);
    if (!parent) return dict;
    seen = seen || {};
    if (seen[pageNum]) return dict;
    seen[pageNum] = true;
    return dictForPageFonts(doc, parent[1], seen);
  }

  function fontCmapForObject(num, doc, cache) {
    if (cache[num]) return cache[num];
    var obj = loadPdfObject(doc, num);
    if (!obj) return null;
    var direct = parseToUnicode(obj.dict || "");
    if (direct) { cache[num] = direct; return direct; }
    var ref = String(obj.dict || "").match(/\/ToUnicode\s+(\d+)\s+\d+\s+R/);
    if (!ref) return null;
    var target = loadPdfObject(doc, ref[1]);
    if (!target) return null;
    if (pdfFilterIsImage(filterNames(target.dict))) return null;
    materializePdfStream(doc, target, null);
    var decoded = decodePdfStream(target);
    var text = decoded ? latin1FromBytes(decoded) : (target.dict || "");
    var parsed = parseToUnicode(text);
    if (parsed) { cache[num] = parsed; return parsed; }
    return null;
  }

  function fontMapFromDict(dict, doc, cache) {
    var text = String(dict || "");
    var resRef = text.match(/\/Resources\s+(\d+)\s+\d+\s+R/);
    if (resRef && text.indexOf("/Font") < 0) {
      var res = loadPdfObject(doc, resRef[1]);
      if (res) return fontMapFromDict(res.dict, doc, cache);
    }
    var block = text.match(/\/Font\s*<<([\s\S]*?)>>/);
    if (!block) return null;
    var map = {};
    var re = /\/([A-Za-z0-9_.]+)\s+(\d+)\s+\d+\s+R/g;
    var m;
    var any = false;
    while ((m = re.exec(block[1]))) {
      var cmap = fontCmapForObject(m[2], doc, cache);
      if (cmap) { map[m[1]] = cmap; any = true; }
    }
    return any ? map : null;
  }

  function textFromPdfContentObject(doc, num, fonts, over, note) {
    if (over && over()) return "";
    var obj = loadPdfObject(doc, num);
    if (!obj) return "";
    var filters = filterNames(obj.dict);
    if (pdfFilterIsImage(filters) || /\/Subtype\s*\/Image\b/.test(obj.dict || "")) return "";
    materializePdfStream(doc, obj, note);
    if (!obj.stream) return "";
    if (over && over()) return "";
    var decoded = decodePdfStream(obj);
    if (!decoded) return "";
    var latin = latin1FromBytes(decoded);
    if (latin.length > 350000) {
      latin = latin.slice(0, 350000);
      if (note) note.budgetHit = true;
    }
    if (/beginbfchar|beginbfrange|begincmap/.test(latin)) return "";
    if (!/(\bBT\b|\bTj\b|\bTJ\b|\s'|")/.test(latin)) return "";
    return textFromContentStream(latin, function (fontName) {
      if (fonts && fontName && fonts[fontName]) return fonts[fontName];
      return null;
    });
  }

  function latin1FromBytesBudget(bytes, over) {
    if (!bytes || !bytes.length) return "";
    if (over && over()) return "";
    var decoder = bytePreservingLatin1Decoder();
    if (decoder) {
      try { return decoder.decode(bytes); } catch (err) {}
    }
    var out = "";
    var size = 0x8000;
    var i;
    for (i = 0; i < bytes.length; i += size) {
      if ((i & 0x3ffff) === 0 && i > 0 && over && over()) return out;
      var end = Math.min(bytes.length, i + size);
      out += String.fromCharCode.apply(null, bytes.subarray(i, end));
    }
    return out;
  }

  function extractPdfTextCore(input, maxPages, over, info) {
    var note = { budgetHit: false };
    function report(text, hit) {
      if (info) {
        info.budgetHit = !!(hit || note.budgetHit);
        info.pages = info.pages || 0;
      }
      return text || "";
    }
    if (over && over()) return report("", true);
    var bytes = toPdfBytes(input);
    if (over && over()) return report("", true);
    var raw = latin1FromBytesBudget(bytes, over);
    if (over && over()) return report("", true);
    if (raw.indexOf("%PDF") < 0) return report(String(input || ""), false);
    var doc = indexPdfObjects(raw, over);
    if (over && over()) return report("", true);
    var pageNums = collectContentPages(doc, maxPages, over);
    if (info) info.pages = pageNums.length;
    var parts = [];
    var cache = {};
    var i;
    var hit = false;
    for (i = 0; i < pageNums.length; i++) {
      if (over && over()) { hit = true; break; }
      var page = loadPdfObject(doc, pageNums[i]);
      if (!page) continue;
      var fonts = fontMapFromDict(dictForPageFonts(doc, pageNums[i], {}), doc, cache);
      var contents = contentObjectNumbers(page.dict);
      var c;
      for (c = 0; c < contents.length; c++) {
        if (over && over()) { hit = true; break; }
        var text = textFromPdfContentObject(doc, contents[c], fonts, over, note);
        if (text && String(text).replace(/\s/g, "")) parts.push(text);
      }
      if (hit) break;
    }
    return report(parts.join("\n"), hit);
  }

  function extractPdfText(input, opts) {
    opts = opts || {};
    var budgetMs = opts.maxMs != null ? Number(opts.maxMs) : (opts.budgetMs != null ? Number(opts.budgetMs) : PDF_TEXT_BUDGET_MS);
    var maxPages = opts.maxPages == null ? PDF_TEXT_MAX_PAGES : Number(opts.maxPages);
    var started = Date.now();
    var timedOut = false;
    function over() {
      if ((Date.now() - started) >= budgetMs) {
        timedOut = true;
        return true;
      }
      return false;
    }
    var text = extractPdfTextCore(input, maxPages, over, opts.info);
    if (opts.info) {
      opts.info.timedOut = !!(timedOut || opts.info.budgetHit);
      if (opts.info.timedOut) opts.info.budgetHit = true;
    }
    return text;
  }

  function schedulePdfSlice(fn) {
    if (typeof requestIdleCallback === "function") {
      requestIdleCallback(function () { fn(); }, { timeout: 200 });
    } else {
      setTimeout(fn, 0);
    }
  }

  function extractPdfTextAsync(input, opts, done) {
    if (typeof opts === "function") {
      done = opts;
      opts = {};
    }
    opts = opts || {};
    done = done || function () {};
    var budgetMs = opts.budgetMs == null ? PDF_TEXT_BUDGET_MS : Number(opts.budgetMs);
    var maxPages = opts.maxPages == null ? PDF_TEXT_MAX_PAGES : Number(opts.maxPages);
    var deadlineMs = opts.deadlineMs == null ? 2500 : Number(opts.deadlineMs);
    var wallStart = Date.now();
    var spent = 0;
    var sliceStart = wallStart;
    var info = opts.info || {};
    info.budgetHit = false;
    info.pages = 0;
    function over() {
      return (Date.now() - wallStart) >= deadlineMs || (spent + (Date.now() - sliceStart)) >= budgetMs;
    }
    function beginSlice() { sliceStart = Date.now(); }
    function endSlice() { spent += Date.now() - sliceStart; }
    var bytes = null;
    var raw = "";
    var doc = null;
    var pageNums = [];
    var parts = [];
    var cache = {};
    var pageIndex = 0;
    var note = { budgetHit: false };
    function finish(text) {
      if (note.budgetHit || pageIndex < pageNums.length) info.budgetHit = true;
      done(text || "", info);
    }
    function nextPage() {
      if ((Date.now() - wallStart) >= deadlineMs || pageIndex >= pageNums.length) {
        if (pageIndex < pageNums.length) info.budgetHit = true;
        finish(parts.join("\n"));
        return;
      }
      beginSlice();
      if (over()) {
        endSlice();
        info.budgetHit = true;
        finish(parts.join("\n"));
        return;
      }
      var page = loadPdfObject(doc, pageNums[pageIndex]);
      pageIndex++;
      if (page) {
        var fonts = fontMapFromDict(dictForPageFonts(doc, pageNums[pageIndex - 1], {}), doc, cache);
        var contents = contentObjectNumbers(page.dict);
        var c;
        for (c = 0; c < contents.length; c++) {
          if (over()) { info.budgetHit = true; break; }
          var text = textFromPdfContentObject(doc, contents[c], fonts, over, note);
          if (text && String(text).replace(/\s/g, "")) parts.push(text);
        }
      }
      endSlice();
      schedulePdfSlice(nextPage);
    }
    schedulePdfSlice(function () {
      beginSlice();
      try {
        bytes = toPdfBytes(input);
        raw = latin1FromBytesBudget(bytes, over);
      } catch (err) {
        endSlice();
        info.budgetHit = true;
        finish("");
        return;
      }
      endSlice();
      if (!raw || raw.indexOf("%PDF") < 0) {
        finish(raw && raw.indexOf("%PDF") < 0 ? String(input || "") : "");
        return;
      }
      if (over()) {
        info.budgetHit = true;
        finish("");
        return;
      }
      schedulePdfSlice(function () {
        beginSlice();
        try {
          doc = indexPdfObjects(raw, over);
          pageNums = collectContentPages(doc, maxPages, over);
          info.pages = pageNums.length;
        } catch (err2) {
          endSlice();
          info.budgetHit = true;
          finish("");
          return;
        }
        endSlice();
        if (over() && !pageNums.length) {
          info.budgetHit = true;
          finish("");
          return;
        }
        nextPage();
      });
    });
  }

  function pdfTextIsThin(text) {
    return String(text || "").replace(/[^A-Za-z0-9]/g, "").length < 24;
  }

  function extractPdfJpegs(input) {
    var bytes = toPdfBytes(input);
    var raw = latin1FromBytes(bytes);
    if (raw.indexOf("%PDF") < 0) return [];
    var started = Date.now();
    function over() { return (Date.now() - started) >= PDF_TEXT_BUDGET_MS; }
    var doc = indexPdfObjects(raw, over);
    var images = [];
    var nums = Object.keys(doc.xref);
    var i;
    for (i = 0; i < nums.length && images.length < 1; i++) {
      if (over()) break;
      var obj = loadPdfObject(doc, nums[i]);
      if (!obj) continue;
      var filters = filterNames(obj.dict);
      if (filters.indexOf("DCTDecode") < 0) continue;
      var len = dictByteLength(obj.dict, null);
      if (len < 0) {
        var indirect = String(obj.dict || "").match(/\/Length\s+(\d+)\s+\d+\s+R/);
        if (indirect) {
          var lenObj = loadPdfObject(doc, indirect[1]);
          var n = lenObj && String(lenObj.dict || "").match(/(\d+)/);
          if (n) len = Number(n[1]);
        }
      }
      if (!(len > 20) || len > 1200000 || obj.dataAt < 0) continue;
      obj.stream = doc.raw.slice(obj.dataAt, obj.dataAt + len);
      var data = bytesFromLatin1(obj.stream);
      var f;
      for (f = 0; f < filters.length; f++) {
        if (filters[f] === "FlateDecode") data = inflatePdfBytes(data);
        else if (filters[f] === "ASCIIHexDecode" && data) data = asciiHexDecode(data);
        else if (filters[f] === "ASCII85Decode" && data) data = ascii85Decode(data);
      }
      if (data && data.length > 20 && data[0] === 0xFF && data[1] === 0xD8) images.push(data);
    }
    return images;
  }

  function ocrPdfBytes(input, done) {
    if (typeof done !== "function") done = function () {};
    var images = [];
    try { images = extractPdfJpegs(input); } catch (err) { images = []; }
    if (typeof root.PaperTrailOcr === "function") {
      try {
        root.PaperTrailOcr(images, input, function (text) { done(String(text || "")); });
        return;
      } catch (err2) {}
    }
    if (!images.length || !root.Tesseract || typeof root.Tesseract.recognize !== "function" || typeof Blob === "undefined") {
      done("");
      return;
    }
    try {
      var blob = new Blob([images[0]], { type: "image/jpeg" });
      var url = typeof URL !== "undefined" && URL.createObjectURL ? URL.createObjectURL(blob) : "";
      root.Tesseract.recognize(url || blob, "eng").then(function (res) {
        var text = res && res.data ? res.data.text : "";
        if (url && URL.revokeObjectURL) URL.revokeObjectURL(url);
        done(text || "");
      }).catch(function () { done(""); });
    } catch (err3) {
      done("");
    }
  }

  function parseMoneyAmount(raw) {
    var m = String(raw || "").replace(/,/g, "").match(/([0-9]+(?:\.[0-9]{1,2})?)/);
    if (!m) return 0;
    var n = Number(m[1]);
    return isFinite(n) ? n : 0;
  }

  function captureLine(blob, re) {
    var m = String(blob || "").match(re);
    return m ? String(m[1]).replace(/^\s+|\s+$/g, "") : "";
  }

  function moneyTokens(text) {
    var out = [];
    var re = /\$\s*([0-9]{1,3}(?:,[0-9]{3})+(?:\.[0-9]{2})?|[0-9]+(?:\.[0-9]{2})?)|([0-9]{1,3}(?:,[0-9]{3})+\.[0-9]{2})|([0-9]+\.[0-9]{2})/g;
    var blob = String(text || "");
    var m;
    while ((m = re.exec(blob))) {
      var raw = m[1] || m[2] || m[3];
      if (!m[1]) {
        var prev = m.index > 0 ? blob.charAt(m.index - 1) : "";
        if (/[A-Za-z0-9.]/.test(prev)) continue;
        var after = blob.charAt(m.index + m[0].length);
        if (/[0-9]/.test(after)) continue;
      }
      var n = parseMoneyAmount(raw);
      if (n > 0 && n < 10000000) out.push(n);
    }
    return out;
  }

  var MONTH_INDEX = {
    january: 0, jan: 0, february: 1, feb: 1, march: 2, mar: 2,
    april: 3, apr: 3, may: 4, june: 5, jun: 5, july: 6, jul: 6,
    august: 7, aug: 7, september: 8, sept: 8, sep: 8, october: 9, oct: 9,
    november: 10, nov: 10, december: 11, dec: 11
  };
  var MONTH_WORD = "January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sept|Sep|Oct|Nov|Dec";
  var STATE_CODES = {
    AL: 1, AK: 1, AZ: 1, AR: 1, CA: 1, CO: 1, CT: 1, DE: 1, FL: 1, GA: 1, HI: 1, IA: 1, ID: 1, IL: 1, IN: 1,
    KS: 1, KY: 1, LA: 1, MA: 1, MD: 1, ME: 1, MI: 1, MN: 1, MO: 1, MS: 1, MT: 1, NC: 1, ND: 1, NE: 1, NH: 1,
    NJ: 1, NM: 1, NV: 1, NY: 1, OH: 1, OK: 1, OR: 1, PA: 1, RI: 1, SC: 1, SD: 1, TN: 1, TX: 1, UT: 1, VA: 1,
    VT: 1, WA: 1, WI: 1, WV: 1, WY: 1, DC: 1
  };

  function parseLooseDate(s) {
    var text = String(s || "");
    var named = text.match(new RegExp("\\b(" + MONTH_WORD + ")\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?,?\\s+(\\d{4})\\b", "i"));
    if (named) {
      var month = MONTH_INDEX[named[1].toLowerCase()];
      var day = Number(named[2]);
      var year = Number(named[3]);
      var namedDate = new Date(year, month, day);
      if (!isNaN(namedDate.getTime()) && namedDate.getMonth() === month && namedDate.getDate() === day) return namedDate;
    }
    var m = text.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
    if (!m) return null;
    var numYear = Number(m[3]);
    if (numYear < 100) numYear += 2000;
    var date = new Date(numYear, Number(m[1]) - 1, Number(m[2]));
    if (isNaN(date.getTime())) return null;
    return date;
  }

  function monthsBetweenDates(a, b) {
    var da = parseLooseDate(a);
    var db = parseLooseDate(b);
    if (!da || !db) return 0;
    var months = (db.getFullYear() - da.getFullYear()) * 12 + (db.getMonth() - da.getMonth());
    if (db.getDate() < da.getDate() - 2) months -= 1;
    if (months < 0) months = -months;
    return months;
  }

  function frequencyFromMonths(months) {
    if (!(months > 0)) return "";
    if (months < 2) return "monthly";
    if (months < 4.5) return "quarterly";
    if (months < 9) return "semiannual";
    if (months <= 18) return "annual";
    return "";
  }

  function policyTermMonths(blob) {
    var text = String(blob || "");
    var lower = text.toLowerCase();
    var namedDate = "(?:(?:" + MONTH_WORD + ")\\.?\\s+\\d{1,2}(?:st|nd|rd|th)?,?\\s+\\d{4})";
    var named = text.match(new RegExp("(" + namedDate + ")\\s*(?:to|through|-)\\s*(" + namedDate + ")", "i"));
    if (named && /period|policy|effective|term|renewal/.test(lower)) {
      var namedMonths = monthsBetweenDates(named[1], named[2]);
      if (namedMonths >= 1 && namedMonths <= 18) return namedMonths;
    }
    var range = text.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\s*(?:to|through|-)\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);
    if (range && /period|policy|effective|term|renewal/.test(lower)) {
      var months = monthsBetweenDates(range[1], range[2]);
      if (months >= 1 && months <= 18) return months;
    }
    if (/semi-?annual/.test(lower)) return 6;
    var labeled = lower.match(/(?:policy|coverage)\s+period[^.\n]{0,80}?(\d+)\s*-?\s*months?/);
    if (labeled) return Number(labeled[1]) || 0;
    if (/\b6\s*-?\s*months?\b/.test(lower) && /policy|premium|period|term/.test(lower)) return 6;
    if (/\b12\s*-?\s*months?\b|\bone[\s-]*year\b|\bannual policy\b/.test(lower)) return 12;
    if (/\b3\s*-?\s*months?\b/.test(lower) && /policy|premium|period/.test(lower)) return 3;
    return 0;
  }

  function explicitFrequency(text) {
    var w = String(text || "").toLowerCase();
    if (/per\s*month|each\s*month|a\s*month|\/\s*mo\b|monthly\s+premium|premium\s+per\s+month/.test(w)) return "monthly";
    if (/\bmonthly\b/.test(w) && /premium|payment|installment/.test(w)) return "monthly";
    if (/semi-?annual|every\s+six\s+months|6\s*-?\s*months?\s+premium|six[\s-]*month\s+premium/.test(w)) return "semiannual";
    if (/quarterly|per\s+quarter|\/\s*qtr/.test(w)) return "quarterly";
    if (/annual\s+premium|per\s+year|yearly|\/\s*yr\b|12\s*-?\s*months?\s+premium/.test(w)) return "annual";
    return "";
  }

  /* Pay stub adapter interface (Vault → Income)
   * parsePayStubText(text) → {
   *   employer, payPeriodStart, payPeriodEnd, payDate,
   *   gross, net, federalTax, stateTax, socialSecurity, medicare, fica,
   *   employee401k, employer401k, hsa, otherDeductions[], confidence, adapterId
   * }
   * Only fills when labels are clear — never invents taxes or 401k.
   * registerPayStubAdapter(id, fn) adds employer-specific parsers; default is generic-us.
   */
  var PAY_STUB_ADAPTERS = {};

  function emptyPayStubParse(adapterId) {
    return {
      employer: "",
      payPeriodStart: "",
      payPeriodEnd: "",
      payDate: "",
      gross: null,
      net: null,
      federalTax: null,
      stateTax: null,
      socialSecurity: null,
      medicare: null,
      fica: null,
      employee401k: null,
      employer401k: null,
      hsa: null,
      otherDeductions: [],
      confidence: 0,
      adapterId: adapterId || ""
    };
  }

  function registerPayStubAdapter(id, fn) {
    id = String(id || "").replace(/^\s+|\s+$/g, "");
    if (!id || typeof fn !== "function") return;
    PAY_STUB_ADAPTERS[id] = fn;
  }

  function labeledMoneyNear(blob, labelRe) {
    var lines = String(blob || "").split(/\n/);
    var i;
    for (i = 0; i < lines.length; i++) {
      if (!labelRe.test(lines[i])) continue;
      var amts = moneyTokens(lines[i]);
      if (amts.length) return amts[0];
      var nextAmts = moneyTokens(lines[i + 1] || "");
      if (nextAmts.length) return nextAmts[0];
      var prevAmts = moneyTokens(lines[i - 1] || "");
      if (prevAmts.length) return prevAmts[prevAmts.length - 1];
    }
    var flat = String(blob || "").replace(/[ \t]+/g, " ");
    var m = flat.match(labelRe);
    if (!m) return null;
    var slice = flat.slice(m.index, m.index + 120);
    var tokens = moneyTokens(slice);
    return tokens.length ? tokens[0] : null;
  }

  function parsePayStubDateToken(raw) {
    raw = String(raw || "").replace(/^\s+|\s+$/g, "");
    if (!raw) return "";
    var m = raw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
    if (m) {
      var y = Number(m[3]);
      if (y < 100) y += 2000;
      var mo = String(Number(m[1])).length < 2 ? "0" + Number(m[1]) : String(Number(m[1]));
      var d = String(Number(m[2])).length < 2 ? "0" + Number(m[2]) : String(Number(m[2]));
      return y + "-" + mo + "-" + d;
    }
    return raw;
  }

  function parseGenericUsPayStub(text) {
    var out = emptyPayStubParse("generic-us");
    var blob = String(text || "").replace(/\r/g, "\n");
    if (!blob.replace(/\s/g, "")) return out;
    var lower = blob.toLowerCase();
    var score = 0;
    if (/pay\s*stub|earnings\s+statement|paycheck|pay\s+advice/.test(lower)) score += 3;
    if (/gross\s+pay|gross\s+earnings/.test(lower)) score += 2;
    if (/net\s+pay|net\s+earnings|take[\s-]*home/.test(lower)) score += 2;
    if (/\bytd\b|year[\s-]*to[\s-]*date/.test(lower)) score += 1;
    if (/federal\s+(?:income\s+)?tax|social\s+security|medicare/.test(lower)) score += 1;

    var employerLine = blob.match(/(?:^|\n)\s*(?:employer|company|paid\s+by)\s*[:#]\s*([^\n]+)/i);
    if (employerLine) {
      out.employer = String(employerLine[1]).replace(/\s+$/, "").replace(/\s{2,}.*/, "");
      score += 1;
    } else {
      var first = (blob.split(/\n/).filter(function (l) { return l.replace(/\s/g, ""); })[0] || "");
      if (first && !/earnings|pay\s*stub|employee|pay\s+period/i.test(first) && first.length <= 64) {
        out.employer = first.replace(/^\s+|\s+$/g, "");
      }
    }

    var period = blob.match(/pay\s*period\s*[:#]?\s*([0-9\/\-]+)\s*(?:to|through|-|–|—)\s*([0-9\/\-]+)/i);
    if (period) {
      out.payPeriodStart = parsePayStubDateToken(period[1]);
      out.payPeriodEnd = parsePayStubDateToken(period[2]);
      score += 1;
    }
    var payDate = captureLine(blob, /pay\s*date\s*[:#]?\s*([0-9\/\-]+)/i);
    if (payDate) out.payDate = parsePayStubDateToken(payDate);

    var gross = labeledMoneyNear(blob, /gross\s+(?:pay|earnings|wages)\b/i);
    if (gross != null) { out.gross = gross; score += 2; }
    var net = labeledMoneyNear(blob, /(?:net\s+(?:pay|earnings)|take[\s-]*home(?:\s+pay)?)\b/i);
    if (net != null) { out.net = net; score += 2; }

    var fed = labeledMoneyNear(blob, /federal\s+(?:income\s+)?tax\b/i);
    if (fed != null) out.federalTax = fed;
    var state = labeledMoneyNear(blob, /state\s+(?:income\s+)?tax\b/i);
    if (state != null) out.stateTax = state;
    var ss = labeledMoneyNear(blob, /social\s+security\b|\bfica\s*[- ]*ss\b|\boasdi\b/i);
    if (ss != null) out.socialSecurity = ss;
    var med = labeledMoneyNear(blob, /\bmedicare\b/i);
    if (med != null) out.medicare = med;
    if (out.socialSecurity != null || out.medicare != null) {
      out.fica = roundMoney((out.socialSecurity || 0) + (out.medicare || 0));
    } else {
      var ficaOnly = labeledMoneyNear(blob, /\bfica\b(?!\s*[- ]*ss)/i);
      if (ficaOnly != null) out.fica = ficaOnly;
    }

    var e401 = labeledMoneyNear(blob, /401\(?k\)?\s*(?:employee|deferral|contribution|deduction)?|(?:employee|deferral)\s+401\(?k\)?/i);
    if (e401 != null && !/employer|match|company/i.test(String(blob.match(/[^\n]*401[^\n]*/i) || ""))) {
      out.employee401k = e401;
    } else {
      var e401b = labeledMoneyNear(blob, /401\(?k\)?\s*(?:employee\s+)?(?:contribution|deferral|deduction)/i);
      if (e401b != null) out.employee401k = e401b;
    }
    var er401 = labeledMoneyNear(blob, /(?:employer|company)\s+401\(?k\)?(?:\s+match)?|401\(?k\)?\s*(?:employer|match)/i);
    if (er401 != null) out.employer401k = er401;
    // v37.5.59.4: employer non-elective / base 401k (e.g. "DN401NC - 401k Company Base Contribution") —
    // employer money, never earnings or a deduction.
    var ER_BASE_RE = /DN401NC|401\(?k\)?\s+company\s+base|(?:company|employer)\s+base\s+contribution|non[\s-]*elective/i;
    var erBase = labeledMoneyNear(blob, ER_BASE_RE);
    if (erBase != null) out.employer401kBase = erBase;
    // Earnings lines that aren't base pay (bonus / variable) — current + YTD, so a bonus is never projected forward.
    var earnLines = [];
    blob.split(/\n/).forEach(function (line) {
      if (!/bonus|scorecard|incentive|\baward\b|variable|var\s*comp|commission/i.test(line)) return;
      if (/deduction|tax/i.test(line)) return;
      var t = moneyTokens(line);
      if (!t.length) return;
      var nm = line.replace(/\$?[0-9,]+\.[0-9]{2}/g, "").replace(/\b\d+\b/g, "").replace(/^\s+|\s+$/g, "").replace(/\s{2,}/g, " ");
      if (!nm || nm.length > 60) return;
      var hasYtd = /\bytd\b|year[\s-]*to[\s-]*date/i.test(blob);
      earnLines.push({ name: nm, amount: t.length >= 2 ? t[t.length - 2] : (hasYtd ? 0 : t[0]), ytd: hasYtd ? t[t.length - 1] : null });
    });
    if (earnLines.length) out.earningsLines = earnLines;
    var hsa = labeledMoneyNear(blob, /\bhsa\b(?:\s+employee)?|\bhealth\s+savings\b/i);
    if (hsa != null) out.hsa = hsa;

    var other = [];
    var section = "";
    var hasYtdCol = /\bytd\b|year[\s-]*to[\s-]*date/i.test(blob);
    blob.split(/\n/).forEach(function (line) {
      // v37.5.59.3: remember "Pre-tax deductions" / "Post-tax deductions" headers so lines below carry preTax
      if (/pre[\s-]*tax\s+deductions/i.test(line) && !moneyTokens(line).length) { section = "pre"; return; }
      if (/(post|after)[\s-]*tax\s+deductions/i.test(line) && !moneyTokens(line).length) { section = "post"; return; }
      if (/^\s*(taxes|earnings|net\s+pay)\b/i.test(line) && !moneyTokens(line).length) section = "";
      if (!/dental|vision|medical\s+insurance|life\s+insurance|commuter|fsa\b|flexible\s+spending|disability/i.test(line)) return;
      if (/ytd|gross|net\s+pay|federal|medicare|social/i.test(line) && /tax/i.test(line)) return;
      var amts = moneyTokens(line);
      if (!amts.length) return;
      var name = line.replace(/\$?[0-9,]+\.[0-9]{2}/g, "").replace(/^\s+|\s+$/g, "").replace(/\s{2,}/g, " ");
      if (name.length > 2 && name.length < 48) {
        var row = { name: name, amount: amts[0] };
        if (section === "pre" || /\bfsa\b|flexible\s+spending/i.test(name)) row.preTax = true;
        else if (section === "post") row.preTax = false;
        if (hasYtdCol && amts.length >= 2) row.ytd = amts[amts.length - 1];
        other.push(row);
      }
    });
    out.otherDeductions = other;
    // v37.5.59.3: YTD column (last amount on the labeled line) when the stub has one.
    if (hasYtdCol) {
      var ytdOf = function (re) {
        var lines = blob.split(/\n/);
        for (var li = 0; li < lines.length; li++) {
          if (!re.test(lines[li])) continue;
          var t = moneyTokens(lines[li]);
          if (t.length >= 2) return t[t.length - 1];
        }
        return null;
      };
      var ytd = {
        gross: ytdOf(/gross\s+(?:pay|earnings|wages)\b/i),
        net: ytdOf(/(?:net\s+(?:pay|earnings)|take[\s-]*home(?:\s+pay)?)\b/i),
        federalTax: ytdOf(/federal\s+(?:income\s+)?tax\b/i),
        stateTax: ytdOf(/state\s+(?:income\s+)?tax\b/i),
        socialSecurity: ytdOf(/social\s+security\b|\boasdi\b/i),
        medicare: ytdOf(/\bmedicare\b/i),
        employee401k: ytdOf(/401\(?k\)?\s*(?:employee|deferral|contribution|elect)/i),
        employer401k: ytdOf(/(?:employer|company)\s+401\(?k\)?(?:\s+match)?|401\(?k\)?\s*match/i),
        employer401kBase: ytdOf(/DN401NC|401\(?k\)?\s+company\s+base|(?:company|employer)\s+base\s+contribution|non[\s-]*elective/i),
        hsa: ytdOf(/\bhsa\b(?:\s+employee)?|\bhealth\s+savings\b/i)
      };
      var fsaY = 0, preY = 0;
      other.forEach(function (d) {
        if (d.ytd == null) return;
        if (/\bfsa\b|flexible\s+spending/i.test(d.name)) fsaY += d.ytd;
        else if (d.preTax === true) preY += d.ytd;
      });
      if (fsaY) ytd.fsa = roundMoney(fsaY);
      if (preY) ytd.otherPreTax = roundMoney(preY);
      if (ytd.gross != null) out.ytd = ytd;
    }

    if (out.gross != null && out.net != null) score += 1;
    out.confidence = Math.max(0, Math.min(1, score / 12));
    if (out.confidence < 0.15 && out.gross == null && out.net == null) {
      return emptyPayStubParse("generic-us");
    }
    return out;
  }

  function roundMoney(n) {
    return Math.round((Number(n) || 0) * 100) / 100;
  }

  registerPayStubAdapter("generic-us", parseGenericUsPayStub);

  /* v37.5.59.5: Workday pay stub adapter ("Workday BIRT Report Engine" layout, e.g. large employers). Two tables sit side
   * by side on each line (Earnings | Employee Taxes, Pre Tax | Post Tax, Employer Paid Benefits | Taxable Wages),
   * so each line is split into label + numbers segments. Current + YTD columns. Generic parsing mangled this layout. */
  function workdayNum(tok) {
    if (!/^-?[0-9][0-9,]*(?:\.[0-9]+)?$/.test(tok)) return null;
    var n = Number(String(tok).replace(/,/g, ""));
    return isFinite(n) ? n : null;
  }
  function workdaySegments(line) {
    var toks = String(line || "").replace(/^\s+|\s+$/g, "").split(/\s+/);
    var segs = [];
    var cur = null;
    toks.forEach(function (tok) {
      if (!tok) return;
      var n = workdayNum(tok);
      if (n == null) {
        if (!cur || cur.nums.length) { cur = { label: tok, nums: [], raw: [] }; segs.push(cur); }
        else cur.label += " " + tok;
      } else {
        if (!cur) { cur = { label: "", nums: [], raw: [] }; segs.push(cur); }
        cur.nums.push(n); cur.raw.push(tok);
      }
    });
    return segs;
  }
  /* Current amount / YTD from a row's numbers: YTD = last; amount = the money-formatted value before it (else 0). */
  function workdayAmountYtd(seg) {
    var n = seg.nums, r = seg.raw;
    if (!n.length) return { amount: null, ytd: null };
    if (n.length === 1) return { amount: /\./.test(r[0]) ? n[0] : 0, ytd: n[0] };
    var amt = /\.\d{2}$/.test(r[r.length - 2]) ? n[n.length - 2] : 0;
    return { amount: amt, ytd: n[n.length - 1] };
  }
  function parseWorkdayPayStub(text) {
    var out = emptyPayStubParse("workday-us");
    var blob = String(text || "").replace(/\r/g, "\n");
    if (!/Pay Period Begin/i.test(blob) || !/Check Date/i.test(blob) || !/Employee Taxes/i.test(blob) || !/Pre Tax Deductions/i.test(blob)) return out;
    var lines = blob.split(/\n/).map(function (l) { return l.replace(/^\s+|\s+$/g, ""); }).filter(Boolean);
    var ytd = {};
    var i;
    // Employer = first line up to the street number.
    var firstLine = lines[0] || "";
    var emp = firstLine.match(/^([A-Za-z&.,'\- ]+?)\s+\d/);
    if (emp) out.employer = emp[1].replace(/\s+$/, "");
    var summaryCols = null;
    var section = { left: "", right: "" };
    var earningsLines = [];
    var otherTaxes = [], otherDed = [];
    var otherTaxYtd = 0, fsaYtd = 0, otherPreYtd = 0;
    var TAX_RIGHT = /oasdi|social\s+security|medicare|withholding|state\s+tax|\bmn\b|leave|\bsdi\b|\bsui\b|local|city|tax\b/i;
    for (i = 0; i < lines.length; i++) {
      var line = lines[i];
      if (/Pay Period Begin/i.test(line) && /Check Date/i.test(line)) {
        var dates = (lines[i + 1] || "").match(/\d{1,2}\/\d{1,2}\/\d{4}/g) || [];
        if (dates.length >= 3) {
          out.payPeriodStart = parsePayStubDateToken(dates[0]);
          out.payPeriodEnd = parsePayStubDateToken(dates[1]);
          out.payDate = parsePayStubDateToken(dates[2]);
        }
        continue;
      }
      if (/Gross Pay/i.test(line) && /Net Pay/i.test(line) && !/\d/.test(line)) {
        summaryCols = { hours: /Hours Worked/i.test(line) };
        continue;
      }
      if (summaryCols && /^(Current|YTD)\b/.test(line)) {
        var vals = workdaySegments(line)[0];
        var nn = vals ? vals.nums : [];
        if (nn.length >= 5) {
          var L = nn.length;
          var row = { gross: nn[L - 5], pre: nn[L - 4], taxes: nn[L - 3], post: nn[L - 2], net: nn[L - 1] };
          if (/^Current/.test(line)) { out.gross = row.gross; out.net = row.net; out._preTotal = row.pre; out._postTotal = row.post; }
          else { ytd.gross = row.gross; ytd.net = row.net; ytd.preTaxTotal = row.pre; ytd.postTax = row.post; }
        }
        continue;
      }
      if (/^Earnings\s+Employee Taxes$/i.test(line)) { section = { left: "earn", right: "tax" }; continue; }
      if (/^Pre Tax Deductions\s+Post Tax Deductions$/i.test(line)) { section = { left: "pre", right: "post" }; continue; }
      if (/^Employer Paid Benefits\s+Subject or Taxable Wages$/i.test(line)) { section = { left: "er", right: "wages" }; continue; }
      if (/^(Federal\s+State|Marital Status|Payment Information)/i.test(line)) { section = { left: "", right: "" }; continue; }
      if (/^Description\b/i.test(line) || !section.left) continue;
      var segs = workdaySegments(line).filter(function (s) { return s.label && s.nums.length; });
      if (!segs.length) continue;
      var placed = [];
      if (segs.length >= 2) placed = [[section.left, segs[0]], [section.right, segs[1]]];
      else {
        var only = segs[0];
        var right = (section.right === "tax" && TAX_RIGHT.test(only.label)) ||
          (section.right === "wages" && /taxable\s+wages/i.test(only.label)) ||
          (section.right === "post" && /disability|\bltd\b|\bstd\b|roth|after[\s-]*tax|post[\s-]*tax|union|charit|garnish/i.test(only.label));
        placed = [[right ? section.right : section.left, only]];
      }
      placed.forEach(function (p) {
        var kind = p[0], seg = p[1], label = seg.label, ay = workdayAmountYtd(seg);
        if (kind === "earn") {
          if (/^Earnings$/i.test(label)) { out.earnings = ay.amount; ytd.earnings = ay.ytd; return; }
          var dateless = label.replace(/\s*\d{1,2}\/\d{1,2}\/\d{4}\s*-\s*\d{1,2}\/\d{1,2}\/\d{4}\s*/g, " ").replace(/\s{2,}/g, " ").replace(/^\s+|\s+$/g, "");
          var el = { name: dateless, amount: ay.amount || 0, ytd: ay.ytd };
          el.kind = earningsKind(el);
          earningsLines.push(el);
        } else if (kind === "tax") {
          if (/^Employee Taxes$/i.test(label)) return;
          if (/oasdi|social\s+security/i.test(label)) { out.socialSecurity = ay.amount; ytd.socialSecurity = ay.ytd; }
          else if (/medicare/i.test(label)) { out.medicare = ay.amount; ytd.medicare = ay.ytd; }
          else if (/federal\s+withholding|federal\s+income/i.test(label)) { out.federalTax = ay.amount; ytd.federalTax = ay.ytd; }
          else if (/state\s+tax|state\s+income/i.test(label)) { out.stateTax = ay.amount; ytd.stateTax = ay.ytd; }
          else { otherTaxes.push({ name: label, amount: ay.amount || 0 }); otherTaxYtd += ay.ytd || 0; }
        } else if (kind === "pre") {
          if (/^Pre Tax Deductions$/i.test(label)) return;
          if (/401\s*\(?k\)?/i.test(label) && !/roth/i.test(label)) { out.employee401k = ay.amount; ytd.employee401k = ay.ytd; }
          else if (/\bhsa\b|health\s+savings/i.test(label)) { out.hsa = ay.amount; ytd.hsa = ay.ytd; }
          else {
            otherDed.push({ name: label, amount: ay.amount || 0, preTax: true, ytd: ay.ytd });
            if (/\bfsa\b|flexible\s+spending/i.test(label)) fsaYtd += ay.ytd || 0; else otherPreYtd += ay.ytd || 0;
          }
        } else if (kind === "post") {
          if (/^Post Tax Deductions$/i.test(label)) return;
          otherDed.push({ name: label, amount: ay.amount || 0, preTax: false, ytd: ay.ytd });
        } else if (kind === "er") {
          if (/^Employer Paid Benefits$/i.test(label)) return;
          if (/DN401NC|company\s+base|non[\s-]*elective/i.test(label)) { out.employer401kBase = ay.amount; ytd.employer401kBase = ay.ytd; }
          else if (/401\s*\(?k\)?\s*match|match/i.test(label)) { out.employer401k = ay.amount; ytd.employer401k = ay.ytd; }
          else if (/\bhsa\b|health\s+savings/i.test(label)) { out.employerHsa = ay.amount; ytd.employerHsa = ay.ytd; }
        } else if (kind === "wages") {
          if (/federal/i.test(label)) { out.fedTaxableWages = ay.amount; ytd.fedTaxableWages = ay.ytd; }
          else if (/state/i.test(label)) { out.stateTaxableWages = ay.amount; ytd.stateTaxableWages = ay.ytd; }
        }
      });
    }
    out.otherTaxes = otherTaxes;
    out.otherDeductions = otherDed;
    if (earningsLines.length) out.earningsLines = earningsLines;
    if (out.socialSecurity != null || out.medicare != null) out.fica = null;
    if (ytd.gross != null) {
      ytd.otherTaxes = roundMoney(otherTaxYtd);
      if (ytd.hsa == null) ytd.hsa = 0;
      ytd.fsa = roundMoney(fsaYtd);
      ytd.otherPreTax = roundMoney(otherPreYtd);
      out.ytd = ytd;
    }
    delete out._preTotal; delete out._postTotal;
    var score = 0;
    if (out.gross != null) score += 4;
    if (out.net != null) score += 3;
    if (out.payDate) score += 2;
    if (out.federalTax != null) score += 2;
    if (out.ytd) score += 1;
    out.confidence = Math.min(1, score / 12);
    return out.gross != null || out.net != null ? out : emptyPayStubParse("workday-us");
  }
  registerPayStubAdapter("workday-us", parseWorkdayPayStub);

  function parsePayStubText(text, opts) {
    opts = opts || {};
    var preferred = String(opts.adapterId || "").replace(/^\s+|\s+$/g, "");
    var ids = Object.keys(PAY_STUB_ADAPTERS);
    var best = emptyPayStubParse(preferred || "generic-us");
    var i;
    if (preferred && PAY_STUB_ADAPTERS[preferred]) {
      try { best = PAY_STUB_ADAPTERS[preferred](text) || best; } catch (err) {}
      return best;
    }
    for (i = 0; i < ids.length; i++) {
      var parsed;
      try { parsed = PAY_STUB_ADAPTERS[ids[i]](text); } catch (err2) { parsed = null; }
      if (!parsed) continue;
      if ((parsed.confidence || 0) >= (best.confidence || 0)) best = parsed;
    }
    return best;
  }

  function looksLikePayStubText(text) {
    var lower = String(text || "").toLowerCase();
    if (!lower.replace(/\s/g, "")) return false;
    var hits = 0;
    if (/pay\s*stub|earnings\s+statement|paycheck|pay\s+advice/.test(lower)) hits += 2;
    if (/gross\s+pay|gross\s+earnings/.test(lower)) hits += 1;
    if (/net\s+pay|net\s+earnings|take[\s-]*home/.test(lower)) hits += 1;
    if (/\bytd\b|year[\s-]*to[\s-]*date/.test(lower)) hits += 1;
    if (/federal\s+(?:income\s+)?tax/.test(lower)) hits += 1;
    return hits >= 3;
  }

  function annualizePayStubAmount(amount, checksPerYear) {
    amount = Number(amount);
    if (!(amount > 0)) return null;
    var checks = Math.max(1, Math.min(52, Number(checksPerYear) || 26));
    return roundMoney(amount * checks);
  }

  /* v37.5.59.3: compensation is filled from the pay-stub YEAR BASIS (actual YTD + projected remaining
   * checks, capped at IRS limits) when opts.basis (or opts.stubs) is given — never stub × checks for
   * deductions. Base salary still reads as the per-check rate × checks only when no stub has YTD
   * (a salary is a rate; it isn't a deduction projection). Without a basis, pre-tax annualizing is
   * capped at the 2026 IRS limits. */
  function applyPayStubToCompensation(plan, stub, opts) {
    plan = plan && typeof plan === "object" ? plan : {};
    stub = stub || {};
    opts = opts || {};
    var checks = Math.max(1, Math.min(52, Number(opts.paychecksPerYear) || Number(plan.paychecksPerYear) || 26));
    var touched = opts.touched || {};
    var changed = [];
    var stubYear = parseIso(stub.payDate) ? parseIso(stub.payDate).getFullYear() : new Date().getFullYear();
    var basis = opts.basis || null;
    if (!basis && opts.stubs && opts.stubs.length) {
      var withThis = opts.stubs.slice();
      var snapCopy = {};
      Object.keys(stub).forEach(function (k) { snapCopy[k] = stub[k]; });
      snapCopy.confirmedAt = opts.confirmedAt || "x";
      withThis.push(snapCopy);
      basis = payStubYearBasis(withThis, {
        year: stubYear, frequency: opts.frequency, paychecksPerYear: checks,
        hsaCoverage: opts.hsaCoverage, ageAtYearEnd: opts.ageAtYearEnd,
        bonusMonth: opts.bonusMonth, bonusAmount: opts.bonusAmount, bonusTargetPercent: opts.bonusTargetPercent
      });
    }
    var limits = (basis && basis.limits) || pretaxLimitsFor(stubYear, { hsaCoverage: opts.hsaCoverage, ageAtYearEnd: opts.ageAtYearEnd }) ||
      pretaxLimitsFor(2026, { hsaCoverage: opts.hsaCoverage, ageAtYearEnd: opts.ageAtYearEnd });
    var fig = payStubCheckFigures(stub);
    function cappedAnnual(perCheck, cap) {
      var a = annualizePayStubAmount(perCheck, checks);
      if (a == null) return null;
      return cap != null ? Math.min(a, cap) : a;
    }
    if (stub.gross != null && stub.gross > 0 && !touched.baseSalary) {
      var annual = basis && basis.hasYtd ? roundMoney(basis.total.gross) : annualizePayStubAmount(stub.gross, checks);
      if (annual != null) {
        plan.baseSalary = annual;
        changed.push("baseSalary");
      }
    }
    if (!plan.preTax || !plan.preTax.length) {
      plan.preTax = [
        { id: "401k", name: "401k", method: "fixed", value: 0 },
        { id: "hsa", name: "HSA", method: "fixed", value: 0 }
      ];
    }
    function setPreTax(id, annualValue) {
      if (!(annualValue > 0)) return;
      var i;
      for (i = 0; i < plan.preTax.length; i++) {
        if (plan.preTax[i].id === id) {
          if (touched["preTax." + id]) return;
          plan.preTax[i].method = "fixed";
          plan.preTax[i].value = annualValue;
          changed.push(id);
          return;
        }
      }
    }
    var useBasis = !!(basis && basis.hasYtd);
    var a401 = useBasis ? basis.pretax.e401 : cappedAnnual(stub.employee401k, limits && limits.k401);
    if (a401 != null && a401 > 0) {
      setPreTax("401k", a401);
      plan.employee401kValue = a401;
      plan.employee401kIsPercent = false;
    }
    var aHsa = useBasis ? basis.pretax.hsa : cappedAnnual(stub.hsa, limits && limits.hsa);
    if (aHsa != null && aHsa > 0) {
      setPreTax("hsa", aHsa);
      plan.hsaDeferral = aHsa;
    }
    if (!touched.employer401kBase && (useBasis ? basis.total.er401Base > 0 : fig.er401Base > 0)) {
      plan.employer401kBase = useBasis ? roundMoney(basis.total.er401Base) : annualizePayStubAmount(fig.er401Base, checks);
      plan.employer401kBaseIsPercent = false;
      changed.push("employer401kBase");
    }
    var aFsa = useBasis ? basis.pretax.fsa : cappedAnnual(fig.fsa, limits && limits.fsa);
    if (aFsa != null && aFsa > 0) setPreTax("fsa", aFsa);
    if (stub.employer401k != null && stub.employer401k > 0 && !touched.employer401kMatch) {
      var aEr = useBasis ? roundMoney(basis.total.er401) : annualizePayStubAmount(stub.employer401k, checks);
      if (aEr != null) {
        plan.employer401kMatch = aEr;
        plan.employer401kMatchIsPercent = false;
        changed.push("employer401kMatch");
      }
    }
    plan.payStubSnapshot = {
      employer: stub.employer || "",
      payPeriodStart: stub.payPeriodStart || "",
      payPeriodEnd: stub.payPeriodEnd || "",
      payDate: stub.payDate || "",
      gross: stub.gross,
      earnings: stub.earnings != null ? stub.earnings : null,
      net: stub.net,
      federalTax: stub.federalTax,
      stateTax: stub.stateTax,
      socialSecurity: stub.socialSecurity,
      medicare: stub.medicare,
      fica: stub.fica,
      otherTaxes: stub.otherTaxes || [],
      employee401k: stub.employee401k,
      employer401k: stub.employer401k,
      employer401kBase: stub.employer401kBase != null ? stub.employer401kBase : null,
      earningsLines: stub.earningsLines || [],
      hsa: stub.hsa,
      employerHsa: stub.employerHsa != null ? stub.employerHsa : null,
      fsa: stub.fsa != null ? stub.fsa : null,
      otherDeductions: stub.otherDeductions || [],
      fedTaxableWages: stub.fedTaxableWages != null ? stub.fedTaxableWages : null,
      stateTaxableWages: stub.stateTaxableWages != null ? stub.stateTaxableWages : null,
      ytd: stub.ytd && typeof stub.ytd === "object" ? stub.ytd : null,
      adapterId: stub.adapterId || "",
      confirmedAt: opts.confirmedAt || ""
    };
    if (basis) plan.payStubBasisShort = basis.short;
    changed.push("payStubSnapshot");
    return { plan: plan, changed: changed, basis: basis };
  }

  /* ---------------------------------------------------------------------------
   * v37.5.59.3 Pay-stub year basis (owner): taxes and deductions come from ACTUAL year-to-date
   * figures plus a projection of only the checks left in the year — never one stub × checks/year.
   *  1) Actual YTD: the YTD columns on the latest confirmed stub that has them (gross, earnings,
   *     401k, HSA, FSA, other pre-tax, federal, state, FICA, other employee taxes, taxable wages).
   *     Confirmed stubs dated after that one are added check by check. With no YTD anywhere, each
   *     confirmed stub is summed by month (paychecks before the first stub can't be counted).
   *     A pay date between two known stubs with no stub of its own is estimated from the next stub.
   *  2) Remaining checks in the year are projected from the latest stub. Each pre-tax contribution
   *     is capped at its 2026 IRS limit and at what's left under it after YTD, so a front-loaded HSA
   *     stops once it reaches the limit (employer HSA money counts toward the HSA limit).
   *  3) Pre-tax = 401k + HSA + FSA + every other deduction the stub marks pre-tax (preTax: true).
   *     FSA is pre-tax by definition. Unmarked deductions are listed, never guessed.
   * Limits (2026): 401k elective deferral $24,500 (+$8,000 age 50+, $11,250 ages 60–63) — IRS Notice
   * 2025-67 / IR-2025-111. HSA $4,400 self-only, $8,750 family (+$1,000 age 55+) — IRS Rev. Proc. 2025-19.
   * Health FSA salary reduction $3,400 — IRS Rev. Proc. 2025-32 §3.15. Social Security wage base $184,500. */
  var PRETAX_LIMITS = {
    2026: {
      k401: 24500, k401CatchUp50: 8000, k401CatchUp6063: 11250,
      hsaSelf: 4400, hsaFamily: 8750, hsaCatchUp55: 1000,
      healthFsa: 3400, ssWageBase: 184500,
      sources: {
        k401: "IRS Notice 2025-67 (IR-2025-111)",
        hsa: "IRS Rev. Proc. 2025-19",
        fsa: "IRS Rev. Proc. 2025-32"
      }
    }
  };

  function pretaxLimitsFor(year, opts) {
    opts = opts || {};
    var L = PRETAX_LIMITS[Number(year)];
    if (!L) return null;
    var age = opts.ageAtYearEnd == null || opts.ageAtYearEnd === "" ? null : Number(opts.ageAtYearEnd);
    var family = opts.hsaCoverage === "family";
    var k401 = L.k401;
    if (age != null && age >= 60 && age <= 63) k401 += L.k401CatchUp6063;
    else if (age != null && age >= 50) k401 += L.k401CatchUp50;
    var hsa = (family ? L.hsaFamily : L.hsaSelf) + (age != null && age >= 55 ? L.hsaCatchUp55 : 0);
    return {
      year: Number(year), k401: k401, hsa: hsa, fsa: L.healthFsa, ssWageBase: L.ssWageBase,
      hsaCoverage: family ? "family" : "self", ageKnown: age != null, sources: L.sources
    };
  }

  function stubNum(v) {
    if (v == null || v === "") return null;
    var n = Number(v);
    return isFinite(n) ? n : null;
  }

  function isFsaName(name) {
    return /\bfsa\b|flexible\s+spending/i.test(String(name || ""));
  }

  /* v37.5.59.4: earnings lines that aren't base pay. "bonus" = once-a-year style pay (bonus, scorecard,
   * incentive, award); "variable" = recurring variable pay (variable, var comp, commission). Base pay
   * (regular, holiday, vacation, PTO, overtime) is everything else on the Gross Pay line. */
  function earningsKind(line) {
    if (!line) return "base";
    if (line.kind === "bonus" || line.kind === "variable" || line.kind === "base" || line.kind === "imputed") return line.kind;
    var n = String(line.name || "");
    if (/group\s+term\s+life|\bgtl\b|imputed|brkg\s+fee|brokerage\s+fee|taxable\s+fringe/i.test(n)) return "imputed";
    if (/bonus|scorecard|incentive|\baward\b|\bspot\b|sign[\s-]*on|retention/i.test(n)) return "bonus";
    if (/variable|var\s*comp|commission/i.test(n)) return "variable";
    return "base";
  }
  function earningsSplit(lines, which) {
    var out = { bonus: 0, variable: 0, bonusNames: [], variableNames: [] };
    (lines || []).forEach(function (l) {
      if (!l) return;
      var amt = stubNum(which === "ytd" ? l.ytd : l.amount) || 0;
      var k = earningsKind(l);
      if (k === "bonus") { out.bonus += amt; if (amt) out.bonusNames.push(l.name); }
      else if (k === "variable") { out.variable += amt; if (amt) out.variableNames.push(l.name); }
    });
    out.bonus = roundMoney(out.bonus); out.variable = roundMoney(out.variable);
    return out;
  }

  /* Per-check figures from one stub, normalized. */
  function payStubCheckFigures(stub) {
    stub = stub || {};
    var gross = stubNum(stub.gross) || 0;
    var fsa = stubNum(stub.fsa);
    var otherPre = 0, otherPost = 0, unflagged = [], preNames = [];
    (stub.otherDeductions || []).forEach(function (d) {
      if (!d) return;
      var amt = stubNum(d.amount) || 0;
      if (isFsaName(d.name) && d.preTax !== false) { fsa = (fsa || 0) + amt; return; }
      if (d.preTax === true) { otherPre += amt; preNames.push(d.name || "Other"); }
      else if (d.preTax === false) otherPost += amt;
      else if (amt) unflagged.push(d.name || "Other");
    });
    var ss = stubNum(stub.socialSecurity), med = stubNum(stub.medicare), fica = stubNum(stub.fica);
    if (ss == null && med == null && fica != null) { ss = fica; med = 0; }
    var otherTax = 0;
    (stub.otherTaxes || []).forEach(function (t) { otherTax += (t && stubNum(t.amount)) || 0; });
    var earnings = stubNum(stub.earnings);
    var split = earningsSplit(stub.earningsLines, "current");
    var extraPay = roundMoney(Math.min(gross, split.bonus + split.variable));
    return {
      gross: gross,
      bonus: extraPay,
      basePay: roundMoney(gross - extraPay),
      bonusNames: split.bonusNames.concat(split.variableNames),
      earnings: earnings != null && earnings > 0 ? earnings : gross,
      fed: stubNum(stub.federalTax) || 0,
      state: stubNum(stub.stateTax) || 0,
      ss: ss || 0,
      med: med || 0,
      otherTax: roundMoney(otherTax),
      e401: stubNum(stub.employee401k) || 0,
      er401: stubNum(stub.employer401k) || 0,
      // v37.5.59.4: employer non-elective 401k ("DN401NC - 401k Company Base Contribution"). Employer
      // money into the 401k — not earnings, not gross pay, not a deduction from pay.
      er401Base: stubNum(stub.employer401kBase) || 0,
      hsa: stubNum(stub.hsa) || 0,
      erHsa: stubNum(stub.employerHsa) || 0,
      fsa: fsa || 0,
      otherPre: roundMoney(otherPre),
      otherPost: roundMoney(otherPost),
      preNames: preNames,
      unflagged: unflagged
    };
  }

  /* YTD columns → same keys as payStubCheckFigures, or null when the stub has no YTD gross/earnings. */
  function payStubYtdFigures(stub) {
    var y = stub && stub.ytd;
    if (!y || typeof y !== "object") return null;
    var gross = stubNum(y.gross), earnings = stubNum(y.earnings);
    if (!(gross > 0) && !(earnings > 0)) return null;
    var ss = stubNum(y.socialSecurity), med = stubNum(y.medicare), fica = stubNum(y.fica);
    if (ss == null && med == null && fica != null) { ss = fica; med = 0; }
    var missing = [];
    ["federalTax", "stateTax", "employee401k"].forEach(function (k) { if (stubNum(y[k]) == null) missing.push(k); });
    var ysplit = earningsSplit(stub.earningsLines, "ytd");
    var yBonus = stubNum(y.bonus) != null ? stubNum(y.bonus) : ysplit.bonus;
    var yVar = stubNum(y.variablePay) != null ? stubNum(y.variablePay) : ysplit.variable;
    return {
      bonus: roundMoney((yBonus || 0) + (yVar || 0)),
      bonusOnly: roundMoney(yBonus || 0),
      variableOnly: roundMoney(yVar || 0),
      bonusNames: ysplit.bonusNames,
      variableNames: ysplit.variableNames,
      gross: gross != null ? gross : earnings,
      earnings: earnings != null ? earnings : gross,
      fed: stubNum(y.federalTax) || 0,
      state: stubNum(y.stateTax) || 0,
      ss: ss || 0,
      med: med || 0,
      otherTax: stubNum(y.otherTaxes) || 0,
      e401: stubNum(y.employee401k) || 0,
      er401: stubNum(y.employer401k) || 0,
      er401Base: stubNum(y.employer401kBase) || 0,
      hsa: stubNum(y.hsa) || 0,
      erHsa: stubNum(y.employerHsa) || 0,
      fsa: stubNum(y.fsa) || 0,
      otherPre: stubNum(y.otherPreTax) || 0,
      fedTaxable: stubNum(y.fedTaxableWages),
      stateTaxable: stubNum(y.stateTaxableWages),
      missing: missing
    };
  }

  var BASIS_KEYS = ["gross", "bonus", "earnings", "fed", "state", "ss", "med", "otherTax", "e401", "er401", "er401Base", "hsa", "erHsa", "fsa", "otherPre"];
  function basisZero() {
    var o = {};
    BASIS_KEYS.forEach(function (k) { o[k] = 0; });
    o.fedTaxable = 0; o.stateTaxable = 0;
    return o;
  }
  function basisAdd(into, f, scale) {
    scale = scale == null ? 1 : scale;
    BASIS_KEYS.forEach(function (k) { into[k] = roundMoney(into[k] + (Number(f[k]) || 0) * scale); });
    into.fedTaxable = roundMoney(into.fedTaxable + (Number(f.fedTaxable) || 0) * scale);
    into.stateTaxable = roundMoney(into.stateTaxable + (Number(f.stateTaxable) || 0) * scale);
    return into;
  }
  function checkTaxable(f) {
    return roundMoney(Math.max(0, f.earnings - f.e401 - f.hsa - f.fsa - f.otherPre));
  }

  function isoOf(d) {
    var m = d.getMonth() + 1, day = d.getDate();
    return d.getFullYear() + "-" + (m < 10 ? "0" + m : m) + "-" + (day < 10 ? "0" + day : day);
  }
  function parseIso(s) {
    var m = String(s || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
  }
  function frequencyId(freq, checks) {
    var f = String(freq || "").toLowerCase().replace(/[\s-]/g, "");
    if (f === "weekly" || f === "biweekly" || f === "semimonthly" || f === "monthly") return f;
    var n = Number(checks);
    return n === 52 ? "weekly" : n === 24 ? "semimonthly" : n === 12 ? "monthly" : "biweekly";
  }
  function lastDay(y, m) { return new Date(y, m + 1, 0).getDate(); }
  /* Next / previous pay date on the stub's schedule. */
  function stepPayDate(d, freq, dir) {
    var y = d.getFullYear(), m = d.getMonth(), day = d.getDate();
    if (freq === "weekly") return new Date(y, m, day + 7 * dir);
    if (freq === "biweekly") return new Date(y, m, day + 14 * dir);
    if (freq === "monthly") {
      var nm = m + dir, ny = y + Math.floor(nm / 12);
      nm = ((nm % 12) + 12) % 12;
      return new Date(ny, nm, Math.min(day, lastDay(ny, nm)));
    }
    // semimonthly: the 15th and the last day of the month
    if (dir > 0) return day < 15 ? new Date(y, m, 15) : (day < lastDay(y, m) ? new Date(y, m, lastDay(y, m)) : new Date(y, m + 1, 15));
    if (day > 15) return new Date(y, m, 15);
    return new Date(y, m, 0); // last day of the previous month
  }
  function payDatesBetween(fromIso, toIso, freq) {
    // pay dates strictly after from and strictly before to
    var out = [], d = parseIso(fromIso), end = parseIso(toIso);
    if (!d || !end) return out;
    for (var guard = 0; guard < 60; guard++) {
      d = stepPayDate(d, freq, 1);
      if (d >= end) break;
      if (Math.abs(d - end) < 2 * 86400000) break; // the known stub's own date (schedule drift)
      out.push(isoOf(d));
    }
    return out;
  }
  function shortDate(iso) {
    var d = parseIso(iso);
    return d ? BASIS_MONTH_SHORT[d.getMonth()] + " " + d.getDate() : String(iso || "");
  }
  var BASIS_MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  /* stubs: confirmed stub objects (any year). opts: { year, frequency, paychecksPerYear, ageAtYearEnd, hsaCoverage }.
   * Returns null when no confirmed stub is dated in that year. */
  function payStubYearBasis(stubs, opts) {
    opts = opts || {};
    var year = Number(opts.year) || new Date().getFullYear();
    var freq = frequencyId(opts.frequency, opts.paychecksPerYear);
    var seen = {};
    var list = (stubs || []).filter(function (s) {
      if (!s || typeof s !== "object") return false;
      var d = parseIso(s.payDate);
      return d && d.getFullYear() === year && (stubNum(s.gross) > 0 || stubNum(s.earnings) > 0);
    }).sort(function (a, b) { return a.payDate < b.payDate ? -1 : a.payDate > b.payDate ? 1 : (payStubYtdFigures(a) ? 1 : -1); });
    list = list.filter(function (s, i) {
      // one stub per pay date — keep the richest (YTD wins, then the later in the list)
      var nextSame = list[i + 1] && list[i + 1].payDate === s.payDate;
      if (nextSame) return false;
      if (seen[s.payDate]) return false;
      seen[s.payDate] = true;
      return true;
    });
    if (!list.length) return null;
    var limits = pretaxLimitsFor(year, opts);
    var anchorIdx = -1;
    list.forEach(function (s, i) { if (payStubYtdFigures(s)) anchorIdx = i; });
    var checks = [];   // dated checks with figures: kind stub | estimated | projected | ytd-spread
    var actual = basisZero();
    var notes = [];
    var ytdMissing = [];
    var anchor = anchorIdx >= 0 ? list[anchorIdx] : null;
    var firstCounted = anchor ? anchorIdx + 1 : 0;
    var ytdBonusPlaced = null;
    var y = null;
    if (anchor) {
      y = payStubYtdFigures(anchor);
      ytdMissing = y.missing;
      basisAdd(actual, y);
      actual.fedTaxable = y.fedTaxable != null ? y.fedTaxable : checkTaxable(y);
      actual.stateTaxable = y.stateTaxable != null ? y.stateTaxable : actual.fedTaxable;
      // Spread the YTD across the year's pay dates up to the anchor (known earlier stubs keep their own figures).
      var back = [];
      var d = parseIso(anchor.payDate);
      for (var g = 0; g < 60; g++) {
        d = stepPayDate(d, freq, -1);
        if (d.getFullYear() !== year) break;
        back.push(isoOf(d));
      }
      var anchorF = payStubCheckFigures(anchor);
      anchorF.fedTaxable = checkTaxable(anchorF);
      anchorF.stateTaxable = anchorF.fedTaxable;
      var rest = basisAdd(basisZero(), actual);
      basisAdd(rest, anchorF, -1);
      checks.push({ date: anchor.payDate, kind: "stub", f: anchorF });
      var known = {};
      list.slice(0, anchorIdx).forEach(function (s) { known[s.payDate] = s; });
      var spreadDates = [];
      back.forEach(function (iso) {
        var hit = null;
        Object.keys(known).forEach(function (k) { if (Math.abs(parseIso(k) - parseIso(iso)) < 3 * 86400000) hit = known[k]; });
        if (hit) {
          var hf = payStubCheckFigures(hit);
          hf.fedTaxable = checkTaxable(hf); hf.stateTaxable = hf.fedTaxable;
          basisAdd(rest, hf, -1);
          checks.push({ date: hit.payDate, kind: "stub", f: hf });
        } else spreadDates.push(iso);
      });
      if (spreadDates.length) {
        // v37.5.59.4: a once-a-year bonus in the YTD sits on its own pay date (bonus month), not smeared.
        var bMonth = Number(opts.bonusMonth) || 0;
        var bonusOnlyRest = roundMoney(Math.max(0, Math.min(y.bonusOnly || 0, rest.bonus)));
        var bonusDate = null;
        if (bMonth >= 1 && bMonth <= 12 && bonusOnlyRest > 0) {
          spreadDates.slice().sort().forEach(function (iso) { if (!bonusDate && parseIso(iso).getMonth() + 1 === bMonth) bonusDate = iso; });
        }
        var pool = basisAdd(basisZero(), rest);
        if (bonusDate) { pool.gross = roundMoney(pool.gross - bonusOnlyRest); pool.earnings = roundMoney(pool.earnings - bonusOnlyRest); pool.bonus = roundMoney(pool.bonus - bonusOnlyRest); }
        spreadDates.forEach(function (iso) {
          var share = basisAdd(basisZero(), pool, 1 / spreadDates.length);
          if (iso === bonusDate) { share.gross = roundMoney(share.gross + bonusOnlyRest); share.earnings = roundMoney(share.earnings + bonusOnlyRest); share.bonus = roundMoney(share.bonus + bonusOnlyRest); }
          checks.push({ date: iso, kind: "ytd", f: share });
        });
        if (bonusDate) ytdBonusPlaced = { date: bonusDate, amount: bonusOnlyRest };
      } else if (Math.abs(rest.gross) > 0.005) {
        checks.push({ date: anchor.payDate, kind: "ytd", f: rest });
      }
    }
    // Known stubs after the anchor (or all, with no YTD) + estimated gaps between them.
    var prevDate = anchor ? anchor.payDate : null;
    var estimated = [];
    var capped = { e401: 0, hsa: 0, fsa: 0 };
    var used = { e401: actual.e401, hsa: actual.hsa + actual.erHsa, fsa: actual.fsa, ssWages: 0 };
    function applyCaps(f) {
      // f: raw per-check figures → capped copy (sequential, date order)
      var c = {};
      BASIS_KEYS.forEach(function (k) { c[k] = f[k]; });
      if (limits) {
        var room401 = Math.max(0, limits.k401 - used.e401);
        c.e401 = roundMoney(Math.min(f.e401, room401));
        if (f.e401 > 0 && c.e401 < f.e401) {
          capped.e401 += roundMoney(f.e401 - c.e401);
          c.er401 = roundMoney(f.er401 * (c.e401 / f.e401));
        }
        var roomHsa = Math.max(0, limits.hsa - used.hsa);
        c.erHsa = roundMoney(Math.min(f.erHsa, roomHsa));
        roomHsa = Math.max(0, roomHsa - c.erHsa);
        c.hsa = roundMoney(Math.min(f.hsa, roomHsa));
        if (c.hsa < f.hsa) capped.hsa += roundMoney(f.hsa - c.hsa);
        var roomFsa = Math.max(0, limits.fsa - used.fsa);
        c.fsa = roundMoney(Math.min(f.fsa, roomFsa));
        if (c.fsa < f.fsa) capped.fsa += roundMoney(f.fsa - c.fsa);
      }
      used.e401 += c.e401; used.hsa += c.hsa + c.erHsa; used.fsa += c.fsa;
      c.fedTaxable = checkTaxable(c);
      c.stateTaxable = c.fedTaxable;
      return c;
    }
    // v37.5.59.4: a check we have to estimate or project is BASE pay only — a bonus/variable amount on
    // the stub it's copied from is never repeated (bonuses are projected only from the bonus month).
    /* v37.5.59.5: taxable non-cash earnings (Earnings − Gross pay: group-term life, brokerage fee, other imputed
     * income) repeat on estimated/projected checks only at the smallest per-check amount seen on any stub this
     * year. A one-off imputed item on the latest stub (an Earnings line above gross) is
     * counted once, on its own check — it used to be copied onto every projected check. */
    var recurringImputed = null;
    list.forEach(function (s) {
      var sf = payStubCheckFigures(s);
      var imp = roundMoney(Math.max(0, sf.earnings - sf.gross));
      if (recurringImputed == null || imp < recurringImputed) recurringImputed = imp;
    });
    if (recurringImputed == null) recurringImputed = 0;
    function baseOnly(f) {
      var b = {};
      Object.keys(f).forEach(function (k) { b[k] = f[k]; });
      if (f.bonus > 0) {
        b.gross = roundMoney(f.gross - f.bonus);
        b.earnings = roundMoney(Math.max(b.gross, f.earnings - f.bonus));
        b.bonus = 0;
      }
      b.earnings = roundMoney(Math.min(b.earnings, b.gross + recurringImputed));
      return b;
    }
    var counted = list.slice(firstCounted);
    var actualAfter = basisZero();
    counted.forEach(function (s) {
      var f = payStubCheckFigures(s);
      if (prevDate) {
        payDatesBetween(prevDate, s.payDate, freq).forEach(function (iso) {
          var ef = applyCaps(baseOnly(f));
          estimated.push({ date: iso, from: s.payDate });
          checks.push({ date: iso, kind: "estimated", from: s.payDate, f: ef });
          basisAdd(actualAfter, ef);
        });
      }
      // a confirmed stub is actual — not capped, it already happened
      var af = {};
      BASIS_KEYS.forEach(function (k) { af[k] = f[k]; });
      used.e401 += af.e401; used.hsa += af.hsa + af.erHsa; used.fsa += af.fsa;
      af.fedTaxable = checkTaxable(af); af.stateTaxable = af.fedTaxable;
      checks.push({ date: s.payDate, kind: "stub", f: af });
      basisAdd(actualAfter, af);
      prevDate = s.payDate;
    });
    var latest = list[list.length - 1];
    var latestRaw = payStubCheckFigures(latest);
    var latestF = baseOnly(latestRaw);
    var projected = [];
    var projTotals = basisZero();
    var ssCap = limits ? limits.ssWageBase * 0.062 : Infinity;
    var ssSoFar = actual.ss + actualAfter.ss;
    /* v37.5.59.15 year-end salary target: remaining base pay = target − base pay already paid (YTD + later stubs),
     * spread evenly over the remaining projected checks. Each projected check is the latest check's figures scaled to
     * that gross; the IRS caps (401k/HSA/FSA, Social Security wage base) still apply afterwards. Paid actuals are untouched. */
    var targetInfo = null;
    var latestProj = latestF;
    var tgtAmt = stubNum(opts.salaryTarget);
    if (tgtAmt > 0) {
      var nProj = 0;
      var dc = parseIso(latest.payDate);
      for (var pc = 0; pc < 60; pc++) { dc = stepPayDate(dc, freq, 1); if (dc.getFullYear() !== year) break; nProj++; }
      var paidBase = roundMoney((actual.gross - actual.bonus) + (actualAfter.gross - actualAfter.bonus));
      var remainingBase = roundMoney(tgtAmt - paidBase);
      targetInfo = { target: roundMoney(tgtAmt), paidBase: paidBase, remaining: remainingBase, checksLeft: nProj, perCheck: null, status: "ignored", note: "" };
      if (nProj === 0) targetInfo.note = "No paychecks left this year, so the year-end target can’t change anything.";
      else if (!(remainingBase > 0)) targetInfo.note = "The target is at or below what’s already paid (" + moneyLabel(paidBase) + "), so it’s ignored.";
      else if (!(latestF.gross > 0)) targetInfo.note = "The latest stub has no gross pay to scale from, so the target is ignored.";
      else {
        var perCheck = roundMoney(remainingBase / nProj);
        var scale = perCheck / latestF.gross;
        latestProj = {};
        Object.keys(latestF).forEach(function (k) { latestProj[k] = latestF[k]; });
        BASIS_KEYS.forEach(function (k) { latestProj[k] = roundMoney((latestF[k] || 0) * scale); });
        targetInfo.perCheck = perCheck;
        targetInfo.status = "applied";
        targetInfo.note = "Year-end salary target " + moneyLabel(tgtAmt) + ": " + moneyLabel(remainingBase) + " left after " + moneyLabel(paidBase) +
          " paid, spread over " + nProj + " remaining check" + (nProj === 1 ? "" : "s") + " (" + moneyLabel(perCheck) + " gross each).";
      }
    }
    var dd = parseIso(latest.payDate);
    for (var p = 0; p < 60; p++) {
      dd = stepPayDate(dd, freq, 1);
      if (dd.getFullYear() !== year) break;
      var pf = applyCaps(latestProj);
      var ssRoom = Math.max(0, ssCap - ssSoFar);
      pf.ss = roundMoney(Math.min(pf.ss, ssRoom));
      ssSoFar += pf.ss;
      projected.push(isoOf(dd));
      checks.push({ date: isoOf(dd), kind: "projected", f: pf });
      basisAdd(projTotals, pf);
    }
    var projBase = basisAdd(basisZero(), projTotals);
    /* v37.5.59.4 bonus: projected only when its month hasn't happened yet. opts.bonusMonth (1–12) is the
     * user's setting; without it, bonus pay found in the YTD is counted as paid and nothing is projected.
     * Amount: opts.bonusAmount (typed Income-statement bonus), else opts.bonusTargetPercent × base pay.
     * Withholding on a projected bonus uses the supplemental flat rates: federal 22% (IRS Pub. 15 (2026) §7),
     * Minnesota 6.25% (MN Revenue, Supplemental Payments), plus Social Security (to the wage base) + Medicare. */
    var bMo = Number(opts.bonusMonth) || 0;
    if (!(bMo >= 1 && bMo <= 12)) bMo = 0;
    var latestMo = parseIso(latest.payDate).getMonth() + 1;
    var bonusYtdOnly = roundMoney((y ? y.bonusOnly : 0));
    var bonusYtdNames = y ? y.bonusNames : [];
    var variableYtd = roundMoney(y ? y.variableOnly : 0);
    var variableNames = y ? y.variableNames : [];
    var bonusAfter = 0;
    counted.forEach(function (s) { bonusAfter += payStubCheckFigures(s).bonus || 0; });
    var bonusInfo = { month: bMo || null, ytdBonus: roundMoney(bonusYtdOnly), ytdBonusNames: bonusYtdNames, ytdVariable: variableYtd,
      ytdVariableNames: variableNames, laterStubBonus: roundMoney(bonusAfter), projected: 0, projectedDate: null, status: "none", note: "" };
    var MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    var annualBasePay = roundMoney((actual.gross - actual.bonus) + (actualAfter.gross - actualAfter.bonus) + projBase.gross);
    var bonusAmt = stubNum(opts.bonusAmount);
    var bonusFrom = "typed bonus";
    if (!(bonusAmt > 0) && stubNum(opts.bonusTargetPercent) > 0) { bonusAmt = roundMoney(annualBasePay * stubNum(opts.bonusTargetPercent) / 100); bonusFrom = opts.bonusTargetPercent + "% bonus target × base pay"; }
    var foundTxt = bonusYtdOnly > 0 ? moneyLabel(bonusYtdOnly) + (bonusYtdNames.length ? " (" + bonusYtdNames.join(", ") + ")" : "") : "";
    if (bMo) {
      var paidThisMonth = bMo === latestMo && (latestRaw.bonus > 0);
      var firstInMonth = null;
      projected.forEach(function (iso) { if (!firstInMonth && parseIso(iso).getMonth() + 1 === bMo) firstInMonth = iso; });
      if (bMo < latestMo || paidThisMonth || (bMo === latestMo && !firstInMonth)) {
        bonusInfo.status = "paid";
        bonusInfo.note = MONTHS_LONG[bMo - 1] + " bonus has already paid" + (foundTxt ? " — " + foundTxt + " is in the YTD" : " (it’s in the YTD)") + ", so no bonus is projected.";
      } else if (!firstInMonth) {
        bonusInfo.status = "no-check";
        bonusInfo.note = "No " + MONTHS_LONG[bMo - 1] + " paycheck left on the schedule, so no bonus is projected.";
      } else if (!(bonusAmt > 0)) {
        bonusInfo.status = "no-amount";
        bonusInfo.note = "Bonus month is " + MONTHS_LONG[bMo - 1] + ", but there’s no amount — type the bonus on the Income statement (or set a bonus target %) to project it.";
      } else {
        var bf = basisZero();
        bf.gross = bonusAmt; bf.earnings = bonusAmt; bf.bonus = bonusAmt;
        bf.fed = roundMoney(bonusAmt * 0.22);
        bf.state = roundMoney(bonusAmt * (stubNum(opts.stateSupplementalRate) != null ? stubNum(opts.stateSupplementalRate) : 0.0625));
        var ssRoomB = Math.max(0, ssCap - ssSoFar);
        bf.ss = roundMoney(Math.min(bonusAmt * 0.062, ssRoomB)); ssSoFar += bf.ss;
        bf.med = roundMoney(bonusAmt * 0.0145);
        bf.fedTaxable = bonusAmt; bf.stateTaxable = bonusAmt;
        checks.push({ date: firstInMonth, kind: "projected-bonus", f: bf });
        basisAdd(projTotals, bf);
        bonusInfo.status = "projected"; bonusInfo.projected = bonusAmt; bonusInfo.projectedDate = firstInMonth;
        bonusInfo.note = "Projected " + MONTHS_LONG[bMo - 1] + " bonus " + moneyLabel(bonusAmt) + " (" + bonusFrom + ") on " + shortDate(firstInMonth) +
          ", withheld at the supplemental rates (federal 22%, IRS Pub. 15; MN 6.25%) + FICA.";
      }
    } else if (bonusYtdOnly > 0) {
      bonusInfo.status = "in-ytd";
      bonusInfo.note = "Bonus pay in the YTD: " + foundTxt + " — counted as paid. Set the bonus month to project a future bonus.";
    } else {
      bonusInfo.status = "none";
      bonusInfo.note = "No bonus month set and no bonus in the YTD, so no bonus is projected.";
    }
    if (variableYtd > 0) bonusInfo.note += " Variable pay so far (" + variableNames.join(", ") + " " + moneyLabel(variableYtd) + ") is in the YTD; future variable pay isn’t projected.";
    if (latestRaw.bonus > 0) bonusInfo.note += " The " + shortDate(latest.payDate) + " stub had " + moneyLabel(latestRaw.bonus) + " bonus/variable pay; projected checks use its base pay " + moneyLabel(latestRaw.basePay) + ".";
    var total = basisAdd(basisAdd(basisAdd(basisZero(), actual), actualAfter), projTotals);
    var actualAll = basisAdd(basisAdd(basisZero(), actual), actualAfter);
    var taxSum = function (o) { return roundMoney(o.fed + o.state + o.ss + o.med + o.otherTax); };
    // v37.5.59.4: gross pay = actual YTD gross (stub) + checks since + projected BASE pay + projected bonus.
    var grossPay = {
      actual: roundMoney(actualAll.gross), ytdStub: anchor ? roundMoney(actual.gross) : null, afterYtd: roundMoney(actualAfter.gross),
      projectedBase: roundMoney(projBase.gross), projectedBonus: roundMoney(bonusInfo.projected),
      total: roundMoney(total.gross), bonusTotal: roundMoney(total.bonus), basePay: roundMoney(total.gross - total.bonus),
      // v37.5.59.5: taxable earnings above gross pay (imputed income), for the bracket ⓘ.
      earnings: roundMoney(total.earnings), imputed: roundMoney(Math.max(0, total.earnings - total.gross)), recurringImputed: recurringImputed
    };
    var pretax = {
      e401: total.e401, hsa: total.hsa, fsa: total.fsa, otherPre: total.otherPre,
      total: roundMoney(total.e401 + total.hsa + total.fsa + total.otherPre)
    };
    // Months (1..12): every dated check lands in its month.
    var months = {};
    checks.forEach(function (c) {
      var mo = parseIso(c.date).getMonth() + 1;
      if (!months[mo]) { months[mo] = basisZero(); months[mo].kinds = {}; months[mo].dates = []; }
      basisAdd(months[mo], c.f);
      months[mo].kinds[c.kind] = (months[mo].kinds[c.kind] || 0) + 1;
      if (c.kind !== "ytd") months[mo].dates.push({ date: c.date, kind: c.kind });
    });
    // Copy for the ⓘ.
    var lastActual = latest.payDate;
    var parts = [];
    if (anchor) parts.push("pay stub YTD through " + shortDate(anchor.payDate));
    var laterStubs = counted.map(function (s) { return shortDate(s.payDate); });
    if (laterStubs.length) parts.push((anchor ? "the " : "") + laterStubs.join(", ") + " stub" + (laterStubs.length === 1 ? "" : "s"));
    var short = "Actual through " + shortDate(lastActual) +
      (estimated.length ? " (" + estimated.length + " check" + (estimated.length === 1 ? "" : "s") + " without a stub estimated)" : "") +
      " + projected " + projected.length + " check" + (projected.length === 1 ? "" : "s") +
      (bonusInfo.status === "projected" ? " + " + MONTHS_LONG[bMo - 1].slice(0, 3) + " bonus" : "");
    var long = "Actual: " + parts.join(" + ") + ".";
    if (estimated.length) {
      long += " Estimated (no stub): " + estimated.map(function (e) { return shortDate(e.date) + " from the " + shortDate(e.from) + " stub"; }).join(", ") + ".";
    }
    if (projected.length) {
      long += " Projected: " + projected.length + " check" + (projected.length === 1 ? "" : "s") + " (" + shortDate(projected[0]) +
        (projected.length > 1 ? "–" + shortDate(projected[projected.length - 1]) : "") + ") from the " + shortDate(latest.payDate) + " stub.";
    } else long += " No checks left this year.";
    if (!anchor) {
      long += " No stub has YTD columns, so 2026 paychecks before " + shortDate(list[0].payDate) + " aren’t counted.";
      notes.push("no-ytd");
    }
    if (limits) {
      var capBits = [];
      if (capped.hsa > 0) capBits.push("HSA stops at the " + year + " " + (limits.hsaCoverage === "family" ? "family" : "self-only") + " limit " + moneyLabel(limits.hsa) + " (" + limits.sources.hsa + ")");
      if (capped.e401 > 0) capBits.push("401k stops at the " + moneyLabel(limits.k401) + " deferral limit (" + limits.sources.k401 + ")");
      if (capped.fsa > 0) capBits.push("FSA stops at the " + moneyLabel(limits.fsa) + " limit (" + limits.sources.fsa + ")");
      if (capBits.length) long += " " + capBits.join("; ") + ".";
    }
    var latestImputed = roundMoney(Math.max(0, latestRaw.earnings - latestRaw.gross));
    var oneOffImputed = roundMoney(latestImputed - recurringImputed);
    if (oneOffImputed > 0.005 && (projected.length || estimated.length)) {
      long += " The " + shortDate(latest.payDate) + " stub's taxable earnings (" + moneyLabel(latestRaw.earnings) + ") were " + moneyLabel(latestImputed) +
        " more than its gross pay (" + moneyLabel(latestRaw.gross) + ") — taxable pay you didn't get in cash. That's counted once, on that check;" +
        " estimated and projected checks carry " + (recurringImputed > 0 ? moneyLabel(recurringImputed) + " per check, the smallest amount on any stub this year." : "none of it.");
      notes.push("one-off-imputed");
    }
    var unflagged = latestF.unflagged.slice();
    if (unflagged.length) long += " Not marked pre-tax on the stub, so not counted: " + unflagged.join(", ") + ".";
    if (total.er401Base > 0) long += " Employer 401k base contribution (DN401NC) " + moneyLabel(total.er401Base) + " is employer money into your 401k — not pay and not a deduction.";
    return {
      year: year,
      frequency: freq,
      hasYtd: !!anchor,
      anchorDate: anchor ? anchor.payDate : null,
      latestDate: latest.payDate,
      stubCount: list.length,
      actual: actualAll,
      ytdFromStub: anchor ? actual : null,
      projectedTotals: projTotals,
      total: total,
      pretax: pretax,
      capped: capped,
      limits: limits,
      salaryTarget: targetInfo,
      taxes: {
        fed: total.fed, state: total.state, fica: roundMoney(total.ss + total.med), otherTax: total.otherTax,
        total: roundMoney(total.fed + total.state + total.ss + total.med + total.otherTax)
      },
      fedTaxableWages: total.fedTaxable,
      stateTaxableWages: total.stateTaxable,
      grossPay: grossPay,
      taxesActual: taxSum(actualAll),
      taxesProjected: taxSum(projTotals),
      bonus: bonusInfo,
      ytdBonusPlaced: ytdBonusPlaced,
      estimated: estimated,
      projected: projected,
      months: months,
      checks: checks,
      ytdMissing: ytdMissing,
      unflagged: unflagged,
      short: short,
      long: long,
      notes: notes
    };
  }

  /* One month's stub figures from a basis (for True). null when no paycheck in the basis lands in that month. */
  function payStubBasisMonth(basis, month) {
    if (!basis || !basis.months) return null;
    var m = basis.months[Number(month)];
    if (!m || !(m.gross > 0)) return null;
    var kinds = m.kinds || {};
    var bits = [];
    if (kinds.ytd) bits.push(kinds.ytd + " paycheck" + (kinds.ytd === 1 ? "" : "s") + " from stub YTD (spread evenly)");
    var stubDates = (m.dates || []).filter(function (d) { return d.kind === "stub"; }).map(function (d) { return shortDate(d.date); });
    var estDates = (m.dates || []).filter(function (d) { return d.kind === "estimated"; }).map(function (d) { return shortDate(d.date); });
    var projDates = (m.dates || []).filter(function (d) { return d.kind === "projected"; }).map(function (d) { return shortDate(d.date); });
    if (stubDates.length) bits.push("actual " + stubDates.join(", ") + " stub" + (stubDates.length === 1 ? "" : "s"));
    if (estDates.length) bits.push(estDates.join(", ") + " estimated (no stub)");
    if (projDates.length) bits.push("projected " + projDates.join(", "));
    var bonusDates = (m.dates || []).filter(function (d) { return d.kind === "projected-bonus"; }).map(function (d) { return shortDate(d.date); });
    if (bonusDates.length) bits.push("projected bonus " + bonusDates.join(", "));
    if (basis.ytdBonusPlaced && parseIso(basis.ytdBonusPlaced.date).getMonth() + 1 === Number(month)) bits.push("bonus " + moneyLabel(basis.ytdBonusPlaced.amount) + " from YTD on " + shortDate(basis.ytdBonusPlaced.date));
    return {
      gross: m.gross, employee401k: m.e401, employer401k: m.er401, employer401kBase: m.er401Base || 0, bonus: m.bonus || 0,
      hsa: roundMoney(m.hsa), employerHsa: m.erHsa,
      fsa: m.fsa, otherPre: m.otherPre, checks: (m.dates || []).filter(function (d) { return d.kind !== "projected-bonus"; }).length + (kinds.ytd || 0),
      note: bits.join(" · ")
    };
  }

  /* ---------------------------------------------------------------------------
   * v37.5.14 Ledger math — Expense vs Income transactions, refunds, savings rates.
   * Pure functions. Never invent numbers: missing inputs → null (UI shows "—").
   *
   * Transaction shape (app.js):
   *   { id, type: "expense"|"income" (missing = expense), payee, date, note,
   *     amount, categoryId, lineId, refund,          // single-envelope expense
   *     legs: [{ categoryId, lineId, amount, refund, note }],  // split expense
   *     refundKind: "" | "full" | "partial" | "standalone",
   *     incomeId }                                    // income only
   *
   * Refund model (one coherent model):
   *   - Refunds live on the expense leg (envelope). leg.amount is always the positive
   *     money amount; leg.refund is the money that came back to THAT envelope.
   *   - "full":       every leg nets to $0 (refund = amount).
   *   - "partial":    leg.refund dollars (0..amount) come back per leg — works inside splits.
   *   - "standalone": money back from a store with no purchase this month; the whole
   *                   leg.amount is a refund → envelope spent goes DOWN by that amount.
   *   - Refunds are never income and never raise Received.
   *   - Income transactions carry incomeId → count toward that income line's Received;
   *     they never count as spending.
   * ------------------------------------------------------------------------- */
  var REFUND_KINDS = ["", "full", "partial", "standalone"];

  function ledgerCents(n) {
    var v = Number(n);
    if (!isFinite(v)) return 0;
    return Math.round(v * 100) / 100;
  }

  function txType(tx) {
    return tx && tx.type === "income" ? "income" : "expense";
  }

  function normalizeRefundKind(kind) {
    return REFUND_KINDS.indexOf(kind) >= 0 ? kind : "";
  }

  function ledgerLegs(tx) {
    if (!tx) return [];
    if (tx.legs && tx.legs.length) return tx.legs;
    return [{
      categoryId: tx.categoryId,
      lineId: tx.lineId,
      amount: tx.amount,
      refund: tx.refund,
      note: tx.note || ""
    }];
  }

  /* Per-envelope breakdown of an expense: purchase, refund, net (net may be < 0 for standalone). */
  function txLegBreakdown(tx) {
    if (!tx || txType(tx) === "income") return [];
    var kind = normalizeRefundKind(tx.refundKind);
    return ledgerLegs(tx).map(function (leg) {
      var amount = Math.max(0, ledgerCents(leg && leg.amount));
      var purchase = amount;
      var refund = 0;
      if (kind === "full") refund = amount;
      else if (kind === "partial") refund = Math.min(amount, Math.max(0, ledgerCents(leg && leg.refund)));
      else if (kind === "standalone") { purchase = 0; refund = amount; }
      return {
        categoryId: leg ? leg.categoryId : "",
        lineId: leg ? leg.lineId : "",
        purchase: ledgerCents(purchase),
        refund: ledgerCents(refund),
        net: ledgerCents(purchase - refund)
      };
    });
  }

  function txSummary(tx) {
    var type = txType(tx);
    if (type === "income") {
      var got = Math.max(0, ledgerCents(tx && tx.amount));
      return { type: "income", purchase: 0, refund: 0, net: 0, received: got, refundKind: "" };
    }
    var legs = txLegBreakdown(tx);
    var purchase = 0;
    var refund = 0;
    legs.forEach(function (l) { purchase += l.purchase; refund += l.refund; });
    return {
      type: "expense",
      purchase: ledgerCents(purchase),
      refund: ledgerCents(refund),
      net: ledgerCents(purchase - refund),
      received: 0,
      refundKind: normalizeRefundKind(tx && tx.refundKind)
    };
  }

  function refundLabel(tx, moneyFn) {
    if (!tx || txType(tx) === "income") return "";
    var fmt = moneyFn || moneyLabel;
    var kind = normalizeRefundKind(tx.refundKind);
    if (kind === "full") return "Refund";
    if (kind === "standalone") return "Refund";
    if (kind === "partial") {
      var s = txSummary(tx);
      return s.refund > 0 ? "Partial refund " + fmt(s.refund) : "";
    }
    return "";
  }

  /* Totals over a list of transactions. spendingNet can be < 0 only if standalone refunds
   * exceed purchases; reportSpending clamps at 0 for Wrapped / Insights (never "negative income"). */
  function sumLedger(txs) {
    var purchases = 0;
    var refunds = 0;
    var received = 0;
    (txs || []).forEach(function (tx) {
      var s = txSummary(tx);
      purchases += s.purchase;
      refunds += s.refund;
      received += s.received;
    });
    var net = ledgerCents(purchases - refunds);
    return {
      purchases: ledgerCents(purchases),
      refunds: ledgerCents(refunds),
      spendingNet: net,
      reportSpending: Math.max(0, net),
      received: ledgerCents(received)
    };
  }

  /* Net spent on an envelope (by = "category" | "line"). Refunds reduce it; income ignored. */
  function envelopeNetSpent(txs, by, id) {
    var key = by === "category" ? "categoryId" : "lineId";
    var total = 0;
    (txs || []).forEach(function (tx) {
      txLegBreakdown(tx).forEach(function (leg) {
        if (String(leg[key]) === String(id)) total += leg.net;
      });
    });
    return ledgerCents(total);
  }

  function incomeReceived(txs, incomeId) {
    var total = 0;
    (txs || []).forEach(function (tx) {
      if (txType(tx) !== "income") return;
      if (incomeId != null && String(tx.incomeId) !== String(incomeId)) return;
      total += Math.max(0, ledgerCents(tx.amount));
    });
    return ledgerCents(total);
  }

  /* Validate a draft expense's refund before saving. Returns "" when OK, else a message. */
  function refundDraftError(kind, legs) {
    kind = normalizeRefundKind(kind);
    if (kind !== "partial") return "";
    var any = false;
    for (var i = 0; i < (legs || []).length; i++) {
      var amt = ledgerCents(legs[i].amount);
      var ref = ledgerCents(legs[i].refund);
      if (ref < 0) return "Refund pieces can’t be negative.";
      if (ref > amt + 0.004) return "A refund piece can’t be more than that envelope’s amount.";
      if (ref > 0) any = true;
    }
    return any ? "" : "Enter the refund dollars on at least one envelope.";
  }

  /* ---- Savings rates (locked by owner) ----
   * Savings envelopes: any line in the Savings group (category named "Savings"), plus
   * lines named Roth…, House / House fund…, or exactly "Savings" in any group.
   * 401k/403b/457 budget lines are excluded (payroll deferrals come from the pay stub
   * on True rate; avoids double counting).
   */
  function isSavingsEnvelope(categoryName, lineName) {
    var cat = String(categoryName || "").replace(/^\s+|\s+$/g, "");
    var line = String(lineName || "").replace(/^\s+|\s+$/g, "");
    if (/\b401\s*\(?k\)?|\b403\s*\(?b\)?|\b457\b/i.test(line)) return false;
    if (/^savings$/i.test(cat)) return true;
    if (/^savings$/i.test(line)) return true;
    if (/roth/i.test(line)) return true;
    if (/^house\b/i.test(line) || /house\s*fund/i.test(line)) return true;
    return false;
  }

  function savingsEnvelopeTotal(categories) {
    var total = 0;
    var lines = [];
    (categories || []).forEach(function (cat) {
      var catLines = cat && cat.lines && cat.lines.length ? cat.lines : null;
      if (!catLines) {
        if (cat && isSavingsEnvelope(cat.name, cat.name)) {
          var a0 = Math.max(0, ledgerCents(cat.assigned));
          if (a0 > 0) { total += a0; lines.push({ name: cat.name, amount: a0 }); }
        }
        return;
      }
      catLines.forEach(function (line) {
        if (!isSavingsEnvelope(cat.name, line.name)) return;
        var a = Math.max(0, ledgerCents(line.assigned));
        if (!(a > 0)) return;
        total += a;
        lines.push({ name: line.name, group: cat.name, amount: a });
      });
    });
    return { total: ledgerCents(total), lines: lines };
  }

  function safeRatio(num, den) {
    var n = Number(num);
    var d = Number(den);
    if (!isFinite(n) || !isFinite(d) || !(d > 0)) return null;
    var r = n / d;
    return isFinite(r) ? r : null;
  }

  /* Free: Basic = savings envelopes (assigned) ÷ take-home.
   * take-home (v37.5.59, owner): PLANNED paychecks until EVERY planned paycheck that month is received;
   * only then Received. (Replaced "Received once any Income transaction is logged".)
   * Callers pass the resolved take-home (see monthTakeHome / monthMoneyIn). */
  function basicSavingsRate(opts) {
    opts = opts || {};
    var savings = Math.max(0, ledgerCents(opts.savings));
    var takeHome = Math.max(0, ledgerCents(opts.takeHome));
    return {
      id: "basic",
      label: "Basic savings rate",
      rate: safeRatio(savings, takeHome),
      savings: savings,
      takeHome: takeHome
    };
  }

  /* Premium + confirmed pay stub only. Stub amounts are per paycheck; they are converted
   * to monthly with paychecksPerYear ÷ 12 so they line up with monthly envelopes.
   * Missing stub fields count as $0 and are flagged missing — never estimated. */
  function trueSavingsRate(opts) {
    opts = opts || {};
    var snap = opts.snapshot || null;
    var out = {
      id: "true",
      label: "True savings rate",
      rate: null,
      state: "ok",
      rows: [],
      gross: null,
      numerator: null
    };
    if (!opts.premium) { out.state = "locked"; return out; }
    if (!snap || !snap.confirmedAt) { out.state = "needsStub"; return out; }
    /* v37.5.59.3: with a pay-stub year basis the month's own paychecks are used (actual stubs,
     * YTD spread, estimated gaps, projected checks) — no stub × checks ÷ 12. */
    if (opts.useBasis) {
      var sm = opts.stubMonth;
      if (!sm || !(Number(sm.gross) > 0)) { out.state = "needsStub"; out.noMonthStub = true; return out; }
      var sav0 = Math.max(0, ledgerCents(opts.savings));
      out.rows = [
        { id: "savings", label: "Savings envelopes", amount: sav0, missing: false },
        { id: "employee401k", label: "Employee 401k", amount: ledgerCents(sm.employee401k || 0), missing: false },
        { id: "employerMatch", label: "Employer match", amount: ledgerCents(sm.employer401k || 0), missing: false },
        { id: "hsa", label: "HSA", amount: ledgerCents(sm.hsa || 0), missing: false }
      ];
      // v37.5.59.4: employer 401k base (non-elective, e.g. DN401NC) is employer money saved for you.
      if (Number(sm.employer401kBase) > 0) out.rows.splice(3, 0, { id: "employerBase", label: "Employer 401k base", amount: ledgerCents(sm.employer401kBase), missing: false });
      var num0 = 0;
      out.rows.forEach(function (r) { num0 += r.amount; });
      out.numerator = ledgerCents(num0);
      out.gross = ledgerCents(sm.gross);
      out.monthNote = sm.note || "";
      out.basis = "month";
      out.rate = safeRatio(out.numerator, out.gross);
      return out;
    }
    var gross = Number(snap.gross);
    if (!(gross > 0) || !isFinite(gross)) { out.state = "needsStub"; return out; }
    var checks = Math.max(1, Math.min(52, Number(opts.paychecksPerYear) || 0));
    if (!(Number(opts.paychecksPerYear) > 0)) checks = 0;
    if (!checks) { out.state = "needsFrequency"; return out; }
    var perMonth = checks / 12;
    function monthly(v) {
      if (v == null || v === "" || !isFinite(Number(v))) return null;
      return ledgerCents(Number(v) * perMonth);
    }
    var savings = Math.max(0, ledgerCents(opts.savings));
    var e401 = monthly(snap.employee401k);
    var match = monthly(snap.employer401k);
    var hsa = monthly(snap.hsa);
    var grossM = ledgerCents(gross * perMonth);
    out.rows = [
      { id: "savings", label: "Savings envelopes", amount: savings, missing: false },
      { id: "employee401k", label: "Employee 401k", amount: e401 == null ? 0 : e401, missing: e401 == null },
      { id: "employerMatch", label: "Employer match", amount: match == null ? 0 : match, missing: match == null },
      { id: "hsa", label: "HSA", amount: hsa == null ? 0 : hsa, missing: hsa == null }
    ];
    var num = 0;
    out.rows.forEach(function (r) { num += r.amount; });
    out.numerator = ledgerCents(num);
    out.gross = grossM;
    out.paychecksPerYear = checks;
    out.rate = safeRatio(out.numerator, grossM);
    return out;
  }

  function formatSavingsRate(rate) {
    if (rate == null || !isFinite(Number(rate))) return "—";
    return (Math.round(Number(rate) * 1000) / 10).toFixed(1) + "%";
  }

  /* v37.5.59.2: say which take-home basis is in use. months = [{ year, month (1-12), source,
   * receivedCount, plannedCount }] from the same monthTakeHome rule as Basic. Returns "" if none. */
  var BASIS_MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July",
    "August", "September", "October", "November", "December"];
  function takeHomeBasisLine(months) {
    months = (months || []).filter(Boolean);
    if (!months.length) return "";
    var rec = months.filter(function (m) { return m.source === "received"; });
    var plan = months.filter(function (m) { return m.source !== "received"; });
    var noneLogged = plan.filter(function (m) { return m.period === "past"; });
    var detail = function (m) {
      var name = BASIS_MONTH_NAMES[(Number(m.month) || 1) - 1] || "";
      if (m.period === "past") return name;
      return m.plannedCount > 0 ? name + " (" + (m.receivedCount || 0) + " of " + m.plannedCount + " paychecks received)" : name;
    };
    if (!plan.length) {
      if (rec.length === 1 && rec[0].period !== "past") {
        return "Basis in use: received take-home — every paycheck arrived in " + BASIS_MONTH_NAMES[(Number(rec[0].month) || 1) - 1] + ".";
      }
      return "Basis in use: received take-home for " + (rec.length === 1 ? BASIS_MONTH_NAMES[(Number(rec[0].month) || 1) - 1] : "all " + rec.length + " months") + ".";
    }
    var partial = plan.filter(function (m) { return (m.receivedCount || 0) > 0 && m.plannedCount > 0 && m.period !== "past"; });
    var planText = plan.length <= 3 ? plan.map(detail).join(", ")
      : plan.length + " months" + (partial.length ? ", including " + partial.slice(-3).map(detail).join(", ") : "");
    var tail = noneLogged.length ? " Finished months with no income logged fall back to planned." : "";
    if (!rec.length) return "Basis in use: planned take-home for " + planText + " — switches to received once paychecks are logged." + tail;
    return "Basis in use: received take-home for " + rec.length + " month" + (rec.length === 1 ? "" : "s") +
      "; planned take-home for " + planText + "." + tail;
  }

  /* Grade Spend copy: one month's basis. info = { source, receivedCount, plannedCount }. */
  function monthBasisPhrase(info) {
    if (!info) return "planned take-home until all of this month’s paychecks arrive";
    var n = info.plannedCount || 0;
    if (info.period === "past") {
      return info.source === "received" ? "received take-home — month ended"
        : "planned take-home — month ended with no income logged";
    }
    if (info.source === "received") {
      return "received take-home — " + (n > 0 ? "all " + n + " paycheck" + (n === 1 ? "" : "s") + " in" : "income logged");
    }
    return "planned take-home — " + (info.receivedCount || 0) + " of " + n + " paycheck" + (n === 1 ? "" : "s") +
      " received so far; switches to received when all arrive";
  }

  /* v37.5.59 Basic denominator rule (owner): a month uses PLANNED paychecks until EVERY planned
   * paycheck (income line with amount > 0) has Received ≥ its planned amount; only then Received.
   *   incomes = the month's income lines [{ id, amount }]. Without them we can't prove "all arrived",
   *   so the month stays on planned (unless nothing is planned and income was logged → Received).
   * Returns { amount, source: "planned"|"received", label, plannedCount, receivedCount, allReceived }. */
  function paychecksAllReceived(incomes, txs) {
    var lines = (incomes || []).filter(function (item) { return ledgerCents(item && item.amount) > 0; });
    var got = lines.filter(function (item) {
      return incomeReceived(txs, item.id) + 0.005 >= ledgerCents(item.amount);
    }).length;
    return { plannedCount: lines.length, receivedCount: got, all: lines.length > 0 && got === lines.length };
  }

  /* v37.5.59.2 (owner): which side of today a budget month sits on.
   * year/month are 1-based; today defaults to the device clock. */
  function monthPeriod(year, month, today) {
    var d = today ? new Date(today) : new Date();
    var cur = d.getFullYear() * 12 + d.getMonth();
    var m = (Number(year) || 0) * 12 + ((Number(month) || 1) - 1);
    return m < cur ? "past" : (m === cur ? "current" : "future");
  }

  /* Basic / Wrapped take-home for ONE month (shared by Budget, Insights, Stats YTD, grade, Wrapped).
   *  - Finished (past) month: what you actually received. Planned only if no income was logged at all.
   *  - Current (and future) month: planned until EVERY planned paycheck is fully received, then Received.
   * opts = { year, month, today } or { period: "past"|"current"|"future" }. No opts → current-month rule. */
  function monthTakeHome(plannedIncome, txs, incomes, opts) {
    opts = opts || {};
    var period = opts.period || (opts.year ? monthPeriod(opts.year, opts.month, opts.today) : "current");
    var planned = Math.max(0, ledgerCents(plannedIncome));
    var hasIncomeTx = (txs || []).some(function (tx) { return txType(tx) === "income"; });
    var received = hasIncomeTx ? incomeReceived(txs, null) : 0;
    var check = paychecksAllReceived(incomes, txs);
    var base = { plannedCount: check.plannedCount, receivedCount: check.receivedCount, period: period,
      planned: planned, received: received };
    var out;
    if (period === "past") {
      out = received > 0
        ? { amount: received, source: "received", label: "Received", allReceived: check.all, reason: "ended" }
        : { amount: planned, source: "planned", label: "planned paychecks, no income logged", allReceived: false, reason: "none-logged" };
    } else {
      var useReceived = hasIncomeTx && (check.all || !(planned > 0));
      out = useReceived
        ? { amount: received, source: "received", label: "Received", allReceived: true, reason: "all-in" }
        : { amount: planned, source: "planned", label: "planned paychecks", allReceived: false, reason: "waiting" };
    }
    Object.keys(base).forEach(function (k) { out[k] = base[k]; });
    return out;
  }

  /* Money in / Basic take-home for a month — same rule as monthTakeHome, amount only. */
  function monthMoneyIn(plannedIncome, txs, incomes, opts) {
    return monthTakeHome(plannedIncome, txs, incomes, opts).amount;
  }

  var BASIC_DENOMINATOR_NOTE = "Finished months use what you received (planned only if no income was logged). This month uses planned take-home until every paycheck arrives, then what you received.";

  /* Wrapped / multi-month True: one confirmed compensation stub's monthlyized 401k/match/HSA/gross
   * × monthCount, plus the sum of savings envelopes across those months.
   * Design (honest): there is a single confirmed stub on compensation (not per-month stubs). Without
   * it → needsStub/empty — never invent stub figures for uncovered months. With it, the stub applies
   * uniformly across every month in the period (scaled). True NEVER uses envelope-only or Ramsey estimates. */
  function periodTrueSavingsRate(opts) {
    opts = opts || {};
    var monthCount = Math.max(0, Math.round(Number(opts.monthCount) || 0));
    var savings = Math.max(0, ledgerCents(opts.savings));
    /* v37.5.59.3: sum each month's own pay-stub figures (year basis) instead of one stub × months. */
    if (opts.useBasis) {
      var outB = { id: "true", label: "True savings rate", rate: null, state: "ok", rows: [], gross: null, numerator: null };
      if (!opts.premium) { outB.state = "locked"; return outB; }
      if (!opts.snapshot || !opts.snapshot.confirmedAt) { outB.state = "needsStub"; return outB; }
      var ms = (opts.stubMonths || []).filter(function (m) { return m && Number(m.gross) > 0; });
      if (!ms.length) { outB.state = "needsStub"; outB.noMonthStub = true; return outB; }
      var tot = { gross: 0, e401: 0, er: 0, erBase: 0, hsa: 0 };
      ms.forEach(function (m) {
        tot.gross += Number(m.gross) || 0; tot.e401 += Number(m.employee401k) || 0;
        tot.er += Number(m.employer401k) || 0; tot.hsa += Number(m.hsa) || 0;
        tot.erBase += Number(m.employer401kBase) || 0;
      });
      var covered = ms.length, all = (opts.stubMonths || []).length;
      var tag = covered > 1 ? " (" + covered + " mo)" : "";
      outB.rows = [
        { id: "savings", label: "Savings envelopes" + (covered > 1 ? " (period)" : ""), amount: savings, missing: false },
        { id: "employee401k", label: "Employee 401k" + tag, amount: ledgerCents(tot.e401), missing: false },
        { id: "employerMatch", label: "Employer match" + tag, amount: ledgerCents(tot.er), missing: false },
        { id: "hsa", label: "HSA" + tag, amount: ledgerCents(tot.hsa), missing: false }
      ];
      if (tot.erBase > 0) outB.rows.splice(3, 0, { id: "employerBase", label: "Employer 401k base" + tag, amount: ledgerCents(tot.erBase), missing: false });
      outB.gross = ledgerCents(tot.gross);
      outB.numerator = ledgerCents(savings + tot.e401 + tot.er + tot.erBase + tot.hsa);
      outB.monthCount = covered;
      outB.basis = "months";
      outB.periodNote = "Pay stubs month by month: " + (opts.basisShort || "actual year-to-date + projected checks") +
        (covered < all ? " · " + (all - covered) + " month" + (all - covered === 1 ? "" : "s") + " in this period had no paycheck covered by a stub" : "") + ".";
      outB.rate = safeRatio(outB.numerator, outB.gross);
      return outB;
    }
    var one = trueSavingsRate({
      premium: opts.premium,
      snapshot: opts.snapshot,
      paychecksPerYear: opts.paychecksPerYear,
      savings: 0
    });
    if (one.state !== "ok") return one;
    if (!(monthCount > 0) || !(one.gross > 0)) {
      one.rate = null;
      one.state = "needsStub";
      return one;
    }
    var stubMonthly = one.numerator; // 401k + match + HSA for one month (savings was 0)
    var out = {
      id: "true",
      label: "True savings rate",
      rate: null,
      state: "ok",
      rows: one.rows.map(function (r) {
        if (r.id === "savings") {
          return { id: r.id, label: r.label + (monthCount > 1 ? " (period)" : ""), amount: savings, missing: false };
        }
        return {
          id: r.id,
          label: r.label + (monthCount > 1 ? " × " + monthCount + " mo" : ""),
          amount: ledgerCents(r.amount * monthCount),
          missing: r.missing
        };
      }),
      gross: ledgerCents(one.gross * monthCount),
      numerator: ledgerCents(savings + stubMonthly * monthCount),
      paychecksPerYear: one.paychecksPerYear,
      monthCount: monthCount,
      periodNote: monthCount > 1
        ? ("Confirmed stub monthly figures × " + monthCount + " months in this period + savings envelopes sum. No stub inventing.")
        : null
    };
    out.rate = safeRatio(out.numerator, out.gross);
    return out;
  }


  /* v37.5.15 Wrapped share card model (pure). Dollar amounts are masked unless opts.showAmounts is true.
   * Never NaN/Infinity: missing or zero money-in hides the percent notes; a missing savings rate falls back
   * to days logged, then to "Day one". */
  var SHARE_MASK = "•••••";
  function shareCardModel(facts, opts) {
    facts = facts || {};
    opts = opts || {};
    var show = opts.showAmounts === true;
    var fmt = typeof opts.money === "function" ? opts.money : moneyLabel;
    var fin = function (n) { n = Number(n); return isFinite(n) ? n : 0; };
    var pct = function (r) { return Math.round(r * 100) + "%"; };
    var moneyIn = Math.max(0, fin(facts.moneyIn));
    var out = Math.max(0, fin(facts.moneyOut));
    var saved = Math.max(0, fin(facts.savedPlanned));
    var shareTrue = facts.trueSavingsRate != null && isFinite(Number(facts.trueSavingsRate));
    var rate = shareTrue ? facts.trueSavingsRate : facts.savingsRate;
    var hasRate = rate != null && isFinite(Number(rate));
    var days = Math.max(0, Math.round(fin(facts.daysLogged)));
    var headline;
    if (hasRate) {
      headline = shareTrue
        ? { value: "Saved " + pct(Number(rate)), label: "of gross pay, counting 401k, match, and HSA", sub: "True savings rate · confirmed pay stub" }
        : { value: "Saved " + pct(Number(rate)), label: "of take-home, into savings envelopes", sub: "Basic savings rate · savings envelopes ÷ take-home" };
    } else if (days > 0) {
      headline = { value: days + (days === 1 ? " day" : " days"), label: "logged on paper", sub: "" };
    } else {
      headline = { value: "Day one", label: "of my paper trail", sub: "" };
    }
    var rows = [];
    rows.push({
      id: "saved",
      label: "Savings envelopes",
      value: show ? fmt(saved) : SHARE_MASK,
      masked: !show,
      mono: true,
      note: show ? "Planned savings — not In minus Out" : ""
    });
    rows.push({
      id: "spent",
      label: "Spent",
      value: show ? fmt(out) : SHARE_MASK,
      masked: !show,
      mono: true,
      note: !show && moneyIn > 0 ? pct(out / moneyIn) + " of money in" : ""
    });
    if (facts.categoryName) {
      var catAmt = fin(facts.categoryAmount);
      rows.push({
        id: "top",
        label: "Top envelope",
        value: String(facts.categoryName) + (show && catAmt > 0 ? " · " + fmt(catAmt) : ""),
        masked: false,
        mono: false,
        note: ""
      });
    }
    if (facts.streak != null) {
      var streak = Math.max(0, Math.round(fin(facts.streak)));
      rows.push({ id: "streak", label: "No-spend streak", value: streak + (streak === 1 ? " day" : " days"), masked: false, mono: false, note: "" });
    }
    var score = Number(facts.gradeScore);
    if (facts.gradeScore != null && isFinite(score)) {
      rows.push({ id: "grade", label: "Grade", value: String(Math.round(score)) + (facts.gradeBand ? " · " + facts.gradeBand : ""), masked: false, mono: false, note: "" });
    }
    return {
      kicker: "My wrap · " + (facts.periodName || "This period"),
      period: facts.periodName || "",
      headline: headline,
      rows: rows,
      amountsShown: show,
      footer: "Paper Trail · kept on my phone"
    };
  }

  function runShareCardTests(errors) {
    var facts = { periodName: "September 2026", moneyIn: 2572.37, moneyOut: 266.17, savedPlanned: 950, savingsRate: 950 / 5144.74,
      categoryName: "Food", categoryAmount: 177.4, streak: 3, gradeScore: 96, gradeBand: "Excellent", daysLogged: 5 };
    var hidden = shareCardModel(facts);
    var hiddenText = JSON.stringify(hidden);
    assert(hiddenText.indexOf("$") < 0, "share card hides every dollar amount by default", errors);
    assert(hiddenText.indexOf("2,306") < 0 && hiddenText.indexOf("266.17") < 0 && hiddenText.indexOf("177.4") < 0, "hidden card has no raw amounts", errors);
    assert(hidden.headline.value === "Saved 18%", "share headline uses Basic savings rate " + hidden.headline.value, errors);
    assert(hidden.rows[0].note === "", "v37.5.55: no competing % on dollars saved " + hidden.rows[0].note, errors);
    var shown = shareCardModel(facts, { showAmounts: true });
    assert(shown.rows[0].value === "$950.00" && shown.rows[1].value === "$266.17", "shown card has dollar amounts", errors);
    assert(shown.rows[2].value === "Food · $177.40", "top envelope amount only when shown", errors);
    var empty = shareCardModel({ periodName: "October 2026" });
    var emptyText = JSON.stringify(empty);
    assert(!/NaN|Infinity|undefined/.test(emptyText), "empty share card has no NaN/Infinity/undefined", errors);
    assert(empty.headline.value === "Day one" && empty.rows[0].note === "", "first-day card falls back cleanly", errors);
    var weird = shareCardModel({ moneyIn: NaN, moneyOut: Infinity, savingsRate: NaN, gradeScore: NaN, daysLogged: 2 }, { showAmounts: true });
    assert(!/NaN|Infinity/.test(JSON.stringify(weird)) && weird.headline.value === "2 days", "bad inputs never leak NaN", errors);
    var noStreak = shareCardModel({ periodName: "September 2026", streak: null, gradeScore: null });
    assert(!noStreak.rows.some(function (r) { return r.id === "streak" || r.id === "grade"; }), "no streak/grade rows before there is data", errors);
    var blankDeck = buildWrappedDeck({ premium: true, periodName: "September 2026", streak: null, gradeScore: null });
    var blankText = JSON.stringify(blankDeck);
    assert(blankText.indexOf("starts after your first logged purchase") > 0 && blankText.indexOf("Distressed") < 0, "blank wrap: no fake streak or grade", errors);
    assert(blankText.indexOf("Nothing on the books yet") > 0 && !/NaN|Infinity|undefined/.test(blankText), "blank wrap ledger guidance, NaN-safe", errors);
  }




  function runLedgerTests(errors) {
    var near = function (a, b) { return Math.abs((Number(a) || 0) - (Number(b) || 0)) < 0.005; };
    // Income transaction: Received up, spending untouched.
    var month = [
      { id: "g1", payee: "Market", amount: 100, categoryId: "food", lineId: "groc" },
      { id: "i1", type: "income", payee: "ACME payroll", amount: 2572.37, incomeId: "pay1" }
    ];
    var s0 = sumLedger(month);
    assert(near(s0.spendingNet, 100), "income txn never counts as spending " + s0.spendingNet, errors);
    assert(near(s0.received, 2572.37), "income txn counts toward received", errors);
    assert(near(incomeReceived(month, "pay1"), 2572.37) && incomeReceived(month, "pay2") === 0, "received per income line", errors);
    assert(envelopeNetSpent(month, "line", "groc") === 100, "envelope spent ignores income", errors);
    // Full refund
    var full = { id: "f", payee: "Target", amount: 45, categoryId: "home", lineId: "hh", refundKind: "full" };
    assert(txSummary(full).net === 0 && txSummary(full).refund === 45, "full refund nets to 0", errors);
    assert(refundLabel(full) === "Refund", "full refund label", errors);
    // Partial refund on a single envelope
    var part = { id: "p", payee: "REI", amount: 80, categoryId: "fun", lineId: "gear", refundKind: "partial", refund: 20 };
    assert(txSummary(part).net === 60, "partial refund net " + txSummary(part).net, errors);
    assert(refundLabel(part) === "Partial refund $20.00", "partial label " + refundLabel(part), errors);
    // Split $120 purchase with a $30 refund piece on one split line
    var split = {
      id: "s", payee: "Costco", amount: 120, refundKind: "partial",
      legs: [
        { categoryId: "food", lineId: "groc", amount: 80, refund: 0 },
        { categoryId: "home", lineId: "hh", amount: 40, refund: 30 }
      ]
    };
    var ss = txSummary(split);
    assert(ss.purchase === 120 && ss.refund === 30 && ss.net === 90, "split refund piece net 90", errors);
    assert(envelopeNetSpent([split], "line", "groc") === 80, "split groceries keeps 80", errors);
    assert(envelopeNetSpent([split], "line", "hh") === 10, "split refund piece reduces only its envelope", errors);
    assert(refundLabel(split) === "Partial refund $30.00", "split partial label", errors);
    // Refund piece above leg amount is clamped in math and rejected by the draft validator
    var over = { amount: 40, refundKind: "partial", refund: 55, categoryId: "a", lineId: "b" };
    assert(txSummary(over).net === 0, "partial refund clamps at leg amount", errors);
    assert(refundDraftError("partial", [{ amount: 40, refund: 55 }]) !== "", "draft rejects refund > amount", errors);
    assert(refundDraftError("partial", [{ amount: 40, refund: 0 }]) !== "", "draft needs a refund piece", errors);
    assert(refundDraftError("partial", [{ amount: 80, refund: 0 }, { amount: 40, refund: 30 }]) === "", "draft ok split piece", errors);
    // Standalone refund: envelope spent goes down; never income
    var back = { id: "b", payee: "Amazon return", amount: 25, categoryId: "home", lineId: "hh", refundKind: "standalone" };
    var sb = sumLedger([back]);
    assert(sb.spendingNet === -25 && sb.reportSpending === 0 && sb.received === 0, "standalone refund never income; report clamps", errors);
    var mix = sumLedger([month[0], month[1], full, part, split, back]);
    assert(near(mix.purchases, 100 + 45 + 80 + 120), "mix purchases " + mix.purchases, errors);
    assert(near(mix.refunds, 45 + 20 + 30 + 25), "mix refunds " + mix.refunds, errors);
    assert(near(mix.spendingNet, 345 - 120), "mix net spending " + mix.spendingNet, errors);
    assert(near(mix.received, 2572.37), "mix received unaffected by refunds", errors);
    // Legacy tx without type = expense
    assert(txType({ amount: 5 }) === "expense", "missing type is expense", errors);
    // Savings envelopes + rates
    var cats = [
      { name: "Savings", lines: [{ name: "Emergency Fund", assigned: 200 }, { name: "Travel", assigned: 100 }] },
      { name: "Investing", lines: [{ name: "Roth IRA", assigned: 500 }, { name: "401k", assigned: 300 }] },
      { name: "Housing", lines: [{ name: "House fund", assigned: 250 }, { name: "Rent", assigned: 1500 }] },
      { name: "Food", lines: [{ name: "Groceries", assigned: 400 }] }
    ];
    var sv = savingsEnvelopeTotal(cats);
    assert(sv.total === 1050, "savings envelopes total " + sv.total, errors);
    var basic = basicSavingsRate({ savings: sv.total, takeHome: 5000 });
    assert(near(basic.rate, 0.21), "basic rate 21% " + basic.rate, errors);
    assert(basicSavingsRate({ savings: 100, takeHome: 0 }).rate === null, "basic rate ÷0 → null", errors);
    assert(formatSavingsRate(null) === "—" && formatSavingsRate(NaN) === "—", "rate formatter em-dash", errors);
    assert(formatSavingsRate(0.21) === "21.0%", "rate formatter 21.0%", errors);
    var snap = { gross: 3750, employee401k: 225, employer401k: 150, hsa: 62.5, net: 2572.37, confirmedAt: "2026-09-24T00:00:00Z" };
    var tr = trueSavingsRate({ premium: true, snapshot: snap, paychecksPerYear: 24, savings: 1050 });
    // monthly: gross 7500, 401k 450, match 300, hsa 125 → (1050+450+300+125)/7500 = 0.2566…
    assert(tr.state === "ok" && near(tr.gross, 7500), "true rate monthly gross", errors);
    assert(near(tr.rate, 1925 / 7500), "true rate value " + tr.rate, errors);
    var matchRow = tr.rows.filter(function (r) { return r.id === "employerMatch"; })[0];
    assert(matchRow && matchRow.amount === 300 && matchRow.label === "Employer match", "employer match is its own line", errors);
    assert(trueSavingsRate({ premium: false, snapshot: snap, paychecksPerYear: 24 }).state === "locked", "free → locked, no number", errors);
    assert(trueSavingsRate({ premium: false, snapshot: snap, paychecksPerYear: 24 }).rate === null, "free true rate null", errors);
    var unconfirmed = { gross: 3750, employee401k: 225 };
    assert(trueSavingsRate({ premium: true, snapshot: unconfirmed, paychecksPerYear: 24 }).state === "needsStub", "unconfirmed stub → empty state", errors);
    assert(trueSavingsRate({ premium: true, snapshot: null, paychecksPerYear: 24 }).rate === null, "no stub → null", errors);
    assert(trueSavingsRate({ premium: true, snapshot: { gross: 0, confirmedAt: "x" }, paychecksPerYear: 24 }).rate === null, "gross 0 → null not NaN", errors);
    var noMatch = trueSavingsRate({ premium: true, snapshot: { gross: 2000, net: 1500, confirmedAt: "x" }, paychecksPerYear: 12, savings: 0 });
    assert(noMatch.rate === 0 && noMatch.rows[2].missing === true, "missing match flagged, not estimated", errors);
    assert(monthMoneyIn(3200, [month[0]]) === 3200, "legacy month uses planned income", errors);
    // v37.5.59 rule: planned until EVERY planned paycheck is received; only then Received.
    var twoChecks = [{ id: "pay1", amount: 2572.37 }, { id: "pay2", amount: 627.63 }];
    assert(monthMoneyIn(3200, month, twoChecks) === 3200, "1 of 2 paychecks received → still planned", errors);
    assert(monthMoneyIn(3200, month) === 3200, "no income lines given → can't prove all arrived → planned", errors);
    var partial = monthTakeHome(3200, month, twoChecks);
    assert(partial.source === "planned" && partial.receivedCount === 1 && partial.plannedCount === 2, "partial month counts 1 of 2", errors);
    var thPlanned = monthTakeHome(3200, [month[0]], twoChecks);
    assert(thPlanned.source === "planned" && thPlanned.amount === 3200, "takeHome planned path", errors);
    var oneCheck = [{ id: "pay1", amount: 2572.37 }];
    var thRecv = monthTakeHome(2572.37, month, oneCheck);
    assert(thRecv.source === "received" && near(thRecv.amount, 2572.37), "all paychecks received → Received", errors);
    var allIn = month.concat([{ id: "i2", type: "income", payee: "ACME payroll", amount: 600, incomeId: "pay2" }]);
    assert(near(monthMoneyIn(3200, allIn, twoChecks), 3200), "every paycheck in but pay2 short by $27.63 → still planned", errors);
    var allFull = month.concat([{ id: "i3", type: "income", payee: "ACME payroll", amount: 627.63, incomeId: "pay2" }]);
    assert(near(monthMoneyIn(3200, allFull, twoChecks), 3200), "every paycheck fully received → Received total", errors);
    assert(monthTakeHome(3200, allFull, twoChecks).source === "received", "all received → source received", errors);
    assert(near(monthMoneyIn(0, month, []), 2572.37), "nothing planned but income logged → Received", errors);
    // October 2026 import shape: 1 of 3 paychecks received → Basic stays on planned (42.1%)
    var octIncomes = [{ id: "p1", amount: 1815.37 }, { id: "p2", amount: 1815.37 }, { id: "p3", amount: 1815.37 }];
    var octTx = [{ id: "o1", type: "income", payee: "Paycheck 1", amount: 1815.37, incomeId: "p1" }];
    var octTh = monthTakeHome(5700.03, octTx, octIncomes);
    assert(octTh.source === "planned" && near(octTh.amount, 5700.03), "Oct: 1 of 3 received → planned 5,700.03", errors);
    assert(formatSavingsRate(basicSavingsRate({ savings: 2400, takeHome: octTh.amount }).rate) === "42.1%", "Oct Basic 42.1%", errors);
    // v37.5.59.2 refinement: finished months use Received (planned only if nothing logged)
    assert(monthPeriod(2026, 9, "2026-10-07T12:00:00") === "past" && monthPeriod(2026, 10, "2026-10-07T12:00:00") === "current" &&
      monthPeriod(2026, 11, "2026-10-07T12:00:00") === "future", "monthPeriod past/current/future", errors);
    var pastPartial = monthTakeHome(5700.03, octTx, octIncomes, { period: "past" });
    assert(pastPartial.source === "received" && near(pastPartial.amount, 1815.37), "past month: Received even if not every paycheck arrived", errors);
    var pastNone = monthTakeHome(5653.10, [], octIncomes, { period: "past" });
    assert(pastNone.source === "planned" && near(pastNone.amount, 5653.10) && pastNone.reason === "none-logged", "past month with no income logged → planned", errors);
    var pastOver = monthTakeHome(4039.15, [{ type: "income", amount: 6051.72, incomeId: "p1" }], octIncomes, { year: 2026, month: 4, today: "2026-10-07T12:00:00" });
    assert(pastOver.source === "received" && near(pastOver.amount, 6051.72), "past month: received above planned is used as-is", errors);
    var curByDate = monthTakeHome(5700.03, octTx, octIncomes, { year: 2026, month: 10, today: "2026-10-07T12:00:00" });
    assert(curByDate.source === "planned" && curByDate.period === "current", "current month by date: planned until all arrive", errors);
    assert(/month ended/.test(monthBasisPhrase(pastPartial)), "basis phrase past month", errors);
    // v37.5.59.2: same rule names its basis + Insights precision on grade Spend / Wrapped savings
    assert(/planned take-home — 1 of 3 paychecks received so far/.test(monthBasisPhrase(octTh)), "grade basis phrase planned 1 of 3", errors);
    var octAll = octTx.concat([{ id: "o2", type: "income", amount: 1815.37, incomeId: "p2" }, { id: "o3", type: "income", amount: 1815.37, incomeId: "p3" }]);
    var octAllTh = monthTakeHome(5700.03, octAll, octIncomes);
    assert(/received take-home — all 3 paychecks in/.test(monthBasisPhrase(octAllTh)), "grade basis phrase received 3 of 3", errors);
    var gs = spendSection({ savingsRate: 0.4357, takeHomeBasis: octAllTh });
    assert(/Basic savings rate 43\.6% this month/.test(gs.whatWentIn) && /received take-home/.test(gs.whatWentIn), "grade Spend 43.6% + basis: " + gs.whatWentIn, errors);
    assert(savingsRateCompare({ savingsRate: 0.4357 }).title === "You saved 43.6%", "Wrapped savings title one decimal", errors);
    var bl = takeHomeBasisLine([{ year: 2026, month: 9, source: "received", receivedCount: 2, plannedCount: 2 },
      { year: 2026, month: 10, source: "planned", receivedCount: 1, plannedCount: 3 }]);
    assert(bl === "Basis in use: received take-home for 1 month; planned take-home for October (1 of 3 paychecks received).", "basis line mixed: " + bl, errors);
    assert(/every paycheck arrived in October/.test(takeHomeBasisLine([{ month: 10, source: "received", receivedCount: 3, plannedCount: 3 }])), "basis line all received", errors);
    var blPast = takeHomeBasisLine([{ month: 8, source: "planned", period: "past", receivedCount: 0, plannedCount: 2 },
      { month: 9, source: "received", period: "past", receivedCount: 2, plannedCount: 2 }, { month: 10, source: "planned", period: "current", receivedCount: 1, plannedCount: 3 }]);
    assert(/planned take-home for August, October \(1 of 3 paychecks received\)\. Finished months with no income logged fall back to planned\./.test(blPast), "basis line past none-logged: " + blPast, errors);
    // Basic must use the same take-home the UI resolves (Received vs planned)
    var basicPlanned = basicSavingsRate({ savings: 640, takeHome: thPlanned.amount });
    assert(near(basicPlanned.rate, 0.2), "basic with planned take-home 20%", errors);
    var basicRecv = basicSavingsRate({ savings: 514.474, takeHome: thRecv.amount });
    assert(near(basicRecv.rate, 0.2), "basic with received take-home 20%", errors);
    // Standalone refund: envelope may go negative; report spending clamped ≥ 0 (locked)
    assert(envelopeNetSpent([back], "line", "hh") === -25, "money-back refund may push envelope spent below $0", errors);
    assert(sumLedger([back]).reportSpending === 0, "report spending never below $0", errors);
    // Period True: confirmed stub × N months + savings sum; no stub → needsStub
    var snapOk = { gross: 3750, employee401k: 225, employer401k: 150, hsa: 62.5, net: 2572.37, confirmedAt: "2026-09-24T00:00:00Z" };
    var per = periodTrueSavingsRate({ premium: true, snapshot: snapOk, paychecksPerYear: 24, savings: 2100, monthCount: 2 });
    // monthly stub num without savings = 450+300+125 = 875; period = 2100 + 875*2 = 3850; gross = 7500*2 = 15000
    assert(per.state === "ok" && near(per.gross, 15000), "period true gross × months " + per.gross, errors);
    assert(near(per.rate, 3850 / 15000), "period true rate " + per.rate, errors);
    assert(per.monthCount === 2 && per.periodNote, "period true notes multi-month scale", errors);
    assert(periodTrueSavingsRate({ premium: true, snapshot: null, paychecksPerYear: 24, savings: 100, monthCount: 3 }).state === "needsStub",
      "period true without stub → needsStub", errors);
    assert(periodTrueSavingsRate({ premium: false, snapshot: snapOk, paychecksPerYear: 24, savings: 100, monthCount: 3 }).state === "locked",
      "period true free → locked", errors);
    assert(periodTrueSavingsRate({ premium: true, snapshot: snapOk, paychecksPerYear: 24, savings: 100, monthCount: 0 }).state === "needsStub",
      "period true monthCount 0 → needsStub", errors);
  }

  var US_PERSONAL_SAVING_RATE = 0.054;
  var US_PERSONAL_SAVING_YEAR = 2024;
  var WRAPPED_PEER_MIN_N = 50;

  function savingsRateCompare(opts) {
    opts = opts || {};
    var rate = opts.savingsRate == null ? null : Number(opts.savingsRate);
    var peers = Array.isArray(opts.peerRates) ? opts.peerRates.map(Number).filter(function (n) { return isFinite(n); }) : [];
    var us = opts.usRate == null ? US_PERSONAL_SAVING_RATE : Number(opts.usRate);
    var out = {
      savingsRate: rate,
      usRate: us,
      usYear: opts.usYear || US_PERSONAL_SAVING_YEAR,
      multipleOfUs: null,
      peerTopPercent: null,
      peerN: peers.length,
      peerReady: peers.length >= WRAPPED_PEER_MIN_N,
      title: "",
      body: "",
      footnote: "U.S. personal saving rate ~" + (Math.round(us * 1000) / 10) + "% (" + (opts.usYear || US_PERSONAL_SAVING_YEAR) + ", BEA/FRED) — saving ÷ after-tax income, the same take-home footing as Basic."
    };
    if (rate == null || !isFinite(rate)) {
      out.title = "Savings rate";
      out.body = "Add a paycheck and savings envelopes to see your Basic savings rate.";
      return out;
    }
    if (us > 0) out.multipleOfUs = Math.round((rate / us) * 10) / 10;
    // v37.5.59.2: same precision as Insights (43.6%, not 44%).
    out.title = "You saved " + formatSavingsRate(rate);
    if (out.peerReady) {
      var below = peers.filter(function (p) { return p < rate; }).length;
      var rank = Math.max(1, Math.round((1 - below / peers.length) * 100));
      out.peerTopPercent = rank;
      out.body = "That’s the top " + rank + "% of Paper Trail users. About " +
        (out.multipleOfUs == null ? "—" : out.multipleOfUs + "×") +
        " the U.S. personal saving rate (~" + (Math.round(us * 1000) / 10) + "% in " + out.usYear + ").";
    } else {
      out.body = "About " + (out.multipleOfUs == null ? "—" : out.multipleOfUs + "×") +
        " the U.S. personal saving rate (~" + (Math.round(us * 1000) / 10) + "% in " + out.usYear + ").";
    }
    return out;
  }

  /* Tax triangle buckets from real Net Worth lines only — never invent balances.
   * Labels follow TAX-TRIANGLE.md (Non-qualified / Pre-tax / After-tax).
   * Cash, Lifestyle, Property (realEstate group id), loans stay out of the triangle.
   */
  function taxTreatmentForLine(line) {
    var name = String((line && line.name) || "").toLowerCase();
    var group = String((line && line.group) || "");
    /* HSA is a qualified / tax-free asset even when it lives under cash or a brokerage group. */
    if (/\bhsa\b|health\s+savings/.test(name)) return "afterTax";
    // taxable NW group + common aliases (some books use "investment")
    if (group === "taxable" || group === "investment" || group === "investments" || group === "brokerage") {
      if (/\broth\b/.test(name)) return "afterTax";
      return "nonQualified";
    }
    if (group === "retirement" || group === "taxadvantaged" || group === "tax-advantaged") {
      if (/\broth\b|\bhsa\b|health\s+savings/.test(name)) return "afterTax";
      if (/traditional|\bira\b|401k|403b|457|pension|deferred/.test(name)) return "preTax";
      return "preTax";
    }
    // Name-only fallback when group is missing/custom
    if (/\broth\b/.test(name)) return "afterTax";
    if (/\bhsa\b|health\s+savings/.test(name)) return "afterTax";
    if (/401k|403b|457|traditional\s+ira|\bira\b|pension|deferred/.test(name) && group !== "cash") return "preTax";
    if (/brokerage|taxable|nq\b|non[\s-]*qualified/.test(name)) return "nonQualified";
    return "";
  }

  function taxTriangleBuckets(lines, year) {
    var buckets = {
      nonQualified: { id: "nonQualified", label: "Non-qualified", amount: 0, lines: [] },
      preTax: { id: "preTax", label: "Pre-tax", amount: 0, lines: [] },
      afterTax: { id: "afterTax", label: "After-tax", amount: 0, lines: [] }
    };
    (lines || []).forEach(function (line) {
      if (!line || line.kind === "liability") return;
      var treat = taxTreatmentForLine(line);
      if (!treat || !buckets[treat]) return;
      var amt = 0;
      if (line.amounts && typeof line.amounts === "object") {
        amt = Number(line.amounts[year]);
        if (!isFinite(amt)) amt = 0;
      } else if (Array.isArray(line.amounts) && line.years) {
        var idx = line.years.indexOf(year);
        amt = idx >= 0 ? Number(line.amounts[idx]) || 0 : 0;
      } else if (typeof line.amount === "number") {
        amt = line.amount;
      }
      if (!(amt > 0)) return;
      buckets[treat].amount = roundMoney(buckets[treat].amount + amt);
      buckets[treat].lines.push({ name: line.name || "", amount: amt });
    });
    var total = buckets.nonQualified.amount + buckets.preTax.amount + buckets.afterTax.amount;
    return {
      year: year,
      total: total,
      buckets: [buckets.nonQualified, buckets.preTax, buckets.afterTax],
      empty: !(total > 0)
    };
  }

  function paycheckTaxStrip(snapshot) {
    snapshot = snapshot || {};
    var current = 0;
    var deferred = 0;
    var taxFree = 0;
    var has = false;
    if (snapshot.federalTax != null) { current += Number(snapshot.federalTax) || 0; has = true; }
    if (snapshot.stateTax != null) { current += Number(snapshot.stateTax) || 0; has = true; }
    if (snapshot.fica != null) { current += Number(snapshot.fica) || 0; has = true; }
    else {
      if (snapshot.socialSecurity != null) { current += Number(snapshot.socialSecurity) || 0; has = true; }
      if (snapshot.medicare != null) { current += Number(snapshot.medicare) || 0; has = true; }
    }
    if (snapshot.employee401k != null) { deferred += Number(snapshot.employee401k) || 0; has = true; }
    if (snapshot.hsa != null) { taxFree += Number(snapshot.hsa) || 0; has = true; }
    if (!has) return null;
    return {
      currentTax: roundMoney(current),
      deferred: roundMoney(deferred),
      taxFree: roundMoney(taxFree),
      labels: { currentTax: "Current tax", deferred: "Deferred", taxFree: "Tax-free" }
    };
  }

  /* Paycheck composition % of gross from confirmed snapshot only — never estimate.
   * Taxes = federal + state + FICA (or SS+Medicare if fica absent) — only fields present.
   * Deductions = employee 401k + HSA + otherDeductions[] (insurance/voluntary) — not taxes.
   * Net = snapshot.net. Hide UI when gross missing/≤0 or net missing.
   * Percents of gross; taxes+deductions+net may leave a small unlabeled remainder (rounding / unmapped lines).
   */
  function paycheckComposition(snapshot) {
    snapshot = snapshot || {};
    var gross = Number(snapshot.gross);
    if (!(gross > 0) || !isFinite(gross)) return null;
    if (snapshot.net == null || !isFinite(Number(snapshot.net))) return null;

    var taxes = 0;
    if (snapshot.federalTax != null) taxes += Number(snapshot.federalTax) || 0;
    if (snapshot.stateTax != null) taxes += Number(snapshot.stateTax) || 0;
    if (snapshot.fica != null) {
      taxes += Number(snapshot.fica) || 0;
    } else {
      if (snapshot.socialSecurity != null) taxes += Number(snapshot.socialSecurity) || 0;
      if (snapshot.medicare != null) taxes += Number(snapshot.medicare) || 0;
    }

    (snapshot.otherTaxes || []).forEach(function (t) { if (t && t.amount != null) taxes += Number(t.amount) || 0; });
    var deductions = 0;
    if (snapshot.employee401k != null) deductions += Number(snapshot.employee401k) || 0;
    if (snapshot.hsa != null) deductions += Number(snapshot.hsa) || 0;
    if (snapshot.fsa != null) deductions += Number(snapshot.fsa) || 0;
    (snapshot.otherDeductions || []).forEach(function (d) {
      if (!d || d.amount == null) return;
      deductions += Number(d.amount) || 0;
    });

    var net = Number(snapshot.net) || 0;
    return {
      taxes: roundMoney(taxes),
      deductions: roundMoney(deductions),
      net: roundMoney(net),
      gross: roundMoney(gross),
      taxesPct: taxes / gross,
      deductionsPct: deductions / gross,
      netPct: net / gross
    };
  }


  function detectVaultType(blob) {
    var lower = String(blob || "").toLowerCase();
    var insurance = 0;
    var loan = 0;
    var mortgage = 0;
    var paystub = 0;
    if (/\bpremium\b/.test(lower)) insurance += 3;
    if (/deductible/.test(lower)) insurance += 2;
    if (/declaration/.test(lower)) insurance += 2;
    if (/\binsurance\b|\binsurer\b|\bpolicyholder\b/.test(lower)) insurance += 2;
    if (/\bpolicy\b/.test(lower)) insurance += 1;
    if (/mortgage statement|home mortgage|mortgage loan|deed of trust/.test(lower)) mortgage += 4;
    if (/\bheloc\b|home\s*loan/.test(lower)) mortgage += 3;
    if (/\bmortgage\b/.test(lower)) mortgage += 2;
    if (/loan statement|promissory note|\bauto loan\b|\bpersonal loan\b|\bstudent loan\b/.test(lower)) loan += 3;
    if (/principal balance|unpaid principal|amount financed|original (?:loan )?balance/.test(lower)) loan += 2;
    if (/\bapr\b|interest rate/.test(lower)) loan += 2;
    if (/minimum payment|regular payment/.test(lower)) loan += 1;
    if (/pay\s*stub|earnings\s+statement|paycheck|pay\s+advice/.test(lower)) paystub += 4;
    if (/gross\s+pay|gross\s+earnings/.test(lower)) paystub += 2;
    if (/net\s+pay|net\s+earnings|take[\s-]*home/.test(lower)) paystub += 2;
    if (/\bytd\b|year[\s-]*to[\s-]*date/.test(lower)) paystub += 1;
    if (/federal\s+(?:income\s+)?tax|social\s+security|\bmedicare\b/.test(lower)) paystub += 1;
    if (insurance >= 3 && insurance >= mortgage && insurance >= loan && insurance >= paystub) return "insurance";
    if (mortgage >= 3 && mortgage >= loan && mortgage >= paystub) return "mortgage";
    if (loan >= 2 && loan >= paystub) return "loan";
    if (paystub >= 3 && paystub > insurance && paystub > loan && paystub > mortgage) return "paystub";
    if (insurance > 0) return "insurance";
    return "";
  }

  function longestProvider(blob, list) {
    var lower = String(blob || "").toLowerCase();
    var best = "";
    var i;
    for (i = 0; i < list.length; i++) {
      if (lower.indexOf(list[i].toLowerCase()) >= 0 && list[i].length > best.length) best = list[i];
    }
    if (!best && lower.indexOf("geico") >= 0) return "Geico";
    if (!best && /government employees insurance/.test(lower)) return "Geico";
    return best;
  }

  function cleanLabeledProvider(raw) {
    return String(raw || "").replace(/\s{2,}.*/, "").replace(/[,.]\s*$/, "").replace(/^\s+|\s+$/g, "");
  }

  function providerFromBlob(blob, type) {
    var primary = type === "loan" || type === "mortgage" ? VAULT_LENDER_PROVIDERS : VAULT_INSURANCE_PROVIDERS;
    var secondary = type === "loan" || type === "mortgage" ? VAULT_INSURANCE_PROVIDERS : VAULT_LENDER_PROVIDERS;
    var lists = primary.concat(secondary);
    var lines = String(blob || "").split(/\n/);
    var i;
    for (i = 0; i < lines.length; i++) {
      var labeled = lines[i].match(/^(?:provider|carrier|insurer|company|lender|servicer)\s*[:#]\s*(.+)$/i);
      if (!labeled) continue;
      var value = cleanLabeledProvider(labeled[1]);
      var fromLabel = longestProvider(value, lists);
      if (fromLabel) return fromLabel;
      if (value && value.length <= 48 && !/policy|number|premium|vehicle|statement|declaration/i.test(value)) return value;
    }
    return longestProvider(blob, primary) || longestProvider(blob, secondary);
  }

  function cleanPolicyNumber(raw) {
    var s = String(raw || "").replace(/^\s+|\s+$/g, "");
    s = s.split(/\s{2,}|\s+(?=named\b|insured\b|policy\b|vehicle\b|effective\b|premium\b)/i)[0] || "";
    s = s.replace(/[.,;]+$/, "").replace(/^\s+|\s+$/g, "");
    if (s.length < 4 || s.length > 40) return "";
    if (!/[0-9]/.test(s)) return "";
    return s;
  }

  function policyNumberFromBlob(blob) {
    var lines = String(blob || "").split(/\n/);
    var re = /(?:policy|account|loan)\s*(?:number|no\.?|#|num)\s*[:#-]?\s*([A-Za-z0-9][A-Za-z0-9-]{2,}(?:[ ]+[A-Za-z0-9][A-Za-z0-9-]{1,}){0,4})/i;
    var i;
    for (i = 0; i < lines.length; i++) {
      var m = lines[i].match(re);
      if (m) {
        var cleaned = cleanPolicyNumber(m[1]);
        if (cleaned) return cleaned;
      }
    }
    return "";
  }

  var PREMIUM_NOISE = /bodily|property damage|collision|comprehensive|uninsured|underinsured|medical payment|rental|towing|roadside|\bpip\b|\bum\b|\buim\b|liability|glass|gap\b/;

  function extractPremium(blob, type) {
    if (type === "loan" || type === "mortgage") return null;
    var lines = String(blob || "").split(/\n/);
    var candidates = [];
    function consider(label, amount, freqText) {
      if (!(amount >= 1) || amount > 1000000) return;
      var lab = String(label || "");
      var lower = lab.toLowerCase();
      if (/deductible/.test(lower) && !/premium/.test(lower)) return;
      var score = 0;
      if (/total|full[\s-]*term|policy premium|premium summary|amount of premium|your premium|premium paid/.test(lower)) score += 120;
      if (/premium/.test(lower)) score += 50;
      if (/monthly\s+(?:payment|installment|premium)/.test(lower)) score += 80;
      if (PREMIUM_NOISE.test(lower)) score -= 100;
      var freq = explicitFrequency(freqText || lab);
      if (freq) score += 15;
      if (score < 20) return;
      candidates.push({ amount: amount, score: score, freq: freq, label: lower });
    }
    var i;
    for (i = 0; i < lines.length; i++) {
      var windowLine = [lines[i - 1] || "", lines[i], lines[i + 1] || ""].join(" ");
      var amounts = moneyTokens(lines[i]);
      var source = lines[i];
      if (!amounts.length && /premium/i.test(lines[i])) {
        var nextLine = lines[i + 1] || "";
        var prevLine = lines[i - 1] || "";
        var nextAmounts = moneyTokens(nextLine);
        var prevAmounts = moneyTokens(prevLine);
        if (nextAmounts.length) consider(lines[i] + " " + nextLine, nextAmounts[nextAmounts.length - 1], windowLine);
        if (prevAmounts.length) consider(prevLine + " " + lines[i], prevAmounts[prevAmounts.length - 1], windowLine);
        continue;
      }
      if (!amounts.length) continue;
      if (!/premium|monthly\s+(?:payment|installment)/i.test(source) && !/premium/i.test(lines[i - 1] || "")) continue;
      consider(source, amounts[amounts.length - 1], windowLine);
    }
    var flat = String(blob || "").replace(/[ \t]+/g, " ");
    var span = /(total(?:\s+\w+){0,6}\s+premium|full[\s-]*term premium|policy premium|monthly premium|your premium is|premium paid)([^$\n]{0,80})\$?\s*([0-9,]+\.[0-9]{2})/gi;
    var sm;
    while ((sm = span.exec(flat))) consider(sm[1] + " " + sm[2], parseMoneyAmount(sm[3]), sm[0]);
    if (!candidates.length) return null;
    candidates.sort(function (a, b) {
      if (b.score !== a.score) return b.score - a.score;
      return b.amount - a.amount;
    });
    var best = candidates[0];
    var monthlyPay = 0;
    candidates.forEach(function (row) {
      if (/monthly\s+(?:payment|installment|premium)/.test(row.label)) monthlyPay = row.amount;
    });
    var freq = best.freq;
    if (!freq && monthlyPay > 0 && best.amount !== monthlyPay) {
      var ratio = best.amount / monthlyPay;
      if (Math.abs(ratio - 6) < 0.35) freq = "semiannual";
      else if (Math.abs(ratio - 12) < 0.7) freq = "annual";
      else if (Math.abs(ratio - 3) < 0.25) freq = "quarterly";
      else if (Math.abs(ratio - 1) < 0.08) freq = "monthly";
    }
    if (!freq) freq = frequencyFromMonths(policyTermMonths(blob));
    if (!freq && /total|full[\s-]*term|policy premium|premium paid/.test(best.label)) {
      var lowerBlob = String(blob || "").toLowerCase();
      if (/homeowner|home insurance|hazard|renters/.test(lowerBlob)) freq = "annual";
      else if (/auto|vehicle|automobile|\bcar\b/.test(lowerBlob) && best.amount >= 250) freq = "semiannual";
    }
    if (!freq && monthlyPay > 0 && best.amount === monthlyPay) freq = "monthly";
    return { premium: best.amount, premiumFrequency: freq || "" };
  }

  function readableCaps(s) {
    return String(s || "").replace(/\s+/g, " ").replace(/^\s+|\s+$/g, "").replace(/\b([A-Za-z0-9]+)\b/g, function (word) {
      if (word.length === 2 && STATE_CODES[word.toUpperCase()]) return word.toUpperCase();
      if (/^(N|S|E|W|NE|NW|SE|SW)$/i.test(word)) return word.toUpperCase();
      if (/^\d/.test(word)) return word.replace(/(\d+)(st|nd|rd|th)$/i, function (_, n, suf) { return n + suf.toLowerCase(); });
      var lower = word.toLowerCase();
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    });
  }

  function commaAmount(raw) {
    var n = Number(String(raw || "").replace(/,/g, ""));
    if (!(n > 0) || !isFinite(n)) return "";
    return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function splitLimit(text) {
    var src = String(text || "");
    var re = /(\d{1,3}(?:,\d{3})+|\d{2,7})\s*\/\s*(\d{1,3}(?:,\d{3})+|\d{2,7})/g;
    var m;
    function part(raw) {
      var n = Number(String(raw).replace(/,/g, ""));
      if (!(n > 0)) return "";
      if (n >= 10000 && n % 1000 === 0) return String(n / 1000);
      return commaAmount(n);
    }
    while ((m = re.exec(src))) {
      var after = src.slice(m.index + m[0].length, m.index + m[0].length + 8);
      var before = src.slice(Math.max(0, m.index - 4), m.index);
      if (/^\s*[\/\-]\s*\d{2,4}/.test(after)) continue;
      if (/\d\s*[\/\-]\s*$/.test(before)) continue;
      var a = part(m[1]);
      var b = part(m[2]);
      if (a && b) return a + "/" + b;
    }
    return "";
  }

  function cleanVehicle(raw) {
    var stop = /^(how|who|vehicle|the|and|vin|number|description|normally|used|principally|drives|this|if|please|for|with|of|to|through|from|is|a|an|identification|january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sept|sep|oct|nov|dec)$/i;
    var parts = String(raw || "").replace(/\s+/g, " ").replace(/^\s+|\s+$/g, "").replace(/[.,;]+$/g, "").split(" ");
    while (parts.length > 2 && stop.test(parts[parts.length - 1])) parts.pop();
    if (parts.length < 3 || stop.test(parts[1])) return "";
    return parts.join(" ");
  }

  function firstVehicle(text) {
    var yearRe = /\b((?:19|20)\d{2}(?:[ \t]+[A-Za-z0-9][A-Za-z0-9.'-]*){1,5})/g;
    var m;
    while ((m = yearRe.exec(String(text || "")))) {
      var cleaned = cleanVehicle(m[1]);
      if (cleaned) return cleaned;
    }
    return "";
  }

  function vinFromBlob(blob) {
    var re = /\b([A-HJ-NPR-Z0-9]{17})\b/gi;
    var m;
    while ((m = re.exec(String(blob || "")))) {
      var vin = m[1].toUpperCase();
      if (/[A-HJ-NPR-Z]/.test(vin) && /\d/.test(vin)) return vin;
    }
    return "";
  }

  function vehicleFromBlob(blob) {
    var labeled = captureLine(blob, /(?:^|\n)[ \t]*(?:insured vehicle|described auto|vehicle|collateral)[ \t]*[:#-]?[ \t]*([^\n]+)/i);
    var vehicle = labeled ? firstVehicle(labeled) : "";
    if (!vehicle) vehicle = firstVehicle(blob);
    if (!vehicle) return "";
    var vin = vinFromBlob(blob);
    if (vin && vehicle.toUpperCase().indexOf(vin) < 0) vehicle += " · VIN " + vin;
    return vehicle;
  }

  function purePeriodSide(raw) {
    var text = String(raw || "").replace(/\s+/g, " ").replace(/^\s+|\s+$/g, "").replace(/[.,;]+$/g, "");
    var named = text.match(new RegExp("^(" + MONTH_WORD + ")\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?,?\\s+(\\d{4})$", "i"));
    if (named) return named[1] + " " + String(Number(named[2])) + ", " + named[3];
    var num = text.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
    if (num) return num[1] + "/" + num[2] + "/" + num[3];
    return "";
  }

  function purePeriodPhrase(raw) {
    var text = String(raw || "").replace(/\s+/g, " ").replace(/^\s+|\s+$/g, "");
    var parts = text.split(/\s+(?:to|through|-)\s+/i);
    if (parts.length !== 2) return "";
    var left = purePeriodSide(parts[0]);
    var right = purePeriodSide(parts[1]);
    if (!left || !right) return "";
    var months = monthsBetweenDates(left, right);
    if (!(months >= 1 && months <= 18)) return "";
    var phrase = left + " to " + right + " (" + months + " mo)";
    if (/garag|determine|rate charged|\bstreet\b|\bave\b|\bblvd\b/i.test(phrase)) return "";
    return phrase;
  }

  function policyPeriodPhrase(blob) {
    var lines = String(blob || "").split(/\n/);
    var labelRe = /policy\s+period|effective(?:\s+dates?)?|coverage\s+period/i;
    var date = "(?:(?:" + MONTH_WORD + ")\\.?\\s+\\d{1,2}(?:st|nd|rd|th)?,?\\s+\\d{4}|\\d{1,2}[\\/\\-]\\d{1,2}[\\/\\-]\\d{2,4})";
    var re = new RegExp("(?:" + labelRe.source + ")\\s*[:#\\-]?\\s*(" + date + "\\s*(?:to|through|-)\\s*" + date + ")", "i");
    var i;
    for (i = 0; i < lines.length; i++) {
      if (!labelRe.test(lines[i])) continue;
      var window = lines[i] + (i + 1 < lines.length ? "\n" + lines[i + 1] : "");
      var m = window.match(re);
      if (!m) continue;
      var pure = purePeriodPhrase(m[1]);
      if (pure) return pure;
    }
    return "";
  }

  function insuranceLimits(blob) {
    var lines = String(blob || "").split(/\n/).map(function (line) {
      return line.replace(/^\s+|\s+$/g, "");
    }).filter(function (line) { return line; });
    var bi = "";
    var pd = "";
    var pip = "";
    var um = "";
    var uim = "";
    var i;
    for (i = 0; i < lines.length; i++) {
      var line = lines[i];
      var window = lines.slice(Math.max(0, i - 4), i + 1).join("\n");
      if (/\bunderinsured\b/i.test(line)) {
        var uimSplit = splitLimit(window);
        if (uimSplit) uim = uimSplit;
        continue;
      }
      if (/\buninsured\b/i.test(line)) {
        var umSplit = splitLimit(window);
        if (umSplit) um = umSplit;
        continue;
      }
      if (/\bpersonal\s+injury\b|\bpip\b/i.test(line) || /\bmedical\s+payments?\b/i.test(line)) {
        var med = window.match(/\b(?:includes\s+)?medical(?:\s+payments?)?(?:\s+limit)?\s*[:#-]?\s*\$?\s*(\d{1,3}(?:,\d{3})+|\d{3,})/i);
        if (!med) med = window.match(/\bother expenses to\s+(\d{1,3}(?:,\d{3})+|\d{3,})/i);
        if (med) pip = commaAmount(med[1]);
        continue;
      }
      var pdMatch = line.match(/\bproperty\s+damage(?:\s+liability)?\s*[:#-]?\s*\$?\s*(\d{1,3}(?:,\d{3})+|\d{3,})/i);
      if (!pdMatch) pdMatch = line.match(/\bproperty\s+damage(?:\s+liability)?\b[^\n]{0,24}\$\s*(\d{1,3}(?:,\d{3})+|\d{3,})/i);
      if (pdMatch && !/\buninsured\b|\bunderinsured\b/i.test(line)) pd = commaAmount(pdMatch[1]);
      var liabilityLine = /\bbodily\s+injury\s+liability\b/i.test(line) ||
        (/^\s*liability\b/i.test(line) && !/\bproperty\s+damage\b/i.test(line));
      if (liabilityLine) {
        var biSplit = splitLimit(window);
        if (biSplit) bi = biSplit;
        if (!pd) {
          var pdWindow = window.match(/\bproperty\s+damage(?:\s+liability)?\s*[:#-]?\s*\$?\s*(\d{1,3}(?:,\d{3})+|\d{3,})/i);
          if (pdWindow) pd = commaAmount(pdWindow[1]);
        }
      }
    }
    var parts = [];
    if (bi) parts.push("Liability BI " + bi);
    if (pd) parts.push("PD " + pd);
    if (pip) parts.push("PIP medical " + pip);
    if (um) parts.push("UM BI " + um);
    if (uim) parts.push("UIM BI " + uim);
    return parts.join(" · ");
  }

  function insuranceDeductibles(blob) {
    var text = String(blob || "");
    function one(name) {
      var patterns = [
        new RegExp("\\b(\\d{1,3}(?:,\\d{3})*|\\d{2,})\\s+deductible\\s+" + name + "\\b", "i"),
        new RegExp("\\b" + name + "(?:\\s+\\w+){0,3}?\\s+deductible\\s*[:#\\-]?\\s*\\$?\\s*(\\d{1,3}(?:,\\d{3})*|\\d{2,})", "i"),
        new RegExp("\\b" + name + "\\s+\\$?\\s*(\\d{1,3}(?:,\\d{3})*|\\d{2,})\\s*ded\\b", "i")
      ];
      var i;
      for (i = 0; i < patterns.length; i++) {
        var m = text.match(patterns[i]);
        if (m && m[1]) return commaAmount(m[1]);
      }
      return "";
    }
    var parts = [];
    var coll = one("collision");
    var comp = one("comprehensive");
    if (coll) parts.push("Collision $" + coll);
    if (comp) parts.push("Comprehensive $" + comp);
    return parts.join("; ");
  }

  function insuranceReviewNotes(blob) {
    var text = String(blob || "");
    var lines = text.split(/\n/).map(function (line) { return line.replace(/^\s+|\s+$/g, ""); });
    var bits = [];
    var driver = text.match(/([A-Z][A-Za-z.'’-]+(?:[ \t]+[A-Z][A-Za-z.'’-]+)+),\s+an?\s+(single|married|divorced|widowed|separated)\s+(male|female)[\s\S]{0,80}?age\s+(\d{1,3})\b/i);
    if (driver) {
      bits.push("Principal driver " + readableCaps(driver[1]) + ", " + driver[3].toLowerCase() + ", age " + driver[4] + ", " + driver[2].toLowerCase() + ".");
    }
    function addressContinuation(line) {
      var value = String(line || "").replace(/^\s+|\s+$/g, "").replace(/[.,]+$/g, "");
      if (!value || value.length > 48) return "";
      if (/policy|premium|vehicle|page|driver|thank|coverage|location|agent|office/i.test(value)) return "";
      if (/^[NSEW]\b/i.test(value) || /,\s*[A-Za-z]/.test(value) || /\b[A-Z]{2}\s+\d{5}\b/.test(value)) return value;
      return "";
    }
    var gi;
    for (gi = 0; gi < lines.length; gi++) {
      var garLine = lines[gi].match(/location used to determine rate charged\s*[-–:]?\s*(.+)$/i);
      if (!garLine) continue;
      var street = garLine[1].replace(/^\s+|\s+$/g, "").replace(/[.,]+$/g, "");
      var extra = addressContinuation(lines[gi + 1]) || addressContinuation(lines[gi - 1]);
      var place = readableCaps(extra ? street + " " + extra : street);
      if (place) bits.push("Garaging " + place + ".");
      break;
    }
    if (/to\s+work,\s*school\s+or\s+pleasure/i.test(text)) bits.push("Use: to work, school, or pleasure.");
    var miles = text.match(/(?:calculated\s+)?annual\s+mileage(?:\s+is)?\s*[:#-]?\s*([0-9][0-9,]*)/i);
    if (miles) bits.push("Annual mileage " + miles[1] + ".");
    var phone = "";
    var agent = "";
    var i;
    for (i = 0; i < lines.length; i++) {
      var pm = lines[i].match(/\boffice\s*[:#-]?\s*(\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4})/i);
      if (pm && !phone) phone = pm[1];
      if (!agent && /^your\s+[A-Za-z]+(?:\s+[A-Za-z]+){0,3}\s+agent\.?$/i.test(lines[i]) && i > 0) {
        var prev = lines[i - 1];
        var letters = String(prev || "").replace(/[^A-Za-z]/g, "");
        var upper = String(prev || "").replace(/[^A-Z]/g, "").length;
        if (prev && prev.length <= 64 && letters.length >= 4 && upper / letters.length >= 0.6 &&
            !/[:#]/.test(prev) && !/policy|premium|page|address|coverage|limit|contact/i.test(prev)) {
          agent = readableCaps(prev);
        }
      }
    }
    if (agent && phone) bits.push("Agent " + agent + " · " + phone + ".");
    else if (agent) bits.push("Agent " + agent + ".");
    else if (phone) bits.push("Agent phone " + phone + ".");
    var notes = bits.join(" ");
    if (notes.length > 500) notes = notes.slice(0, 497) + "...";
    return notes;
  }

  var PAYOFF_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var PAYOFF_MONTH_INDEX = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, sept: 8, oct: 9, nov: 10, dec: 11 };

  function formatPayoffLabel(year, monthIndex) {
    if (!(year >= 1900 && year < 2200) || monthIndex < 0 || monthIndex > 11) return "";
    return PAYOFF_MONTHS[monthIndex] + " " + year;
  }

  function parseSlashDate(raw) {
    var text = String(raw || "").replace(/^\s+|\s+$/g, "");
    var my = text.match(/^(\d{1,2})[\/\-](20\d{2})$/);
    if (my) {
      var onlyMonth = Number(my[1]);
      if (onlyMonth >= 1 && onlyMonth <= 12) return { y: Number(my[2]), m: onlyMonth - 1 };
    }
    var m = text.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
    if (!m) return null;
    var month = Number(m[1]);
    var year = Number(m[3]);
    if (year < 100) year += 2000;
    if (month < 1 || month > 12) return null;
    return { y: year, m: month - 1 };
  }

  function parseNamedDate(raw) {
    var m = String(raw || "").match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+(?:\d{1,2}(?:st|nd|rd|th)?,?\s+)?(20\d{2})\b/i);
    if (!m) return null;
    var idx = PAYOFF_MONTH_INDEX[m[1].toLowerCase()];
    if (idx == null) return null;
    return { y: Number(m[2]), m: idx };
  }

  function monthsPhrase(text) {
    var m = String(text || "").match(/\b(\d{1,3})\s*months?\b/i);
    if (!m) return "";
    return m[1] + (m[1] === "1" ? " month" : " months");
  }

  function payoffFromText(text) {
    var src = String(text || "");
    var range = src.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\s*(?:to|through|–|-)\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);
    if (range) {
      var end = parseSlashDate(range[2]);
      if (end) return formatPayoffLabel(end.y, end.m);
    }
    var namedRange = src.match(/((?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+\d{1,2},?\s+20\d{2})\s*(?:to|through|–|-)\s*((?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+\d{1,2},?\s+20\d{2})/i);
    if (namedRange) {
      var namedEnd = parseNamedDate(namedRange[2]);
      if (namedEnd) return formatPayoffLabel(namedEnd.y, namedEnd.m);
    }
    var iso = src.match(/\b(20\d{2})-(\d{2})\b/);
    if (iso) {
      var isoMonth = Number(iso[2]);
      if (isoMonth >= 1 && isoMonth <= 12) return formatPayoffLabel(Number(iso[1]), isoMonth - 1);
    }
    var already = src.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(20\d{2})\b/);
    if (already) return already[1] + " " + already[2];
    var one = src.match(/\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{1,2}[\/\-]20\d{2})\b/);
    if (one) {
      var slash = parseSlashDate(one[1]);
      if (slash) return formatPayoffLabel(slash.y, slash.m);
    }
    var named = parseNamedDate(src);
    if (named) return formatPayoffLabel(named.y, named.m);
    return "";
  }

  function estimateLoanPayoff(doc) {
    if (!doc) return "";
    var balance = Number(doc.balance) || 0;
    var apr = Number(doc.rate) || 0;
    var payment = Number(doc.minPayment) > 0 ? Number(doc.minPayment) : (Number(doc.payment) || 0);
    var n = monthsToPayOff(balance, apr, payment);
    if (n == null) return "";
    var base = new Date();
    var d = new Date(base.getFullYear(), base.getMonth() + n, 1);
    return formatPayoffLabel(d.getFullYear(), d.getMonth());
  }

  function resolveLoanTerm(rawTerm, doc) {
    var raw = String(rawTerm || "").replace(/^\s+|\s+$/g, "");
    var label = payoffFromText(raw);
    var original = monthsPhrase(raw);
    if (!label) label = estimateLoanPayoff(doc);
    var note = "";
    if (original && label && label.indexOf(original) < 0) note = "Original term " + original + ".";
    if (!label) label = original || raw;
    return { term: label, note: note };
  }

  function limitNumber(raw) {
    var n = Number(String(raw || "").replace(/[$,\s]/g, ""));
    return isFinite(n) && n > 0 ? n : 0;
  }

  function shorthandToDollars(n) {
    if (!(n > 0)) return 0;
    if (n >= 10000) return Math.round(n);
    return Math.round(n * 1000);
  }

  function parseLiabilityLimits(text) {
    var src = String(text || "");
    var perPerson = 0;
    var perAccident = 0;
    var property = 0;
    var bi = src.match(/\bliability\s+bi\s+\$?\s*(\d[\d,]*)\s*\/\s*\$?\s*(\d[\d,]*)/i);
    if (!bi) bi = src.match(/\bbodily\s+injury(?:\s+liability)?\s+\$?\s*(\d[\d,]*)\s*\/\s*\$?\s*(\d[\d,]*)/i);
    if (!bi) {
      var rx = /\bbi\s+\$?\s*(\d[\d,]*)\s*\/\s*\$?\s*(\d[\d,]*)/gi;
      var found;
      while ((found = rx.exec(src))) {
        var prefix = src.slice(Math.max(0, found.index - 20), found.index);
        if (/uninsured|underinsured|\bum\b|\buim\b/i.test(prefix)) continue;
        bi = found;
        break;
      }
    }
    if (bi) {
      perPerson = shorthandToDollars(limitNumber(bi[1]));
      perAccident = shorthandToDollars(limitNumber(bi[2]));
    }
    var pd = src.match(/\b(?:property\s+damage(?:\s+liability)?|pd)\s*[:#-]?\s*\$?\s*(\d{1,3}(?:,\d{3})+|\d{2,})/i);
    if (pd) {
      var pdn = limitNumber(pd[1]);
      property = (/[,.]/.test(pd[1]) || pdn >= 10000) ? Math.round(pdn) : shorthandToDollars(pdn);
    }
    if (!(perPerson > 0) && !(property > 0)) {
      var triple = src.match(/(\d{2,7})\s*\/\s*(\d{2,7})\s*\/\s*(\d{2,7})/);
      if (triple) {
        perPerson = shorthandToDollars(limitNumber(triple[1]));
        perAccident = shorthandToDollars(limitNumber(triple[2]));
        property = shorthandToDollars(limitNumber(triple[3]));
      }
    }
    return { perPerson: perPerson, perAccident: perAccident, property: property };
  }

  function formatLiabilityLimits(parts, original) {
    parts = parts || {};
    function shortLimit(n) {
      n = Math.round(Number(n) || 0);
      if (!(n > 0)) return "";
      if (n % 1000 === 0 && n >= 10000) return String(n / 1000);
      return commaAmount(n);
    }
    var biA = shortLimit(parts.perPerson);
    var biB = shortLimit(parts.perAccident);
    var pd = parts.property > 0 ? commaAmount(parts.property) : "";
    var extras = [];
    String(original || "").split(/\s*·\s*/).forEach(function (part) {
      var p = part.replace(/^\s+|\s+$/g, "");
      if (!p) return;
      if (/\bliability\s+bi\b|\bbodily\s+injury\b/i.test(p)) return;
      if (/^\s*bi\b/i.test(p)) return;
      if (/^\s*(?:pd|property\s+damage)\b/i.test(p)) return;
      if (/^\d+\s*\/\s*\d+\s*\/\s*\d+$/.test(p)) return;
      extras.push(p);
    });
    var out = [];
    if (biA && biB) out.push("Liability BI " + biA + "/" + biB);
    if (pd) out.push("PD " + pd);
    return out.concat(extras).join(" · ");
  }

  function isPayoffLabel(text) {
    return /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+20\d{2}$/.test(String(text || "").replace(/^\s+|\s+$/g, ""));
  }

  function vaultRowSecondary(doc) {
    if (!doc) return "";
    var type = normalizeVaultType(doc.vaultType || inferVaultType(doc));
    if (type === "insurance") return String(doc.termRenewal || "").replace(/^\s+|\s+$/g, "");
    if (type !== "loan" && type !== "mortgage") return "";
    var stored = String(doc.term || "").replace(/^\s+|\s+$/g, "");
    var estimate = type === "loan" ? (estimateLoanPayoff(doc) || "") : "";
    if (!stored && estimate) return "Payoff est. " + estimate;
    if (!stored) return "";
    if (estimate && stored === estimate) return "Payoff est. " + stored;
    if (isPayoffLabel(stored)) return "Payoff " + stored;
    return stored;
  }

  function parseVaultPdfFields(text) {
    var blob = String(text || "").replace(/\r/g, "\n");
    var lower = blob.toLowerCase();
    var out = {};
    out.vaultType = detectVaultType(blob);
    if (out.vaultType) {
      var provider = providerFromBlob(blob, out.vaultType);
      if (provider) out.provider = provider;
    } else {
      var anyProvider = providerFromBlob(blob, "insurance") || providerFromBlob(blob, "loan");
      if (anyProvider) out.provider = anyProvider;
    }
    var policy = policyNumberFromBlob(blob);
    if (policy) out.policyNumber = policy;

    var premium = extractPremium(blob, out.vaultType);
    if (premium && premium.premium > 0) {
      out.premium = premium.premium;
      if (premium.premiumFrequency) out.premiumFrequency = premium.premiumFrequency;
    }

    var structuredDed = out.vaultType === "insurance" ? insuranceDeductibles(blob) : "";
    if (structuredDed) out.deductibles = structuredDed;
    else {
      var deductLines = [];
      blob.split(/\n/).forEach(function (line) {
        if (/deductible/i.test(line)) deductLines.push(line.replace(/^\s+|\s+$/g, ""));
      });
      if (deductLines.length) out.deductibles = deductLines.join("; ");
    }

    var vehicle = vehicleFromBlob(blob);
    if (out.vaultType === "loan" || out.vaultType === "mortgage") {
      if (/collateral/i.test(blob) && vehicle) out.collateral = vehicle;
      var property = captureLine(blob, /(?:property(?:\s+address)?|subject property|collateral)\s*[:#-]?\s*([^\n]+)/i);
      if (property && out.vaultType === "mortgage") out.property = property.replace(/\s+$/, "");
      else if (property && !out.collateral) out.collateral = property.replace(/\s+$/, "");
    } else if (vehicle) {
      out.insuredItems = vehicle;
    } else {
      var insured = captureLine(blob, /(?:named insured|insured(?:\s+(?:item|items))?)\s*[:#-]?\s*([^\n]+)/i);
      if (insured && !/^\d{1,2}[\/\-]/.test(insured)) out.insuredItems = insured.replace(/\s+$/, "");
    }

    var orig = blob.match(/original\s+(?:loan\s+)?(?:balance|amount)\s*[:#-]?\s*\$?\s*([0-9,]+(?:\.[0-9]{2})?)/i);
    if (!orig) orig = blob.match(/(?:amount financed|original amount(?:\s+financed)?)\s*[:#-]?\s*\$?\s*([0-9,]+(?:\.[0-9]{2})?)/i);
    if (orig) out.originalBalance = parseMoneyAmount(orig[1]);

    blob.split(/\n/).some(function (line) {
      if (/original/i.test(line)) return false;
      var m = line.match(/(?:principal|current|outstanding|remaining|unpaid)?\s*balance\s*[:#-]?\s*\$?\s*([0-9,]+(?:\.[0-9]{2})?)/i);
      if (!m || !/balance/i.test(line)) return false;
      out.balance = parseMoneyAmount(m[1]);
      return true;
    });

    var rate = blob.match(/(?:interest\s+rate|annual percentage rate|\bapr\b)\s*[:#-]?\s*([0-9]+(?:\.[0-9]+)?)\s*%/i);
    if (rate) out.rate = Number(rate[1]) || 0;

    var minPay = blob.match(/(?:min(?:imum)?|regular|scheduled)\s+payment\s*[:#-]?\s*\$?\s*([0-9,]+(?:\.[0-9]{2})?)/i);
    var pay = blob.match(/monthly\s+payment\s*[:#-]?\s*\$?\s*([0-9,]+(?:\.[0-9]{2})?)/i);
    if (out.vaultType !== "insurance") {
      if (minPay) out.minPayment = parseMoneyAmount(minPay[1]);
      if (pay) {
        if (out.vaultType === "mortgage") out.payment = parseMoneyAmount(pay[1]);
        else if (!out.minPayment) out.minPayment = parseMoneyAmount(pay[1]);
      }
    }

    if (out.vaultType === "insurance") {
      var period = policyPeriodPhrase(blob);
      if (period) out.termRenewal = period;
      var limits = insuranceLimits(blob);
      if (limits) out.limits = limits;
      var notes = insuranceReviewNotes(blob);
      if (notes) out.notes = notes;
    } else if (out.vaultType === "loan") {
      var payoffRaw = captureLine(blob, /(?:payoff|paid[\s-]*off|maturity)(?:\s+date)?\s*[:#-]?\s*([^\n]+)/i) || "";
      var termRaw = captureLine(blob, /(?:^|\n)\s*term\s*[:#-]?\s*([^\n]+)/i) || "";
      var source = payoffFromText(payoffRaw) ? payoffRaw : (termRaw || payoffRaw);
      var resolved = resolveLoanTerm(source, out);
      var originalMonths = monthsPhrase(termRaw) || monthsPhrase(payoffRaw);
      if (originalMonths && resolved.term && resolved.term.indexOf(originalMonths) < 0 && !resolved.note) {
        resolved.note = "Original term " + originalMonths + ".";
      }
      if (resolved.term) out.term = resolved.term;
      if (resolved.note) out.notes = out.notes ? out.notes + " " + resolved.note : resolved.note;
    } else {
      var term = captureLine(blob, /(?:^|\n)\s*term\s*[:#-]?\s*([^\n]+)/i);
      if (!term) term = captureLine(blob, /(?:^|\n)\s*maturity(?:\s+date)?\s*[:#-]?\s*([^\n]+)/i);
      if (term) out.term = term;
    }

    if (/auto|car|vehicle|automobile/.test(lower)) {
      if (out.vaultType === "insurance") out.title = out.provider ? "Auto Insurance — " + out.provider : "Auto Insurance";
      else if (out.vaultType === "loan") out.title = out.provider ? "Auto Loan — " + out.provider : "Auto Loan";
    } else if (out.vaultType === "mortgage") {
      out.title = out.provider ? "Mortgage — " + out.provider : "Mortgage";
    } else if (out.vaultType === "insurance") {
      out.title = out.provider ? "Insurance — " + out.provider : "Insurance";
    } else if (out.vaultType === "loan") {
      out.title = out.provider ? "Loan — " + out.provider : "Loan";
    }
    if (out.vaultType === "paystub" || looksLikePayStubText(blob)) {
      var stub = parsePayStubText(blob);
      if (stub && (stub.confidence > 0 || stub.gross != null || stub.net != null)) {
        out.payStub = stub;
      }
      // Keep Vault card type as other; slot inference uses paystub signal separately.
      if (out.vaultType === "paystub") delete out.vaultType;
    }
    if (!out.vaultType) delete out.vaultType;
    return out;
  }
  function isGenericVaultTitle(title, type) {
    var t = String(title || "").replace(/^\s+|\s+$/g, "").toLowerCase();
    if (!t) return true;
    return t === String(vaultTypeTitle(type) || "").toLowerCase();
  }

  function vaultFieldIsEmpty(field, value, doc) {
    if (field === "title") return isGenericVaultTitle(value, doc && doc.vaultType);
    if (field === "vaultType") {
      if (doc && doc.vaultTypeCustomized) return false;
      var type = String(value || "").replace(/^\s+|\s+$/g, "").toLowerCase();
      return !type || type === "other";
    }
    if (field === "premiumFrequency") {
      var freq = String(value || "").replace(/^\s+|\s+$/g, "").toLowerCase();
      return !freq || freq === "monthly";
    }
    if (field === "premium" || field === "payment" || field === "balance" ||
        field === "minPayment" || field === "originalBalance" || field === "rate") {
      return !(Number(value) > 0);
    }
    return !String(value == null ? "" : value).replace(/^\s+|\s+$/g, "");
  }

  function applyVaultPdfAutofill(doc, parsed, opts) {
    doc = doc && typeof doc === "object" ? doc : {};
    parsed = parsed || {};
    opts = opts || {};
    var touched = opts.touched || doc.touchedFields || {};
    var filled = [];
    Object.keys(parsed).forEach(function (key) {
      if (parsed[key] == null || parsed[key] === "") return;
      if (touched[key]) return;
      if (!vaultFieldIsEmpty(key, doc[key], doc)) return;
      doc[key] = parsed[key];
      filled.push(key);
    });
    if (!doc.touchedFields || typeof doc.touchedFields !== "object") doc.touchedFields = {};
    if (!Array.isArray(doc.pdfAutofilledFields)) doc.pdfAutofilledFields = [];
    if (filled.length) {
      filled.forEach(function (key) {
        if (doc.pdfAutofilledFields.indexOf(key) < 0) doc.pdfAutofilledFields.push(key);
      });
      doc.pdfAutofillReview = true;
      if (doc.addToNetWorth == null && (doc.vaultType === "loan" || doc.vaultType === "mortgage")) {
        doc.addToNetWorth = true;
      }
      doc.pdfAutofilled = true;
    }
    return { doc: doc, filled: filled };
  }

  function monthsToPayOff(balance, aprPercent, payment) {
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

  function amortizedInterest(balance, aprPercent, payment, months) {
    balance = Number(balance) || 0;
    aprPercent = Number(aprPercent) || 0;
    payment = Number(payment) || 0;
    months = Number(months) || 0;
    if (!(balance > 0) || !(aprPercent > 0) || !(payment > 0) || !(months > 0)) return 0;
    var r = (aprPercent / 100) / 12;
    var remaining = balance;
    var interest = 0;
    var i;
    for (i = 0; i < months && remaining > 0.005; i++) {
      var iAmt = remaining * r;
      interest += iAmt;
      var principal = payment - iAmt;
      if (principal <= 0) break;
      remaining = Math.max(0, remaining - principal);
    }
    return Math.round(interest * 100) / 100;
  }

  function extraPayoffInsight(balance, aprPercent, minPayment, extra) {
    extra = Number(extra) || 0;
    var current = monthsToPayOff(balance, aprPercent, minPayment);
    if (current == null) return null;
    var faster = extra > 0 ? monthsToPayOff(balance, aprPercent, Number(minPayment) + extra) : current;
    var interestNow = amortizedInterest(balance, aprPercent, minPayment, current);
    var interestFast = extra > 0 && faster != null
      ? amortizedInterest(balance, aprPercent, Number(minPayment) + extra, faster)
      : interestNow;
    var savedMonths = faster != null ? Math.max(0, current - faster) : 0;
    return {
      currentMonths: current,
      extraMonths: faster,
      savedMonths: savedMonths,
      interestCurrent: interestNow,
      interestExtra: interestFast,
      interestSaved: Math.max(0, Math.round((interestNow - interestFast) * 100) / 100)
    };
  }

  function exactAgeLine(ageYears) {
    if (ageYears == null || !(Number(ageYears) >= 0)) return "";
    return "You're " + Math.floor(Number(ageYears));
  }

  function compareDeck(opts) {
    opts = opts || {};
    var peers = comparePeers(opts);
    var premium = normalizePlan(opts.plan) === "premium";
    var all = [
      { id: "income", title: "Income", you: peers.youIncome, peer: peers.peerIncome },
      { id: "nw", title: "Net worth", you: peers.youNetWorth, peer: peers.peerNetWorth },
      { id: "debt", title: "Debt", you: peers.youDebt, peer: peers.peerDebt }
    ];
    var cards = all.map(function (card, i) {
      var locked = !premium && i >= 2;
      return {
        id: card.id,
        title: card.title,
        you: locked ? null : card.you,
        peer: locked ? null : card.peer,
        locked: locked,
        teaser: !premium && i === 1
      };
    });
    if (!premium) cards = cards.slice(0, 2);
    return {
      exactAge: exactAgeLine(opts.ageYears),
      ageBand: peers.ageBand,
      geo: peers.geo,
      citation: peers.citation,
      needsBirthday: peers.needsBirthday,
      teaser: peers.teaser,
      cards: cards,
      premium: premium
    };
  }

  function shouldAddVaultToNetWorth(doc) {
    if (!doc) return false;
    var type = normalizeVaultType(doc.vaultType);
    if (type !== "loan" && type !== "mortgage") return false;
    if (doc.addToNetWorth === false) return false;
    return true;
  }

  var GOAL_CHIPS = [
    { id: "buy-home", label: "Buy a home" },
    { id: "start-business", label: "Start a business" },
    { id: "kill-debt", label: "Kill debt" },
    { id: "invest", label: "Invest" },
    { id: "emergency-fund", label: "Emergency fund" },
    { id: "retire", label: "Retire on my terms" },
    { id: "travel", label: "Travel" },
    { id: "education", label: "Education / kids" }
  ];

  var CHASE_NEEDS = [
    { id: "significance", title: "Significance" },
    { id: "acceptance", title: "Acceptance" },
    { id: "intelligence", title: "Intelligence" },
    { id: "pity", title: "Pity / sympathy" },
    { id: "strength", title: "Strength / power" }
  ];

  var SCF_AGE_BANDS = [
    { id: "under35", label: "Under 35", minAge: 0, maxAge: 34, medianIncome: 60700, medianNetWorth: 39000, medianDebt: 27000 },
    { id: "35-44", label: "35–44", minAge: 35, maxAge: 44, medianIncome: 86800, medianNetWorth: 135600, medianDebt: 89400 },
    { id: "45-54", label: "45–54", minAge: 45, maxAge: 54, medianIncome: 90800, medianNetWorth: 247200, medianDebt: 95000 },
    { id: "55-64", label: "55–64", minAge: 55, maxAge: 64, medianIncome: 82100, medianNetWorth: 364500, medianDebt: 55000 },
    { id: "65-74", label: "65–74", minAge: 65, maxAge: 74, medianIncome: 61000, medianNetWorth: 409900, medianDebt: 32000 },
    { id: "75plus", label: "75+", minAge: 75, maxAge: 120, medianIncome: 50000, medianNetWorth: 335600, medianDebt: 12000 }
  ];

  var ACS_GEO = [
    { digit: 0, label: "New England / NJ", medianIncome: 85400 },
    { digit: 1, label: "NY / PA / DE", medianIncome: 76200 },
    { digit: 2, label: "Mid-Atlantic / Upper South", medianIncome: 78900 },
    { digit: 3, label: "Southeast", medianIncome: 64800 },
    { digit: 4, label: "Great Lakes", medianIncome: 68400 },
    { digit: 5, label: "Upper Midwest", medianIncome: 72100 },
    { digit: 6, label: "Central Plains", medianIncome: 70200 },
    { digit: 7, label: "South Central", medianIncome: 67500 },
    { digit: 8, label: "Mountain", medianIncome: 75800 },
    { digit: 9, label: "Pacific", medianIncome: 91200 }
  ];
  var ACS_NATIONAL = 74580;
  var COMPARE_CITATION = "Fed SCF 2022 medians by age of family head. ZIP uses Census ACS 2022 region seed (first digit) — not live peers.";

  function normalizePlan(raw) {
    return raw === "premium" ? "premium" : "free";
  }

  function ageBandFor(ageYears) {
    if (ageYears == null || !(ageYears >= 0)) return null;
    var i;
    for (i = 0; i < SCF_AGE_BANDS.length; i++) {
      if (ageYears >= SCF_AGE_BANDS[i].minAge && ageYears <= SCF_AGE_BANDS[i].maxAge) return SCF_AGE_BANDS[i];
    }
    return SCF_AGE_BANDS[SCF_AGE_BANDS.length - 1];
  }

  function geoForZip(zip) {
    var digits = String(zip || "").replace(/\D/g, "");
    if (!digits) return null;
    var digit = Number(digits.charAt(0));
    var i;
    for (i = 0; i < ACS_GEO.length; i++) {
      if (ACS_GEO[i].digit === digit) return ACS_GEO[i];
    }
    return null;
  }

  function comparePeers(opts) {
    opts = opts || {};
    var band = ageBandFor(opts.ageYears);
    var geo = geoForZip(opts.zip);
    var factor = geo ? geo.medianIncome / ACS_NATIONAL : 1;
    var wealthFactor = 0.7 + 0.3 * factor;
    var peerIncome = (band ? band.medianIncome : 70300) * factor;
    var peerNW = (band ? band.medianNetWorth : 192700) * wealthFactor;
    var peerDebt = (band ? band.medianDebt : 45000) * wealthFactor;
    var youIncome = Math.max(0, Number(opts.income) || 0);
    var ratio = peerIncome > 0 ? youIncome / peerIncome : 0;
    var teaser;
    if (!band) teaser = "How you compare needs a birthday — subscribe for the full picture.";
    else if (ratio >= 1.05) teaser = "Income looks above the " + band.label + " median — subscribe for the full picture.";
    else if (ratio <= 0.95) teaser = "Income looks below the " + band.label + " median — subscribe for the full picture.";
    else teaser = "Income is near the " + band.label + " median — subscribe for the full picture.";
    return {
      ageBand: band || SCF_AGE_BANDS[0],
      geo: geo,
      zip: opts.zip || "",
      youIncome: youIncome,
      youNetWorth: Number(opts.netWorth) || 0,
      youDebt: Math.max(0, Number(opts.debt) || 0),
      peerIncome: peerIncome,
      peerNetWorth: peerNW,
      peerDebt: peerDebt,
      citation: COMPARE_CITATION,
      teaser: teaser,
      needsBirthday: !band,
      exactAge: opts.ageYears == null ? null : Math.floor(Number(opts.ageYears)),
      exactAgeLine: exactAgeLine(opts.ageYears)
    };
  }

  function autoCategorize(payee) {
    var name = String(payee || "").replace(/^\s+|\s+$/g, "");
    var lowered = name.toLowerCase();
    function has(bits) {
      var i;
      for (i = 0; i < bits.length; i++) if (lowered.indexOf(bits[i]) >= 0) return true;
      return false;
    }
    function map(envelope, line) {
      return { payee: name, envelope: envelope, line: line };
    }
    if (has(["market", "grocery", "kroger", "safeway", "whole foods", "trader joe", "aldi", "costco", "walmart", "heb"])) {
      return map("Food", "Groceries");
    }
    if (has(["starbucks", "chipotle", "mcdonald", "restaurant", "cantina", "doordash", "uber eats", "cafe"])) {
      return map("Food", "Restaurants");
    }
    if (has(["shell", "exxon", "chevron", "gas", "uber", "lyft", "parking"])) {
      return map("Transportation", "Transportation");
    }
    if (has(["netflix", "spotify", "hulu", "disney+", "apple.com", "icloud", "youtube premium"])) {
      return map("Subscriptions", "Subscriptions");
    }
    if (has(["pg&e", "electric", "water", "utility", "comcast", "xfinity", "verizon", "at&t"])) {
      return map("Utilities", "Utilities");
    }
    if (has(["geico", "state farm", "allstate", "progressive", "insurance"])) {
      return map("Insurance", "Insurance");
    }
    if (has(["cvs", "walgreens", "pharmacy", "dentist", "hospital"])) {
      return map("Health", "Health");
    }
    if (has(["rent", "mortgage", "landlord", "hoa"])) return map("Housing", "Housing");
    if (has(["amazon", "target"])) return map("Miscellaneous", "Miscellaneous");
    return map("Miscellaneous", "Miscellaneous");
  }

  function topMerchants(transactions, limit) {
    var totals = {};
    var labels = {};
    (transactions || []).forEach(function (tx) {
      var name = String(tx && tx.payee || "").replace(/^\s+|\s+$/g, "");
      var amount = Number(tx && tx.amount) || 0;
      if (!name || !(amount > 0)) return;
      var key = name.toLowerCase();
      totals[key] = (totals[key] || 0) + amount;
      if (!labels[key]) labels[key] = name;
    });
    return Object.keys(totals).sort(function (a, b) { return totals[b] - totals[a]; })
      .slice(0, limit || 3)
      .map(function (key) {
        return {
          name: labels[key],
          amount: totals[key],
          category: autoCategorize(labels[key]).line
        };
      });
  }

  function spendingTrends(thisMonth, lastMonth) {
    var current = {};
    var prior = {};
    (thisMonth || []).forEach(function (row) {
      current[row.envelope] = (current[row.envelope] || 0) + (Number(row.amount) || 0);
    });
    (lastMonth || []).forEach(function (row) {
      prior[row.envelope] = (prior[row.envelope] || 0) + (Number(row.amount) || 0);
    });
    var keys = {};
    Object.keys(current).forEach(function (k) { keys[k] = true; });
    Object.keys(prior).forEach(function (k) { keys[k] = true; });
    return Object.keys(keys).sort().map(function (key) {
      var now = current[key] || 0;
      var then = prior[key] || 0;
      return {
        label: key,
        thisMonth: now,
        lastMonth: then,
        unusual: then > 0 && now > then * 1.5 && (now - then) >= 50
      };
    }).filter(function (row) { return row.thisMonth > 0 || row.lastMonth > 0; });
  }

  function insurancePolicyKind(title, provider) {
    var blob = String(title || "") + " " + String(provider || "");
    blob = blob.toLowerCase();
    if (blob.indexOf("auto") >= 0 || blob.indexOf("car") >= 0 || blob.indexOf("vehicle") >= 0) return "auto";
    if (blob.indexOf("home") >= 0 || blob.indexOf("homeowner") >= 0 || blob.indexOf("hazard") >= 0) return "home";
    if (blob.indexOf("rent") >= 0) return "renters";
    if (blob.indexOf("health") >= 0 || blob.indexOf("medical") >= 0) return "health";
    if (blob.indexOf("life") >= 0) return "life";
    if (blob.indexOf("disability") >= 0 || blob.indexOf("ltd") >= 0) return "disability";
    return "other";
  }

  function monthlyPremium(amount, frequency) {
    var n = Number(amount) || 0;
    if (!(n > 0)) return 0;
    if (frequency === "quarterly") return n / 3;
    if (frequency === "semiannual") return n / 6;
    if (frequency === "annual") return n / 12;
    return n;
  }

  function cohortPremium(policy, ageYears) {
    var age = ageYears == null ? 35 : ageYears;
    if (policy === "auto") {
      if (age < 25) return 195;
      if (age < 35) return 165;
      if (age < 45) return 140;
      if (age < 55) return 130;
      if (age < 65) return 125;
      return 140;
    }
    if (policy === "home") return 155;
    if (policy === "renters") return 22;
    if (policy === "health") return age >= 50 ? 520 : 450;
    if (policy === "life") return age >= 50 ? 65 : 38;
    if (policy === "disability") return 35;
    return 80;
  }

  function isInsuranceDocMissingPremium(doc) {
    if (!doc) return false;
    var type = String(doc.vaultType || "");
    if (type === "loan" || type === "mortgage") return false;
    var insurance = type === "insurance" || doc.slot === "insurance";
    if (!insurance) {
      var kind = insurancePolicyKind(doc.title, doc.provider);
      if (kind === "other") return false;
      if (type && type !== "insurance" && type !== "other") return false;
      insurance = !type || type === "other" || type === "insurance";
    }
    if (!insurance) return false;
    return !(monthlyPremium(doc.premium, doc.premiumFrequency || doc.frequency) > 0);
  }

  function insuranceOverpay(docs, ageYears) {
    var rows = [];
    var unread = 0;
    (docs || []).forEach(function (doc) {
      if (!doc) return;
      if (isInsuranceDocMissingPremium(doc)) unread++;
      var kind = insurancePolicyKind(doc.title || doc.provider, doc.provider);
      var monthly = monthlyPremium(doc.premium, doc.premiumFrequency || doc.frequency);
      if (!(monthly > 0)) return;
      if (doc.vaultType && doc.vaultType !== "insurance" && kind === "other") return;
      var cohort = cohortPremium(kind, ageYears);
      rows.push({
        title: doc.title || doc.provider || "Policy",
        policy: kind,
        youMonthly: monthly,
        cohortMonthly: cohort,
        overpayMonthly: Math.max(0, monthly - cohort)
      });
    });
    var total = 0;
    rows.forEach(function (row) { total += row.overpayMonthly; });
    var teaser;
    var emptyCopy = unread > 0
      ? insuranceUnreadPremiumCopy()
      : "Add a Vault insurance card with a premium to benchmark. Cohort table is a stub.";
    if (unread > 0 && !rows.length) teaser = emptyCopy;
    else if (total > 0) teaser = "You may be overpaying ~$" + Math.round(total) + "/mo — subscribe for details";
    else if (!rows.length) teaser = "Add an insurance card with a premium in the Vault to benchmark it — subscribe for details";
    else teaser = "Insurance looks near the cohort seed — subscribe for details";
    return {
      totalOverpayMonthly: total,
      rows: rows,
      teaser: teaser,
      stub: true,
      unreadPremium: unread > 0 && !rows.length,
      unreadCount: unread,
      emptyCopy: emptyCopy
    };
  }

  function wrappedRecap(opts) {
    opts = opts || {};
    return {
      title: (opts.year || new Date().getFullYear()) + " Wrapped",
      period: "Calendar " + (opts.year || new Date().getFullYear()),
      spent: Number(opts.spent) || 0,
      merchants: (opts.merchants || []).slice(0, 3),
      savingsRate: opts.savingsRate == null ? null : opts.savingsRate,
      netWorthDelta: opts.netWorthDelta == null ? null : opts.netWorthDelta,
      fooStepName: opts.fooStepName || ""
    };
  }

  function rankedNeeds(scores) {
    scores = scores || {};
    var ranked = CHASE_NEEDS.map(function (need) {
      return { id: need.id, title: need.title, score: Number(scores[need.id]) || 0 };
    }).filter(function (row) { return row.score > 0; }).sort(function (a, b) {
      if (b.score !== a.score) return b.score - a.score;
      return a.id < b.id ? -1 : 1;
    });
    return {
      primary: ranked[0] || null,
      secondary: ranked[1] || null
    };
  }

  function pad2(n) {
    n = Number(n) || 0;
    return (n < 10 ? "0" : "") + n;
  }

  function parseISODateLocal(iso) {
    var parts = String(iso || "").split("-");
    if (parts.length < 3) return null;
    var date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    if (isNaN(date.getTime())) return null;
    return date;
  }

  function formatISODateLocal(date) {
    return date.getFullYear() + "-" + pad2(date.getMonth() + 1) + "-" + pad2(date.getDate());
  }

  function normalizeMerchant(name) {
    return String(name || "")
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .replace(/^\s+|\s+$/g, "");
  }

  function noSpendStreak(outflowDates, todayISO, earliestISO) {
    var outflow = {};
    (outflowDates || []).forEach(function (day) {
      if (day) outflow[String(day).slice(0, 10)] = true;
    });
    if (!todayISO) return 0;
    var keys = Object.keys(outflow);
    if (!earliestISO && !keys.length) return 0;
    var floor = earliestISO ? String(earliestISO).slice(0, 10) : keys.sort()[0];
    var cursor = parseISODateLocal(String(todayISO).slice(0, 10));
    var stop = parseISODateLocal(floor);
    if (!cursor || !stop) return 0;
    var streak = 0;
    var guard = 0;
    while (guard < 8000) {
      var iso = formatISODateLocal(cursor);
      if (outflow[iso]) break;
      if (cursor < stop) break;
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
      guard += 1;
    }
    return streak;
  }

  function runwayMonths(emergencyAmount, essentialMonthlyBurn) {
    var burn = Number(essentialMonthlyBurn) || 0;
    if (!(burn > 0)) return null;
    return Math.max(0, Number(emergencyAmount) || 0) / burn;
  }

  function merchantRule(legs) {
    var rows = (legs || []).filter(function (leg) {
      return leg && leg.categoryName && leg.lineName && (Number(leg.amount) || 0) > 0;
    });
    if (!rows.length) return null;
    var total = rows.reduce(function (sum, leg) { return sum + (Number(leg.amount) || 0); }, 0);
    if (!(total > 0)) return null;
    var split = rows.length > 1
      ? rows.map(function (leg) {
        return {
          categoryName: leg.categoryName,
          lineName: leg.lineName,
          ratio: (Number(leg.amount) || 0) / total
        };
      })
      : null;
    return {
      categoryName: rows[0].categoryName,
      lineName: rows[0].lineName,
      split: split
    };
  }

  function suggestMerchantLegs(rule, total) {
    if (!rule || !rule.categoryName) return null;
    var amount = Number(total) || 0;
    if (rule.split && rule.split.length > 1 && amount > 0) {
      var legs = [];
      var used = 0;
      rule.split.forEach(function (leg, index) {
        var part = index === rule.split.length - 1
          ? Math.round((amount - used) * 100) / 100
          : Math.round(amount * (Number(leg.ratio) || 0) * 100) / 100;
        used = Math.round((used + part) * 100) / 100;
        legs.push({
          categoryName: leg.categoryName,
          lineName: leg.lineName,
          amount: part
        });
      });
      return legs;
    }
    return [{
      categoryName: rule.categoryName,
      lineName: rule.lineName || rule.categoryName,
      amount: amount
    }];
  }

  function moneyLabel(n) {
    var value = Number(n) || 0;
    var sign = value < 0 ? "-" : "";
    var abs = Math.abs(value);
    var fixed = abs.toFixed(2);
    var parts = fixed.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return sign + "$" + parts.join(".");
  }

  function buildWrappedDeck(opts) {
    opts = opts || {};
    var premium = !!opts.premium;
    var slides = [];
    var days = Number(opts.daysLogged) || 0;
    var hookLines = [days + (days === 1 ? " day logged" : " days logged")];
    if (opts.spanLabel) hookLines.push(opts.spanLabel);
    slides.push({
      id: "hook",
      kicker: "Your wrap",
      title: opts.periodName || "This period",
      lines: hookLines,
      chip: ""
    });
    var moneyIn = Number(opts.moneyIn) || 0;
    var moneyOut = Number(opts.moneyOut) || 0;
    // v37.5.43: dollars saved are the assigned savings-envelope plan. Planned
    // spending envelopes are not savings, and no plan means $0 saved.
    var savedAmt = Math.max(0, Number(opts.savedPlanned) || 0);
    var ledgerEmpty = !(moneyIn > 0) && !(moneyOut > 0);
    slides.push({
      id: "spent-saved",
      kicker: "The ledger",
      /* v37.5.59.2: Ledger "In" is take-home under the Basic per-month rule (monthTakeHome):
       * planned until every paycheck that month is fully received, then Received. Never gross. */
      title: ledgerEmpty ? "Nothing on the books yet" : ("Take-home in " + moneyLabel(moneyIn)),
      lines: ledgerEmpty
        ? ["Add your paychecks and log a purchase — this fills in as you go."]
        : [
          "Take-home = what you received in finished months (planned only if none was logged); the current month counts planned paychecks until all arrive — same basis as Basic savings rate. Gross pay lives on your Income statement.",
          takeHomeBasisLine(opts.takeHomeBasis),
          "Out " + moneyLabel(moneyOut),
          "Savings envelopes (planned) " + moneyLabel(savedAmt),
          "Savings envelopes are what you assigned to save — not In minus Out."
        ].filter(Boolean),
      chip: "",
      chart: {
        type: "bars",
        rows: [
          { title: "Take-home in", amount: moneyIn, id: "in" },
          { title: "Out", amount: moneyOut, id: "spent" },
          { title: "Envelope savings", amount: savedAmt, id: "saved" }
        ].filter(function (r) { return r.amount > 0 || moneyIn > 0; })
      }
    });
    // Keep legacy money id as alias for older callers
    slides.push({
      id: "money",
      kicker: "The ledger",
      title: "Take-home in " + moneyLabel(moneyIn),
      lines: [
        "Out " + moneyLabel(moneyOut),
        "Savings envelopes (planned) " + moneyLabel(savedAmt)
      ],
      chip: "",
      hidden: true
    });
    if (!premium) {
      slides.push({
        id: "locked",
        kicker: "Premium",
        title: "The rest of your wrap",
        lines: ["Merchants, charts, the order of operations, and a share card stay on Premium."],
        chip: "",
        locked: true
      });
      return { cadence: opts.cadence || "month", premium: false, slides: slides.filter(function (s) { return !s.hidden; }) };
    }
    var categories = opts.categories || [];
    if ((!categories.length) && opts.categoryName && (Number(opts.categoryAmount) || 0) > 0) {
      categories = [{ name: opts.categoryName, amount: opts.categoryAmount }];
    }
    /* Aggregate Top categories skipped when per-category story pages exist (owner). */
    var hasCategoryStories = !!(opts.categoryStories && (opts.categoryStories.categories || []).length);
    if (!hasCategoryStories && categories.length) {
      var spendTotal = moneyOut > 0 ? moneyOut : categories.reduce(function (n, row) {
        return n + (Number(row.amount) || 0);
      }, 0);
      var catLines = categories.slice(0, 5).map(function (row) {
        var amt = Number(row.amount) || 0;
        var pct = spendTotal > 0 ? Math.round((amt / spendTotal) * 100) : 0;
        return row.name + " · " + moneyLabel(amt) + " · " + pct + "%";
      });
      if (opts.categorySwing && opts.categorySwing.name) {
        catLines.push("Biggest swing · " + opts.categorySwing.name + " · " + moneyLabel(opts.categorySwing.delta));
      }
      slides.push({
        id: "categories",
        kicker: "Envelopes",
        title: "Top categories",
        lines: catLines,
        chip: "",
        chart: {
          type: "bars",
          rows: categories.slice(0, 5).map(function (row) {
            var amt = Number(row.amount) || 0;
            var pct = spendTotal > 0 ? Math.round((amt / spendTotal) * 100) : 0;
            return { title: row.name + " " + pct + "%", amount: amt, id: row.name, pct: pct };
          })
        }
      });
    } else if (!hasCategoryStories && opts.categoryName && (Number(opts.categoryAmount) || 0) > 0) {
      slides.push({
        id: "category",
        kicker: "Envelope",
        title: opts.categoryName,
        lines: ["Biggest category · " + moneyLabel(opts.categoryAmount)],
        chip: ""
      });
    }
    /* v37.5.55 (owner): one Wrapped page per spending category.
     * Walkthrough: spent vs income, planned vs spent, biggest purchase, most-common merchant. */
    var stories = (opts.categoryStories && opts.categoryStories.categories) || [];
    /* v37.5.55: custom envelopes auto-include; cap at 10 by spend so Wrapped stays walkable. */
    var storyCap = 10;
    var storyTotal = stories.length;
    var storyOmitted = Math.max(0, storyTotal - storyCap);
    stories = stories.slice(0, storyCap);
    var yearIncome = opts.categoryStories && opts.categoryStories.income != null
      ? Number(opts.categoryStories.income) : (Number(opts.moneyIn) || 0);
    if (!stories.length && opts.planVsSpent && (opts.planVsSpent.rows || []).length) {
      stories = (opts.planVsSpent.rows || []).map(function (r) {
        return { name: r.name, planned: r.planned, spent: r.spent, biggest: null, topMerchant: null };
      });
    }
    stories.forEach(function (cat, index) {
      var spent = Math.max(0, Number(cat.spent) || 0);
      var planned = Math.max(0, Number(cat.planned) || 0);
      var diff = planned - spent;
      var share = yearIncome > 0 ? Math.round((spent / yearIncome) * 1000) / 10 : null;
      var lines = [];
      if (index === 0 && storyOmitted > 0) {
        lines.push("Showing top " + stories.length + " of " + storyTotal + " categories by spend.");
      }
      // v37.5.59.5 (QA): always one decimal ("0.4%", never "0%").
      lines.push("Spent " + moneyLabel(spent) + (share == null ? "" : " · " + share.toFixed(1) + "% of take-home"));
      lines.push("Take-home this year " + moneyLabel(yearIncome));
      if (planned > 0 || spent > 0) {
        lines.push("Planned " + moneyLabel(planned) + " · " +
          moneyLabel(Math.abs(diff)) + (diff >= 0 ? " under plan" : " over plan"));
      }
      if (cat.biggest && cat.biggest.amount > 0) {
        lines.push("Biggest purchase · " + cat.biggest.payee + " · " + moneyLabel(cat.biggest.amount) +
          (cat.biggest.date ? " · " + cat.biggest.date : ""));
      } else {
        lines.push("Biggest purchase · none logged yet");
      }
      if (cat.topMerchant && cat.topMerchant.count > 0) {
        lines.push("Most common · " + cat.topMerchant.name + " · " + cat.topMerchant.count +
          (cat.topMerchant.count === 1 ? " time" : " times") +
          " · " + moneyLabel(cat.topMerchant.amount));
      } else {
        lines.push("Most common merchant · none logged yet");
      }
      var chartRows = [];
      // v37.5.59.6 (QA): a $0 category still gets its Spent row (an empty bar), so the take-home bar
      // never stands alone looking like a full category.
      if (spent > 0 || yearIncome > 0) chartRows.push({ title: "Spent", amount: Math.max(0, spent), id: "spent" });
      if (yearIncome > 0) chartRows.push({ title: "Take-home", amount: yearIncome, id: "income" });
      slides.push({
        id: "category-" + index + "-" + String(cat.name || "cat").toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        kicker: "Category · " + (index + 1) + " of " + stories.length,
        title: cat.name || "Category",
        lines: lines,
        chip: "",
        chart: chartRows.length ? { type: "bars", rows: chartRows } : null
      });
    });
    if (opts.netWorthDelta != null || opts.debtDelta != null) {
      var deltaLines = [];
      var deltaRows = [];
      var deltaLabel = opts.netWorthDeltaLabel || "Year change";
      if (opts.netWorthDelta != null) {
        deltaLines.push(deltaLabel + " · net worth " + moneyLabel(opts.netWorthDelta));
        deltaRows.push({ title: "Net worth", amount: Math.abs(Number(opts.netWorthDelta) || 0), id: "nw" });
      }
      if (opts.debtDelta != null) {
        deltaLines.push(deltaLabel + " · debt " + moneyLabel(opts.debtDelta));
        deltaRows.push({ title: "Debt", amount: Math.abs(Number(opts.debtDelta) || 0), id: "debt" });
      }
      slides.push({
        id: "deltas",
        kicker: "The year",
        title: "Net worth and debt",
        lines: deltaLines.length ? deltaLines : ["No Vault / Net Worth change on file yet."],
        chip: "",
        chart: deltaRows.length ? { type: "bars", rows: deltaRows } : null,
        empty: !deltaLines.length
      });
    } else {
      slides.push({
        id: "deltas",
        kicker: "The year",
        title: "Net worth and debt",
        lines: [opts.netWorthHint || "Add another Net Worth year to see the change."],
        chip: "",
        empty: true
      });
    }
    var merchants = opts.merchants || [];
    if (merchants.length) {
      var merchantLines = merchants.slice(0, 5).map(function (row) {
        return row.name + " · " + moneyLabel(row.amount) + (row.category ? " · " + row.category : "");
      });
      if (opts.surprise && opts.surprise.name) {
        merchantLines.push("Surprise · " + opts.surprise.name + " · " + moneyLabel(opts.surprise.amount));
      }
      slides.push({
        id: "merchants",
        kicker: "Where it went",
        title: "Top merchants",
        lines: merchantLines,
        chip: "",
        chart: {
          type: "bars",
          rows: merchants.slice(0, 5).map(function (row) {
            return { title: row.name, amount: row.amount, id: row.name };
          })
        }
      });
    }
    if (opts.biggestPayee && (Number(opts.biggestAmount) || 0) > 0) {
      var bigLines = [opts.biggestPayee + " · " + moneyLabel(opts.biggestAmount)];
      if (opts.biggestDate) bigLines.push(String(opts.biggestDate));
      if (opts.biggestDayDate && (Number(opts.biggestDayAmount) || 0) > 0) {
        bigLines.push("Biggest day " + opts.biggestDayDate + " · " + moneyLabel(opts.biggestDayAmount));
      }
      slides.push({
        id: "biggest",
        kicker: "The spike",
        title: "Biggest transaction",
        lines: bigLines,
        chip: ""
      });
    }
    var trailMonths = Number(opts.trailSetMonths) || 0;
    var zeroMonths = Number(opts.zeroLeftoverMonths) || 0;
    if (opts.streak == null && trailMonths === 0 && zeroMonths === 0) {
      slides.push({
        id: "streak",
        kicker: "No-spend streak",
        title: "Not started",
        lines: ["Your no-spend streak starts after your first logged purchase."],
        chip: ""
      });
    } else if (trailMonths > 0 || zeroMonths > 0 || (Number(opts.streak) || 0) > 0) {
      var delight = [];
      if (trailMonths > 0) delight.push(trailMonths + (trailMonths === 1 ? " trail-set month" : " trail-set months"));
      if (zeroMonths > 0) delight.push(zeroMonths + (zeroMonths === 1 ? " zero-leftover month" : " zero-leftover months"));
      var streak = Number(opts.streak) || 0;
      if (streak > 0) delight.push(streak + (streak === 1 ? " day" : " days") + " no-spend streak");
      slides.push({
        id: "delight",
        kicker: "On the trail",
        title: delight[0] || "Streaks",
        lines: delight.slice(1).concat(["Consecutive calendar days with $0 outflow count toward the streak."]),
        chip: streak > 0 ? (streak + (streak === 1 ? " day" : " days")) : "",
        chart: {
          type: "bars",
          rows: [
            trailMonths > 0 ? { title: "Trail-set", amount: trailMonths, id: "trail" } : null,
            zeroMonths > 0 ? { title: "Zero leftover", amount: zeroMonths, id: "zero" } : null,
            streak > 0 ? { title: "No-spend days", amount: streak, id: "streak" } : null
          ].filter(Boolean)
        }
      });
    } else {
      var streakOnly = Number(opts.streak) || 0;
      var streakLabel = streakOnly + (streakOnly === 1 ? " day" : " days");
      slides.push({
        id: "streak",
        kicker: "No-spend streak",
        title: streakLabel,
        lines: ["Consecutive calendar days with $0 outflow."],
        chip: streakLabel
      });
    }
    if (opts.fooStep && opts.cleanFoo !== false) {
      slides.push({
        id: "foo",
        kicker: "Financial order of operations",
        title: "Step " + (opts.fooStep || 1) + " · " + (opts.fooName || ""),
        lines: [(Number(opts.fooDone) || 0) + " of 9 steps done"],
        chip: ""
      });
    }
    var gradeLines = [];
    if (opts.gradeBand) gradeLines.push(opts.gradeBand);
    if (opts.gradeScore == null) gradeLines.push("Your grade appears once your first budget has numbers in it.");
    if (opts.savingsRate != null && opts.priorSavingsRate != null) {
      gradeLines.push(
        "Savings rate " + Math.round(Number(opts.savingsRate) * 100) + "% this period · " +
        Math.round(Number(opts.priorSavingsRate) * 100) + "% last"
      );
    }
    slides.push({
      id: "grade",
      kicker: "Grade arc",
      title: opts.gradeScore == null ? "—" : String(opts.gradeScore),
      lines: gradeLines,
      chip: ""
    });
    /* v37.5.59: compare like with like — callers pass compareLines (each labeled gross or
     * take-home) plus a compareFootnote naming the basis. Legacy compareLine still works. */
    var compareLines = (opts.compareLines && opts.compareLines.length) ? opts.compareLines
      : (opts.compareLine ? [opts.compareLine] : []);
    if (compareLines.length) {
      slides.push({
        id: "compare",
        kicker: "A wink",
        title: "How you compare",
        lines: compareLines,
        footnote: opts.compareFootnote || "",
        chip: ""
      });
    }
    /* v37.5.55 (owner): one headline rate. True when a confirmed stub gives one; else Basic.
     * The other shows as a small labeled line. Prior-period compare uses the same kind. */
    var basicRate = opts.savingsRate == null || !isFinite(Number(opts.savingsRate)) ? null : Number(opts.savingsRate);
    var trueRate = opts.trueSavingsRate == null || !isFinite(Number(opts.trueSavingsRate)) ? null : Number(opts.trueSavingsRate);
    var headlineTrue = trueRate != null;
    var rate = headlineTrue ? trueRate : basicRate;
    var priorRate = headlineTrue ? opts.priorTrueSavingsRate : opts.priorSavingsRate;
    var compare = savingsRateCompare({
      savingsRate: rate,
      peerRates: opts.peerSavingsRates || []
    });
    var rateLines = [];
    rateLines.push(headlineTrue
      ? "True savings rate · savings envelopes + 401k + employer 401k (match + base) + HSA ÷ gross pay (pay stubs: actual + projected)."
      : "Basic savings rate · savings envelopes ÷ take-home. Finished months count what you received; the current month counts planned take-home until all its paychecks arrive.");
    // v37.5.59.5 (QA): the caption under the headline describes the headline's own basis. With a True
    // headline the take-home basis line moves down next to the Basic line it belongs to.
    var basisLine = takeHomeBasisLine(opts.takeHomeBasis);
    if (headlineTrue && rate != null) {
      compare.title = "You saved " + formatSavingsRate(rate) + " of gross pay";
      compare.footnote = "U.S. personal saving rate ~" + (Math.round(compare.usRate * 1000) / 10) + "% (" + compare.usYear +
        ", BEA/FRED) is saving ÷ after-tax income — Basic’s footing. Your headline is True (÷ gross pay, counting 401k, match and HSA), so treat the U.S. bar as a rough reference, not like-for-like.";
    }
    if (basisLine && !headlineTrue) rateLines.push(basisLine);
    rateLines.push(compare.body);
    if (priorRate != null && rate != null && isFinite(Number(priorRate))) {
      rateLines.push(
        "This period " + formatSavingsRate(rate) + " · last " + formatSavingsRate(priorRate)
      );
    }
    if (headlineTrue) {
      rateLines.push("Basic savings rate " + (basicRate == null ? "—" : formatSavingsRate(basicRate)) +
        " · savings envelopes ÷ take-home. Finished months count what you received; the current month counts planned take-home until all its paychecks arrive.");
      if (basisLine) rateLines.push(basisLine);
    } else if (opts.trueSavingsState === "needsStub") {
      rateLines.push("True savings rate needs a confirmed pay stub — never estimated.");
    } else if (opts.trueSavingsState === "locked") {
      rateLines.push("True savings rate unlocks on Premium with a confirmed pay stub.");
    }
    if (opts.truePeriodNote) rateLines.push(opts.truePeriodNote);
    var rateChartRows = [];
    if (rate != null) rateChartRows.push({ title: "You", amount: Math.max(0, rate * 100), id: "you" });
    rateChartRows.push({ title: "US ~" + Math.round(compare.usRate * 1000) / 10 + "%", amount: compare.usRate * 100, id: "us" });
    slides.push({
      id: "savings-rate-compare",
      kicker: "Savings rate",
      title: compare.title,
      lines: rateLines,
      chip: "",
      chart: { type: "bars", rows: rateChartRows },
      footnote: compare.footnote,
      paystubStack: opts.paystubStack || null
    });
    slides.push({
      id: "close",
      kicker: "Share card",
      title: opts.periodName || "Your wrap",
      lines: ["A card you can keep."],
      chip: "",
      share: {
        period: opts.periodName || "",
        saved: moneyLabel(savedAmt),
        streak: opts.streak == null ? "not started" : ((Number(opts.streak) || 0) + ((Number(opts.streak) || 0) === 1 ? " day" : " days")),
        grade: (opts.gradeScore == null ? "—" : String(opts.gradeScore)) + (opts.gradeBand ? " · " + opts.gradeBand : "")
      }
    });
    return { cadence: opts.cadence || "month", premium: true, slides: slides.filter(function (s) { return !s.hidden; }) };
  }

  function normalizeLoanSort(raw) {
    var key = "balance";
    var dir = "";
    if (typeof raw === "string") {
      var parts = raw.split(":");
      key = parts[0];
      dir = parts[1] || "";
    } else if (raw && typeof raw === "object") {
      key = raw.key || "balance";
      dir = raw.dir || "";
    }
    if (key !== "rate" && key !== "time" && key !== "balance") key = "balance";
    if (dir !== "asc" && dir !== "desc") dir = key === "time" ? "asc" : "desc";
    return { key: key, dir: dir };
  }

  function payoffMonthIndex(label) {
    var text = String(label || "").replace(/^\s+|\s+$/g, "");
    var parsed = payoffFromText(text);
    var use = isPayoffLabel(parsed) ? parsed : (isPayoffLabel(text) ? text : "");
    if (!use) return null;
    var match = use.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(20\d{2})$/);
    if (!match) return null;
    return { y: Number(match[2]), m: PAYOFF_MONTH_INDEX[match[1].toLowerCase()] };
  }

  function loanMonthsRemaining(item, asOf) {
    item = item || {};
    var label = payoffMonthIndex(item.term || item.payoff || "");
    var base = asOf || new Date();
    if (label) return (label.y - base.getFullYear()) * 12 + (label.m - base.getMonth());
    var payment = Number(item.minPayment) > 0 ? Number(item.minPayment)
      : (Number(item.min) > 0 ? Number(item.min) : (Number(item.payment) || 0));
    var rate = item.rate != null ? item.rate : item.apr;
    var months = monthsToPayOff(item.balance, rate, payment);
    return months == null ? null : months;
  }

  function loanSortMetric(item, key, asOf) {
    item = item || {};
    if (key === "rate") {
      var rate = Number(item.rate != null ? item.rate : item.apr);
      return rate > 0 ? rate : null;
    }
    if (key === "time") return loanMonthsRemaining(item, asOf);
    var balance = Number(item.balance);
    return isFinite(balance) ? balance : null;
  }

  function compareLoans(a, b, sort, asOf) {
    var spec = normalizeLoanSort(sort);
    var dir = spec.dir === "asc" ? 1 : -1;
    var av = loanSortMetric(a, spec.key, asOf);
    var bv = loanSortMetric(b, spec.key, asOf);
    var aMissing = av == null || !isFinite(av);
    var bMissing = bv == null || !isFinite(bv);
    if (aMissing && bMissing) return String((a && a.name) || "").localeCompare(String((b && b.name) || ""));
    if (aMissing) return 1;
    if (bMissing) return -1;
    if (av === bv) return String((a && a.name) || "").localeCompare(String((b && b.name) || ""));
    return av < bv ? -dir : dir;
  }

  function sortLoans(items, sort, asOf) {
    return (items || []).slice().sort(function (a, b) { return compareLoans(a, b, sort, asOf); });
  }

  function rankExtraPayoff(loans, extra) {
    extra = Number(extra) || 0;
    var rows = (loans || []).map(function (loan) {
      var rate = loan.rate != null ? loan.rate : loan.apr;
      var payment = loan.min != null ? loan.min : (loan.minPayment != null ? loan.minPayment : loan.payment);
      return { loan: loan, insight: extraPayoffInsight(loan.balance, rate, payment, extra) };
    }).filter(function (row) { return row.insight && row.insight.currentMonths; });
    var bestSave = null;
    var fastest = null;
    rows.forEach(function (row) {
      if (!bestSave || (row.insight.interestSaved || 0) > (bestSave.insight.interestSaved || 0)) bestSave = row;
      var left = row.insight.extraMonths != null ? row.insight.extraMonths : row.insight.currentMonths;
      var bestLeft = fastest
        ? (fastest.insight.extraMonths != null ? fastest.insight.extraMonths : fastest.insight.currentMonths)
        : null;
      if (!fastest || left < bestLeft) fastest = row;
    });
    var sameLoan = !!(bestSave && fastest && (
      (bestSave.loan.id && bestSave.loan.id === fastest.loan.id) ||
      (!bestSave.loan.id && !fastest.loan.id && bestSave.loan.name === fastest.loan.name)
    ));
    return { rows: rows, bestSave: bestSave, fastest: fastest, sameLoan: sameLoan };
  }

  var GradeMath = {
    interpolate: interpolate,
    parseISODate: parseISODate,
    isoDate: isoDate,
    ageYears: ageYears,
    ageTargetMultiple: ageTargetMultiple,
    isSavingsLine: isSavingsLine,
    isMortgageName: isMortgageName,
    isConsumerDebtName: isConsumerDebtName,
    debtTypeFromName: debtTypeFromName,
    normalizeDebtType: normalizeDebtType,
    debtTypeLabel: debtTypeLabel,
    classifyDebt: classifyDebt,
    classifyDebts: classifyDebts,
    fooExplainer: fooExplainer,
    fooExplainers: FOO_EXPLAINERS,
    enteredEmployerPercent: enteredEmployerPercent,
    taxFreeRoom: taxFreeRoom,
    monthlySpend: monthlySpend,
    monthlyEssentials: monthlyEssentials,
    spendScore: spendScore,
    resilienceScore: resilienceScore,
    evaluate: evaluate,
    fooSummary: fooSummary,
    fooNames: FOO_NAMES,
    fixtureA: fixtureA,
    fixtureB: fixtureB,
    fixtureC: fixtureC,
    runFixtureTests: runFixtureTests,
    vaultTypes: VAULT_TYPES,
    vaultFrequencies: VAULT_FREQ,
    normalizeVaultType: normalizeVaultType,
    vaultTypeTitle: vaultTypeTitle,
    inferVaultType: inferVaultType,
    guessVaultProvider: guessVaultProvider,
    findVaultDocForWrite: findVaultDocForWrite,
    removeVaultDocById: removeVaultDocById,
    vaultTypeLabel: vaultTypeLabel,
    defaultVaultTitle: defaultVaultTitle,
    hasVaultMoney: hasVaultMoney,
    hasVaultFile: hasVaultFile,
    docNeedsReview: docNeedsReview,
    vaultBadges: vaultBadges,
    vaultRowMoney: vaultRowMoney,
    insuranceMonthlyCost: insuranceMonthlyCost,
    insuranceBillingNeedsPrompt: insuranceBillingNeedsPrompt,
    slotFromVaultType: slotFromVaultType,
    enrichVaultDoc: enrichVaultDoc,
    makeUncompressedPdf: makeUncompressedPdf,
    makeFlatePdf: makeFlatePdf,
    makeContentPdf: makeContentPdf,
    makeImageOnlyPdf: makeImageOnlyPdf,
    extractPdfText: extractPdfText,
    extractPdfTextAsync: extractPdfTextAsync,
    pdfTextMaxPages: PDF_TEXT_MAX_PAGES,
    pdfTextBudgetMs: PDF_TEXT_BUDGET_MS,
    pdfAutofillMaxBytes: PDF_AUTOFILL_MAX_BYTES,
    pdfQuickReadCopy: pdfQuickReadCopy,
    vaultPdfNeedsAutofill: vaultPdfNeedsAutofill,
    pdfTextIsThin: pdfTextIsThin,
    extractPdfJpegs: extractPdfJpegs,
    ocrPdfBytes: ocrPdfBytes,
    insuranceUnreadPremiumCopy: insuranceUnreadPremiumCopy,
    parseVaultPdfFields: parseVaultPdfFields,
    parseLiabilityLimits: parseLiabilityLimits,
    formatLiabilityLimits: formatLiabilityLimits,
    estimateLoanPayoff: estimateLoanPayoff,
    vaultRowSecondary: vaultRowSecondary,
    applyVaultPdfAutofill: applyVaultPdfAutofill,
    fixtureInsuranceLines: FIXTURE_INSURANCE_LINES,
    fixtureLoanLines: FIXTURE_LOAN_LINES,
    monthsToPayOff: monthsToPayOff,
    normalizeLoanSort: normalizeLoanSort,
    loanMonthsRemaining: loanMonthsRemaining,
    sortLoans: sortLoans,
    rankExtraPayoff: rankExtraPayoff,
    amortizedInterest: amortizedInterest,
    extraPayoffInsight: extraPayoffInsight,
    exactAgeLine: exactAgeLine,
    compareDeck: compareDeck,
    shouldAddVaultToNetWorth: shouldAddVaultToNetWorth,
    normalizePlan: normalizePlan,
    goalChips: GOAL_CHIPS,
    chaseNeeds: CHASE_NEEDS,
    scfAgeBands: SCF_AGE_BANDS,
    compareCitation: COMPARE_CITATION,
    ageBandFor: ageBandFor,
    geoForZip: geoForZip,
    comparePeers: comparePeers,
    autoCategorize: autoCategorize,
    topMerchants: topMerchants,
    spendingTrends: spendingTrends,
    insurancePolicyKind: insurancePolicyKind,
    monthlyPremium: monthlyPremium,
    cohortPremium: cohortPremium,
    insuranceOverpay: insuranceOverpay,
    wrappedRecap: wrappedRecap,
    rankedNeeds: rankedNeeds,
    normalizeMerchant: normalizeMerchant,
    noSpendStreak: noSpendStreak,
    runwayMonths: runwayMonths,
    merchantRule: merchantRule,
    suggestMerchantLegs: suggestMerchantLegs,
    buildWrappedDeck: buildWrappedDeck,
    parsePayStubText: parsePayStubText,
    registerPayStubAdapter: registerPayStubAdapter,
    looksLikePayStubText: looksLikePayStubText,
    applyPayStubToCompensation: applyPayStubToCompensation,
    PRETAX_LIMITS: PRETAX_LIMITS,
    pretaxLimitsFor: pretaxLimitsFor,
    payStubCheckFigures: payStubCheckFigures,
    payStubYtdFigures: payStubYtdFigures,
    payStubYearBasis: payStubYearBasis,
    payStubBasisMonth: payStubBasisMonth,
    earningsKind: earningsKind,
    moneyLabel: moneyLabel,
    annualizePayStubAmount: annualizePayStubAmount,
    savingsRateCompare: savingsRateCompare,
    taxTriangleBuckets: taxTriangleBuckets,
    taxTreatmentForLine: taxTreatmentForLine,
    paycheckTaxStrip: paycheckTaxStrip,
    paycheckComposition: paycheckComposition,
    txType: txType,
    normalizeRefundKind: normalizeRefundKind,
    txLegBreakdown: txLegBreakdown,
    txSummary: txSummary,
    refundLabel: refundLabel,
    sumLedger: sumLedger,
    envelopeNetSpent: envelopeNetSpent,
    incomeReceived: incomeReceived,
    refundDraftError: refundDraftError,
    isSavingsEnvelope: isSavingsEnvelope,
    savingsEnvelopeTotal: savingsEnvelopeTotal,
    basicSavingsRate: basicSavingsRate,
    trueSavingsRate: trueSavingsRate,
    periodTrueSavingsRate: periodTrueSavingsRate,
    monthTakeHome: monthTakeHome,
    paychecksAllReceived: paychecksAllReceived,
    BASIC_DENOMINATOR_NOTE: BASIC_DENOMINATOR_NOTE,
    formatSavingsRate: formatSavingsRate,
    monthPeriod: monthPeriod,
    takeHomeBasisLine: takeHomeBasisLine,
    monthBasisPhrase: monthBasisPhrase,
    shareCardModel: shareCardModel,
    monthMoneyIn: monthMoneyIn,
    US_PERSONAL_SAVING_RATE: US_PERSONAL_SAVING_RATE,
    WRAPPED_PEER_MIN_N: WRAPPED_PEER_MIN_N
  };

  root.GradeMath = GradeMath;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = GradeMath;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
