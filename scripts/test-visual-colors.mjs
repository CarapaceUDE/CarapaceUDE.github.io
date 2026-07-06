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

async function launchBrowser() {
  const attempts = [
    () => chromium.launch({ channel: "chrome" }),
    () => chromium.launch({ channel: "msedge" }),
    () => chromium.launch(),
  ];
  let lastErr;
  for (const attempt of attempts) {
    try {
      return await attempt();
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
}

const browser = await launchBrowser();
const context = await browser.newContext({ colorScheme: "dark" });
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));

await page.goto(`${base}/index.html`, { waitUntil: "networkidle" });
await page.waitForTimeout(600);
const bodyBg = parseRgb(await page.evaluate(() => getComputedStyle(document.body).backgroundColor));
const ctaBg = parseRgb(await page.evaluate(() => getComputedStyle(document.querySelector(".cta-link")).backgroundColor));
const navBg = parseRgb(await page.evaluate(() => getComputedStyle(document.querySelector(".nav-contact")).backgroundColor));
const squircleFill = parseRgb(await page.evaluate(() => {
  const path = document.querySelector(".cta-link svg.capsule-bg path");
  return path ? getComputedStyle(path).fill : null;
}));

console.log("index body bg:", bodyBg);
console.log("index cta-link bg:", ctaBg);
console.log("index nav-contact bg:", navBg);
console.log("index cta squircle fill:", squircleFill);

let failed = 0;
function fail(msg) {
  console.error(`FAIL: ${msg}`);
  failed++;
}
function pass(msg) {
  console.log(`ok: ${msg}`);
}

if (!near(bodyBg, [15, 15, 16])) fail("index body not Cortex graphite");
else pass("index body graphite");

if (!near(ctaBg, [201, 162, 39])) fail("index cta-link not gold");
else pass("index cta-link gold");

if (squircleFill && !near(squircleFill, [201, 162, 39])) fail("index cta squircle not gold");
else if (squircleFill) pass("index cta squircle gold");

if (!near(navBg, [201, 162, 39])) fail("index nav-contact not gold");
else pass("index nav-contact gold");

await page.screenshot({ path: join(scratch, "index-colors.png"), fullPage: false });

await page.goto(`${base}/business.html`, { waitUntil: "networkidle" });
const submitBg = parseRgb(await page.evaluate(() => getComputedStyle(document.querySelector('button.btn.primary[type="submit"]')).backgroundColor));
const bizNavBg = parseRgb(await page.evaluate(() => getComputedStyle(document.querySelector(".nav-contact")).backgroundColor));
console.log("business submit bg:", submitBg);
console.log("business nav-contact bg:", bizNavBg);

if (!near(submitBg, [201, 162, 39])) fail("business submit not gold");
else pass("business submit gold");

if (!near(bizNavBg, [201, 162, 39])) fail("business nav-contact not gold");
else pass("business nav-contact gold");

await page.screenshot({ path: join(scratch, "business-colors.png"), fullPage: false });

// Light theme spot-check on homepage via real theme toggle (site.js applyTheme path)
await page.goto(`${base}/index.html`, { waitUntil: "networkidle" });
await page.click("#theme-toggle");
await page.waitForTimeout(400);
const lightBgToken = await page.evaluate(() =>
  getComputedStyle(document.documentElement).getPropertyValue("--bg").trim()
);
const lightHtml = parseRgb(await page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor));
console.log("light --bg token:", lightBgToken);
console.log("light html bg:", lightHtml);
if (lightBgToken !== "#f2f2f4") fail(`light --bg token expected #f2f2f4 got ${lightBgToken}`);
else pass("light --bg token");

if (!near(lightHtml, [242, 242, 244], 4)) fail("light html bg");
else pass("light html bg");

await page.locator(".cta-link").scrollIntoViewIfNeeded();
const lightCta = parseRgb(await page.evaluate(() => getComputedStyle(document.querySelector(".cta-link")).backgroundColor));
if (!near(lightCta, [201, 162, 39])) fail("light mode cta-link not gold");
else pass("light mode cta-link gold");

await page.screenshot({ path: join(scratch, "index-light-colors.png"), fullPage: false });

await browser.close();

if (errors.length) {
  console.error("Page errors:", errors);
  failed++;
}
if (failed) {
  console.error(`\n${failed} visual check(s) failed`);
  process.exit(1);
}
console.log("\nVisual color checks complete");