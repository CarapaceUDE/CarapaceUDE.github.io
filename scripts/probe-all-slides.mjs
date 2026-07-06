#!/usr/bin/env node
import { chromium } from "playwright";

const base = process.argv[2] || "http://127.0.0.1:8766";
const vw = Number(process.argv[3]) || 393;
const slideCount = 8;

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

const page = await browser.newPage({ viewport: { width: vw, height: 852 } });
await page.goto(`${base}/index.html`, { waitUntil: "networkidle", timeout: 60000 });
await page.waitForSelector("#slide-content h1", { timeout: 20000 });

const results = [];
for (let i = 0; i < slideCount; i++) {
  await page.evaluate((idx) => {
    const stage = document.getElementById("hero-stage");
    const scrollable = stage.offsetHeight - window.innerHeight;
    const scrollY = stage.offsetTop + ((idx + 0.5) / 8) * scrollable;
    window.scrollTo(0, scrollY);
    window.dispatchEvent(new Event("scroll"));
    requestAnimationFrame(() => window.dispatchEvent(new Event("scroll")));
  }, i);

  await page.waitForFunction(
    (idx) => {
      const active = [...document.querySelectorAll(".slide-dot")].findIndex((d) =>
        d.classList.contains("is-active")
      );
      return (
        active === idx &&
        document.getElementById("slide-content")?.classList.contains("is-visible")
      );
    },
    i,
    { timeout: 20000 }
  );
  await page.waitForTimeout(900);

  const m = await page.evaluate(() => {
    const h1 = document.querySelector("#slide-content h1");
    const sc = document.getElementById("slide-content");
    const title = [...h1.querySelectorAll(".title-word")].map((w) => w.textContent.trim()).join(" ");
    return {
      title,
      h1Scale: getComputedStyle(h1).getPropertyValue("--title-fit-scale").trim(),
      scScale: getComputedStyle(sc).getPropertyValue("--title-fit-scale").trim(),
      fontSize: getComputedStyle(h1).fontSize,
      h1Inline: h1.style.getPropertyValue("--title-fit-scale"),
      scInline: sc.style.getPropertyValue("--title-fit-scale")
    };
  });
  results.push({ slide: i + 1, ...m });
}

console.log(JSON.stringify(results, null, 2));
await browser.close();