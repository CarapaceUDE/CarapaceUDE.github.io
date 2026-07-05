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

export const SHIPPED_EFFECT_IDS = [
  ...ORIGINAL_PRESHIP_IDS,
  "isograph",
  "sonar",
  "ledger",
  "weave",
  "orbit",
  "relay",
  "seal",
  "glyph"
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
  "glyph"
];

/** One hero slide per shipped effect — route-based draw smoke via hero-core (E7). */
export const EFFECT_DRAW_SLIDES = [
  { id: "shield", route: "index.html", slideCount: 8, slideIndex: 0, effect: "shield" },
  { id: "cascade", route: `index.html`, slideCount: 8, slideIndex: 1, effect: "cascade" },
  { id: "orbit", route: `index.html`, slideCount: 8, slideIndex: 2, effect: "orbit" },
  { id: "pcb", route: `index.html`, slideCount: 8, slideIndex: 3, effect: "pcb" },
  { id: "magnet", route: `index.html`, slideCount: 8, slideIndex: 4, effect: "magnet" },
  { id: "ledger", route: `index.html`, slideCount: 8, slideIndex: 5, effect: "ledger" },
  { id: "chrono", route: `index.html`, slideCount: 8, slideIndex: 6, effect: "chrono" },
  { id: "sonar", route: `index.html`, slideCount: 8, slideIndex: 7, effect: "sonar" },
  { id: "weave", route: `about.html`, slideCount: 7, slideIndex: 0, effect: "weave" },
  { id: "isograph", route: `about.html`, slideCount: 7, slideIndex: 2, effect: "isograph" },
  { id: "constellation", route: `about.html`, slideCount: 7, slideIndex: 3, effect: "constellation" },
  { id: "seal", route: `about.html`, slideCount: 7, slideIndex: 4, effect: "seal" },
  { id: "relay", route: `about.html`, slideCount: 7, slideIndex: 6, effect: "relay" },
  { id: "topology", route: `business.html`, slideCount: 8, slideIndex: 0, effect: "topology" },
  { id: "mesh", route: `business.html`, slideCount: 8, slideIndex: 2, effect: "mesh" },
  { id: "signal", route: `business.html`, slideCount: 8, slideIndex: 3, effect: "signal" },
  { id: "flowchart", route: `business.html`, slideCount: 8, slideIndex: 4, effect: "flowchart" },
  { id: "glyph", route: `business.html`, slideCount: 8, slideIndex: 6, effect: "glyph" },
  { id: "pipeline", route: `solutions.html`, slideCount: 10, slideIndex: 1, effect: "pipeline" },
  { id: "schematic", route: `solutions.html`, slideCount: 10, slideIndex: 4, effect: "schematic" },
  { id: "vault", route: `cortex.html`, slideCount: 10, slideIndex: 5, effect: "vault" },
  { id: "stack", route: `cortex.html`, slideCount: 10, slideIndex: 6, effect: "stack" },
  { id: "ping", route: `cortex.html`, slideCount: 10, slideIndex: 9, effect: "ping" }
];

export const WIRED_SLIDES = [
  { id: "cascade", route: `index.html`, slideCount: 8, slideIndex: 1, effect: "cascade" },
  { id: "mesh", route: `business.html`, slideCount: 8, slideIndex: 2, effect: "mesh" },
  { id: "stack", route: `cortex.html`, slideCount: 10, slideIndex: 6, effect: "stack" },
  { id: "magnet", route: `about.html`, slideCount: 7, slideIndex: 1, effect: "magnet" },
  { id: "signal", route: `business.html`, slideCount: 8, slideIndex: 3, effect: "signal" },
  { id: "chrono", route: `index.html`, slideCount: 8, slideIndex: 6, effect: "chrono" },
  { id: "sonar", route: `index.html`, slideCount: 8, slideIndex: 7, effect: "sonar" },
  { id: "weave", route: `about.html`, slideCount: 7, slideIndex: 0, effect: "weave" },
  { id: "ledger", route: `index.html`, slideCount: 8, slideIndex: 5, effect: "ledger" },
  { id: "relay", route: `about.html`, slideCount: 7, slideIndex: 6, effect: "relay" },
  { id: "isograph", route: `business.html`, slideCount: 8, slideIndex: 1, effect: "isograph" },
  { id: "orbit", route: `about.html`, slideCount: 7, slideIndex: 5, effect: "orbit" },
  { id: "seal", route: `about.html`, slideCount: 7, slideIndex: 4, effect: "seal" },
  { id: "glyph", route: `business.html`, slideCount: 8, slideIndex: 6, effect: "glyph" }
];

export const EFFECTS_GOAL_CONTRACT = {
  PREREQUISITE_DRAW_IDS,
  ORIGINAL_GOAL_IDS,
  GOAL_ENUMERATION_ROW_COUNT,
  ORIGINAL_PRESHIP_IDS,
  SHIPPED_EFFECT_IDS,
  INTERACTIVE_EFFECTS,
  EFFECT_DRAW_SLIDES,
  WIRED_SLIDES
};
