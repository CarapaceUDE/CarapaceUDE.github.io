/**
 * Unit tests for shipped hero scroll/transition helpers.
 * Compares live helpers against committed baseline snapshot (hero-scroll-baseline.json).
 * Usage: node scripts/test-hero-scroll.mjs <scratch-dir>
 */
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import {
  scrollablePx,
  heroStageHeightVh,
  effectMixFromFrac,
  pinnedFadeT,
  scrollMetrics
} from "../assets/hero-scroll-math.js";
import {
  BASE_VH_PER_SLIDE,
  SCROLL_DISTANCE_MULTIPLIER,
  VH_PER_SLIDE,
  EFFECT_MIX_ONSET,
  EFFECT_MIX_END
} from "../assets/hero-constants.js";

const scratch = process.argv[2];
if (!scratch) {
  console.error("Usage: node scripts/test-hero-scroll.mjs <scratch-dir>");
  process.exit(1);
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const baselinePath = resolve(root, "scripts/hero-scroll-baseline.json");
const baseline = JSON.parse(readFileSync(baselinePath, "utf8"));

const log = [];
let failed = 0;

function assert(cond, msg) {
  log.push(`${cond ? "PASS" : "FAIL"}: ${msg}`);
  if (!cond) failed += 1;
}

log.push(`baseline snapshot: ${baselinePath}`);
log.push(`baseline captured: ${baseline.capturedAt} (${baseline.description})`);

const SLIDE_COUNT = baseline.slideCount;
const VIEWPORT = baseline.viewport;
const TEST_IDX = baseline.testIdx;

// (a) vh-per-slide multiplier ~1.30 vs baseline snapshot
const ratio = VH_PER_SLIDE / baseline.vhPerSlide;
log.push(`baseline vh-per-slide: ${baseline.vhPerSlide}`);
log.push(`shipped vh-per-slide: ${VH_PER_SLIDE}`);
log.push(`multiplier ratio: ${ratio.toFixed(4)}`);
assert(Math.abs(ratio - 1.3) <= 0.02, `vh-per-slide ratio ~1.30 (got ${ratio.toFixed(4)})`);
assert(Math.abs(SCROLL_DISTANCE_MULTIPLIER - 1.3) <= 0.02, `SCROLL_DISTANCE_MULTIPLIER ~1.30`);
assert(BASE_VH_PER_SLIDE === baseline.vhPerSlide, "BASE_VH_PER_SLIDE matches baseline snapshot");

// (b) stage height scales ~1.30; scrollable px grows at least that much
const shippedStagePx = (heroStageHeightVh(SLIDE_COUNT) / 100) * VIEWPORT;
const stageRatio = shippedStagePx / baseline.stageHeightPx;
const shippedScrollable = scrollablePx(SLIDE_COUNT, VIEWPORT);
const scrollRatio = shippedScrollable / baseline.scrollablePx;
log.push(`baseline stage px (snapshot): ${baseline.stageHeightPx}`);
log.push(`shipped stage px: ${Math.round(shippedStagePx)}`);
log.push(`stage height ratio: ${stageRatio.toFixed(4)}`);
log.push(`baseline scrollable px (snapshot): ${baseline.scrollablePx}`);
log.push(`shipped scrollable px: ${Math.round(shippedScrollable)}`);
log.push(`scrollable ratio: ${scrollRatio.toFixed(4)}`);
assert(Math.abs(stageRatio - 1.3) <= 0.02, `stage height ratio ~1.30 (got ${stageRatio.toFixed(4)})`);
assert(scrollRatio >= 1.28, `scrollable px at least ~30% greater (got ${scrollRatio.toFixed(4)})`);
assert(
  Math.abs(heroStageHeightVh(SLIDE_COUNT) - SLIDE_COUNT * VH_PER_SLIDE) < 0.01,
  "heroStageHeightVh matches slideCount * VH_PER_SLIDE"
);

// (c) effect-mix: compare shipped helper vs baseline snapshot samples (no inline baseline re-impl)
let shippedBand = { onset: null, end: null };
let maxShippedDelta = 0;
for (let i = 1; i < baseline.fracSamples.length; i++) {
  const frac = baseline.fracSamples[i].frac;
  const sMix = effectMixFromFrac(frac, SLIDE_COUNT, TEST_IDX);
  const sPrev = effectMixFromFrac(baseline.fracSamples[i - 1].frac, SLIDE_COUNT, TEST_IDX);
  maxShippedDelta = Math.max(maxShippedDelta, Math.abs(sMix - sPrev));
  if (sMix > 0.02 && shippedBand.onset === null) shippedBand.onset = frac;
  if (sMix > 0.98 && shippedBand.end === null) shippedBand.end = frac;
}

const shippedWidth = (shippedBand.end ?? 1) - (shippedBand.onset ?? 1);
log.push(`baseline mix band (snapshot): ${baseline.mixBand.onset?.toFixed(2)} – ${baseline.mixBand.end?.toFixed(2)} (width ${baseline.mixBand.width.toFixed(2)})`);
log.push(`shipped mix band: ${shippedBand.onset?.toFixed(2)} – ${shippedBand.end?.toFixed(2)} (width ${shippedWidth.toFixed(2)})`);
log.push(`EFFECT_MIX_ONSET/END: ${EFFECT_MIX_ONSET} / ${EFFECT_MIX_END}`);
log.push(`baseline max per-step delta (snapshot): ${baseline.maxMixDelta.toFixed(5)}`);
log.push(`shipped max per-step delta: ${maxShippedDelta.toFixed(5)}`);
assert(shippedWidth > baseline.mixBand.width, `shipped mix band wider than baseline snapshot (${shippedWidth.toFixed(2)} > ${baseline.mixBand.width.toFixed(2)})`);
assert(maxShippedDelta < baseline.maxMixDelta, `shipped peak delta lower than baseline snapshot`);

// pinned fade: shipped helper vs baseline snapshot mid-point
const { fadeStart } = scrollMetrics(SLIDE_COUNT);
const fadeMid = pinnedFadeT(fadeStart + (1 - fadeStart) * 0.5, fadeStart);
log.push(`pinnedFadeT mid-curve shipped: ${fadeMid.toFixed(4)}`);
log.push(`pinnedFadeT mid-curve baseline (snapshot): ${baseline.pinnedFadeMid.toFixed(4)}`);
assert(fadeMid < baseline.pinnedFadeMid, "pinned fade mid-point gentler than baseline snapshot");

// reduced-motion: no mix
assert(effectMixFromFrac(0.9, SLIDE_COUNT, 0, true) === 0, "reduced-motion yields zero mix");

log.push(`\n${failed === 0 ? "ALL PASS" : `${failed} FAILED`}`);
writeFileSync(resolve(scratch, "test-hero-scroll.log"), log.join("\n") + "\n");
console.log(failed === 0 ? "OK" : "FAIL");
process.exit(failed === 0 ? 0 : 1);