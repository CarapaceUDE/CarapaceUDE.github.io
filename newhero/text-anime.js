/**
 * HeroTextAnime — DOM typography choreographed with anime.js v4
 */
import { animate, createTimeline, stagger } from "https://esm.sh/animejs@4.0.2";

const ENTER = [
  { z: ["220px", "0px"], opacity: [0, 1], ease: "outExpo" },
  { rotateY: ["-160deg", "0deg"], x: ["-48px", "0px"], opacity: [0, 1], ease: "outExpo" },
  { rotateX: ["-72deg", "0deg"], y: ["-72px", "0px"], opacity: [0, 1], ease: "out(3)" },
  { x: ["-140px", "0px"], rotateY: ["55deg", "0deg"], opacity: [0, 1], ease: "outExpo" },
  { rotateX: ["92deg", "0deg"], z: ["120px", "0px"], opacity: [0, 1], ease: "out(3)" },
  null, // scatter — per-element in buildScatterEnter()
  { y: ["96px", "0px"], rotateZ: ["36deg", "0deg"], rotateY: ["-68deg", "0deg"], opacity: [0, 1], ease: "out(3)" },
  null // orbit — per-element in buildOrbitEnter()
];

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

const WORD_ENTER = [
  { y: ["-115%", "0%"], z: ["180px", "0px"], rotateX: ["-68deg", "0deg"], opacity: [0, 1] },
  { y: ["115%", "0%"], rotateY: ["180deg", "0deg"], opacity: [0, 1] },
  { x: ["-80%", "0%"], rotateZ: ["-24deg", "0deg"], opacity: [0, 1] },
  { x: ["-100%", "0%"], rotateY: ["90deg", "0deg"], opacity: [0, 1] },
  { scale: [0.4, 1], rotateX: ["90deg", "0deg"], opacity: [0, 1] },
  null,
  { y: ["-90%", "0%"], rotateZ: ["45deg", "0deg"], opacity: [0, 1] },
  null
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

function runTimeline(build) {
  return new Promise((resolve) => {
    const tl = createTimeline({ onComplete: resolve });
    build(tl);
  });
}

function slotIndex(el, slot) {
  if (el.classList.contains("title-word")) return Number(el.dataset.word);
  const layers = ["eyebrow", "sub", "note", "proof"];
  const layer = el.dataset.layer;
  return layer ? layers.indexOf(layer) : slot;
}

function buildScatterEnter(el, slot, isWord = false) {
  const i = slotIndex(el, slot);
  const spread = (i % 3) - 1;
  const sign = i % 2 ? 1 : -1;
  if (isWord) {
    return {
      x: [`${spread * 52}%`, "0%"],
      y: [`${sign * 32}%`, "0%"],
      z: [`${64 + i * 16}px`, "0px"],
      rotateY: [`${spread * 28}deg`, "0deg"],
      opacity: [0, 1],
      ease: "outExpo"
    };
  }
  return {
    x: [`${spread * 68}px`, "0px"],
    y: [`${sign * 40}px`, "0px"],
    z: [`${88 + i * 12}px`, "0px"],
    rotateY: [`${spread * 34}deg`, "0deg"],
    opacity: [0, 1],
    ease: "outExpo"
  };
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

function buildOrbitEnter(el, slot, isWord = false) {
  const i = slotIndex(el, slot);
  const amp = isWord ? 1 : 0.85;
  return {
    x: [`${Math.sin(i * 1.15) * 82 * amp}px`, "0px"],
    y: [`${Math.cos(i * 1.15) * 30 * amp}px`, "0px"],
    z: [isWord ? "120px" : "160px", "0px"],
    rotateY: [`${i * 22}deg`, "0deg"],
    opacity: [0, 1],
    ease: "outExpo"
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

function settleTransforms(targets) {
  if (!targets.length) return;
  animate(targets, {
    x: 0,
    y: 0,
    z: 0,
    rotateX: 0,
    rotateY: 0,
    rotateZ: 0,
    scale: 1,
    opacity: 1,
    duration: 0
  });
}

export class HeroTextAnime {
  constructor(stageEl, contentEl, options = {}) {
    this.stage = stageEl;
    this.content = contentEl;
    this.reducedMotion = options.reducedMotion ?? false;
    this.slideIndex = -1;
    this.activeTl = null;
  }

  setReducedMotion(v) {
    this.reducedMotion = v;
  }

  mount(slide) {
    const words = slide.title.split(" ");
    this.content.innerHTML = `
      <div class="eyebrow text-el" data-layer="eyebrow">${slide.eyebrow}</div>
      <h1 class="title-block">
        ${words.map((w, i) => `<span class="title-word text-el" data-word="${i}">${w}</span>`).join("")}
      </h1>
      <p class="sub text-el" data-layer="sub">${slide.sub}</p>
      <p class="note text-el" data-layer="note">${slide.note}</p>
      <div class="proof-row text-el" data-layer="proof">
        ${slide.proof.map((p) => `<span class="proof-chip" data-chip><span>${p}</span></span>`).join("")}
      </div>
    `;
  }

  async showSlide(slide, index) {
    if (this.activeTl) {
      this.activeTl.pause();
      this.activeTl = null;
    }

    const hasContent = this.content.querySelector(".text-el");
    if (hasContent && this.slideIndex !== index) {
      await this._exit(index);
      this.content.innerHTML = "";
    }

    this.slideIndex = index;
    this.mount(slide);
    await this._enter(index);
    return this.content.querySelectorAll("[data-chip]");
  }

  _dur(exit = false, index = 0) {
    if (this.reducedMotion) return exit ? 80 : 120;
    if (!exit && (index === 5 || index === 7)) return 1040;
    return exit ? 580 : 900;
  }

  async _exit(index) {
    const preset = EXIT[index % EXIT.length];
    const wordPreset = WORD_EXIT[index % EXIT.length];
    const tilt = STAGE_TILT[index % STAGE_TILT.length];
    const dur = this._dur(true);
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

  async _enter(index) {
    const preset = ENTER[index % ENTER.length];
    const wordPreset = WORD_ENTER[index % ENTER.length];
    const tilt = STAGE_TILT[index % STAGE_TILT.length];
    const dur = this._dur(false, index);
    const els = this.content.querySelectorAll(".text-el[data-layer]");
    const words = this.content.querySelectorAll(".title-word");

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
      if (index === 5) {
        addStaggered(tl, els, (el, i) => buildScatterEnter(el, i), dur, 60, 55);
        addStaggered(tl, words, (el, i) => buildScatterEnter(el, i, true), dur, 140, 48);
      } else if (index === 7) {
        addStaggered(tl, els, (el, i) => buildOrbitEnter(el, i), dur, 60, 55);
        addStaggered(tl, words, (el, i) => buildOrbitEnter(el, i, true), dur, 140, 48);
      } else if (preset) {
        tl.add(els, { ...preset, duration: dur, delay: stagger(55) }, 60);
        if (words.length && wordPreset) {
          tl.add(words, { ...wordPreset, duration: dur, delay: stagger(48, { from: "center" }) }, 140);
        }
      }
      this.activeTl = tl;
    });

    settleTransforms([...els, ...words]);
    animate(this.stage, {
      rotateX: "0deg",
      rotateY: "0deg",
      z: "0px",
      scale: 1,
      filter: "blur(0px)",
      duration: 0
    });
    this.content.classList.add("is-visible");
  }

  dispose() {
    this.activeTl?.pause();
    this.activeTl = null;
    this.content.innerHTML = "";
  }
}