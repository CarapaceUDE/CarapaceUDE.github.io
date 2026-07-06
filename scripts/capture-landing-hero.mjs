import { chromium } from "playwright";
import { writeFileSync } from "fs";
import { resolve } from "path";
import { wheelScrollToStage } from "./hero-scroll-wheel.mjs";
import { VH_PER_SLIDE } from "../assets/hero-constants.js";

const scratch = process.argv[2];
const base = process.argv[3] || "http://127.0.0.1:8765";

if (!scratch) {
  console.error("Usage: node capture-landing-hero.mjs <scratch-dir> [base-url]");
  process.exit(1);
}

const log = [];
let browser;

try {
  const launchOpts = { headless: true };
  for (const channel of ["msedge", "chrome", undefined]) {
    try {
      browser = await chromium.launch(channel ? { ...launchOpts, channel } : launchOpts);
      log.push(`browser channel: ${channel ?? "bundled"}`);
      break;
    } catch {
      browser = null;
    }
  }
  if (!browser) throw new Error("No Playwright browser available (install or use Edge/Chrome channel)");

  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];

  page.on("pageerror", (e) => errors.push(`PAGEERROR: ${e}`));
  page.on("console", (msg) => {
    const text = msg.text();
    if (msg.type() === "error" && !/favicon|404/i.test(text)) {
      errors.push(`CONSOLE: ${text}`);
    }
  });
  page.on("requestfailed", (req) => {
    errors.push(`REQUESTFAILED: ${req.url()} — ${req.failure()?.errorText ?? "unknown"}`);
  });
  page.on("response", (res) => {
    const url = res.url();
    if (res.status() >= 400 && !url.includes("favicon")) {
      errors.push(`HTTP ${res.status()}: ${url}`);
    }
  });

  await page.goto(`${base}/scripts/effects-hero-harness/index.html`, { waitUntil: "networkidle", timeout: 45000 });
  await page.waitForSelector("#hero-stage", { timeout: 10000 });
  await page.waitForSelector("#slide-content h1", { timeout: 15000 });

  const stageHeight = await page.evaluate(() => document.getElementById("hero-stage")?.offsetHeight ?? 0);
  const h1Before = (await page.textContent("#slide-content h1"))?.trim() ?? "";
  const stageBefore = (await page.textContent("#meta-stage"))?.trim() ?? "";
  const dotActiveBefore = await page.evaluate(() =>
    document.querySelectorAll(".slide-dot.is-active").length
  );

  log.push(`hero-stage height: ${stageHeight}px`);
  log.push(`h1 initial: ${h1Before.replace(/\s+/g, " ").trim()}`);
  log.push(`meta-stage initial: ${stageBefore}`);
  log.push(`active dots initial: ${dotActiveBefore}`);
  log.push(`page errors after load: ${errors.length}`);
  log.push(`zero page/console errors: ${errors.length === 0 ? "true" : "false"}`);
  errors.forEach((e) => log.push(`  ERR: ${e}`));

  await page.screenshot({ path: resolve(scratch, "landing-hero.png"), fullPage: false });
  log.push("screenshot: landing-hero.png");

  const scrollInfo = await wheelScrollToStage(page, 8, 3);
  await page.waitForTimeout(400);

  const stageAfter = (await page.textContent("#meta-stage"))?.trim() ?? "";
  const scrollPct = (await page.textContent("#meta-scroll"))?.trim() ?? "";
  const dotActiveAfter = await page.evaluate(() =>
    [...document.querySelectorAll(".slide-dot")].findIndex((d) => d.classList.contains("is-active"))
  );

  log.push(`scroll method: ${scrollInfo.method}`);
  log.push(`wheel steps: ${scrollInfo.wheelSteps}`);
  log.push(`scroll Y: ${scrollInfo.scrollY}px`);
  log.push(`meta-stage after scroll: ${stageAfter}`);
  log.push(`meta-scroll after scroll: ${scrollPct}`);
  log.push(`active dot index after scroll: ${dotActiveAfter}`);
  log.push(`scroll indicator changed: ${stageBefore !== stageAfter ? "YES" : "NO"}`);

  await page.screenshot({ path: resolve(scratch, "landing-hero-scrolled.png"), fullPage: false });
  log.push("screenshot: landing-hero-scrolled.png");

  const h1Flat = h1Before.replace(/\s+/g, " ").trim();
  const harnessSlideCount = 8;
  const minStage = await page.evaluate(
    ({ vhPerSlide, slideCount }) =>
      Math.floor(window.innerHeight * (slideCount * vhPerSlide / 100) * 0.88),
    { vhPerSlide: VH_PER_SLIDE, slideCount: harnessSlideCount }
  );
  const passed =
    stageHeight > minStage &&
    h1Flat.includes("Own Your Intelligence") &&
    dotActiveBefore >= 1 &&
    stageBefore !== stageAfter &&
    scrollInfo.ok &&
    dotActiveAfter >= 0 &&
    errors.length === 0;

  log.push(`gating: ${passed ? "PASS" : "FAIL"}`);
  writeFileSync(resolve(scratch, "playwright-hero.log"), log.join("\n") + "\n");
  console.log(passed ? "OK" : "FAIL");
  if (!passed) process.exit(1);
} catch (err) {
  writeFileSync(resolve(scratch, "launch-fail.log"), String(err) + "\n");
  console.error(err);
  process.exit(1);
} finally {
  if (browser) await browser.close();
}