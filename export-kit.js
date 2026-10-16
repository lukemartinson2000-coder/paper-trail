/* Paper Trail export kit — cache bust v37.5.33.
 * Local-only helpers for Profile › Data:
 *   - buildXlsx(sheets): minimal SpreadsheetML (.xlsx) zipped with the vendored fflate (no CDN, no network).
 *   - csvFromRows(rows): UTF-8 BOM CSV fallback (opens cleanly in Excel).
 *   - validateBackup(obj): checks a Paper Trail backup JSON before Restore replaces anything.
 * Self-test: node export-kit.js
 */
(function (root) {
  "use strict";

  var BACKUP_KIND = "PaperTrail.backup";
  var BACKUP_FORMAT = 1;

  function getFflate() {
    if (root.fflate && root.fflate.zipSync) return root.fflate;
    if (typeof require === "function") {
      try { return require("./vendor/fflate.js"); } catch (err) {}
    }
    return null;
  }

  function xmlEsc(text) {
    return String(text == null ? "" : text)
      // strip characters XML 1.0 can't carry
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g, "")
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function colName(index) {
    var n = index + 1;
    var name = "";
    while (n > 0) {
      var m = (n - 1) % 26;
      name = String.fromCharCode(65 + m) + name;
      n = Math.floor((n - 1) / 26);
    }
    return name;
  }

  function safeSheetName(name, used) {
    var base = String(name || "Sheet").replace(/[\[\]:*?\/\\]/g, " ").replace(/^'+|'+$/g, "").slice(0, 31) || "Sheet";
    var out = base;
    var i = 2;
    while (used[out.toLowerCase()]) {
      var suffix = " " + i++;
      out = base.slice(0, 31 - suffix.length) + suffix;
    }
    used[out.toLowerCase()] = true;
    return out;
  }

  // style ids in styles.xml cellXfs: 0 default, 1 bold header, 2 money, 3 bold money
  function cellXml(raw, ref) {
    var cell = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : { v: raw };
    var v = cell.v;
    var style = cell.s === "bold" ? 1 : cell.s === "money" ? 2 : cell.s === "boldMoney" ? 3 : 0;
    var sAttr = style ? ' s="' + style + '"' : "";
    if (v == null || v === "") return style ? '<c r="' + ref + '"' + sAttr + "/>" : "";
    if (typeof v === "number") {
      if (!isFinite(v)) return '<c r="' + ref + '" t="inlineStr"' + sAttr + "><is><t>—</t></is></c>";
      return '<c r="' + ref + '"' + sAttr + "><v>" + (Math.round(v * 100) / 100) + "</v></c>";
    }
    if (typeof v === "boolean") return '<c r="' + ref + '" t="b"' + sAttr + "><v>" + (v ? 1 : 0) + "</v></c>";
    return '<c r="' + ref + '" t="inlineStr"' + sAttr + '><is><t xml:space="preserve">' + xmlEsc(v) + "</t></is></c>";
  }

  function sheetXml(sheet) {
    var rows = sheet.rows || [];
    var widths = sheet.widths || [];
    var maxCols = 0;
    rows.forEach(function (r) { if (r && r.length > maxCols) maxCols = r.length; });
    var cols = "";
    if (maxCols) {
      cols = "<cols>";
      for (var c = 0; c < maxCols; c++) {
        var w = widths[c] || 16;
        cols += '<col min="' + (c + 1) + '" max="' + (c + 1) + '" width="' + w + '" customWidth="1"/>';
      }
      cols += "</cols>";
    }
    var body = "";
    rows.forEach(function (r, ri) {
      var cells = "";
      (r || []).forEach(function (value, ci) { cells += cellXml(value, colName(ci) + (ri + 1)); });
      body += '<row r="' + (ri + 1) + '">' + cells + "</row>";
    });
    var freeze = sheet.freezeHeader && rows.length > 1
      ? '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>'
      : "";
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
      '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
      freeze + cols + "<sheetData>" + body + "</sheetData></worksheet>";
  }

  var STYLES_XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
    '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    '<numFmts count="1"><numFmt numFmtId="164" formatCode="&quot;$&quot;#,##0.00;\\-&quot;$&quot;#,##0.00"/></numFmts>' +
    '<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>' +
    '<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>' +
    '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
    '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
    '<cellXfs count="4">' +
    '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
    '<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>' +
    '<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' +
    '<xf numFmtId="164" fontId="1" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1"/>' +
    "</cellXfs>" +
    '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>' +
    "</styleSheet>";

  /* sheets: [{ name, rows: [[cell…]…], widths: [..], freezeHeader: bool }]
   * cell: primitive or { v, s: "bold"|"money"|"boldMoney" }. Returns Uint8Array (.xlsx bytes). */
  function buildXlsx(sheets, meta) {
    var lib = getFflate();
    if (!lib) throw new Error("fflate missing");
    meta = meta || {};
    var used = {};
    var list = (sheets || []).map(function (sheet) {
      return { name: safeSheetName(sheet.name, used), sheet: sheet };
    });
    if (!list.length) list.push({ name: "Sheet1", sheet: { rows: [] } });
    var u8 = lib.strToU8;
    var files = {};
    var overrides = list.map(function (item, i) {
      return '<Override PartName="/xl/worksheets/sheet' + (i + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>';
    }).join("");
    files["[Content_Types].xml"] = u8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
      '<Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
      '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
      '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>' +
      '<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>' +
      overrides + "</Types>");
    files["_rels/.rels"] = u8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
      '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>' +
      '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>' +
      "</Relationships>");
    var created = meta.created || new Date().toISOString().replace(/\.\d+Z$/, "Z");
    files["docProps/core.xml"] = u8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
      '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' +
      "<dc:title>" + xmlEsc(meta.title || "Paper Trail export") + "</dc:title><dc:creator>Paper Trail</dc:creator>" +
      '<dcterms:created xsi:type="dcterms:W3CDTF">' + created + "</dcterms:created></cp:coreProperties>");
    files["docProps/app.xml"] = u8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
      '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>Paper Trail</Application></Properties>');
    files["xl/workbook.xml"] = u8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
      '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' +
      list.map(function (item, i) {
        return '<sheet name="' + xmlEsc(item.name) + '" sheetId="' + (i + 1) + '" r:id="rId' + (i + 1) + '"/>';
      }).join("") + "</sheets></workbook>");
    files["xl/_rels/workbook.xml.rels"] = u8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      list.map(function (item, i) {
        return '<Relationship Id="rId' + (i + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + (i + 1) + '.xml"/>';
      }).join("") +
      '<Relationship Id="rId' + (list.length + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
      "</Relationships>");
    files["xl/styles.xml"] = u8(STYLES_XML);
    list.forEach(function (item, i) {
      files["xl/worksheets/sheet" + (i + 1) + ".xml"] = u8(sheetXml(item.sheet));
    });
    return lib.zipSync(files, { level: 6 });
  }

  function csvFromRows(rows) {
    var lines = (rows || []).map(function (r) {
      return (r || []).map(function (raw) {
        var v = raw && typeof raw === "object" ? raw.v : raw;
        if (v == null) return "";
        var s = typeof v === "number" ? String(Math.round(v * 100) / 100) : String(v);
        return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
      }).join(",");
    });
    return "\uFEFF" + lines.join("\r\n") + "\r\n";
  }

  /* Validate before Restore touches anything. Never throws. */
  function validateBackup(obj) {
    function fail(msg) { return { ok: false, error: msg, summary: null }; }
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) return fail("Not a Paper Trail backup (not a JSON object).");
    if (obj.kind !== BACKUP_KIND) return fail("Not a Paper Trail backup (missing kind \u201c" + BACKUP_KIND + "\u201d).");
    if (Number(obj.format) > BACKUP_FORMAT) return fail("This backup was made by a newer Paper Trail (format " + obj.format + ").");
    var st = obj.state;
    if (!st || typeof st !== "object") return fail("Backup has no app data.");
    if (!st.months || typeof st.months !== "object" || Array.isArray(st.months)) return fail("Backup is missing budget months.");
    if (!st.worth || typeof st.worth !== "object" || !Array.isArray(st.worth.lines)) return fail("Backup is missing Net Worth.");
    // v37.5.59.12 (QA 598): the viewed year/month must be real too.
    if (st.year != null && !(Number(st.year) >= 2000 && Number(st.year) <= 2100 && Math.floor(Number(st.year)) === Number(st.year))) return fail("Backup has an invalid year (" + String(st.year).slice(0, 12) + ").");
    if (st.month != null && !(Number(st.month) >= 1 && Number(st.month) <= 12 && Math.floor(Number(st.month)) === Number(st.month))) return fail("Backup has an invalid month (" + String(st.month).slice(0, 12) + ").");
    var monthKeys = Object.keys(st.months);
    var txCount = 0;
    for (var i = 0; i < monthKeys.length; i++) {
      var key = monthKeys[i];
      var m = st.months[key];
      // v37.5.59.12 (QA H3/L9): reject null months, bad YM keys, and null rows that would blank the app on load.
      if (!m || typeof m !== "object" || Array.isArray(m)) return fail("Month " + key + " is missing or null.");
      var keyBits = /^(\d{4})-(\d{1,2})$/.exec(key);
      if (!keyBits) return fail("Month " + key + " has an invalid year/month.");
      var y = Number(m.year != null ? m.year : keyBits[1]);
      var mo = Number(m.month != null ? m.month : keyBits[2]);
      if (!(y >= 2000 && y <= 2100) || !(mo >= 1 && mo <= 12)) return fail("Month " + key + " has an invalid year/month.");
      if (Number(keyBits[1]) !== y || Number(keyBits[2]) !== mo) return fail("Month " + key + " key doesn't match its year/month.");
      if (!Array.isArray(m.categories)) return fail("Month " + key + " is malformed.");
      for (var ci = 0; ci < m.categories.length; ci++) {
        if (!m.categories[ci] || typeof m.categories[ci] !== "object") return fail("Month " + key + " has a null envelope.");
      }
      if (m.transactions != null && !Array.isArray(m.transactions)) return fail("Month " + key + " transactions are malformed.");
      var txs = m.transactions || [];
      for (var ti = 0; ti < txs.length; ti++) {
        if (!txs[ti] || typeof txs[ti] !== "object") return fail("Month " + key + " has a null or broken transaction.");
        // v37.5.59.12 (QA 598): every transaction needs a real amount (top level or on each split leg).
        var tx0 = txs[ti];
        var hasAmt = function (v) { return v !== null && v !== undefined && v !== "" && isFinite(Number(v)) && Number(v) >= 0; };
        var legsOk = Array.isArray(tx0.legs) && tx0.legs.length && tx0.legs.every(function (lg) { return lg && hasAmt(lg.amount); });
        if (!hasAmt(tx0.amount) && !legsOk) return fail("Month " + key + " has a transaction with no amount.");
      }
      if (m.incomes != null) {
        if (!Array.isArray(m.incomes)) return fail("Month " + key + " paychecks are malformed.");
        for (var ii = 0; ii < m.incomes.length; ii++) {
          if (!m.incomes[ii] || typeof m.incomes[ii] !== "object") return fail("Month " + key + " has a null paycheck.");
        }
      }
      txCount += txs.length;
    }
    for (var li = 0; li < st.worth.lines.length; li++) {
      if (!st.worth.lines[li] || typeof st.worth.lines[li] !== "object") return fail("Net Worth has a null or broken line.");
    }
    var docs = (st.profile && Array.isArray(st.profile.documents)) ? st.profile.documents : [];
    for (var di = 0; di < docs.length; di++) {
      if (!docs[di] || typeof docs[di] !== "object") return fail("Vault has a null or broken card.");
    }
    var blobs = obj.documents && typeof obj.documents === "object" ? obj.documents : {};
    var blobCount = 0;
    var badBlob = "";
    Object.keys(blobs).forEach(function (id) {
      var d = blobs[id];
      if (typeof d === "string" && /^data:[^,]*;base64,/.test(d)) blobCount += 1;
      else badBlob = id;
    });
    if (badBlob) return fail("Vault file " + badBlob + " is not a base64 data URL.");
    return {
      ok: true,
      error: "",
      summary: {
        version: String(obj.appVersion || ""),
        exportedAt: String(obj.exportedAt || ""),
        months: monthKeys.length,
        transactions: txCount,
        documents: docs.length,
        files: blobCount,
        excluded: Array.isArray(obj.excluded) ? obj.excluded.slice() : []
      }
    };
  }

  function selfTest() {
    var errors = [];
    function ok(c, m) { if (!c) errors.push(m); }
    ok(colName(0) === "A" && colName(25) === "Z" && colName(26) === "AA" && colName(701) === "ZZ", "colName");
    ok(xmlEsc('a<b>&"\u0001') === "a&lt;b&gt;&amp;&quot;", "xmlEsc");
    var bytes = buildXlsx([
      { name: "Budget by month", rows: [[{ v: "Envelope", s: "bold" }, { v: "Planned", s: "bold" }], ["Food", { v: 500, s: "money" }]] },
      { name: "Bad/Name:[x]", rows: [["NaN", { v: NaN, s: "money" }]] }
    ]);
    var lib = getFflate();
    var files = lib.unzipSync(bytes);
    ["[Content_Types].xml", "_rels/.rels", "xl/workbook.xml", "xl/_rels/workbook.xml.rels", "xl/styles.xml",
      "xl/worksheets/sheet1.xml", "xl/worksheets/sheet2.xml"].forEach(function (name) {
      ok(!!files[name], "xlsx part " + name);
    });
    var wb = lib.strFromU8(files["xl/workbook.xml"]);
    ok(wb.indexOf('name="Bad Name  x "') >= 0, "sheet name sanitized " + wb);
    ok(lib.strFromU8(files["xl/worksheets/sheet2.xml"]).indexOf("NaN") >= 0 && lib.strFromU8(files["xl/worksheets/sheet2.xml"]).indexOf("<v>NaN") < 0, "NaN never written as a number");
    var csv = csvFromRows([["a,b", 1.005, 'q"x']]);
    ok(csv.charCodeAt(0) === 0xFEFF && csv.indexOf('"a,b"') > 0 && csv.indexOf('"q""x"') > 0, "csv BOM + quoting");
    ok(validateBackup(null).ok === false, "backup null rejected");
    ok(validateBackup({ kind: "nope" }).ok === false, "backup wrong kind rejected");
    ok(validateBackup({ kind: BACKUP_KIND, format: 1, state: { months: {}, worth: {} } }).ok === false, "backup missing NW lines rejected");
    var good = validateBackup({ kind: BACKUP_KIND, format: 1, state: { months: { "2026-9": { categories: [], transactions: [{}] } }, worth: { lines: [] }, profile: { documents: [{ id: "d1" }] } }, documents: { d1: "data:application/pdf;base64,JVBERi0=" } });
    ok(good.ok && good.summary.transactions === 1 && good.summary.files === 1, "good backup accepted");
    ok(validateBackup({ kind: BACKUP_KIND, format: 1, state: { months: {}, worth: { lines: [] } }, documents: { d1: "http://x" } }).ok === false, "non-dataURL blob rejected");
    ok(validateBackup({ kind: BACKUP_KIND, format: 1, state: { months: { "2026-10": { year: 2026, month: 10, categories: [], transactions: [null] } }, worth: { lines: [] } } }).ok === false, "null transaction rejected");
    ok(validateBackup({ kind: BACKUP_KIND, format: 1, state: { months: { "2026-10": { year: 2026, month: 10, categories: [], transactions: [] } }, worth: { lines: [null] } } }).ok === false, "null NW line rejected");
    ok(validateBackup({ kind: BACKUP_KIND, format: 1, state: { months: { "abc-13": { year: "abc", month: 13, categories: [], transactions: [] } }, worth: { lines: [] } } }).ok === false, "bad YM rejected");
    ["2026-13", "abc", "2026-0", "2026-07x"].forEach(function (k) {
      var ms = {}; ms[k] = { categories: [], transactions: [] };
      ok(validateBackup({ kind: BACKUP_KIND, format: 1, state: { months: ms, worth: { lines: [] } } }).ok === false, "bad key " + k + " rejected");
    });
    return errors;
  }

  var api = {
    BACKUP_KIND: BACKUP_KIND,
    BACKUP_FORMAT: BACKUP_FORMAT,
    buildXlsx: buildXlsx,
    csvFromRows: csvFromRows,
    validateBackup: validateBackup,
    colName: colName,
    xmlEsc: xmlEsc,
    selfTest: selfTest
  };
  root.PaperTrailExport = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (typeof require !== "undefined" && typeof module !== "undefined" && require.main === module) {
    var errs = selfTest();
    if (errs.length) { console.error("export-kit self-test failed:\n" + errs.join("\n")); process.exit(1); }
    console.log("export-kit self-test passed (xlsx parts, sheet names, NaN guard, CSV BOM, backup validation).");
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
