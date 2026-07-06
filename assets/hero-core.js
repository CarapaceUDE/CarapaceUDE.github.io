import { init, oklch2rgb_rel, getCapsule } from "https://esm.sh/@wenhaoqi/wasm_design_utils@0.2.0";
import { HeroTextAnime } from "./text-anime.js";
import { AnimeEffectsField } from "./effects-anime.js";
import { HeroChipInteractions } from "./chip-interactions.js";
import { HeroInsertCursor } from "./hero-insert-cursor.js";
import { fitHeroSlideCopy } from "./hero-title-fit.js";
import { INTERACTIVE_EFFECTS } from "./effects-goal-contract.js";
import { clickAllowed, isEmptyHeroClick } from "./effects-interaction.js";

export { PILOT_NOTE_DISCLAIMER } from "./hero-constants.js";

function smoothstep(edge0, edge1, x) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function scrollMetrics(slideCount) {
  const slideSpan = slideCount;
  const fadeStart = (slideCount - 0.28) / slideSpan;
  return { slideSpan, fadeStart };
}

function pinnedFadeT(progress, fadeStart) {
  const raw = (progress - fadeStart) / (1 - fadeStart);
  const t = Math.min(1, Math.max(0, raw * 2.4));
  return t * t;
}

/**
 * Shared scroll-pinned hero initializer for all routes.
 * @param {{ slides: object[], pageClass?: string, stageHeight?: number, ctaSectionId?: string }} options
 */
export function initScrollHero({ slides, pageClass, stageHeight, ctaSectionId = "cta-section" }) {
  const stage3d = document.getElementById("stage-3d");
  const slideContent = document.getElementById("slide-content");
  const pinned = document.getElementById("pinned");
  const slideRail = document.getElementById("slide-rail");
  const scrollHint = document.getElementById("scroll-hint");
  const metaStage = document.getElementById("meta-stage");
  const metaCursor = document.getElementById("meta-cursor");
  const metaScroll = document.getElementById("meta-scroll");
  const metaTime = document.getElementById("meta-time");
  const grid = document.getElementById("grid");
  const atmosphere = document.getElementById("atmosphere");
  const themeToggle = document.getElementById("theme-toggle");
  const themeLabel = document.getElementById("theme-label");
  const fieldCanvas = document.getElementById("field");
  const bokehCanvas = document.getElementById("bokeh");
  const bokehLayer = document.getElementById("bokeh-layer");
  const textVeil = document.getElementById("text-veil");
  const heroStage = document.getElementById("hero-stage");
  const tailSection = ctaSectionId ? document.getElementById(ctaSectionId) : null;
  const hasTail = Boolean(tailSection);

  if (!stage3d || !slideContent || !pinned || !heroStage) return null;

  if (pageClass) document.body.classList.add(pageClass);

  const slideCount = stageHeight ?? slides.length;
  heroStage.style.setProperty("--hero-stage-height", `${slideCount * 47.5}vh`);

  let activeIndex = -1;
  let progress = 0;
  const rmMedia = window.matchMedia("(prefers-reduced-motion: reduce)");
  let prefersReducedMotion = rmMedia.matches;

  function syncReducedMotionFromMedia() {
    if (rmMedia.matches !== prefersReducedMotion) {
      applyReducedMotionPreference(rmMedia.matches);
    }
  }

  function applyReducedMotionPreference(next) {
    prefersReducedMotion = next;
    document.body.classList.toggle("reduced-motion", prefersReducedMotion);
    effectsField?.setReducedMotion(prefersReducedMotion);
    const { fadeStart } = scrollMetrics(slides.length);
    const heroPinned = progress <= fadeStart;
    const effect = slides[activeIndex]?.effect;
    const bgInteractive =
      heroPinned && !prefersReducedMotion && INTERACTIVE_EFFECTS.includes(effect);
    effectsField?.setInteraction(0, 0, bgInteractive);
    if (heroStage) heroStage.dataset.pointerHover = bgInteractive ? "true" : "false";
  }
  let width = 0;
  let height = 0;
  const slideGlowCache = new Map();
  let textAnime = null;
  let effectsField = null;
  let chipInteractions = null;
  let insertCursor = null;
  let slideRenderToken = 0;
  let wasmReady = Promise.resolve();


  slides.forEach((_, i) => {
    const dot = document.createElement("div");
    dot.className = "slide-dot";
    dot.dataset.index = String(i);
    slideRail?.appendChild(dot);
  });

  async function oklchToCss({ L, h, rel }, alpha = 1) {
    try {
      const { R, G, B } = await oklch2rgb_rel(L, h, rel);
      return alpha < 1 ? `rgba(${R}, ${G}, ${B}, ${alpha})` : `rgb(${R}, ${G}, ${B})`;
    } catch {
      return `oklch(${L} ${rel * 0.2} ${h})`;
    }
  }

  async function applySlideAtmosphere(index) {
    const slide = slides[index];
    if (!slide) return;
    let glow = slideGlowCache.get(index);
    if (!glow) {
      glow = await oklchToCss(slide.oklch, 0.14);
      slideGlowCache.set(index, glow);
    }
    document.documentElement.style.setProperty("--slide-glow", glow);
  }

  async function applySquircleChips(chips) {
    for (const chip of chips) {
      const w = Math.max(chip.offsetWidth, 48);
      const h = Math.max(chip.offsetHeight, 24);
      try {
        const d = await getCapsule(w, h, Math.min(h / 2, 14));
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", d);
        path.setAttribute("fill", "none");
        path.setAttribute("stroke", "var(--border)");
        path.setAttribute("stroke-width", "1");
        const capsule = chip.querySelector(".chip-capsule");
        if (capsule) {
          capsule.setAttribute("viewBox", `0 0 ${w} ${h}`);
          capsule.setAttribute("preserveAspectRatio", "none");
          capsule.replaceChildren(path);
        }
      } catch { /* CSS fallback */ }
    }
  }

  async function renderSlide(index) {
    const s = slides[index];
    if (!s || !textAnime) return;
    insertCursor?.onSlideChange();
    const token = ++slideRenderToken;
    if (metaStage && !insertCursor?.isMetaLocked("meta-stage")) {
      metaStage.textContent = `${String(index + 1).padStart(2, "0")} / ${String(slides.length).padStart(2, "0")}`;
    }
    slideRail?.querySelectorAll(".slide-dot").forEach((dot, i) => {
      dot.classList.toggle("is-active", i === index);
    });
    await wasmReady;
    await applySlideAtmosphere(index);
    effectsField?.setHue(s.oklch?.h ?? 210);
    if (atmosphere) {
      atmosphere.dataset.interactive = INTERACTIVE_EFFECTS.includes(s.effect) ? "true" : "false";
    }
    const chips = await textAnime.showSlide(s, index);
    if (token !== slideRenderToken) return;
    await wasmReady;
    applySquircleChips(chips);
    chipInteractions?.bind(slideContent.querySelector(".proof-row"));
    scheduleSlideCopyFit();
  }

  function scheduleSlideCopyFit() {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => fitHeroSlideCopy(slideContent));
    });
  }

  function updateBokehIntensity(intensity) {
    const i = intensity ?? 0.3;
    const light = document.documentElement.dataset.theme === "light";
    const scale = light ? 0.5 : 1;
    document.documentElement.style.setProperty("--bokeh-opacity", String((0.22 + i * 0.28) * scale));
    document.documentElement.style.setProperty("--veil-opacity", String((0.38 + i * 0.22) * scale));
  }

  function resizeField() {
    width = window.innerWidth;
    height = window.innerHeight;
    effectsField?.resize(width, height);
  }

  async function applyCtaCapsule() {
    const link = document.getElementById("cta-link");
    if (!link) return;
    const w = link.offsetWidth;
    const h = link.offsetHeight;
    try {
      const d = await getCapsule(w, h, h / 2);
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.classList.add("capsule-bg");
      svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
      svg.setAttribute("preserveAspectRatio", "none");
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", d);
      path.setAttribute("fill", "var(--cta-gold)");
      svg.appendChild(path);
      link.querySelector("svg.capsule-bg")?.remove();
      link.prepend(svg);
    } catch { /* solid fallback */ }
  }

  function onSlideChange(index) {
    if (index === activeIndex) return;
    activeIndex = index;
    renderSlide(index);
  }

  function updateScroll() {
    const stage = document.getElementById("hero-stage");
    if (!stage) return;
    const stageRect = stage.getBoundingClientRect();
    const stageTop = -stageRect.top;
    const stageHeightPx = stage.offsetHeight - window.innerHeight;
    progress = Math.min(Math.max(stageTop / (stageHeightPx || 1), 0), 1);

    const { slideSpan, fadeStart } = scrollMetrics(slides.length);
    const floatIdx = progress * slideSpan;
    const idx = Math.min(slides.length - 1, Math.floor(floatIdx));
    const frac = floatIdx - idx;
    const nextIdx = Math.min(idx + 1, slides.length - 1);

    onSlideChange(idx);

    effectsField?.setScrollFrac(prefersReducedMotion ? 1 : frac);

    if (prefersReducedMotion) {
      effectsField?.setMixTarget(slides[idx].effect, slides[idx].effect, 0);
      updateBokehIntensity(slides[idx].bokeh ?? 0.3);
      effectsField?.setIntensity(slides[idx].bokeh ?? 0.3);
    } else if (idx < slides.length - 1 && frac > 0.3) {
      const mix = smoothstep(0.3, 0.96, frac);
      effectsField?.setMixTarget(slides[idx].effect, slides[nextIdx].effect, mix);
      const bokehLerp = (slides[idx].bokeh ?? 0.3) * (1 - mix) + (slides[nextIdx].bokeh ?? 0.3) * mix;
      updateBokehIntensity(bokehLerp);
      effectsField?.setIntensity(bokehLerp);
    } else {
      effectsField?.setMixTarget(slides[idx].effect, slides[idx].effect, 0);
      updateBokehIntensity(slides[idx].bokeh ?? 0.3);
      effectsField?.setIntensity(slides[idx].bokeh ?? 0.3);
    }

    if (metaScroll && !insertCursor?.isMetaLocked("meta-scroll")) {
      metaScroll.textContent = `${Math.round(progress * 100)}%`;
    }

    const fadeLayers = (t) => {
      const opacity = String(1 - t);
      pinned.style.opacity = opacity;
      pinned.style.pointerEvents = t > 0.5 ? "none" : "auto";
      if (atmosphere) atmosphere.style.opacity = opacity;
      if (bokehLayer) bokehLayer.style.opacity = opacity;
      if (textVeil) textVeil.style.opacity = opacity;
      if (slideRail) slideRail.style.opacity = opacity;
      scrollHint?.classList.toggle("is-hidden", t > 0.08);
    };

    const resetLayers = () => {
      pinned.style.opacity = "1";
      pinned.style.pointerEvents = "auto";
      if (atmosphere) atmosphere.style.opacity = "1";
      if (bokehLayer) bokehLayer.style.opacity = "1";
      if (textVeil) textVeil.style.opacity = "";
      if (slideRail) slideRail.style.opacity = "1";
      scrollHint?.classList.toggle("is-hidden", progress > 0.04);
    };

    if (hasTail && progress > fadeStart) {
      fadeLayers(pinnedFadeT(progress, fadeStart));
    } else if (hasTail) {
      resetLayers();
    } else {
      scrollHint?.classList.toggle("is-hidden", progress > 0.92);
    }
  }

  function updateMetaTime() {
    if (!metaTime || insertCursor?.isMetaLocked("meta-time")) return;
    metaTime.textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  }

  const THEME_COLORS = { dark: "#1a1c24", light: "#f5f6f8" };

  function syncThemeUi(theme) {
    const isLight = theme === "light";
    themeToggle?.setAttribute("aria-pressed", isLight ? "true" : "false");
    themeToggle?.setAttribute("aria-label", isLight ? "Switch to dark mode" : "Switch to light mode");
    themeToggle?.setAttribute("title", isLight ? "Switch to dark mode" : "Switch to light mode");
    if (themeLabel) themeLabel.textContent = isLight ? "Light" : "Dark";
  }

  function updateMetaThemeColor(theme) {
    const meta = document.getElementById("meta-theme-color");
    if (meta) meta.setAttribute("content", THEME_COLORS[theme] ?? THEME_COLORS.dark);
  }

  function applyTheme(theme) {
    const next = theme === "light" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    syncThemeUi(next);
    updateMetaThemeColor(next);
    try {
      localStorage.setItem("carapace-theme", next);
    } catch { /* private mode */ }
    updateBokehIntensity(slides[activeIndex]?.bokeh ?? 0.28);
  }

  function initTheme() {
    let stored = "dark";
    try {
      stored = localStorage.getItem("carapace-theme") === "light" ? "light" : "dark";
    } catch { /* private mode */ }
    applyTheme(stored);
  }

  function toggleTheme() {
    const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
    applyTheme(next);
  }

  function bindThemeToggle() {
    if (!themeToggle || themeToggle.dataset.themeBound === "1") return;
    themeToggle.dataset.themeBound = "1";
    themeToggle.addEventListener("click", toggleTheme);
  }

  async function boot() {
    if (prefersReducedMotion) document.body.classList.add("reduced-motion");
    initTheme();
    bindThemeToggle();
    window.addEventListener("carapace-theme-change", () => {
      updateBokehIntensity(slides[activeIndex]?.bokeh ?? 0.28);
    });

    wasmReady = init().catch(() => null);
    await wasmReady;

    textAnime = new HeroTextAnime(stage3d, slideContent, { reducedMotion: prefersReducedMotion });
    chipInteractions = new HeroChipInteractions({ reducedMotion: prefersReducedMotion });
    insertCursor = new HeroInsertCursor({
      reducedMotion: prefersReducedMotion,
      isHeroPinned: () => {
        const { fadeStart } = scrollMetrics(slides.length);
        return progress <= fadeStart;
      }
    });

    effectsField = new AnimeEffectsField(fieldCanvas, bokehCanvas, {
      reducedMotion: prefersReducedMotion,
      onMixChange: (mix, a, b) => {
        if (atmosphere) atmosphere.dataset.effect = mix > 0.5 ? b : a;
      }
    });

    resizeField();
    const firstEffect = slides[0]?.effect ?? "shield";
    effectsField.setMixTarget(firstEffect, firstEffect, 0);
    effectsField.setIntensity(slides[0]?.bokeh ?? 0.28);
    updateBokehIntensity(slides[0]?.bokeh ?? 0.28);
    effectsField.start();
    rmMedia.addEventListener("change", (ev) => {
      applyReducedMotionPreference(ev.matches);
      insertCursor?.setReducedMotion(ev.matches);
    });
    activeIndex = -1;
    onSlideChange(0);
    updateScroll();
    updateMetaTime();
    const timeInterval = setInterval(updateMetaTime, 1000);

    requestAnimationFrame(() => applyCtaCapsule());

    window.addEventListener("resize", () => {
      resizeField();
      applyCtaCapsule();
      scheduleSlideCopyFit();
    });

    let stageObserver = null;
    let visObserver = null;
    if (heroStage && typeof ResizeObserver !== "undefined") {
      stageObserver = new ResizeObserver(() => {
        resizeField();
        applyCtaCapsule();
        scheduleSlideCopyFit();
      });
      stageObserver.observe(heroStage);
      if (pinned) stageObserver.observe(pinned);
    }
    if (heroStage && typeof IntersectionObserver !== "undefined") {
      visObserver = new IntersectionObserver(
        (entries) => {
          const visible = entries.some((e) => e.isIntersecting && e.intersectionRatio > 0.05);
          if (visible) effectsField?.start();
          else effectsField?.stop();
        },
        { root: null, threshold: [0, 0.05, 0.2] }
      );
      visObserver.observe(heroStage);
    }
    window.addEventListener("scroll", () => {
      syncReducedMotionFromMedia();
      requestAnimationFrame(updateScroll);
    }, { passive: true });
    const onPointerDown = (e) => {
      if (e.button !== 0) return;
      syncReducedMotionFromMedia();
      const { fadeStart } = scrollMetrics(slides.length);
      const heroPinned = progress <= fadeStart;
      const ctx = { pinned: heroPinned, reducedMotion: prefersReducedMotion, heroStage };
      if (!clickAllowed(ctx)) return;
      if (!isEmptyHeroClick(e.clientX, e.clientY, ctx)) return;
      effectsField?.triggerClick(e.clientX, e.clientY);
    };
    window.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("mousemove", (e) => {
      syncReducedMotionFromMedia();
      if (metaCursor && !insertCursor?.isMetaLocked("meta-cursor")) {
        metaCursor.textContent = `${e.clientX}, ${e.clientY}`;
      }
      const nx = width ? e.clientX / width - 0.5 : 0;
      const ny = height ? e.clientY / height - 0.5 : 0;
      if (grid) {
        grid.style.setProperty("--grid-x", `${nx * 14}px`);
        grid.style.setProperty("--grid-y", `${ny * 10}px`);
      }
      const glow = document.querySelector(".atmosphere-glow");
      if (glow) {
        glow.style.setProperty("--glow-x", `${50 + nx * 8}%`);
        glow.style.setProperty("--glow-y", `${38 + ny * 6}%`);
      }
      effectsField?.setPointerNorm(nx * 2, ny * 2);

      const { fadeStart } = scrollMetrics(slides.length);
      const heroPinned = progress <= fadeStart;
      const effect = slides[activeIndex]?.effect;
      const bgInteractive =
        heroPinned && !prefersReducedMotion && INTERACTIVE_EFFECTS.includes(effect);
      effectsField?.setInteraction(e.clientX, e.clientY, bgInteractive);
      if (heroStage) heroStage.dataset.pointerHover = bgInteractive ? "true" : "false";
    });
    return {
      dispose: () => {
        clearInterval(timeInterval);
        window.removeEventListener("pointerdown", onPointerDown, true);
        stageObserver?.disconnect();
        visObserver?.disconnect();
        chipInteractions?.dispose();
        insertCursor?.dispose();
        effectsField?.stop();
      }
    };
  }

  return boot();
}