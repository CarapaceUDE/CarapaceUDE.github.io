/**
 * Probe all six production scroll-hero routes for stage height / scrollable distance.
 * Usage: node scripts/probe-hero-scroll-routes.mjs <scratch-dir> [base-url]
 */
import { chromium } from "playwright";
import { writeFileSync } from "fs";
import { resolve } from "path";
import { BASE_VH_PER_SLIDE, VH_PER_SLIDE } from "../assets/hero-constants.js";

const scratch = process.argv[2];
const base = process.argv[3] || "http://127.0.0.1:8765";

if (!scratch) {
  console.error("Usage: node scripts/probe-hero-scroll-routes.mjs <scratch-dir> [base-url]");
  process.exit(1);
}

const ROUTES = [
  { path: "index.html", name: "index" },
  { path: "about.html", name: "about" },
  { path: "business.html", name: "business" },
  { path: "licensing.html", name: "licensing" },
  { path: "solutions.html", name: "solutions" },
  { path: "cortex.html", name: "cortex" }
];

const log = [];
let failed = 0;

function assert(cond, msg) {
  log.push(`${cond ? "PASS" : "FAIL"}: ${msg}`);
  if (!cond) failed += 1;
}

let browser;
try {
  const launchOpts = { headless: true };
  for (const channel of ["msedge", "chrome", undefined]) {
    try {
      browser = await chromium.launch(channel ? { ...launchOpts, channel } : launchOpts);
      log.push(`browser: ${channel ?? "bundled"}`);
      break;
    } catch {
      browser = null;
    }
  }
  if (!browser) throw new Error("No Playwright browser available");

  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const vh = await page.evaluate(() => window.innerHeight);

  for (const route of ROUTES) {
    const errors = [];
    page.removeAllListeners("pageerror");
    page.removeAllListeners("console");
    page.on("pageerror", (e) => errors.push(String(e)));
    page.on("console", (msg) => {
      if (msg.type() === "error" && !/favicon|404/i.test(msg.text())) errors.push(msg.text());
    });

    await page.goto(`${base}/${route.path}`, { waitUntil: "networkidle", timeout: 45000 });
    await page.waitForSelector("#hero-stage", { timeout: 15000 });

    const metrics = await page.evaluate(() => {
      const stage = document.getElementById("hero-stage");
      const style = stage ? getComputedStyle(stage).getPropertyValue("--hero-stage-height").trim() : "";
      const metaStage = document.getElementById("meta-stage")?.textContent?.trim() ?? "";
      const slideMatch = metaStage.match(/\/\s*(\d+)/);
      return {
        offsetHeight: stage?.offsetHeight ?? 0,
        cssVar: style,
        scrollPct: document.getElementById("meta-scroll")?.textContent?.trim() ?? "",
        metaStage,
        slideCount: slideMatch ? Number(slideMatch[1]) : 0
      };
    });

    const slideCount = metrics.slideCount;
    assert(slideCount > 0, `${route.name}: slide count readable from #meta-stage (${metrics.metaStage})`);

    const baselineStagePx = (slideCount * BASE_VH_PER_SLIDE / 100) * vh;
    const expectedStagePx = (slideCount * VH_PER_SLIDE / 100) * vh;
    const baselineScrollable = baselineStagePx - vh;
    const shippedScrollable = metrics.offsetHeight - vh;
    const scrollRatio = shippedScrollable / baselineScrollable;
    const stageRatio = metrics.offsetHeight / baselineStagePx;
    const expectedVh = `${slideCount * VH_PER_SLIDE}vh`;

    log.push(`--- ${route.name} (${slideCount} slides) ---`);
    log.push(`  hero-stage offsetHeight: ${metrics.offsetHeight}px`);
    log.push(`  --hero-stage-height: ${metrics.cssVar}`);
    log.push(`  expected shipped vh: ${expectedVh}`);
    log.push(`  baseline stage px: ${Math.round(baselineStagePx)}`);
    log.push(`  expected shipped stage px: ${Math.round(expectedStagePx)}`);
    log.push(`  baseline scrollable px: ${Math.round(baselineScrollable)}`);
    log.push(`  shipped scrollable px: ${Math.round(shippedScrollable)}`);
    log.push(`  stage ratio vs baseline: ${stageRatio.toFixed(4)}`);
    log.push(`  scrollable ratio vs baseline: ${scrollRatio.toFixed(4)}`);
    log.push(`  console errors: ${errors.length}`);

    assert(errors.length === 0, `${route.name}: zero console errors`);
    assert(metrics.cssVar === expectedVh, `${route.name}: --hero-stage-height is ${expectedVh}`);
    assert(Math.abs(stageRatio - 1.3) <= 0.03, `${route.name}: stage height ~1.30× baseline`);
    assert(scrollRatio >= 1.28, `${route.name}: scrollable px ≥28% greater than baseline`);
    assert(
      Math.abs(metrics.offsetHeight - expectedStagePx) <= vh * 0.05,
      `${route.name}: offsetHeight within 5vh of expected shipped stage`
    );
  }
} catch (err) {
  log.push(`ERROR: ${err}`);
  failed += 1;
} finally {
  if (browser) await browser.close();
}

log.push(`\n${failed === 0 ? "ALL PASS" : `${failed} FAILED`}`);
writeFileSync(resolve(scratch, "hero-scroll-routes.log"), log.join("\n") + "\n");
console.log(failed === 0 ? "OK" : "FAIL");
process.exit(failed === 0 ? 0 : 1);