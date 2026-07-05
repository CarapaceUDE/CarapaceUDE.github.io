/**
 * Centralized pointer/hover policy for canvas hero effects.
 * All interactive draw branches must use these helpers — not raw interaction.hover.
 */

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