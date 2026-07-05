import { chromium } from "playwright";

const BASE = process.env.BASE_URL || "http://127.0.0.1:8765";

const EXPECTED = [
  { label: "Asana", href: "asana.com/resources/anatomy-of-work" },
  { label: "664 hrs/yr", href: "asana.com/resources/why-work-about-work-is-bad" },
  { label: "IDC / Microsoft", href: "idcs-2024-ai-opportunity-study" },
  { label: "Adecco", href: "working-through-change-what-employers-need-to-learn" },
  { label: "LSE / Protiviti", href: "ai-boosts-productivity-by-the-equivalent-of-one-workday" }
];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(`${BASE}/index.html`, { waitUntil: "networkidle" });

for (let i = 0; i < 8; i++) {
  await page.mouse.wheel(0, 900);
  await page.waitForTimeout(350);
}

const chips = await page.evaluate((expected) => {
  return expected.map(({ label, href }) => {
    const chip = [...document.querySelectorAll("a.proof-chip--source")].find(
      (el) => el.querySelector(".chip-label")?.textContent?.trim() === label
    );
    return {
      label,
      found: Boolean(chip),
      href: chip?.getAttribute("href") || null,
      ok: Boolean(chip?.getAttribute("href")?.includes(href))
    };
  });
}, EXPECTED);

console.log(JSON.stringify({ chips }, null, 2));
await browser.close();

if (!chips.every((c) => c.ok)) process.exit(1);