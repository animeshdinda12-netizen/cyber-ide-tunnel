/*
 * validate.js — Pre-deploy syntax gate for Cyber IDE.
 *
 * Validates:
 *   1. The Babel <script type="text/babel"> JSX block in index.html
 *   2. The inline <script> block in preview.html
 *   3. The ES module source in sw.js
 *
 * Uses acorn + acorn-jsx. Reports `PARSE OK` per module or exits non-zero.
 */
"use strict";
const fs = require("fs");
const path = require("path");
const acorn = require("acorn");
const acornJsx = require("acorn-jsx");

const DIR = __dirname;
const JSX_PARSER = acorn.Parser.extend(acornJsx());

function extractScript(html) {
  const m = html.match(/<script[^>]*type=["']text\/babel["'][^>]*>([\s\S]*?)<\/script>/);
  if (!m) {
    throw new Error("No <script type=\"text/babel\"> block found in index.html");
  }
  return m[1];
}

function extractInlineScript(html) {
  const re = /<script((?!type=['"]text\/babel)['"][^>]*)?>\s*([\s\S]*?)\s*<\/script>/g;
  const out = [];
  let m;
  while ((m = re.exec(html)) !== null) {
    if (/\ssrc\s*=/.test(m[1])) continue; // skip external scripts
    if (/\stype\s*=/.test(m[1])) continue; // skip typed scripts (e.g. module/babel)
    const s = m[2].trim();
    if (s.length > 0) out.push(s);
  }
  return out;
}

let failures = 0;

function check(name, fn) {
  try {
    fn();
    console.log(`${name}: PARSE OK`);
  } catch (e) {
    failures++;
    const msg = e.message;
    const loc = e.loc ? ` (line ${e.loc.line}, col ${e.loc.column})` : "";
    console.error(`${name}: PARSE FAIL - ${msg}${loc}`);
  }
}

// 1. index.html babel JSX block
check("index.html (babel/jsx)", () => {
  const html = fs.readFileSync(path.join(DIR, "index.html"), "utf8");
  const code = extractScript(html);
  JSX_PARSER.parse(code, { ecmaVersion: 2022, sourceType: "module" });
});

// 2. preview.html inline scripts (plain JS)
check("preview.html", () => {
  const html = fs.readFileSync(path.join(DIR, "preview.html"), "utf8");
  const scripts = extractInlineScript(html);
  if (scripts.length === 0) {
    throw new Error("No inline <script> block found");
  }
  for (const s of scripts) {
    acorn.parse(s, { ecmaVersion: 2022, sourceType: "script", allowAwaitOutsideFunction: true });
  }
});

// 3. sw.js (ES module)
check("sw.js", () => {
  const code = fs.readFileSync(path.join(DIR, "sw.js"), "utf8");
  acorn.parse(code, { ecmaVersion: 2022, sourceType: "module", allowAwaitOutsideFunction: true });
});

if (failures > 0) {
  console.error(`\n${failures} module(s) failed validation.`);
  process.exit(1);
}
console.log("\nAll modules validated successfully.");
process.exit(0);
