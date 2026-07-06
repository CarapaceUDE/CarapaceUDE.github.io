#!/usr/bin/env node
import { chromium } from "playwright";

const base = process.argv[2] || "http://127.0.0.1:8766";
const pagePath = process.argv[3] || "/licensing.html";
const slideIndex = Number(process.argv[4]) || 3;
const vw = Number(process.argv[5]) || 844;
const vh = Number(process.argv[6]) || 390;

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

await page.evaluate((index) => {
  const dot = document.querySelector(`.slide-dot[data-index="${index}"]`);
  dot?.click();
  window.scrollTo(0, Math.round((index / Math.max(1, document.querySelectorAll(".slide-dot").length - 1)) * (document.documentElement.scrollHeight - window.innerHeight)));
}, slideIndex);
await page.waitForTimeout(1400);

const beforeHover = await page.evaluate(() => {
  const body = document.body;
  const proofRow = document.querySelector(".proof-row");
  const eyebrow = document.querySelector(".slide-content .eyebrow");
  const nav = document.querySelector(".nav");
  const eyebrowRect = eyebrow?.getBoundingClientRect();
  const navBottom = nav?.getBoundingClientRect().bottom ?? 0;
  const h1 = document.querySelector("#slide-content h1");
  return {
    title: [...(h1?.querySelectorAll(".title-word") ?? [])].map((w) => w.textContent.trim()).join(" "),
    landscapeClass: body.classList.contains("hero-landscape-short"),
    chipWrap: proofRow?.dataset.chipWrap ?? null,
    chipRows: proofRow?.dataset.chipRows ?? null,
    eyebrowGap: eyebrowRect ? Math.round(eyebrowRect.top - navBottom) : null,
    eyebrowMarginBottom: eyebrow ? getComputedStyle(eyebrow).marginBottom : null,
    pinnedOffset: getComputedStyle(document.getElementById("pinned")).getPropertyValue("--pinned-y-offset").trim()
  };
});

await page.evaluate(() => {
  const chip = document.querySelector(".proof-chip--interactive");
  chip?.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
});
await page.waitForTimeout(700);

const afterHover = await page.evaluate(() => {
  const proofRow = document.querySelector(".proof-row");
  const tree = document.querySelector(".proof-chip.is-hovered .chip-tree");
  const treeRect = tree?.getBoundingClientRect();
  const chipRect = document.querySelector(".proof-chip.is-hovered")?.getBoundingClientRect();
  const hiddenBelow = [...document.querySelectorAll(".proof-chip.chip-row--below-active")].length;
  const totalChips = document.querySelectorAll(".proof-chip--interactive").length;
  const activeRow = proofRow?.dataset.activeChipRow ?? null;
  return {
    chipActive: proofRow?.classList.contains("proof-row--chip-active") ?? false,
    activeRow,
    hiddenBelow,
    totalChips,
    treeFlip: tree?.classList.contains("chip-tree--flip") ?? false,
    treeLeftAnchor: tree?.classList.contains("chip-tree--left-anchor") ?? false,
    stemAtChipLeft: treeRect && chipRect ? Math.abs(treeRect.left - chipRect.left) <= 2 : null,
    treeExtendsRight: treeRect && chipRect ? treeRect.right > chipRect.right + 8 : null
  };
});

console.log(
  JSON.stringify(
    {
      viewport: { width: vw, height: vh },
      slideIndex,
      beforeHover,
      afterHover
    },
    null,
    2
  )
);
await browser.close();