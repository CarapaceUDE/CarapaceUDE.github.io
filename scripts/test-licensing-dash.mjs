#!/usr/bin/env node
/**
 * Rendered-copy gate: licensing slide 3 note must not show clause dashes.
 */
import { chromium } from "playwright";
import { wheelScrollToStage } from "./hero-scroll-wheel.mjs";

const base = process.argv[2] || "http://127.0.0.1:8766";
const targetSlide = 2;
const slideCount = 6;

const CLAUSE_DASH = /[\u2010\u2011\u2012\u2013\u2014\u2015\u2212]|\s-\s+[A-Za-z"']/;

let browser;
for (const channel of ["msedge", "chrome", undefined]) {
  try {
    browser = await chromium.launch(channel ? { headless: true, channel } : { headless: true });
    break;
  } catch {
    browser = null;
  }
}
if (!browser) throw new Error("No browser");

const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const pageErrors = [];
page.on("pageerror", (e) => pageErrors.push(String(e)));

try {
  await page.goto(`${base}/licensing.html`, { waitUntil: "networkidle", timeout: 60000 });
} catch (err) {
  console.error(`FAIL: could not load ${base}/licensing.html (${err.message})`);
  console.error("Start a local server first: python -m http.server 8766");
  await browser.close();
  process.exit(1);
}
await page.waitForSelector("#meta-stage", { timeout: 20000 });

const scroll = await wheelScrollToStage(page, slideCount, targetSlide, { timeoutMs: 30000 });
if (!scroll.ok) {
  console.error(`FAIL: could not reach slide ${targetSlide + 1} (got ${scroll.actual ?? "unknown"})`);
  if (pageErrors.length) console.error("page errors:", pageErrors.slice(0, 3).join(" | "));
  await browser.close();
  process.exit(1);
}

await page.waitForFunction(
  () => document.getElementById("slide-content")?.classList.contains("is-stable"),
  { timeout: 20000 }
);
await page.waitForFunction(
  () =>
    document.querySelector('[data-layer="note"]')?.textContent?.includes("Continuous evaluation"),
  { timeout: 20000 }
);

const copy = await page.evaluate(() => {
  const note = document.querySelector('[data-layer="note"]')?.textContent?.trim() ?? "";
  const bullets = [...document.querySelectorAll(".chip-tree .chip-branch-text")].map((el) =>
    el.textContent.trim()
  );
  return { note, bullets };
});

await browser.close();

let failed = 0;
if (CLAUSE_DASH.test(copy.note)) {
  console.error(`FAIL: note has clause dash: ${copy.note}`);
  failed++;
} else {
  console.log("ok: note");
}

if (copy.note !== "Continuous evaluation, not a forced conversion moment.") {
  console.error(`FAIL: unexpected note text: ${copy.note}`);
  failed++;
} else {
  console.log("ok: note exact match");
}

for (const [i, bullet] of copy.bullets.entries()) {
  if (CLAUSE_DASH.test(bullet)) {
    console.error(`FAIL: bullet-${i} has clause dash: ${bullet}`);
    failed++;
  }
}

if (failed) process.exit(1);
console.log("licensing dash gate passed");