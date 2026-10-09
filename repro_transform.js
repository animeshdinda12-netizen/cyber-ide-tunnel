// Reproduce Babel Standalone transform of the babel source and inspect the output for `import`.
const fs = require("fs");
const path = "C:\\Users\\anime\\Downloads\\Programs\\babel_source.txt";
const src = fs.readFileSync(path, "utf8");

// Load @babel/standalone from CDN via require if available
let Babel;
try { Babel = require("@babel/standalone"); } catch (e) { Babel = null; }

if (!Babel) {
  console.log("No @babel/standalone available; falling back to acorn parse of output is impossible.");
  console.log("Source length:", src.length);
  process.exit(0);
}

try {
  const out = Babel.transform(src, { presets: ["env", "react"], sourceType: "script" });
  const code = out.code;
  const hasImport = /^\s*import\s/m.test(code) || /\bimport\s*\(/m.test(code);
  const hasExport = /^\s*export\s/m.test(code);
  console.log("Output length:", code.length);
  console.log("Has import:", hasImport);
  console.log("Has export:", hasExport);
  // print first 500 chars
  console.log("HEAD:\n" + code.slice(0, 800));
  if (hasImport) {
    const idx = code.search(/import/);
    console.log("--- import context ---");
    console.log(code.slice(Math.max(0, idx - 200), idx + 300));
  }
  fs.writeFileSync("C:\\Users\\anime\\Downloads\\Programs\\babel_output.js", code);
} catch (e) {
  console.error("Transform error:", e.message);
}
