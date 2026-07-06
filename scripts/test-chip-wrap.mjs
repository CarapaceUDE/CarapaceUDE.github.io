#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  detectChipRows,
  shouldHideChipRow,
  shouldUseChipStackLayout,
  CHIP_BULLET_CONNECTOR_MS,
  CHIP_BULLET_SPINE_MS,
  CHIP_BULLET_SPINE_DELAY_MS
} from "../assets/chip-wrap-layout.js";
import { computeChipTreeFlip } from "../assets/chip-tree-layout.js";

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

const singleRow = detectChipRows([0, 0, 1], true);
assert(!singleRow.wrap, "single row does not wrap");
assert(singleRow.rows.every((r) => r === 0), "single row assigns row 0");

const wrapped = detectChipRows([0, 0, 28, 28], true);
assert(wrapped.wrap, "two rows wrap");
assert(wrapped.rows.join(",") === "0,0,1,1", `row indices assigned (${wrapped.rows})`);

const wide = detectChipRows([0, 30], false);
assert(!wide.wrap, "wide layout skips wrap detection");

assert(shouldHideChipRow(1, 0), "row below active top row hides");
assert(shouldHideChipRow(2, 1), "deeper row hides when mid row active");
assert(!shouldHideChipRow(0, 1), "top row stays when lower row active");
assert(!shouldHideChipRow(1, 1), "same row never hides as below-active");

const chipJs = readFileSync(join(root, "assets/chip-interactions.js"), "utf8");
const css = readFileSync(join(root, "assets/hero-home.css"), "utf8");

assert(!chipJs.includes("chip-tree--up"), "bullets always shoot downward");
assert(chipJs.includes("chip-row--below-active"), "only lower rows hide on focus");
assert(chipJs.includes("chip-wrap-layout.js"), "chip interactions use wrap layout helper");
assert(css.includes("data-chip-wrap"), "wrap layout styles");
assert(!css.includes("chip-tree--up"), "no upward tree styles");
assert(css.includes("chip-row--below-active"), "hide lower-row chip styles");
assert(css.includes("--chip-row-fade-ms"), "chip fade-out uses bullet spine duration");
assert(css.includes("--chip-row-show-ms"), "chip fade-in uses bullet connector duration");
assert(chipJs.includes("CHIP_BULLET_SPINE_MS"), "interactions share bullet spine timing");
assert(CHIP_BULLET_SPINE_MS === 240 && CHIP_BULLET_SPINE_DELAY_MS === 100, "spine timing matches bullets");
assert(CHIP_BULLET_CONNECTOR_MS === 160, "connector timing matches bullets");

const fitsDefault = computeChipTreeFlip({
  chipLeft: 100,
  chipWidth: 120,
  treeWidth: 180,
  boundsLeft: 16,
  boundsRight: 400
});
assert(!fitsDefault.flip, "tree stays LTR when it fits on the right");

const needsFlip = computeChipTreeFlip({
  chipLeft: 300,
  chipWidth: 110,
  treeWidth: 200,
  boundsLeft: 16,
  boundsRight: 390
});
assert(needsFlip.flip, "tree flips when default layout would overflow right");
assert(needsFlip.fits, "flipped tree fits in bounds");

const tightFlip = computeChipTreeFlip({
  chipLeft: 200,
  chipWidth: 100,
  treeWidth: 280,
  boundsLeft: 16,
  boundsRight: 390
});
assert(tightFlip.flip, "tree flips on tight right-side chip");
assert(tightFlip.branchMaxPx != null, "tight flip clamps branch width");

const preferRight = computeChipTreeFlip({
  chipLeft: 620,
  chipWidth: 110,
  treeWidth: 240,
  boundsLeft: 24,
  boundsRight: 780,
  preferRight: true,
  viewportRight: 844
});
assert(!preferRight.flip, "landscape stack keeps bullets on the right");
assert(preferRight.branchMaxPx != null, "landscape clamps width instead of flipping");

const leftAnchor = computeChipTreeFlip({
  chipLeft: 620,
  chipWidth: 110,
  treeWidth: 240,
  boundsLeft: 24,
  boundsRight: 780,
  anchorLeft: true,
  viewportRight: 844
});
assert(!leftAnchor.flip, "left-anchored stem keeps bullets on the right");
assert(leftAnchor.branchMaxPx != null, "left-anchored stem clamps from chip left edge");

assert(chipJs.includes("chip-tree--left-anchor"), "landscape marks left-anchored chip trees");
assert(css.includes("chip-tree--left-anchor"), "left-anchored chip tree styles present");

assert(shouldUseChipStackLayout(false, true), "landscape uses chip stack layout");
assert(!shouldUseChipStackLayout(false, false), "desktop wide skips stack layout");

assert(css.includes("chip-tree--flip"), "flip tree styles present");
assert(chipJs.includes("chip-tree-layout.js"), "interactions use tree layout helper");
assert(chipJs.includes("shouldUseTouchChipControls"), "touch chip control helper exported");
assert(!chipJs.includes("\u2014"), "chip interactions avoid em dashes");
assert(!readFileSync(join(root, "assets/hero-about.js"), "utf8").includes("\u2014"), "hero copy avoids em dashes");
assert(chipJs.includes("_toggleChip"), "touch chips use explicit toggle");
assert(chipJs.includes("_bindDocumentDismiss"), "touch chips dismiss on outside tap");
assert(chipJs.includes("GHOST_MOUSE_SUPPRESS_MS"), "ghost mouse events suppressed after touch");
assert(chipJs.includes("refreshLayout"), "chip layout can refresh after viewport class changes");
assert(chipJs.includes("MutationObserver"), "chip layout reacts to body class changes");
assert(css.includes("margin: 0 !important"), "landscape eyebrow overrides global margin");
assert(css.includes("1.44fr"), "landscape balances copy vs chip columns");
assert(css.includes("minmax(212px"), "landscape chip column has readable floor width");
assert(css.includes("width: max-content"), "landscape chips shrink to label width");
assert(css.includes("align-items: flex-start"), "landscape chips left-align in chip column");

if (failed) {
  console.error(`\n${failed} assertion(s) failed`);
  process.exit(1);
}
console.log("\nAll chip wrap assertions passed");