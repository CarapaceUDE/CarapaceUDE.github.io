# Hero Background Effects, Replacement Plan

_Last updated: 2026-07-05_

Implements findings from `docs/effects-audit.md`. No slide copy changes.

## Assumed scope (41 manifest paths)

Goal patch and classifier evidence are limited to `scripts/goal-effects-scope.txt` (41 manifest paths; includes `scripts/effects-hero-harness/*.html` for smoke/capture; production route HTML shells are unchanged).

## New effect IDs (8)

| ID | Metaphor | OKLCH tint | Hover (`setInteraction`) | Scroll / mix | Reduced motion | Target slides |
|----|----------|------------|--------------------------|--------------|----------------|---------------|
| `isograph` | Isometric diamond grid + wandering highlight cell | `colorAtHue(h, α, 0.11, 0.4)` on cell fill | Highlight cell snaps toward pointer column | - | Static highlight, no cell hop | business 2, solutions 3 |
| `sonar` | Arc wedge sweep + echo ring returns | Echo rings at hue+15 | Echoes spawn on pointer bearing | - | Slower sweep, no echoes | home 8, solutions 10 |
| `ledger` | Vertical tick columns + running totals | Ticks at `_pc`; totals at hue 145 | Column under pointer brightens; counter accelerates | - | Frozen counters | home 6, business 8, licensing 5 |
| `weave` | Interlaced H/V threads with lift | Thread stroke `_lc` | Threads near pointer separate (proximity lift) | - | No lift offset | about 1, solutions 7 |
| `orbit` | Kepler ellipses + focal nodes | Orbit path `_pc(0.25)`; nodes `_pc(0.6)` | Nearest node glows; body speeds up | - | Static ellipses | home 3, about 6 |
| `relay` | Station handoff baton | Stations `_glow`; baton accent hue 45 | Baton jumps toward pointer-near station | - | Single slow baton | about 7, business 6, licensing 4, solutions 4 |
| `seal` | Wax-ring impression + ripple | Ring `_pc(0.5)`; ripple `_lc` | Impression deepens at pointer | - | Static ring | about 5, licensing 6 |
| `glyph` | Drifting hash fragments (not vertical rain) | Mono fragments `_pc` | Fragments glitch within 100px of pointer | - | Fewer fragments, no glitch | business 7, cortex 9 |

Particle caps: each new effect ≤40 drawables under `reducedMotion`; ≤80 full-screen at full motion (E12). `isograph` uses 8×5 (40) / 10×8 (80).

## Retire / merge decisions

**Effect IDs retired:** none, all 15 prerequisite draw IDs remain implemented.

**Effect IDs merged:** none, no ID consolidation.

Per-ID decisions (E4). Retirements apply to *slide assignments* only when noted. Full table: `docs/effects-audit.md` §ID retire / merge decisions.

| ID | Retire effect ID? | Merge into | ID fate | Assignment change (pre → post) |
|----|-------------------|------------|---------|--------------------------------|
| `shield` | no | - | **keep** | 3 → 3 |
| `cascade` | no | - | **keep** | 1 → 1 |
| `mesh` | no | - | **keep** | 7 → 4 |
| `stack` | no | - | **keep** | 0 → 1 (cortex 7) |
| `magnet` | no | - | **keep** | 2 → 2 |
| `signal` | no | - | **keep** | 2 → 2 |
| `chrono` | no | - | **keep** | 1 → 1 |
| `ping` | no | - | **keep** | 1 → 1 |
| `flowchart` | no | - | **keep** | 8 → 2 |
| `pcb` | no | - | **keep** | 2 → 2 |
| `topology` | no | - | **keep** | 7 → 3 |
| `pipeline` | no | - | **keep** | 9 → 2 |
| `constellation` | no | - | **keep** | 2 → 1 |
| `vault` | no | - | **keep** | 1 → 1 |
| `schematic` | no | - | **keep** | 2 → 2 |
| `isograph` | no | - | **add** | 0 → 3 |
| `sonar` | no | - | **add** | 0 → 3 |
| `ledger` | no | - | **add** | 0 → 3 |
| `weave` | no | - | **add** | 0 → 2 |
| `orbit` | no | - | **add** | 0 → 2 |
| `relay` | no | - | **add** | 0 → 5 |
| `seal` | no | - | **add** | 0 → 2 |
| `glyph` | no | - | **add** | 0 → 2 |

**Plan deviations (documented in scope):**
- `assets/effects-interaction.js`, centralized hover/RM policy module
- `assets/effects-goal-contract.js`, single source of truth for IDs, wired slides, interactivity
- `scripts/stage-effects-goal.mjs`, `scripts/export-effects-contract.mjs`, scoped patch + contract export

## Per-route reassignment

### home (8)

| # | Title | Old | New |
|---|-------|-----|-----|
| 1 | Own Your Intelligence | shield | shield |
| 2 | 60% of Team Time | cascade | cascade |
| 3 | Let Humans Do Human Work | topology | **orbit** |
| 4 | Private AI Infrastructure | pcb | pcb |
| 5 | Replace SaaS Waste | magnet | magnet |
| 6 | 3.7× Average ROI | signal | **ledger** |
| 7 | 5-7+ Hours Back | chrono | chrono |
| 8 | Start Small. Prove Value. | ping | **sonar** |

### about (7)

| # | Title | Old | New |
|---|-------|-----|-----|
| 1 | Builders First | mesh | **weave** |
| 2 | Leverage Not Replacement | magnet | magnet |
| 3 | Four Durable Principles | flowchart | **isograph** |
| 4 | Six Intelligence Layers | constellation | constellation |
| 5 | Intelligence Sovereignty | vault | **seal** |
| 6 | Co-Founders | constellation | **orbit** |
| 7 | Carapace → Cortex | pipeline | **relay** |

### business (8)

| # | Title | Old | New |
|---|-------|-----|-----|
| 1 | Your Private AI Team | topology | topology |
| 2 | Scope Connect Build | flowchart | **isograph** |
| 3 | Teams That Need Leverage | topology | mesh |
| 4 | Evidence Over Theater | mesh | signal |
| 5 | Consult Pilot Package | flowchart | flowchart |
| 6 | Discover Deploy Expand | flowchart | **relay** |
| 7 | Not One Tool | pipeline | **glyph** |
| 8 | $12K → $24K+ | pipeline | **ledger** |

### licensing (6)

| # | Title | Old | New |
|---|-------|-----|-----|
| 1 | Clarity Not Mystery | shield | shield |
| 2 | Free For Personal Use | flowchart | flowchart |
| 3 | Under $100K Revenue | topology | topology |
| 4 | Live Operations Path | pipeline | **relay** |
| 5 | Optional Retainer | pipeline | **ledger** |
| 6 | Inspectable Boundaries | vault | **seal** |

### solutions (10)

| # | Title | Old | New |
|---|-------|-----|-----|
| 1 | How Work Gets Routable | topology | topology |
| 2 | Discover Deploy Expand | pipeline | pipeline |
| 3 | Keep Leads From Slipping | flowchart | **isograph** |
| 4 | Faster Client Response | pipeline | **relay** |
| 5 | Governed Handoffs | flowchart | schematic |
| 6 | Less Manual Assembly | topology | **sonar** |
| 7 | Context That Compounds | mesh | **weave** |
| 8 | Reduce Admin Drag | pipeline | pipeline |
| 9 | Common First Wins | mesh | mesh |
| 10 | Start With One Wedge | ping | **sonar** |

### cortex (10)

| # | Title | Old | New |
|---|-------|-----|-----|
| 1 | Private Control Plane | shield | shield |
| 2 | Capture Route Execute | schematic | schematic |
| 3 | Context Management | pcb | pcb |
| 4 | Intent Routing | mesh | mesh |
| 5 | Model Independence | signal | signal |
| 6 | Custody & Governance | vault | vault |
| 7 | Fling Capture | pcb | **stack** |
| 8 | Signal To Work | topology | **relay** |
| 9 | Why Not Another Chatbot | flowchart | **glyph** |
| 10 | Download Or Deploy | ping | ping |

## Interaction expansion (`INTERACTIVE_EFFECTS`)

Target ≥8 (shipped **14**, every new ID with hover draw code is wired in `hero-core.js`):

```
cascade, mesh, stack, magnet, signal, chrono, sonar, weave, ledger, relay,
isograph, orbit, seal, glyph
```

| Effect | Interaction contract |
|--------|---------------------|
| `cascade` | Glitch columns within 120px of pointer |
| `mesh` | Link wobble + node shake via `_proximity` |
| `stack` | Row freeze + glitch by Y proximity |
| `magnet` | Streams bias pull target toward pointer |
| `signal` | Spike amplitude boost at pointer X |
| `chrono` | Hand eases toward pointer angle |
| `sonar` | Echo blips on pointer bearing |
| `weave` | Thread lift/separation near pointer |
| `ledger` | Column highlight + counter speed |
| `relay` | Baton accelerates to pointer-near station |
| `isograph` | Highlight cell snaps toward pointer column |
| `orbit` | Nearest body glow + radius via `_proximity` |
| `seal` | Ring impression depth via `_proximity` |
| `glyph` | Fragment glitch within 100px of pointer |

Reduced motion: `hero-core.js` sets `bgInteractive = false` when `prefers-reduced-motion: reduce`; canvas still paints, hover branches gated via `effects-interaction.js`.

## CSS grid variants

Add `[data-effect]` rules in `hero-home.css` for: `isograph`, `sonar`, `ledger`, `weave`, `orbit`, `relay`, `seal`, `glyph`, distinct `background-size` / opacity per DESIGN.md atmosphere grid.

## Phase 2, cluster rebalance (2026-07-05)

Eleven new effect IDs: `hexpulse`, `parcel`, `hashwave`, `branch`, `telemetry`, `trace`, `checksum`, `cellscan`, `beacon`, `lattice`, `filament`.

Cluster caps after reassignment: `relay` ≤3, node-graph (`mesh`/`topology`/`constellation`) ≤5, flow-diagram (`flowchart`/`pipeline`/`schematic`) ≤4, zero adjacent duplicate pairs per route.

### Phase 2 per-route reassignment

| Route | # | Title (unchanged) | Old | New |
|-------|---|-------------------|-----|-----|
| home | 4 | Private AI Infrastructure | pcb | **hexpulse** |
| home | 6 | 3.7× Average ROI | ledger | **telemetry** |
| home | 8 | Start Small. Prove Value. | sonar | **beacon** |
| about | 1 | Builders First | weave | **filament** |
| about | 3 | Four Durable Principles | isograph | **lattice** |
| business | 2 | Scope Connect Build | isograph | **lattice** |
| business | 3 | Teams That Need Leverage | mesh | **cellscan** |
| business | 5 | Consult Pilot Package | flowchart | **branch** |
| business | 7 | Not One Tool | glyph | **hashwave** |
| business | 8 | $12K → $24K+ | ledger | **telemetry** |
| licensing | 2 | Free For Personal Use | flowchart | **branch** |
| licensing | 4 | Live Operations Path | relay | **parcel** |
| licensing | 6 | Inspectable Boundaries | seal | **checksum** |
| solutions | 4 | Faster Client Response | relay | **parcel** |
| solutions | 5 | Governed Handoffs | schematic | **trace** |
| solutions | 7 | Context That Compounds | weave | **filament** |
| solutions | 9 | Common First Wins | mesh | **cellscan** |
| solutions | 10 | Start With One Wedge | sonar | **beacon** |
| cortex | 2 | Capture Route Execute | schematic | **trace** |
| cortex | 3 | Context Management | pcb | **hexpulse** |
| cortex | 6 | Custody & Governance | vault | **checksum** |
| cortex | 9 | Why Not Another Chatbot | glyph | **hashwave** |

**Relay retention (3):** about 7, business 6, cortex 8. Licensing 4 and solutions 4 → `parcel`.

Legacy IDs (`pcb`, `weave`, `flowchart`, `schematic`, `vault`, `glyph`) remain implemented; draw smoke via `scripts/effects-hero-harness/archive.html`.

### Phase 2 `INTERACTIVE_EFFECTS` additions

`hexpulse`, `parcel`, `hashwave`, `branch`, `beacon`, `cellscan`, `lattice`, `filament` (22 total). Scroll-sync: `trace`, `checksum` via `setScrollFrac`, not pointer-interactive.

## Checklist

- [x] New IDs in `effects-anime.js`
- [x] `test-effects-ids.mjs` extended
- [x] Hero files reassigned
- [x] `INTERACTIVE_EFFECTS` ≥8
- [x] `verify-revamp.py` gates pass
- [x] Playwright captures non-blank
- [x] Phase 2 cluster rebalance + 11 new IDs