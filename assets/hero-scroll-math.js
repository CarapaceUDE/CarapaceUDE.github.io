/**
 * Pure scroll/transition math for hero stages — no DOM or network imports.
 * Consumed by hero-core.js and unit tests.
 */
import {
  VH_PER_SLIDE,
  EFFECT_MIX_ONSET,
  EFFECT_MIX_END,
  PINNED_FADE_ACCEL
} from "./hero-constants.js";

export function smoothstep(edge0, edge1, x) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export function scrollMetrics(slideCount) {
  const slideSpan = slideCount;
  const fadeStart = (slideCount - 0.28) / slideSpan;
  return { slideSpan, fadeStart };
}

export function heroStageHeightVh(slideCount) {
  return slideCount * VH_PER_SLIDE;
}

export function scrollablePx(slideCount, viewportHeight) {
  const stageHeightPx = (heroStageHeightVh(slideCount) / 100) * viewportHeight;
  return stageHeightPx - viewportHeight;
}

export function progressToSlide(progress, slideCount) {
  const { slideSpan } = scrollMetrics(slideCount);
  const floatIdx = progress * slideSpan;
  const idx = Math.min(slideCount - 1, Math.floor(floatIdx));
  const frac = floatIdx - idx;
  return { idx, frac, floatIdx, nextIdx: Math.min(idx + 1, slideCount - 1) };
}

export function effectMixFromFrac(frac, slideCount, idx, reducedMotion = false) {
  if (reducedMotion || idx >= slideCount - 1 || frac <= EFFECT_MIX_ONSET) return 0;
  return smoothstep(EFFECT_MIX_ONSET, EFFECT_MIX_END, frac);
}

export function pinnedFadeT(progress, fadeStart) {
  const raw = (progress - fadeStart) / (1 - fadeStart);
  const t = Math.min(1, Math.max(0, raw * PINNED_FADE_ACCEL));
  return smoothstep(0, 1, t);
}