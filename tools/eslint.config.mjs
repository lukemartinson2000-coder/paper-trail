// Unused / undefined code check for the pre-push gate (run: node tools/check-unused.js).
// Kept on purpose: recommendedMerchants / applyMerchantToDraft (unwired, superseded merchant feature)
// and collectPdfObjects (unused PDF-reader helper; pay stub parsing code stays).
import { createRequire } from "node:module";
const req = createRequire(process.env.ESLINT_NODE_MODULES ? process.env.ESLINT_NODE_MODULES + "/" : import.meta.url);
const globals = req("globals");
export default [{
  languageOptions: { ecmaVersion: 2022, sourceType: "script",
    globals: { ...globals.browser, GradeMath: "readonly", PaperTrailExport: "readonly", PaperTrailImportMerge: "readonly", module: "readonly", require: "readonly", process: "readonly", Buffer: "readonly", __dirname: "readonly" } },
  rules: {
    "no-unused-vars": ["error", { vars: "all", args: "none", caughtErrors: "none", varsIgnorePattern: "^(recommendedMerchants|applyMerchantToDraft|collectPdfObjects)$" }],
    "no-undef": "error",
    "no-unreachable": "error"
  }
}];
