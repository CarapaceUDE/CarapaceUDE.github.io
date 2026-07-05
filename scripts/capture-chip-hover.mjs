import { chromium } from "playwright";
import { writeFileSync } from "fs";
import { resolve } from "path";
import { wheelScrollToStage } from "./hero-scroll-wheel.mjs";

const scratch = process.argv[2];
const base = process.argv[3] || "http://127.0.0.1:8765";

const CASES = [
  { page: "about.html", slideCount: 7, slideIndex: 5, chipIndex: 0, name: "about-founder-1" },
  { page: "about.html", slideCount: 7, slideIndex: 5, chipIndex: 1, name: "about-founder-2" },
  { page: "index.html", slideCount: 8, slideIndex: 0, chipIndex: 0, name: "home-chip-1" },
  { page: "licensing.html", slideCount: 6, slideIndex: 3, chipIndex: 0, name: "licensing-tier" }
];

if (!scratch) {
  console.error("Usage: node capture-chip-hover.mjs <scratch-dir> [base-url]");
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

  for (const c of CASES) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await page.goto(`${base}/${c.page}`, { waitUntil: "networkidle", timeout: 45000 });
    await page.waitForSelector("#hero-stage", { timeout: 10000 });
    if (c.slideIndex > 0) {
      await wheelScrollToStage(page, c.slideCount, c.slideIndex);
      await page.waitForTimeout(600);
    }
    const chips = page.locator('[data-layer="proof"] [data-chip]');
    const chip = chips.nth(c.chipIndex);
    await chip.waitFor({ timeout: 10000 });
    await chip.hover({ force: true });
    await chip.locator(".chip-tree").waitFor({ timeout: 8000, state: "attached" });
    await page.waitForTimeout(1100);

    const metrics = await chip.evaluate((el) => {
      const tree = el.querySelector(".chip-tree");
      const spine = el.querySelector(".chip-spine");
      const branches = [...el.querySelectorAll(".chip-branch")];
      return {
        tree: tree?.getBoundingClientRect(),
        spine: spine?.getBoundingClientRect(),
        branches: branches.map((b) => {
          const stem = b.querySelector(".chip-branch-stem");
          const text = b.querySelector(".chip-branch-text");
          return {
            branch: b.getBoundingClientRect(),
            stem: stem?.getBoundingClientRect(),
            text: text?.getBoundingClientRect(),
            overlapNext: false
          };
        })
      };
    });

    for (let i = 0; i < metrics.branches.length - 1; i++) {
      const a = metrics.branches[i].text;
      const b = metrics.branches[i + 1].text;
      if (a && b && a.bottom > b.top + 1) metrics.branches[i].overlapNext = true;
    }

    const stemGap = metrics.branches.map((b) => {
      if (!b.stem || !metrics.spine) return null;
      return Math.abs(b.stem.left - metrics.spine.right);
    });

    log.push(`${c.name}: branches=${metrics.branches.length} stem-spine-gap=${stemGap.join(",")}`);
    metrics.branches.forEach((b, i) => {
      if (b.overlapNext) log.push(`  OVERLAP branch ${i} → ${i + 1}`);
    });

    await page.screenshot({
      path: resolve(scratch, `chip-hover-${c.name}.png`),
      fullPage: false
    });
    await page.close();
  }

  writeFileSync(resolve(scratch, "chip-hover-inspect.log"), log.join("\n") + "\n");
  console.log("OK");
} catch (err) {
  writeFileSync(resolve(scratch, "chip-hover-inspect.log"), String(err) + "\n");
  console.error(err);
  process.exit(1);
} finally {
  if (browser) await browser.close();
}