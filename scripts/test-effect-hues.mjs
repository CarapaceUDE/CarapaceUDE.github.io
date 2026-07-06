#!/usr/bin/env node
/**
 * Assert hero slide effects use Cortex violet/cyan/purple hues — not legacy teal (210).
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const assets = join(root, "assets");

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    console.error(`FAIL: ${msg}`);
    failed++;
  } else {
    console.log(`ok: ${msg}`);
  }
}

const heroSlides = readdirSync(assets).filter(
  (f) => f.startsWith("hero-") && f.endsWith(".js") && f !== "hero-insert-cursor.js" && f !== "hero-core.js"
);

const tealHueRe = /h:\s*210\b/g;
for (const file of heroSlides) {
  const text = readFileSync(join(assets, file), "utf8");
  const hits = text.match(tealHueRe);
  assert(!hits?.length, `${file} has zero slide hue-210 (${hits?.length ?? 0})`);
}

const effectsAnime = readFileSync(join(assets, "effects-anime.js"), "utf8");
assert(effectsAnime.includes("DEFAULT_EFFECT_HUE"), "effects-anime imports DEFAULT_EFFECT_HUE");
assert(!effectsAnime.includes("this.hue = 210"), "effects-anime default hue is not 210");
assert(!effectsAnime.includes("h ?? 210"), "setHue fallback is not 210");

const heroCore = readFileSync(join(assets, "hero-core.js"), "utf8");
assert(heroCore.includes("DEFAULT_EFFECT_HUE"), "hero-core uses DEFAULT_EFFECT_HUE fallback");
assert(!heroCore.includes("?? 210"), "hero-core slide hue fallback is not 210");

const constants = readFileSync(join(assets, "hero-constants.js"), "utf8");
assert(constants.includes("accent: 275"), "EFFECT_HUE.accent is violet 275");

if (failed) {
  console.error(`\n${failed} assertion(s) failed`);
  process.exit(1);
}
console.log("\nAll effect hue assertions passed");