#!/usr/bin/env node
import { chromium } from "playwright";
import { wheelScrollToStage } from "./hero-scroll-wheel.mjs";

const base = process.argv[2] || "http://127.0.0.1:8766";
let browser;
for (const channel of ["msedge", "chrome", undefined]) {
  try {
    browser = await chromium.launch(channel ? { headless: true, channel } : { headless: true });
    break;
  } catch {
    browser = null;
  }
}
if (!browser) throw new Error("No browser");

const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errs = [];
page.on("pageerror", (e) => errs.push(String(e)));
page.on("console", (m) => {
  if (m.type() === "error") errs.push(m.text());
});

await page.goto(`${base}/licensing.html`, { waitUntil: "networkidle", timeout: 60000 });
await page.waitForSelector("#meta-stage", { timeout: 20000 });
const before = await page.textContent("#meta-stage");
const scroll = await wheelScrollToStage(page, 6, 2, { timeoutMs: 25000 });
const after = await page.textContent("#meta-stage");
const note = await page.textContent('[data-layer="note"]');
await browser.close();

console.log(JSON.stringify({ before, scroll, after, note, errs }, null, 2));
process.exit(scroll.ok ? 0 : 1);