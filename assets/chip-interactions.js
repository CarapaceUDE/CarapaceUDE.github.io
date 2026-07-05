/**
 * HeroChipInteractions — vertical trunk + sequential branch bullets on proof chips
 */
import { animate } from "https://esm.sh/animejs@4.0.2";
import { dedupeBullets, expandDetailLines, normalizeBulletKey } from "./chip-bullet-enrich.js";

const LEAVE_DELAY_MS = 160;
const MIN_BULLETS = 2;

export class HeroChipInteractions {
  constructor(options = {}) {
    this.reducedMotion = options.reducedMotion ?? false;
    this.activeChip = null;
    this.handlers = [];
    this.anims = [];
    this._leaveTimer = null;
  }

  setReducedMotion(v) {
    this.reducedMotion = v;
  }

  bind(container) {
    this.unbind();
    if (!container) return;
    container.querySelectorAll("[data-chip]").forEach((chip, index) => {
      if (chip.matches("a.proof-chip--source")) return;
      chip.classList.add("proof-chip--interactive");
      chip.dataset.chipIndex = String(index);
      const onEnter = () => this._enter(chip);
      const onLeave = (e) => this._scheduleLeave(chip, e);
      const onFocusIn = () => {
        if (!chip.matches(":hover")) onEnter();
      };
      const onFocusOut = (e) => this._scheduleLeave(chip, e);
      chip.addEventListener("mouseenter", onEnter);
      chip.addEventListener("mouseleave", onLeave);
      chip.addEventListener("focusin", onFocusIn);
      chip.addEventListener("focusout", onFocusOut);
      this.handlers.push({ chip, onEnter, onLeave, onFocusIn, onFocusOut });
    });
  }

  _killAnims() {
    this.anims.forEach((a) => a.pause?.());
    this.anims = [];
  }

  _clearLeaveTimer() {
    if (this._leaveTimer) {
      clearTimeout(this._leaveTimer);
      this._leaveTimer = null;
    }
  }

  _isInChipZone(chip, target) {
    if (!target || !chip) return false;
    if (chip.contains(target)) return true;
    const tree = chip.querySelector(".chip-tree");
    return Boolean(tree?.contains(target));
  }

  _scheduleLeave(chip, e) {
    const related = e?.relatedTarget ?? null;
    if (this._isInChipZone(chip, related)) return;
    this._clearLeaveTimer();
    this._leaveTimer = setTimeout(() => {
      const tree = chip.querySelector(".chip-tree");
      if (chip.matches(":hover") || tree?.matches(":hover")) return;
      this._leave(chip);
    }, LEAVE_DELAY_MS);
  }

  _bindTreeHover(chip, tree) {
    tree.addEventListener("mouseenter", () => this._clearLeaveTimer());
    tree.addEventListener("mouseleave", (e) => this._scheduleLeave(chip, e));
  }

  _parseNodes(raw) {
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch {
      return [];
    }
  }

  _bullets(chip) {
    const detail = chip.dataset.detail?.trim();
    let bullets = dedupeBullets([
      ...expandDetailLines(detail),
      ...this._parseNodes(chip.dataset.nodes)
    ]);

    if (bullets.length < MIN_BULLETS) {
      const note = chip.closest(".proof-row")?.dataset?.slideNote?.trim();
      const sub = chip.closest(".proof-row")?.dataset?.slideSub?.trim();
      if (note && !bullets.some((b) => normalizeBulletKey(b) === normalizeBulletKey(note))) {
        bullets.push(note);
      }
      if (
        bullets.length < MIN_BULLETS &&
        sub &&
        !bullets.some((b) => normalizeBulletKey(b) === normalizeBulletKey(sub))
      ) {
        bullets.push(sub);
      }
      bullets = dedupeBullets(bullets);
    }

    if (!bullets.length) {
      const label = chip.querySelector(".chip-label")?.textContent?.trim();
      if (label) bullets.push(label);
    }

    return dedupeBullets(bullets).slice(0, 4);
  }

  _glitchReveal(el, delay, index) {
    if (this.reducedMotion) {
      el.style.opacity = "1";
      el.style.transform = "none";
      return;
    }
    const sign = index % 2 ? 1 : -1;
    this.anims.push(
      animate(el, {
        opacity: [0, 0.85, 0.32, 1, 0.6, 1],
        x: [`${sign * 10}px`, `${-sign * 5}px`, `${sign * 2}px`, "0px"],
        skewX: [`${sign * 10}deg`, `${-sign * 5}deg`, "0deg"],
        duration: 300,
        delay,
        ease: "outExpo"
      })
    );
    this.anims.push(
      animate(el, {
        opacity: [1, 0.4, 1],
        x: ["0px", `${sign * 2}px`, "0px"],
        duration: 90,
        delay: delay + 210,
        ease: "linear"
      })
    );
  }

  _enter(chip) {
    this._clearLeaveTimer();
    if (this.activeChip === chip && chip.classList.contains("is-hovered")) return;
    if (this.activeChip && this.activeChip !== chip) this._leave(this.activeChip);
    this.activeChip = chip;
    this._killAnims();
    chip.classList.add("is-hovered");

    const bullets = this._bullets(chip);
    const tree = document.createElement("div");
    tree.className = "chip-tree";
    tree.setAttribute("aria-hidden", "true");

    const spineBlock = document.createElement("div");
    spineBlock.className = "chip-spine-block";

    const rail = document.createElement("div");
    rail.className = "chip-rail";

    const connector = document.createElement("div");
    connector.className = "chip-connector";

    const spine = document.createElement("div");
    spine.className = "chip-spine";

    const list = document.createElement("ul");
    list.className = "chip-branches";

    bullets.forEach((text, i) => {
      const item = document.createElement("li");
      item.className = "chip-branch";
      item.dataset.i = String(i);

      const stem = document.createElement("span");
      stem.className = "chip-branch-stem";
      stem.setAttribute("aria-hidden", "true");

      const label = document.createElement("span");
      label.className = "chip-branch-text";
      const glitch = document.createElement("span");
      glitch.className = "chip-branch-glitch";
      glitch.textContent = text;
      label.appendChild(glitch);

      item.append(stem, label);
      list.appendChild(item);
    });

    rail.append(connector, spine);
    spineBlock.append(rail, list);
    tree.appendChild(spineBlock);
    chip.appendChild(tree);
    this._bindTreeHover(chip, tree);
    tree.addEventListener("mousedown", (e) => e.stopPropagation());
    tree.addEventListener("click", (e) => e.stopPropagation());

    if (this.reducedMotion) {
      connector.style.transform = "scaleY(1)";
      spine.style.transform = "scaleY(1)";
      tree.querySelectorAll(".chip-branch-stem").forEach((stem) => {
        stem.style.transform = "scaleX(1)";
      });
      tree.querySelectorAll(".chip-branch-glitch").forEach((el) => {
        el.style.opacity = "1";
      });
      return;
    }

    connector.style.transform = "scaleY(0)";
    spine.style.transform = "scaleY(0)";
    this.anims.push(
      animate(connector, {
        scaleY: [0, 1],
        duration: 160,
        ease: "outExpo"
      })
    );
    this.anims.push(
      animate(spine, {
        scaleY: [0, 1],
        duration: 240,
        delay: 100,
        ease: "outExpo"
      })
    );

    bullets.forEach((_, i) => {
      const item = list.children[i];
      const stem = item.querySelector(".chip-branch-stem");
      const glitch = item.querySelector(".chip-branch-glitch");
      const stemDelay = 220 + i * 120;
      const textDelay = stemDelay + 80;

      stem.style.transform = "scaleX(0)";
      glitch.style.opacity = "0";

      this.anims.push(
        animate(stem, {
          scaleX: [0, 1],
          duration: 150,
          delay: stemDelay,
          ease: "outExpo"
        })
      );
      this._glitchReveal(glitch, textDelay, i);
    });
  }

  _leave(chip) {
    this._clearLeaveTimer();
    if (!chip) return;
    chip.classList.remove("is-hovered");
    chip.querySelector(".chip-tree")?.remove();
    if (this.activeChip === chip) this.activeChip = null;
    this._killAnims();
  }

  unbind() {
    this._clearLeaveTimer();
    this.handlers.forEach(({ chip, onEnter, onLeave, onFocusIn, onFocusOut }) => {
      chip.removeEventListener("mouseenter", onEnter);
      chip.removeEventListener("mouseleave", onLeave);
      chip.removeEventListener("focusin", onFocusIn);
      chip.removeEventListener("focusout", onFocusOut);
      chip.classList.remove("is-hovered", "proof-chip--interactive");
      chip.querySelector(".chip-tree")?.remove();
    });
    this.handlers = [];
    this._killAnims();
    this.activeChip = null;
  }

  dispose() {
    this.unbind();
  }
}