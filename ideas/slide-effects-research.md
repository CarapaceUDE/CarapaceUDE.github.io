# Slide Background Effects, Research (anime.js v4)

_Research turn · 2026-07-05 · Targets scroll-hero `AnimeEffectsField` only (not `/ideas/` pitch slideshow)._

## Current style audit

### What we ship today

The hero background stack is a layered instrument panel, not wallpaper:

| Layer | Source | Role |
|-------|--------|------|
| OKLCH atmosphere glow | `assets/hero-home.css` `.atmosphere-glow` | Slide-tinted radial glow; `--glow-x/y` parallax |
| 48px technical grid | `.atmosphere-grid` | Masked orthogonal grid; `dataset.effect` variants |
| Bokeh orbs | `AnimeEffectsField` bokeh canvas | Soft depth; capped count |
| Canvas field | `assets/effects-anime.js` | 23 procedural effect IDs via `createTimer` → `_draw()` |
| Text veil | `.text-veil` | Readability scrim over copy |

`AnimeEffectsField` (`assets/effects-anime.js`) boots per-effect state in `_createState`, drives loops with `animate()` in `_bootLoops`, and renders at 30-60 fps through a single `createTimer({ onUpdate: () => this._draw() })`. Crossfade between slides uses `smoothstep` mix in `assets/hero-core.js`. Pointer policy is centralized in `assets/effects-interaction.js` (`hoverAllowed`, `proximity`, `rowProximity`, etc.).

Palette resolution uses OKLCH via `colorAtHue()` and `effectPalette()`, aligned with `ideas/website_design_direction.md`: near-black navy, electric blue for control/routing, copper for action, green for verified states, violet for expansion. Glow is semantic, not decorative neon.

### Brand constraints (minimal, techy)

From `ideas/website_design_direction.md` and `docs/effects-audit.md`:

1. **Motion explains hierarchy**, animation orients; it does not replace comprehension.
2. **Glow has meaning**, blue = control layer; copper = action; avoid constant neon.
3. **Reduced motion is complete** - `prefers-reduced-motion` drops non-essential canvas movement; `effects-interaction.js` returns zero proximity when RM is on.
4. **No decorative wallpaper**, diagrams expose how work moves (security rings, handoffs, metrics, schematics).
5. **One strong visual per section**, background stays subordinate to hero copy (veil + low alpha canvas).
6. **Performance-first**, procedural 2D canvas, particle caps per effect; no WebGL/Three.js/particles.js.

### Preserve (do not regress)

- `createTimer` render loop + `animate()` state tweens (already matches anime.js v4 best practice)., OKLCH token reads + 48px grid atmosphere (anchors “techy” without clutter)., Cluster metaphors with semantic fit: `relay` handoff, `vault`/`seal` custody, `schematic` scroll-scan, `ledger`/`signal` metrics.
- `effects-interaction.js` policy layer, all new interactives should use `_proximity` / `hoverAllowed`, not ad-hoc pointer checks., Bokeh + vignette caps, keep backgrounds legible behind hero text.

### Cluster gap analysis (over-represented)

Post-ship matrix (`docs/effects-audit.md` §Slide matrix) still clusters heavily:

| Cluster | Shipped slide count | Members | Gap |
|---------|--------------------:|---------|-----|
| **node-graph** | 8 | `mesh`, `topology`, `constellation` | Too many hub-and-spoke variants; need non-graph metaphors on adjacent slots |
| **flow-diagram** | 6 | `flowchart`, `pipeline`, `schematic` | Box-and-arrow family still dominates solutions/cortex routes |
| **handoff** | 5 | `relay` (sole ID) | Single metaphor repeated site-wide, needs alternate transport patterns |
| **radar** | 4 | `sonar`, `ping` | Arc/sweep family OK but `sonar` ×3 risks sameness |

Under-represented clusters ripe for new IDs: **circuit** (only `pcb` ×2), **fabric** (`weave` ×2), **field** (`magnet` ×2), **isometric-grid** (`isograph` ×3 but no stagger-wave variant).

### External patterns to reject, Full-screen particle explosions, fluid sims, galaxy swarms (Jotform roundup, One Page Love particles.js showcases)., Organic blob gradients, anti-grid liquid layouts (Elementor 2026 trend #1)., WebGL particle heads, 40k-particle demos, confetti (Jotform / Awwwards spectacle sites)., Letterize DOM text effects as full-background wallpaper (WojciechWKROPCE pen is hero-title scale, not canvas field)., Cyberpunk node-graph navigation as primary BG (Orpetron Bilal Şanlı portfolio)., Decorative stagger grids with no system metaphor (raw LMrRNW demo).

---

## Resource review

### (a) animejs.com + Julian Garnier CodePens

**Fetched:** [animejs.com](https://animejs.com) (full showcase), [Timer docs](https://animejs.com/documentation/timer/), [Stagger grid docs](https://animejs.com/documentation/utilities/stagger/stagger-parameters/stagger-grid/).

**Blocked (Cloudflare):** All five CodePen URLs - [LMrRNW](https://codepen.io/juliangarnier/pen/LMrRNW), [XvjWvx](https://codepen.io/juliangarnier/pen/XvjWvx), [gmOwJX](https://codepen.io/juliangarnier/pen/gmOwJX), [VwLePLy](https://codepen.io/WojciechWKROPCE/pen/VwLePLy), [NWGJvqW](https://codepen.io/web2033/pen/NWGJvqW). Techniques inferred from pen titles, embed metadata, anime.js docs, and [Abduzeedo 10-year article](https://abduzeedo.com/celebrating-10-years-animejs-web-animation).

| Source | Technique | Map to Carapace |
|--------|-----------|-----------------|
| animejs.com homepage | `createTimer` frame loop | **Adopted**, already `AnimeEffectsField.renderTimer` |
| animejs.com | `stagger()` grid `[cols, rows]` + `from: 'center'` | → proposed `hexpulse`, `hashwave` (grid-cell activation waves) |
| animejs.com | `createTimeline` + staggered positions | → proposed `branch`, `telemetry` (sequenced instrument ticks) |
| animejs.com | `createDrawable` + `draw: '0 1'` + `onScroll({ sync: true })` | → proposed `trace`, `checksum` (progressive path/bar reveal on scroll) |
| animejs.com | `createMotionPath` + `morphTo` | → proposed `parcel`, `filament` (packets on orthogonal paths; no SVG DOM) |
| animejs.com | `composition: 'blend'` on transforms | → proposed `lattice` (layered grid depth parallax) |
| LMrRNW (inferred) | Dot grid scale/glow stagger loop | **Adapt** as control-plane cell pulse, not raw wallpaper |
| XvjWvx (inferred) | SVG stroke draw / firework paths | **Adapt** as canvas segment `progress` tween (schematic family) |
| gmOwJX (inferred) | Logo choreography / multi-part stagger | **Reject** as literal logo animation; **adapt** timing cadence for `telemetry` ticks |
| VwLePLy (inferred) | Letterize.js per-character stagger | **Adapt** as mono glyph grid wave (`hashwave`), not DOM Letterize |
| NWGJvqW (inferred) | DOM particle field | **Reject**, use capped canvas nodes instead (`scatter` at low fit) |

### (b) Particle inspiration roundup (Jotform + One Page Love)

**Fetched:** [Jotform particles roundup](https://www.jotform.com/blog/particles-animation-codepen-97659/), [One Page Love particles p.3](https://onepagelove.com/tag/particles/page/3).

Jotform catalogues fluid sims, WebGL heads, particle fountains, galaxies, confetti, particles.js configs. One Page Love page 3 lists legacy particles.js portfolios (Cleverbird Art, Turing Inc., Fabio Lamanna, etc.), mouse-linked starfields behind full-viewport heroes.

| Pattern | Verdict | Carapace mapping |
|---------|---------|------------------|
| Mouse-reactive starfield (particles.js) | **Reject** | Too wallpaper; violates “glow has meaning” |
| Particle swarm / flocking | **Reject** at full density | **Adapt** as ≤24 capped nodes snapping to 48px grid (`scatter`, low fit) |
| Text particle (Gthibaud) | **Reject** | Competes with hero typography |
| Vibrating particles / springy dots | **Adapt** | Pointer-proximity micro-jitter on existing nodes (`mesh` pattern), new IDs should differ |
| Simple canvas dots with lines on proximity | **Adapt** | Already `mesh` / `constellation`; propose `beacon` (fixed anchors, not force graph) |

### (c) 2026 trend articles (Elementor + Orpetron + Awwwards)

**Fetched:** [Elementor 2026 trends](https://elementor.com/blog/web-design-trends-2026/), [Orpetron May 2026](https://orpetron.com/blog/top-sites-of-the-month-that-you-must-see-may-2026/), [Awwwards home](https://www.awwwards.com) (2026-07-05).

| Trend / site | Technique | Verdict | Proposed influence |
|--------------|-----------|---------|-------------------|
| Elementor #1 organic shapes / anti-grid | Blob gradients, asymmetric flow | **Reject** for BG | Keep 48px grid anchor |
| Elementor #5 micro-interactions / functional motion | Hover states, sequenced transitions | **Adopt** | Reinforces `effects-interaction.js` proximity model for new interactives |
| Elementor #8 accessibility default | Pause animations, RM | **Adopt** | Every proposal includes static RM fallback |
| Elementor #11 performance-first | Lightweight motion | **Adopt** | Canvas caps, no new libraries |
| Orpetron *part-time.studio*, *creative approach*, *Casa Portal Chukum* | Minimal + typography + subtle scroll | **Adapt** | Low-amplitude parallax only (`lattice`, `filament`) |
| Orpetron *Bilal Şanlı* | WebGL particles + cyberpunk node nav | **Reject** | Conflicts with minimal-techy |
| Orpetron *Cut the Code*, *NRG Data Center* | Dark tech + diagrammatic storytelling | **Adapt** | Supports `trace`, `branch`, `checksum` |
| Awwwards *NRG Build Your Data Center* | Infrastructure metaphor, clean dark | **Adapt** | `telemetry`, `hexpulse` for cortex/control-plane slides |
| Awwwards spectacle winners (Radian, etc.) | Full-bleed motion | **Reject** | Deck copy must remain primary |

### (d) Microinteractions (GitHub topic)

**Fetched:** [github.com/topics/microinteractions](https://github.com/topics/microinteractions).

Topic highlights: ripple touch feedback (v-wave), icon motion (Carbon icons-motion), typography micro-animations (vivid_vector_alphabet), UI state transitions (ng-micro-interact). None are full-viewport backgrounds.

| Repo pattern | Adaptation for canvas field |
|--------------|----------------------------|
| Ripple on press | **Adapt** → `beacon` echo rings (single-origin, timed, ≤4 rings) |
| Icon stroke draw | **Adapt** → `trace` segment progress |
| Counter/stepper tick | **Adapt** → `telemetry` staggered tick marks |
| 3D hover tilt | **Reject** | Competes with scroll-hero pin semantics |

---

## Proposed effects

Eight new effect IDs (not in `docs/effects-audit.md` §Inventory). All implement inside existing `AnimeEffectsField` pipeline: `_createState` → `_bootLoops` (`animate` / `createTimer`) → `_drawEffect`, using `effects-interaction.js` helpers.

### Summary table

| ID | Visual metaphor | anime.js v4 technique | Cluster | Interaction | RM fallback | Fit | Example slides (diversity) |
|----|-----------------|----------------------|---------|-------------|-------------|-----|--------------------------|
| `hexpulse` | Hex control-plane cells breathe outward from center | `stagger(80, { grid: [cols, rows], from: 'center' })` on cell `scale`/`alpha` | circuit (+ security) | pointer-proximity | Static lit hex at center; no pulse loop | **High** | cortex 3 Context Management; home 4 Private AI Infrastructure |
| `trace` | Orthogonal route traces self-draw between stations | `animate({ progress: [0, 1] })` per segment; optional `onScroll` sync via `setScrollFrac` | flow-diagram | scroll-sync | Show completed path at `progress: 1` | **High** | solutions 5 Governed Handoffs; cortex 2 Capture Route Execute |
| `hashwave` | Mono glyph wave sweeps across a fixed character grid | `stagger(40, { grid: [cols, rows], axis: 'x' })` on char `alpha` + brief `char` scramble | typographic | pointer-proximity | Frozen grid, no scramble | **High** | business 7 Not One Tool; cortex 9 Why Not Another Chatbot |
| `branch` | Binary decision fork with staggered node reveal | `createTimeline().add(nodes, { scale, opacity }, stagger(120, { from: 'first' }))` | flow-diagram | none (parallax via `_pointerOffset`) | All nodes visible, no stagger | **High** | licensing 2 Free For Personal Use; business 5 Consult Pilot Package |
| `telemetry` | Instrument strip: micro-ticks climb a baseline | `createTimeline` + `stagger(10)` on tick `y`; looped `counter` | metric | none | Static baseline + final tick | **High** | home 6 3.7× Average ROI; business 8 $12K → $24K+ |
| `parcel` | Data packets ride L-shaped traces between stations | `animate({ t: [0, 1], ease: 'linear' })` along piecewise path; pointer biases target station | handoff | pointer-proximity | Packets loop on timer path only | **High** | licensing 4 Live Operations Path; solutions 4 Faster Client Response |
| `beacon` | Fixed anchor nodes emit timed echo rings | `stagger(200)` on ring `r`/`alpha` arrays per anchor | radar | pointer-proximity | Anchors static; no bearing blip | **Medium** | solutions 10 Start With One Wedge; home 8 Start Small Prove Value |
| `checksum` | Horizontal verify bar fills with staggered tick marks | `draw` metaphor via `progress` tween; `delay: stagger(30)` per tick; scroll drives `progress` | security-ring | scroll-sync | Full bar visible, no sweep | **High** | cortex 6 Custody & Governance; licensing 6 Inspectable Boundaries |
| `lattice` | Depth-layered perspective grid with subtle shear | `composition: 'blend'` on layer `skewX`/`translateY`; parallax from `pointer` | isometric-grid | parallax | Single flat grid layer | **Medium** | about 3 Four Durable Principles; business 2 Scope Connect Build |
| `filament` | Single luminous thread weaving through grid nodes | Motion-path `t` along precomputed knot path; low particle count | fabric | parallax | Static thread on shortest path | **Medium** | about 1 Builders First; solutions 7 Context That Compounds |

### Per-effect notes

**`hexpulse`**, Diversifies **circuit** cluster without another PCB trace clone. Hex centers snap to 48px grid multiples. Pointer brightens nearest hex column. Reduces pressure to assign another `topology`/`mesh` on infrastructure slides.

**`trace`**, borrows XvjWvx / `createDrawable` semantics without SVG DOM: each segment has `state.progress`. Pairs with `schematic` scroll-scan but shows *route completion* not blueprint blocks. Cuts **flow-diagram** repetition vs another `flowchart`/`pipeline`.

**`hashwave`**, Letterize + stagger (VwLePLy) adapted to canvas glyphs already used in `cascade`/`glyph`. Wave is horizontal band, not vertical rain, distinct similarity score.

**`branch`**, Timeline stagger for *decision* metaphor; replaces implicit “another box diagram” on licensing/business consult slides.

**`telemetry`**, anime.js homepage ticker / timeline demo adapted to metric cluster. Distinct from `signal` waveform and `ledger` columns.

**`parcel`** - **handoff** cluster alternative to `relay` baton (5× site-wide). L-shaped motion paths echo `pcb` grammar without adding circuit slides.

**`beacon`**, Radar cluster variant that is *point-source* not wedge-sweep (`sonar` ×3). Low ring count preserves minimalism.

**`checksum`**, Security-ring metaphor for verification/custody without another rotating `shield`/`vault`/`seal`.

**`lattice`**, Fills **isometric-grid** gap with depth parallax (Elementor “subtle motion”), not a third `isograph` diamond hop.

**`filament`** - **fabric** alternative to `weave` interlace; one thread = less visual noise.

### Ranked implementation order (next pass)

1. `parcel`, `trace`, `hexpulse`, highest cluster-gap impact (handoff, flow-diagram, circuit).
2. `hashwave`, `checksum`, `telemetry`, typographic/metric/security diversity.
3. `branch`, `beacon`, `lattice`, `filament`, polish + medium-fit slots.

---

## Non-fit patterns

Explicit rejections from cited sources (do not implement as slide backgrounds):

| Pattern | Source | Why it fails minimal-techy |
|---------|--------|---------------------------|
| Fluid simulation / smoke | Jotform Fluid Simulation | Organic, GPU-heavy, no system metaphor |
| WebGL particle head | Jotform WebGL Particle Head | Spectacle wallpaper |
| Particle galaxy / 40k dots | Jotform Particle Galaxy, rlemon | Decorative density |
| Explosion / confetti | Jotform Explosion, Dynamic 3D Confetti | Celebration noise |
| particles.js full-viewport starfield | One Page Love tag, Vincent Garreau pen | Generic AI-site cliché |
| Organic blob / anti-grid hero | Elementor trend #1 | Breaks 48px grid atmosphere |
| WebGL cyberpunk node navigator | Orpetron Bilal Şanlı | Competes with hero IA |
| Letterize DOM hero text as BG | WojciechWKROPCE VwLePLy | Competes with `HeroTextAnime` / copy |
| Full-screen Three.js wireframe | anime.js Three adapter demos | `docs/effects-audit.md` rejects 3D wireframe |
| Raw stagger dot grid (no metaphor) | LMrRNW demo | Pretty but semantically empty |
| Custom cursor + sound design | Orpetron showcase tags | Out of scope for `AnimeEffectsField` |
| Ripple material UI on buttons | GitHub v-wave | UI chrome, not canvas field |

---

## Next implementation pass

1. **Contract**, Add IDs to `assets/effects-goal-contract.js` `PREREQUISITE_DRAW_IDS` (or successor list) with particle caps and `INTERACTIVE_EFFECTS` membership.
2. **Scaffold**, For each ID: `_createState`, `_bootLoops`, `_drawEffect` branches in `assets/effects-anime.js`; follow `pcb`/`relay`/`schematic` patterns.
3. **Interaction**, Wire `hoverAllowed` / `proximity` / `setScrollFrac` per §Interaction contracts in `docs/effects-audit.md`.
4. **Assignment**, Rebalance matrix per `docs/effects-audit.md`: target `relay` ≤3, node-graph ≤5, flow-diagram ≤4 using new IDs on slots called out above.
5. **Verify**, Extend `scripts/verify-revamp.py` / goal gates: adjacent-dup check, RM static snapshot, particle cap grep.
6. **Stagger utility**, Import `stagger` + `createTimeline` from `animejs@4.0.2` (already used in `assets/text-anime.js`) for `hexpulse`, `hashwave`, `branch`, `telemetry` loop bootstraps.

### APIs to import (v4)

```js
import { animate, createTimer, createTimeline, stagger } from "https://esm.sh/animejs@4.0.2";
```

`createDrawable` / `onScroll` are optional for `trace`/`checksum` if scroll fraction is already fed via `effectsField.setScrollFrac(frac)` (see `schematic`).

---

## References, In-repo: `assets/effects-anime.js`, `assets/effects-interaction.js`, `assets/effects-goal-contract.js`, `assets/hero-core.js`, `docs/effects-audit.md`, `ideas/website_design_direction.md`, `assets/hero-home.css`, External (consulted): animejs.com, Jotform particles roundup, One Page Love particles p.3, Elementor 2026 trends, Orpetron May 2026, Awwwards, GitHub microinteractions topic, Abduzeedo anime.js 10-year article, External (blocked): five OBJECTIVE CodePens (Cloudflare), techniques inferred from titles + anime.js documentation