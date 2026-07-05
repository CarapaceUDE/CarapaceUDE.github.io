import { chromium } from "playwright";
import { writeFileSync } from "fs";
import { resolve } from "path";
import { wheelScrollToStage } from "./hero-scroll-wheel.mjs";
import {
  INTERACTIVE_EFFECTS as INTERACTIVE_IDS,
  SHIPPED_EFFECT_IDS as EFFECT_IDS,
  EFFECT_DRAW_SLIDES,
  WIRED_SLIDES
} from "../assets/effects-goal-contract.js";

const scratch = process.argv[2];
const base = process.argv[3] || "http://127.0.0.1:8765";

if (!scratch) {
  console.error("Usage: node test-effects-ids.mjs <scratch-dir> [base-url]");
  process.exit(1);
}

const log = [];
let browser;

const isBenignConsoleError = (text) =>
  /favicon\.ico/i.test(text) || /Failed to load resource.*404/i.test(text);

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

  const errors = [];
  const waitFieldFrame = async (pg) => {
    await pg.evaluate(
      () =>
        new Promise((resolve) => {
          requestAnimationFrame(() => requestAnimationFrame(resolve));
        })
    );
  };

  const fieldSnapshot = async (pg) =>
    pg.evaluate(() => {
      const field = document.getElementById("field");
      if (!field || field.width < 1 || field.height < 1) return { alpha: 0, key: "" };
      const { data } = field.getContext("2d").getImageData(0, 0, field.width, field.height);
      let alpha = 0;
      for (let i = 3; i < data.length; i += 4) if (data[i] > 0) alpha += 1;
      return { alpha, key: data.join(",") };
    });

  const waitCanvasReady = async (pg, minAlpha = 50, timeoutMs = 10000) => {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const snap = await fieldSnapshot(pg);
      if (snap.alpha >= minAlpha) return snap.alpha;
      await pg.waitForTimeout(120);
      await waitFieldFrame(pg);
    }
    const last = await fieldSnapshot(pg);
    return last.alpha;
  };

  let allOk = true;

  if (EFFECT_DRAW_SLIDES.length !== EFFECT_IDS.length) {
    log.push(
      `FAIL contract: EFFECT_DRAW_SLIDES ${EFFECT_DRAW_SLIDES.length} != SHIPPED ${EFFECT_IDS.length}`
    );
    allOk = false;
  }

  const drawIds = new Set(EFFECT_DRAW_SLIDES.map((s) => s.id));
  for (const id of EFFECT_IDS) {
    if (!drawIds.has(id)) {
      log.push(`FAIL contract: EFFECT_DRAW_SLIDES missing ${id}`);
      allOk = false;
    }
  }

  log.push(`--- route draw smoke: hero-core path (${EFFECT_DRAW_SLIDES.length} effects) ---`);
  for (const slide of EFFECT_DRAW_SLIDES) {
    const label = `${slide.route}#${slide.slideIndex + 1}/${slide.effect}`;
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    page.on("pageerror", (e) => errors.push(String(e)));
    page.on("console", (msg) => {
      if (msg.type() === "error" && !isBenignConsoleError(msg.text())) errors.push(msg.text());
    });
    try {
      await page.goto(`${base}/${slide.route}`, { waitUntil: "networkidle", timeout: 45000 });
      await page.waitForSelector("#field", { state: "attached", timeout: 15000 });
      const scroll = await wheelScrollToStage(page, slide.slideCount, slide.slideIndex);
      const alpha = await waitCanvasReady(page, slide.effect === "schematic" ? 50 : 20);
      const effect = await page.evaluate(
        () => document.getElementById("atmosphere")?.dataset?.effect ?? ""
      );
      const ok = scroll.ok && effect === slide.effect && alpha >= 20;
      log.push(`draw-${slide.id}: ${ok ? "OK" : "FAIL"} ${label} alpha=${alpha} effect=${effect}`);
      if (!ok) allOk = false;
      if (slide.id === "schematic") {
        const snapLo = await fieldSnapshot(page);
        for (let i = 0; i < 8; i++) {
          await page.mouse.wheel(0, 120);
          await page.waitForTimeout(60);
        }
        await waitFieldFrame(page);
        const snapHi = await fieldSnapshot(page);
        if (snapLo.key === snapHi.key) {
          log.push("draw-schematic: FAIL scroll frac did not change canvas");
          allOk = false;
        } else {
          log.push("draw-schematic: OK scroll-driven scan diff");
        }
      }
    } catch (e) {
      log.push(`draw-${slide.id}: FAIL ${label} — ${e}`);
      allOk = false;
    }
    await page.close();
  }

  log.push(`--- wired E2E: hero-core path (${WIRED_SLIDES.length} slides, real mousemove) ---`);
  const wiredLog = [];
  let wiredOk = true;
  const wiredSummary = [];

  if (WIRED_SLIDES.length !== INTERACTIVE_IDS.length) {
    wiredLog.push(`FAIL contract: WIRED_SLIDES ${WIRED_SLIDES.length} != INTERACTIVE ${INTERACTIVE_IDS.length}`);
    wiredOk = false;
  }

  for (const slide of WIRED_SLIDES) {
    const label = `${slide.route}#${slide.slideIndex + 1}/${slide.effect}`;
    wiredLog.push(`--- wired-${slide.id}: ${label} ---`);

    const rmPage = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await rmPage.emulateMedia({ reducedMotion: "reduce" });
    rmPage.on("pageerror", (e) => errors.push(String(e)));
    await rmPage.goto(`${base}/${slide.route}`, { waitUntil: "networkidle", timeout: 45000 });
    await rmPage.waitForSelector("#field", { state: "attached", timeout: 15000 });
    const scrollRm = await wheelScrollToStage(rmPage, slide.slideCount, slide.slideIndex);
    await rmPage.mouse.move(640, 400);
    const rmReadyAlpha = await waitCanvasReady(rmPage, 50);
    const rmEffect = await rmPage.evaluate(() => document.getElementById("atmosphere")?.dataset?.effect ?? "");
    await rmPage.mouse.move(40, 40);
    await waitFieldFrame(rmPage);
    const rmPointerOff = await rmPage.evaluate(
      () => document.getElementById("hero-stage")?.dataset?.pointerHover ?? ""
    );
    await rmPage.mouse.move(640, 400);
    await waitFieldFrame(rmPage);
    const rmPointerOn = await rmPage.evaluate(
      () => document.getElementById("hero-stage")?.dataset?.pointerHover ?? ""
    );
    const rmSnap = await fieldSnapshot(rmPage);
    const rmPointerGated = rmPointerOff === "false" && rmPointerOn === "false";
    const rmCaseOk =
      scrollRm.ok && rmEffect === slide.effect && rmReadyAlpha >= 50 && rmPointerGated && rmSnap.alpha > 20;
    wiredLog.push(`rm scroll: ${scrollRm.ok ? "OK" : "FAIL"} effect=${rmEffect}`);
    wiredLog.push(`rm pointerHover gated: ${rmPointerGated ? "OK (false)" : "FAIL"}`);
    wiredLog.push(`rm canvas alpha: ${rmSnap.alpha}`);
    wiredLog.push(`rm case: ${rmCaseOk ? "OK" : "FAIL"}`);
    if (!rmCaseOk) wiredOk = false;
    await rmPage.close();

    const fmPage = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    fmPage.on("pageerror", (e) => errors.push(String(e)));
    await fmPage.goto(`${base}/${slide.route}`, { waitUntil: "networkidle", timeout: 45000 });
    await fmPage.waitForSelector("#field", { state: "attached", timeout: 15000 });
    const scrollFm = await wheelScrollToStage(fmPage, slide.slideCount, slide.slideIndex);
    await fmPage.mouse.move(640, 400);
    const fmReadyAlpha = await waitCanvasReady(fmPage, 50);
    await fmPage.mouse.move(40, 40);
    await waitFieldFrame(fmPage);
    const fmOff = await fieldSnapshot(fmPage);
    const fmPointerOff = await fmPage.evaluate(
      () => document.getElementById("hero-stage")?.dataset?.pointerHover ?? ""
    );
    await fmPage.mouse.move(520, 380);
    await waitFieldFrame(fmPage);
    const fmOn = await fieldSnapshot(fmPage);
    const fmPointerOn = await fmPage.evaluate(
      () => document.getElementById("hero-stage")?.dataset?.pointerHover ?? ""
    );
    const fmDiffers = fmOff.key !== fmOn.key;
    const fmPointerLive = fmPointerOff === "true" && fmPointerOn === "true";
    const fmCaseOk = scrollFm.ok && fmReadyAlpha >= 50 && fmPointerLive && fmDiffers;
    wiredLog.push(`fm scroll: ${scrollFm.ok ? "OK" : "FAIL"}`);
    wiredLog.push(`fm pointerHover live: ${fmPointerLive ? "OK (true)" : "FAIL"}`);
    wiredLog.push(`fm hover delta: ${fmDiffers ? "OK" : "FAIL"}`);
    wiredLog.push(`fm case: ${fmCaseOk ? "OK" : "FAIL"}`);
    if (!fmCaseOk) wiredOk = false;
    wiredLog.push(`wired-${slide.id}: rm=${rmCaseOk ? "OK" : "FAIL"} fm=${fmCaseOk ? "OK" : "FAIL"}`);
    wiredSummary.push({ id: slide.id, label, rmCaseOk, fmCaseOk });
    await fmPage.close();
  }

  wiredLog.push("--- wired summary ---");
  wiredLog.push(`slides tested: ${WIRED_SLIDES.length} (expected ${INTERACTIVE_IDS.length})`);
  wiredLog.push(`rm pointerHover gated: ${wiredSummary.every((s) => s.rmCaseOk) ? "OK (false)" : "FAIL"}`);
  wiredLog.push(`rm canvas renders: ${wiredSummary.every((s) => s.rmCaseOk) ? "OK" : "FAIL"}`);
  wiredLog.push(`fm pointerHover live: ${wiredSummary.every((s) => s.fmCaseOk) ? "OK (true)" : "FAIL"}`);
  wiredLog.push(`fm hover delta (wired): ${wiredSummary.every((s) => s.fmCaseOk) ? "OK" : "FAIL"}`);

  log.push(...wiredLog);

  log.push("--- live RM media toggle (cascade pointer + isograph grid recreate) ---");
  const rmTogglePage = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  rmTogglePage.on("pageerror", (e) => errors.push(String(e)));
  await rmTogglePage.goto(`${base}/scripts/effects-hero-harness/index.html`, { waitUntil: "networkidle", timeout: 45000 });
  await rmTogglePage.waitForSelector("#field", { state: "attached", timeout: 15000 });
  await wheelScrollToStage(rmTogglePage, 8, 1);
  await waitCanvasReady(rmTogglePage, 50);
  await rmTogglePage.mouse.move(640, 400);
  await waitFieldFrame(rmTogglePage);
  const fmHover = await rmTogglePage.evaluate(
    () => document.getElementById("hero-stage")?.dataset?.pointerHover ?? ""
  );
  await rmTogglePage.emulateMedia({ reducedMotion: "reduce" });
  await waitFieldFrame(rmTogglePage);
  await rmTogglePage.mouse.move(640, 400);
  await waitFieldFrame(rmTogglePage);
  const rmHover = await rmTogglePage.evaluate(
    () => document.getElementById("hero-stage")?.dataset?.pointerHover ?? ""
  );
  const rmPointerOk = fmHover === "true" && rmHover === "false";
  log.push(`rm-toggle-pointer: ${rmPointerOk ? "OK" : "FAIL"} fm=${fmHover} rm=${rmHover}`);

  const isoPage = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  isoPage.on("pageerror", (e) => errors.push(String(e)));
  await isoPage.goto(`${base}/scripts/effects-hero-harness/about.html`, { waitUntil: "networkidle", timeout: 45000 });
  await isoPage.waitForSelector("#field", { state: "attached", timeout: 15000 });
  await wheelScrollToStage(isoPage, 7, 2);
  await waitCanvasReady(isoPage, 50);
  await waitFieldFrame(isoPage);
  const fmGrid = await isoPage.evaluate(
    () => document.getElementById("hero-stage")?.dataset?.drawableCount ?? ""
  );
  await isoPage.emulateMedia({ reducedMotion: "reduce" });
  await isoPage.waitForTimeout(200);
  await isoPage.mouse.move(640, 400);
  await waitFieldFrame(isoPage);
  await waitFieldFrame(isoPage);
  const rmGrid = await isoPage.evaluate(
    () => document.getElementById("hero-stage")?.dataset?.drawableCount ?? ""
  );
  const rmGridOk = fmGrid === "80" && rmGrid === "40";
  log.push(`rm-toggle-isograph: ${rmGridOk ? "OK" : "FAIL"} fm=${fmGrid} rm=${rmGrid}`);
  await isoPage.close();

  const rmToggleOk = rmPointerOk && rmGridOk;
  log.push(`rm-toggle: ${rmToggleOk ? "OK" : "FAIL"}`);
  if (!rmToggleOk) {
    allOk = false;
    wiredOk = false;
  }
  await rmTogglePage.close();

  wiredLog.push(`gating: ${wiredOk ? "PASS" : "FAIL"}`);
  writeFileSync(resolve(scratch, "wired-rm-e2e.log"), wiredLog.join("\n") + "\n");

  if (!wiredOk) allOk = false;
  if (errors.length) allOk = false;
  log.push(`console errors: ${errors.length}`);
  errors.forEach((e) => log.push(`  ERR: ${e}`));
  log.push(`gating: ${allOk ? "PASS" : "FAIL"}`);

  writeFileSync(resolve(scratch, "effects-smoke.log"), log.join("\n") + "\n");
  writeFileSync(
    resolve(scratch, "reduced-motion.log"),
    JSON.stringify(
      {
        path: "wired hero-core E2E + live emulateMedia toggle",
        rmToggle: { fmHover, rmHover, ok: rmToggleOk },
        slides: WIRED_SLIDES.length,
        summary: wiredSummary
      },
      null,
      2
    ) + "\n"
  );
  console.log(allOk ? "OK" : "FAIL");
  if (!allOk) process.exit(1);
} catch (err) {
  writeFileSync(resolve(scratch, "effects-smoke.log"), String(err) + "\n");
  console.error(err);
  process.exit(1);
} finally {
  if (browser) await browser.close();
}