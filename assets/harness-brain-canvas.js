'use strict';

/**
 * Copyright (c) 2026 Carapace LLC. All rights reserved.
 *
 * Cortex brand logo — hex-brain canvas animation for the animated brand mark.
 * Proprietary; unauthorized copying or distribution prohibited.
 *
 * Hex-brain canvas for the web harness header hub (same algorithm as electron/splash-renderer.js).
 * Source: carapace-ops cortex-bloom-main HexBrainCanvas.
 */

/** @returns {() => number} uniform in [0,1) */
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function getBrainLayoutRng() {
  const w = typeof window !== 'undefined' ? window : undefined;
  const raw = w && w.__CORTEX_HUB_BRAIN_LAYOUT_SEED__;
  const n = typeof raw === 'number' && Number.isFinite(raw) ? raw | 0 : null;
  return n == null ? Math.random : mulberry32(n);
}

/** Idle animation constants (orb-vox-02: drive multipliers are 1 at zero amplitude). */
const BRAIN_IDLE = {
  timeStep: 0.008,
  pulseEdge: 2,
  pulseNode: 3,
  flowSpeed: 1.5,
  rotSpeed: 0.3,
  sparkThreshold: 0.75
};

/**
 * Audio-reactive multipliers for the hub brain canvas (1 = idle baseline).
 * @param {number} amplitude smoothed 0…1 from orb-audio-drive / brainAmplitudeDrive
 * @returns {{ timeStep: number, pulse: number, flow: number, sparkThreshold: number, dotSize: number, dotAlpha: number }}
 */
function getAudioDrive(amplitude) {
  const a = Math.max(0, Math.min(1, Number(amplitude) || 0));
  return {
    timeStep: 1 + a * 1.75,
    pulse: 1 + a * 1.5,
    flow: 1 + a * 1.25,
    sparkThreshold: BRAIN_IDLE.sparkThreshold - a * 0.22,
    dotSize: 1 + a * 0.9,
    dotAlpha: 1 + a * 0.4
  };
}

/** Deterministic “flow spark” along an edge (replaces per-frame Math.random). */
function edgeFlowSparkOn(i, j, t, sparkThreshold = BRAIN_IDLE.sparkThreshold) {
  const x = Math.sin(i * 127.1 + j * 311.7 + t * 2.718281828) * 10000;
  return x - Math.floor(x) > sparkThreshold;
}

function generateBrainNodes() {
  const ns = [];
  const rnd = getBrainLayoutRng();

  const addHemisphere = (side) => {
    const count = 60;
    for (let i = 0; i < count; i++) {
      const phi = Math.acos(2 * rnd() - 1);
      const theta = rnd() * Math.PI * 2;

      const rx = 130 + rnd() * 20;
      const ry = 95 + rnd() * 15;
      const rz = 110 + rnd() * 15;

      let x = rx * Math.sin(phi) * Math.cos(theta) * (side > 0 ? 0.52 : -0.52) + side * 30;
      let y = ry * Math.cos(phi) * 0.85;
      let z = rz * Math.sin(phi) * Math.sin(theta);

      if (y > 60) y = 60 + (y - 60) * 0.3;

      const foldFreq = 4 + rnd() * 3;
      const foldAmp = 8 + rnd() * 6;
      x += Math.sin(phi * foldFreq + theta * 2) * foldAmp * 0.3;
      y += Math.cos(theta * foldFreq) * foldAmp * 0.25;
      z += Math.sin(theta * foldFreq + phi) * foldAmp * 0.3;

      ns.push({
        x,
        y,
        z,
        px: 0,
        py: 0,
        connections: [],
        pulse: rnd() * Math.PI * 2,
        layer: side > 0 ? 0 : 1
      });
    }
  };

  addHemisphere(1);
  addHemisphere(-1);

  for (let i = 0; i < 25; i++) {
    const phi = Math.acos(2 * rnd() - 1);
    const theta = rnd() * Math.PI * 2;
    const r = 50 + rnd() * 15;
    ns.push({
      x: r * Math.sin(phi) * Math.cos(theta) * 0.8,
      y: 50 + Math.abs(r * Math.cos(phi)) * 0.4,
      z: -70 + r * Math.sin(phi) * Math.sin(theta) * 0.6,
      px: 0,
      py: 0,
      connections: [],
      pulse: rnd() * Math.PI * 2,
      layer: 2
    });
  }

  for (let i = 0; i < 12; i++) {
    const t = i / 12;
    const angle = t * Math.PI * 2;
    const r = 15 + rnd() * 8;
    ns.push({
      x: Math.cos(angle) * r * 0.7,
      y: 65 + t * 40,
      z: -50 - t * 20 + Math.sin(angle) * r * 0.5,
      px: 0,
      py: 0,
      connections: [],
      pulse: rnd() * Math.PI * 2,
      layer: 3
    });
  }

  for (let i = 0; i < 15; i++) {
    const t = i / 15;
    const z = -60 + t * 120;
    ns.push({
      x: (rnd() - 0.5) * 20,
      y: -30 + Math.sin(t * Math.PI) * 25,
      z: z * 0.5,
      px: 0,
      py: 0,
      connections: [],
      pulse: rnd() * Math.PI * 2,
      layer: 4
    });
  }

  for (let i = 0; i < 20; i++) {
    const phi = Math.acos(2 * rnd() - 1);
    const theta = rnd() * Math.PI * 2;
    const r = 30 + rnd() * 20;
    ns.push({
      x: r * Math.sin(phi) * Math.cos(theta) * 0.5,
      y: r * Math.cos(phi) * 0.4,
      z: r * Math.sin(phi) * Math.sin(theta) * 0.5,
      px: 0,
      py: 0,
      connections: [],
      pulse: rnd() * Math.PI * 2,
      layer: -1
    });
  }

  for (let i = 0; i < ns.length; i++) {
    for (let j = i + 1; j < ns.length; j++) {
      const dx = ns[i].x - ns[j].x;
      const dy = ns[i].y - ns[j].y;
      const dz = ns[i].z - ns[j].z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      const threshold = ns[i].layer === ns[j].layer ? 55 : 45;
      if (dist < threshold && ns[i].connections.length < 6) {
        ns[i].connections.push(j);
        ns[j].connections.push(i);
      }
    }
  }

  return ns;
}

/** Read OKLCH site tokens for nav brand canvas (theme-aware). */
function readBrandLogoPalette() {
  const root = typeof document !== 'undefined' ? document.documentElement : null;
  if (!root) {
    return {
      accent: 'oklch(0.78 0.14 210)',
      accentDim: 'oklch(0.55 0.08 210)',
      accentHover: 'oklch(0.82 0.14 210)',
      muted: 'oklch(0.72 0.02 265)',
      isLight: false
    };
  }
  const style = getComputedStyle(root);
  const read = (name, fallback) => style.getPropertyValue(name).trim() || fallback;
  const isLight = root.dataset.theme === 'light';
  return {
    accent: read('--accent', isLight ? 'oklch(0.48 0.14 210)' : 'oklch(0.78 0.14 210)'),
    accentDim: read('--accent-dim', isLight ? 'oklch(0.62 0.08 210)' : 'oklch(0.55 0.08 210)'),
    accentHover: read('--accent-hover', isLight ? 'oklch(0.44 0.14 210)' : 'oklch(0.82 0.14 210)'),
    muted: read('--muted', isLight ? 'oklch(0.42 0.02 265)' : 'oklch(0.72 0.02 265)'),
    isLight
  };
}

/** Interconnected ring + hub for the nav brand mark. */
function generateBrandLogoNodes() {
  const ringCount = 10;
  const radius = 24;
  const nodes = [];

  for (let i = 0; i < ringCount; i++) {
    const angle = (i / ringCount) * Math.PI * 2 - Math.PI / 2;
    nodes.push({
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      z: 0,
      px: 0,
      py: 0,
      connections: [],
      pulse: (i / ringCount) * Math.PI * 2,
      layer: 0
    });
  }

  const hubIndex = nodes.length;
  nodes.push({
    x: 0,
    y: 0,
    z: 0,
    px: 0,
    py: 0,
    connections: [],
    pulse: 0.4,
    layer: 1
  });

  for (let i = 0; i < ringCount; i++) {
    const next = (i + 1) % ringCount;
    nodes[i].connections.push(next);
    nodes[next].connections.push(i);

    const skip = (i + 3) % ringCount;
    if (!nodes[i].connections.includes(skip)) {
      nodes[i].connections.push(skip);
      nodes[skip].connections.push(i);
    }

    if (i % 2 === 0) {
      nodes[i].connections.push(hubIndex);
      nodes[hubIndex].connections.push(i);
    }
  }

  return nodes;
}

/** Three-node cluster for session-rail mini orb (Control Hub tab). */
function generateMiniHubOrbNodes() {
  return [
    {
      x: -22,
      y: -12,
      z: 8,
      px: 0,
      py: 0,
      connections: [1, 2],
      pulse: 0,
      layer: 0
    },
    {
      x: 24,
      y: 6,
      z: -4,
      px: 0,
      py: 0,
      connections: [0, 2],
      pulse: 2.1,
      layer: 0
    },
    {
      x: -6,
      y: 18,
      z: -10,
      px: 0,
      py: 0,
      connections: [0, 1],
      pulse: 4.2,
      layer: 0
    }
  ];
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {{ crispInterior?: boolean, exportMinDpr?: number, mini?: boolean, brand?: boolean }} [opts]
 * @returns {{ destroy: () => void, setBusy?: (busy: boolean) => void, refreshPalette?: () => void } | null}
 */
function initCortexHubBrainCanvas(canvas, opts) {
  if (!canvas || !(canvas instanceof HTMLCanvasElement)) return null;

  const brand = Boolean(opts && opts.brand);
  const mini = brand || Boolean(opts && opts.mini);
  const crisp = brand || mini || Boolean(opts && opts.crispInterior);
  const exportMinDpr =
    crisp && opts && typeof opts.exportMinDpr === 'number'
      ? opts.exportMinDpr
      : crisp
        ? brand
          ? 2.5
          : mini
            ? 2
            : 3.25
        : null;

  const nodes = brand
    ? generateBrandLogoNodes()
    : mini
      ? generateMiniHubOrbNodes()
      : generateBrainNodes();
  const mouse = { x: 0, y: 0 };
  let time = 0;
  let anim = 0;
  let amplitude = 0;
  let busyTarget = 0;
  let palette = brand ? readBrandLogoPalette() : null;

  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const reduceMotion =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function setAmplitude(value) {
    amplitude = amplitude * 0.8 + value * 0.2; // smooth ramp
  }
  if (!mini) {
    window.brainAmplitudeDrive = setAmplitude;
  }

  function resize() {
    let dpr = window.devicePixelRatio || 1;
    if (exportMinDpr != null) dpr = Math.max(dpr, exportMinDpr);
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    canvas.width = Math.max(1, Math.floor(w * dpr));
    canvas.height = Math.max(1, Math.floor(h * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  resize();

  function onResize() {
    resize();
  }

  function onMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = (e.clientX - rect.left - rect.width / 2) / rect.width;
    mouse.y = (e.clientY - rect.top - rect.height / 2) / rect.height;
  }

  window.addEventListener('resize', onResize);
  if (!mini) {
    canvas.addEventListener('mousemove', onMouseMove);
  }

  function layoutBrandNodes(t, w, h) {
    const cx = w / 2;
    const cy = h / 2;
    const rot = t * 0.1;
    const cosR = Math.cos(rot);
    const sinR = Math.sin(rot);
    const layoutScale = Math.min(w, h) * 0.018;

    for (const node of nodes) {
      const rx = node.x * cosR - node.y * sinR;
      const ry = node.x * sinR + node.y * cosR;
      node.px = cx + rx * layoutScale;
      node.py = cy + ry * layoutScale;
    }
  }

  function drawBrandNetwork(t, drive) {
    const edgeBase = palette.isLight ? 0.16 : 0.1;
    const edgePeak = palette.isLight ? 0.34 : 0.26;
    const sparkThreshold = palette.isLight ? 0.68 : BRAIN_IDLE.sparkThreshold;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      for (const j of n.connections) {
        if (j <= i) continue;
        const m = nodes[j];
        const pulseVal =
          (Math.sin(t * BRAIN_IDLE.pulseEdge * drive.pulse + n.pulse) + 1) * 0.5;
        const alpha = edgeBase + pulseVal * (edgePeak - edgeBase);
        const flowT = (t * BRAIN_IDLE.flowSpeed * drive.flow + n.pulse) % 1;
        const edgeColor = n.layer === 1 || m.layer === 1 ? palette.accentHover : palette.accentDim;

        ctx.beginPath();
        ctx.moveTo(n.px, n.py);
        ctx.lineTo(m.px, m.py);
        ctx.strokeStyle = edgeColor;
        ctx.globalAlpha = alpha;
        ctx.lineWidth = 0.9;
        ctx.stroke();
        ctx.globalAlpha = 1;

        if (edgeFlowSparkOn(i, j, t, sparkThreshold)) {
          const fx = n.px + (m.px - n.px) * flowT;
          const fy = n.py + (m.py - n.py) * flowT;
          ctx.beginPath();
          ctx.arc(fx, fy, 0.85, 0, Math.PI * 2);
          ctx.fillStyle = palette.accentHover;
          ctx.globalAlpha = pulseVal * (palette.isLight ? 0.58 : 0.72);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      }
    }

    for (const node of nodes) {
      const pulseVal =
        (Math.sin(t * BRAIN_IDLE.pulseNode * drive.pulse + node.pulse) + 1) * 0.5;
      const isHub = node.layer === 1;
      const size = (isHub ? 1.55 : 1.05) + pulseVal * (isHub ? 0.55 : 0.75);
      const haloR = size + 1.6;
      const haloA = pulseVal * (palette.isLight ? 0.09 : 0.14);

      ctx.beginPath();
      ctx.arc(node.px, node.py, haloR, 0, Math.PI * 2);
      ctx.fillStyle = palette.accent;
      ctx.globalAlpha = haloA;
      ctx.fill();
      ctx.globalAlpha = 1;

      ctx.beginPath();
      ctx.arc(node.px, node.py, size, 0, Math.PI * 2);
      ctx.fillStyle = isHub ? palette.accentHover : palette.accent;
      ctx.globalAlpha = palette.isLight ? 0.68 + pulseVal * 0.28 : 0.58 + pulseVal * 0.36;
      ctx.fill();
      ctx.globalAlpha = 1;

      ctx.beginPath();
      ctx.arc(node.px, node.py, size, 0, Math.PI * 2);
      ctx.strokeStyle = palette.accentDim;
      ctx.globalAlpha = 0.22 + pulseVal * 0.28;
      ctx.lineWidth = 0.65;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  function draw() {
    if (mini && !brand) {
      amplitude = amplitude * 0.82 + busyTarget * 0.18;
    }
    const drive = getAudioDrive(amplitude);
    time += BRAIN_IDLE.timeStep * drive.timeStep;
    const t = time;
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    const cx = w / 2;
    const cy = h / 2;

    ctx.clearRect(0, 0, w, h);

    if (brand) {
      layoutBrandNodes(t, w, h);
      drawBrandNetwork(t, drive);
      if (!reduceMotion) anim = requestAnimationFrame(draw);
      return;
    }

    const rotY = t * BRAIN_IDLE.rotSpeed + mouse.x * 0.5;
    const rotX = mouse.y * 0.3 + 0.1;
    const cosY = Math.cos(rotY);
    const sinY = Math.sin(rotY);
    const cosX = Math.cos(rotX);
    const sinX = Math.sin(rotX);

    for (const node of nodes) {
      const x1 = node.x * cosY - node.z * sinY;
      const z1 = node.x * sinY + node.z * cosY;
      const y1 = node.y * cosX - z1 * sinX;
      const z2 = node.y * sinX + z1 * cosX;
      const scale = 400 / (400 + z2);
      node.px = cx + x1 * scale;
      node.py = cy + y1 * scale;
    }

    ctx.lineCap = crisp ? 'round' : 'butt';
    ctx.lineJoin = crisp ? 'round' : 'miter';

    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      for (const j of n.connections) {
        if (j <= i) continue;
        const m = nodes[j];
        const pulseVal =
          (Math.sin(t * BRAIN_IDLE.pulseEdge * drive.pulse + n.pulse) + 1) * 0.5;
        const alpha = crisp ? 0.12 + pulseVal * 0.22 : 0.06 + pulseVal * 0.12;

        const flowT = (t * BRAIN_IDLE.flowSpeed * drive.flow + n.pulse) % 1;

        ctx.beginPath();
        ctx.moveTo(n.px, n.py);
        ctx.lineTo(m.px, m.py);

        let hue = 180;
        if (n.layer === -1 || m.layer === -1) hue = 260;
        else if (n.layer === 2 || m.layer === 2) hue = 200;
        else if (n.layer === 3 || m.layer === 3) hue = 320;
        else if (n.layer === 4 || m.layer === 4) hue = 220;

        ctx.strokeStyle = `hsla(${hue}, 100%, 50%, ${alpha})`;
        ctx.lineWidth = crisp ? 1.1 : 0.5;
        ctx.stroke();

        if (edgeFlowSparkOn(i, j, t, drive.sparkThreshold)) {
          const fx = n.px + (m.px - n.px) * flowT;
          const fy = n.py + (m.py - n.py) * flowT;
          const sparkR = crisp ? 0.95 : 1.2;
          const sparkA = crisp ? pulseVal * 0.72 : pulseVal * 0.5;
          ctx.beginPath();
          ctx.arc(fx, fy, sparkR, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${hue}, 100%, ${crisp ? 78 : 70}%, ${sparkA})`;
          ctx.fill();
        }
      }
    }

    for (const node of nodes) {
      const pulseVal =
        (Math.sin(t * BRAIN_IDLE.pulseNode * drive.pulse + node.pulse) + 1) * 0.5;
      const ampMod = drive.dotSize;
      const miniDotScale = mini ? 1.45 : 1;
      const size = crisp
        ? (1.05 + pulseVal * 0.95) * ampMod * miniDotScale
        : (1.2 + pulseVal * 1.2) * ampMod * miniDotScale;
      const hue =
        node.layer === -1 ? 320 : node.layer === 2 ? 200 : node.layer === 3 ? 280 : 180;
      const haloR = crisp ? size + 1.35 : size + 3;
      const haloA = crisp ? pulseVal * 0.055 * ampMod : pulseVal * 0.12 * ampMod;
      ctx.beginPath();
      ctx.arc(node.px, node.py, haloR, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${hue}, 100%, 60%, ${haloA})`;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(node.px, node.py, size, 0, Math.PI * 2);
      const fillA = crisp ? 0.62 + pulseVal * 0.38 : 0.4 + pulseVal * 0.6;
      ctx.fillStyle = `hsla(${hue}, 100%, ${60 + pulseVal * 30}%, ${fillA})`;
      ctx.fill();

      if (crisp) {
        ctx.beginPath();
        ctx.arc(node.px, node.py, size, 0, Math.PI * 2);
        ctx.strokeStyle = `hsla(${hue}, 95%, 52%, ${0.28 + pulseVal * 0.42})`;
        ctx.lineWidth = 0.75;
        ctx.stroke();
      }
    }

    if (!reduceMotion) {
      anim = requestAnimationFrame(draw);
    }
  }

  draw();

  const api = {
    destroy() {
      cancelAnimationFrame(anim);
      window.removeEventListener('resize', onResize);
      if (!mini) {
        canvas.removeEventListener('mousemove', onMouseMove);
      }
    }
  };

  if (brand) {
    api.refreshPalette = function () {
      palette = readBrandLogoPalette();
    };
  } else if (mini) {
    api.setBusy = function (busy) {
      busyTarget = busy ? 0.72 : 0;
    };
  }

  return api;
}

/**
 * Session-rail Control Hub tab — 3-node mini brain inside the orb glyph.
 * @param {HTMLCanvasElement} canvas
 * @param {{ busy?: boolean }} [opts]
 */
function initCortexHubTabOrbCanvas(canvas, opts) {
  const api = initCortexHubBrainCanvas(canvas, { mini: true, crispInterior: true });
  if (!api) return null;
  if (api.setBusy) api.setBusy(Boolean(opts && opts.busy));
  return api;
}

/** Nav brand mark — ring of interconnected nodes using site OKLCH tokens. */
function initCortexBrandLogoCanvas(canvas) {
  return initCortexHubBrainCanvas(canvas, { brand: true, crispInterior: true });
}

if (typeof window !== 'undefined') {
  window.initCortexHubBrainCanvas = initCortexHubBrainCanvas;
  window.initCortexHubTabOrbCanvas = initCortexHubTabOrbCanvas;
  window.initCortexBrandLogoCanvas = initCortexBrandLogoCanvas;
  window.CortexHubBrainGetAudioDrive = getAudioDrive;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getAudioDrive,
    edgeFlowSparkOn,
    BRAIN_IDLE,
    generateMiniHubOrbNodes,
    generateBrandLogoNodes,
    readBrandLogoPalette
  };
}
