# Goal: Empty-Space Click Microinteractions

**Use this file as the orchestration brief.** Primary reference: [`ideas/slide-effects-research.md`](../ideas/slide-effects-research.md) §Microinteractions. Supporting docs: [`docs/effects-audit.md`](effects-audit.md), [`docs/slide-effects-rework-goal.md`](slide-effects-rework-goal.md).

**Scope:** Scroll-hero `AnimeEffectsField` canvas backgrounds on production routes (`index`, `about`, `business`, `licensing`, `solutions`, `cortex`). **Out of scope:** `/ideas/` pitch slideshow, hero copy changes, nav/HTML shell migrations, insert-cursor behavior changes.

---

## Goal statement

Add a centralized empty-space click pipeline on top of existing hover/proximity microinteractions: when a user clicks empty hero space (not nav, chips, links, or insert-cursor text), the active canvas effect fires a **unique themed** click response. All **34** `SHIPPED_EFFECT_IDS` get distinct handlers. Reduced motion suppresses all click feedback.

---

## Non-negotiables

- `createTimer` render loop + `animate()` state tweens in `assets/effects-anime.js`, OKLCH palette via `effectPalette()` / `colorAtHue()`; backgrounds stay subordinate to hero copy, Centralized click policy in `assets/effects-interaction.js` (`clickAllowed`, `isEmptyHeroClick`), no `elementFromPoint` in `effects-anime.js`, Click pulse pool: ≤4 concurrent, 200ms debounce; click tweens cancel + restore baselines on re-entry; no WebGL/particles.js, Do not regress hover microinteractions or insert-cursor text editing

---

## Goal success criteria (all must pass)

| # | Criterion | How to verify |
|---|-----------|---------------|
| G1 | `clickAllowed` + `isEmptyHeroClick` in `assets/effects-interaction.js` | Static import grep |
| G2 | `triggerClick` wired in `hero-core.js`; blocked UI/text clicks rejected | Harness + blocked-target probe |
| G3 | All **34** effect IDs have unique click handler in dispatch registry | `verify-revamp.py` registry gate |
| G4 | Click pulses respect caps; rapid clicks do not throw | Stress click in harness |
| G5 | Reduced motion: zero canvas delta on click | `test-effects-ids.mjs` RM block |
| G6 | Contract exports `CLICK_EFFECT_IDS`, `CLICK_WIRED_SLIDES` | `node scripts/export-effects-contract.mjs` |
| G7 | `docs/effects-audit.md` click contracts table (34 rows) | Doc review |
| G8 | `python scripts/verify-revamp.py` exit 0; click E2E OK | Full verify + `test-effects-ids.mjs` |

**Goal is DONE when G1-G8 all pass.**

---

## Per-effect click behaviors (34 unique)

| ID | Click response |
|----|----------------|
| `shield` | Shockwave ring from click; nearest spark orbit kick |
| `vault` | Padlock pulse + 2 lock-ring ripples at click |
| `seal` | Wax impression spike + ripple burst at click |
| `checksum` | 3 staggered verify ticks at click X on bar |
| `cascade` | Glitch burst in 1-2 columns near click X |
| `stack` | Ephemeral terminal line at nearest row; freeze 500ms |
| `glyph` | Nearest 3 fragments repel + glitch swap |
| `hashwave` | Horizontal brighten band sweeps from click column |
| `mesh` | Nearest node scale pop + link pulse to neighbors |
| `topology` | Hub spoke flash toward click angle; packet spawn |
| `constellation` | Nearest star twinkle + edge highlight |
| `cellscan` | Voronoi cell at click full-bloom pulse |
| `flowchart` | Packet spawns at nearest box, one edge cycle |
| `pipeline` | Sweep jumps to click X; stage pulse |
| `schematic` | Dimension tick + crosshair at click |
| `trace` | Nearest segment re-draws progress 0→1→0 (transient flash) |
| `branch` | Nearest fork node reveal bounce + edge brighten |
| `pcb` | Nearest via/trace intersection pulse |
| `hexpulse` | Clicked hex + neighbors center-out scale pop |
| `magnet` | Stream burst toward click (≤12 particles) |
| `signal` | Waveform spike at click X |
| `chrono` | Hand snaps to click angle 600ms then eases back |
| `ledger` | Column at click X brightens + counter surge |
| `telemetry` | Instrument ticks stagger-climb at click X |
| `ping` | Blip pop at click bearing |
| `sonar` | Echo ring from click origin |
| `beacon` | 3 staggered echo rings from click |
| `relay` | Baton teleports toward nearest station to click |
| `parcel` | New packet spawns at click, routes to station |
| `weave` | Thread kink ±12px at nearest midpoint |
| `filament` | Thread detours through click knot briefly |
| `isograph` | Highlight cell snaps to click grid cell |
| `lattice` | Layer shear impulse from click |
| `orbit` | Nearest body radius kick + glow flare |

---

## Turn slices

| Slice | Scope | Done when |
|-------|-------|-----------|
| **S0** | This goal doc | Orchestrator lists 34 click behaviors |
| **S1** | Policy + `triggerClick` + hero-core listener | Empty click fires pulse stub |
| **S2A** | Handlers: original 15 (`shield`→`schematic`) | Archive harness click OK |
| **S2B** | Handlers: `isograph`, `sonar`, `ledger`, `weave`, `orbit`, `relay`, `seal`, `glyph` | 8 ids click OK |
| **S2C** | Handlers: 11 Phase 2 ids | 11 ids click OK |
| **S3** | Contract + E2E + verify gates | G5, G6 partial |
| **S4** | Audit doc + full verify | G1-G8 pass |

---

## Risk gates

| Gate | Condition | Action |
|------|-----------|--------|
| R1 | Click on nav/chip/link fires canvas FX | Tighten `isBlockedClickTarget` |
| R2 | Click on hero text fires background + insert | `isInsertTextTarget` exclusion |
| R3 | Rapid clicks tank fps | Cooldown + pulse cap |
| R4 | Parallel merge conflicts on `effects-anime.js` | Orchestrator serializes |
| R5 | Canvas illegible on click | Lower pulse alpha |

---

## Per-slice verification

**Fast probes (≈2 min)**, run before full smoke:

```bash
node scripts/test-click-registry.mjs .verify-scratch
node scripts/test-click-draw-static.mjs .verify-scratch
node scripts/test-click-production.mjs .verify-scratch http://127.0.0.1:8765
node scripts/test-click-transient.mjs .verify-scratch http://127.0.0.1:8765
node scripts/test-click-probes.mjs .verify-scratch http://127.0.0.1:8765
```

**Full gate** (~15 min smoke + static):

```bash
node scripts/export-effects-contract.mjs
node scripts/test-effects-ids.mjs .verify-scratch http://127.0.0.1:8765
python scripts/verify-revamp.py .verify-scratch http://127.0.0.1:8765
rg "clickAllowed|triggerClick|_dispatchClick|clickSegFlash" assets/
```

**Scratch artifacts** (written by verify + probes):

| File | Source |
|------|--------|
| `click-policy.log` | `verify-revamp.py` static click gate |
| `click-draw-static.log` | `test-click-draw-static.mjs` |
| `click-production.log` | `test-click-production.mjs` (index, about, business, solutions + filament decay) |
| `click-transient.log` | `test-click-transient.mjs` (trace `clickSegFlash` + filament knot decay) |
| `test-effects-ids.log` | Full stdout from `test-effects-ids.mjs` |
| `effects-smoke.log` | Structured gating lines from smoke |

---

## Turn checklist

```
[x] Slice 0, Goal doc
[x] Slice 1, Click infrastructure
[x] Slice 2A, Original 15 handlers
[x] Slice 2B, Phase 1 handlers
[x] Slice 2C, Phase 2 handlers
[x] Slice 3, Contract + E2E + verify gates
[x] Slice 4, Audit + full verify
[x] GOAL COMPLETE, G1-G8 pass
```

---

## Grok Goal Mode entry prompt

```
Goal: Empty-Space Click Microinteractions

Use docs/click-microinteractions-goal.md as the orchestration brief.

Objective: Add centralized empty-space click pipeline to AnimeEffectsField with a
unique themed canvas click response for each of the 34 SHIPPED_EFFECT_IDS.

Constraints:, Scroll-hero routes only; preserve anime.js v4 createTimer + _draw architecture, All hit-testing via effects-interaction.js, Reduced motion = no click response, Do not regress hover or insert-cursor

Verify: node scripts/test-effects-ids.mjs && python scripts/verify-revamp.py .verify-scratch
```