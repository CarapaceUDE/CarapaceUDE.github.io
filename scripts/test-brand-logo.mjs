#!/usr/bin/env node
/**
 * Assert minimal Cortex hub orb markup + lite brain canvas init on index.
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const css = readFileSync(join(root, "assets/cortex-brand-logo.css"), "utf8");
const js = readFileSync(join(root, "assets/harness-brain-canvas.js"), "utf8");
const index = readFileSync(join(root, "index.html"), "utf8");

let failed = 0;
function fail(msg) {
  console.error(`FAIL: ${msg}`);
  failed++;
}
function pass(msg) {
  console.log(`ok: ${msg}`);
}

if (!css.includes("cortex-brand-logo__ring--back")) fail("CSS missing ring--back");
else pass("CSS dual-ring back layer");

if (!css.includes("cortex-brand-logo__ring--front")) fail("CSS missing ring--front");
else pass("CSS dual-ring front layer");

if (!css.includes("var(--accent)") || !css.includes("var(--cyan)")) fail("CSS front ring uses site accent tokens");
else pass("CSS front ring uses accent tokens");

if (!js.includes("BRAIN_DENSITY_PRESETS")) fail("JS missing density presets");
else pass("JS lite density presets");

if (!js.includes("initCortexBrandLogoCanvas")) fail("JS missing brand logo init");
else pass("JS initCortexBrandLogoCanvas export");

if (!js.includes("lite: true")) fail("JS brand init must use lite mode");
else pass("JS brand init uses lite mode");

if (!index.includes("cortex-brand-logo__ring--back") || !index.includes("cortex-brand-logo__ring--front")) {
  fail("index.html missing dual-ring markup");
} else {
  pass("index.html dual-ring markup");
}

const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage();
await page.goto("http://127.0.0.1:8765/index.html", { waitUntil: "networkidle" });
await page.waitForTimeout(800);
const state = await page.evaluate(() => {
  const canvas = document.querySelector("[data-cortex-brand-logo] canvas");
  return {
    hasInit: typeof window.initCortexBrandLogoCanvas === "function",
    brainState: canvas && canvas.dataset.cortexBrainState,
    ringBack: !!document.querySelector(".cortex-brand-logo__ring--back"),
    ringFront: !!document.querySelector(".cortex-brand-logo__ring--front"),
  };
});
console.log("runtime:", state);
if (!state.ringBack || !state.ringFront) fail("runtime dual-ring DOM");
else pass("runtime dual-ring DOM");
if (!state.hasInit) fail("initCortexBrandLogoCanvas not loaded");
else pass("runtime init function loaded");
if (state.brainState !== "running") fail(`brain canvas state expected running, got ${state.brainState}`);
else pass("runtime lite brain canvas running");

await browser.close();

if (failed) {
  console.error(`\n${failed} assertion(s) failed`);
  process.exit(1);
}
console.log("\nBrand logo checks passed");