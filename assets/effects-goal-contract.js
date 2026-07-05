/**
 * Single source of truth for hero effects goal IDs, interactivity, and wired E2E slides.
 * Consumed by hero-core.js, test-effects-ids.mjs, and verify-revamp.py (via JSON export).
 */

/**
 * Verification plan step 1 / E1 prerequisite draw IDs (15 named implementations).
 * Goal + plan text round to "16" — the 16th audit row is stack assignment debt (0× pre-ship).
 */
export const PREREQUISITE_DRAW_IDS = [
  "shield",
  "cascade",
  "mesh",
  "stack",
  "magnet",
  "signal",
  "chrono",
  "ping",
  "flowchart",
  "pcb",
  "topology",
  "pipeline",
  "constellation",
  "vault",
  "schematic"
];

/** @deprecated alias — use PREREQUISITE_DRAW_IDS */
export const ORIGINAL_GOAL_IDS = PREREQUISITE_DRAW_IDS;

export const GOAL_ENUMERATION_ROW_COUNT = 16;

export const ORIGINAL_PRESHIP_IDS = PREREQUISITE_DRAW_IDS;

/** Phase 2 procedural canvas effects (research §Proposed effects). */
export const PHASE2_EFFECT_IDS = [
  "hexpulse",
  "parcel",
  "hashwave",
  "branch",
  "telemetry",
  "trace",
  "checksum",
  "cellscan",
  "beacon",
  "lattice",
  "filament"
];

/** Drawable primitive caps — full motion / reduced motion (research §Accessibility). */
export const EFFECT_PARTICLE_CAPS = {
  hexpulse: { full: 80, rm: 40 },
  parcel: { full: 24, rm: 12 },
  hashwave: { full: 80, rm: 40 },
  branch: { full: 32, rm: 16 },
  telemetry: { full: 40, rm: 20 },
  trace: { full: 48, rm: 24 },
  checksum: { full: 36, rm: 18 },
  cellscan: { full: 56, rm: 28 },
  beacon: { full: 32, rm: 16 },
  lattice: { full: 64, rm: 32 },
  filament: { full: 28, rm: 14 }
};

export const SHIPPED_EFFECT_IDS = [
  ...ORIGINAL_PRESHIP_IDS,
  "isograph",
  "sonar",
  "ledger",
  "weave",
  "orbit",
  "relay",
  "seal",
  "glyph",
  ...PHASE2_EFFECT_IDS
];

export const INTERACTIVE_EFFECTS = [
  "cascade",
  "mesh",
  "stack",
  "magnet",
  "signal",
  "chrono",
  "sonar",
  "weave",
  "ledger",
  "relay",
  "isograph",
  "orbit",
  "seal",
  "glyph",
  "hexpulse",
  "parcel",
  "hashwave",
  "branch",
  "beacon",
  "cellscan",
  "lattice",
  "filament"
];

export const EFFECTS_HARNESS_PREFIX = "scripts/effects-hero-harness";

const H = EFFECTS_HARNESS_PREFIX;

/** One hero slide per shipped effect — harness draw smoke (E7). */
export const EFFECT_DRAW_SLIDES = [
  { id: "shield", route: `${H}/index.html`, slideCount: 8, slideIndex: 0, effect: "shield" },
  { id: "cascade", route: `${H}/index.html`, slideCount: 8, slideIndex: 1, effect: "cascade" },
  { id: "orbit", route: `${H}/index.html`, slideCount: 8, slideIndex: 2, effect: "orbit" },
  { id: "hexpulse", route: `${H}/index.html`, slideCount: 8, slideIndex: 3, effect: "hexpulse" },
  { id: "magnet", route: `${H}/index.html`, slideCount: 8, slideIndex: 4, effect: "magnet" },
  { id: "telemetry", route: `${H}/index.html`, slideCount: 8, slideIndex: 5, effect: "telemetry" },
  { id: "chrono", route: `${H}/index.html`, slideCount: 8, slideIndex: 6, effect: "chrono" },
  { id: "beacon", route: `${H}/index.html`, slideCount: 8, slideIndex: 7, effect: "beacon" },
  { id: "filament", route: `${H}/about.html`, slideCount: 7, slideIndex: 0, effect: "filament" },
  { id: "lattice", route: `${H}/about.html`, slideCount: 7, slideIndex: 2, effect: "lattice" },
  { id: "constellation", route: `${H}/about.html`, slideCount: 7, slideIndex: 3, effect: "constellation" },
  { id: "seal", route: `${H}/about.html`, slideCount: 7, slideIndex: 4, effect: "seal" },
  { id: "relay", route: `${H}/about.html`, slideCount: 7, slideIndex: 6, effect: "relay" },
  { id: "topology", route: `${H}/business.html`, slideCount: 8, slideIndex: 0, effect: "topology" },
  { id: "cellscan", route: `${H}/business.html`, slideCount: 8, slideIndex: 2, effect: "cellscan" },
  { id: "signal", route: `${H}/business.html`, slideCount: 8, slideIndex: 3, effect: "signal" },
  { id: "branch", route: `${H}/business.html`, slideCount: 8, slideIndex: 4, effect: "branch" },
  { id: "hashwave", route: `${H}/business.html`, slideCount: 8, slideIndex: 6, effect: "hashwave" },
  { id: "parcel", route: `${H}/licensing.html`, slideCount: 6, slideIndex: 3, effect: "parcel" },
  { id: "ledger", route: `${H}/licensing.html`, slideCount: 6, slideIndex: 4, effect: "ledger" },
  { id: "checksum", route: `${H}/licensing.html`, slideCount: 6, slideIndex: 5, effect: "checksum" },
  { id: "pipeline", route: `${H}/solutions.html`, slideCount: 10, slideIndex: 1, effect: "pipeline" },
  { id: "isograph", route: `${H}/solutions.html`, slideCount: 10, slideIndex: 2, effect: "isograph" },
  { id: "trace", route: `${H}/solutions.html`, slideCount: 10, slideIndex: 4, effect: "trace" },
  { id: "sonar", route: `${H}/solutions.html`, slideCount: 10, slideIndex: 5, effect: "sonar" },
  { id: "mesh", route: `${H}/cortex.html`, slideCount: 10, slideIndex: 3, effect: "mesh" },
  { id: "stack", route: `${H}/cortex.html`, slideCount: 10, slideIndex: 6, effect: "stack" },
  { id: "ping", route: `${H}/cortex.html`, slideCount: 10, slideIndex: 9, effect: "ping" },
  { id: "pcb", route: `${H}/archive.html`, slideCount: 6, slideIndex: 0, effect: "pcb" },
  { id: "weave", route: `${H}/archive.html`, slideCount: 6, slideIndex: 1, effect: "weave" },
  { id: "flowchart", route: `${H}/archive.html`, slideCount: 6, slideIndex: 2, effect: "flowchart" },
  { id: "schematic", route: `${H}/archive.html`, slideCount: 6, slideIndex: 3, effect: "schematic" },
  { id: "vault", route: `${H}/archive.html`, slideCount: 6, slideIndex: 4, effect: "vault" },
  { id: "glyph", route: `${H}/archive.html`, slideCount: 6, slideIndex: 5, effect: "glyph" }
];

/** Scroll-sync / non-interactive effects — RM frozen-composition harness probes. */
export const SCROLL_STATIC_RM_SLIDES = [
  { id: "telemetry", route: `${H}/index.html`, slideCount: 8, slideIndex: 5, effect: "telemetry" },
  { id: "trace", route: `${H}/solutions.html`, slideCount: 10, slideIndex: 4, effect: "trace" },
  { id: "checksum", route: `${H}/licensing.html`, slideCount: 6, slideIndex: 5, effect: "checksum" }
];

export const WIRED_SLIDES = [
  { id: "cascade", route: `${H}/index.html`, slideCount: 8, slideIndex: 1, effect: "cascade" },
  { id: "mesh", route: `${H}/cortex.html`, slideCount: 10, slideIndex: 3, effect: "mesh" },
  { id: "stack", route: `${H}/cortex.html`, slideCount: 10, slideIndex: 6, effect: "stack" },
  { id: "magnet", route: `${H}/about.html`, slideCount: 7, slideIndex: 1, effect: "magnet" },
  { id: "signal", route: `${H}/business.html`, slideCount: 8, slideIndex: 3, effect: "signal" },
  { id: "chrono", route: `${H}/index.html`, slideCount: 8, slideIndex: 6, effect: "chrono" },
  { id: "sonar", route: `${H}/solutions.html`, slideCount: 10, slideIndex: 5, effect: "sonar" },
  { id: "weave", route: `${H}/archive.html`, slideCount: 6, slideIndex: 1, effect: "weave" },
  { id: "ledger", route: `${H}/licensing.html`, slideCount: 6, slideIndex: 4, effect: "ledger" },
  { id: "relay", route: `${H}/about.html`, slideCount: 7, slideIndex: 6, effect: "relay" },
  { id: "isograph", route: `${H}/solutions.html`, slideCount: 10, slideIndex: 2, effect: "isograph" },
  { id: "orbit", route: `${H}/about.html`, slideCount: 7, slideIndex: 5, effect: "orbit" },
  { id: "seal", route: `${H}/about.html`, slideCount: 7, slideIndex: 4, effect: "seal" },
  { id: "glyph", route: `${H}/archive.html`, slideCount: 6, slideIndex: 5, effect: "glyph" },
  { id: "hexpulse", route: `${H}/index.html`, slideCount: 8, slideIndex: 3, effect: "hexpulse" },
  { id: "parcel", route: `${H}/licensing.html`, slideCount: 6, slideIndex: 3, effect: "parcel" },
  { id: "hashwave", route: `${H}/business.html`, slideCount: 8, slideIndex: 6, effect: "hashwave" },
  { id: "branch", route: `${H}/licensing.html`, slideCount: 6, slideIndex: 1, effect: "branch" },
  { id: "beacon", route: `${H}/index.html`, slideCount: 8, slideIndex: 7, effect: "beacon" },
  { id: "cellscan", route: `${H}/business.html`, slideCount: 8, slideIndex: 2, effect: "cellscan" },
  { id: "lattice", route: `${H}/about.html`, slideCount: 7, slideIndex: 2, effect: "lattice" },
  { id: "filament", route: `${H}/about.html`, slideCount: 7, slideIndex: 0, effect: "filament" }
];

export const EFFECTS_GOAL_CONTRACT = {
  PREREQUISITE_DRAW_IDS,
  ORIGINAL_GOAL_IDS,
  GOAL_ENUMERATION_ROW_COUNT,
  ORIGINAL_PRESHIP_IDS,
  PHASE2_EFFECT_IDS,
  EFFECT_PARTICLE_CAPS,
  SHIPPED_EFFECT_IDS,
  INTERACTIVE_EFFECTS,
  EFFECTS_HARNESS_PREFIX,
  EFFECT_DRAW_SLIDES,
  SCROLL_STATIC_RM_SLIDES,
  WIRED_SLIDES
};