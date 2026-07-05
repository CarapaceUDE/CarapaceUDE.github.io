# Hero Background Effects — Audit

_Last updated: 2026-07-05 (shipped)_

Canonical implementation: `assets/effects-anime.js`, `assets/hero-core.js`, `assets/hero-{page}.js`.

## Architecture summary

- `initScrollHero()` maps scroll progress → discrete slide index; when `frac > 0.3`, crossfades effects via `smoothstep(0.3, 0.96, frac)`.
- `AnimeEffectsField` pipeline: `ensureEffect(id)` → `_createState` + `_bootLoops` → `_draw()` → `_drawEffect(id, state, alpha)`.
- Pointer path: `mousemove` → `setPointerNorm` + `setInteraction(px, py, bgInteractive)` where `bgInteractive = heroPinned && INTERACTIVE_EFFECTS.includes(effect)`.
- Canvas hover policy: `assets/effects-interaction.js` (`hoverAllowed`, `proximity`, …) via `_proximity` / `_hoverAllowed` wrappers.
- Scroll frac: `effectsField.setScrollFrac(frac)` — schematic scan line reads `scrollFrac ?? state.scan`.
- `atmosphere.dataset.effect` syncs CSS grid variants via `onMixChange`.

---

## §Original 16 goal enumeration

Verification plan step 1 lists **16 goal slots**: the 15 named draw IDs below (`PREREQUISITE_DRAW_IDS` in `assets/effects-goal-contract.js`) plus row 16 documenting **`stack` assignment debt** (interactive ID, 0 slide slots pre-ship → cortex slide 7 post-ship). Every named ID also appears in §Inventory with loops, hover, and particle caps.

| # | ID | Visual metaphor | Pre-ship hover | Pre-ship slides | Post-ship slides |
|---|-----|-----------------|----------------|-----------------|------------------|
| 1 | `shield` | Concentric security ellipses + sparks | parallax | 3 | 3 |
| 2 | `cascade` | Vertical matrix glyph rain | **interactive** | 1 | 1 |
| 3 | `mesh` | Force-directed node graph | **interactive** | 7 | 4 |
| 4 | `stack` | Terminal log marquee | **interactive** | **0** | 1 |
| 5 | `magnet` | Central attractor streams | parallax → enhanced | 2 | 2 |
| 6 | `signal` | ROI waveform | parallax → enhanced | 2 | 2 |
| 7 | `chrono` | Analog clock hand | parallax → enhanced | 1 | 1 |
| 8 | `ping` | Radar sweep + rings | parallax | 1 | 1 |
| 9 | `flowchart` | Box-and-arrow diagram | parallax | 8 | 2 |
| 10 | `pcb` | Orthogonal trace grid | parallax | 2 | 2 |
| 11 | `topology` | Hub-and-spoke star | parallax | 7 | 3 |
| 12 | `pipeline` | Linear stage sweep | parallax | 9 | 2 |
| 13 | `constellation` | Polygon node map | parallax | 2 | 1 |
| 14 | `vault` | Lock rings + padlock | parallax | 1 | 1 |
| 15 | `schematic` | Blueprint blocks + scan | scroll | 2 | 2 |
| 16 | `stack-assignment-debt` | `stack` was interactive but unassigned (0×) | **interactive** | 0 | resolved → cortex 7 |

**Pre-ship `INTERACTIVE_EFFECTS` (3):** `cascade`, `mesh`, `stack`.

---

## §ID retire / merge decisions (E4)

**Effect IDs retired:** none — every prerequisite draw ID remains in `effects-anime.js`.

**Effect IDs merged:** none — no two IDs collapsed into one implementation.

| ID | Retire effect ID? | Merge into | ID fate | Assignment change (pre → post) |
|----|-------------------|------------|---------|--------------------------------|
| `shield` | no | — | **keep** | 3 → 3 |
| `cascade` | no | — | **keep** | 1 → 1 |
| `mesh` | no | — | **keep** | 7 → 4 |
| `stack` | no | — | **keep** | 0 → 1 (cortex 7) |
| `magnet` | no | — | **keep** | 2 → 2 |
| `signal` | no | — | **keep** | 2 → 2 |
| `chrono` | no | — | **keep** | 1 → 1 |
| `ping` | no | — | **keep** | 1 → 1 |
| `flowchart` | no | — | **keep** | 8 → 2 |
| `pcb` | no | — | **keep** | 2 → 2 |
| `topology` | no | — | **keep** | 7 → 3 |
| `pipeline` | no | — | **keep** | 9 → 2 |
| `constellation` | no | — | **keep** | 2 → 1 |
| `vault` | no | — | **keep** | 1 → 1 |
| `schematic` | no | — | **keep** | 2 → 2 |
| `isograph` | no | — | **add** | 0 → 3 |
| `sonar` | no | — | **add** | 0 → 3 |
| `ledger` | no | — | **add** | 0 → 3 |
| `weave` | no | — | **add** | 0 → 2 |
| `orbit` | no | — | **add** | 0 → 2 |
| `relay` | no | — | **add** | 0 → 5 |
| `seal` | no | — | **add** | 0 → 2 |
| `glyph` | no | — | **add** | 0 → 2 |

**Assignment-level retirements** (slide slots only — effect IDs above stay in code):

| Retired assignment pattern | Was (slides) | Shipped (slides) | Replacement IDs used on those slots |
|----------------------------|--------------|------------------|-------------------------------------|
| `pipeline` overuse | 9 | 2 | `relay`, `ledger`, `glyph`, `isograph`, `sonar`, `weave`, `orbit`, `seal` |
| `flowchart` overuse | 8 | 2 | `isograph`, `relay`, `glyph`, `seal` |
| `topology` overuse | 7 | 3 | `orbit`, `weave`, `mesh`, `isograph`, `relay` |
| `mesh` overuse | 7 | 4 | `weave`, `isograph`, `signal`, `relay` |
| Adjacent duplicate slots | 3 pairs | 0 | `relay`, `ledger`, `glyph`, `orbit` |
| `stack` unassigned | 0 | 1 | `stack` on cortex slide 7 |

**Add (8 new IDs):** `isograph`, `sonar`, `ledger`, `weave`, `orbit`, `relay`, `seal`, `glyph`.

**Supporting module (plan deviation):** `assets/effects-interaction.js` — centralized `hoverAllowed` / `proximity` policy extracted from `effects-anime.js` draw paths; listed in `scripts/goal-effects-scope.txt`.

## §Replacement candidates (prioritized — shipped)

| Priority | Issue | Candidate action | Shipped resolution |
|----------|-------|------------------|-------------------|
| P0 | business 5–6 both `flowchart` | Replace slide 6 | slide 6 → `relay` |
| P0 | licensing 4–5 both `pipeline` | Replace slide 5 | slides 4–5 → `relay`, `ledger` |
| P0 | about 5–6 both `constellation` | Replace slide 6 | slide 6 → `orbit` |
| P1 | `pipeline` ×9 site-wide | Cut to ≤4; diversify | 2 slides remain |
| P1 | `flowchart` ×8 | Cut to ≤4; diversify | 2 slides remain |
| P1 | `topology` ×7 | Cut to ≤4; add `orbit`/`weave` | 3 slides remain |
| P2 | node-graph cluster (mesh/topology/constellation) | Add `weave`, `orbit`; reduce mesh | 8 cluster slides → 4 distinct IDs |
| P2 | flow-diagram cluster | Add `relay`, `isograph`; keep schematic | 6 cluster slides → 5 distinct IDs |
| P2 | security-ring cluster | Add `seal`; keep shield/vault distinct | 5 slides, 3 IDs |
| P3 | `stack` zero use | Assign terminal metaphor slide | cortex slide 7 |
| P3 | Only 3 interactive effects | Expand to ≥8 | **14** in `INTERACTIVE_EFFECTS` |

---

## §Inventory — 34 effect IDs (shipped)

| ID | Visual metaphor | Animation loops | Hover / scroll | Particle cap | Similarity score* | Cluster |
|----|-----------------|-----------------|----------------|--------------|-------------------|---------|
| `shield` | Concentric security ellipses + orbiting sparks | Ring `rot`/`pulse`; spark `a` orbit | `_pointerOffset` parallax only | 24–52 sparks | 2 vs vault | security-ring |
| `cascade` | Vertical matrix glyph rain | Column `y` fall; `_updateCascade` glitch bursts | **Interactive:** glitch chars within 120px of pointer | cols × 6–12 | 1 vs glyph | typographic |
| `mesh` | Force-directed node graph + link packets | Node `scale`; link `t` packet | **Interactive:** `_proximity` link wobble, node shake/glow | 24 nodes | 2 vs topology | node-graph |
| `stack` | Scrolling terminal log lines | Row `x` marquee; `counter` tick | **Interactive:** row freeze + `_glitchString` by Y proximity | 10 rows | 1 vs cascade | typographic |
| `magnet` | Central attractor + particle streams | Core `pulse`; stream pull-to-center | **Interactive:** pull target follows pointer; stream glow via `_proximity` | ~68 streams | — | field |
| `signal` | ROI waveform + climbing trend | `phase`, `climb`, `glow` | **Interactive:** spike amplitude ×1.6 near pointer X (±10% width) | 14 samples | 1 vs ledger | metric |
| `chrono` | Analog clock face + hand | `hand` rotation; `glow` pulse | **Interactive:** hand angle tracks pointer (disabled when `reducedMotion`) | 1 hand | 1 vs signal | metric |
| `ping` | Radar radial sweep lines + expanding rings | `sweep`; ring `r`; blip pop | `_pointerOffset` only | 12 blips | 2 vs sonar | radar |
| `flowchart` | Box-and-arrow diagram + edge packets | Packet `t` along edges | `_pointerOffset` only | 4 boxes | 2 vs isograph | flow-diagram |
| `pcb` | Orthogonal trace grid + via pulses | Trace `pulse`; `gridPulse` | `_pointerOffset` only | ~35 traces | — | circuit |
| `topology` | Hub-and-spoke star + radial packets | Hub/node `pulse`; `packet` along spokes | `_pointerOffset` only | 8 spokes | 2 vs mesh | node-graph |
| `pipeline` | Linear stage nodes + active sweep | `sweep`; stage `pulse` | `_pointerOffset` only | 5 stages | 2 vs relay | flow-diagram |
| `constellation` | Polygon node map + link glow | `glow`; node `pulse` | `_pointerOffset` only | 6 nodes | 2 vs topology | node-graph |
| `vault` | Lock rings + padlock glyph + sparks | Ring `rot`/`pulse`; lock `pulse`; spark orbit | `_pointerOffset` only | 24–52 sparks | 2 vs shield | security-ring |
| `schematic` | Blueprint grid + blocks + dimension ticks + scan line | `gridPulse`; `scan`; dim `t` | **Scroll:** scan Y = `scrollFrac ?? state.scan` | 3 blocks | 2 vs flowchart | flow-diagram |
| `isograph` | Isometric diamond grid + highlight cell | Highlight `pulse`; cell hop timer | **Interactive:** highlight cell snaps toward pointer column | 8×5 RM / 10×8 FM | 3 vs flowchart | isometric-grid |
| `sonar` | Arc wedge sweep + echo ring returns | `sweep`; echo `r`/`alpha` pop | **Interactive:** echo blip on pointer bearing when hover | 4–8 echoes | 3 vs ping | radar |
| `ledger` | Vertical tick columns + running Σ total | `sweep` column highlight; `counter` tick; col `pulse` | **Interactive:** column brightens via `_proximity`; counter speed ×2.2 | 16 columns | 3 vs signal | metric |
| `weave` | Interlaced H/V threads | Thread `offset` drift | **Interactive:** thread lift ±8px near pointer (`reducedMotion` → 0) | 14–22 per axis | 3 vs mesh | fabric |
| `orbit` | Kepler ellipses + dual focal nodes | Body `a` orbit; `glow` pulse | **Interactive:** nearest body glow + radius boost via `_proximity` | 3 bodies | 3 vs topology | orbital |
| `relay` | Station nodes + handoff baton | `baton.t` handoff loop; station `pulse` | **Interactive:** baton eases toward pointer-nearest station; speed ×1.8 | 6 stations | 3 vs pipeline | handoff |
| `seal` | Wax-ring impression + ripple + label | Ring `pulse`; `rot`; ripple `alpha` | **Interactive:** impression depth via `_proximity(ox, oy, 200)` | 4 ripples | 2 vs vault | security-ring |
| `glyph` | Drifting mono hash fragments | Fragment `x`/`y` drift | **Interactive:** glitch char swap within 100px of pointer | 18–36 fragments | 2 vs cascade | typographic |
| `hexpulse` | Hex control-plane lattice pulse | Center-out `stagger` on cell `alpha`/`scale` | **Interactive:** `_proximity` cell brighten | 40–80 cells | 2 vs pcb | circuit |
| `parcel` | L-path data packets between stations | `animate({ t })` piecewise path | **Interactive:** nearest packet speed boost | ≤24 packets | 2 vs relay | handoff |
| `hashwave` | Mono glyph grid horizontal brighten band | `stagger` axis-x + scramble | **Interactive:** glyph scramble near pointer | 40–80 glyphs | 2 vs glyph | typographic |
| `branch` | Binary decision fork node reveal | Timeline `stagger` on `reveal` | **Interactive:** parallax via `_pointerOffset` | 6 nodes | 2 vs flowchart | flow-diagram |
| `telemetry` | Instrument strip micro-ticks | Timeline stagger on tick `h` | none (metric read) | 10 ticks | 2 vs ledger | metric |
| `trace` | Orthogonal route self-draw | Segment `progress`; packet loop | **Scroll:** `setScrollFrac` drives draw length | 6 segments | 2 vs schematic | flow-diagram |
| `checksum` | Verify bar + tick marks | `progress` + staggered marks | **Scroll:** `setScrollFrac` fills bar | 14 marks | 2 vs seal | security-ring |
| `cellscan` | Voronoi partition sparse edges | `scan` sweep; pointer cell bloom | **Interactive:** nearest-site highlight | ≤16 sites | 2 vs mesh | node-graph |
| `beacon` | Fixed anchors + echo rings | Ring `r`/`alpha` stagger | **Interactive:** `_proximity` on anchors | 3 anchors | 2 vs sonar | radar |
| `lattice` | Depth-layered perspective grid | Layer `offset` parallax | **Interactive:** `_pointerOffset` shear | 3 layers | 2 vs isograph | isometric-grid |
| `filament` | Single luminous thread on grid | Motion-path `t` on knot path | **Interactive:** parallax offset | 6 knots | 2 vs weave | fabric |

\*Similarity score 0–3 within nearest cluster peer (0 = distinct, 3 = near-clone).

**Shipped `INTERACTIVE_EFFECTS` (22):** `cascade`, `mesh`, `stack`, `magnet`, `signal`, `chrono`, `sonar`, `weave`, `ledger`, `relay`, `isograph`, `orbit`, `seal`, `glyph`, `hexpulse`, `parcel`, `hashwave`, `branch`, `beacon`, `cellscan`, `lattice`, `filament`.

**Archive-only draw smoke (6):** `pcb`, `weave`, `flowchart`, `schematic`, `vault`, `glyph` — `scripts/effects-hero-harness/archive.html`.

---

## §Interaction contracts (E6)

| ID | Trigger | Behavior on hover | Reduced-motion fallback |
|----|---------|-------------------|-------------------------|
| `cascade` | `setInteraction` + `hover:true` | `_updateCascade` glitches chars within 120px | No random glitch bursts; columns still fall |
| `mesh` | `_proximity` on nodes/links | Link wobble, packet speed boost, node shake ring | `_proximity` returns 0; static links/nodes |
| `stack` | Y-distance to `interaction.py` | Row freezes X, `_glitchString` overlay | Marquee only; no freeze/glitch |
| `magnet` | `hover:true` | Pull target = pointer; streams brighten near pointer | Pull stays center; `_proximity` returns 0 |
| `signal` | pointer X as `px/w` | Wave amplitude ×1.6 in ±10% band | No amplitude boost |
| `chrono` | `hover:true` | Hand angle = `atan2(py-cy, px-ox)` | Hand follows timer loop only |
| `sonar` | `hover:true` | Filled blip on pointer bearing | Sweep only; no bearing blip |
| `weave` | `_proximity` on thread midpoints | Thread lift offset ±8px | `_proximity` returns 0; lift = 0 |
| `ledger` | `_proximity` per column | Column glow + counter speed ×2.2 | `_proximity` returns 0; counters frozen; `sweep` highlight only |
| `relay` | `hover:true` | Baton eases toward nearest station; `baton.speed` ×1.8 | Baton follows timer handoff only |
| `isograph` | `hover:true` | Highlight cell column/row follows pointer projection | Highlight uses timer hop only |
| `orbit` | `_proximity` on body position | Nearest orbital body radius + glow boost | `_proximity` returns 0 |
| `seal` | `_proximity` at ring center | Ring stroke narrows; label opacity rises | `_proximity` returns 0 |
| `glyph` | `_proximity` per fragment | Random char glitch within 100px | No glitch swaps |
| `schematic` | `setScrollFrac(frac)` | Scan line Y tracks scroll fraction within slide | Scan uses `state.scan` loop only |

---

## §Slide matrix — post-reassignment (49 rows)

| Route | Slide# | Title | Effect | Cluster | Adjacent dup? |
|-------|--------|-------|--------|---------|---------------|
| home | 1 | Own Your Intelligence | shield | security-ring | |
| home | 2 | 60% of Team Time | cascade | typographic | |
| home | 3 | Let Humans Do Human Work | orbit | orbital | |
| home | 4 | Private AI Infrastructure | hexpulse | circuit | |
| home | 5 | Replace SaaS Waste | magnet | field | |
| home | 6 | 3.7× Average ROI | telemetry | metric | |
| home | 7 | 5–7+ Hours Back | chrono | metric | |
| home | 8 | Start Small. Prove Value. | beacon | radar | |
| about | 1 | Builders First | filament | fabric | |
| about | 2 | Leverage Not Replacement | magnet | field | |
| about | 3 | Four Durable Principles | lattice | isometric-grid | |
| about | 4 | Six Intelligence Layers | constellation | node-graph | |
| about | 5 | Intelligence Sovereignty | seal | security-ring | |
| about | 6 | Co-Founders | orbit | orbital | |
| about | 7 | Carapace → Cortex | relay | handoff | |
| business | 1 | Your Private AI Team | topology | node-graph | |
| business | 2 | Scope Connect Build | lattice | isometric-grid | |
| business | 3 | Teams That Need Leverage | cellscan | node-graph | |
| business | 4 | Evidence Over Theater | signal | metric | |
| business | 5 | Consult Pilot Package | branch | flow-diagram | |
| business | 6 | Discover Deploy Expand | relay | handoff | |
| business | 7 | Not One Tool | hashwave | typographic | |
| business | 8 | $12K → $24K+ | telemetry | metric | |
| licensing | 1 | Clarity Not Mystery | shield | security-ring | |
| licensing | 2 | Free For Personal Use | branch | flow-diagram | |
| licensing | 3 | Under $100K Revenue | topology | node-graph | |
| licensing | 4 | Live Operations Path | parcel | handoff | |
| licensing | 5 | Optional Retainer | ledger | metric | |
| licensing | 6 | Inspectable Boundaries | checksum | security-ring | |
| solutions | 1 | How Work Gets Routable | topology | node-graph | |
| solutions | 2 | Discover Deploy Expand | pipeline | flow-diagram | |
| solutions | 3 | Keep Leads From Slipping | isograph | isometric-grid | |
| solutions | 4 | Faster Client Response | parcel | handoff | |
| solutions | 5 | Governed Handoffs | trace | flow-diagram | |
| solutions | 6 | Less Manual Assembly | sonar | radar | |
| solutions | 7 | Context That Compounds | filament | fabric | |
| solutions | 8 | Reduce Admin Drag | pipeline | flow-diagram | |
| solutions | 9 | Common First Wins | cellscan | node-graph | |
| solutions | 10 | Start With One Wedge | beacon | radar | |
| cortex | 1 | Private Control Plane | shield | security-ring | |
| cortex | 2 | Capture Route Execute | trace | flow-diagram | |
| cortex | 3 | Context Management | hexpulse | circuit | |
| cortex | 4 | Intent Routing | mesh | node-graph | |
| cortex | 5 | Model Independence | signal | metric | |
| cortex | 6 | Custody & Governance | checksum | security-ring | |
| cortex | 7 | Fling Capture | stack | typographic | |
| cortex | 8 | Signal To Work | relay | handoff | |
| cortex | 9 | Why Not Another Chatbot | hashwave | typographic | |
| cortex | 10 | Download Or Deploy | ping | radar | |

**Adjacent duplicate pairs:** none (verified by `verify-revamp.py` grep).

### Site-wide usage counts (shipped)

| Effect | Slides | Overuse (>4)? |
|--------|--------|---------------|
| relay | 3 | |
| mesh | 1 | |
| hexpulse | 2 | |
| telemetry | 2 | |
| beacon | 2 | |
| parcel | 2 | |
| trace | 2 | |
| cellscan | 2 | |
| branch | 2 | |
| hashwave | 2 | |
| lattice | 2 | |
| filament | 2 | |
| checksum | 2 | |
| isograph | 3 | |
| sonar | 3 | |
| ledger | 3 | |
| shield | 3 | |
| topology | 3 | |
| pipeline | 2 | |
| schematic | 2 | |
| weave | 2 | |
| orbit | 2 | |
| seal | 2 | |
| glyph | 2 | |
| magnet | 2 | |
| signal | 2 | |
| pcb | 2 | |
| flowchart | 2 | |
| cascade, chrono, constellation, vault, stack, ping | 1 each | |

---

## §Similarity matrix (shipped)

### Within-cluster peer scores

| Pair | Score | Shipped mitigation |
|------|-------|-------------------|
| mesh ↔ topology | 2 | topology 3×, mesh 4× — separated by relay/isograph on adjacent routes |
| mesh ↔ constellation | 2 | constellation single use (about slide 4) |
| topology ↔ constellation | 2 | Different slide contexts; constellation rare |
| flowchart ↔ pipeline | 2 | pipeline 2×, flowchart 2×; relay/schematic replace former dup slides |
| flowchart ↔ schematic | 2 | schematic on approvals slide; flowchart on consult slide |
| pipeline ↔ relay | 2 | relay is baton metaphor, not stage sweep |
| shield ↔ vault ↔ seal | 2 | seal on agreement slides; vault on custody; shield on control plane |
| ping ↔ sonar | 3 | sonar uses arc wedge; ping kept on cortex CTA only |
| signal ↔ ledger | 2 | ledger columns vs waveform — distinct geometry |
| cascade ↔ glyph | 2 | cascade vertical rain; glyph drifting hashes |

### Clusters with ≥3 site-wide uses (post-ship)

| Cluster | Members | Slide count |
|---------|---------|-------------|
| node-graph | mesh, topology, constellation | 8 |
| flow-diagram | flowchart, pipeline, schematic | 6 |
| handoff/radar/metric | relay, sonar, ledger, signal, chrono | 12 |
| security-ring | shield, vault, seal | 5 |

### Replacement outcomes

| Pre-ship issue | Resolution |
|----------------|------------|
| business 5–6 flowchart dup | slide 6 → `relay` |
| business 7–8 pipeline dup | slides 7–8 → `glyph`, `ledger` |
| licensing 4–5 pipeline dup | slides 4–5 → `relay`, `ledger` |
| pipeline ×9 | → 2 slides |
| flowchart ×8 | → 2 slides |
| topology ×7 | → 3 slides |
| stack unused | cortex slide 7 (Fling Capture) |

---

## §Research

| # | Source | License | Pattern | Verdict | Carapace metaphor |
|---|--------|---------|---------|---------|-------------------|
| 1 | [anime.js v4 Timer docs](https://animejs.com/documentation/timer/) | MIT | `createTimer` frame loop for canvas | **adopt** | `_draw` timer at 60fps |
| 2 | [anime.js v4 Animation docs](https://animejs.com/documentation/animation/) | MIT | Property tweening on state objects | **adopt** | `_bootLoops` pattern |
| 3 | [haoqi.design](https://haoqi.design) | — | Mono-spine instrument panel | **adapt** | DESIGN.md contract |
| 4 | [p5.js flow field examples](https://p5js.org/examples/) | LGPL | Flow-field advection | **adapt** | `weave` thread offsets |
| 5 | [silverbolt/radar-canvas](https://github.com/silverbolt/radar-canvas) | MIT | Arc sweep + echo blips | **adapt** | `sonar` |
| 6 | [bost.ocks.org/voronoi](https://bost.ocks.org/mike/voronoi/) | BSD | Voronoi highlight | **reject** | Too organic |
| 7 | [codeshack.io radar scanner](https://codeshack.io/interactive-radar-scanner-animation-js/) | — | CSS conic-gradient sweep | **reject** | CSS-only |
| 8 | [ngigijohn/geometric-wallpapers](https://github.com/ngigijohn/geometric-wallpapers) | MIT | Isometric grid tiling | **adapt** | `isograph` |
| 9 | [Generative Design (Hart/Bader)](https://www.generative-design.com/) | — | Harmonic / Lissajous motion | **adapt** | `orbit` |
| 10 | [IBM Plex Mono](https://github.com/IBM/plex) | OFL-1.1 | Engineering monospace | **adopt** | cascade/stack/glyph |
| 11 | [three.js wireframe examples](https://threejs.org/examples/) | MIT | 3D wireframe | **reject** | visual-assets.md Phase 1 |
| 12 | [mtibben/jquery.radar](https://github.com/mtibben/jquery.radar) | MIT | jQuery radar | **reject** | jQuery dep |

---

## §Attribution

Patterns adapted under MIT/BSD-compatible licenses are reimplemented procedurally in `effects-anime.js` without copying source. No external asset files added.

---

## §Shipped state

| Metric | Before | After |
|--------|--------|-------|
| Effect IDs | 15 | **23** |
| Interactive effects | 3 | **14** |
| Adjacent duplicate pairs | 3 | **0** |
| pipeline assignments | 9 | 2 |
| flowchart assignments | 8 | 2 |
| topology assignments | 7 | 3 |

Verification evidence: `.verify-scratch/effects-goal-gate.log`, `effects-smoke.log`, `wired-rm-e2e.log`, `reduced-motion.log`, `interaction-policy.log`, `goal-manifest.log`, `reassignment-check.log`, `verify-revamp.log` (exit 0).

Replacement plan: `docs/effects-replacement-plan.md`.