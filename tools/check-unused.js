#!/usr/bin/env node
// Pre-push check: fails on unused functions/vars, undefined names or unreachable code.
// Needs eslint 9 + globals (npx fetches them, or set ESLINT_NODE_MODULES to a folder that has them).
"use strict";
var cp = require("child_process"), path = require("path");
var root = path.join(__dirname, "..");
var files = ["app.js", "grade-math.js", "export-kit.js", "import-merge.js", "cloud-config.js", "sw.js"];
var env = Object.assign({}, process.env);
if (env.ESLINT_NODE_MODULES) env.NODE_PATH = env.ESLINT_NODE_MODULES;
var bin = env.ESLINT_NODE_MODULES ? [path.join(env.ESLINT_NODE_MODULES, "eslint/bin/eslint.js")] : null;
var args = ["-c", "tools/eslint.config.mjs", "--no-warn-ignored"].concat(files);
var r = bin
  ? cp.spawnSync(process.execPath, bin.concat(args), { cwd: root, stdio: "inherit", env: env })
  : cp.spawnSync("npx", ["--yes", "-p", "eslint@9", "-p", "globals", "eslint"].concat(args), { cwd: root, stdio: "inherit", env: env });
if (r.status !== 0) { console.error("check-unused: FAILED"); process.exit(1); }
console.log("check-unused: clean (" + files.length + " files)");
