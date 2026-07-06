/**
 * One-time maintainer tool: regenerate scripts/hero-scroll-baseline.json
 * from documented pre-1.30 scroll-hero parameters. Not used at test runtime.
 */
import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function smoothstep(edge0, edge1, x) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

const BASE_VH_PER_SLIDE = 47.5;
const EFFECT_MIX_ONSET = 0.3;
const EFFECT_MIX_END = 0.96;
const PINNED_FADE_ACCEL = 2.4;
const SLIDE_COUNT = 8;
const VIEWPORT = 800;
const TEST_IDX = 2;

function baselineEffectMix(frac, slideCount, idx) {
  if (idx >= slideCount - 1 || frac <= EFFECT_MIX_ONSET) return 0;
  return smoothstep(EFFECT_MIX_ONSET, EFFECT_MIX_END, frac);
}

function baselinePinnedFadeT(progress, fadeStart) {
  const raw = (progress - fadeStart) / (1 - fadeStart);
  const t = Math.min(1, Math.max(0, raw * PINNED_FADE_ACCEL));
  return t * t;
}

const fadeStart = (SLIDE_COUNT - 0.28) / SLIDE_COUNT;
const fracSamples = [];
for (let i = 0; i <= 100; i++) {
  const frac = i / 100;
  fracSamples.push({ frac, mix: baselineEffectMix(frac, SLIDE_COUNT, TEST_IDX) });
}

let onset = null;
let end = null;
let maxDelta = 0;
for (let i = 1; i < fracSamples.length; i++) {
  const mix = fracSamples[i].mix;
  const prev = fracSamples[i - 1].mix;
  maxDelta = Math.max(maxDelta, Math.abs(mix - prev));
  if (mix > 0.02 && onset === null) onset = fracSamples[i].frac;
  if (mix > 0.98 && end === null) end = fracSamples[i].frac;
}

const stageHeightPx = (SLIDE_COUNT * BASE_VH_PER_SLIDE / 100) * VIEWPORT;
const scrollablePx = stageHeightPx - VIEWPORT;
const pinnedFadeMid = baselinePinnedFadeT(fadeStart + (1 - fadeStart) * 0.5, fadeStart);

const snapshot = {
  version: 1,
  capturedAt: "2026-07-05",
  description: "Pre-SCROLL_DISTANCE_MULTIPLIER baseline (47.5 vh/slide, mix 0.3–0.96, pinnedFade quad*2.4)",
  vhPerSlide: BASE_VH_PER_SLIDE,
  effectMixOnset: EFFECT_MIX_ONSET,
  effectMixEnd: EFFECT_MIX_END,
  pinnedFadeAccel: PINNED_FADE_ACCEL,
  slideCount: SLIDE_COUNT,
  viewport: VIEWPORT,
  testIdx: TEST_IDX,
  stageHeightPx,
  scrollablePx,
  fadeStart,
  mixBand: { onset, end, width: (end ?? 1) - (onset ?? 1) },
  maxMixDelta: maxDelta,
  pinnedFadeMid,
  fracSamples
};

writeFileSync(resolve(root, "scripts/hero-scroll-baseline.json"), JSON.stringify(snapshot, null, 2) + "\n");
console.log("Wrote scripts/hero-scroll-baseline.json");