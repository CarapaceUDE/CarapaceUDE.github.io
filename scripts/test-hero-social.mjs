#!/usr/bin/env node
/**
 * Assert hero social chrome is wired on hero pages and minimal pages.
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    console.error(`FAIL: ${msg}`);
    failed++;
  } else {
    console.log(`ok: ${msg}`);
  }
}

const heroSocial = readFileSync(join(root, "assets/hero-social.js"), "utf8");
const platforms = [
  "patreon.com/cw/CarapaceAI",
  "x.com/CarapaceAI",
  "discord.gg/VgDchHUHm3",
  "github.com/CarapaceUDE",
  "youtube.com/@carapaceai",
  "tiktok.com/@carapaceai"
];
for (const p of platforms) {
  assert(heroSocial.includes(p), `hero-social.js includes ${p}`);
}

assert(heroSocial.includes('chrome-social--" + side'), "dynamic social nav side class");
assert(heroSocial.includes("buildSocialNav(\"left\"") || heroSocial.includes('buildSocialNav("left"'), "left cluster mount");
assert(heroSocial.includes("buildSocialNav(\"right\"") || heroSocial.includes('buildSocialNav("right"'), "right cluster mount");
assert(heroSocial.includes("hero-chrome--minimal"), "minimal chrome fallback");
assert(heroSocial.includes("chrome-bottom-hub"), "center hub wrapper for fixed social flanks");

const pages = [
  "index.html",
  "about.html",
  "business.html",
  "thank-you.html",
  "carapace.html"
];
for (const page of pages) {
  const html = readFileSync(join(root, page), "utf8");
  assert(html.includes("hero-social.js"), `${page} loads hero-social.js`);
}

assert(
  readFileSync(join(root, "assets/effects-interaction.js"), "utf8").includes(".chrome-social"),
  "effects-interaction blocks chrome-social clicks"
);

if (failed) {
  console.error(`\n${failed} assertion(s) failed`);
  process.exit(1);
}
console.log("\nAll hero social assertions passed");