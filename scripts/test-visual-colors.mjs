#!/usr/bin/env node
/**
 * Headless computed-style checks for Cortex palette on index + business pages.
 */
import { chromium } from "playwright";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const scratch = process.env.SCRATCH || join(root, ".verify-scratch");
const base = "http://127.0.0.1:8765";

function parseRgb(cssColor) {
  const m = cssColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

function near(rgb, target, tol = 8) {
  if (!rgb) return false;
  return rgb.every((v, i) => Math.abs(v - target[i]) <= tol);
}

const browser = await chromium.launch();
const context = await browser.newContext({ colorScheme: "dark" });
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));

await page.goto(`${base}/index.html`, { waitUntil: "networkidle" });
const bodyBg = parseRgb(await page.evaluate(() => getComputedStyle(document.body).backgroundColor));
const ctaBg = parseRgb(await page.evaluate(() => getComputedStyle(document.querySelector(".cta-link")).backgroundColor));
const navBg = parseRgb(await page.evaluate(() => getComputedStyle(document.querySelector(".nav-contact")).backgroundColor));

console.log("index body bg:", bodyBg);
console.log("index cta-link bg:", ctaBg);
console.log("index nav-contact bg:", navBg);

if (!near(bodyBg, [15, 15, 16])) console.error("FAIL index body not Cortex graphite");
else console.log("ok index body graphite");

if (!near(ctaBg, [201, 162, 39])) console.error("FAIL index cta-link not gold");
else console.log("ok index cta-link gold");

if (near(navBg, [201, 162, 39])) console.error("FAIL index nav-contact is gold (should be violet outline)");
else console.log("ok index nav-contact not gold");

await page.screenshot({ path: join(scratch, "index-colors.png"), fullPage: false });

await page.goto(`${base}/business.html`, { waitUntil: "networkidle" });
const submitBg = parseRgb(await page.evaluate(() => getComputedStyle(document.querySelector('button.btn.primary[type="submit"]')).backgroundColor));
const bizNavBg = parseRgb(await page.evaluate(() => getComputedStyle(document.querySelector(".nav-contact")).backgroundColor));
console.log("business submit bg:", submitBg);
console.log("business nav-contact bg:", bizNavBg);

if (!near(submitBg, [201, 162, 39])) console.error("FAIL business submit not gold");
else console.log("ok business submit gold");

if (near(bizNavBg, [201, 162, 39])) console.error("FAIL business nav-contact is gold");
else console.log("ok business nav-contact not gold");

await page.screenshot({ path: join(scratch, "business-colors.png"), fullPage: false });

// Light theme spot-check on index
await page.evaluate(() => {
  document.documentElement.dataset.theme = "light";
});
await page.waitForTimeout(100);
const lightBody = parseRgb(await page.evaluate(() => getComputedStyle(document.body).backgroundColor));
const lightAccent = parseRgb(await page.evaluate(() => getComputedStyle(document.querySelector(".links > a[href='cortex.html']")).color));
console.log("light body bg:", lightBody);
console.log("light nav link color:", lightAccent);
if (!near(lightBody, [242, 242, 244], 4)) console.error("FAIL light body bg");
else console.log("ok light body");

await browser.close();

if (errors.length) {
  console.error("Page errors:", errors);
  process.exit(1);
}
console.log("\nVisual color checks complete");