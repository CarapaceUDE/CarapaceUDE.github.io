#!/usr/bin/env node
/**
 * Assert gold CTA hierarchy and no decorative warn in feature cards.
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const siteCss = readFileSync(join(root, "assets/site.css"), "utf8");
const heroCss = readFileSync(join(root, "assets/hero-home.css"), "utf8");
const craftCss = readFileSync(join(root, "assets/pages-craft.css"), "utf8");
const indexHtml = readFileSync(join(root, "index.html"), "utf8");

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    console.error(`FAIL: ${msg}`);
    failed++;
  } else {
    console.log(`ok: ${msg}`);
  }
}

assert(siteCss.includes(".cta-link") && siteCss.includes("var(--cta-gold)"), "site.css .cta-link uses --cta-gold");
assert(heroCss.includes("var(--cta-gold)"), "hero-home.css cta-link uses --cta-gold");
assert(siteCss.includes("#intake-form .btn.primary[type=\"submit\"]"), "business form submit targets gold");
assert(
  siteCss.match(/\.links > a\.nav-contact[\s\S]*?var\(--cta-gold\)/),
  "nav-contact uses --cta-gold"
);
assert(
  !siteCss.match(/body\.page-home \.links > a\.nav-contact[\s\S]*?var\(--accent\)/),
  "no homepage nav-contact violet override"
);
assert(
  readFileSync(join(root, "assets/hero-core.js"), "utf8").includes('fill", "var(--cta-gold)"'),
  "hero-core CTA squircle uses --cta-gold"
);

const featureCardBlock = craftCss.match(/\.page-cortex \.feature-card::before[\s\S]*?\}/);
assert(featureCardBlock && !featureCardBlock[0].includes("var(--warn)"), "feature-card gradient has no --warn");
assert(!craftCss.includes("var(--warn)"), "pages-craft.css has no --warn references");

assert(indexHtml.includes('class="nav-contact"'), "index.html Contact keeps nav-contact class");
assert(indexHtml.includes('class="cta-link"'), "index.html hero has cta-link");

const scopeFiles = [
  "assets/site.css",
  "assets/hero-home.css",
  "assets/pages-craft.css",
  "assets/pages.css",
];
const tealRe = /oklch\([^)]*210/g;
for (const rel of scopeFiles) {
  const text = readFileSync(join(root, rel), "utf8");
  const hits = text.match(tealRe);
  assert(!hits?.length, `${rel} has zero oklch hue-210 (${hits?.length ?? 0})`);
}

if (failed) {
  console.error(`\n${failed} assertion(s) failed`);
  process.exit(1);
}
console.log("\nAll CTA hierarchy assertions passed");