# /newhero/, Design Evaluation & Application Notes

Notes for carrying the Carapace × Haoqi hero design into the live site or another framework.

**Status:** Standalone prototype. Not wired into `index.html` or `assets/site.css` today.

**Canonical artifact:** `hero.html` (+ `tokens.css`, `text-anime.js`, `effects-anime.js`)

**Deprecated reference:** `carapace-final.html`, earlier Inter/sky-violet particle experiment. Do **not** port its aesthetic; keep only shared slide copy if useful.

---

## 1. What this design is

A **pseudo-scroll narrative hero**: the user scrolls through a tall stage (`480vh`) while headline content stays pinned center-screen. Scroll progress maps to **8 discrete slides** + a final **CTA section** (`100vh`). The feel is "instrument panel / design engineer", not SaaS marketing.

Inspired by [haoqi.design](https://haoqi.design/) **patterns** (mono spine, metadata chrome, quiet motion), not a pixel clone.

### Design intent (from `DESIGN.md`)

| Axis | Target |
|------|--------|
| Mood | Quiet, deliberate, engineered |
| Typography | IBM Plex Mono everywhere, UI spine, not display + body split |
| Color | OKLCH-native; per-slide atmosphere via hue shifts |
| Motion | Restrained; threshold-based slides; word stagger ≤ 32ms |
| Depth | Borders only, no glass, no neumorphism, no card shadows |
| Craft signals | WASM capsule SVG paths on chips + CTA only |

### Anti-patterns (explicitly rejected), Inter + sky/violet gradients (`carapace-final.html` style)
- `backdrop-filter` blur cards, Bouncy springs, heavy particle fireworks, Squircle/capsule on every element, Generic "craft and innovation" filler

---

## 2. File map & responsibilities

```
newhero/
├── DESIGN.md              # Design contract (Open Design / agent iteration)
├── design framework.txt   # Broader Haoqi-style framework spec (Next.js architecture)
├── tokens.css             # Machine-readable CSS variables (dark + light)
├── manifest.json          # Open Design project manifest
├── hero.html              # ★ Canonical implementation
├── text-anime.js          # Slide typography choreography (anime.js v4)
├── effects-anime.js       # Canvas background effects (anime.js v4)
├── carapace-final.html    # ✗ Old prototype, Inter, particles, glass
└── APPLICATION-NOTES.md   # This file
```

### External dependencies (ESM CDN)

| Package | Version | Used for |
|---------|---------|----------|
| `@wenhaoqi/wasm_design_utils` | 0.2.0 | `init()`, `oklch2rgb_rel()`, `getCapsule()` |
| `animejs` | 4.0.2 | Timelines, canvas animation loops |
| Google Fonts | - | IBM Plex Mono 400-700 |

---

## 3. Visual layer stack (z-index)

Apply in this order when porting:

| z | Layer | Element | Role |
|---|-------|---------|------|
| 0 | Atmosphere | `.atmosphere` | Radial glow + grid + field canvas |
| 8 | Bokeh | `.bokeh-layer` | Soft orbs behind text; masked to center |
| 15 | Text veil | `.text-veil` | Readability scrim over effects |
| 25 | Pinned content | `.pinned` | Slide copy + 3D stage |
| 35 | Slide rail + scroll hint | `.slide-rail`, `.scroll-hint` | Navigation affordances |
| 40 | Chrome | `.chrome` | Metadata rail (brand, time, cursor, stage, scroll %) |
| 10 | CTA + footer | `.cta-section`, `.site-footer` | Post-hero content |

**Rule:** Effects never obscure text. Bokeh opacity + veil opacity scale with slide `bokeh` intensity.

---

## 4. Design tokens (`tokens.css`)

Paste `:root` + `[data-theme="light"]` into any target stylesheet. Reference only via `var(--*)`.

### Core semantic tokens

- **Surface:** `--bg`, `--surface`
- **Text ramp:** `--fg`, `--fg-2`, `--muted`, `--meta`
- **Chrome:** `--border`, `--border-soft`, `--grid`, `--glow`, `--slide-glow` (runtime)
- **Accent:** `--accent`, `--accent-on`, `--accent-dim`, `--accent-hover`, `--accent-active`
- **Motion:** `--motion-fast` (150ms), `--motion-slide` (550ms), `--ease-out`, `--word-stagger` (32ms)
- **Layout:** `--hero-stage-height` (480vh), `--hero-width` (min(920px, calc(100vw - 48px))), `--pinned-fade-start` (0.78)

### Typography scale

| Token | Size | Use |
|-------|------|-----|
| `--text-xs` | 0.62rem | Meta labels, scroll hint |
| `--text-sm` | 0.72rem | Chrome, meta values |
| `--text-base` | 0.82rem | Note tier |
| `--text-lg` | 1.12rem | Body/sub max |
| `--text-xl` | clamp(2rem, 6.8vw, 4.8rem) | Hero h1 |

### Theme switching

- `document.documentElement.dataset.theme = "dark" | "light"`, Persist: `localStorage.setItem("carapace-theme", theme)`, Init before paint to avoid flash, Toggle updates `--bg`, `--fg`, accent inversion (light mode accent is darker)

---

## 5. Scroll mechanics (critical to preserve)

### Stage geometry

```css
.hero-stage { height: var(--hero-stage-height); }  /* 480vh */
.pinned {
  position: fixed;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: var(--hero-width);
}
```

### Progress calculation

```js
const stageTop = -stage.getBoundingClientRect().top;
const stageHeight = stage.offsetHeight, window.innerHeight;
progress = clamp(stageTop / stageHeight, 0, 1);
```

### Slide index (discrete, not continuous)

```js
const idx = Math.min(slides.length - 1, Math.floor(progress * slides.length));
```

Slide changes only when `idx` changes - **not** on fractional scroll within a slide.

### Cross-slide effect mixing

When `frac = (progress * slides.length), idx > 0.3` and not on last slide:

```js
mix = smoothstep(0.3, 0.96, frac);
effectsField.setMixTarget(slides[idx].effect, slides[nextIdx].effect, mix);
```

Also lerps `bokeh` intensity between slides.

### Pinned fade-out

At `progress > 0.78` (`--pinned-fade-start`):, Pinned opacity → 0 via smoothstep, Scroll hint hidden, CTA section (`min-height: 100vh`) takes over below stage

### Scroll hint

Hidden after `progress > 0.04` (user has started scrolling).

---

## 6. Slide content model

Each slide is a plain object:

```js
{
  eyebrow: "Carapace Cortex",      // Accent uppercase label
  title: "Own Your Intelligence",  // Split into .title-word spans
  sub: "...",                      // Muted body, max ~58ch
  note: "...",                     // Meta tier, max ~52ch
  proof: ["Private", "..."],       // Max 3 chips
  oklch: { L: 0.55, h: 210, rel: 0.35 },  // Atmosphere hue
  effect: "shield",                // Canvas effect id
  bokeh: 0.28                      // 0-1 intensity
}
```

### Current 8-slide narrative arc

| # | Eyebrow | Title | Effect | Hue (h) |
|---|---------|-------|--------|---------|
| 1 | Carapace Cortex | Own Your Intelligence | shield | 210 |
| 2 | The Hidden Tax | 60% of Team Time | cascade | 280 |
| 3 | The Problem | Let Humans Do Human Work | mesh | 175 |
| 4 | The Layer | Private AI Infrastructure | stack | 230 |
| 5 | The Business Case | Replace SaaS Waste | magnet | 45 |
| 6 | The ROI Signal | 3.7× Average ROI | signal | 145 |
| 7 | The Time Dividend | 5-7+ Hours Back | chrono | 195 |
| 8 | The Entry Point | Start Small. Prove Value. | ping | 250 |

**CTA (not a slide):** "Ready to own your intelligence?" → Discovery Sprint mailto.

**Proof sources (footer):** Asana Anatomy of Work · IDC 2024 · Adecco 2024 · LSE/Protiviti

### Copy diff vs `carapace-final.html`

Slide 3 title differs: final uses "Stop Using People as Glue"; canonical hero uses "Let Humans Do Human Work". Prefer canonical when merging with live site voice.

---

## 7. Typography & DOM structure

`HeroTextAnime.mount()` builds:

```html
<div class="eyebrow text-el" data-layer="eyebrow">…</div>
<h1 class="title-block">
  <span class="title-word text-el" data-word="0">Own</span>
  <span class="title-word text-el" data-word="1">Your</span>
  …
</h1>
<p class="sub text-el" data-layer="sub">…</p>
<p class="note text-el" data-layer="note">…</p>
<div class="proof-row text-el" data-layer="proof">
  <span class="proof-chip" data-chip><span>…</span></span>
</div>
```

### Text hierarchy CSS

- `.eyebrow`, accent, 0.68rem, tracking 0.22em, subtle accent text-shadow
- `h1`, weight 600, lh 0.92, tracking -0.04em
- `.sub`, muted, clamp body size, max-width 58ch
- `.note`, meta color, 0.82rem, max-width 52ch
- `.proof-chip`, surface fill, 1px border; WASM capsule SVG stroke overlaid

---

## 8. Text animation system (`text-anime.js`)

**Class:** `HeroTextAnime(stage3dEl, slideContentEl, { reducedMotion })`

### Per-slide enter/exit presets

8 preset pairs (`ENTER[]` / `EXIT[]`) indexed by `slideIndex % 8`. Each uses 3D transforms:

- `z`, `rotateX`, `rotateY`, `rotateZ`, `x`, `y`, `opacity`, Easing: `outExpo` / `inExpo` / `out(3)`

**Special slides:**, Index 5 (ROI): scatter enter/exit, elements fly from computed offsets, Index 7 (Entry): orbit enter/exit, circular arrival paths

### Word-level animation

Separate `WORD_ENTER[]` / `WORD_EXIT[]` presets; stagger from center (`stagger(48, { from: "center" })`).

### Stage 3D tilt

`STAGE_TILT[]`, per-slide `rotateX`/`rotateY` on `.stage-3d` during transitions; settles to 0 after enter.

### Timing

| Mode | Enter | Exit |
|------|-------|------|
| Normal | 900ms | 580ms |
| Slides 5, 7 | 1040ms | - |
| Reduced motion | 120ms | 80ms |

### Application notes, Requires `perspective: 1500px` on `.pinned` and `transform-style: preserve-3d` on stage/content, After each enter, `settleTransforms()` zeroes all transforms (prevents drift), Exit runs before DOM swap when slide index changes, Import as ES module; needs `type="module"` script tag

---

## 9. Canvas effects system (`effects-anime.js`)

**Class:** `AnimeEffectsField(fieldCanvas, bokehCanvas, { reducedMotion, onMixChange })`

### Eight effect types (1:1 with slides)

| ID | Visual | Grid variant (CSS) |
|----|--------|------------------|
| `shield` | Concentric elliptical rings + orbiting sparks | 48px grid |
| `cascade` | Matrix-style falling columns (IBM Plex Mono chars) | Vertical 14px stripes |
| `mesh` | Node network with animated link packets | 24px grid |
| `stack` | Horizontal scrolling terminal lines (`cortex init --private`, etc.) | Horizontal 22px lines |
| `magnet` | Particles streaming to center core | 48px, dimmer |
| `signal` | Rising trend line with spikes | Horizontal 18px lines |
| `chrono` | Clock face + sweeping hand | 72px grid |
| `ping` | Radar sweep + expanding rings + blips | 44px grid |

Grid appearance is also controlled via `.atmosphere[data-effect="…"]` CSS overrides on `.atmosphere-grid`.

### Bokeh layer

14 orbs (8 in reduced motion); radial gradients tinted by `this.hue`; edge-masked with `destination-in` composite.

### Mixing between effects

`setMixTarget(a, b, mix)` animates `mix.value` over 720ms; draw loop alpha-blends effect A and B.

`onMixChange` callback sets `atmosphere.dataset.effect` to whichever effect dominates (mix > 0.5).

### Hue

`setHue(slide.oklch.h)`, all canvas draws use `hsla(hue, …)`.

### Reduced motion, Particle/column counts ~halved, Animation durations × 1.8, Frame rate 30fps vs 60fps

---

## 10. WASM craft layer

From `@wenhaoqi/wasm_design_utils`:

```js
await init();
const { R, G, B } = await oklch2rgb_rel(L, h, rel);
const d = await getCapsule(width, height, radius);
```

### Uses

1. **Per-slide atmosphere:** `oklch2rgb_rel` → `--slide-glow` CSS variable (cached per slide index)
2. **Proof chips:** `getCapsule(w, h, min(h/2, 14))` → SVG path stroke overlay (1px, `var(--border)`)
3. **CTA button:** `getCapsule(w, h, h/2)` → SVG path fill (`var(--accent)`)

**Fallback:** CSS `border-radius: 999px` if WASM fails.

**SSR note:** Capsule generation is async client-only. Render chips with CSS radius first; enhance after `init()`.

---

## 11. Metadata chrome ("instrument panel")

Fixed inset padding `18px 22px`. Pointer-events none except theme toggle.

| Position | Content |
|----------|---------|
| Top-left | `Carapace ©2026` brand |
| Top-right | Theme toggle + live clock (HH:MM:SS) |
| Bottom-left | Stage `01 / 08` |
| Bottom-center | Cursor `x, y` |
| Bottom-right | Scroll `N%` |

### Slide rail (desktop only)

Left edge vertical ticks: 1px × 18px; active extends to 28px + accent color.

### Mobile (`max-width: 720px`), Hide slide rail, Hide time + scroll meta blocks (`.hide-mobile`), Hide theme label text (icon only), Reduce chrome padding

---

## 12. Atmosphere & grid parallax, Radial glow: `--glow` + per-slide `--slide-glow`, Grid: 48px default; cursor drift ±6px via `--grid-x/y` on mousemove
- `color-mix(in oklch, …)` on text veil for theme-aware scrim

---

## 13. CTA section pattern

Separate from pinned hero, normal document flow after `.hero-stage`.

```html
<section class="cta-section">
  <div class="cta-panel">
    <div class="eyebrow">Next step</div>
    <h2>Ready to own<br>your intelligence?</h2>
    <p>…</p>
    <a class="cta-link" href="…">Book the Discovery Sprint →</a>
  </div>
</section>
```, Left-aligned, `min(640px, 100%)` panel
- `border-top: 1px solid var(--border)` separates from hero, CTA uses capsule WASM fill, uppercase, `var(--accent-on)` text on accent bg, No gradient, no glow shadow (per DESIGN.md)

---

## 14. Applying to the live Carapace site

### Recommended integration path

1. **Replace** `index.html` hero (`#home-carousel-root` + Swiper) with newhero scroll stage OR offer as alternate route (`/hero`).
2. **Import** `tokens.css` variables into `assets/site.css` `:root`, merge, don't duplicate conflicting `--bg`/`--text`.
3. **Swap font:** site currently uses Inter + Roboto Mono accents → hero requires **IBM Plex Mono only** for the hero region at minimum.
4. **Bundle JS:** Move `text-anime.js` + `effects-anime.js` to `assets/` or `src/`; add build step or keep ESM imports.
5. **Self-host WASM dep** or pin CDN version in production.
6. **Align CTA** with `business.html#contact` intake form instead of mailto if that's the production path.
7. **Reconcile narrative:** 8 scroll slides vs current 10-slide home carousel + pitch deck, decide single source of truth for copy.

### What can stay from current site, Nav links, footer structure, `cortex-bloom-bg.js` (only if not competing visually, likely remove in hero zone), Discovery Sprint CTA destination, Carapace/Cortex naming split

### What must change

| Current site | Newhero |
|--------------|---------|
| Inter, editorial serif accents | IBM Plex Mono spine |
| `#030711` hex backgrounds | OKLCH tokens |
| Image carousel (PNG slides) | Text-first pinned narrative |
| Full-bleed photography heroes | Canvas atmosphere + sparse type |
| `site.css` btn pills | WASM capsule CTA |

### Framework port (Next.js / React)

See `design framework.txt` for target architecture:

- `DesignProvider`, theme, reduced-motion, WASM init
- `MetadataRail`, chrome component
- `AdaptiveImage`, optional palette extraction (not used in current hero)
- `Squircle` / `Capsule`, wrap WASM path generation, Hero as client component with scroll listener + `HeroTextAnime` class

### Open Design workflow

`manifest.json` registers project for [Open Design](https://github.com/nexu-io/open-design) artifacts. Iteration rules from `DESIGN.md`:

1. Change one axis per iteration (type, atmosphere, motion, content)
2. Critique against patterns, not pixels
3. Export single-file HTML for preview

---

## 15. Accessibility checklist

- [ ] `aria-live="polite"` on slide content (present)
- [ ] Theme toggle `aria-pressed` + `aria-label` (present)
- [ ] Decorative canvases `aria-hidden="true"` (present)
- [ ] `prefers-reduced-motion` disables grid drift, cuts particles, shortens all transitions (present)
- [ ] Ensure OKLCH contrast in light mode (accent-on vs accent)
- [ ] Keyboard users can't advance slides without scroll, consider arrow keys or skip link
- [ ] Proof chips need meaningful text (not icon-only) ✓

---

## 16. Performance notes, Two full-viewport canvases + anime.js timers run continuously, pause when hero off-screen if porting to multi-page site
- `slideGlowCache` prevents repeated WASM color calls
- `slideRenderToken` prevents race on fast scroll, DPR capped at 2 for canvas, Resize re-inits effect state + CTA capsule

---

## 17. Quick "do / don't" for implementers

**Do**, Keep hero width editorial (`920px` max), not full-bleed, Use threshold-based slide jumps, Let metadata chrome feel alive (clock, cursor, scroll %), Cap proof chips at 3, Test light + dark theme on every slide, Graceful degrade without WASM

**Don't**, Port `carapace-final.html` glass/blur/gradient CTA, Add Inter or sky-violet palette, Make slides continuous/scrubbable, discrete is intentional, Put squircles on headings or nav, Use image palettes as brand colors without review, Stack hero carousel AND scroll hero on same page

---

## 18. Local preview

Open `newhero/hero.html` via static server (ESM imports + relative modules):

```bash
npx serve newhero
# or from repo root: npx serve . then visit /newhero/hero.html
```

`carapace-final.html` previews standalone without modules.