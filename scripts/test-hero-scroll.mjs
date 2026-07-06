/**
 * Unit tests for shipped hero scroll/transition helpers (assets/hero-core.js).
 * Usage: node scripts/test-hero-scroll.mjs <scratch-dir>
 */
import { writeFileSync } from "fs";
import { resolve } from "path";
import {
  scrollablePx,
  heroStageHeightVh,
  effectMixFromFrac,
  pinnedFadeT,
  scrollMetrics,
  smoothstep
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

const log = [];
let failed = 0;

function assert(cond, msg) {
  log.push(`${cond ? "PASS" : "FAIL"}: ${msg}`);
  if (!cond) failed += 1;
}

const SLIDE_COUNT = 8;
const VIEWPORT = 800;

// (a) vh-per-slide multiplier ~1.30 vs 47.5 baseline
const baselineVh = BASE_VH_PER_SLIDE;
const shippedVh = VH_PER_SLIDE;
const ratio = shippedVh / baselineVh;
log.push(`baseline vh-per-slide: ${baselineVh}`);
log.push(`shipped vh-per-slide: ${shippedVh}`);
log.push(`multiplier ratio: ${ratio.toFixed(4)}`);
assert(Math.abs(ratio - 1.3) <= 0.02, `vh-per-slide ratio ~1.30 (got ${ratio.toFixed(4)})`);
assert(Math.abs(SCROLL_DISTANCE_MULTIPLIER - 1.3) <= 0.02, `SCROLL_DISTANCE_MULTIPLIER ~1.30`);

// (b) stage height scales ~1.30; scrollable px grows at least that much (fixed viewport shaves top)
const baselineStagePx = (SLIDE_COUNT * baselineVh / 100) * VIEWPORT;
const shippedStagePx = (heroStageHeightVh(SLIDE_COUNT) / 100) * VIEWPORT;
const stageRatio = shippedStagePx / baselineStagePx;
const baselineScrollable = baselineStagePx - VIEWPORT;
const shippedScrollable = scrollablePx(SLIDE_COUNT, VIEWPORT);
const scrollRatio = shippedScrollable / baselineScrollable;
log.push(`baseline stage px: ${Math.round(baselineStagePx)}`);
log.push(`shipped stage px: ${Math.round(shippedStagePx)}`);
log.push(`stage height ratio: ${stageRatio.toFixed(4)}`);
log.push(`baseline scrollable px (${SLIDE_COUNT} slides @ ${VIEWPORT}px): ${Math.round(baselineScrollable)}`);
log.push(`shipped scrollable px: ${Math.round(shippedScrollable)}`);
log.push(`scrollable ratio: ${scrollRatio.toFixed(4)}`);
assert(Math.abs(stageRatio - 1.3) <= 0.02, `stage height ratio ~1.30 (got ${stageRatio.toFixed(4)})`);
assert(scrollRatio >= 1.28, `scrollable px at least ~30% greater (got ${scrollRatio.toFixed(4)})`);
assert(
  Math.abs(heroStageHeightVh(SLIDE_COUNT) - SLIDE_COUNT * VH_PER_SLIDE) < 0.01,
  "heroStageHeightVh matches slideCount * VH_PER_SLIDE"
);

// (c) effect-mix spans wider band and has lower peak delta vs baseline snapshot
function baselineEffectMix(frac, slideCount, idx) {
  if (idx >= slideCount - 1 || frac <= 0.3) return 0;
  return smoothstep(0.3, 0.96, frac);
}

const fracSamples = [];
for (let i = 0; i <= 100; i++) fracSamples.push(i / 100);

const idx = 2;
let baselineBand = { onset: null, end: null };
let shippedBand = { onset: null, end: null };
let maxBaselineDelta = 0;
let maxShippedDelta = 0;

for (let i = 1; i < fracSamples.length; i++) {
  const f = fracSamples[i];
  const bMix = baselineEffectMix(f, SLIDE_COUNT, idx);
  const sMix = effectMixFromFrac(f, SLIDE_COUNT, idx);
  const bPrev = baselineEffectMix(fracSamples[i - 1], SLIDE_COUNT, idx);
  const sPrev = effectMixFromFrac(fracSamples[i - 1], SLIDE_COUNT, idx);
  maxBaselineDelta = Math.max(maxBaselineDelta, Math.abs(bMix - bPrev));
  maxShippedDelta = Math.max(maxShippedDelta, Math.abs(sMix - sPrev));
  if (bMix > 0.02 && baselineBand.onset === null) baselineBand.onset = f;
  if (bMix > 0.98 && baselineBand.end === null) baselineBand.end = f;
  if (sMix > 0.02 && shippedBand.onset === null) shippedBand.onset = f;
  if (sMix > 0.98 && shippedBand.end === null) shippedBand.end = f;
}

const baselineWidth = (baselineBand.end ?? 1) - (baselineBand.onset ?? 1);
const shippedWidth = (shippedBand.end ?? 1) - (shippedBand.onset ?? 1);
log.push(`baseline mix band: ${baselineBand.onset?.toFixed(2)} – ${baselineBand.end?.toFixed(2)} (width ${baselineWidth.toFixed(2)})`);
log.push(`shipped mix band: ${shippedBand.onset?.toFixed(2)} – ${shippedBand.end?.toFixed(2)} (width ${shippedWidth.toFixed(2)})`);
log.push(`EFFECT_MIX_ONSET/END: ${EFFECT_MIX_ONSET} / ${EFFECT_MIX_END}`);
log.push(`max per-step delta baseline: ${maxBaselineDelta.toFixed(5)}`);
log.push(`max per-step delta shipped: ${maxShippedDelta.toFixed(5)}`);
assert(shippedWidth > baselineWidth, `shipped mix band wider than baseline (${shippedWidth.toFixed(2)} > ${baselineWidth.toFixed(2)})`);
assert(maxShippedDelta < maxBaselineDelta, `shipped peak delta lower than baseline`);

// pinned fade uses smoothstep (gentler than quadratic)
const { fadeStart } = scrollMetrics(SLIDE_COUNT);
const fadeMid = pinnedFadeT(fadeStart + (1 - fadeStart) * 0.5, fadeStart);
const baselineFadeMid = (() => {
  const raw = 0.5;
  const t = Math.min(1, Math.max(0, raw * 2.4));
  return t * t;
})();
log.push(`pinnedFadeT mid-curve: ${fadeMid.toFixed(4)} (baseline quadratic mid: ${baselineFadeMid.toFixed(4)})`);
assert(fadeMid < baselineFadeMid, "pinned fade mid-point gentler than baseline quadratic");

// reduced-motion: no mix
assert(effectMixFromFrac(0.9, SLIDE_COUNT, 0, true) === 0, "reduced-motion yields zero mix");

log.push(`\n${failed === 0 ? "ALL PASS" : `${failed} FAILED`}`);
writeFileSync(resolve(scratch, "test-hero-scroll.log"), log.join("\n") + "\n");
console.log(failed === 0 ? "OK" : "FAIL");
process.exit(failed === 0 ? 0 : 1);