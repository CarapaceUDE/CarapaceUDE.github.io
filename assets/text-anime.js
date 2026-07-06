/**
 * HeroTextAnime, DOM typography choreographed with anime.js v4
 */
import { animate, createTimeline, stagger } from "https://esm.sh/animejs@4.0.2";
import { enrichProofChip } from "./chip-bullet-enrich.js?v=20260706b";
import { sanitizeCopyText, sanitizeSlide } from "./copy-sanitize.js?v=20260706b";
import { PILOT_NOTE_DISCLAIMER } from "./hero-constants.js";

const EXIT = [
  { z: ["0px", "-200px"], opacity: [1, 0], ease: "inExpo" },
  { rotateY: ["0deg", "140deg"], z: ["0px", "-120px"], opacity: [1, 0], ease: "inExpo" },
  { y: ["0px", "-64px"], rotateX: ["0deg", "48deg"], opacity: [1, 0], ease: "inExpo" },
  { x: ["0px", "130px"], rotateY: ["0deg", "-52deg"], opacity: [1, 0], ease: "inExpo" },
  { rotateX: ["0deg", "-72deg"], z: ["0px", "-90px"], opacity: [1, 0], ease: "inExpo" },
  null,
  { y: ["0px", "72px"], rotateZ: ["0deg", "-48deg"], opacity: [1, 0], ease: "inExpo" },
  { z: ["0px", "-160px"], rotateY: ["0deg", "120deg"], opacity: [1, 0], ease: "inExpo" }
];

const WORD_EXIT = [
  { y: ["0%", "95%"], z: ["0px", "-120px"], rotateX: ["0deg", "52deg"], opacity: [1, 0] },
  { y: ["0%", "-95%"], rotateY: ["0deg", "-120deg"], opacity: [1, 0] },
  { x: ["0%", "80%"], opacity: [1, 0] },
  { x: ["0%", "100%"], rotateY: ["0deg", "-70deg"], opacity: [1, 0] },
  { scale: [1, 0.5], rotateX: ["0deg", "-80deg"], opacity: [1, 0] },
  null,
  { y: ["0%", "-80%"], rotateZ: ["0deg", "-36deg"], opacity: [1, 0] },
  { z: ["0px", "-100px"], rotateY: ["0deg", "100deg"], opacity: [1, 0] }
];

const STAGE_TILT = [
  { rx: -8, ry: 6 }, { rx: 7, ry: -5 }, { rx: -6, ry: 4 }, { rx: 8, ry: -6 },
  { rx: -7, ry: 5 }, { rx: 6, ry: -4 }, { rx: -9, ry: 7 }, { rx: 7, ry: -5 }
];

const ENTER_DUR = 660;
const ENTER_LAYER_BASE = 34;
const ENTER_LAYER_GAP = 28;
const ENTER_CHAR_BASE = 58;
const ENTER_CHAR_GAP = 16;

function runTimeline(build) {
  return new Promise((resolve) => {
    const tl = createTimeline({ onComplete: resolve });
    build(tl);
  });
}

function slotIndex(el, slot) {
  if (el.classList.contains("title-char")) return Number(el.dataset.char);
  if (el.classList.contains("title-word")) return Number(el.dataset.word);
  const layers = ["eyebrow", "sub", "note", "pilot-note", "proof"];
  const layer = el.dataset.layer;
  return layer ? layers.indexOf(layer) : slot;
}

function titleWordHtml(word, index) {
  const chars = [...word]
    .map(
      (ch, ci) =>
        `<span class="title-char" data-char="${ci}">${ch === " " ? "\u00a0" : ch}</span>`
    )
    .join("");
  return `<span class="title-word" data-word="${index}">${chars}</span>`;
}

function prepareTitleChars(root) {
  root.querySelectorAll(".title-word").forEach((wordEl) => {
    if (wordEl.querySelector(".title-char")) return;
    const text = wordEl.textContent ?? "";
    wordEl.textContent = "";
    [...text].forEach((ch, ci) => {
      const span = document.createElement("span");
      span.className = "title-char";
      span.dataset.char = String(ci);
      span.textContent = ch === " " ? "\u00a0" : ch;
      wordEl.appendChild(span);
    });
  });
}

function buildGlitchEnter(el, slot, { isChar = false } = {}) {
  const i = slotIndex(el, slot);
  const lane = (i % 3) - 1;
  const sign = i % 2 ? 1 : -1;
  const amp = isChar ? 0.52 : 0.78;
  const jitter = lane * 16 * amp;
  return {
    opacity: [0, 0.9, 0.28, 1, 0.55, 1],
    x: [
      `${jitter + sign * 26 * amp}px`,
      `${-sign * 14 * amp}px`,
      `${sign * 7 * amp}px`,
      `${-sign * 2 * amp}px`,
      "0px"
    ],
    y: [`${sign * -14 * amp}px`, `${sign * 8 * amp}px`, `${-sign * 3 * amp}px`, "0px"],
    skewX: [`${sign * 16}deg`, `${-sign * 8}deg`, `${sign * 3}deg`, "0deg"],
    rotateZ: [`${sign * 4}deg`, `${-sign * 2}deg`, "0deg"],
    scale: [1.1, 0.96, 1.02, 1],
    ease: "outExpo"
  };
}

function addGlitchEnter(tl, nodes, dur, base, gap, { isChar = false, microBurst = true } = {}) {
  const beat = isChar ? 0.72 : 0.84;
  nodes.forEach((el, i) => {
    const at = base + i * gap;
    tl.add(el, { ...buildGlitchEnter(el, i, { isChar }), duration: dur * beat, ease: "outExpo" }, at);
    if (!microBurst) return;
    tl.add(
      el,
      {
        opacity: [1, 0.35, 1],
        x: ["0px", `${sign(i) * (isChar ? 2 : 3)}px`, "0px"],
        skewX: ["0deg", `${sign(i) * (isChar ? 2 : 4)}deg`, "0deg"],
        duration: dur * 0.12,
        ease: "linear"
      },
      at + dur * 0.62
    );
  });
}

function collectTitleChars(words) {
  const chars = [];
  words.forEach((wordEl) => {
    wordEl.querySelectorAll(".title-char").forEach((el) => chars.push(el));
  });
  return chars;
}

function sign(i) {
  return i % 2 ? 1 : -1;
}

function buildScatterExit(el, slot, isWord = false) {
  const i = slotIndex(el, slot);
  const spread = (i % 3) - 1;
  const sign = i % 2 ? 1 : -1;
  if (isWord) {
    return {
      x: ["0%", `${spread * 48}%`],
      z: ["0px", "-72px"],
      rotateY: ["0deg", `${spread * 36}deg`],
      opacity: [1, 0],
      ease: "inExpo"
    };
  }
  return {
    x: ["0px", `${spread * 72}px`],
    z: ["0px", "-100px"],
    rotateY: ["0deg", `${spread * 48}deg`],
    opacity: [1, 0],
    ease: "inExpo"
  };
}

function buildOrbitExit(el, slot) {
  const i = slotIndex(el, slot);
  return {
    z: ["0px", "-120px"],
    rotateY: ["0deg", `${90 + i * 12}deg`],
    opacity: [1, 0],
    ease: "inExpo"
  };
}

function addStaggered(tl, nodes, build, dur, base, gap, extra = {}) {
  nodes.forEach((el, i) => {
    tl.add(el, { ...build(el, i), duration: dur, ...extra }, base + i * gap);
  });
}

function normalizeProof(item) {
  if (typeof item === "string") return { label: item };
  return item;
}

function renderChip(item) {
  const chip = normalizeProof(item);
  if (chip.label) chip.label = sanitizeCopyText(chip.label);
  if (chip.detail) chip.detail = sanitizeCopyText(chip.detail);
  if (Array.isArray(chip.nodes)) {
    chip.nodes = chip.nodes.map((line) => (line ? sanitizeCopyText(line) : line));
  }
  const tag = chip.source ? "a" : "span";
  const attrs = chip.source
    ? ` href="${chip.source}" target="_blank" rel="noreferrer"`
    : ` tabindex="0"`;
  const classes = [
    "proof-chip",
    chip.source ? "proof-chip--source" : "",
    chip.stat ? "proof-chip--stat" : ""
  ]
    .filter(Boolean)
    .join(" ");
  const detail = chip.detail
    ? `<span class="chip-detail">${chip.detail}</span>`
    : "";
  const hint = chip.source
    ? `<span class="chip-source-hint">Source ↗</span>`
    : "";
  const detailAttr = chip.detail ? chip.detail.replace(/"/g, "&quot;") : "";
  const nodesAttr =
    chip.nodes && Array.isArray(chip.nodes)
      ? ` data-nodes="${JSON.stringify(chip.nodes).replace(/"/g, "&quot;")}"`
      : "";
  return `<${tag} class="${classes}" data-chip data-detail="${detailAttr}"${nodesAttr}${attrs}>
    <svg class="chip-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"></svg>
    <svg class="chip-capsule" aria-hidden="true"></svg>
    <span class="chip-label">${chip.label}</span>
    ${detail}
    ${hint}
  </${tag}>`;
}

function holdAfterEnter(reducedMotion) {
  if (reducedMotion) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, 130));
}

function textTargets(content) {
  const els = content.querySelectorAll(".text-el[data-layer]");
  const chars = content.querySelectorAll(".title-char");
  return [...els, ...chars];
}

function settleTransforms(targets) {
  if (!targets.length) return;
  animate(targets, {
    x: 0,
    y: 0,
    z: 0,
    rotateX: 0,
    rotateY: 0,
    rotateZ: 0,
    skewX: 0,
    scale: 1,
    opacity: 1,
    filter: "blur(0px)",
    duration: 0
  });
}

export class HeroTextAnime {
  constructor(stageEl, contentEl, options = {}) {
    this.stage = stageEl;
    this.content = contentEl;
    this.reducedMotion = options.reducedMotion ?? false;
    this.onContentMount = options.onContentMount ?? null;
    this.slideIndex = -1;
    this.activeTl = null;
    this._transitioning = false;
    this._requestId = 0;
  }

  _syncCopyFit() {
    this.onContentMount?.();
  }

  _chipNodes() {
    return this.content.querySelectorAll("[data-chip]");
  }

  setReducedMotion(v) {
    this.reducedMotion = v;
  }

  mount(slide) {
    slide = sanitizeSlide(slide);
    const words = slide.title.split(" ");
    const pilotHtml = slide.pilotNote
      ? `<p class="pilot-note text-el" data-layer="pilot-note">${PILOT_NOTE_DISCLAIMER}</p>`
      : "";
    this.content.innerHTML = `
      <div class="eyebrow text-el" data-layer="eyebrow">${slide.eyebrow}</div>
      <h1 class="title-block" aria-label="${slide.title.replace(/"/g, "&quot;")}">
        ${words.map((w, i) => titleWordHtml(w, i)).join("")}
      </h1>
      <p class="sub text-el" data-layer="sub">${slide.sub}</p>
      <p class="note text-el" data-layer="note">${slide.note}</p>
      ${pilotHtml}
      <div class="proof-row text-el" data-layer="proof" data-slide-note="${(slide.note || "").replace(/"/g, "&quot;")}" data-slide-sub="${(slide.sub || "").replace(/"/g, "&quot;")}">
        ${slide.proof.map((item, i) => renderChip(enrichProofChip(normalizeProof(item), slide, i))).join("")}
      </div>
    `;
  }

  _matchesStaticSlide(slide) {
    const eyebrow = this.content.querySelector('[data-layer="eyebrow"], .eyebrow');
    if (!eyebrow || eyebrow.textContent.trim() !== slide.eyebrow) return false;
    const words = [...this.content.querySelectorAll(".title-word")]
      .map((w) => w.textContent.trim())
      .join(" ");
    return words === slide.title.trim();
  }

  async showSlide(slide, index) {
    slide = sanitizeSlide(slide);
    const req = ++this._requestId;
    const stale = () => req !== this._requestId;
    const hasContent = this.content.querySelector(".text-el");

    if (this.slideIndex === index && hasContent && this._matchesStaticSlide(slide)) {
      if (this.content.classList.contains("is-stable") || this._transitioning) {
        return this._chipNodes();
      }
      settleTransforms(textTargets(this.content));
      this.content.classList.add("is-visible", "is-stable");
      return this._chipNodes();
    }

    if (this.activeTl) {
      this.activeTl.pause();
      this.activeTl = null;
    }

    const isFirstPaint = this.slideIndex === -1;

    if (isFirstPaint && hasContent && this._matchesStaticSlide(slide)) {
      this.slideIndex = index;
      this._transitioning = true;
      try {
        this._syncCopyFit();
        await this._enter(index, req);
        if (stale()) return this._chipNodes();
        await holdAfterEnter(this.reducedMotion);
        if (stale()) return this._chipNodes();
        this.content.classList.add("is-stable");
        return this._chipNodes();
      } finally {
        if (!stale()) this._transitioning = false;
      }
    }

    this._transitioning = true;
    try {
      if (hasContent && this.slideIndex !== index) {
        this.content.classList.remove("is-stable", "is-visible");
        await this._exit(index);
        if (stale()) return this._chipNodes();
        this.content.innerHTML = "";
      }

      this.slideIndex = index;
      this.mount(slide);
      if (stale()) return this._chipNodes();

      this._syncCopyFit();
      if (stale()) return this._chipNodes();

      await this._enter(index, req);
      if (stale()) return this._chipNodes();

      await holdAfterEnter(this.reducedMotion);
      if (stale()) return this._chipNodes();

      this.content.classList.add("is-stable");
      return this._chipNodes();
    } finally {
      if (!stale()) this._transitioning = false;
    }
  }

  _dur(exit = false, index = 0) {
    if (this.reducedMotion) return exit ? 80 : 120;
    if (exit && (index === 5 || index === 7)) return 1040;
    if (exit) return 580;
    return ENTER_DUR;
  }

  async _exit(index) {
    const preset = EXIT[index % EXIT.length];
    const wordPreset = WORD_EXIT[index % EXIT.length];
    const tilt = STAGE_TILT[index % STAGE_TILT.length];
    const dur = this._dur(true, index);
    const els = this.content.querySelectorAll(".text-el[data-layer]");
    const words = this.content.querySelectorAll(".title-word");

    await runTimeline((tl) => {
      if (index === 5) {
        addStaggered(tl, els, (el, i) => buildScatterExit(el, i), dur, 0, 36);
        addStaggered(tl, words, (el, i) => buildScatterExit(el, i, true), dur * 0.9, 0, 24);
      } else if (index === 7) {
        addStaggered(tl, els, (el, i) => buildOrbitExit(el, i), dur, 0, 36);
        addStaggered(tl, words, (el, i) => buildOrbitExit(el, i), dur * 0.9, 0, 24);
      } else if (preset) {
        tl.add(els, { ...preset, duration: dur, delay: stagger(36) }, 0);
        if (words.length && wordPreset) {
          tl.add(words, { ...wordPreset, duration: dur * 0.9, delay: stagger(24, { from: "center" }) }, 0);
        }
      }
      tl.add(
        this.stage,
        {
          rotateX: `${tilt.rx}deg`,
          rotateY: `${tilt.ry}deg`,
          z: "-120px",
          scale: 0.94,
          filter: "blur(6px)",
          duration: dur,
          ease: "inExpo"
        },
        0
      );
      this.activeTl = tl;
    });
  }

  async _enter(index, req = this._requestId) {
    const tilt = STAGE_TILT[index % STAGE_TILT.length];
    const dur = this._dur(false, index);
    prepareTitleChars(this.content);
    const els = this.content.querySelectorAll(".text-el[data-layer]");
    const words = this.content.querySelectorAll(".title-word");
    const targets = textTargets(this.content);

    this.content.classList.remove("is-stable", "is-visible");
    this.content.classList.add("is-glitch-entering");

    if (targets.length) {
      animate(targets, { opacity: 0, x: 0, y: 0, skewX: 0, rotateZ: 0, scale: 1, duration: 0 });
    }

    if (this.reducedMotion) {
      if (targets.length) {
        await runTimeline((tl) => {
          tl.add(targets, { opacity: [0, 1], duration: 120, ease: "outQuad" }, 0);
        });
      }
      if (req !== this._requestId) return;
      settleTransforms(targets);
      this.content.classList.remove("is-glitch-entering");
      this.content.classList.add("is-visible");
      return;
    }

    animate(this.stage, {
      rotateX: `${tilt.rx}deg`,
      rotateY: `${tilt.ry}deg`,
      z: "110px",
      scale: 0.96,
      filter: "blur(8px)",
      duration: 0
    });

    await runTimeline((tl) => {
      tl.add(
        this.stage,
        {
          rotateX: "0deg",
          rotateY: "0deg",
          z: "0px",
          scale: 1,
          filter: "blur(0px)",
          duration: dur * 1.05,
          ease: "out(3)"
        },
        0
      );
      addGlitchEnter(tl, els, dur, ENTER_LAYER_BASE, ENTER_LAYER_GAP);
      const chars = collectTitleChars(words);
      if (chars.length) {
        addGlitchEnter(tl, chars, dur, ENTER_CHAR_BASE, ENTER_CHAR_GAP, { isChar: true });
      }
      this.activeTl = tl;
    });

    if (req !== this._requestId) return;

    settleTransforms(targets);
    animate(this.stage, {
      rotateX: "0deg",
      rotateY: "0deg",
      z: "0px",
      scale: 1,
      filter: "blur(0px)",
      duration: 0
    });
    this.content.classList.remove("is-glitch-entering");
    this.content.classList.add("is-visible");
  }

  dispose() {
    this.activeTl?.pause();
    this.activeTl = null;
    this.content.innerHTML = "";
  }
}