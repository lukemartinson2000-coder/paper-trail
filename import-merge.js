/* Paper Trail import helpers — v37.5.59.12 (refreshPlan always soft-merges by group+name; never replaces hand-made envelopes).
 * Import pages only ever add or refresh rows THEY created (matched by row id, or by the page's source tag);
 * rows you entered by hand are never removed. Status says how many rows were already there vs added.
 * No auto-open: the page waits for "Continue to Paper Trail". */
(function (root) {
  "use strict";
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function clean(s) { return String(s || "").replace(/[^\w\/&' -]+/g, "").trim().toLowerCase(); }
  /* $5,700.03 · −$80.77 */
  function money(n) {
    var v = Math.round((Number(n) || 0) * 100) / 100;
    var s = Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return (v < 0 ? "\u2212$" : "$") + s;
  }
  /* A month the app auto-created when you opened it (no rows, $0 planned income, $0 in every envelope)
   * has nothing of yours in it, so an import may fill it in whole. */
  function isBlankMonth(m) {
    if (!m) return true;
    if ((m.transactions || []).length) return false;
    if ((m.incomes || []).some(function (i) { return (Number(i.amount) || 0) !== 0; })) return false;
    return !(m.categories || []).some(function (c) {
      if ((Number(c.assigned) || 0) !== 0) return true;
      return (c.lines || []).some(function (l) { return (Number(l.assigned) || 0) !== 0; });
    });
  }
  function plural(n, one, many) { return n + " " + (n === 1 ? one : (many || one + "s")); }

  /* Merge one imported month into state.months[key].
   * src: full month object from the import (incomes, categories, transactions).
   * opts.source: tag written on every imported row; opts.refreshPlan: update planned amounts / assigned
   * from the import. With refreshPlan (non-incomeOnly), soft-merge by category+line name:
   * add missing lines, update assigned on matches, never delete a line (esp. with txs).
   * opts.incomeOnly: for a month you built yourself, only income lines + income rows are merged.
   * opts.skipIncomeIfManual: if the month already has income you logged, don't add imported income.
   * Returns { created, present, added, stale, kept, skippedIncome, newLines }. */
  function mergeMonth(state, key, src, opts) {
    opts = opts || {};
    var source = opts.source || "import";
    if (!state.months) state.months = {};
    // v37.5.59.12 (QA L9): never write a bad month key (it would inflate Wrapped take-home).
    var kb = /^(\d{4})-(\d{1,2})$/.exec(String(key || ""));
    if (!kb || !(Number(kb[1]) >= 2000 && Number(kb[1]) <= 2100) || !(Number(kb[2]) >= 1 && Number(kb[2]) <= 12)) {
      return { created: false, replacedBlank: false, present: 0, added: 0, stale: 0, kept: 0, skippedIncome: false, newLines: 0, manualIncome: 0, rejected: true };
    }
    var rows = (src.transactions || []).map(function (t) {
      var r = clone(t);
      if (!r.source) r.source = source;
      return r;
    });
    var cur = state.months[key];
    var blank = !!cur && isBlankMonth(cur);
    if (blank && !opts.incomeOnly) cur = null; // empty auto-created month → fill in whole
    var out = { created: false, replacedBlank: blank && !cur, present: 0, added: 0, stale: 0, kept: 0, skippedIncome: false, newLines: 0, manualIncome: 0 };
    if (!cur) {
      var fresh = clone(src);
      fresh.transactions = rows;
      if (!fresh.importedFrom) fresh.importedFrom = source;
      state.months[key] = fresh;
      out.created = true;
      out.added = rows.length;
      return out;
    }
    cur.transactions = Array.isArray(cur.transactions) ? cur.transactions : [];
    cur.incomes = Array.isArray(cur.incomes) ? cur.incomes : [];
    cur.categories = Array.isArray(cur.categories) ? cur.categories : [];
    var importIds = {};
    rows.forEach(function (r) { importIds[r.id] = true; });
    var isOurs = function (t) { return !!t && (importIds[t.id] || t.source === source); };
    // Drop only rows this page created on an earlier run that the import no longer has.
    var before = cur.transactions.length;
    cur.transactions = cur.transactions.filter(function (t) { return !(t && t.source === source && !importIds[t.id]); });
    out.stale = before - cur.transactions.length;
    var manual = cur.transactions.filter(function (t) { return !isOurs(t); });
    out.kept = manual.length;
    out.manualIncome = manual.filter(function (t) { return t.type === "income"; }).length;
    // Income lines: match by id, then by name; add the import's missing lines.
    var lineFor = {};
    (src.incomes || []).forEach(function (line) {
      var hit = cur.incomes.filter(function (i) { return i.id === line.id; })[0] ||
        cur.incomes.filter(function (i) { return clean(i.name) === clean(line.name); })[0];
      if (!hit) { hit = clone(line); cur.incomes.push(hit); out.newIncomeLines = (out.newIncomeLines || 0) + 1; }
      else if (opts.refreshPlan && !opts.keepAssigned) { hit.amount = line.amount; if (line.date) hit.date = line.date; }
      else if (hit.amount == null) hit.amount = line.amount;
      lineFor[line.id] = hit.id;
    });
    if (opts.refreshPlan && !opts.incomeOnly) {
      /* v37.5.59.12 (owner): always soft-merge by group (category) + line name. Never replace
       * the plan grid — hand-made envelopes and spends stay. Matched lines take the
       * import's assigned (stops auto-copied months doubling when names align with ED).
       * Lines that already have transactions are never deleted. */
      if (!cur.importedFrom) cur.importedFrom = source;
      var seenCat = {}, seenLine = {};
      (src.categories || []).forEach(function (cat) {
        var hc = cur.categories.filter(function (c) { return c.id === cat.id; })[0] ||
          cur.categories.filter(function (c) { return clean(c.name) === clean(cat.name); })[0];
        if (!hc) {
          var nc = clone(cat);
          nc.importedBy = source;
          (nc.lines || []).forEach(function (l) { l.importedBy = source; seenLine[l.id] = true; });
          cur.categories.push(nc); seenCat[nc.id] = true;
          out.newLines += (cat.lines || []).length; return;
        }
        seenCat[hc.id] = true;
        delete hc.autoCopy;
        hc.lines = Array.isArray(hc.lines) ? hc.lines : [];
        (cat.lines || []).forEach(function (line) {
          var hl = hc.lines.filter(function (l) { return l.id === line.id; })[0] ||
            hc.lines.filter(function (l) { return clean(l.name) === clean(line.name); })[0];
          if (!hl) { hl = clone(line); hc.lines.push(hl); out.newLines += 1; }
          else if (!opts.keepAssigned) hl.assigned = line.assigned;
          hl.importedBy = source;
          delete hl.autoCopy;
          seenLine[hl.id] = true;
        });
      });
      /* Drop only lines that are (a) copied forward and untouched, or (b) this source's own
       * earlier lines, that EveryDollar no longer has AND that nothing is logged against.
       * Lines you made or edited, and any line with a transaction, always stay. */
      var used = {};
      cur.transactions.concat(rows).forEach(function (t) {
        if (!t) return;
        if (t.lineId) used[t.lineId] = true;
        (t.legs || []).forEach(function (leg) { if (leg && leg.lineId) used[leg.lineId] = true; });
      });
      var pruned = 0;
      cur.categories = cur.categories.filter(function (c) {
        c.lines = (c.lines || []).filter(function (l) {
          var droppable = !opts.keepAssigned && (l.autoCopy || l.importedBy === source) && !seenLine[l.id] && !used[l.id];
          if (droppable) pruned += 1;
          return !droppable;
        });
        var dropCat = !opts.keepAssigned && !seenCat[c.id] && (c.autoCopy || c.importedBy === source) && !c.lines.length &&
          !cur.transactions.some(function (t) { return t && t.categoryId === c.id; });
        return !dropCat;
      });
      cur.categories.forEach(function (hc) {
        if (!(hc.lines || []).length) return;
        hc.assigned = Math.round((hc.lines || []).reduce(function (s, l) { return s + (Number(l.assigned) || 0); }, 0) * 100) / 100;
      });
      out.prunedLines = pruned;
      /* Remap imported spend rows onto existing envelopes matched by name so they
       * don't land as orphans when ids differ from a prior auto-copy. */
      rows.forEach(function (r) {
        if (!r || r.type === "income") return;
        function mapLeg(leg) {
          if (!leg) return;
          var hitCat = cur.categories.filter(function (c) { return c.id === leg.categoryId; })[0];
          var srcCat = (src.categories || []).filter(function (c) { return c.id === leg.categoryId; })[0];
          if (!hitCat && srcCat) {
            hitCat = cur.categories.filter(function (c) { return clean(c.name) === clean(srcCat.name); })[0];
          }
          if (!hitCat) return;
          leg.categoryId = hitCat.id;
          var srcLine = srcCat && (srcCat.lines || []).filter(function (l) { return l.id === leg.lineId; })[0];
          var hitLine = (hitCat.lines || []).filter(function (l) { return l.id === leg.lineId; })[0];
          if (!hitLine && srcLine) {
            hitLine = (hitCat.lines || []).filter(function (l) { return clean(l.name) === clean(srcLine.name); })[0];
          }
          if (hitLine) leg.lineId = hitLine.id;
        }
        mapLeg(r);
        (r.legs || []).forEach(mapLeg);
        if (r.categoryId && r.lineId) { /* top-level already mapped via mapLeg(r) */ }
      });
    }
    var have = {};
    cur.transactions.forEach(function (t) { if (t) have[t.id] = t; });
    var skipIncome = opts.skipIncomeIfManual && out.manualIncome > 0;
    out.skippedIncome = skipIncome;
    rows.forEach(function (r) {
      var income = r.type === "income";
      if (opts.incomeOnly && !income) return;
      if (income && skipIncome) return;
      if (have[r.id]) {
        out.present += 1;
        if (!have[r.id].source) have[r.id].source = source; // tag rows earlier builds added untagged
        return;
      }
      if (income && r.incomeId && lineFor[r.incomeId]) r.incomeId = lineFor[r.incomeId];
      if (income && r.lineName) {
        var byName = cur.incomes.filter(function (i) { return clean(i.name) === clean(r.lineName); })[0];
        if (byName) r.incomeId = byName.id;
      }
      delete r.lineName;
      cur.transactions.push(r);
      out.added += 1;
    });
    return out;
  }

  function describe(label, r, what) {
    if (r.created) return label + ": " + (r.replacedBlank ? "was an empty month (nothing entered)" : "not in Paper Trail yet") +
      " — added from EveryDollar (" + plural(r.added, "row") + (what ? ", " + what : "") + ").";
    var bits = [label + ": already in Paper Trail — " + plural(r.present, "imported row") + " already there, " + r.added + " added"];
    if (r.kept) bits.push(plural(r.kept, "row") + " you entered kept");
    if (r.stale) bits.push(plural(r.stale, "old imported row") + " removed");
    if (r.newLines) bits.push(plural(r.newLines, "missing envelope line") + " added");
    if (r.prunedLines) bits.push(plural(r.prunedLines, "copied-forward line") + " EveryDollar doesn’t have removed (nothing logged on them)");
    if (r.newIncomeLines) bits.push(plural(r.newIncomeLines, "missing paycheck line") + " added");
    if (r.skippedIncome) bits.push("income not added because you logged " + plural(r.manualIncome, "income row") + " yourself");
    return bits.join("; ") + (what ? " (" + what + ")" : "") + ".";
  }

  /* Show the Continue button; never navigate on a timer. */
  function showContinue() {
    var go = document.getElementById("go");
    if (go) go.hidden = false;
    var cd = document.getElementById("countdown");
    if (cd) cd.textContent = "Read the summary, then tap Continue when you’re ready.";
  }

  root.PaperTrailImport = { isBlankMonth: isBlankMonth, mergeMonth: mergeMonth, describe: describe, money: money, clean: clean, showContinue: showContinue, plural: plural };
})(typeof globalThis !== "undefined" ? globalThis : this);
