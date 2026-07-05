import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = resolve(root, "scripts/effects-hero-harness");
mkdirSync(outDir, { recursive: true });

const ROUTES = [
  { src: "index.html", hero: "hero-home.js", pageClass: "page-home" },
  { src: "about.html", hero: "hero-about.js", pageClass: "page-about" },
  { src: "business.html", hero: "hero-business.js", pageClass: "page-business" },
  { src: "licensing.html", hero: "hero-licensing.js", pageClass: "page-licensing" },
  { src: "solutions.html", hero: "hero-solutions.js", pageClass: "page-solutions" },
  { src: "cortex.html", hero: "hero-cortex.js", pageClass: "page-cortex" }
];

function rewriteHtml(html, heroModule) {
  return html
    .replace(/href="assets\//g, 'href="../../assets/')
    .replace(/src="assets\//g, 'src="../../assets/')
    .replace(/src="assets\/site\.js/g, 'src="../../assets/site.js')
    .replace(
      /<script type="module" src="[^"]*hero-[^"]+\.js[^"]*"><\/script>/,
      `<script type="module" src="../../assets/${heroModule}?v=20260705c"></script>`
    );
}

for (const { src, hero } of ROUTES) {
  const html = readFileSync(resolve(root, src), "utf8");
  writeFileSync(resolve(outDir, src), rewriteHtml(html, hero));
}

const archiveHero = `import { initScrollHero } from "../../assets/hero-core.js";

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
`;

writeFileSync(resolve(outDir, "hero-archive.js"), archiveHero);

const archiveHtml = `<!doctype html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Effects harness archive</title>
  <link rel="stylesheet" href="../../assets/site.css?v=20260705c" />
  <link rel="stylesheet" href="../../assets/hero-home.css?v=20260705c" />
</head>
<body class="page-archive">
  <div class="atmosphere" id="atmosphere" data-effect="pcb" aria-hidden="true">
    <div class="atmosphere-glow"></div>
    <div class="atmosphere-grid" id="grid"></div>
    <canvas id="field"></canvas>
  </div>
  <div class="bokeh-layer" id="bokeh-layer" aria-hidden="true"><canvas id="bokeh"></canvas></div>
  <div class="text-veil" id="text-veil" aria-hidden="true"></div>
  <div class="hero-chrome">
    <div class="chrome-bottom">
      <div class="meta-block left"><span class="meta-label">Stage</span><span class="meta-value" id="meta-stage">01 / 06</span></div>
    </div>
  </div>
  <main id="top">
    <section class="hero-stage" id="hero-stage">
      <div class="pinned" id="pinned">
        <div class="stage-3d" id="stage-3d">
          <article class="slide-content" id="slide-content" aria-live="polite">
            <div class="eyebrow text-el" data-layer="eyebrow">Draw smoke</div>
            <h1 class="title-block"><span class="title-word" data-word="0">Archive</span></h1>
          </article>
        </div>
      </div>
    </section>
    <section class="hero-cta-section" id="cta-section">
      <div class="cta-panel"><h2>Archive harness</h2></div>
    </section>
  </main>
  <script type="module" src="./hero-archive.js?v=20260705c"></script>
</body>
</html>
`;

writeFileSync(resolve(outDir, "archive.html"), archiveHtml);
console.log(`Wrote ${outDir} (${ROUTES.length + 1} pages)`);