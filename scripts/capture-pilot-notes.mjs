/**
 * Scroll business/licensing heroes via mouse wheel to pilotNote slides;
 * verify .pilot-note in DOM with full textContent transcript.
 */
import { chromium } from "playwright";
import { writeFileSync } from "fs";
import { resolve } from "path";
import { PILOT_NOTE_DISCLAIMER } from "../assets/hero-constants.js";
import { wheelScrollToStage } from "./hero-scroll-wheel.mjs";

const scratch = process.argv[2];
const base = process.argv[3] || "http://127.0.0.1:8765";

const CASES = [
  { path: "scripts/effects-hero-harness/business.html", slideCount: 8, targetIndex: 7, label: "business-slide-8" },
  { path: "scripts/effects-hero-harness/licensing.html", slideCount: 6, targetIndex: 3, label: "licensing-slide-4" },
  { path: "scripts/effects-hero-harness/licensing.html", slideCount: 6, targetIndex: 4, label: "licensing-slide-5" },
];

if (!scratch) {
  console.error("Usage: node capture-pilot-notes.mjs <scratch-dir> [base-url]");
  process.exit(1);
}

const log = [];
let browser;
let allOk = true;

try {
  const launchOpts = { headless: true };
  for (const channel of ["msedge", "chrome", undefined]) {
    try {
      browser = await chromium.launch(channel ? { ...launchOpts, channel } : launchOpts);
      break;
    } catch {
      browser = null;
    }
  }
  if (!browser) throw new Error("No Playwright browser available");

  for (const { path, slideCount, targetIndex, label } of CASES) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    page.on("console", (msg) => {
      if (msg.type() === "error" && !/favicon|404/i.test(msg.text())) {
        errors.push(msg.text());
      }
    });

    await page.goto(`${base}/${path}`, { waitUntil: "networkidle", timeout: 45000 });
    await page.waitForSelector("#hero-stage", { timeout: 10000 });
    await page.waitForSelector("#slide-content", { timeout: 10000 });

    const before = (await page.textContent("#meta-stage"))?.trim() ?? "";
    const scrollInfo = await wheelScrollToStage(page, slideCount, targetIndex);

    let pilotEl = null;
    try {
      await page.waitForSelector(".pilot-note[data-layer='pilot-note']", { timeout: 12000 });
      pilotEl = await page.$(".pilot-note[data-layer='pilot-note']");
    } catch {
      pilotEl = await page.$(".pilot-note[data-layer='pilot-note']");
    }

    const after = (await page.textContent("#meta-stage"))?.trim() ?? "";
    const pilotText = pilotEl ? (await pilotEl.textContent())?.trim() ?? "" : "";
    const pilotVisible = pilotEl
      ? await pilotEl.evaluate((el) => {
          const s = getComputedStyle(el);
          return s.display !== "none" && s.visibility !== "hidden" && el.offsetParent !== null;
        })
      : false;
    const disclaimerMatch = pilotText === PILOT_NOTE_DISCLAIMER;

    const stageChanged = before !== after;
    const expectedStage = `${String(targetIndex + 1).padStart(2, "0")} / ${String(slideCount).padStart(2, "0")}`;

    const ok =
      scrollInfo.ok &&
      stageChanged &&
      after === expectedStage &&
      pilotEl !== null &&
      pilotVisible &&
      disclaimerMatch &&
      errors.length === 0;

    log.push(`${label}\tpath=${path}\ttarget=${targetIndex + 1}/${slideCount}`);
    log.push(`  scroll method: ${scrollInfo.method}`);
    log.push(`  wheel steps: ${scrollInfo.wheelSteps}`);
    log.push(`  scrollY: ${scrollInfo.scrollY}`);
    log.push(`  meta-stage: ${before} → ${after} (expected ${expectedStage})`);
    log.push(`  .pilot-note present: ${pilotEl !== null}`);
    log.push(`  .pilot-note visible: ${pilotVisible}`);
    log.push(`  .pilot-note textContent: "${pilotText}"`);
    log.push(`  disclaimer exact match: ${disclaimerMatch}`);
    log.push(`  stage changed: ${stageChanged ? "YES" : "NO"}`);
    log.push(`  result: ${ok ? "PASS" : "FAIL"}`);
    errors.forEach((e) => log.push(`  ERR: ${e}`));

    if (!ok) allOk = false;
    await page.screenshot({ path: resolve(scratch, `${label}.png`), fullPage: false });
    await page.close();
  }

  log.push(`gating: ${allOk ? "PASS" : "FAIL"}`);
  writeFileSync(resolve(scratch, "pilot-note-scroll.log"), log.join("\n") + "\n");
  console.log(allOk ? "OK" : "FAIL");
  if (!allOk) process.exit(1);
} catch (err) {
  writeFileSync(resolve(scratch, "pilot-note-scroll.log"), String(err) + "\n");
  console.error(err);
  process.exit(1);
} finally {
  if (browser) await browser.close();
}