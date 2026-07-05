/** Quick click RM + blocked-target probes only. */
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

const rmPage = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await rmPage.emulateMedia({ reducedMotion: "reduce" });
await rmPage.goto(`${base}/scripts/effects-hero-harness/index.html`, { waitUntil: "networkidle", timeout: 45000 });
await wheelScrollToStage(rmPage, 8, 5);
await rmPage.mouse.move(1050, 420);
await waitFieldFrame(rmPage);
await rmPage.waitForTimeout(800);
await waitFieldFrame(rmPage);
const rmBefore = await fieldSnapshot(rmPage);
await rmPage.mouse.click(1050, 420);
await waitFieldFrame(rmPage);
const rmMid = await fieldSnapshot(rmPage);
await rmPage.mouse.click(1050, 420);
await waitFieldFrame(rmPage);
const rmAfter = await fieldSnapshot(rmPage);
const rmFrozen = rmBefore.key === rmMid.key && rmMid.key === rmAfter.key;
log.push(`click-rm-telemetry: ${rmFrozen ? "OK" : "FAIL"} frozen=${rmFrozen}`);
if (!rmFrozen) ok = false;
writeFileSync(resolve(scratch, "click-rm.log"), log.join("\n") + "\n");
await rmPage.close();

const blockedPage = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await blockedPage.emulateMedia({ reducedMotion: "reduce" });
await blockedPage.goto(`${base}/scripts/effects-hero-harness/index.html`, { waitUntil: "networkidle", timeout: 45000 });
await wheelScrollToStage(blockedPage, 8, 5);
await blockedPage.waitForSelector("#field", { state: "attached", timeout: 15000 });
const chip = await blockedPage.$(".proof-chip .chip-label");
const box = chip ? await chip.boundingBox() : null;
if (box) {
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  await blockedPage.mouse.move(cx, cy);
  await waitFieldFrame(blockedPage);
  await blockedPage.waitForTimeout(200);
  await waitFieldFrame(blockedPage);
  const blockedBefore = await fieldSnapshot(blockedPage);
  await blockedPage.mouse.click(cx, cy);
  await waitFieldFrame(blockedPage);
  const blockedAfter = await fieldSnapshot(blockedPage);
  const blockedOk = blockedBefore.key === blockedAfter.key;
  log.push(`click-blocked-chip: ${blockedOk ? "OK" : "FAIL"}`);
  if (!blockedOk) ok = false;
} else {
  log.push("click-blocked-chip: SKIP");
  ok = false;
}
writeFileSync(resolve(scratch, "click-blocked.log"), log.join("\n") + "\n");
await blockedPage.close();

const stressPage = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await stressPage.goto(`${base}/scripts/effects-hero-harness/index.html`, { waitUntil: "networkidle", timeout: 45000 });
await wheelScrollToStage(stressPage, 8, 0);
await stressPage.mouse.move(1050, 420);
await waitFieldFrame(stressPage);
for (let i = 0; i < 14; i++) {
  await stressPage.mouse.click(1050, 420);
  await stressPage.waitForTimeout(40);
}
await stressPage.waitForTimeout(1200);
await waitFieldFrame(stressPage);
const stressTelemetry = await stressPage.evaluate(() => {
  const hero = document.getElementById("hero-stage");
  return {
    pulses: Number(hero?.dataset?.clickPulseCount ?? 99),
    glowBoost: Number(hero?.dataset?.clickGlowBoost ?? 99)
  };
});
const stressOk = stressTelemetry.pulses <= 4 && stressTelemetry.glowBoost < 0.08;
log.push(
  `click-rapid-burst: ${stressOk ? "OK" : "FAIL"} pulses=${stressTelemetry.pulses} glowBoost=${stressTelemetry.glowBoost}`
);
if (!stressOk) ok = false;
writeFileSync(resolve(scratch, "click-rapid-burst.log"), log.join("\n") + "\n");
await stressPage.close();

await browser.close();

console.log(ok ? "OK" : "FAIL");
process.exit(ok ? 0 : 1);