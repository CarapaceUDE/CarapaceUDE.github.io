/**
 * AnimeEffectsField — canvas effects driven by anime.js v4
 */
import { animate, createTimer, createTimeline, stagger } from "https://esm.sh/animejs@4.0.2";
import { Delaunay } from "https://esm.sh/d3-delaunay@6";
import {
  counterSpeedBoost,
  hoverAllowed,
  pointerNormX,
  pointerXY,
  proximity,
  rowProximity
} from "./effects-interaction.js";
import { CLICK_COOLDOWN_MS, dispatchClick, drawClickPulses } from "./effects-click.js";

const MATRIX_CHARS = "01アイウエオカキクケコ∞∆∑λ#%&@<>{}[]";
const GLITCH_CHARS = "█▓▒░╳╱╲│─┼<>[]{}#@$%&01";
const TERM_LINES = [
  "cortex init --private",
  "layer.connect(workflows)",
  "auth.verify(local)",
  "stream.ingest(knowledge)",
  "route.automate(handoff)",
  "vault.seal(tenant_data)"
];

const HASHWAVE_CHARS = "#[]{}01λ∆";
const PHASE2_IDS = new Set([
  "hexpulse",
  "parcel",
  "hashwave",
  "branch",
  "telemetry",
  "trace",
  "checksum",
  "cellscan",
  "beacon",
  "lattice",
  "filament"
]);

/** Scroll-sync RM probes — draw once per composition, then hold pixels stable. */
const RM_FROZEN_DRAW_IDS = new Set(["telemetry", "trace", "checksum"]);

function hexCellXY(col, row, size, cx, cy, cols, rows) {
  const x = cx + (col - (cols - 1) / 2) * size * 1.5;
  const y = cy + (row - (rows - 1) / 2) * size * Math.sqrt(3) + (col % 2 ? size * 0.866 : 0);
  return { x, y };
}

/** Radial/elliptical backgrounds — scale from max edge so motifs fill and may bleed on narrow viewports. */
function bgExtent(w, h, factor = 0.58) {
  return Math.max(w, h) * factor;
}

/** Isometric / diamond grid span — favor width coverage with mild vertical bias. */
function bgGridSpan(w, h) {
  return Math.max(w * 0.96, h * 0.52, Math.min(w, h) * 0.86);
}

function spreadNorm(v, factor = 1.14) {
  return 0.5 + (v - 0.5) * factor;
}

/** Resize-time Delaunay edges for cellscan (compute-only, no D3 animation runtime). */
function buildCellscanEdges(sites) {
  if (sites.length < 2) return [];
  const coords = new Float64Array(sites.length * 2);
  sites.forEach((site, i) => {
    coords[i * 2] = site.x;
    coords[i * 2 + 1] = site.y;
  });
  const delaunay = Delaunay.from(coords);
  const seen = new Set();
  const edges = [];
  for (let i = 0; i < sites.length; i++) {
    for (const j of delaunay.neighbors(i)) {
      if (j <= i) continue;
      const key = `${i}-${j}`;
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push({ a: i, b: j, key, alpha: 0.35 });
    }
  }
  return edges.slice(0, 40);
}

function drawHexPath(c, x, y, r) {
  c.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    const px = x + Math.cos(a) * r;
    const py = y + Math.sin(a) * r;
    if (i === 0) c.moveTo(px, py);
    else c.lineTo(px, py);
  }
  c.closePath();
}

function rnd(a, b) {
  return a + Math.random() * (b - a);
}

function readToken(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function colorAtHue(h, alpha, chroma = 0.12, lightness = 0.78) {
  const el = document.createElement("span");
  el.style.color = `color-mix(in oklch, oklch(${lightness} ${chroma} ${h}) ${Math.round(alpha * 100)}%, transparent)`;
  document.documentElement.appendChild(el);
  const resolved = getComputedStyle(el).color;
  el.remove();
  return resolved;
}

function isLightTheme() {
  return document.documentElement.dataset.theme === "light";
}

function effectPalette() {
  if (isLightTheme()) {
    return { fillL: 0.4, fillC: 0.11, glowL: 0.52, bokehL: 0.62, vignetteL: 0.97 };
  }
  return { fillL: 0.78, fillC: 0.12, glowL: 0.65, bokehL: 0.68, vignetteL: 0 };
}

function vignetteColor(lightness, alpha) {
  return `oklch(${lightness} 0 0 / ${alpha})`;
}

export class AnimeEffectsField {
  constructor(fieldCanvas, bokehCanvas, options = {}) {
    this.canvas = fieldCanvas;
    this.bokehCanvas = bokehCanvas;
    this.ctx = fieldCanvas.getContext("2d", { alpha: true });
    this.bctx = bokehCanvas.getContext("2d", { alpha: true });
    this.reducedMotion = options.reducedMotion ?? false;
    this.width = 0;
    this.height = 0;
    this.hue = 210;
    this.intensity = 0.3;
    this.effectA = "shield";
    this.effectB = "shield";
    this.mix = { value: 0 };
    this.states = {};
    this.loops = [];
    this.bokehOrbs = [];
    this.pointer = { nx: 0, ny: 0 };
    this.pointerTarget = { nx: 0, ny: 0 };
    this.interaction = { hover: false, px: 0, py: 0 };
    this.scrollFrac = 0;
    this._lastClickAt = 0;
    this.onMixChange = options.onMixChange ?? null;
    this._rmNeedsRedraw = true;

    this.renderTimer = createTimer({
      duration: 60000,
      loop: true,
      frameRate: this.reducedMotion ? 30 : 60,
      autoplay: false,
      onUpdate: () => this._draw()
    });
  }

  cx() {
    return this.width / 2;
  }

  cy() {
    return this.height / 2;
  }

  setReducedMotion(v) {
    if (this.reducedMotion === v) return;
    this.reducedMotion = v;
    const effectA = this.effectA;
    const effectB = this.effectB;
    const mixVal = this.mix?.value ?? 0;
    this.states = {};
    this._killLoops();
    this._initBokeh();
    this.ensureEffect(effectA);
    if (effectB !== effectA) this.ensureEffect(effectB);
    if (this.mix) this.mix.value = mixVal;
    const fps = this.reducedMotion ? 30 : 60;
    if (this.renderTimer?.frameRate !== fps) {
      this.renderTimer.frameRate = fps;
    }
    this._rmNeedsRedraw = true;
    this._draw();
  }

  _drawableCount(id, state) {
    if (!state) return 0;
    if (id === "isograph") return (state.cols ?? 0) * (state.rows ?? 0);
    if (id === "hexpulse") return state.cells?.length ?? 0;
    if (id === "hashwave") return state.glyphs?.length ?? 0;
    if (id === "cellscan") return state.sites?.length ?? 0;
    if (id === "glyph") return state.fragments?.length ?? 0;
    if (id === "cascade") return state.columns?.length ?? 0;
    if (id === "mesh") return state.nodes?.length ?? 0;
    return 0;
  }

  _syncDrawableTelemetry(id, state) {
    const hero = document.getElementById("hero-stage");
    if (!hero) return;
    const n = this._drawableCount(id, state);
    if (n > 0) {
      hero.dataset.drawableCount = String(n);
      hero.dataset.drawableEffect = id;
    }
  }

  _syncClickTelemetry(id, state) {
    const hero = document.getElementById("hero-stage");
    if (!hero || !state) return;
    hero.dataset.clickPulseCount = String(state.clickPulses?.length ?? 0);
    hero.dataset.clickGlowBoost = String(state.clickFx?.glowBoost ?? 0);
    if (id === "trace") {
      const flash = state.clickSegFlash ?? [];
      hero.dataset.clickSegFlashMax = String(Math.max(0, ...flash));
      delete hero.dataset.clickKnotAlphaMax;
      return;
    }
    delete hero.dataset.clickSegFlashMax;
    if (id === "filament") {
      const knots = state.clickKnots ?? [];
      const alphaMax = knots.reduce((m, k) => Math.max(m, k.alpha ?? 0), 0);
      hero.dataset.clickKnotAlphaMax = String(alphaMax);
      return;
    }
    delete hero.dataset.clickKnotAlphaMax;
  }

  setHue(h) {
    this.hue = h ?? 210;
  }

  setIntensity(v) {
    this.intensity = v ?? 0.3;
  }

  setScrollFrac(frac) {
    this.scrollFrac = frac ?? 0;
  }

  setPointerNorm(nx, ny) {
    this.pointerTarget.nx = nx ?? 0;
    this.pointerTarget.ny = ny ?? 0;
  }

  setInteraction(clientX, clientY, hover = false) {
    const rect = this.canvas?.getBoundingClientRect?.();
    if (rect) {
      this.interaction.px = (clientX ?? 0) - rect.left;
      this.interaction.py = (clientY ?? 0) - rect.top;
    } else {
      this.interaction.px = clientX ?? 0;
      this.interaction.py = clientY ?? 0;
    }
    this.interaction.hover = Boolean(hover);
  }

  _clientToCanvas(clientX, clientY) {
    const rect = this.canvas?.getBoundingClientRect?.();
    if (!rect) return { x: clientX ?? 0, y: clientY ?? 0 };
    return { x: (clientX ?? 0) - rect.left, y: (clientY ?? 0) - rect.top };
  }

  triggerClick(clientX, clientY) {
    if (this.reducedMotion) return;
    const now = performance.now();
    if (now - this._lastClickAt < CLICK_COOLDOWN_MS) return;
    this._lastClickAt = now;
    const { x, y } = this._clientToCanvas(clientX, clientY);
    const mix = this.mix?.value ?? 0;
    const primary = mix < 0.5 ? this.effectA : this.effectB;
    this._dispatchClick(primary, x, y);
  }

  _dispatchClick(id, x, y) {
    if (!id) return;
    const state = this.ensureEffect(id);
    dispatchClick(this, id, state, x, y);
  }

  _proximity(x, y, radius = 160) {
    return proximity(this.interaction, this.reducedMotion, x, y, radius);
  }

  _hoverAllowed() {
    return hoverAllowed(this.interaction, this.reducedMotion);
  }

  _glitchString(str, intensity) {
    if (intensity <= 0 || this.reducedMotion) return str;
    return str
      .split("")
      .map((ch) => {
        if (ch === " " || ch === ">" || ch === "[") return ch;
        if (Math.random() < 0.035 + intensity * 0.24) {
          return GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
        }
        return ch;
      })
      .join("");
  }

  _cascadeIsLive(mix) {
    return (
      (this.effectA === "cascade" && mix < 0.995) ||
      (this.effectB === "cascade" && mix > 0.005)
    );
  }

  _setCascadeGlitch(entry, frames, strength = 1) {
    entry.display = GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
    entry.glitchT = Math.max(entry.glitchT, Math.round(frames));
    entry.ox = rnd(-3, 3) * strength;
    entry.oy = rnd(-2, 2) * strength;
  }

  _updateCascade(state) {
    if (this.reducedMotion || !state?.columns) return;

    const { px: mx, py: my, hover } = this.interaction;

    state.burstCd = (state.burstCd ?? 50) - 1;
    if (state.burstCd <= 0) {
      state.burstCd = 45 + Math.floor(Math.random() * 75);
      const col = state.columns[Math.floor(Math.random() * state.columns.length)];
      if (col) {
        for (let i = 0; i < col.chars.length; i++) {
          const yy = col.y - i * 16;
          if (yy < -20 || yy > this.height + 20) continue;
          if (Math.random() < 0.55) this._setCascadeGlitch(col.chars[i], 6 + Math.floor(Math.random() * 8));
        }
      }
    }

    for (const col of state.columns) {
      for (let i = 0; i < col.chars.length; i++) {
        const entry = col.chars[i];
        const yy = col.y - i * 16;
        if (yy < -24 || yy > this.height + 24) continue;

        if (entry.glitchT > 0) {
          entry.glitchT--;
          if (entry.glitchT === 0) {
            entry.display = null;
            entry.ox = 0;
            entry.oy = 0;
          }
          continue;
        }

        const dist = hover ? Math.hypot(col.x - mx, yy - my) : Infinity;
        const near = dist < 120;
        if (near && Math.random() < 0.32) {
          this._setCascadeGlitch(entry, 8 + Math.floor(Math.random() * 10), 1.2);
        } else if (Math.random() < 0.014) {
          this._setCascadeGlitch(entry, 4 + Math.floor(Math.random() * 6));
        }
      }
    }
  }

  _lerpPointer() {
    const t = this.reducedMotion ? 1 : 0.09;
    this.pointer.nx += (this.pointerTarget.nx - this.pointer.nx) * t;
    this.pointer.ny += (this.pointerTarget.ny - this.pointer.ny) * t;
  }

  _pointerOffset(scale = 1) {
    return {
      x: this.pointer.nx * 28 * scale,
      y: this.pointer.ny * 20 * scale
    };
  }

  _pointerXY(fallbackX, fallbackY) {
    return pointerXY(this.interaction, this.reducedMotion, fallbackX, fallbackY);
  }

  start() {
    this.renderTimer.play();
  }

  stop() {
    this.renderTimer.pause();
  }

  _killLoops() {
    this.loops.forEach((a) => a.pause?.());
    this.loops = [];
  }

  resize(w, h) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = w;
    this.height = h;
    [this.canvas, this.bokehCanvas].forEach((c) => {
      c.width = Math.floor(w * dpr);
      c.height = Math.floor(h * dpr);
      c.style.width = `${w}px`;
      c.style.height = `${h}px`;
    });
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.bctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.states = {};
    this._killLoops();
    this._initBokeh();
    this.ensureEffect(this.effectA);
    if (this.effectB !== this.effectA) this.ensureEffect(this.effectB);
    this._rmNeedsRedraw = true;
  }

  setMixTarget(effectA, effectB, targetMix) {
    const mixVal = this.mix?.value ?? 0;
    if (
      this.effectA === effectA &&
      this.effectB === effectB &&
      Math.abs(mixVal - targetMix) < 1e-5
    ) {
      return;
    }
    this.effectA = effectA;
    this.effectB = effectB;
    this.ensureEffect(effectA);
    if (effectB !== effectA) this.ensureEffect(effectB);
    this._rmNeedsRedraw = true;
    if (this.reducedMotion) {
      this.mix.value = targetMix;
      this.onMixChange?.(targetMix, effectA, effectB);
      return;
    }
    animate(this.mix, {
      value: targetMix,
      duration: 720,
      ease: "outCubic",
      onUpdate: () => this.onMixChange?.(this.mix.value, this.effectA, this.effectB)
    });
  }

  ensureEffect(id) {
    if (!id || this.states[id]) return this.states[id];
    const state = this._createState(id);
    this.states[id] = state;
    this._bootLoops(id, state);
    return state;
  }

  _track(anim) {
    this.loops.push(anim);
    return anim;
  }

  _createState(id) {
    const w = this.width;
    const h = this.height;
    const n = this.reducedMotion ? 24 : 52;
    const cols = Math.min(80, Math.max(8, Math.floor(w / 26)));

    if (id === "shield") {
      return {
        rings: [0.22, 0.34, 0.46, 0.58].map((r, i) => ({
          r,
          rot: 0,
          pulse: 1,
          w: 1.4 + i * 0.45,
          dots: 12 + i * 4
        })),
        sparks: Array.from({ length: n }, () => ({
          a: Math.random() * Math.PI * 2,
          r: rnd(0.12, 0.48),
          size: rnd(1.2, 3),
          alpha: rnd(0.25, 0.55)
        }))
      };
    }
    if (id === "cascade") {
      return {
        burstCd: 30,
        columns: Array.from({ length: cols }, (_, i) => ({
          x: i * 26 + 12,
          y: rnd(-h, 0),
          dur: rnd(2200, 5200),
          chars: Array.from({ length: rnd(6, 12) }, () => ({
            base: MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)],
            display: null,
            glitchT: 0,
            ox: 0,
            oy: 0
          }))
        }))
      };
    }
    if (id === "mesh") {
      const nodes = Array.from({ length: 24 }, () => ({
        x: rnd(w * 0.06, w * 0.94),
        y: rnd(h * 0.1, h * 0.9),
        scale: 1,
        phase: Math.random() * Math.PI * 2
      }));
      const links = [];
      nodes.forEach((a, i) =>
        nodes.forEach((b, j) => {
          if (j <= i) return;
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < Math.min(w, h) * 0.24) {
            links.push({ a: i, b: j, t: Math.random(), dur: rnd(1800, 4200) });
          }
        })
      );
      return { nodes, links };
    }
    if (id === "stack") {
      return {
        rows: Array.from({ length: 10 }, (_, i) => ({
          y: (i / 10) * h,
          x: rnd(0, w),
          dur: rnd(12000, 22000),
          text: TERM_LINES[i % TERM_LINES.length],
          counter: Math.floor(rnd(0, 999))
        }))
      };
    }
    if (id === "magnet") {
      return {
        core: { pulse: 1 },
        streams: Array.from({ length: n + 16 }, () => ({
          x: rnd(0, w),
          y: rnd(0, h),
          trail: rnd(0.3, 1),
          size: rnd(1, 2.6)
        }))
      };
    }
    if (id === "signal") {
      return {
        phase: 0,
        climb: 0,
        spikes: Array.from({ length: 14 }, () => rnd(0.2, 0.95)),
        glow: 0.5
      };
    }
    if (id === "chrono") {
      return { hand: 0, tick: 0, glow: 0.4 };
    }
    if (id === "ping") {
      return {
        sweep: 0,
        rings: [{ r: 0.1 }, { r: 0.22 }, { r: 0.38 }],
        blips: Array.from({ length: 12 }, () => ({
          a: Math.random() * Math.PI * 2,
          d: rnd(0.14, 0.42),
          scale: 0,
          alpha: 0
        }))
      };
    }
    if (id === "flowchart") {
      const boxes = [
        { x: 0.18, y: 0.32, w: 0.14, h: 0.1 },
        { x: 0.42, y: 0.32, w: 0.14, h: 0.1 },
        { x: 0.66, y: 0.32, w: 0.14, h: 0.1 },
        { x: 0.42, y: 0.58, w: 0.14, h: 0.1 }
      ];
      const edges = [[0, 1], [1, 2], [1, 3]];
      return {
        boxes,
        edges,
        packets: edges.map(() => ({ t: Math.random(), dur: rnd(2200, 3800) }))
      };
    }
    if (id === "pcb") {
      const traces = [];
      const cols = 10;
      const rows = 8;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (Math.random() > 0.55) continue;
          traces.push({
            x: c / cols,
            y: r / rows,
            h: Math.random() > 0.5,
            pulse: 1,
            phase: Math.random() * Math.PI * 2
          });
        }
      }
      return { traces, gridPulse: 0.5 };
    }
    if (id === "topology") {
      const spokes = 8;
      return {
        hub: { pulse: 1 },
        nodes: Array.from({ length: spokes }, (_, i) => ({
          a: (i / spokes) * Math.PI * 2,
          d: rnd(0.38, 0.54),
          pulse: 1,
          packet: Math.random()
        }))
      };
    }
    if (id === "pipeline") {
      const stages = 5;
      return {
        stages: Array.from({ length: stages }, (_, i) => ({
          x: 0.12 + (i / (stages - 1)) * 0.76,
          y: 0.5,
          pulse: 1,
          active: 0
        })),
        sweep: 0
      };
    }
    if (id === "constellation") {
      const nodes = Array.from({ length: 6 }, (_, i) => ({
        a: (i / 6) * Math.PI * 2 - Math.PI / 2,
        d: rnd(0.34, 0.5),
        pulse: 1,
        label: i
      }));
      const links = [];
      for (let i = 0; i < 6; i++) {
        links.push({ a: i, b: (i + 1) % 6 });
        if (i % 2 === 0) links.push({ a: i, b: (i + 3) % 6 });
      }
      return { nodes, links, glow: 0.4 };
    }
    if (id === "vault") {
      return {
        rings: [0.2, 0.32, 0.44].map((r, i) => ({ r, rot: 0, pulse: 1, w: 1.6 + i * 0.5 })),
        lock: { pulse: 1, t: 0 },
        sparks: Array.from({ length: n }, () => ({
          a: Math.random() * Math.PI * 2,
          r: rnd(0.1, 0.36),
          size: rnd(1, 2.4),
          alpha: rnd(0.2, 0.5)
        }))
      };
    }
    if (id === "schematic") {
      const blocks = [
        { x: 0.2, y: 0.3, w: 0.16, h: 0.12 },
        { x: 0.5, y: 0.3, w: 0.16, h: 0.12 },
        { x: 0.35, y: 0.56, w: 0.2, h: 0.1 }
      ];
      const dims = blocks.map((_, i) => ({
        block: i,
        axis: i % 2 === 0 ? "h" : "v",
        t: Math.random()
      }));
      return {
        blocks,
        dims,
        connections: [[0, 1], [1, 2], [0, 2]],
        gridPulse: 0.5,
        scan: 0
      };
    }
    if (id === "isograph") {
      const cols = this.reducedMotion ? 8 : 10;
      const rows = this.reducedMotion ? 5 : 8;
      return {
        cols,
        rows,
        highlight: { col: Math.floor(cols / 2), row: Math.floor(rows / 2), pulse: 1 },
        phase: 0
      };
    }
    if (id === "sonar") {
      return {
        sweep: 0,
        echoes: Array.from({ length: this.reducedMotion ? 4 : 8 }, () => ({
          a: Math.random() * Math.PI * 2,
          d: rnd(0.1, 0.42),
          r: 0,
          alpha: 0
        }))
      };
    }
    if (id === "ledger") {
      const colCount = 16;
      return {
        columns: Array.from({ length: colCount }, (_, i) => ({
          x: 0.06 + (i / (colCount - 1)) * 0.88,
          ticks: rnd(0.25, 0.95),
          counter: Math.floor(rnd(100, 9999)),
          pulse: 1
        })),
        sweep: 0
      };
    }
    if (id === "weave") {
      const threadCount = this.reducedMotion ? 14 : 22;
      return {
        hThreads: Array.from({ length: threadCount }, (_, i) => ({
          y: i / threadCount,
          offset: rnd(-0.02, 0.02),
          phase: Math.random() * Math.PI * 2
        })),
        vThreads: Array.from({ length: threadCount }, (_, i) => ({
          x: i / threadCount,
          offset: rnd(-0.02, 0.02),
          phase: Math.random() * Math.PI * 2
        }))
      };
    }
    if (id === "orbit") {
      return {
        bodies: [
          { a: 0, rx: 0.46, ry: 0.32, speed: 1, phase: 0 },
          { a: Math.PI * 0.6, rx: 0.38, ry: 0.26, speed: 1.4, phase: 1.2 },
          { a: Math.PI * 1.3, rx: 0.3, ry: 0.2, speed: 1.8, phase: 2.4 }
        ],
        foci: [{ x: -0.11, y: 0 }, { x: 0.11, y: 0 }],
        glow: 0.4
      };
    }
    if (id === "relay") {
      const stations = 6;
      return {
        stations: Array.from({ length: stations }, (_, i) => ({
          x: 0.1 + (i / (stations - 1)) * 0.8,
          pulse: 1,
          active: 0
        })),
        baton: { t: 0, from: 0, to: 1, speed: 1 }
      };
    }
    if (id === "seal") {
      return {
        ring: { r: 0.28, pulse: 1, impress: 0 },
        ripples: Array.from({ length: 4 }, (_, i) => ({ r: 0.1 + i * 0.06, alpha: 0 })),
        rot: 0
      };
    }
    if (id === "glyph") {
      const count = this.reducedMotion ? 18 : 36;
      return {
        fragments: Array.from({ length: count }, () => ({
          x: rnd(0, 1),
          y: rnd(0, 1),
          vx: rnd(-0.0008, 0.0008),
          vy: rnd(0.0004, 0.0012),
          text: `#${Math.floor(rnd(0, 65535)).toString(16)}`,
          glitchT: 0,
          display: null
        }))
      };
    }
    if (id === "hexpulse") {
      const cols = this.reducedMotion ? 9 : 12;
      const rows = this.reducedMotion ? 6 : 9;
      const size = Math.max(16, Math.min(w, h) / (Math.max(cols, rows) * 0.92));
      const cells = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          cells.push({ col: c, row: r, alpha: 0.12, scale: 1 });
        }
      }
      const mid = Math.floor(cells.length / 2);
      if (this.reducedMotion) cells[mid].alpha = 0.55;
      return { cols, rows, size, cells, anchorX: w * 0.02, anchorY: -h * 0.04 };
    }
    if (id === "parcel") {
      const stations = [
        { x: 0.12, y: 0.55 },
        { x: 0.38, y: 0.55 },
        { x: 0.38, y: 0.28 },
        { x: 0.72, y: 0.28 },
        { x: 0.72, y: 0.62 },
        { x: 0.9, y: 0.62 }
      ];
      return {
        stations,
        packets: Array.from({ length: this.reducedMotion ? 2 : 4 }, (_, i) => ({
          seg: i % (stations.length - 1),
          t: rnd(0, 1),
          speed: rnd(0.8, 1.4)
        }))
      };
    }
    if (id === "hashwave") {
      const cols = this.reducedMotion ? 14 : 22;
      const rows = this.reducedMotion ? 8 : 12;
      const glyphs = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          glyphs.push({
            col: c,
            row: r,
            ch: HASHWAVE_CHARS[Math.floor(Math.random() * HASHWAVE_CHARS.length)],
            alpha: 0.18,
            scramble: null,
            scrambleT: 0
          });
        }
      }
      return { cols, rows, wave: 0, glyphs };
    }
    if (id === "branch") {
      const nodes = [
        { x: 0.5, y: 0.22, reveal: 1 },
        { x: 0.32, y: 0.48, reveal: 1 },
        { x: 0.68, y: 0.48, reveal: 1 },
        { x: 0.22, y: 0.72, reveal: 1 },
        { x: 0.5, y: 0.72, reveal: 1 },
        { x: 0.78, y: 0.72, reveal: 1 }
      ];
      const edges = [[0, 1], [0, 2], [1, 3], [1, 4], [2, 4], [2, 5]];
      if (!this.reducedMotion) nodes.forEach((n) => { n.reveal = 0; });
      return { nodes, edges, skew: 0 };
    }
    if (id === "telemetry") {
      const tickCount = this.reducedMotion ? 6 : 10;
      const ticks = Array.from({ length: tickCount }, (_, i) => ({
        x: 0.08 + (i / (tickCount - 1)) * 0.84,
        y: 0.55,
        h: 0
      }));
      if (this.reducedMotion) ticks[tickCount - 1].h = 0.28;
      return { ticks, baseline: 0.55, glow: 0.4 };
    }
    if (id === "trace") {
      const points = [
        { x: 0.14, y: 0.62 },
        { x: 0.14, y: 0.38 },
        { x: 0.42, y: 0.38 },
        { x: 0.42, y: 0.58 },
        { x: 0.72, y: 0.58 },
        { x: 0.72, y: 0.32 },
        { x: 0.88, y: 0.32 }
      ];
      const segs = points.length - 1;
      return {
        points,
        progress: this.reducedMotion ? 1 : 0,
        segProgress: Array.from({ length: segs }, () => (this.reducedMotion ? 1 : 0)),
        clickSegFlash: Array.from({ length: segs }, () => 0),
        packetT: 0
      };
    }
    if (id === "checksum") {
      const markCount = this.reducedMotion ? 8 : 14;
      const marks = Array.from({ length: markCount }, (_, i) => ({
        x: 0.1 + (i / (markCount - 1)) * 0.8,
        alpha: this.reducedMotion ? 0.5 : 0,
        h: this.reducedMotion ? 0.08 + (i % 5) * 0.028 : rnd(0.08, 0.22)
      }));
      return { progress: this.reducedMotion ? 1 : 0, marks, barY: 0.52 };
    }
    if (id === "cellscan") {
      const siteCount = this.reducedMotion ? 10 : 16;
      const sites = Array.from({ length: siteCount }, () => ({
        x: rnd(w * 0.08, w * 0.92),
        y: rnd(h * 0.12, h * 0.88),
        bloom: 0
      }));
      return { sites, edges: buildCellscanEdges(sites), scan: 0, highlight: -1 };
    }
    if (id === "beacon") {
      const anchors = [
        { x: 0.28, y: 0.42 },
        { x: 0.62, y: 0.35 },
        { x: 0.5, y: 0.68 }
      ].map((a) => ({
        ...a,
        rings: Array.from({ length: 4 }, () => ({ r: 0, alpha: 0 }))
      }));
      return { anchors };
    }
    if (id === "lattice") {
      const layers = 3;
      return {
        layers: Array.from({ length: layers }, (_, i) => ({
          depth: i / (layers - 1),
          offsetX: 0,
          offsetY: 0,
          shear: 0.12 + i * 0.04
        })),
        cols: 12,
        rows: 8
      };
    }
    if (id === "filament") {
      const knots = [
        { x: 0.12, y: 0.5 },
        { x: 0.28, y: 0.38 },
        { x: 0.44, y: 0.55 },
        { x: 0.58, y: 0.32 },
        { x: 0.74, y: 0.48 },
        { x: 0.88, y: 0.4 }
      ];
      return { knots, t: this.reducedMotion ? 1 : 0, parallax: 0 };
    }
    return { t: 0 };
  }

  _bootLoops(id, state) {
    const slow = this.reducedMotion ? 1.8 : 1;

    if (id === "shield") {
      state.rings.forEach((ring, i) => {
        this._track(
          animate(ring, {
            rot: Math.PI * 2,
            duration: (9000 + i * 2800) * slow,
            loop: true,
            ease: "linear"
          })
        );
        this._track(
          animate(ring, {
            pulse: [1, 1.08, 1],
            duration: (2400 + i * 400) * slow,
            loop: true,
            ease: "inOutSine"
          })
        );
      });
      state.sparks.forEach((spark) => {
        this._track(
          animate(spark, {
            a: spark.a + Math.PI * 2,
            duration: rnd(6000, 12000) * slow,
            loop: true,
            ease: "linear"
          })
        );
      });
    }

    if (id === "cascade") {
      state.columns.forEach((col) => {
        const run = () => {
          col.y = rnd(-120, -20);
          this._track(
            animate(col, {
              y: this.height + 140,
              duration: col.dur * slow,
              ease: "inQuad",
              onComplete: run
            })
          );
        };
        run();
      });
    }

    if (id === "mesh") {
      state.nodes.forEach((node) => {
        this._track(
          animate(node, {
            scale: [1, 1.45, 1],
            duration: rnd(2000, 3600) * slow,
            loop: true,
            ease: "inOutSine",
            delay: rnd(0, 800)
          })
        );
      });
      state.links.forEach((link) => {
        const step = () => {
          link.t = 0;
          this._track(
            animate(link, {
              t: 1,
              duration: link.dur * slow,
              ease: "inOutSine",
              onComplete: step
            })
          );
        };
        step();
      });
    }

    if (id === "stack") {
      const span = this.width + 480;
      state.rows.forEach((row) => {
        row.x = span;
        this._track(
          animate(row, {
            x: -span,
            duration: row.dur * slow,
            loop: true,
            ease: "linear"
          })
        );
        this._track(
          animate(row, {
            counter: row.counter + 999,
            duration: row.dur * slow,
            loop: true,
            ease: "linear"
          })
        );
      });
    }

    if (id === "magnet") {
      this._track(
        animate(state.core, {
          pulse: [1, 1.35, 1],
          duration: 1800 * slow,
          loop: true,
          ease: "inOutSine"
        })
      );
      state.streams.forEach((p) => {
        const pull = () => {
          this._track(
            animate(p, {
              x: this.cx() + rnd(-8, 8),
              y: this.cy() + rnd(-8, 8),
              duration: rnd(900, 1800) * slow,
              ease: "inOut(3)",
              onComplete: () => {
                p.x = rnd(0, this.width);
                p.y = rnd(0, this.height);
                pull();
              }
            })
          );
        };
        pull();
      });
    }

    if (id === "signal") {
      this._track(
        animate(state, {
          phase: Math.PI * 2,
          duration: 4000 * slow,
          loop: true,
          ease: "linear"
        })
      );
      this._track(
        animate(state, {
          climb: -this.height * 0.35,
          duration: 14000 * slow,
          loop: true,
          ease: "linear"
        })
      );
      this._track(
        animate(state, {
          glow: [0.35, 0.85, 0.35],
          duration: 2200 * slow,
          loop: true,
          ease: "inOutSine"
        })
      );
    }

    if (id === "chrono") {
      this._track(
        animate(state, {
          hand: Math.PI * 2,
          duration: 10000 * slow,
          loop: true,
          ease: "linear"
        })
      );
      this._track(
        animate(state, {
          glow: [0.3, 0.75, 0.3],
          duration: 2600 * slow,
          loop: true,
          ease: "inOutSine"
        })
      );
    }

    if (id === "ping") {
      this._track(
        animate(state, {
          sweep: Math.PI * 2,
          duration: 5000 * slow,
          loop: true,
          ease: "linear"
        })
      );
      state.rings.forEach((ring, i) => {
        this._track(
          animate(ring, {
            r: [0.08, 0.52],
            duration: (2800 + i * 600) * slow,
            loop: true,
            ease: "outExpo",
            delay: i * 700
          })
        );
      });
      state.blips.forEach((blip) => {
        const ping = () => {
          blip.a = Math.random() * Math.PI * 2;
          blip.d = rnd(0.12, 0.4);
          blip.scale = 0;
          blip.alpha = 0;
          this._track(
            animate(blip, {
              scale: [0, 1.2, 0],
              alpha: [0, 0.9, 0],
              duration: rnd(1200, 2200) * slow,
              ease: "outExpo",
              onComplete: () => setTimeout(ping, rnd(400, 1800))
            })
          );
        };
        ping();
      });
    }

    if (id === "flowchart") {
      state.packets.forEach((pkt) => {
        const step = () => {
          pkt.t = 0;
          this._track(
            animate(pkt, {
              t: 1,
              duration: pkt.dur * slow,
              ease: "linear",
              onComplete: step
            })
          );
        };
        step();
      });
    }

    if (id === "pcb") {
      state.traces.forEach((tr) => {
        this._track(
          animate(tr, {
            pulse: [1, 1.4, 1],
            duration: rnd(1400, 2800) * slow,
            loop: true,
            ease: "inOutSine",
            delay: rnd(0, 600)
          })
        );
      });
      this._track(
        animate(state, {
          gridPulse: [0.35, 0.75, 0.35],
          duration: 3200 * slow,
          loop: true,
          ease: "inOutSine"
        })
      );
    }

    if (id === "topology") {
      this._track(
        animate(state.hub, {
          pulse: [1, 1.2, 1],
          duration: 2000 * slow,
          loop: true,
          ease: "inOutSine"
        })
      );
      state.nodes.forEach((node) => {
        this._track(
          animate(node, {
            pulse: [1, 1.35, 1],
            duration: rnd(1800, 3200) * slow,
            loop: true,
            ease: "inOutSine",
            delay: rnd(0, 800)
          })
        );
        const movePkt = () => {
          node.packet = 0;
          this._track(
            animate(node, {
              packet: 1,
              duration: rnd(2000, 3600) * slow,
              ease: "inOutSine",
              onComplete: movePkt
            })
          );
        };
        movePkt();
      });
    }

    if (id === "pipeline") {
      this._track(
        animate(state, {
          sweep: 1,
          duration: 4000 * slow,
          loop: true,
          ease: "linear"
        })
      );
      state.stages.forEach((st, i) => {
        this._track(
          animate(st, {
            pulse: [1, 1.3, 1],
            duration: 1600 * slow,
            loop: true,
            ease: "inOutSine",
            delay: i * 280
          })
        );
      });
    }

    if (id === "constellation") {
      this._track(
        animate(state, {
          glow: [0.3, 0.7, 0.3],
          duration: 2800 * slow,
          loop: true,
          ease: "inOutSine"
        })
      );
      state.nodes.forEach((node) => {
        this._track(
          animate(node, {
            pulse: [1, 1.4, 1],
            duration: rnd(2000, 3400) * slow,
            loop: true,
            ease: "inOutSine",
            delay: node.label * 120
          })
        );
      });
    }

    if (id === "vault") {
      state.rings.forEach((ring, i) => {
        this._track(
          animate(ring, {
            rot: Math.PI * 2,
            duration: (12000 + i * 2000) * slow,
            loop: true,
            ease: "linear"
          })
        );
        this._track(
          animate(ring, {
            pulse: [1, 1.06, 1],
            duration: (2200 + i * 300) * slow,
            loop: true,
            ease: "inOutSine"
          })
        );
      });
    }

    if (id === "schematic") {
      this._track(
        animate(state, {
          gridPulse: [0.28, 0.62, 0.28],
          duration: 4200 * slow,
          loop: true,
          ease: "inOutSine"
        })
      );
      this._track(
        animate(state, {
          scan: [0, 1, 0],
          duration: 7000 * slow,
          loop: true,
          ease: "inOutSine"
        })
      );
      state.dims.forEach((dim, i) => {
        this._track(
          animate(dim, {
            t: [0, 1, 0],
            duration: rnd(2200, 3600) * slow,
            loop: true,
            ease: "inOutSine",
            delay: i * 320
          })
        );
      });
    }

    if (id === "vault") {
      this._track(
        animate(state.lock, {
          pulse: [1, 1.15, 1],
          duration: 1800 * slow,
          loop: true,
          ease: "inOutSine"
        })
      );
      state.sparks.forEach((spark) => {
        this._track(
          animate(spark, {
            a: spark.a + Math.PI * 2,
            duration: rnd(5000, 10000) * slow,
            loop: true,
            ease: "linear"
          })
        );
      });
    }

    if (id === "isograph") {
      this._track(
        animate(state.highlight, {
          pulse: [1, 1.25, 1],
          duration: 2200 * slow,
          loop: true,
          ease: "inOutSine"
        })
      );
      if (!this.reducedMotion) {
        const hop = () => {
          state.highlight.col = Math.floor(Math.random() * state.cols);
          state.highlight.row = Math.floor(Math.random() * state.rows);
          this._track(
            animate(state, {
              phase: state.phase + 1,
              duration: rnd(1800, 3200) * slow,
              ease: "inOutSine",
              onComplete: hop
            })
          );
        };
        hop();
      }
    }

    if (id === "sonar") {
      this._track(
        animate(state, {
          sweep: Math.PI * 2,
          duration: 4800 * slow,
          loop: true,
          ease: "linear"
        })
      );
      if (!this.reducedMotion) {
        state.echoes.forEach((echo) => {
          const pop = () => {
            echo.a = state.sweep + rnd(-0.4, 0.4);
            echo.d = rnd(0.12, 0.4);
            echo.r = 0;
            echo.alpha = 0;
            this._track(
              animate(echo, {
                r: [0, 0.18, 0.32],
                alpha: [0, 0.7, 0],
                duration: rnd(1400, 2400) * slow,
                ease: "outExpo",
                onComplete: () => setTimeout(pop, rnd(600, 2200))
              })
            );
          };
          pop();
        });
      }
    }

    if (id === "ledger") {
      this._track(
        animate(state, {
          sweep: 1,
          duration: 5000 * slow,
          loop: true,
          ease: "linear"
        })
      );
      state.columns.forEach((col, i) => {
        this._track(
          animate(col, {
            pulse: [1, 1.2, 1],
            duration: rnd(1600, 2800) * slow,
            loop: true,
            ease: "inOutSine",
            delay: i * 90
          })
        );
        if (!this.reducedMotion) {
          this._track(
            animate(col, {
              counter: col.counter + 500,
              duration: rnd(8000, 14000) * slow,
              loop: true,
              ease: "linear"
            })
          );
        }
      });
    }

    if (id === "weave") {
      const drift = (threads, key) => {
        threads.forEach((th) => {
          this._track(
            animate(th, {
              offset: [th.offset, rnd(-0.03, 0.03), th.offset],
              duration: rnd(3000, 5200) * slow,
              loop: true,
              ease: "inOutSine",
              delay: rnd(0, 800)
            })
          );
        });
      };
      drift(state.hThreads);
      drift(state.vThreads);
    }

    if (id === "orbit") {
      this._track(
        animate(state, {
          glow: [0.3, 0.7, 0.3],
          duration: 2800 * slow,
          loop: true,
          ease: "inOutSine"
        })
      );
      state.bodies.forEach((body) => {
        this._track(
          animate(body, {
            a: body.a + Math.PI * 2,
            duration: rnd(6000, 11000) / body.speed * slow,
            loop: true,
            ease: "linear"
          })
        );
      });
    }

    if (id === "relay") {
      const handoff = () => {
        const from = state.baton.to;
        const to = (from + 1) % state.stations.length;
        state.baton.from = from;
        state.baton.to = to;
        state.baton.t = 0;
        this._track(
          animate(state.baton, {
            t: 1,
            duration: (1800 / state.baton.speed) * slow,
            ease: "inOutSine",
            onComplete: handoff
          })
        );
      };
      handoff();
      state.stations.forEach((st, i) => {
        this._track(
          animate(st, {
            pulse: [1, 1.3, 1],
            duration: 1600 * slow,
            loop: true,
            ease: "inOutSine",
            delay: i * 200
          })
        );
      });
    }

    if (id === "seal") {
      this._track(
        animate(state.ring, {
          pulse: [1, 1.08, 1],
          duration: 2400 * slow,
          loop: true,
          ease: "inOutSine"
        })
      );
      this._track(
        animate(state, {
          rot: Math.PI * 2,
          duration: 18000 * slow,
          loop: true,
          ease: "linear"
        })
      );
      if (!this.reducedMotion) {
        state.ripples.forEach((ripple, i) => {
          this._track(
            animate(ripple, {
              alpha: [0, 0.5, 0],
              duration: 3200 * slow,
              loop: true,
              ease: "inOutSine",
              delay: i * 700
            })
          );
        });
      }
    }

    if (id === "glyph") {
      if (!this.reducedMotion) {
        state.fragments.forEach((frag) => {
          const drift = () => {
            if (frag.y > 1.1) {
              frag.y = -0.05;
              frag.x = Math.random();
            }
            this._track(
              animate(frag, {
                x: frag.x + frag.vx * 400,
                y: frag.y + frag.vy * 400,
                duration: rnd(4000, 8000) * slow,
                ease: "linear",
                onComplete: drift
              })
            );
          };
          drift();
        });
      }
    }

    if (id === "hexpulse" && !this.reducedMotion) {
      this._track(
        createTimeline({ loop: true, defaults: { duration: 900, ease: "inOutSine" } }).add(state.cells, {
          alpha: [{ to: 0.08 }, { to: 0.55 }, { to: 0.08 }],
          scale: [{ to: 1 }, { to: 1.1 }, { to: 1 }],
          delay: stagger(40, { grid: [state.cols, state.rows], from: "center" })
        })
      );
    }

    if (id === "parcel" && !this.reducedMotion) {
      state.packets.forEach((pkt) => {
        const advance = () => {
          pkt.t = 0;
          pkt.seg = (pkt.seg + 1) % (state.stations.length - 1);
          this._track(
            animate(pkt, {
              t: 1,
              duration: (2200 / pkt.speed) * slow,
              ease: "inOutSine",
              onComplete: advance
            })
          );
        };
        pkt.t = rnd(0, 0.6);
        advance();
      });
    }

    if (id === "hashwave" && !this.reducedMotion) {
      this._track(
        animate(state, {
          wave: [0, state.cols, 0],
          duration: 4800 * slow,
          loop: true,
          ease: "inOutSine"
        })
      );
    }

    if (id === "branch" && !this.reducedMotion) {
      this._track(
        createTimeline({ defaults: { duration: 600, ease: "outExpo" } }).add(state.nodes, {
          reveal: 1,
          delay: stagger(120, { from: "first" })
        })
      );
    }

    if (id === "telemetry" && !this.reducedMotion) {
      this._track(
        createTimeline({ loop: true, defaults: { ease: "outExpo" } })
          .add(state.ticks, {
            h: (el, i) => 0.08 + (i / state.ticks.length) * 0.22,
            delay: stagger(10)
          })
          .add(state, { glow: [0.35, 0.65, 0.35], duration: 2400, ease: "inOutSine" }, "<")
      );
    }

    if (id === "trace" && !this.reducedMotion) {
      this._track(
        animate(state, {
          packetT: 1,
          duration: 3200 * slow,
          loop: true,
          ease: "linear"
        })
      );
    }

    if (id === "checksum" && !this.reducedMotion) {
      state.marks.forEach((mark, i) => {
        this._track(
          animate(mark, {
            alpha: [0, 0.55, 0.35],
            duration: 800 * slow,
            ease: "outExpo",
            delay: i * 30
          })
        );
      });
    }

    if (id === "cellscan" && !this.reducedMotion) {
      this._track(
        animate(state, {
          scan: 1,
          duration: 6000 * slow,
          loop: true,
          ease: "linear"
        })
      );
    }

    if (id === "beacon" && !this.reducedMotion) {
      state.anchors.forEach((anchor) => {
        this._track(
          createTimeline({ loop: true }).add(anchor.rings, {
            r: [0.04, 0.22],
            alpha: [0.5, 0],
            duration: 2200 * slow,
            ease: "outExpo",
            delay: stagger(200)
          })
        );
      });
    }

    if (id === "lattice" && !this.reducedMotion) {
      state.layers.forEach((layer, i) => {
        this._track(
          animate(layer, {
            offsetX: [0, rnd(-8, 8), 0],
            offsetY: [0, rnd(-6, 6), 0],
            duration: rnd(4000, 7000) * slow,
            loop: true,
            ease: "inOutSine",
            delay: i * 400
          })
        );
      });
    }

    if (id === "filament" && !this.reducedMotion) {
      this._track(
        animate(state, {
          t: 1,
          duration: 5000 * slow,
          loop: true,
          ease: "inOutSine"
        })
      );
    }
  }

  _initBokeh() {
    const count = this.reducedMotion ? 8 : 14;
    this.bokehOrbs = Array.from({ length: count }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 24 + Math.random() * 64,
      alpha: 0.02 + Math.random() * 0.04
    }));
    if (!this.reducedMotion) {
      this.bokehOrbs.forEach((orb) => {
        this._track(
          animate(orb, {
            x: [orb.x, rnd(0.1, 0.9), rnd(0.1, 0.9), orb.x],
            y: [orb.y, rnd(0.1, 0.9), rnd(0.1, 0.9), orb.y],
            duration: rnd(14000, 26000),
            loop: true,
            ease: "inOutSine"
          })
        );
      });
    }
  }

  _pc(a, hue = this.hue) {
    const p = effectPalette();
    return colorAtHue(hue, a, p.fillC, p.fillL);
  }

  _lc(a, hue = this.hue) {
    const p = effectPalette();
    return colorAtHue(hue, a, p.fillC * 0.72, p.fillL * 0.82);
  }

  _glow(a) {
    const p = effectPalette();
    if (this.reducedMotion) {
      this.ctx.shadowBlur = 0;
      this.ctx.shadowColor = "transparent";
      this.ctx.strokeStyle = this._lc(a);
      return;
    }
    this.ctx.shadowBlur = 18;
    this.ctx.shadowColor = colorAtHue(this.hue, a, p.fillC, p.glowL);
    this.ctx.strokeStyle = this._lc(a);
  }

  _clearGlow() {
    this.ctx.shadowBlur = 0;
    this.ctx.shadowColor = "transparent";
  }

  _drawEffect(id, state, alpha) {
    if (!state || alpha <= 0.002) return;
    const { ctx: c, width: w, height: h } = this;
    const off = this._pointerOffset();
    const ox = this.cx() + off.x;
    const oy = this.cy() + off.y;

    c.save();
    c.globalAlpha = alpha;

    if (id === "shield") {
      const maxR = Math.min(w, h) * 0.5;
      state.rings.forEach((ring) => {
        this._glow(0.42 * ring.pulse);
        c.lineWidth = ring.w;
        c.beginPath();
        c.ellipse(ox, oy, maxR * ring.r * ring.pulse, maxR * ring.r * 0.68 * ring.pulse, ring.rot, 0, Math.PI * 2);
        c.stroke();
        this._clearGlow();
        for (let i = 0; i < ring.dots; i++) {
          const a = ring.rot + (i / ring.dots) * Math.PI * 2;
          c.beginPath();
          c.arc(ox + Math.cos(a) * maxR * ring.r, oy + Math.sin(a) * maxR * ring.r * 0.68, 2, 0, Math.PI * 2);
          c.fillStyle = this._pc(0.5);
          c.fill();
        }
      });
      state.sparks.forEach((s) => {
        c.beginPath();
        c.arc(ox + Math.cos(s.a) * maxR * s.r, oy + Math.sin(s.a) * maxR * s.r * 0.68, s.size, 0, Math.PI * 2);
        c.fillStyle = this._pc(s.alpha);
        c.fill();
      });
    }

    if (id === "cascade") {
      c.font = "12px IBM Plex Mono, monospace";
      for (const col of state.columns) {
        for (let i = 0; i < col.chars.length; i++) {
          const entry = col.chars[i];
          const yy = col.y - i * 16;
          if (yy < -20 || yy > h + 20) continue;
          const head = i === 0;
          const glitched = entry.glitchT > 0 && entry.display;
          const ch = glitched ? entry.display : entry.base;
          const x = col.x + (glitched ? entry.ox : 0);
          const y = yy + (glitched ? entry.oy : 0);

          if (glitched) {
            c.fillStyle = this._pc(Math.max(0.05, 0.14 - i * 0.01));
            c.fillText(entry.base, col.x, yy);
            c.fillStyle = head ? this._pc(0.98, 160) : this._pc(0.78 + Math.min(i * 0.015, 0.1));
            c.fillText(ch, x, y);
          } else {
            c.fillStyle = head ? this._pc(0.95, 160) : this._pc(Math.max(0.06, 0.65 - i * 0.04));
            c.fillText(ch, col.x, yy);
          }
        }
      }
    }

    if (id === "mesh") {
      const t = performance.now() * 0.001;
      state.links.forEach((link) => {
        const a = state.nodes[link.a];
        const b = state.nodes[link.b];
        const midX = (a.x + b.x) * 0.5;
        const midY = (a.y + b.y) * 0.5;
        const prox = this._proximity(midX, midY, 200);
        const wobble = prox * Math.sin(t * 14 + link.a * 0.7) * 3;
        const ax = a.x + wobble;
        const ay = a.y - wobble * 0.4;
        const bx = b.x - wobble;
        const by = b.y + wobble * 0.4;

        this._glow(0.32 + prox * 0.5);
        c.lineWidth = 1.1 + prox * 2.4;
        c.beginPath();
        c.moveTo(ax, ay);
        c.lineTo(bx, by);
        c.stroke();
        this._clearGlow();

        if (prox > 0.2) {
          c.strokeStyle = colorAtHue(175, 0.15 + prox * 0.25, 0.1, 0.68);
          c.lineWidth = 0.7;
          c.beginPath();
          c.moveTo(ax + 2, ay);
          c.lineTo(bx + 2, by);
          c.stroke();
        }

        const packetT = (link.t + prox * 0.04) % 1;
        const px = ax + (bx - ax) * packetT;
        const py = ay + (by - ay) * packetT;
        c.fillStyle = this._pc(0.55 + prox * 0.35);
        c.fillRect(px - 2 - prox, py - 2, 4 + prox * 3, 4 + prox * 2);
      });
      state.nodes.forEach((n) => {
        const prox = this._proximity(n.x, n.y, 130);
        const shake = prox * Math.sin(t * 18 + n.phase) * 5;
        const r = 2.2 * n.scale * (1 + prox * 0.9);
        c.beginPath();
        c.arc(n.x + shake, n.y + shake * 0.5, r, 0, Math.PI * 2);
        c.fillStyle = this._pc(0.48 + prox * 0.35);
        c.fill();
        if (prox > 0.35) {
          c.beginPath();
          c.arc(n.x, n.y, r + 5 + prox * 10, 0, Math.PI * 2);
          c.strokeStyle = this._pc(0.2 + prox * 0.35);
          c.lineWidth = 1 + prox;
          c.stroke();
          c.beginPath();
          c.arc(n.x, n.y, r + 2, 0, Math.PI * 2);
          c.fillStyle = colorAtHue(175, 0.12 + prox * 0.2, 0.1, 0.75);
          c.fill();
        }
      });
    }

    if (id === "stack") {
      c.font = "11px IBM Plex Mono, monospace";
      state.rows.forEach((row) => {
        const rowProx = rowProximity(this.interaction, this.reducedMotion, row.y, 44);
        const nearRow = rowProx > 0.2;

        if (nearRow) {
          if (row.frozenX === undefined) row.frozenX = row.x;
        } else {
          row.frozenX = undefined;
        }

        const drawX = nearRow ? row.frozenX : row.x;
        let txt = `> ${row.text} [${Math.floor(row.counter) % 999}]`;
        if (nearRow) txt = this._glitchString(txt, rowProx);

        this._glow(0.2 + rowProx * 0.35);
        c.lineWidth = 1 + rowProx;
        c.beginPath();
        c.moveTo(0, row.y);
        c.lineTo(w, row.y);
        c.stroke();
        this._clearGlow();

        const jitterX = nearRow && this._hoverAllowed() ? rnd(-4, 4) * rowProx : 0;
        c.fillStyle = this._pc(0.4 + rowProx * 0.35, 195);
        c.fillText(txt, drawX + jitterX, row.y - 4);

        if (nearRow && rowProx > 0.35) {
          c.fillStyle = colorAtHue(28, 0.22 + rowProx * 0.3, 0.12, 0.7);
          c.fillText(this._glitchString(txt, rowProx * 0.8), drawX + jitterX + 2, row.y - 3);
          c.fillStyle = colorAtHue(230, 0.15 + rowProx * 0.2, 0.1, 0.65);
          c.fillText(txt, drawX + jitterX - 2, row.y - 5);
        }
      });
    }

    if (id === "magnet") {
      const pulse = state.core.pulse;
      const { x: tx, y: ty } = pointerXY(this.interaction, this.reducedMotion, ox, oy);
      c.beginPath();
      c.arc(tx, ty, 8 * pulse, 0, Math.PI * 2);
      c.fillStyle = this._pc(0.75);
      c.fill();
      state.streams.forEach((p) => {
        const prox = this._proximity(p.x, p.y, 180);
        c.beginPath();
        c.moveTo(p.x, p.y);
        c.lineTo(tx, ty);
        c.strokeStyle = this._pc((0.22 + prox * 0.2) * p.trail);
        c.lineWidth = p.size + prox;
        c.stroke();
        c.beginPath();
        c.arc(p.x, p.y, p.size + prox * 0.5, 0, Math.PI * 2);
        c.fillStyle = this._pc((0.45 + prox * 0.25) * p.trail);
        c.fill();
      });
    }

    if (id === "signal") {
      const baseY = h * 0.68;
      const amp = h * 0.09;
      const slope = h * 0.28;
      const ptrN = pointerNormX(this.interaction, this.reducedMotion, w);
      const glowK = state.glow * (1 + (state.clickFx?.glowBoost ?? 0));
      this._glow(0.55 * glowK);
      c.lineWidth = 2.6;
      c.beginPath();
      for (let x = 0; x <= w; x += 3) {
        const n = x / w;
        const spike = state.spikes[Math.floor(n * state.spikes.length)] || 0.5;
        const trend = -n * slope + state.climb;
        const boost = ptrN >= 0 && Math.abs(n - ptrN) < 0.1 ? 1.6 : 1;
        const wave =
          Math.sin(n * 11 + state.phase) * amp * 0.28 * boost +
          Math.sin(n * 2.8 - state.phase * 0.5) * amp * spike * 0.42 * boost;
        const y = baseY + trend + wave;
        if (x === 0) c.moveTo(x, y);
        else c.lineTo(x, y);
      }
      c.stroke();
      this._clearGlow();
    }

    if (id === "chrono") {
      const maxR = Math.min(w, h) * 0.42;
      const cy2 = oy + h * 0.05;
      this._glow(0.4 * state.glow);
      c.lineWidth = 2;
      c.beginPath();
      c.arc(ox, cy2, maxR, 0, Math.PI * 2);
      c.stroke();
      this._clearGlow();
      let hand = state.hand;
      const handBlend = state.clickFx?.handBlend ?? 0;
      if (handBlend > 0.02 && state.clickFx?.handSnap !== undefined) {
        hand = state.clickFx.handSnap;
      } else if (this._hoverAllowed()) {
        const ptr = this._pointerXY(ox, cy2);
        hand = Math.atan2(ptr.y - cy2, ptr.x - ox) + Math.PI / 2;
      }
      const hx = ox + Math.cos(hand - Math.PI / 2) * maxR * 0.78;
      const hy = cy2 + Math.sin(hand - Math.PI / 2) * maxR * 0.78;
      this._glow(0.6);
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(ox, cy2);
      c.lineTo(hx, hy);
      c.stroke();
      this._clearGlow();
    }

    if (id === "ping") {
      const maxR = Math.min(w, h) * 0.46;
      for (let i = 0; i < 24; i++) {
        const a = state.sweep - i * 0.045;
        c.strokeStyle = this._pc(0.2 - i * 0.006);
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(ox, oy);
        c.lineTo(ox + Math.cos(a) * maxR, oy + Math.sin(a) * maxR);
        c.stroke();
      }
      state.rings.forEach((ring) => {
        this._glow(0.28);
        c.lineWidth = 1.2;
        c.beginPath();
        c.arc(ox, oy, maxR * ring.r, 0, Math.PI * 2);
        c.stroke();
        this._clearGlow();
      });
      state.blips.forEach((b) => {
        if (b.alpha < 0.05) return;
        const px = ox + Math.cos(b.a) * maxR * b.d;
        const py = oy + Math.sin(b.a) * maxR * b.d;
        c.beginPath();
        c.arc(px, py, 4 * b.scale, 0, Math.PI * 2);
        c.fillStyle = this._pc(0.8 * b.alpha);
        c.fill();
      });
    }

    if (id === "flowchart") {
      const bw = w * 0.9;
      const bh = h * 0.7;
      const bx0 = ox - bw * 0.5;
      const by0 = oy - bh * 0.5;
      const boxPx = (b) => ({
        x: bx0 + b.x * bw,
        y: by0 + b.y * bh,
        w: b.w * bw,
        h: b.h * bh
      });
      const centers = state.boxes.map(boxPx);
      state.edges.forEach((edge, ei) => {
        const a = centers[edge[0]];
        const b = centers[edge[1]];
        const ax = a.x + a.w * 0.5;
        const ay = a.y + a.h * 0.5;
        const bx = b.x + b.w * 0.5;
        const by = b.y + b.h * 0.5;
        this._glow(0.32);
        c.lineWidth = 1.2;
        c.beginPath();
        c.moveTo(ax + a.w * 0.5, ay);
        c.lineTo(bx - b.w * 0.5, by);
        c.stroke();
        this._clearGlow();
        const pkt = state.packets[ei];
        if (pkt) {
          const px = ax + (bx - ax) * pkt.t;
          const py = ay + (by - ay) * pkt.t;
          c.fillStyle = this._pc(0.75);
          c.fillRect(px - 3, py - 3, 6, 6);
        }
      });
      centers.forEach((box) => {
        this._glow(0.28);
        c.lineWidth = 1.4;
        c.strokeRect(box.x, box.y, box.w, box.h);
        this._clearGlow();
      });
    }

    if (id === "pcb") {
      const span = Math.min(w, h) * 0.72;
      const x0 = ox - span * 0.5;
      const y0 = oy - span * 0.45;
      state.traces.forEach((tr) => {
        const px = x0 + tr.x * span;
        const py = y0 + tr.y * span;
        const len = span * 0.08 * tr.pulse;
        this._glow(0.22 * tr.pulse * state.gridPulse);
        c.lineWidth = 1 + tr.pulse * 0.4;
        c.beginPath();
        if (tr.h) {
          c.moveTo(px - len, py);
          c.lineTo(px + len, py);
        } else {
          c.moveTo(px, py - len);
          c.lineTo(px, py + len);
        }
        c.stroke();
        this._clearGlow();
        c.beginPath();
        c.arc(px, py, 2.5 * tr.pulse, 0, Math.PI * 2);
        c.fillStyle = this._pc(0.45 * tr.pulse);
        c.fill();
      });
    }

    if (id === "topology") {
      const maxR = bgExtent(w, h, 0.54);
      const hubX = ox + w * 0.02;
      const hubY = oy - h * 0.03;
      c.beginPath();
      c.arc(hubX, hubY, 6 * state.hub.pulse, 0, Math.PI * 2);
      c.fillStyle = this._pc(0.7);
      c.fill();
      state.nodes.forEach((node) => {
        const nx = hubX + Math.cos(node.a) * maxR * node.d;
        const ny = hubY + Math.sin(node.a) * maxR * node.d * 0.72;
        this._glow(0.3 * node.pulse);
        c.lineWidth = 1.2;
        c.beginPath();
        c.moveTo(hubX, hubY);
        c.lineTo(nx, ny);
        c.stroke();
        this._clearGlow();
        const pktX = hubX + (nx - hubX) * node.packet;
        const pktY = hubY + (ny - hubY) * node.packet;
        c.beginPath();
        c.arc(pktX, pktY, 3, 0, Math.PI * 2);
        c.fillStyle = this._pc(0.65);
        c.fill();
        c.beginPath();
        c.arc(nx, ny, 5 * node.pulse, 0, Math.PI * 2);
        c.fillStyle = this._pc(0.5);
        c.fill();
      });
    }

    if (id === "pipeline") {
      const span = w * 0.76;
      const x0 = ox - span * 0.5;
      const y = oy;
      const activeIdx = Math.floor(state.sweep * state.stages.length) % state.stages.length;
      state.stages.forEach((st, i) => {
        const sx = x0 + st.x * span;
        const active = i === activeIdx;
        this._glow(active ? 0.45 : 0.2);
        c.lineWidth = active ? 2 : 1.2;
        c.beginPath();
        c.arc(sx, y, 8 * st.pulse, 0, Math.PI * 2);
        c.stroke();
        this._clearGlow();
        if (i < state.stages.length - 1) {
          const next = state.stages[i + 1];
          const nx = x0 + next.x * span;
          c.strokeStyle = this._pc(0.28);
          c.lineWidth = 1;
          c.beginPath();
          c.moveTo(sx + 10, y);
          c.lineTo(nx - 10, y);
          c.stroke();
        }
      });
    }

    if (id === "constellation") {
      const maxR = bgExtent(w, h, 0.5);
      const starOx = ox + w * 0.02;
      const starOy = oy - h * 0.04;
      const glowK = state.glow * (1 + (state.clickFx?.glowBoost ?? 0));
      const pos = state.nodes.map((n) => ({
        x: starOx + Math.cos(n.a) * maxR * n.d,
        y: starOy + Math.sin(n.a) * maxR * n.d
      }));
      state.links.forEach((link) => {
        const a = pos[link.a];
        const b = pos[link.b];
        this._glow(0.25 * glowK);
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(a.x, a.y);
        c.lineTo(b.x, b.y);
        c.stroke();
        this._clearGlow();
      });
      pos.forEach((p, i) => {
        const n = state.nodes[i];
        c.beginPath();
        c.arc(p.x, p.y, 5 * n.pulse, 0, Math.PI * 2);
        c.fillStyle = this._pc(0.55 * n.pulse * glowK);
        c.fill();
        if (n.pulse > 1.15) {
          c.beginPath();
          c.arc(p.x, p.y, 10, 0, Math.PI * 2);
          c.strokeStyle = this._pc(0.2);
          c.lineWidth = 1;
          c.stroke();
        }
      });
    }

    if (id === "vault") {
      const maxR = Math.min(w, h) * 0.44;
      state.rings.forEach((ring) => {
        this._glow(0.38 * ring.pulse);
        c.lineWidth = ring.w;
        c.beginPath();
        c.ellipse(ox, oy, maxR * ring.r * ring.pulse, maxR * ring.r * 0.55 * ring.pulse, ring.rot, 0, Math.PI * 2);
        c.stroke();
        this._clearGlow();
      });
      const lw = 14 * state.lock.pulse;
      const lh = 18 * state.lock.pulse;
      this._glow(0.5);
      c.lineWidth = 2;
      c.strokeRect(ox - lw * 0.5, oy - lh * 0.2, lw, lh);
      c.beginPath();
      c.arc(ox, oy - lh * 0.35, lw * 0.35, Math.PI, 0);
      c.stroke();
      this._clearGlow();
      state.sparks.forEach((s) => {
        c.beginPath();
        c.arc(ox + Math.cos(s.a) * maxR * s.r, oy + Math.sin(s.a) * maxR * s.r * 0.6, s.size, 0, Math.PI * 2);
        c.fillStyle = this._pc(s.alpha);
        c.fill();
      });
    }

    if (id === "schematic") {
      const bw = w * 0.88;
      const bh = h * 0.72;
      const bx0 = ox - bw * 0.5;
      const by0 = oy - bh * 0.5;
      const gridStep = 24;
      c.setLineDash([4, 6]);
      c.lineWidth = 0.6;
      c.strokeStyle = this._pc(0.14 * state.gridPulse);
      for (let gx = bx0; gx <= bx0 + bw; gx += gridStep) {
        c.beginPath();
        c.moveTo(gx, by0);
        c.lineTo(gx, by0 + bh);
        c.stroke();
      }
      for (let gy = by0; gy <= by0 + bh; gy += gridStep) {
        c.beginPath();
        c.moveTo(bx0, gy);
        c.lineTo(bx0 + bw, gy);
        c.stroke();
      }
      c.setLineDash([]);

      const blockPx = (b) => ({
        x: bx0 + b.x * bw,
        y: by0 + b.y * bh,
        w: b.w * bw,
        h: b.h * bh
      });
      const centers = state.blocks.map(blockPx);

      state.connections.forEach(([ai, bi]) => {
        const a = centers[ai];
        const b = centers[bi];
        const ax = a.x + a.w * 0.5;
        const ay = a.y + a.h * 0.5;
        const bx = b.x + b.w * 0.5;
        const by = b.y + b.h * 0.5;
        this._glow(0.22);
        c.lineWidth = 0.9;
        c.beginPath();
        c.moveTo(ax, ay);
        c.lineTo(bx, by);
        c.stroke();
        this._clearGlow();
      });

      centers.forEach((box, i) => {
        this._glow(0.3);
        c.lineWidth = 1.1;
        c.strokeRect(box.x, box.y, box.w, box.h);
        c.beginPath();
        c.moveTo(box.x + 4, box.y + box.h * 0.35);
        c.lineTo(box.x + box.w - 4, box.y + box.h * 0.35);
        c.moveTo(box.x + 4, box.y + box.h * 0.65);
        c.lineTo(box.x + box.w * 0.55, box.y + box.h * 0.65);
        c.stroke();
        this._clearGlow();

        const dim = state.dims[i];
        if (!dim) return;
        const tick = 5;
        const offset = 10 + dim.t * 4;
        c.strokeStyle = this._pc(0.42 + dim.t * 0.2);
        c.lineWidth = 0.8;
        if (dim.axis === "h") {
          const dy = box.y - offset;
          c.beginPath();
          c.moveTo(box.x, dy);
          c.lineTo(box.x + box.w, dy);
          c.moveTo(box.x, dy - tick);
          c.lineTo(box.x, dy + tick);
          c.moveTo(box.x + box.w, dy - tick);
          c.lineTo(box.x + box.w, dy + tick);
          c.stroke();
        } else {
          const dx = box.x + box.w + offset;
          c.beginPath();
          c.moveTo(dx, box.y);
          c.lineTo(dx, box.y + box.h);
          c.moveTo(dx - tick, box.y);
          c.lineTo(dx + tick, box.y);
          c.moveTo(dx - tick, box.y + box.h);
          c.lineTo(dx + tick, box.y + box.h);
          c.stroke();
        }
      });

      const scanY = by0 + (this.scrollFrac ?? state.scan) * bh;
      c.strokeStyle = this._pc(0.35);
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(bx0, scanY);
      c.lineTo(bx0 + bw, scanY);
      c.stroke();
    }

    if (id === "isograph") {
      const span = bgGridSpan(w, h);
      const x0 = ox - span * 0.48 + w * 0.02;
      const y0 = oy - span * 0.3;
      const tw = span / state.cols;
      const th = span / state.rows * 0.64;
      if (this._hoverAllowed()) {
        const ptr = this._pointerXY(x0 + span * 0.25, y0 + span * 0.25);
        const hx = Math.floor(((ptr.x - x0) / tw + (ptr.y - y0) / th) * 0.5);
        const hy = Math.floor(((ptr.y - y0) / th - (ptr.x - x0) / tw) * 0.5);
        state.highlight.col = Math.max(0, Math.min(state.cols - 1, hx));
        state.highlight.row = Math.max(0, Math.min(state.rows - 1, hy));
      }
      for (let row = 0; row < state.rows; row++) {
        for (let col = 0; col < state.cols; col++) {
          const cx = x0 + (col - row) * tw * 0.5;
          const cy = y0 + (col + row) * th * 0.5;
          const isHi = col === state.highlight.col && row === state.highlight.row;
          this._glow(isHi ? 0.45 * state.highlight.pulse : 0.12);
          c.lineWidth = isHi ? 1.6 : 0.8;
          c.beginPath();
          c.moveTo(cx, cy - th);
          c.lineTo(cx + tw * 0.5, cy);
          c.lineTo(cx, cy + th);
          c.lineTo(cx - tw * 0.5, cy);
          c.closePath();
          c.stroke();
          this._clearGlow();
          if (isHi) {
            c.fillStyle = this._pc(0.18 * state.highlight.pulse);
            c.fill();
          }
        }
      }
    }

    if (id === "sonar") {
      const maxR = Math.min(w, h) * 0.44;
      const sweepA = state.sweep;
      c.save();
      c.translate(ox, oy);
      c.rotate(sweepA);
      const grad = c.createRadialGradient(0, 0, 0, 0, 0, maxR);
      grad.addColorStop(0, this._pc(0.35));
      grad.addColorStop(0.35, this._pc(0.12));
      grad.addColorStop(1, "transparent");
      c.fillStyle = grad;
      c.beginPath();
      c.moveTo(0, 0);
      c.arc(0, 0, maxR, -0.35, 0.35);
      c.closePath();
      c.fill();
      c.restore();
      state.echoes.forEach((echo) => {
        if (echo.alpha < 0.04) return;
        const ex = ox + Math.cos(echo.a) * maxR * echo.d;
        const ey = oy + Math.sin(echo.a) * maxR * echo.d * 0.72;
        c.beginPath();
        c.arc(ex, ey, maxR * echo.r, 0, Math.PI * 2);
        c.strokeStyle = this._pc(0.5 * echo.alpha, this.hue + 15);
        c.lineWidth = 1.2;
        c.stroke();
      });
      if (this._hoverAllowed()) {
        const ptr = this._pointerXY(ox, oy);
        const ba = Math.atan2(ptr.y - oy, ptr.x - ox);
        const ex = ox + Math.cos(ba) * maxR * 0.32;
        const ey = oy + Math.sin(ba) * maxR * 0.24;
        c.beginPath();
        c.arc(ex, ey, 6, 0, Math.PI * 2);
        c.fillStyle = this._pc(0.7, this.hue + 15);
        c.fill();
      }
    }

    if (id === "ledger") {
      const span = w * 0.82;
      const x0 = ox - span * 0.5;
      const baseY = oy + h * 0.22;
      const colH = h * 0.42;
      const sweepIdx = Math.floor(state.sweep * state.columns.length) % state.columns.length;
      let runningTotal = 0;
      state.columns.forEach((col, i) => {
        const cx = x0 + col.x * span;
        const prox = this._proximity(cx, baseY - colH * 0.5, 70);
        const swept = i === sweepIdx;
        const speed = counterSpeedBoost(prox, this.reducedMotion);
        const tickH = colH * col.ticks * col.pulse * (1 + prox * 0.25 + (swept ? 0.15 : 0));
        this._glow(0.2 + prox * 0.35 + (swept ? 0.2 : 0));
        c.lineWidth = 1 + prox + (swept ? 0.6 : 0);
        c.beginPath();
        c.moveTo(cx, baseY);
        c.lineTo(cx, baseY - tickH);
        c.stroke();
        this._clearGlow();
        for (let t = 0; t < 4; t++) {
          const ty = baseY - tickH * (t + 1) / 5;
          c.beginPath();
          c.moveTo(cx - 4, ty);
          c.lineTo(cx + 4, ty);
          c.strokeStyle = this._pc(0.25 + prox * 0.2 + (swept ? 0.15 : 0));
          c.lineWidth = 0.8;
          c.stroke();
        }
        const colVal = Math.floor(col.counter * speed) % 10000;
        runningTotal += colVal;
        c.font = "10px IBM Plex Mono, monospace";
        c.fillStyle = this._pc(0.45 + prox * 0.3 + (swept ? 0.2 : 0), 145);
        c.fillText(String(colVal), cx - 12, baseY + 14);
      });
      c.font = "11px IBM Plex Mono, monospace";
      c.fillStyle = this._pc(0.55, 145);
      c.fillText(`Σ ${runningTotal % 100000}`, x0 + span * 0.02, baseY + 32);
    }

    if (id === "weave") {
      const pad = 0.08;
      state.hThreads.forEach((th) => {
        const y = (pad + th.y * (1 - pad * 2)) * h;
        const prox = this._proximity(w * 0.5, y, 120);
        const lift = prox * Math.sin(th.phase) * 8;
        this._glow(0.15 + prox * 0.3);
        c.lineWidth = 0.9 + prox;
        c.beginPath();
        c.moveTo(0, y - lift);
        c.lineTo(w, y + lift);
        c.stroke();
        this._clearGlow();
      });
      state.vThreads.forEach((th) => {
        const x = (pad + th.x * (1 - pad * 2)) * w;
        const prox = this._proximity(x, h * 0.5, 120);
        const lift = prox * Math.cos(th.phase) * 8;
        this._glow(0.15 + prox * 0.3);
        c.lineWidth = 0.9 + prox;
        c.beginPath();
        c.moveTo(x - lift, 0);
        c.lineTo(x + lift, h);
        c.stroke();
        this._clearGlow();
      });
    }

    if (id === "orbit") {
      const maxR = bgExtent(w, h, 0.56);
      const orbitOx = ox + w * 0.03;
      const orbitOy = oy - h * 0.05;
      const glowK = state.glow * (1 + (state.clickFx?.glowBoost ?? 0));
      state.foci.forEach((f) => {
        const fx = orbitOx + f.x * maxR;
        const fy = orbitOy + f.y * maxR * 0.6;
        c.beginPath();
        c.arc(fx, fy, 3, 0, Math.PI * 2);
        c.fillStyle = this._pc(0.5 * glowK);
        c.fill();
      });
      state.bodies.forEach((body) => {
        const prox = this._proximity(
          orbitOx + Math.cos(body.a) * maxR * body.rx,
          orbitOy + Math.sin(body.a) * maxR * body.ry * 0.72,
          120
        );
        c.setLineDash([3, 5]);
        c.strokeStyle = this._pc(0.22 + prox * 0.2);
        c.lineWidth = 1.1;
        c.beginPath();
        c.ellipse(orbitOx, orbitOy, maxR * body.rx, maxR * body.ry * 0.72, 0, 0, Math.PI * 2);
        c.stroke();
        c.setLineDash([]);
        const bx = orbitOx + Math.cos(body.a) * maxR * body.rx;
        const by = orbitOy + Math.sin(body.a) * maxR * body.ry * 0.72;
        c.beginPath();
        c.arc(bx, by, 5 + prox * 3, 0, Math.PI * 2);
        c.fillStyle = this._pc(0.55 + prox * 0.3);
        c.fill();
      });
    }

    if (id === "relay") {
      const span = w * 0.78;
      const x0 = ox - span * 0.5;
      const y = oy;
      const from = state.stations[state.baton.from];
      const to = state.stations[state.baton.to];
      const fx = x0 + from.x * span;
      const tx = x0 + to.x * span;
      let batonX = fx + (tx - fx) * state.baton.t;
      if (this._hoverAllowed()) {
        let nearest = 0;
        let bestProx = 0;
        state.stations.forEach((st, i) => {
          const sx = x0 + st.x * span;
          const prox = this._proximity(sx, y, 120);
          if (prox > bestProx) {
            bestProx = prox;
            nearest = i;
          }
        });
        const nsx = x0 + state.stations[nearest].x * span;
        batonX += (nsx - batonX) * 0.12;
        state.baton.speed = bestProx > 0.15 ? 1.8 : 1;
      }
      state.stations.forEach((st, i) => {
        const sx = x0 + st.x * span;
        const active = i === state.baton.from || i === state.baton.to;
        this._glow(active ? 0.4 : 0.18);
        c.lineWidth = active ? 2 : 1.2;
        c.beginPath();
        c.arc(sx, y, 9 * st.pulse, 0, Math.PI * 2);
        c.stroke();
        this._clearGlow();
        if (i < state.stations.length - 1) {
          const nx = x0 + state.stations[i + 1].x * span;
          c.strokeStyle = this._pc(0.22);
          c.lineWidth = 1;
          c.beginPath();
          c.moveTo(sx + 11, y);
          c.lineTo(nx - 11, y);
          c.stroke();
        }
      });
      c.fillStyle = this._pc(0.85, 45);
      c.beginPath();
      c.arc(batonX, y, 5, 0, Math.PI * 2);
      c.fill();
    }

    if (id === "seal") {
      const maxR = Math.min(w, h) * 0.36;
      const impress = this._proximity(ox, oy, 200);
      state.ripples.forEach((ripple) => {
        if (ripple.alpha < 0.03) return;
        c.beginPath();
        c.arc(ox, oy, maxR * (state.ring.r + ripple.r), 0, Math.PI * 2);
        c.strokeStyle = this._pc(0.2 * ripple.alpha);
        c.lineWidth = 0.8;
        c.stroke();
      });
      this._glow(0.4 * state.ring.pulse);
      c.lineWidth = 2.5 - impress * 0.8;
      c.beginPath();
      c.ellipse(ox, oy, maxR * state.ring.r * state.ring.pulse, maxR * state.ring.r * 0.55 * state.ring.pulse, state.rot, 0, Math.PI * 2);
      c.stroke();
      this._clearGlow();
      c.save();
      c.translate(ox, oy);
      c.rotate(state.rot * 0.3);
      c.font = "9px IBM Plex Mono, monospace";
      c.fillStyle = this._pc(0.35 + impress * 0.25);
      c.fillText("CORTEX", -18, 4);
      c.restore();
    }

    if (id === "glyph") {
      c.font = "11px IBM Plex Mono, monospace";
      state.fragments.forEach((frag) => {
        const fx = frag.x * w;
        const fy = frag.y * h;
        const prox = this._proximity(fx, fy, 100);
        if (prox > 0.25 && Math.random() < 0.08 + prox * 0.2) {
          frag.display = GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
          frag.glitchT = 4;
        }
        if (frag.glitchT > 0) frag.glitchT--;
        const txt = frag.glitchT > 0 && frag.display ? frag.display : frag.text;
        c.fillStyle = this._pc(0.35 + prox * 0.4);
        c.fillText(txt, fx, fy);
      });
    }

    if (id === "hexpulse") {
      const { cols, rows, size, cells } = state;
      const hx = ox + (state.anchorX ?? 0);
      const hy = oy + (state.anchorY ?? 0);
      cells.forEach((cell) => {
        const { x, y } = hexCellXY(cell.col, cell.row, size, hx, hy, cols, rows);
        const prox = this._proximity(x, y, 140);
        const a = cell.alpha + prox * 0.25;
        const r = size * 0.46 * cell.scale * (1 + prox * 0.08);
        drawHexPath(c, x, y, r);
        c.strokeStyle = this._pc(a);
        c.lineWidth = 1 + prox;
        c.stroke();
        if (prox > 0.3 || cell.alpha > 0.4) {
          this._glow(0.2 + prox * 0.3);
          drawHexPath(c, x, y, r * 0.55);
          c.fillStyle = this._pc(a * 0.35);
          c.fill();
          this._clearGlow();
        }
      });
    }

    if (id === "parcel") {
      const pts = state.stations.map((st) => ({ x: st.x * w, y: st.y * h }));
      c.strokeStyle = this._pc(0.22);
      c.lineWidth = 1;
      for (let i = 0; i < pts.length - 1; i++) {
        c.beginPath();
        c.moveTo(pts[i].x, pts[i].y);
        c.lineTo(pts[i + 1].x, pts[i + 1].y);
        c.stroke();
      }
      state.stations.forEach((st) => {
        const sx = st.x * w;
        const sy = st.y * h;
        const prox = this._proximity(sx, sy, 100);
        this._glow(0.2 + prox * 0.35);
        c.beginPath();
        c.arc(sx, sy, 5 + prox * 2, 0, Math.PI * 2);
        c.stroke();
        this._clearGlow();
      });
      state.packets.forEach((pkt) => {
        const a = pts[pkt.seg];
        const b = pts[pkt.seg + 1];
        if (!a || !b) return;
        let t = pkt.t;
        if (this._hoverAllowed()) {
          const midX = a.x + (b.x - a.x) * t;
          const midY = a.y + (b.y - a.y) * t;
          const prox = this._proximity(midX, midY, 140);
          if (prox > 0.2) t = Math.min(1, t + 0.02 * prox);
        }
        const px = a.x + (b.x - a.x) * t;
        const py = a.y + (b.y - a.y) * t;
        c.fillStyle = this._pc(0.75, 45);
        c.fillRect(px - 3, py - 3, 6, 6);
      });
    }

    if (id === "hashwave") {
      c.font = "11px IBM Plex Mono, monospace";
      const cellW = w / state.cols;
      const cellH = h / state.rows;
      state.glyphs.forEach((g) => {
        const gx = g.col * cellW + cellW * 0.5;
        const gy = g.row * cellH + cellH * 0.5;
        const waveDist = Math.abs(g.col - state.wave);
        const waveBoost = Math.max(0, 1 - waveDist / 3) * 0.45;
        const prox = this._proximity(gx, gy, 90);
        if (prox > 0.3 && !this.reducedMotion && Math.random() < 0.06 + prox * 0.12) {
          g.scramble = HASHWAVE_CHARS[Math.floor(Math.random() * HASHWAVE_CHARS.length)];
          g.scrambleT = 3;
        }
        if (g.scrambleT > 0) g.scrambleT--;
        const ch = g.scrambleT > 0 && g.scramble ? g.scramble : g.ch;
        const a = g.alpha + waveBoost + prox * 0.35;
        c.fillStyle = this._pc(a);
        c.fillText(ch, gx - 4, gy + 4);
      });
    }

    if (id === "branch") {
      const off = this._pointerOffset(0.35);
      const skew = off.x * 0.0008;
      const nodeX = (x) => spreadNorm(x, 1.16) * w;
      const nodeY = (y) => spreadNorm(y, 1.1) * h;
      state.edges.forEach(([ai, bi]) => {
        const a = state.nodes[ai];
        const b = state.nodes[bi];
        if (a.reveal < 0.05 || b.reveal < 0.05) return;
        const ax = nodeX(a.x) + skew * h * (a.y - 0.5);
        const ay = nodeY(a.y) + off.y * 0.15;
        const bx = nodeX(b.x) + skew * h * (b.y - 0.5);
        const by = nodeY(b.y) + off.y * 0.15;
        c.strokeStyle = this._pc(0.22 * Math.min(a.reveal, b.reveal));
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(ax, ay);
        c.lineTo(bx, by);
        c.stroke();
      });
      state.nodes.forEach((node) => {
        const nx = nodeX(node.x) + skew * h * (node.y - 0.5);
        const ny = nodeY(node.y) + off.y * 0.15;
        this._glow(0.25 * node.reveal);
        c.lineWidth = 1.2;
        c.beginPath();
        c.arc(nx, ny, 8 * node.reveal, 0, Math.PI * 2);
        c.stroke();
        this._clearGlow();
      });
    }

    if (id === "telemetry") {
      const baseY = h * state.baseline;
      const span = w * 0.84;
      const x0 = ox - span * 0.5;
      this._glow(0.35 * state.glow);
      c.lineWidth = 1.4;
      c.beginPath();
      c.moveTo(x0, baseY);
      c.lineTo(x0 + span, baseY);
      c.stroke();
      this._clearGlow();
      state.ticks.forEach((tick) => {
        const tx = x0 + tick.x * span;
        const th = tick.h * h;
        c.strokeStyle = this._pc(0.35 + tick.h * 1.2);
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(tx, baseY);
        c.lineTo(tx, baseY - th);
        c.stroke();
        c.beginPath();
        c.moveTo(tx - 3, baseY);
        c.lineTo(tx + 3, baseY);
        c.stroke();
      });
    }

    if (id === "trace") {
      const frac = this.reducedMotion ? 1 : this.scrollFrac ?? 0;
      const pts = state.points.map((p) => ({ x: p.x * w, y: p.y * h }));
      const totalSegs = pts.length - 1;
      const drawUpTo = frac * totalSegs;
      c.strokeStyle = this._pc(0.2);
      c.lineWidth = 1;
      for (let i = 0; i < totalSegs; i++) {
        const scrollProg = Math.min(1, Math.max(0, drawUpTo - i));
        const clickProg = state.clickSegFlash?.[i] ?? 0;
        const segProg = Math.max(scrollProg, clickProg);
        if (segProg <= 0) continue;
        const a = pts[i];
        const b = pts[i + 1];
        const clickReplay = clickProg > scrollProg + 0.02;
        c.strokeStyle = this._pc(clickReplay ? 0.48 : 0.2);
        c.lineWidth = clickReplay ? 1.5 : 1;
        if (clickReplay) this._glow(0.28 * clickProg);
        c.beginPath();
        c.moveTo(a.x, a.y);
        c.lineTo(a.x + (b.x - a.x) * segProg, a.y + (b.y - a.y) * segProg);
        c.stroke();
        if (clickReplay) this._clearGlow();
      }
      pts.forEach((p) => {
        c.beginPath();
        c.arc(p.x, p.y, 4, 0, Math.PI * 2);
        c.fillStyle = this._pc(0.4);
        c.fill();
      });
      if (!this.reducedMotion && drawUpTo > 0) {
        const seg = Math.min(totalSegs - 1, Math.floor(state.packetT * totalSegs));
        const localT = (state.packetT * totalSegs) % 1;
        const a = pts[seg];
        const b = pts[seg + 1];
        c.fillStyle = this._pc(0.8, 45);
        c.fillRect(a.x + (b.x - a.x) * localT - 3, a.y + (b.y - a.y) * localT - 3, 6, 6);
      }
    }

    if (id === "checksum") {
      const frac = this.reducedMotion ? 1 : this.scrollFrac ?? state.progress ?? 0;
      const barY = h * state.barY;
      const x0 = w * 0.1;
      const barW = w * 0.8;
      c.strokeStyle = this._pc(0.25);
      c.lineWidth = 1.2;
      c.strokeRect(x0, barY - 6, barW, 12);
      const fillW = barW * frac;
      if (fillW > 0) {
        this._glow(0.3);
        c.fillStyle = this._pc(0.35);
        c.fillRect(x0, barY - 5, fillW, 10);
        this._clearGlow();
      }
      state.marks.forEach((mark) => {
        if (mark.x > frac + 0.02) return;
        const mx = x0 + mark.x * barW;
        c.strokeStyle = this._pc(0.4 + mark.alpha);
        c.beginPath();
        c.moveTo(mx, barY - 6 - mark.h * h);
        c.lineTo(mx, barY + 6);
        c.stroke();
      });
    }

    if (id === "cellscan") {
      let highlight = -1;
      let bestProx = 0;
      const bloomDecay = this.reducedMotion ? 1 : 0.94;
      state.sites.forEach((site, i) => {
        const prox = this._proximity(site.x, site.y, 140);
        site.bloom = Math.max(0, (site.bloom || 0) * bloomDecay + prox * 0.1);
        if (prox > bestProx) {
          bestProx = prox;
          highlight = i;
        }
      });
      state.highlight = highlight;
      state.edges.forEach((edge) => {
        const a = state.sites[edge.a];
        const b = state.sites[edge.b];
        const bloom = Math.max(a.bloom || 0, b.bloom || 0);
        const scanBoost = Math.abs((a.y + b.y) * 0.5 / h - state.scan) < 0.06 ? 0.25 : 0;
        c.strokeStyle = this._pc(edge.alpha * 0.6 + bloom * 0.3 + scanBoost);
        c.lineWidth = 0.9 + bloom;
        c.beginPath();
        c.moveTo(a.x, a.y);
        c.lineTo(b.x, b.y);
        c.stroke();
      });
      state.sites.forEach((site, i) => {
        const active = i === highlight;
        const r = 3 + (site.bloom || 0) * 4 + (active ? 2 : 0);
        c.beginPath();
        c.arc(site.x, site.y, r, 0, Math.PI * 2);
        c.fillStyle = this._pc(0.35 + (site.bloom || 0) * 0.4);
        c.fill();
      });
    }

    if (id === "beacon") {
      state.anchors.forEach((anchor) => {
        const ax = anchor.x * w;
        const ay = anchor.y * h;
        const prox = this._proximity(ax, ay, 160);
        c.fillStyle = this._pc(0.55 + prox * 0.3);
        c.beginPath();
        c.arc(ax, ay, 4 + prox * 2, 0, Math.PI * 2);
        c.fill();
        anchor.rings.forEach((ring) => {
          if (ring.alpha < 0.03) return;
          const r = ring.r * Math.min(w, h) * (1 + prox * 0.15);
          c.beginPath();
          c.arc(ax, ay, r, 0, Math.PI * 2);
          c.strokeStyle = this._pc(ring.alpha * (0.5 + prox * 0.3));
          c.lineWidth = 1;
          c.stroke();
        });
      });
    }

    if (id === "lattice") {
      const off = this._pointerOffset(0.4);
      state.layers.forEach((layer) => {
        const depth = layer.depth;
        const cols = state.cols;
        const rows = state.rows;
        const gridW = w * (0.72 + depth * 0.38);
        const gridH = h * (0.62 + depth * 0.34);
        const gx0 = ox - gridW * 0.48 + layer.offsetX + off.x * depth * 0.4 + w * 0.02;
        const gy0 = oy - gridH * 0.46 + layer.offsetY + off.y * depth * 0.3 - h * 0.03;
        const shear = layer.shear + off.x * 0.0003 * depth;
        c.strokeStyle = this._pc(0.12 + depth * 0.1);
        c.lineWidth = 0.8;
        for (let i = 0; i <= cols; i++) {
          const t = i / cols;
          const x = gx0 + t * gridW + shear * (gy0 - oy);
          c.beginPath();
          c.moveTo(x, gy0);
          c.lineTo(x + shear * gridH, gy0 + gridH);
          c.stroke();
        }
        for (let j = 0; j <= rows; j++) {
          const t = j / rows;
          const y = gy0 + t * gridH;
          c.beginPath();
          c.moveTo(gx0 + shear * (y - gy0), y);
          c.lineTo(gx0 + gridW + shear * (y - gy0), y);
          c.stroke();
        }
      });
    }

    if (id === "filament") {
      const off = this._pointerOffset(0.45);
      const pts = state.knots.map((k) => ({
        x: k.x * w + off.x * 0.2,
        y: k.y * h + off.y * 0.15
      }));
      const t = state.t;
      c.strokeStyle = this._pc(0.18);
      c.lineWidth = 0.8;
      for (let i = 0; i < pts.length - 1; i++) {
        c.beginPath();
        c.moveTo(pts[i].x, pts[i].y);
        c.lineTo(pts[i + 1].x, pts[i + 1].y);
        c.stroke();
      }
      const activeClickKnots = (state.clickKnots ?? []).filter((k) => (k.alpha ?? 0) > 0.03);
      activeClickKnots.forEach((k) => {
        const kx = k.x * w + off.x * 0.2;
        const ky = k.y * h + off.y * 0.15;
        let bestI = 0;
        let bestD = Infinity;
        for (let i = 0; i < pts.length - 1; i++) {
          const mx = (pts[i].x + pts[i + 1].x) * 0.5;
          const my = (pts[i].y + pts[i + 1].y) * 0.5;
          const d = Math.hypot(mx - kx, my - ky);
          if (d < bestD) {
            bestD = d;
            bestI = i;
          }
        }
        c.strokeStyle = this._pc(0.22 + (k.alpha ?? 0) * 0.45);
        c.lineWidth = 1.5;
        c.beginPath();
        c.moveTo(pts[bestI].x, pts[bestI].y);
        c.lineTo(kx, ky);
        c.lineTo(pts[bestI + 1].x, pts[bestI + 1].y);
        c.stroke();
        this._glow(0.3 * (k.alpha ?? 0));
        c.beginPath();
        c.arc(kx, ky, 4 + (k.alpha ?? 0) * 2, 0, Math.PI * 2);
        c.stroke();
        this._clearGlow();
      });
      const totalLen = pts.length - 1;
      const pos = t * totalLen;
      const seg = Math.min(totalLen - 1, Math.floor(pos));
      const local = pos - seg;
      const ax = pts[seg];
      const bx = pts[seg + 1];
      const fx = ax.x + (bx.x - ax.x) * local;
      const fy = ax.y + (bx.y - ax.y) * local;
      this._glow(0.45);
      c.lineWidth = 2.2;
      c.beginPath();
      c.moveTo(pts[0].x, pts[0].y);
      for (let i = 0; i <= seg; i++) {
        c.lineTo(pts[i + 1].x, pts[i + 1].y);
      }
      if (seg < totalLen) c.lineTo(fx, fy);
      c.stroke();
      this._clearGlow();
      pts.forEach((p) => {
        c.beginPath();
        c.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
        c.fillStyle = this._pc(0.3);
        c.fill();
      });
    }

    drawClickPulses(this, c, state);

    c.restore();
  }

  _drawBokeh() {
    const { bctx: c, width: w, height: h, intensity } = this;
    const pull = this._pointerOffset(0.55);
    const orbLerp = this.reducedMotion ? 1 : 0.012;
    c.clearRect(0, 0, w, h);
    this.bokehOrbs.forEach((orb) => {
      const targetX = 0.5 + this.pointer.nx * 0.08;
      const targetY = 0.5 + this.pointer.ny * 0.06;
      orb.x += (targetX - orb.x) * orbLerp;
      orb.y += (targetY - orb.y) * orbLerp;
      const x = orb.x * w + pull.x * 0.15;
      const y = orb.y * h + pull.y * 0.15;
      const g = c.createRadialGradient(x, y, 0, x, y, orb.r);
      const p = effectPalette();
      g.addColorStop(0, colorAtHue(this.hue, orb.alpha * intensity * 0.9, p.fillC, p.bokehL));
      g.addColorStop(0.4, colorAtHue(this.hue, orb.alpha * 0.25 * intensity, p.fillC * 0.8, p.bokehL * 0.9));
      g.addColorStop(1, "transparent");
      c.fillStyle = g;
      c.beginPath();
      c.arc(x, y, orb.r, 0, Math.PI * 2);
      c.fill();
    });
    c.save();
    const fadeR = Math.max(w, h) * 0.58;
    const edge = c.createRadialGradient(this.cx(), this.cy(), fadeR * 0.18, this.cx(), this.cy(), fadeR);
    const p = effectPalette();
    edge.addColorStop(0, vignetteColor(p.vignetteL, 1));
    edge.addColorStop(0.55, vignetteColor(p.vignetteL, 0.8));
    edge.addColorStop(1, vignetteColor(p.vignetteL, 0));
    c.globalCompositeOperation = "destination-in";
    c.fillStyle = edge;
    c.fillRect(0, 0, w, h);
    c.restore();
  }

  _draw() {
    const mix = this.mix.value;
    const activeId = mix > 0.5 ? this.effectB : this.effectA;
    if (this.reducedMotion && RM_FROZEN_DRAW_IDS.has(activeId)) {
      if (!this._rmNeedsRedraw) return;
      this._rmNeedsRedraw = false;
    }
    this._lerpPointer();
    if (this._cascadeIsLive(mix)) {
      this._updateCascade(this.ensureEffect("cascade"));
    }
    const stateA = this.ensureEffect(this.effectA);
    const stateB = this.ensureEffect(this.effectB);
    this.ctx.clearRect(0, 0, this.width, this.height);
    this._drawEffect(this.effectA, stateA, 1 - mix);
    if (this.effectB !== this.effectA) this._drawEffect(this.effectB, stateB, mix);
    const active = mix > 0.5 ? this.effectB : this.effectA;
    const activeState = this.states[active];
    this._syncDrawableTelemetry(active, activeState);
    this._syncClickTelemetry(active, activeState);
    this._drawBokeh();
  }
}