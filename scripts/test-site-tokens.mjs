#!/usr/bin/env node
/**
 * Assert Cortex canonical tokens in assets/site.css (:root + light theme).
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const css = readFileSync(join(root, "assets/site.css"), "utf8");

function extractBlock(selector) {
  const re = new RegExp(`${selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\{([^}]+)\\}`, "s");
  const m = css.match(re);
  if (!m) throw new Error(`Missing CSS block: ${selector}`);
  return m[1];
}

function token(block, name) {
  const re = new RegExp(`--${name}\\s*:\\s*([^;]+);`);
  const m = block.match(re);
  if (!m) throw new Error(`Missing token --${name}`);
  return m[1].trim();
}

const dark = extractBlock(":root");
const lightStart = css.indexOf('[data-theme="light"]');
if (lightStart < 0) throw new Error('Missing [data-theme="light"] block');
const lightBrace = css.indexOf("{", lightStart);
const lightEnd = css.indexOf("}", lightBrace);
const light = css.slice(lightBrace + 1, lightEnd);

const darkExpected = {
  bg: "#0f0f10",
  surface: "#1a1a1d",
  border: "#2a2a2e",
  fg: "#e8e8ea",
  muted: "#6b6b75",
  "fg-2": "#8f97a3",
  accent: "#7c6af7",
  "accent-dim": "#3d3575",
  "accent-hover": "#8f7df9",
  "accent-on": "#0f0f10",
  cyan: "#5ecfff",
  blue: "#6b8cff",
  purple: "#c084fc",
  glow: "rgba(124, 106, 247, 0.22)",
  "cta-gold": "#c9a227",
  "cta-gold-hover": "#dbb42e",
  "cta-gold-on": "#0f0f10",
  "cta-gold-glow": "rgba(201, 162, 39, 0.28)",
  success: "#4caf6e",
  danger: "#e05260",
};

const lightExpected = {
  bg: "#f2f2f4",
  surface: "#e8e8ec",
  accent: "#5a4ad4",
  "accent-on": "#ffffff",
  "cta-gold": "#c9a227",
  "cta-gold-on": "#0f0f10",
  cyan: "#0e8fc4",
  blue: "#4a6fd4",
  purple: "#9333ea",
};

let failed = 0;

for (const [name, value] of Object.entries(darkExpected)) {
  const actual = token(dark, name);
  if (actual !== value) {
    console.error(`FAIL dark --${name}: expected ${value}, got ${actual}`);
    failed++;
  } else {
    console.log(`ok dark --${name}`);
  }
}

for (const [name, value] of Object.entries(lightExpected)) {
  const actual = token(light, name);
  if (actual !== value) {
    console.error(`FAIL light --${name}: expected ${value}, got ${actual}`);
    failed++;
  } else {
    console.log(`ok light --${name}`);
  }
}

const textAlias = token(dark, "text");
if (!css.includes("--text: var(--fg)") && textAlias !== "var(--fg)") {
  console.error("FAIL --text should alias --fg");
  failed++;
} else {
  console.log("ok --text aliases --fg");
}

const copper = token(dark, "copper");
if (copper === "var(--warn)") {
  console.error("FAIL --copper must not alias --warn");
  failed++;
} else if (copper !== "var(--cta-gold)") {
  console.error(`FAIL --copper: expected var(--cta-gold), got ${copper}`);
  failed++;
} else {
  console.log("ok --copper maps to --cta-gold");
}

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function relLum([r, g, b]) {
  const s = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * s[0] + 0.7152 * s[1] + 0.0722 * s[2];
}
function contrast(a, b) {
  const l1 = relLum(a);
  const l2 = relLum(b);
  const hi = Math.max(l1, l2);
  const lo = Math.min(l1, l2);
  return (hi + 0.05) / (lo + 0.05);
}

const goldOn = hexToRgb(darkExpected["cta-gold-on"]);
const gold = hexToRgb(darkExpected["cta-gold"]);
const goldContrast = contrast(goldOn, gold);
console.log(`gold CTA contrast: ${goldContrast.toFixed(2)}:1`);
if (goldContrast < 4.5) {
  console.error("FAIL gold CTA contrast below 4.5:1");
  failed++;
} else {
  console.log("ok gold CTA contrast >= 4.5:1");
}

const lightViolet = hexToRgb(lightExpected.accent);
const lightVioletOn = hexToRgb(lightExpected["accent-on"]);
const violetContrast = contrast(lightVioletOn, lightViolet);
console.log(`light violet button contrast: ${violetContrast.toFixed(2)}:1`);
if (violetContrast < 4.5) {
  console.error("FAIL light violet accent-on contrast below 4.5:1");
  failed++;
} else {
  console.log("ok light violet accent contrast >= 4.5:1");
}

if (failed) {
  console.error(`\n${failed} assertion(s) failed`);
  process.exit(1);
}
console.log("\nAll token assertions passed");