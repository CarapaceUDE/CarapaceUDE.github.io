/**
 * Transient click decay — trace segment flash and filament knot fade return to baseline.
 */
import { chromium } from "playwright";
import { writeFileSync } from "fs";
import { resolve } from "path";
import { wheelScrollToStage } from "./hero-scroll-wheel.mjs";

const scratch = process.argv[2];
const base = process.argv[3] || "http://127.0.0.1:8765";
if (!scratch) process.exit(1);

const waitFieldFrame = async (pg) => {
  await pg.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
};

const fieldSnapshot = async (pg) =>
  pg.evaluate(() => {
    const c = document.getElementById("field");
    if (!c) return { key: "missing", alpha: 0 };
    const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
    let acc = 0;
    for (let i = 3; i < d.length; i += 16) acc += d[i];
    return { key: String(acc), alpha: acc };
  });

const clickTelemetry = async (pg) =>
  pg.evaluate(() => {
    const hero = document.getElementById("hero-stage");
    return {
      segFlashMax: Number(hero?.dataset?.clickSegFlashMax ?? 0),
      knotAlphaMax: Number(hero?.dataset?.clickKnotAlphaMax ?? 0)
    };
  });

const CASES = [
  {
    label: "trace-decay",
    path: "solutions.html",
    slideCount: 10,
    slideIndex: 4,
    effect: "trace",
    click: { x: 640, y: 400 },
    peak: (t) => t.segFlashMax > 0.05,
    settled: (t) => t.segFlashMax < 0.05
  },
  {
    label: "filament-decay",
    path: "about.html",
    slideCount: 7,
    slideIndex: 0,
    effect: "filament",
    click: { x: 1050, y: 420 },
    peak: (t) => t.knotAlphaMax > 0.2,
    settled: (t) => t.knotAlphaMax < 0.05
  }
];

let browser;
try {
  browser = await chromium.launch({ headless: true, channel: "msedge" });
} catch {
  browser = await chromium.launch({ headless: true });
}

const log = [];
let ok = true;

for (const c of CASES) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto(`${base}/${c.path}`, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForSelector("#field", { state: "attached", timeout: 20000 });
  await wheelScrollToStage(page, c.slideCount, c.slideIndex);
  await page.waitForFunction(
    (expected) => document.getElementById("atmosphere")?.dataset?.effect === expected,
    c.effect,
    { timeout: 12000 }
  ).catch(() => {});
  await page.mouse.move(c.click.x, c.click.y);
  await waitFieldFrame(page);
  const baseline = await fieldSnapshot(page);
  await page.mouse.click(c.click.x, c.click.y);
  await page.waitForTimeout(200);
  await waitFieldFrame(page);
  const peak = await fieldSnapshot(page);
  const peakTelemetry = await clickTelemetry(page);
  await page.waitForTimeout(1200);
  await waitFieldFrame(page);
  const settledTelemetry = await clickTelemetry(page);

  const deltaPeak = baseline.key !== peak.key;
  const peakOk = c.peak(peakTelemetry);
  const settledOk = c.settled(settledTelemetry);
  const caseOk = deltaPeak && peakOk && settledOk;
  log.push(
    `transient-${c.label}: ${caseOk ? "OK" : "FAIL"} peak=${deltaPeak} telemetryPeak=${peakOk} telemetrySettled=${settledOk}`
  );
  if (!caseOk) ok = false;
  await page.close();
}

log.push(`click-transient: ${ok ? "OK" : "FAIL"}`);
writeFileSync(resolve(scratch, "click-transient.log"), log.join("\n") + "\n");
await browser.close();
console.log(ok ? "OK" : "FAIL");
process.exit(ok ? 0 : 1);