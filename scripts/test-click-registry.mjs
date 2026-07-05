/**
 * Static registry gate — every SHIPPED_EFFECT_IDS has a CLICK_HANDLERS entry.
 * Parses effects-click.js source (avoids loading anime.js ESM URL in Node).
 */
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { SHIPPED_EFFECT_IDS } from "../assets/effects-goal-contract.js";
import { clickAllowed, isBlockedClickTarget, isInsertTextTarget } from "../assets/effects-interaction.js";
import { writeFileSync } from "fs";

const scratch = process.argv[2];
if (!scratch) {
  console.error("Usage: node test-click-registry.mjs <scratch-dir>");
  process.exit(1);
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const clickSrc = readFileSync(resolve(root, "assets/effects-click.js"), "utf8");

const log = [];
let ok = true;

const missing = SHIPPED_EFFECT_IDS.filter((id) => !clickSrc.includes(`${id}(field`));
if (missing.length) {
  log.push(`FAIL handlers missing: ${missing.join(", ")}`);
  ok = false;
} else {
  log.push(`PASS handlers: all ${SHIPPED_EFFECT_IDS.length} SHIPPED_EFFECT_IDS`);
}

if (!clickAllowed({ pinned: true, reducedMotion: false })) {
  log.push("FAIL clickAllowed pinned+fm");
  ok = false;
} else {
  log.push("PASS clickAllowed pinned+fm");
}

if (clickAllowed({ pinned: true, reducedMotion: true })) {
  log.push("FAIL clickAllowed blocks reduced motion");
  ok = false;
} else {
  log.push("PASS clickAllowed blocks reduced motion");
}

const fakeBtn = { closest: (sel) => (sel.includes("button") ? fakeBtn : null) };
if (!isBlockedClickTarget(fakeBtn)) {
  log.push("FAIL isBlockedClickTarget detects button");
  ok = false;
} else {
  log.push("PASS isBlockedClickTarget detects button");
}

const fakeText = { closest: (sel) => (sel.includes("title-char") ? fakeText : null) };
if (!isInsertTextTarget(fakeText)) {
  log.push("FAIL isInsertTextTarget detects title-char");
  ok = false;
} else {
  log.push("PASS isInsertTextTarget detects title-char");
}

log.push(`gating: ${ok ? "PASS" : "FAIL"}`);
writeFileSync(resolve(scratch, "click-registry.log"), log.join("\n") + "\n");
console.log(ok ? "OK" : "FAIL");
process.exit(ok ? 0 : 1);