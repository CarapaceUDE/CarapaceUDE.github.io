# Carapace × Haoqi

> Category: Product / AI Infrastructure
> A taste-engine hero for Carapace Cortex — minimal, precise, mono-spined, OKLCH-native.
> Inspired by haoqi.design craft patterns, not a pixel copy. Pseudo-scroll narrative with
> threshold-based slides; metadata rail; WASM squircle/capsule geometry.

## Visual Theme & Atmosphere

Quiet, deliberate, engineered. The page should feel like an instrument panel authored by a
design engineer — not a SaaS marketing template. Sparse oversized type, tiny metadata labels,
restrained motion, and image-aware color when assets are present. The pseudo-scroll hero pins
content center-stage while scroll progress advances narrative slides; atmosphere shifts subtly
per slide via OKLCH tints, not loud gradients or particle fireworks.

## Color Palette & Roles

All color transformation uses **OKLCH**. Do not darken with arbitrary HSL opacity hacks.

- **Background (`--bg`):** `oklch(0.14 0.012 265)` dark · `oklch(0.97 0.006 265)` light
- **Surface (`--surface`):** `oklch(0.17 0.014 265)` dark · `oklch(0.94 0.008 265)` light
- **Foreground (`--fg`):** primary text
- **Muted (`--muted`):** secondary copy, captions
- **Meta (`--meta`):** metadata rail, coordinates, timestamps
- **Accent (`--accent`):** slide eyebrow, active rail dot, CTA — one hue family per slide
- **Border (`--border`):** hairline chrome, chip outlines
- **Grid (`--grid`):** atmosphere grid lines at low opacity
- **Glow (`--glow`):** radial atmosphere; shifts per slide via `--slide-glow`

Per-slide accent atmosphere is computed with `oklch2rgb_rel(L, h, rel)` from
`@wenhaoqi/wasm_design_utils`. Never treat extracted image palettes as final brand colors
without human review.

## Typography Rules

- **Spine:** `'IBM Plex Mono', ui-monospace, monospace` for all UI — engineered, not corporate
- **Display headings:** weight 600, tight line-height (0.92–1.05), letter-spacing -0.04em
- **Eyebrow:** 0.68rem, weight 600, letter-spacing 0.22em, uppercase, accent color
- **Body / sub:** clamp(0.92rem, 1.8vw, 1.12rem), line-height 1.55, muted color
- **Note:** 0.82rem, meta-tier color
- **Metadata rail:** 0.62–0.72rem, uppercase labels at 0.14em tracking, tabular nums for values
- Scale: 12 · 14 · 16 · 20 · 32 · 48 · 77 (hero clamp)

## Component Stylings

- **Proof chips:** capsule SVG paths via `getCapsule()` — not cheap `border-radius` alone.
  1px stroke, surface fill, meta text. Max 3 per slide.
- **CTA:** capsule fill in accent, uppercase label, no gradient, no glow shadow.
- **Theme toggle:** minimal bordered control, uppercase 0.64rem, pressed state shows accent border.
- **Slide rail:** 1px vertical ticks; active tick extends height and takes accent color.
- **Scroll hint:** uppercase meta text, fades after first scroll threshold.

## Layout Principles

- **Hero stage:** `480vh` scroll height; content pinned `position: fixed` center viewport.
- **Pinned width:** `min(920px, calc(100vw - 48px))` — editorial, not full-bleed marketing.
- **Chrome / metadata rail:** fixed inset grid — brand top-left, time top-right, stage/cursor/scroll bottom.
- **Slide threshold:** `floor(progress × slideCount)` — discrete jumps, not continuous morph.
- **CTA section:** `min-height: 100vh`, left-aligned panel, border-top separator.
- **Pinned fade:** opacity 0 after 78% scroll progress; CTA takes over.

## Depth & Elevation

Two levels only:

- **Flat (0):** default — borders, not shadows.
- **Atmosphere (ambient):** radial glow + grid + quiet cursor field canvas — never obscures text.

No glassmorphism, no neumorphism, no backdrop-blur cards. Squircle/capsule signals craft on
chips and CTA only — do not decorate everything.

## Do's and Don'ts

- ✅ Metadata enhances aesthetic (time, cursor, stage index, scroll %).
- ✅ Restrained slide transitions — opacity + translateY, word stagger ≤ 32ms.
- ✅ Respect `prefers-reduced-motion` — cut particle count, shorten transitions.
- ✅ OKLCH for all theme and slide atmosphere shifts.
- ✅ Keep Carapace narrative slides (8 stages + CTA).
- ❌ No Inter/sky-violet SaaS gradient aesthetic.
- ❌ No bouncy spring animations or heavy particle systems.
- ❌ No overusing squircle masks on every element.
- ❌ No generic "craft and innovation" filler copy.
- ❌ No copying haoqi.design layout verbatim — extract the framework.

## Responsive Behavior

- **Desktop ≥ 720px:** full metadata rail, slide rail left, theme toggle visible.
- **Phone < 720px:** hide secondary metadata and slide rail; hero type scales via clamp.
- **Reduced motion:** disable grid drift, cut field particles to ~18, transitions → 0.01ms.

## Agent Prompt Guide

When iterating this hero in [Open Design](https://github.com/nexu-io/open-design):

1. Read this `DESIGN.md` and paste `tokens.css` `:root` into the artifact's first `<style>`.
2. Preserve the pseudo-scroll mechanic: tall `.hero-stage`, pinned `.slide-content`, threshold slides.
3. Reference tokens via `var(--name)` — do not invent hex outside `:root`.
4. Use `@wenhaoqi/wasm_design_utils` for `oklch2rgb_rel`, `getCapsule` on chips and CTA.
5. Critique against haoqi.design *patterns* (mono spine, metadata rail, quiet motion) not pixels.
6. Export as single-file HTML artifact; preview in sandboxed iframe.
7. Each iteration should change one axis: type, atmosphere, motion, or content — not all at once.

## Site-wide rollout (live repo)

### Page priorities

| Phase | Route | Status | Notes |
|-------|-------|--------|-------|
| 1 | `index.html` | Shipped | Scroll hero (`assets/hero-home.js/css`), CTA → `business.html#contact`, advantages grid below |
| 2 | `business.html` | Shipped | Craft head contract; layout in `pages.css` + photo scrims in `pages-craft.css` |
| 3 | `solutions.html` | Shipped | Editorial infographics; headline "Keep leads and clients from slipping" preserved |
| 4 | `about.html` | Shipped | Documentary layout; hero photo + craft tokens |
| 5 | `licensing.html` | Shipped | Two-column hero; document groups |
| 6 | `cortex.html` | Shipped | Inline CSS removed; `.page-cortex` rules in `pages-craft.css` |
| 7 | `carapace.html` | Shipped | Software overview; unified craft stack |
| — | `ideas/*` | Unchanged | Pitch deck standalone artifacts |

### Shared craft layer (`assets/site.css`)

- OKLCH tokens from `tokens.css` merged into `:root` with legacy aliases (`--text` → `--fg`, etc.)
- IBM Plex Mono spine for all routes
- Borders not glass: no `backdrop-filter` on nav/cards
- Accent CTA buttons (not copper gradient)
- Light/dark via `[data-theme]` on `<html>` (home hero toggles; other pages default dark)

### Verification markers

- Home: `#hero-stage`, `#slide-content`, `#cta-link[href*="business.html#contact"]`
- Copy: "Own Your Intelligence", "Book the Discovery Sprint", "Carapace", "Cortex"
- Reduced motion: `prefers-reduced-motion` gates hero particles and transitions
- Serve over HTTP (not `file://`) for ESM + WASM in `hero-home.js`