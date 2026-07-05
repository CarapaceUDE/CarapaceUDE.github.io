/**
 * AnimeEffectsField — canvas effects driven by anime.js v4
 */
import { animate, createTimer } from "https://esm.sh/animejs@4.0.2";

const MATRIX_CHARS = "01アイウエオカキクケコ∞∆∑λ#%&@<>{}[]";
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
    this.reducedMotion = v;
  }

  setHue(h) {
    this.hue = h ?? 210;
  }

  setIntensity(v) {
    this.intensity = v ?? 0.3;
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
    const cols = Math.max(10, Math.floor(w / 20));

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
        columns: Array.from({ length: cols }, (_, i) => ({
          x: i * 20 + 10,
          y: rnd(-h, 0),
          dur: rnd(2200, 5200),
          chars: Array.from({ length: rnd(8, 18) }, () =>
            MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)]
          ),
          headGlow: Math.random() * 100
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
    return `hsla(${hue}, 68%, 72%, ${a})`;
  }

  _lc(a, hue = this.hue) {
    return `hsla(${hue}, 55%, 62%, ${a})`;
  }

  _glow(a) {
    this.ctx.shadowBlur = 18;
    this.ctx.shadowColor = `hsla(${this.hue}, 80%, 65%, ${a})`;
    this.ctx.strokeStyle = this._lc(a);
  }

  _clearGlow() {
    this.ctx.shadowBlur = 0;
    this.ctx.shadowColor = "transparent";
  }

  _drawEffect(id, state, alpha) {
    if (!state || alpha <= 0.002) return;
    const { ctx: c, width: w, height: h } = this;
    const ox = this.cx();
    const oy = this.cy();

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
      state.columns.forEach((col) => {
        col.chars.forEach((ch, i) => {
          const yy = col.y - i * 16;
          if (yy < -20 || yy > h + 20) return;
          const head = i === 0;
          c.fillStyle = head ? this._pc(0.95, 160) : this._pc(Math.max(0.06, 0.65 - i * 0.04));
          c.fillText(ch, col.x, yy);
        });
      });
    }

    if (id === "mesh") {
      state.links.forEach((link) => {
        const a = state.nodes[link.a];
        const b = state.nodes[link.b];
        this._glow(0.32);
        c.lineWidth = 1.1;
        c.beginPath();
        c.moveTo(a.x, a.y);
        c.lineTo(b.x, b.y);
        c.stroke();
        this._clearGlow();
        const px = a.x + (b.x - a.x) * link.t;
        const py = a.y + (b.y - a.y) * link.t;
        c.fillStyle = this._pc(0.85);
        c.fillRect(px - 2, py - 2, 4, 4);
      });
      state.nodes.forEach((n) => {
        const r = 2.2 * n.scale;
        c.beginPath();
        c.arc(n.x, n.y, r, 0, Math.PI * 2);
        c.fillStyle = this._pc(0.48);
        c.fill();
      });
    }

    if (id === "stack") {
      c.font = "11px IBM Plex Mono, monospace";
      state.rows.forEach((row) => {
        const txt = `> ${row.text} [${Math.floor(row.counter) % 999}]`;
        this._glow(0.2);
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(0, row.y);
        c.lineTo(w, row.y);
        c.stroke();
        this._clearGlow();
        c.fillStyle = this._pc(0.4, 195);
        c.fillText(txt, row.x, row.y - 4);
      });
    }

    if (id === "magnet") {
      const pulse = state.core.pulse;
      c.beginPath();
      c.arc(ox, oy, 8 * pulse, 0, Math.PI * 2);
      c.fillStyle = this._pc(0.75);
      c.fill();
      state.streams.forEach((p) => {
        c.beginPath();
        c.moveTo(p.x, p.y);
        c.lineTo(ox, oy);
        c.strokeStyle = this._pc(0.22 * p.trail);
        c.lineWidth = p.size;
        c.stroke();
        c.beginPath();
        c.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        c.fillStyle = this._pc(0.45 * p.trail);
        c.fill();
      });
    }

    if (id === "signal") {
      const baseY = h * 0.68;
      const amp = h * 0.09;
      const slope = h * 0.28;
      this._glow(0.55 * state.glow);
      c.lineWidth = 2.6;
      c.beginPath();
      for (let x = 0; x <= w; x += 3) {
        const n = x / w;
        const spike = state.spikes[Math.floor(n * state.spikes.length)] || 0.5;
        const trend = -n * slope + state.climb;
        const wave =
          Math.sin(n * 11 + state.phase) * amp * 0.28 +
          Math.sin(n * 2.8 - state.phase * 0.5) * amp * spike * 0.42;
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
      const hx = ox + Math.cos(state.hand - Math.PI / 2) * maxR * 0.78;
      const hy = cy2 + Math.sin(state.hand - Math.PI / 2) * maxR * 0.78;
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

    c.restore();
  }

  _drawBokeh() {
    const { bctx: c, width: w, height: h, intensity } = this;
    c.clearRect(0, 0, w, h);
    this.bokehOrbs.forEach((orb) => {
      const x = orb.x * w;
      const y = orb.y * h;
      const g = c.createRadialGradient(x, y, 0, x, y, orb.r);
      g.addColorStop(0, `hsla(${this.hue}, 48%, 68%, ${orb.alpha * intensity * 0.9})`);
      g.addColorStop(0.4, `hsla(${this.hue}, 40%, 58%, ${orb.alpha * 0.25 * intensity})`);
      g.addColorStop(1, "transparent");
      c.fillStyle = g;
      c.beginPath();
      c.arc(x, y, orb.r, 0, Math.PI * 2);
      c.fill();
    });
    c.save();
    const fadeR = Math.max(w, h) * 0.58;
    const edge = c.createRadialGradient(this.cx(), this.cy(), fadeR * 0.18, this.cx(), this.cy(), fadeR);
    edge.addColorStop(0, "rgba(0,0,0,1)");
    edge.addColorStop(0.55, "rgba(0,0,0,0.8)");
    edge.addColorStop(1, "rgba(0,0,0,0)");
    c.globalCompositeOperation = "destination-in";
    c.fillStyle = edge;
    c.fillRect(0, 0, w, h);
    c.restore();
  }

  _draw() {
    const mix = this.mix.value;
    const stateA = this.ensureEffect(this.effectA);
    const stateB = this.ensureEffect(this.effectB);
    this.ctx.clearRect(0, 0, this.width, this.height);
    this._drawEffect(this.effectA, stateA, 1 - mix);
    if (this.effectB !== this.effectA) this._drawEffect(this.effectB, stateB, mix);
    this._drawBokeh();
  }
}