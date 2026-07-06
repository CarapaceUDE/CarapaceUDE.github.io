#!/usr/bin/env node
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { copyHasClauseDash, sanitizeCopyText } from "../assets/copy-sanitize.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const assets = join(root, "assets");

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    console.error(`FAIL: ${msg}`);
    failed++;
  } else {
    console.log(`ok: ${msg}`);
  }
}

function quotedStringsHaveClauseDash(text) {
  const pattern = /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g;
  for (const match of text.matchAll(pattern)) {
    if (copyHasClauseDash(match[0])) return true;
  }
  return false;
}

const heroJs = readdirSync(assets).filter((name) => name.startsWith("hero-") && name.endsWith(".js"));
const copyJs = ["chip-bullet-enrich.js"];
for (const file of [...heroJs, ...copyJs]) {
  const text = readFileSync(join(assets, file), "utf8");
  assert(!quotedStringsHaveClauseDash(text), `${file} strings have no clause dashes`);
}

const siteHtml = readdirSync(root)
  .filter((name) => name.endsWith(".html"))
  .map((name) => join(root, name));
for (const file of siteHtml) {
  const text = readFileSync(file, "utf8");
  const rel = file.replace(root + "\\", "").replace(root + "/", "");
  assert(!/[\u2010\u2011\u2012\u2013\u2014\u2015\u2212]/.test(text), `${rel} has no unicode dashes`);
}

assert(
  sanitizeCopyText("Continuous evaluation – not a forced conversion moment.") ===
    "Continuous evaluation, not a forced conversion moment.",
  "sanitize converts en dash clauses"
);
assert(
  sanitizeCopyText("Continuous evaluation — not a forced conversion moment.") ===
    "Continuous evaluation, not a forced conversion moment.",
  "sanitize converts em dash clauses"
);

if (failed) {
  console.error(`\n${failed} assertion(s) failed`);
  process.exit(1);
}
console.log("\nAll site copy assertions passed");