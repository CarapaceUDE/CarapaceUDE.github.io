import { chromium } from "playwright";
import { writeFileSync } from "fs";
import { resolve } from "path";
import { wheelScrollToStage } from "./hero-scroll-wheel.mjs";

const scratch = process.argv[2];
const base = process.argv[3] || "http://127.0.0.1:8765";
const TEAM_SLIDE_INDEX = 5;

if (!scratch) {
  console.error("Usage: node capture-about-founders.mjs <scratch-dir> [base-url]");
  process.exit(1);
}

const log = [];
let browser;

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

  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(`PAGEERROR: ${e}`));
  page.on("console", (msg) => {
    if (msg.type() === "error" && !/favicon|404/i.test(msg.text())) {
      errors.push(`CONSOLE: ${msg.text()}`);
    }
  });

  await page.goto(`${base}/scripts/effects-hero-harness/about.html`, {
    waitUntil: "networkidle",
    timeout: 45000
  });
  await page.waitForSelector("#hero-stage", { timeout: 10000 });

  const heroHeight = await page.evaluate(() => {
    const el = document.getElementById("hero-stage");
    return el ? el.getBoundingClientRect().height : 0;
  });

  const scrollInfo = await wheelScrollToStage(page, 7, TEAM_SLIDE_INDEX);
  await page.waitForFunction(
    () => {
      const title = document.querySelector("#slide-content h1")?.textContent ?? "";
      return title.includes("Co-Founders");
    },
    { timeout: 20000 }
  );
  await page.waitForSelector('a.proof-chip--source[href*="github.com/triphosphatedev"]', {
    timeout: 20000
  });
  await page.waitForSelector('a.proof-chip--source[href*="github.com/ascendism"]', {
    timeout: 20000
  });
  await page.waitForTimeout(300);

  const stageAfter = (await page.textContent("#meta-stage"))?.trim() ?? "";
  const eyebrow = (await page.textContent('[data-layer="eyebrow"]'))?.trim() ?? "";
  const title = (await page.textContent("#slide-content h1"))?.trim() ?? "";
  const links = await page.evaluate(() => {
    const chips = [...document.querySelectorAll("a.proof-chip--source")];
    return chips.map((a) => a.getAttribute("href") ?? "");
  });

  const hasTri = links.some((h) => h.includes("github.com/triphosphatedev"));
  const hasAsc = links.some((h) => h.includes("github.com/ascendism"));
  const hasCoFoundersTitle = title.includes("Co-Founders");
  const ok =
    errors.length === 0 &&
    heroHeight > 0 &&
    scrollInfo.ok &&
    stageAfter === "06 / 07" &&
    hasCoFoundersTitle &&
    hasTri &&
    hasAsc;

  await page.screenshot({ path: resolve(scratch, "about-founders.png"), fullPage: false });

  log.push(`hero-stage height: ${heroHeight}`);
  log.push(`stage after scroll: ${stageAfter}`);
  log.push(`eyebrow: ${eyebrow}`);
  log.push(`title: ${title}`);
  log.push(`co-founders title: ${hasCoFoundersTitle}`);
  log.push(`github links: ${links.join(", ")}`);
  log.push(`triphosphatedev link: ${hasTri}`);
  log.push(`ascendism link: ${hasAsc}`);
  log.push(`console errors: ${errors.length}`);
  errors.forEach((e) => log.push(`  ERR: ${e}`));
  log.push(`gating: ${ok ? "PASS" : "FAIL"}`);

  writeFileSync(resolve(scratch, "about-founders-load.log"), log.join("\n") + "\n");
  console.log(ok ? "OK" : "FAIL");
  if (!ok) process.exit(1);
} catch (err) {
  writeFileSync(resolve(scratch, "about-founders-load.log"), String(err) + "\n");
  console.error(err);
  process.exit(1);
} finally {
  if (browser) await browser.close();
}