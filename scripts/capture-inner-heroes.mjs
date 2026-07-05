import { chromium } from "playwright";
import { writeFileSync } from "fs";
import { resolve } from "path";
import { wheelScrollToStage } from "./hero-scroll-wheel.mjs";

const scratch = process.argv[2];
const base = process.argv[3] || "http://127.0.0.1:8765";

const HARNESS = "scripts/effects-hero-harness";
const ROUTES = [
  { path: `${HARNESS}/about.html`, shot: "about-hero.png", slideCount: 7, scrollIndex: 2 },
  { path: `${HARNESS}/business.html`, shot: "business-hero.png", slideCount: 8, scrollIndex: 3 },
  { path: `${HARNESS}/licensing.html`, shot: "licensing-hero.png", slideCount: 6, scrollIndex: 2 },
  { path: `${HARNESS}/solutions.html`, shot: "solutions-hero.png", slideCount: 10, scrollIndex: 4 },
  { path: `${HARNESS}/cortex.html`, shot: "cortex-schematic.png", slideCount: 10, scrollIndex: 1, expectEyebrow: "Core Flow", expectEffect: "schematic" },
];

if (!scratch) {
  console.error("Usage: node capture-inner-heroes.mjs <scratch-dir> [base-url]");
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

  for (const { path, shot, slideCount, scrollIndex, expectEyebrow, expectEffect } of ROUTES) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    const errors = [];
    page.on("pageerror", (e) => errors.push(`PAGEERROR: ${e}`));
    page.on("console", (msg) => {
      if (msg.type() === "error" && !/favicon|404/i.test(msg.text())) {
        errors.push(`CONSOLE: ${msg.text()}`);
      }
    });
    page.on("response", (res) => {
      const url = res.url();
      if (res.status() >= 400 && !url.includes("favicon")) {
        errors.push(`HTTP ${res.status()}: ${url}`);
      }
    });

    const resp = await page.goto(`${base}/${path}`, { waitUntil: "networkidle", timeout: 45000 });
    const status = resp?.status() ?? 0;
    await page.waitForSelector("#hero-stage", { timeout: 10000 });
    await page.waitForSelector("#slide-content h1", { timeout: 15000 });

    const eyebrowBefore = (await page.textContent('[data-layer="eyebrow"]'))?.trim() ?? "";
    const stageBefore = (await page.textContent("#meta-stage"))?.trim() ?? "";
    const heroScript = await page.evaluate(() => {
      const scripts = [...document.querySelectorAll('script[type="module"]')];
      const hero = scripts.find((s) => /hero-/.test(s.src));
      return hero ? { src: hero.src, ok: true } : { ok: false };
    });

    const scrollInfo = await wheelScrollToStage(page, slideCount, scrollIndex);
    if (expectEyebrow) {
      await page.waitForFunction(
        (eyebrow) => document.querySelector('[data-layer="eyebrow"]')?.textContent?.trim() === eyebrow,
        expectEyebrow,
        { timeout: 20000 }
      );
    }
    if (expectEffect) {
      await page.waitForFunction(
        (effect) => document.getElementById("atmosphere")?.dataset?.effect === effect,
        expectEffect,
        { timeout: 20000 }
      );
    }
    await page.waitForTimeout(400);

    const stageAfter = (await page.textContent("#meta-stage"))?.trim() ?? "";
    const eyebrowAfter = (await page.textContent('[data-layer="eyebrow"]'))?.trim() ?? "";
    const atmosphereEffect = await page.evaluate(
      () => document.getElementById("atmosphere")?.dataset?.effect ?? ""
    );
    const scrollChanged = stageBefore !== stageAfter;
    const expected = `${String(scrollIndex + 1).padStart(2, "0")} / ${String(slideCount).padStart(2, "0")}`;

    const effectOk = !expectEffect || atmosphereEffect === expectEffect;
    const eyebrowOk = !expectEyebrow || eyebrowAfter === expectEyebrow;
    const ok =
      status === 200 &&
      eyebrowBefore.length > 0 &&
      heroScript.ok &&
      scrollInfo.ok &&
      scrollChanged &&
      stageAfter === expected &&
      effectOk &&
      eyebrowOk &&
      errors.length === 0;

    log.push(`${path}\tHTTP ${status}\tinitial=${stageBefore}\tscrolled=${stageAfter}\texpected=${expected}`);
    log.push(`  scroll method: ${scrollInfo.method}, wheel steps: ${scrollInfo.wheelSteps}`);
    log.push(`  eyebrow before→after: ${eyebrowBefore.slice(0, 32)} → ${eyebrowAfter.slice(0, 32)}`);
    if (expectEffect) log.push(`  atmosphere effect: ${atmosphereEffect} (expected ${expectEffect})`);
    log.push(`  hero script: ${heroScript.ok ? heroScript.src : "MISSING"}`);
    log.push(`  scroll indicator changed: ${scrollChanged ? "YES" : "NO"}`);
    log.push(`  result: ${ok ? "PASS" : "FAIL"}`);
    errors.forEach((e) => log.push(`  ERR: ${e}`));
    if (!ok) allOk = false;

    await page.screenshot({ path: resolve(scratch, shot), fullPage: false });
    await page.screenshot({ path: resolve(scratch, shot.replace(".png", "-scrolled.png")), fullPage: false });
    await page.close();
  }

  log.push(`gating: ${allOk ? "PASS" : "FAIL"}`);
  writeFileSync(resolve(scratch, "inner-hero-load.log"), log.join("\n") + "\n");
  console.log(allOk ? "OK" : "FAIL");
  if (!allOk) process.exit(1);
} catch (err) {
  writeFileSync(resolve(scratch, "inner-hero-load.log"), String(err) + "\n");
  console.error(err);
  process.exit(1);
} finally {
  if (browser) await browser.close();
}