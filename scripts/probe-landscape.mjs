#!/usr/bin/env node
import { chromium } from "playwright";

const base = process.argv[2] || "http://127.0.0.1:8766";
const pagePath = process.argv[3] || "/licensing.html";
const vw = Number(process.argv[4]) || 844;
const vh = Number(process.argv[5]) || 390;

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

const page = await browser.newPage({ viewport: { width: vw, height: vh } });
await page.goto(`${base}${pagePath}`, { waitUntil: "networkidle", timeout: 60000 });
await page.waitForSelector("#slide-content h1", { timeout: 20000 });
await page.waitForFunction(
  () => document.getElementById("slide-content")?.classList.contains("is-visible"),
  { timeout: 20000 }
);
await page.waitForTimeout(1200);

const metrics = await page.evaluate(() => {
  const body = document.body;
  const sc = document.getElementById("slide-content");
  const h1 = sc?.querySelector("h1");
  const nav = document.querySelector(".nav");
  const chrome = document.querySelector(".hero-chrome");
  const vh = window.innerHeight;
  const navBottom = nav?.getBoundingClientRect().bottom ?? 0;
  const uiScale = parseFloat(getComputedStyle(body).getPropertyValue("--hero-ui-scale")) || 1;
  const footerReserve = body.classList.contains("hero-landscape-short")
    ? Math.round(92 * uiScale)
    : parseFloat(getComputedStyle(body).getPropertyValue("--chrome-footer-reserve")) || 120;
  const availableV = vh - navBottom - footerReserve - 18;
  const contentH = sc?.offsetHeight ?? 0;
  return {
    title: [...(h1?.querySelectorAll(".title-word") ?? [])].map((w) => w.textContent.trim()).join(" "),
    uiScale: getComputedStyle(body).getPropertyValue("--hero-ui-scale").trim(),
    landscapeClass: body.classList.contains("hero-landscape-short"),
    titleScale: getComputedStyle(sc).getPropertyValue("--title-fit-scale").trim(),
    slideW: sc?.clientWidth,
    gridCols: sc ? getComputedStyle(sc).gridTemplateColumns : null,
    fontSize: h1 ? getComputedStyle(h1).fontSize : null,
    contentH,
    availableV,
    navH: nav?.offsetHeight,
    chromeReserve: getComputedStyle(body).getPropertyValue("--chrome-footer-reserve").trim(),
    overflowV: contentH > availableV + 2
  };
});

console.log(JSON.stringify({ viewport: { width: vw, height: vh }, ...metrics }, null, 2));
await browser.close();