/**
 * HeroInsertCursor — DOS overwrite block caret on hero copy + HUD meta.
 * Typing mutates visible text; idle glitch-restore returns originals.
 */
import { animate } from "https://esm.sh/animejs@4.0.2";

const INSERT_SELECTOR = [
  ".slide-content .eyebrow",
  ".slide-content .title-char",
  ".slide-content .title-word",
  ".slide-content .sub",
  ".slide-content .note",
  ".slide-content .pilot-note",
  ".chip-tree .chip-branch-glitch",
  ".chip-tree .chip-branch-text",
  ".hero-chrome .meta-value",
  ".hero-chrome .chrome-mark",
  "#meta-time"
].join(",");

function isPrintableKey(e) {
  return e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey;
}

function caretFromPoint(x, y) {
  if (document.caretPositionFromPoint) {
    const pos = document.caretPositionFromPoint(x, y);
    if (pos) return { node: pos.offsetNode, offset: pos.offset };
  }
  if (document.caretRangeFromPoint) {
    const range = document.caretRangeFromPoint(x, y);
    if (range) return { node: range.startContainer, offset: range.startOffset };
  }
  return null;
}

function ensureTextNode(el) {
  if (!el.firstChild || el.firstChild.nodeType !== Node.TEXT_NODE) {
    el.textContent = el.textContent ?? "";
  }
}

function titleCharsFor(el) {
  const slide = el.closest(".slide-content, #slide-content");
  return slide ? [...slide.querySelectorAll(".title-char")] : [];
}

function resolveField(target) {
  if (!target) return null;

  if (target.classList.contains("title-char")) {
    const chars = titleCharsFor(target);
    const index = Math.max(0, chars.indexOf(target));
    return { kind: "title", chars, index, el: chars[index] ?? target };
  }

  if (target.classList.contains("title-word")) {
    if (target.querySelector(".title-char")) return null;
    return { kind: "inline", el: target, index: 0 };
  }

  return { kind: "inline", el: target, index: 0 };
}

function normalizeInsertTarget(target) {
  if (!target) return null;
  if (target.classList.contains("chip-branch-text")) {
    return target.querySelector(".chip-branch-glitch") || target;
  }
  return target;
}

function indexFromPointer(target, caret) {
  if (target.classList.contains("title-char")) {
    const chars = titleCharsFor(target);
    return Math.max(0, chars.indexOf(target));
  }
  if (!caret?.node) return 0;
  if (caret.node === target || caret.node.parentElement === target) {
    return Math.max(0, Math.min(caret.offset, (target.textContent ?? "").length));
  }
  return 0;
}

function rangeRect(node, start, end) {
  const range = document.createRange();
  range.setStart(node, start);
  range.setEnd(node, end);
  return range.getBoundingClientRect();
}

/** Per-glyph rect via Range (works across wrapped lines). */
function inlineCharRect(el, index) {
  const text = el.textContent ?? "";
  const box = el.getBoundingClientRect();
  if (!text.length) {
    return {
      left: box.left,
      top: box.top,
      width: Math.max(10, box.height * 0.55),
      height: Math.max(box.height, 15)
    };
  }

  ensureTextNode(el);
  const node = el.firstChild;
  const len = text.length;

  if (index >= len) {
    const tail = rangeRect(node, len, len);
    if (len > 0) {
      const last = rangeRect(node, len - 1, len);
      return {
        left: tail.left || last.right,
        top: last.top || box.top,
        width: Math.max(last.width, 7),
        height: Math.max(last.height, 14)
      };
    }
    return {
      left: box.left,
      top: box.top,
      width: 10,
      height: Math.max(box.height, 15)
    };
  }

  const idx = Math.max(0, Math.min(index, len - 1));
  const slice = rangeRect(node, idx, idx + 1);

  if (slice.width >= 0.75) {
    return {
      left: slice.left,
      top: slice.top,
      width: Math.max(slice.width, 7),
      height: Math.max(slice.height, 14)
    };
  }

  const caret = rangeRect(node, idx, idx);
  const refIdx = idx > 0 ? idx - 1 : Math.min(idx + 1, len - 1);
  const ref = rangeRect(node, refIdx, refIdx + 1);
  const w = Math.max(ref.width, caret.height * 0.55, 7);
  const h = Math.max(ref.height, caret.height, 14);

  return {
    left: caret.left || ref.left,
    top: ref.height >= 1 ? ref.top : caret.top || box.top,
    width: w,
    height: h
  };
}

/** Full glyph-cell rect for DOS block highlight (not a thin caret bar). */
function cellRect(ctx) {
  if (!ctx) return null;

  if (ctx.kind === "title") {
    const el = ctx.chars[ctx.index] ?? ctx.el;
    const r = el.getBoundingClientRect();
    return {
      left: r.left,
      top: r.top,
      width: Math.max(r.width, 9),
      height: Math.max(r.height, 15)
    };
  }

  return inlineCharRect(ctx.el, ctx.index);
}

export class HeroInsertCursor {
  constructor(options = {}) {
    this.isHeroPinned = options.isHeroPinned ?? (() => true);
    this.reducedMotion = options.reducedMotion ?? false;
    this.idleMs = options.idleMs ?? 1850;
    this.onMetaLockChange = options.onMetaLockChange ?? (() => {});

    this.caretEl = document.createElement("div");
    this.caretEl.className = "hero-insert-block-caret";
    this.caretEl.setAttribute("aria-hidden", "true");
    document.body.appendChild(this.caretEl);

    this.armed = null;
    this.hover = null;
    this.taints = new Map();
    this.lockedMeta = new Set();
    this.idleTimer = null;
    this.reverting = false;

    this._onMove = this._onMove.bind(this);
    this._onDown = this._onDown.bind(this);
    this._onKey = this._onKey.bind(this);
    this._onVisibility = this._onVisibility.bind(this);
    this._preventNativeSelect = this._preventNativeSelect.bind(this);
    this._preventDblClickSelect = this._preventDblClickSelect.bind(this);

    window.addEventListener("mousemove", this._onMove, { passive: true });
    window.addEventListener("mousedown", this._onDown, true);
    window.addEventListener("keydown", this._onKey, true);
    document.addEventListener("visibilitychange", this._onVisibility);
    document.addEventListener("selectstart", this._preventNativeSelect);
    document.addEventListener("mousedown", this._preventDblClickSelect, true);
  }

  _isHeroNonInsertSurface(hit) {
    if (!hit?.closest) return false;
    return Boolean(hit.closest("#hero-stage, .hero-chrome, .scroll-hint, .slide-rail, .pinned"));
  }

  _preventNativeSelect(e) {
    if (!this._isHeroNonInsertSurface(e.target)) return;
    e.preventDefault();
  }

  _preventDblClickSelect(e) {
    if (e.button !== 0 || e.detail < 2) return;
    if (!this._isHeroNonInsertSurface(e.target)) return;
    if (this._focusableTarget(e.clientX, e.clientY)) return;
    e.preventDefault();
  }

  setReducedMotion(v) {
    this.reducedMotion = v;
  }

  isMetaLocked(id) {
    return this.lockedMeta.has(id);
  }

  _setMetaLock(id, locked) {
    if (!id) return;
    if (locked) this.lockedMeta.add(id);
    else this.lockedMeta.delete(id);
    this.onMetaLockChange(id, locked);
  }

  _focusableTarget(x, y) {
    if (!this.isHeroPinned() || this.reverting) return null;
    const hit = document.elementFromPoint(x, y);
    if (!hit) return null;
    if (hit.closest("a, button, input, textarea, select, .theme-toggle, .nav-toggle")) return null;
    if (hit.closest(".chip-label, .chip-detail, .chip-source-hint")) return null;
    if (hit.closest(".proof-chip") && !hit.closest(".chip-tree")) return null;

    let target = hit.closest(INSERT_SELECTOR);
    if (target?.classList.contains("title-word") && target.querySelector(".title-char")) {
      target = hit.closest(".title-char");
    }
    target = normalizeInsertTarget(target);
    if (!target) return null;

    const text = (target.textContent ?? "").replace(/\u00a0/g, " ").trim();
    if (!text && !target.classList.contains("title-char")) return null;
    return target;
  }

  _showCaret(ctx) {
    const rect = cellRect(ctx);
    if (!rect) {
      this.caretEl.classList.remove("is-visible");
      return;
    }
    this.caretEl.classList.add("is-visible");
    this.caretEl.style.left = `${rect.left}px`;
    this.caretEl.style.top = `${rect.top}px`;
    this.caretEl.style.width = `${rect.width}px`;
    this.caretEl.style.height = `${rect.height}px`;
  }

  _armFromTarget(target, x, y) {
    const field = resolveField(target);
    if (!field) return null;
    const caret = caretFromPoint(x, y);
    field.index = indexFromPointer(target, caret);
    if (field.kind === "title" && field.chars.length) {
      field.el = field.chars[field.index];
    }
    return field;
  }

  _onMove(e) {
    if (this.armed) {
      this._showCaret(this.armed);
      return;
    }

    const target = this._focusableTarget(e.clientX, e.clientY);
    if (!target) {
      this.hover = null;
      if (!this.taints.size) {
        document.body.classList.remove("hero-insert-active", "hero-insert-hover");
      }
      this._showCaret(null);
      return;
    }

    this.hover = this._armFromTarget(target, e.clientX, e.clientY);
    if (!this.hover) return;

    this._showCaret(this.hover);
    document.body.classList.add(this.taints.size ? "hero-insert-active" : "hero-insert-hover");
  }

  _onDown(e) {
    if (e.button !== 0) return;
    const target = this._focusableTarget(e.clientX, e.clientY);
    if (!target) return;

    e.preventDefault();
    e.stopPropagation();
    document.activeElement?.blur?.();

    this.armed = this._armFromTarget(target, e.clientX, e.clientY);
    if (!this.armed) return;

    document.body.classList.add("hero-insert-active");
    this._showCaret(this.armed);
    this._resetIdle();
  }

  _markTaint(el) {
    if (!el || this.taints.has(el)) return;
    const original = el.textContent ?? "";
    this.taints.set(el, { original });
    el.classList.add("hero-insert-tainted");
    if (el.id) this._setMetaLock(el.id, true);
  }

  _displayChar(ch) {
    return ch === " " ? "\u00a0" : ch;
  }

  _overwrite(ch) {
    const ctx = this.armed;
    if (!ctx) return;

    if (ctx.kind === "title") {
      const el = ctx.chars[ctx.index];
      if (!el) return;
      this._markTaint(el);
      el.textContent = this._displayChar(ch);
      if (ctx.index < ctx.chars.length - 1) {
        ctx.index += 1;
        ctx.el = ctx.chars[ctx.index];
      }
    } else {
      this._markTaint(ctx.el);
      const chars = [...(ctx.el.textContent ?? "")];
      if (!chars.length) chars.push(" ");
      const at = Math.min(ctx.index, chars.length - 1);
      if (ctx.index >= chars.length) chars.push(ch);
      else chars[at] = ch;
      ctx.el.textContent = chars.join("");
      ctx.index = Math.min(ctx.index + 1, chars.length);
    }

    this._showCaret(ctx);
  }

  _backspace() {
    const ctx = this.armed;
    if (!ctx) return;

    if (ctx.kind === "title") {
      if (ctx.index <= 0) return;
      ctx.index -= 1;
      ctx.el = ctx.chars[ctx.index];
    } else if (ctx.index > 0) {
      ctx.index -= 1;
    }

    this._showCaret(ctx);
    this._resetIdle();
  }

  _delete() {
    const ctx = this.armed;
    if (!ctx) return;

    if (ctx.kind === "title") {
      const el = ctx.chars[ctx.index];
      if (!el) return;
      this._markTaint(el);
      el.textContent = "\u00a0";
    } else {
      this._markTaint(ctx.el);
      const chars = [...(ctx.el.textContent ?? "")];
      if (!chars.length) return;
      const at = Math.min(ctx.index, chars.length - 1);
      chars[at] = " ";
      ctx.el.textContent = chars.join("");
    }

    this._showCaret(ctx);
    this._resetIdle();
  }

  _moveCaret(delta) {
    const ctx = this.armed;
    if (!ctx) return;

    if (ctx.kind === "title") {
      ctx.index = Math.max(0, Math.min(ctx.index + delta, ctx.chars.length - 1));
      ctx.el = ctx.chars[ctx.index];
    } else {
      const len = (ctx.el.textContent ?? "").length;
      ctx.index = Math.max(0, Math.min(ctx.index + delta, len));
    }

    this._showCaret(ctx);
  }

  _resetIdle() {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    if (!this.taints.size) return;
    this.idleTimer = setTimeout(() => this._revertAll(), this.idleMs);
  }

  _shouldHandleKeys() {
    const active = document.activeElement;
    if (!active || active === document.body || active === document.documentElement) return true;
    if (active.matches("input, textarea, select")) return false;
    return true;
  }

  _onKey(e) {
    if (this.reverting) return;
    if (!this._shouldHandleKeys()) return;

    if (!this.armed && this.hover) {
      this.armed = {
        kind: this.hover.kind,
        chars: this.hover.chars ? [...this.hover.chars] : undefined,
        el: this.hover.el,
        index: this.hover.index
      };
    }
    if (!this.armed) return;

    const key = e.key;

    if (key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      this._revertAll();
      return;
    }
    if (key === "Backspace") {
      e.preventDefault();
      e.stopPropagation();
      this._backspace();
      return;
    }
    if (key === "Delete") {
      e.preventDefault();
      e.stopPropagation();
      this._delete();
      return;
    }
    if (key === "ArrowLeft") {
      e.preventDefault();
      e.stopPropagation();
      this._moveCaret(-1);
      return;
    }
    if (key === "ArrowRight") {
      e.preventDefault();
      e.stopPropagation();
      this._moveCaret(1);
      return;
    }
    if (key === "Home") {
      e.preventDefault();
      e.stopPropagation();
      if (this.armed.kind === "title") this.armed.index = 0;
      else this.armed.index = 0;
      if (this.armed.kind === "title") this.armed.el = this.armed.chars[0];
      this._showCaret(this.armed);
      return;
    }
    if (key === "End") {
      e.preventDefault();
      e.stopPropagation();
      if (this.armed.kind === "title") {
        this.armed.index = this.armed.chars.length - 1;
        this.armed.el = this.armed.chars[this.armed.index];
      } else {
        this.armed.index = (this.armed.el.textContent ?? "").length;
      }
      this._showCaret(this.armed);
      return;
    }
    if (isPrintableKey(e)) {
      e.preventDefault();
      e.stopPropagation();
      this._overwrite(e.key);
      this._resetIdle();
    }
  }

  async _glitchRestore(el, original) {
    if (this.reducedMotion) {
      el.textContent = original;
      return;
    }
    await new Promise((resolve) => {
      const swapTimer = setTimeout(() => {
        el.textContent = original;
      }, 210);
      animate(el, {
        opacity: [1, 0.35, 0.92, 0.42, 1],
        x: ["0px", "4px", "-3px", "2px", "0px"],
        skewX: ["0deg", "10deg", "-8deg", "4deg", "0deg"],
        duration: 480,
        ease: "linear",
        onComplete: () => {
          clearTimeout(swapTimer);
          el.textContent = original;
          resolve();
        }
      });
    });
  }

  async _revertAll() {
    if (!this.taints.size || this.reverting) return;
    this.reverting = true;
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }

    const entries = [...this.taints.entries()];
    for (const [el, { original }] of entries) {
      await this._glitchRestore(el, original);
      el.classList.remove("hero-insert-tainted");
      if (el.id) this._setMetaLock(el.id, false);
    }

    this.taints.clear();
    this.armed = null;
    this.reverting = false;
    document.body.classList.remove("hero-insert-active", "hero-insert-hover");
    this._showCaret(null);
  }

  onSlideChange() {
    this.armed = null;
    if (this.taints.size) this._revertAll();
  }

  _onVisibility() {
    if (document.hidden && this.taints.size) this._revertAll();
  }

  dispose() {
    window.removeEventListener("mousemove", this._onMove);
    window.removeEventListener("mousedown", this._onDown, true);
    window.removeEventListener("keydown", this._onKey, true);
    document.removeEventListener("visibilitychange", this._onVisibility);
    document.removeEventListener("selectstart", this._preventNativeSelect);
    document.removeEventListener("mousedown", this._preventDblClickSelect, true);
    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.caretEl.remove();
    document.body.classList.remove("hero-insert-active", "hero-insert-hover");
  }
}