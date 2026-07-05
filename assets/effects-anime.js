/**
 * AnimeEffectsField — canvas effects driven by anime.js v4
 */
import { animate, createTimer } from "https://esm.sh/animejs@4.0.2";
import {
  counterSpeedBoost,
  hoverAllowed,
  pointerNormX,
  pointerXY,
  proximity,
  rowProximity
} from "./effects-interaction.js";

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
    this.onMixChange = options.onMixChange ?? null;

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
    this._draw();
  }

  _drawableCount(id, state) {
    if (!state) return 0;
    if (id === "isograph") return (state.cols ?? 0) * (state.rows ?? 0);
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
  }

  setMixTarget(effectA, effectB, targetMix) {
    this.effectA = effectA;
    this.effectB = effectB;
    this.ensureEffect(effectA);
    if (effectB !== effectA) this.ensureEffect(effectB);
    animate(this.mix, {
      value: targetMix,
      duration: this.reducedMotion ? 0 : 720,
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
          d: rnd(0.28, 0.42),
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
        d: rnd(0.22, 0.38),
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
          { a: 0, rx: 0.34, ry: 0.22, speed: 1, phase: 0 },
          { a: Math.PI * 0.6, rx: 0.28, ry: 0.18, speed: 1.4, phase: 1.2 },
          { a: Math.PI * 1.3, rx: 0.2, ry: 0.14, speed: 1.8, phase: 2.4 }
        ],
        foci: [{ x: -0.08, y: 0 }, { x: 0.08, y: 0 }],
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
  }

  _initBokeh() {
    const count = this.reducedMotion ? 8 : 14;
    this.bokehOrbs = Array.from({ length: count }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 24 + Math.random() * 64,
      alpha: 0.02 + Math.random() * 0.04
    }));
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
      this._glow(0.55 * state.glow);
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
      if (this._hoverAllowed()) {
        hand = Math.atan2(this.interaction.py - cy2, this.interaction.px - ox) + Math.PI / 2;
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
      const maxR = Math.min(w, h) * 0.42;
      c.beginPath();
      c.arc(ox, oy, 6 * state.hub.pulse, 0, Math.PI * 2);
      c.fillStyle = this._pc(0.7);
      c.fill();
      state.nodes.forEach((node) => {
        const nx = ox + Math.cos(node.a) * maxR * node.d;
        const ny = oy + Math.sin(node.a) * maxR * node.d * 0.72;
        this._glow(0.3 * node.pulse);
        c.lineWidth = 1.2;
        c.beginPath();
        c.moveTo(ox, oy);
        c.lineTo(nx, ny);
        c.stroke();
        this._clearGlow();
        const pktX = ox + (nx - ox) * node.packet;
        const pktY = oy + (ny - oy) * node.packet;
        c.beginPath();
        c.arc(pktX, pktY, 3, 0, Math.PI * 2);
        c.fillStyle = this._pc(0.65);
        c.fill();
        c.beginPath();
        c.arc(nx, ny, 4 * node.pulse, 0, Math.PI * 2);
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
      const maxR = Math.min(w, h) * 0.38;
      const pos = state.nodes.map((n) => ({
        x: ox + Math.cos(n.a) * maxR * n.d,
        y: oy + Math.sin(n.a) * maxR * n.d
      }));
      state.links.forEach((link) => {
        const a = pos[link.a];
        const b = pos[link.b];
        this._glow(0.25 * state.glow);
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
        c.fillStyle = this._pc(0.55 * n.pulse * state.glow);
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
      const span = Math.min(w, h) * 0.7;
      const x0 = ox - span * 0.5;
      const y0 = oy - span * 0.35;
      const tw = span / state.cols;
      const th = span / state.rows * 0.55;
      if (this._hoverAllowed()) {
        const hx = Math.floor(((this.interaction.px - x0) / tw + (this.interaction.py - y0) / th) * 0.5);
        const hy = Math.floor(((this.interaction.py - y0) / th - (this.interaction.px - x0) / tw) * 0.5);
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
        const ba = Math.atan2(this.interaction.py - oy, this.interaction.px - ox);
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
      const maxR = Math.min(w, h) * 0.4;
      state.foci.forEach((f) => {
        const fx = ox + f.x * maxR;
        const fy = oy + f.y * maxR * 0.6;
        c.beginPath();
        c.arc(fx, fy, 3, 0, Math.PI * 2);
        c.fillStyle = this._pc(0.5 * state.glow);
        c.fill();
      });
      state.bodies.forEach((body) => {
        const prox = this._proximity(
          ox + Math.cos(body.a) * maxR * body.rx,
          oy + Math.sin(body.a) * maxR * body.ry * 0.72,
          100
        );
        c.setLineDash([3, 5]);
        c.strokeStyle = this._pc(0.22 + prox * 0.2);
        c.lineWidth = 1;
        c.beginPath();
        c.ellipse(ox, oy, maxR * body.rx, maxR * body.ry * 0.72, 0, 0, Math.PI * 2);
        c.stroke();
        c.setLineDash([]);
        const bx = ox + Math.cos(body.a) * maxR * body.rx;
        const by = oy + Math.sin(body.a) * maxR * body.ry * 0.72;
        c.beginPath();
        c.arc(bx, by, 4 + prox * 3, 0, Math.PI * 2);
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
        let nearD = Infinity;
        state.stations.forEach((st, i) => {
          const sx = x0 + st.x * span;
          const d = Math.hypot(sx - this.interaction.px, y - this.interaction.py);
          if (d < nearD) {
            nearD = d;
            nearest = i;
          }
        });
        const nsx = x0 + state.stations[nearest].x * span;
        batonX += (nsx - batonX) * 0.12;
        state.baton.speed = nearD < 120 ? 1.8 : 1;
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

    c.restore();
  }

  _drawBokeh() {
    const { bctx: c, width: w, height: h, intensity } = this;
    const pull = this._pointerOffset(0.55);
    c.clearRect(0, 0, w, h);
    this.bokehOrbs.forEach((orb) => {
      const targetX = 0.5 + this.pointer.nx * 0.08;
      const targetY = 0.5 + this.pointer.ny * 0.06;
      orb.x += (targetX - orb.x) * 0.012;
      orb.y += (targetY - orb.y) * 0.012;
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
    this._lerpPointer();
    const mix = this.mix.value;
    if (this._cascadeIsLive(mix)) {
      this._updateCascade(this.ensureEffect("cascade"));
    }
    const stateA = this.ensureEffect(this.effectA);
    const stateB = this.ensureEffect(this.effectB);
    this.ctx.clearRect(0, 0, this.width, this.height);
    this._drawEffect(this.effectA, stateA, 1 - mix);
    if (this.effectB !== this.effectA) this._drawEffect(this.effectB, stateB, mix);
    const active = mix > 0.5 ? this.effectB : this.effectA;
    this._syncDrawableTelemetry(active, this.states[active]);
    this._drawBokeh();
  }
}