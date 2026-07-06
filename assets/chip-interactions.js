/**
 * HeroChipInteractions, vertical trunk + sequential branch bullets on proof chips
 */
import { animate } from "https://esm.sh/animejs@4.0.2";
import { dedupeBullets, expandDetailLines, normalizeBulletKey } from "./chip-bullet-enrich.js?v=20260706b";
import {
  detectChipRows,
  shouldUseChipStackLayout,
  CHIP_BULLET_CONNECTOR_MS,
  CHIP_BULLET_SPINE_MS,
  CHIP_BULLET_SPINE_DELAY_MS
} from "./chip-wrap-layout.js?v=20260706b";
import { computeChipTreeFlip } from "./chip-tree-layout.js?v=20260706b";
import { sanitizeCopyText } from "./copy-sanitize.js?v=20260706b";

const LEAVE_DELAY_MS = 160;
const MIN_BULLETS = 2;
const WRAP_MQ = "(max-width: 720px)";
const TOUCH_CHIP_MQ = "(hover: none), (pointer: coarse)";
const GHOST_MOUSE_SUPPRESS_MS = 700;

export function shouldUseTouchChipControls(
  mq = typeof window !== "undefined" ? window.matchMedia(TOUCH_CHIP_MQ) : null
) {
  return Boolean(mq?.matches);
}

export class HeroChipInteractions {
  constructor(options = {}) {
    this.reducedMotion = options.reducedMotion ?? false;
    this.activeChip = null;
    this.handlers = [];
    this.anims = [];
    this._leaveTimer = null;
    this.layoutContainer = null;
    this._layoutCleanup = null;
    this._bodyClassObserver = null;
    this._documentDismiss = null;
    this._ignoreMouseUntil = 0;
  }

  _shouldUseTouchChip() {
    return shouldUseTouchChipControls();
  }

  _suppressMouseHover() {
    return this._shouldUseTouchChip() || Date.now() < this._ignoreMouseUntil;
  }

  _bindDocumentDismiss() {
    this._unbindDocumentDismiss();
    this._documentDismiss = (e) => {
      if (!this._shouldUseTouchChip() || !this.activeChip) return;
      if (this._isInChipZone(this.activeChip, e.target)) return;
      this._leave(this.activeChip);
    };
    document.addEventListener("pointerdown", this._documentDismiss, true);
  }

  _unbindDocumentDismiss() {
    if (!this._documentDismiss) return;
    document.removeEventListener("pointerdown", this._documentDismiss, true);
    this._documentDismiss = null;
  }

  _toggleChip(chip, e) {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    this._ignoreMouseUntil = Date.now() + GHOST_MOUSE_SUPPRESS_MS;
    if (this.activeChip === chip && chip.querySelector(".chip-tree")) {
      this._leave(chip);
      return;
    }
    this._enter(chip);
  }

  setReducedMotion(v) {
    this.reducedMotion = v;
  }

  _updateChipLayout(container) {
    if (!container) return;
    const chips = [...container.querySelectorAll("[data-chip]")];
    const narrow = window.matchMedia(WRAP_MQ).matches;
    const landscapeStack = document.body.classList.contains("hero-landscape-short");
    const stackLayout = shouldUseChipStackLayout(narrow, landscapeStack);
    const { wrap, rows } = detectChipRows(
      chips.map((chip) => chip.offsetTop),
      stackLayout
    );

    if (!wrap) {
      container.removeAttribute("data-chip-wrap");
      container.removeAttribute("data-chip-rows");
      container.style.removeProperty("--chip-row-fade-ms");
      container.style.removeProperty("--chip-row-fade-delay");
      container.style.removeProperty("--chip-row-show-ms");
      chips.forEach((chip) => chip.removeAttribute("data-chip-row"));
      return;
    }

    container.dataset.chipWrap = "true";
    container.dataset.chipRows = String(new Set(rows).size);
    container.style.setProperty("--chip-row-fade-ms", `${CHIP_BULLET_SPINE_MS}ms`);
    container.style.setProperty("--chip-row-fade-delay", `${CHIP_BULLET_SPINE_DELAY_MS}ms`);
    container.style.setProperty("--chip-row-show-ms", `${CHIP_BULLET_CONNECTOR_MS}ms`);
    chips.forEach((chip, index) => {
      chip.dataset.chipRow = String(rows[index] ?? 0);
    });
  }

  _bindLayout(container) {
    this._unbindLayout();
    if (!container) return;

    const update = () => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => this._updateChipLayout(container));
      });
    };
    update();

    const observer =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => update()) : null;
    observer?.observe(container);

    const mq = window.matchMedia(WRAP_MQ);
    const onChange = () => update();
    if (mq.addEventListener) mq.addEventListener("change", onChange);
    else mq.addListener(onChange);
    window.addEventListener("resize", update, { passive: true });

    if (typeof MutationObserver !== "undefined") {
      this._bodyClassObserver?.disconnect();
      this._bodyClassObserver = new MutationObserver(() => update());
      this._bodyClassObserver.observe(document.body, {
        attributes: true,
        attributeFilter: ["class"]
      });
    }

    this._layoutCleanup = () => {
      observer?.disconnect();
      this._bodyClassObserver?.disconnect();
      this._bodyClassObserver = null;
      if (mq.removeEventListener) mq.removeEventListener("change", onChange);
      else mq.removeListener(onChange);
      window.removeEventListener("resize", update);
    };
  }

  refreshLayout() {
    if (!this.layoutContainer) return;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => this._updateChipLayout(this.layoutContainer));
    });
  }

  _unbindLayout() {
    this._layoutCleanup?.();
    this._layoutCleanup = null;
    if (this.layoutContainer) {
      this.layoutContainer.removeAttribute("data-chip-wrap");
      this.layoutContainer.removeAttribute("data-chip-rows");
      this._clearWrapFocus(this.layoutContainer);
      this.layoutContainer.querySelectorAll("[data-chip]").forEach((chip) => {
        chip.removeAttribute("data-chip-row");
      });
    }
    this.layoutContainer = null;
  }

  bind(container) {
    this.unbind();
    if (!container) return;
    this.layoutContainer = container;
    this._bindLayout(container);
    this._bindDocumentDismiss();
    container.querySelectorAll("[data-chip]").forEach((chip, index) => {
      if (chip.matches("a.proof-chip--source")) return;
      chip.classList.add("proof-chip--interactive");
      chip.dataset.chipIndex = String(index);
      const onEnter = () => {
        if (this._suppressMouseHover()) return;
        this._enter(chip);
      };
      const onLeave = (e) => {
        if (this._suppressMouseHover()) return;
        this._scheduleLeave(chip, e);
      };
      const onFocusIn = () => {
        if (this._suppressMouseHover()) return;
        if (!chip.matches(":hover")) this._enter(chip);
      };
      const onFocusOut = (e) => {
        if (this._suppressMouseHover()) return;
        this._scheduleLeave(chip, e);
      };
      const onClick = (e) => {
        if (!this._shouldUseTouchChip()) return;
        this._toggleChip(chip, e);
      };
      chip.addEventListener("mouseenter", onEnter);
      chip.addEventListener("mouseleave", onLeave);
      chip.addEventListener("focusin", onFocusIn);
      chip.addEventListener("focusout", onFocusOut);
      chip.addEventListener("click", onClick);
      this.handlers.push({ chip, onEnter, onLeave, onFocusIn, onFocusOut, onClick });
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
    if (this._suppressMouseHover()) return;
    const related = e?.relatedTarget ?? null;
    if (this._isInChipZone(chip, related)) return;
    this._clearLeaveTimer();
    this._leaveTimer = setTimeout(() => {
      if (this._suppressMouseHover()) return;
      const tree = chip.querySelector(".chip-tree");
      if (chip.matches(":hover") || tree?.matches(":hover")) return;
      this._leave(chip);
    }, LEAVE_DELAY_MS);
  }

  _bindTreeHover(chip, tree) {
    if (this._shouldUseTouchChip()) return;
    tree.addEventListener("mouseenter", () => this._clearLeaveTimer());
    tree.addEventListener("mouseleave", (e) => this._scheduleLeave(chip, e));
  }

  _applyWrapFocus(proofRow, activeRow) {
    if (!proofRow || proofRow.dataset.chipWrap !== "true") return;
    const active = Number(activeRow);
    proofRow.classList.add("proof-row--chip-active");
    proofRow.dataset.activeChipRow = String(active);
    proofRow.querySelectorAll("[data-chip]").forEach((chip) => {
      const row = Number(chip.dataset.chipRow ?? 0);
      chip.classList.toggle("chip-row--below-active", row > active);
    });
  }

  _clearWrapFocus(proofRow) {
    if (!proofRow) return;
    proofRow.classList.remove("proof-row--chip-active");
    delete proofRow.dataset.activeChipRow;
    proofRow.querySelectorAll(".chip-row--below-active").forEach((chip) => {
      chip.classList.remove("chip-row--below-active");
    });
  }

  _positionChipTree(chip, tree) {
    const landscapeStack = document.body.classList.contains("hero-landscape-short");
    const boundsEl = chip.closest(".pinned") || chip.closest(".slide-content");
    const bounds = boundsEl?.getBoundingClientRect();
    if (!bounds) return false;

    const chipRect = chip.getBoundingClientRect();
    const treeWidth = tree.scrollWidth || tree.offsetWidth;
    const { flip, branchMaxPx } = computeChipTreeFlip({
      chipLeft: chipRect.left,
      chipWidth: chipRect.width,
      treeWidth,
      boundsLeft: bounds.left,
      boundsRight: bounds.right,
      preferRight: landscapeStack,
      viewportRight: landscapeStack ? window.innerWidth : 0,
      anchorLeft: landscapeStack
    });

    tree.classList.remove("chip-tree--flip", "chip-tree--left-anchor");
    if (landscapeStack) tree.classList.add("chip-tree--left-anchor");
    tree.style.removeProperty("--chip-branch-max");

    if (branchMaxPx != null) {
      tree.style.setProperty("--chip-branch-max", `${branchMaxPx}px`);
    }

    if (!flip) return false;

    tree.classList.add("chip-tree--flip");
    return true;
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
      ...this._parseNodes(chip.dataset.nodes).map((line) => sanitizeCopyText(line))
    ]);

    if (bullets.length < MIN_BULLETS) {
      const note = sanitizeCopyText(chip.closest(".proof-row")?.dataset?.slideNote?.trim());
      const sub = sanitizeCopyText(chip.closest(".proof-row")?.dataset?.slideSub?.trim());
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

    return dedupeBullets(bullets.map((line) => sanitizeCopyText(line))).slice(0, 4);
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
    if (this.activeChip === chip && chip.querySelector(".chip-tree")) return;
    if (chip.classList.contains("is-hovered") && !chip.querySelector(".chip-tree")) {
      chip.classList.remove("is-hovered");
      if (this.activeChip === chip) this.activeChip = null;
    }
    if (this.activeChip && this.activeChip !== chip) this._leave(this.activeChip);
    this.activeChip = chip;
    this._killAnims();
    chip.classList.add("is-hovered");

    const bullets = this._bullets(chip);
    const proofRow = chip.closest(".proof-row");
    if (proofRow) this._updateChipLayout(proofRow);
    if (proofRow?.dataset.chipWrap === "true") {
      this._applyWrapFocus(proofRow, chip.dataset.chipRow ?? "0");
    }

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
    const treeFlipped = this._positionChipTree(chip, tree);
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
        duration: CHIP_BULLET_CONNECTOR_MS,
        ease: "outExpo"
      })
    );
    this.anims.push(
      animate(spine, {
        scaleY: [0, 1],
        duration: CHIP_BULLET_SPINE_MS,
        delay: CHIP_BULLET_SPINE_DELAY_MS,
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
      stem.style.transformOrigin = treeFlipped ? "right center" : "left center";
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
    this._clearWrapFocus(chip.closest(".proof-row"));
    if (this.activeChip === chip) this.activeChip = null;
    this._killAnims();
  }

  unbind() {
    this._clearLeaveTimer();
    this._unbindDocumentDismiss();
    this._unbindLayout();
    this.handlers.forEach(({ chip, onEnter, onLeave, onFocusIn, onFocusOut, onClick }) => {
      chip.removeEventListener("mouseenter", onEnter);
      chip.removeEventListener("mouseleave", onLeave);
      chip.removeEventListener("focusin", onFocusIn);
      chip.removeEventListener("focusout", onFocusOut);
      chip.removeEventListener("click", onClick);
      chip.classList.remove("is-hovered", "proof-chip--interactive");
      chip.querySelector(".chip-tree")?.remove();
    });
    this.handlers = [];
    this._killAnims();
    this.activeChip = null;
    this._ignoreMouseUntil = 0;
  }

  dispose() {
    this.unbind();
  }
}