import { initScrollHero } from "../../assets/hero-core.js";

const stub = (effect) => ({
  eyebrow: "Draw smoke",
  title: effect,
  sub: "Harness archive slide for legacy effect draw tests.",
  note: "",
  proof: [],
  oklch: { L: 0.5, h: 210, rel: 0.3 },
  effect,
  bokeh: 0.3
});

export const HERO_SLIDES = [
  stub("pcb"),
  stub("weave"),
  stub("flowchart"),
  stub("schematic"),
  stub("vault"),
  stub("glyph")
];

if (document.getElementById("hero-stage")) {
  initScrollHero({ slides: HERO_SLIDES, pageClass: "page-archive" });
}
