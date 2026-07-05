/**
 * Production scroll-hero empty-space click probe (not harness).
 */
import { chromium } from "playwright";
import { writeFileSync } from "fs";
import { resolve } from "path";
import { wheelScrollToStage } from "./hero-scroll-wheel.mjs";

const scratch = process.argv[2];
const base = process.argv[3] || "http://127.0.0.1:8765";
if (!scratch) process.exit(1);

const PRODUCTION_SLIDES = [
  { path: "index.html", slideCount: 8, slideIndex: 0, effect: "shield", label: "home-shield" },
  { path: "about.html", slideCount: 7, slideIndex: 0, effect: "filament", label: "about-filament" },
  { path: "business.html", slideCount: 8, slideIndex: 2, effect: "cellscan", label: "business-cellscan" },
  { path: "solutions.html", slideCount: 10, slideIndex: 4, effect: "trace", label: "solutions-trace" }
];

const waitFieldFrame = async (pg) => {
  await pg.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
};

const fieldSnapshot = async (pg) =>
  pg.evaluate(() => {
    const c = document.getElementById("field");
    if (!c) return { key: "missing", alpha: 0 };
    const ctx = c.getContext("2d");
    const d = ctx.getImageData(0, 0, c.width, c.height).data;
    let acc = 0;
    for (let i = 3; i < d.length; i += 16) acc += d[i];
    return { key: String(acc), alpha: acc };
  });

let browser;
try {
  browser = await chromium.launch({ headless: true, channel: "msedge" });
} catch {
  browser = await chromium.launch({ headless: true });
}

const log = [];
let ok = true;

for (const slide of PRODUCTION_SLIDES) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto(`${base}/${slide.path}`, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForSelector("#field", { state: "attached", timeout: 20000 });
  await wheelScrollToStage(page, slide.slideCount, slide.slideIndex);
  await page.waitForFunction(
    (expected) => document.getElementById("atmosphere")?.dataset?.effect === expected,
    slide.effect,
    { timeout: 12000 }
  ).catch(() => {});
  await page.mouse.move(1050, 420);
  await waitFieldFrame(page);
  const before = await fieldSnapshot(page);
  await page.mouse.click(1050, 420);
  await page.waitForTimeout(150);
  await waitFieldFrame(page);
  const after = await fieldSnapshot(page);
  const effect = await page.evaluate(
    () => document.getElementById("atmosphere")?.dataset?.effect ?? ""
  );
  const delta = before.key !== after.key;
  const caseOk = effect === slide.effect && delta && after.alpha > 20;
  log.push(`prod-click-${slide.label}: ${caseOk ? "OK" : "FAIL"} effect=${effect} delta=${delta}`);
  if (!caseOk) ok = false;
  await page.close();
}

const filamentPage = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await filamentPage.goto(`${base}/about.html`, { waitUntil: "networkidle", timeout: 60000 });
await filamentPage.waitForSelector("#field", { state: "attached", timeout: 20000 });
await wheelScrollToStage(filamentPage, 7, 0);
await filamentPage.mouse.move(1050, 420);
await waitFieldFrame(filamentPage);
const filamentBaseline = await fieldSnapshot(filamentPage);
await filamentPage.mouse.click(1050, 420);
await filamentPage.waitForTimeout(200);
await waitFieldFrame(filamentPage);
const filamentPeak = await fieldSnapshot(filamentPage);
const filamentPeakAlpha = await filamentPage.evaluate(
  () => Number(document.getElementById("hero-stage")?.dataset?.clickKnotAlphaMax ?? 0)
);
await filamentPage.waitForTimeout(1200);
await waitFieldFrame(filamentPage);
const filamentSettledAlpha = await filamentPage.evaluate(
  () => Number(document.getElementById("hero-stage")?.dataset?.clickKnotAlphaMax ?? 1)
);
const filamentDecayOk =
  filamentBaseline.key !== filamentPeak.key &&
  filamentPeakAlpha > 0.2 &&
  filamentSettledAlpha < 0.05;
log.push(
  `prod-click-filament-decay: ${filamentDecayOk ? "OK" : "FAIL"} peakAlpha=${filamentPeakAlpha} settledAlpha=${filamentSettledAlpha}`
);
if (!filamentDecayOk) ok = false;
await filamentPage.close();

log.push(`prod-click-e2e: ${ok ? "OK" : "FAIL"}`);
writeFileSync(resolve(scratch, "click-production.log"), log.join("\n") + "\n");
await browser.close();
console.log(ok ? "OK" : "FAIL");
process.exit(ok ? 0 : 1);