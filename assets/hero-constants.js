/** Shared hero constants — no imports from hero-core or text-anime. */

/** Baseline vh-per-slide before scroll-distance multiplier (pre-1.30 era). */
export const BASE_VH_PER_SLIDE = 47.5;
/** Scroll-distance multiplier — 100% hero progress requires ~30% more physical scroll. */
export const SCROLL_DISTANCE_MULTIPLIER = 1.3;
export const VH_PER_SLIDE = BASE_VH_PER_SLIDE * SCROLL_DISTANCE_MULTIPLIER;

/** Effect crossfade band within each slide's fractional progress (wider = smoother handoff). */
export const EFFECT_MIX_ONSET = 0.18;
export const EFFECT_MIX_END = 0.98;
/** Pinned-layer fade acceleration — lower = gentler tail handoff. */
export const PINNED_FADE_ACCEL = 1.65;

/** OKLCH hue anchors aligned with Cortex site tokens (violet / cyan / purple family). */
export const EFFECT_HUE = {
  accent: 275,
  cyan: 230,
  purple: 300,
  blue: 250,
  sky: 195,
  warm: 45
};
export const DEFAULT_EFFECT_HUE = EFFECT_HUE.accent;

export const PILOT_NOTE_DISCLAIMER =
  "Pilot program pricing. Figures reflect our current testing phase and are subject to change once pilots complete and the model is validated.";

/** Third-party stat citations on the home hero (verified live URLs). */
export const SOURCE_LINKS = {
  asanaIndex: "https://asana.com/resources/anatomy-of-work",
  asanaWorkAboutWork: "https://asana.com/resources/why-work-about-work-is-bad",
  idcAiRoi:
    "https://blogs.microsoft.com/blog/2024/11/12/idcs-2024-ai-opportunity-study-top-five-ai-trends-to-watch/",
  adeccoGwof2024:
    "https://www.adeccogroup.com/future-of-work/latest-insights/working-through-change-what-employers-need-to-learn",
  lseProtiviti:
    "https://www.lse.ac.uk/news/ai-boosts-productivity-by-the-equivalent-of-one-workday-per-week-new-report-finds"
};