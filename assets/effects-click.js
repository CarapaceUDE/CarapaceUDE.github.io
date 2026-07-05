/**
 * Per-effect empty-space click microinteractions for AnimeEffectsField.
 * Dispatch registry covers all 34 SHIPPED_EFFECT_IDS.
 */
import { animate } from "https://esm.sh/animejs@4.0.2";

export const CLICK_PULSE_CAP = 4;
export const CLICK_COOLDOWN_MS = 200;

const GLITCH_CHARS = "█▓▒░╳╱╲│─┼<>[]{}#@$%&01";
const CLICK_BASE = Symbol("clickBase");
const CLICK_ANIMS = Symbol("clickAnims");

function rnd(a, b) {
  return a + Math.random() * (b - a);
}

function nearestIndex(items, x, y, toXY) {
  if (!items?.length) return 0;
  let best = 0;
  let bestD = Infinity;
  items.forEach((item, i) => {
    const p = toXY(item);
    const d = Math.hypot(p.x - x, p.y - y);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  });
  return best;
}

export function ensureClickState(state) {
  if (!state.clickPulses) state.clickPulses = [];
  if (!state.clickFx) state.clickFx = {};
  if (state.clickFx.glowBoost === undefined) state.clickFx.glowBoost = 0;
  if (state.clickFx.handBlend === undefined) state.clickFx.handBlend = 0;
  return state;
}

function clickBaselines(target) {
  if (!target[CLICK_BASE]) target[CLICK_BASE] = {};
  return target[CLICK_BASE];
}

function cancelClickAnims(target, keys) {
  const bag = target?.[CLICK_ANIMS];
  if (!bag) return;
  const paused = new Set();
  const keyList = keys ?? [...bag.keys()];
  for (const key of keyList) {
    const anim = bag.get(key);
    if (anim && !paused.has(anim)) {
      anim.pause?.();
      paused.add(anim);
    }
    bag.delete(key);
  }
}

function registerClickAnim(target, keys, anim) {
  if (!target[CLICK_ANIMS]) target[CLICK_ANIMS] = new Map();
  for (const key of keys) {
    const prev = target[CLICK_ANIMS].get(key);
    if (prev && prev !== anim) prev.pause?.();
    target[CLICK_ANIMS].set(key, anim);
  }
}

function bump(field, target, props, duration = 480) {
  const keys = Object.keys(props);
  const bases = clickBaselines(target);
  cancelClickAnims(target, keys);

  const normalized = {};
  for (const [key, val] of Object.entries(props)) {
    if (Array.isArray(val) && val.length === 3) {
      if (bases[key] === undefined) bases[key] = target[key];
      normalized[key] = [target[key], val[1], bases[key]];
    } else {
      normalized[key] = val;
    }
  }

  const anim = animate(target, { ...normalized, duration, ease: "outCubic" });
  field._track(anim);
  registerClickAnim(target, keys, anim);
  return anim;
}

function glowBoost(field, state, peak = 0.45, duration = 480) {
  ensureClickState(state);
  bump(field, state.clickFx, { glowBoost: [state.clickFx.glowBoost, peak, 0] }, duration);
}

function flashSeg(field, state, segIdx, duration = 700) {
  if (!state.clickSegFlash || state.clickSegFlash[segIdx] === undefined) return;
  if (!state._clickSegAnims) state._clickSegAnims = [];
  state._clickSegAnims[segIdx]?.pause?.();
  const proxy = { p: state.clickSegFlash[segIdx] ?? 0 };
  const anim = animate(proxy, {
    p: [proxy.p, 1, 0],
    duration,
    ease: "outCubic",
    onUpdate: () => {
      state.clickSegFlash[segIdx] = proxy.p;
    },
    onComplete: () => {
      state.clickSegFlash[segIdx] = 0;
      if (state._clickSegAnims?.[segIdx] === anim) state._clickSegAnims[segIdx] = null;
    }
  });
  state._clickSegAnims[segIdx] = anim;
  field._track(anim);
}

export function spawnClickPulse(field, state, x, y, opts = {}) {
  ensureClickState(state);
  while (state.clickPulses.length >= CLICK_PULSE_CAP) {
    const evicted = state.clickPulses.shift();
    evicted?._anim?.pause?.();
  }
  const pulse = {
    x,
    y,
    r: 0,
    alpha: opts.alpha ?? 0.5,
    maxR: opts.maxR ?? 72,
    kind: opts.kind ?? "ring",
    w: opts.w ?? 1.4
  };
  state.clickPulses.push(pulse);
  const anim = animate(pulse, {
    r: [0, pulse.maxR],
    alpha: [pulse.alpha, 0],
    duration: opts.duration ?? 580,
    ease: opts.ease ?? "outCubic",
    onComplete: () => {
      pulse._anim?.pause?.();
      const i = state.clickPulses.indexOf(pulse);
      if (i >= 0) state.clickPulses.splice(i, 1);
    }
  });
  pulse._anim = anim;
  field._track(anim);
  return pulse;
}

export function drawClickPulses(field, c, state) {
  if (!state?.clickPulses?.length) return;
  for (const pulse of state.clickPulses) {
    if (pulse.alpha < 0.02 || pulse.kind !== "ring") continue;
    field._glow(0.22 * pulse.alpha);
    c.lineWidth = pulse.w;
    c.beginPath();
    c.arc(pulse.x, pulse.y, pulse.r, 0, Math.PI * 2);
    c.stroke();
    field._clearGlow();
  }
  if (state.clickFx?.crosshair) {
    const ch = state.clickFx.crosshair;
    if (ch.alpha > 0.02) {
      c.strokeStyle = field._pc(0.42 * ch.alpha);
      c.lineWidth = 0.9;
      c.beginPath();
      c.moveTo(ch.x - 10, ch.y);
      c.lineTo(ch.x + 10, ch.y);
      c.moveTo(ch.x, ch.y - 10);
      c.lineTo(ch.x, ch.y + 10);
      c.stroke();
    }
  }
}

export const CLICK_HANDLERS = {
  shield(field, state, x, y) {
    spawnClickPulse(field, state, x, y, { maxR: 95, alpha: 0.62 });
    if (state.sparks?.length) {
      const ox = field.cx();
      const oy = field.cy();
      const spark = state.sparks.reduce((best, s) => {
        const sx = ox + Math.cos(s.a) * field.width * 0.5 * s.r;
        const sy = oy + Math.sin(s.a) * field.height * 0.5 * s.r * 0.68;
        const d = Math.hypot(sx - x, sy - y);
        return d < best.d ? { s, d } : best;
      }, { s: state.sparks[0], d: Infinity }).s;
      bump(field, spark, { alpha: [spark.alpha, 0.95, spark.alpha], size: [spark.size, spark.size * 2.2, spark.size] });
    }
  },

  vault(field, state, x, y) {
    spawnClickPulse(field, state, x, y, { maxR: 70, alpha: 0.48 });
    spawnClickPulse(field, state, x, y, { maxR: 48, alpha: 0.35, duration: 420 });
    bump(field, state.lock, { pulse: [1, 1.35, 1] });
  },

  seal(field, state, x, y) {
    spawnClickPulse(field, state, x, y, { maxR: 88, alpha: 0.55 });
    bump(field, state.ring, { impress: [state.ring.impress, 1, 0], pulse: [1, 1.28, 1] });
    state.ripples?.forEach((ripple, i) => {
      field._track(
        animate(ripple, {
          alpha: [0, 0.45, 0],
          r: [ripple.r, ripple.r + 0.08, ripple.r],
          duration: 520 + i * 80,
          delay: i * 60,
          ease: "outQuad"
        })
      );
    });
  },

  checksum(field, state, x, y) {
    const nx = x / field.width;
    state.marks?.forEach((mark, i) => {
      if (Math.abs(mark.x - nx) > 0.12) return;
      field._track(
        animate(mark, {
          alpha: [mark.alpha, 0.75, 0.35],
          h: [mark.h, mark.h * 1.4, mark.h],
          duration: 400 + i * 40,
          delay: i * 30,
          ease: "outCubic"
        })
      );
    });
    spawnClickPulse(field, state, x, y, { maxR: 55, alpha: 0.4 });
  },

  cascade(field, state, x, y) {
    const hitCols = state.columns
      ?.map((col, i) => ({ i, d: Math.abs(col.x - x) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, 2);
    hitCols?.forEach(({ i }) => {
      const col = state.columns[i];
      col.chars?.forEach((entry) => {
        entry.glitchT = 6;
        entry.display = GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
        entry.ox = rnd(-3, 3);
        entry.oy = rnd(-2, 2);
      });
    });
    spawnClickPulse(field, state, x, y, { maxR: 72, alpha: 0.52, kind: "ring", duration: 640 });
  },

  stack(field, state, x, y) {
    const row = state.rows?.reduce((best, r) => {
      const d = Math.abs(r.y - y);
      return d < best.d ? { r, d } : best;
    }, { r: state.rows?.[0], d: Infinity })?.r;
    if (row) {
      row.text = `> click@${Math.round(x)},${Math.round(y)}`;
      row.x = x;
      row.counter += 1;
      field._track(animate(row, { x: [x, x], duration: 500, ease: "linear" }));
    }
    spawnClickPulse(field, state, x, y, { maxR: 50, alpha: 0.35 });
  },

  glyph(field, state, x, y) {
    const frags = [...(state.fragments ?? [])]
      .map((f) => ({
        f,
        d: Math.hypot(f.x * field.width - x, f.y * field.height - y)
      }))
      .sort((a, b) => a.d - b.d)
      .slice(0, 3);
    frags.forEach(({ f }) => {
      f.glitchT = 8;
      f.display = GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
      const ang = Math.atan2(f.y * field.height - y, f.x * field.width - x);
      field._track(
        animate(f, {
          x: [f.x, f.x + Math.cos(ang) * 0.04, f.x],
          y: [f.y, f.y + Math.sin(ang) * 0.04, f.y],
          duration: 520,
          ease: "outCubic"
        })
      );
    });
    spawnClickPulse(field, state, x, y, { maxR: 65, alpha: 0.42 });
  },

  hashwave(field, state, x, y) {
    const col = Math.floor((x / field.width) * (state.cols ?? 1));
    state.wave = col / Math.max(1, state.cols - 1);
    state.glyphs?.forEach((g) => {
      if (Math.abs(g.col - col) <= 2) {
        g.scrambleT = 6;
        g.scramble = GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
        const bases = clickBaselines(g);
        if (bases.alpha === undefined) bases.alpha = g.alpha;
        bump(field, g, { alpha: [g.alpha, Math.min(0.95, bases.alpha + 0.35), bases.alpha] });
      }
    });
    spawnClickPulse(field, state, x, y, { maxR: 80, alpha: 0.4, w: 0.9 });
  },

  mesh(field, state, x, y) {
    const nodes = state.nodes ?? [];
    if (!nodes.length) {
      spawnClickPulse(field, state, x, y, { maxR: 58, alpha: 0.48 });
      return;
    }
    const ni = nearestIndex(nodes, x, y, (n) => n);
    const node = nodes[ni];
    bump(field, node, { scale: [node.scale, 1.55, 1] });
    state.links?.forEach((link) => {
      if (link.a !== ni && link.b !== ni) return;
      bump(field, link, { t: [link.t, Math.min(1, link.t + 0.35), link.t] }, 600);
    });
    spawnClickPulse(field, state, node.x, node.y, { maxR: 58, alpha: 0.48 });
  },

  topology(field, state, x, y) {
    const ox = field.cx();
    const oy = field.cy();
    const ang = Math.atan2(y - oy, x - ox);
    const ni = nearestIndex(state.nodes, x, y, (n) => ({
      x: ox + Math.cos(n.a) * field.width * 0.5 * n.d,
      y: oy + Math.sin(n.a) * field.height * 0.5 * n.d * 0.68
    }));
    const node = state.nodes[ni];
    node.packet = 0;
    bump(field, node, { pulse: [1, 1.4, 1] });
    bump(field, state.hub, { pulse: [1, 1.2, 1] });
    spawnClickPulse(field, state, ox + Math.cos(ang) * 40, oy + Math.sin(ang) * 40, { maxR: 70, alpha: 0.45 });
  },

  constellation(field, state, x, y) {
    const ox = field.cx();
    const oy = field.cy();
    const ni = nearestIndex(state.nodes, x, y, (n) => ({
      x: ox + Math.cos(n.a) * field.width * 0.5 * n.d,
      y: oy + Math.sin(n.a) * field.height * 0.5 * n.d * 0.68
    }));
    bump(field, state.nodes[ni], { pulse: [1, 1.5, 1] });
    glowBoost(field, state, 0.45);
    spawnClickPulse(field, state, x, y, { maxR: 62, alpha: 0.44 });
  },

  cellscan(field, state, x, y) {
    const sites = state.sites ?? [];
    if (!sites.length) {
      spawnClickPulse(field, state, x, y, { maxR: 75, alpha: 0.52 });
      return;
    }
    const ni = nearestIndex(sites, x, y, (s) => s);
    state.highlight = ni;
    const site = sites[ni];
    bump(field, site, { bloom: [site.bloom, 1, 0] });
    spawnClickPulse(field, state, site.x, site.y, { maxR: 75, alpha: 0.52 });
  },

  flowchart(field, state, x, y) {
    const boxIdx = nearestIndex(state.boxes, x, y, (b) => ({
      x: b.x * field.width + (b.w * field.width) / 2,
      y: b.y * field.height + (b.h * field.height) / 2
    }));
    const pkt = state.packets?.[boxIdx % (state.packets?.length ?? 1)];
    if (pkt) field._track(animate(pkt, { t: [0, 1], duration: 900, ease: "linear" }));
    spawnClickPulse(field, state, x, y, { maxR: 55, alpha: 0.4 });
  },

  pipeline(field, state, x, y) {
    const nx = x / field.width;
    state.sweep = nx;
    const si = nearestIndex(state.stages, x, y, (s) => ({ x: s.x * field.width, y: s.y * field.height }));
    bump(field, state.stages[si], { pulse: [1, 1.45, 1], active: [0, 1, 0] });
    spawnClickPulse(field, state, x, y, { maxR: 68, alpha: 0.38 });
  },

  schematic(field, state, x, y) {
    ensureClickState(state);
    state.clickFx._crosshairAnim?.pause?.();
    state.clickFx.crosshair = { x, y, alpha: 0.7 };
    const anim = animate(state.clickFx.crosshair, { alpha: [0.7, 0], duration: 700, ease: "outQuad" });
    state.clickFx._crosshairAnim = anim;
    field._track(anim);
    spawnClickPulse(field, state, x, y, { maxR: 45, alpha: 0.42, w: 0.8 });
  },

  trace(field, state, x, y) {
    const pts = state.points ?? [];
    let bestSeg = 0;
    let bestD = Infinity;
    for (let i = 0; i < pts.length - 1; i++) {
      const ax = pts[i].x * field.width;
      const ay = pts[i].y * field.height;
      const bx = pts[i + 1].x * field.width;
      const by = pts[i + 1].y * field.height;
      const d = Math.hypot((ax + bx) / 2 - x, (ay + by) / 2 - y);
      if (d < bestD) {
        bestD = d;
        bestSeg = i;
      }
    }
    flashSeg(field, state, bestSeg);
    spawnClickPulse(field, state, x, y, { maxR: 52, alpha: 0.45 });
  },

  branch(field, state, x, y) {
    const nodes = state.nodes ?? [];
    if (!nodes.length) {
      spawnClickPulse(field, state, x, y, { maxR: 48, alpha: 0.46 });
      return;
    }
    const ni = nearestIndex(nodes, x, y, (n) => ({
      x: n.x * field.width,
      y: n.y * field.height
    }));
    const node = nodes[ni];
    bump(field, node, { reveal: [node.reveal, 1.15, node.reveal] });
    spawnClickPulse(field, state, node.x * field.width, node.y * field.height, { maxR: 48, alpha: 0.46 });
  },

  pcb(field, state, x, y) {
    const trace = state.traces?.reduce((best, tr) => {
      const tx = tr.x * field.width;
      const ty = tr.y * field.height;
      const d = Math.hypot(tx - x, ty - y);
      return d < best.d ? { tr, d } : best;
    }, { tr: state.traces?.[0], d: Infinity })?.tr;
    if (trace) bump(field, trace, { pulse: [1, 1.6, 1] });
    spawnClickPulse(field, state, x, y, { maxR: 58, alpha: 0.4 });
  },

  hexpulse(field, state, x, y) {
    const size = state.size ?? 20;
    const cx0 = field.cx() + (state.anchorX ?? 0);
    const cy0 = field.cy() + (state.anchorY ?? 0);
    const cols = state.cols ?? 1;
    const rows = state.rows ?? 1;
    let best = state.cells?.[0];
    let bestD = Infinity;
    state.cells?.forEach((cell) => {
      const hx = cx0 + (cell.col - (cols - 1) / 2) * size * 1.5;
      const hy = cy0 + (cell.row - (rows - 1) / 2) * size * Math.sqrt(3) + (cell.col % 2 ? size * 0.866 : 0);
      const d = Math.hypot(hx - x, hy - y);
      if (d < bestD) {
        bestD = d;
        best = cell;
      }
    });
    if (best) {
      bump(field, best, { scale: [1, 1.35, 1], alpha: [best.alpha, 0.85, best.alpha] });
      state.cells?.forEach((cell) => {
        const dist = Math.hypot(cell.col - best.col, cell.row - best.row);
        if (dist > 0 && dist <= 1.5) {
          const bases = clickBaselines(cell);
          if (bases.alpha === undefined) bases.alpha = cell.alpha;
          if (bases.scale === undefined) bases.scale = cell.scale ?? 1;
          bump(
            field,
            cell,
            { scale: [cell.scale ?? 1, 1.18, bases.scale], alpha: [cell.alpha, bases.alpha + 0.2, bases.alpha] },
            420 + dist * 60
          );
        }
      });
    }
    spawnClickPulse(field, state, x, y, { maxR: 64, alpha: 0.42 });
  },

  magnet(field, state, x, y) {
    const burst = (state.streams ?? []).slice(0, 12);
    burst.forEach((s, i) => {
      field._track(
        animate(s, {
          x: [s.x, x + rnd(-8, 8), s.x],
          y: [s.y, y + rnd(-8, 8), s.y],
          duration: 520 + i * 25,
          ease: "outCubic"
        })
      );
    });
    bump(field, state.core, { pulse: [1, 1.4, 1] });
    spawnClickPulse(field, state, x, y, { maxR: 85, alpha: 0.5 });
  },

  signal(field, state, x, y) {
    const idx = Math.min(state.spikes.length - 1, Math.max(0, Math.floor((x / field.width) * state.spikes.length)));
    if (!state._clickSpikeAnims) state._clickSpikeAnims = [];
    state._clickSpikeAnims[idx]?.pause?.();
    if (!state._spikeBases) state._spikeBases = [];
    if (state._spikeBases[idx] === undefined) state._spikeBases[idx] = state.spikes[idx];
    const base = state._spikeBases[idx];
    const spike = { v: state.spikes[idx] };
    const anim = animate(spike, {
      v: [spike.v, 1, base],
      duration: 480,
      ease: "outCubic",
      onUpdate: () => {
        state.spikes[idx] = spike.v;
      },
      onComplete: () => {
        state.spikes[idx] = base;
        if (state._clickSpikeAnims?.[idx] === anim) state._clickSpikeAnims[idx] = null;
      }
    });
    state._clickSpikeAnims[idx] = anim;
    field._track(anim);
    glowBoost(field, state, 0.5);
    spawnClickPulse(field, state, x, y, { maxR: 50, alpha: 0.44 });
  },

  chrono(field, state, x, y) {
    ensureClickState(state);
    const ox = field.cx();
    const oy = field.cy();
    state.clickFx.handSnap = Math.atan2(y - oy, x - ox);
    bump(field, state.clickFx, { handBlend: [state.clickFx.handBlend, 1, 0] }, 600);
    spawnClickPulse(field, state, x, y, { maxR: 42, alpha: 0.4 });
  },

  ledger(field, state, x, y) {
    const nx = x / field.width;
    const col = state.columns?.reduce((best, c) => {
      const d = Math.abs(c.x - nx);
      return d < best.d ? { c, d } : best;
    }, { c: state.columns?.[0], d: Infinity })?.c;
    if (col) {
      bump(field, col, { pulse: [1, 1.5, 1], counter: [col.counter, col.counter + Math.floor(rnd(5, 40)), col.counter] });
    }
    spawnClickPulse(field, state, x, y, { maxR: 54, alpha: 0.42 });
  },

  telemetry(field, state, x, y) {
    const nx = x / field.width;
    state.ticks?.forEach((tick, i) => {
      if (Math.abs(tick.x - nx) > 0.15) return;
      const bases = clickBaselines(tick);
      if (bases.h === undefined) bases.h = tick.h;
      bump(
        field,
        tick,
        { h: [tick.h, Math.min(0.35, bases.h + 0.18), bases.h] },
        450 + i * 35
      );
    });
    spawnClickPulse(field, state, x, y, { maxR: 48, alpha: 0.38 });
  },

  ping(field, state, x, y) {
    const ox = field.cx();
    const oy = field.cy();
    const ang = Math.atan2(y - oy, x - ox);
    const blip = state.blips?.[0];
    if (blip) {
      blip.a = ang;
      blip.d = Math.min(0.42, Math.hypot(x - ox, y - oy) / Math.min(field.width, field.height));
      bump(field, blip, { scale: [0, 1.2, 0], alpha: [0, 0.85, 0] });
    }
    spawnClickPulse(field, state, x, y, { maxR: 72, alpha: 0.48 });
  },

  sonar(field, state, x, y) {
    const ox = field.cx();
    const oy = field.cy();
    const ang = Math.atan2(y - oy, x - ox);
    const echo = state.echoes?.find((e) => e.alpha < 0.05) ?? state.echoes?.[0];
    if (echo) {
      echo.a = ang;
      echo.d = Math.min(0.4, Math.hypot(x - ox, y - oy) / Math.min(field.width, field.height));
      field._track(animate(echo, { r: [0, 0.35, 0], alpha: [0, 0.7, 0], duration: 650, ease: "outQuad" }));
    }
    spawnClickPulse(field, state, x, y, { maxR: 78, alpha: 0.5 });
  },

  beacon(field, state, x, y) {
    [0, 1, 2].forEach((i) => {
      spawnClickPulse(field, state, x, y, {
        maxR: 55 + i * 28,
        alpha: 0.5 - i * 0.12,
        duration: 500 + i * 120,
        w: 1.1 - i * 0.15
      });
    });
    const anchor = state.anchors?.reduce((best, a) => {
      const ax = a.x * field.width;
      const ay = a.y * field.height;
      const d = Math.hypot(ax - x, ay - y);
      return d < best.d ? { a, d } : best;
    }, { a: state.anchors?.[0], d: Infinity })?.a;
    anchor?.rings?.forEach((ring, i) => {
      field._track(
        animate(ring, {
          r: [0, 0.22 + i * 0.06, 0],
          alpha: [0, 0.55, 0],
          duration: 560 + i * 90,
          delay: i * 70,
          ease: "outQuad"
        })
      );
    });
  },

  relay(field, state, x, y) {
    const nx = x / field.width;
    const ti = nearestIndex(state.stations, x, y, (s) => ({ x: s.x * field.width, y: field.height * 0.5 }));
    state._batonClickAnim?.pause?.();
    state.baton.from = state.baton.to ?? 0;
    state.baton.to = ti;
    state.baton.t = 0;
    state.baton.speed = 2.2;
    const anim = animate(state.baton, { t: [0, 1], duration: 700, ease: "outCubic" });
    state._batonClickAnim = anim;
    field._track(anim);
    spawnClickPulse(field, state, nx * field.width, field.height * 0.5, { maxR: 50, alpha: 0.42 });
  },

  parcel(field, state, x, y) {
    const stations = state.stations ?? [];
    if (stations.length < 2) {
      spawnClickPulse(field, state, x, y, { maxR: 56, alpha: 0.45 });
      return;
    }
    const ti = nearestIndex(stations, x, y, (s) => ({
      x: s.x * field.width,
      y: s.y * field.height
    }));
    const maxSeg = stations.length - 2;
    const seg = Math.max(0, Math.min(ti, maxSeg));
    state.packets?.push({ seg, t: 0, speed: 1.6 });
    while ((state.packets?.length ?? 0) > 6) state.packets.shift();
    spawnClickPulse(field, state, x, y, { maxR: 56, alpha: 0.45 });
  },

  weave(field, state, x, y) {
    const thread = state.hThreads?.reduce((best, t) => {
      const ty = t.y * field.height;
      const d = Math.abs(ty - y);
      return d < best.d ? { t, d } : best;
    }, { t: state.hThreads?.[0], d: Infinity })?.t;
    if (thread) {
      field._track(animate(thread, { offset: [thread.offset, thread.offset + 0.035, thread.offset], duration: 500, ease: "outCubic" }));
    }
    spawnClickPulse(field, state, x, y, { maxR: 58, alpha: 0.38 });
  },

  filament(field, state, x, y) {
    if (!state.clickKnots) state.clickKnots = [];
    state.clickKnots.push({ x: x / field.width, y: y / field.height, alpha: 1 });
    while (state.clickKnots.length > 3) state.clickKnots.shift();
    const knot = state.clickKnots[state.clickKnots.length - 1];
    cancelClickAnims(knot, ["alpha"]);
    field._track(animate(knot, { alpha: [1, 0], duration: 800, ease: "outQuad" }));
    spawnClickPulse(field, state, x, y, { maxR: 52, alpha: 0.4 });
  },

  isograph(field, state, x, y) {
    const cols = state.cols ?? 1;
    const rows = state.rows ?? 1;
    const col = Math.min(cols - 1, Math.max(0, Math.floor((x / field.width) * cols)));
    const row = Math.min(rows - 1, Math.max(0, Math.floor((y / field.height) * rows)));
    state.highlight.col = col;
    state.highlight.row = row;
    bump(field, state.highlight, { pulse: [1, 1.45, 1] });
    spawnClickPulse(field, state, x, y, { maxR: 54, alpha: 0.42 });
  },

  lattice(field, state, x, y) {
    const layer = state.layers?.[1] ?? state.layers?.[0];
    if (layer) {
      const impulse = (x / field.width - 0.5) * 0.08;
      field._track(
        animate(layer, {
          offsetX: [layer.offsetX, layer.offsetX + impulse, layer.offsetX],
          shear: [layer.shear, layer.shear + impulse * 0.5, layer.shear],
          duration: 620,
          ease: "outCubic"
        })
      );
    }
    spawnClickPulse(field, state, x, y, { maxR: 70, alpha: 0.4 });
  },

  orbit(field, state, x, y) {
    const ox = field.cx();
    const oy = field.cy();
    const body = state.bodies?.reduce((best, b) => {
      const bx = ox + Math.cos(b.a) * field.width * 0.5 * b.rx;
      const by = oy + Math.sin(b.a) * field.height * 0.5 * b.ry;
      const d = Math.hypot(bx - x, by - y);
      return d < best.d ? { b, d } : best;
    }, { b: state.bodies?.[0], d: Infinity })?.b;
    if (body) {
      const bases = clickBaselines(body);
      if (bases.rx === undefined) bases.rx = body.rx;
      if (bases.speed === undefined) bases.speed = body.speed;
      bump(field, body, {
        rx: [body.rx, bases.rx * 1.12, bases.rx],
        speed: [body.speed, bases.speed * 1.4, bases.speed]
      });
    }
    glowBoost(field, state, 0.5);
    spawnClickPulse(field, state, x, y, { maxR: 66, alpha: 0.46 });
  }
};

export function dispatchClick(field, id, state, x, y) {
  ensureClickState(state);
  const handler = CLICK_HANDLERS[id];
  if (handler) handler(field, state, x, y);
  else spawnClickPulse(field, state, x, y);
}