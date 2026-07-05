/**
 * Centralized pointer/hover/click policy for canvas hero effects.
 * All interactive draw branches must use these helpers — not raw interaction.hover.
 */

const BLOCKED_CLICK_SELECTORS =
  "a, button, input, textarea, select, .theme-toggle, .nav-toggle, .nav, .proof-chip, .chip-tree, .scroll-hint, .chip-label, .chip-detail, .chip-source-hint";

const INSERT_TEXT_SELECTORS = [
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

export function hoverAllowed(interaction, reducedMotion) {
  return Boolean(interaction?.hover) && !reducedMotion;
}

export function proximity(interaction, reducedMotion, x, y, radius = 160) {
  if (!hoverAllowed(interaction, reducedMotion)) return 0;
  const d = Math.hypot(x - interaction.px, y - interaction.py);
  return Math.max(0, 1 - d / radius);
}

export function rowProximity(interaction, reducedMotion, rowY, band = 44) {
  if (!hoverAllowed(interaction, reducedMotion)) return 0;
  return Math.max(0, 1 - Math.abs(rowY - interaction.py) / band);
}

export function pointerNormX(interaction, reducedMotion, width) {
  if (!hoverAllowed(interaction, reducedMotion)) return -1;
  return interaction.px / width;
}

export function pointerXY(interaction, reducedMotion, fallbackX, fallbackY) {
  if (!hoverAllowed(interaction, reducedMotion)) {
    return { x: fallbackX, y: fallbackY };
  }
  return { x: interaction.px, y: interaction.py };
}

export function counterSpeedBoost(proximityValue, reducedMotion, factor = 2.2) {
  if (reducedMotion || proximityValue <= 0.2) return 1;
  return factor;
}

export function clickAllowed({ pinned, reducedMotion }) {
  return Boolean(pinned) && !reducedMotion;
}

export function isBlockedClickTarget(hit) {
  if (!hit) return true;
  return Boolean(hit.closest(BLOCKED_CLICK_SELECTORS));
}

export function isInsertTextTarget(hit) {
  if (!hit) return false;
  if (hit.closest(INSERT_TEXT_SELECTORS)) return true;
  if (hit.closest(".proof-chip") && !hit.closest(".chip-tree")) return false;
  return false;
}

/**
 * True when click is on empty hero background (not chrome UI or editable text).
 * @param {number} clientX
 * @param {number} clientY
 * @param {{ heroStage?: HTMLElement | null }} ctx
 */
export function isEmptyHeroClick(clientX, clientY, ctx = {}) {
  const stage = ctx.heroStage ?? document.getElementById("hero-stage");
  if (!stage) return false;

  const rect = stage.getBoundingClientRect();
  if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) {
    return false;
  }

  const hit = document.elementFromPoint(clientX, clientY);
  if (!hit) return true;
  if (isBlockedClickTarget(hit)) return false;
  if (isInsertTextTarget(hit)) return false;

  if (!hit.closest("#hero-stage") && !stage.contains(hit)) {
    const chrome = hit.closest(".hero-chrome, .slide-rail, .atmosphere, #field, #bokeh-layer, .text-veil, .pinned");
    if (!chrome && !stage.contains(hit)) return false;
  }

  return true;
}