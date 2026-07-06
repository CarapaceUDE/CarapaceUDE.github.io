#!/usr/bin/env node
import { chromium } from "playwright";

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

const page = await browser.newPage({ viewport: { width: 393, height: 852 } });
await page.goto(`${base}/index.html`, { waitUntil: "networkidle", timeout: 60000 });
await page.waitForSelector("#slide-content h1", { timeout: 20000 });
await page.waitForFunction(
  () => document.getElementById("slide-content")?.classList.contains("is-visible"),
  { timeout: 20000 }
);
await page.waitForTimeout(1500);

const metrics = await page.evaluate(() => {
  const h1 = document.querySelector("#slide-content h1");
  const intel = [...document.querySelectorAll(".title-word")].find((w) =>
    w.textContent.includes("Intelligence")
  );
  const vw = window.innerWidth;
  const stage = document.getElementById("stage-3d");
  const stageStyle = stage ? getComputedStyle(stage) : null;
  return {
    scale: getComputedStyle(h1).getPropertyValue("--title-fit-scale").trim(),
    fontSize: getComputedStyle(h1).fontSize,
    fontSizeInline: h1.style.fontSize,
    slideW: document.getElementById("slide-content").clientWidth,
    intelRight: intel?.getBoundingClientRect().right,
    intelWidth: intel?.getBoundingClientRect().width,
    intelTransform: intel ? getComputedStyle(intel).transform : null,
    stageTransform: stageStyle?.transform,
    stageScale: stageStyle?.scale,
    vw,
    overflow: (intel?.getBoundingClientRect().right ?? 0) > vw - 12
  };
});
console.log(JSON.stringify(metrics, null, 2));
await browser.close();