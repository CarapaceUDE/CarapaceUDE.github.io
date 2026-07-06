#!/usr/bin/env node
import { chromium } from "playwright";

const base = process.argv[2] || "http://127.0.0.1:8766";
const targetSlide = Number(process.argv[3] ?? 1);

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

if (targetSlide > 0) {
  await page.evaluate((idx) => {
    const stage = document.getElementById("hero-stage");
    const scrollable = stage.offsetHeight - window.innerHeight;
    const scrollY = stage.offsetTop + ((idx + 0.5) / 8) * scrollable;
    window.scrollTo(0, scrollY);
    window.dispatchEvent(new Event("scroll"));
    requestAnimationFrame(() => window.dispatchEvent(new Event("scroll")));
  }, targetSlide);
  await page.waitForFunction(
    (idx) =>
      [...document.querySelectorAll(".slide-dot")].findIndex((d) => d.classList.contains("is-active")) ===
      idx,
    targetSlide,
    { timeout: 25000 }
  );
}

const during = await page.evaluate(() => {
  const h1 = document.querySelector("#slide-content h1");
  const sc = document.getElementById("slide-content");
  return {
    phase: sc.className,
    title: [...h1.querySelectorAll(".title-word")].map((w) => w.textContent.trim()).join(" "),
    h1Scale: getComputedStyle(h1).getPropertyValue("--title-fit-scale").trim(),
    scScale: getComputedStyle(sc).getPropertyValue("--title-fit-scale").trim(),
    fontSize: getComputedStyle(h1).fontSize
  };
});

await page.waitForFunction(
  () => document.getElementById("slide-content")?.classList.contains("is-visible"),
  { timeout: 25000 }
);
await page.waitForTimeout(800);

const settled = await page.evaluate(() => {
  const h1 = document.querySelector("#slide-content h1");
  const sc = document.getElementById("slide-content");
  return {
    phase: sc.className,
    title: [...h1.querySelectorAll(".title-word")].map((w) => w.textContent.trim()).join(" "),
    h1Scale: getComputedStyle(h1).getPropertyValue("--title-fit-scale").trim(),
    scScale: getComputedStyle(sc).getPropertyValue("--title-fit-scale").trim(),
    scInline: sc.style.getPropertyValue("--title-fit-scale"),
    fontSize: getComputedStyle(h1).fontSize
  };
});

console.log(JSON.stringify({ during, settled }, null, 2));
await browser.close();