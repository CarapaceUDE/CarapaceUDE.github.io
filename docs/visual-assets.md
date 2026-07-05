# Visual Assets Manifest

_Last updated: 2026-07-05_

## Decision: procedural fallback

After searching CC0/MIT SVG schematics and low-poly glTF chip/PCB assets, no candidate met all acceptance criteria (wireframe style, <50KB SVG / <150KB glTF, OKLCH-tintable, commercial-safe license with clear attribution).

**Phase 1 ships procedural canvas effects only** (`flowchart`, `pcb`, `topology`, `pipeline`, `constellation`, `vault`, `schematic` in `assets/effects-anime.js`). The `schematic` effect provides a blueprint grid with dimension ticks on Cortex slide 2. Static SVG `#schematic-layer` and `assets/schematics/` remain Phase 2.

## Search log

| Query | Result | License | Verdict |
|-------|--------|---------|---------|
| `site:commons.wikimedia.org circuit board svg wireframe` | Various PCB photos/vectors | Mixed CC-BY | Rejected — too photorealistic or oversized |
| `github pcb svg wireframe` | OSS icon sets | MIT/CC | Rejected — trademarked part silhouettes, poor veil compositing |
| `site:sketchfab.com CC0 chip glb` | Low-poly SoC models | CC0 | Rejected — >150KB, needs three.js (Phase 2) |

## Integration path (Phase 2)

If a suitable asset is found later:

- **SVG schematic** → static `#schematic-layer` behind `#field` on Cortex slide 2
- **glTF wireframe** → optional ambient rotation via three.js CDN

Record new assets here before adding to `assets/schematics/` or `assets/models/`.