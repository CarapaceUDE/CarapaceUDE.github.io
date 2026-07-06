export const CHIP_TREE_EDGE_MARGIN_PX = 12;

export function computeChipTreeFlip({
  chipLeft,
  chipWidth,
  treeWidth,
  boundsLeft,
  boundsRight,
  margin = CHIP_TREE_EDGE_MARGIN_PX,
  preferRight = false,
  viewportRight = 0,
  anchorLeft = false
}) {
  const centerX = chipLeft + chipWidth / 2;
  const anchorX = anchorLeft ? chipLeft : centerX;
  const limitRight = viewportRight > 0 ? viewportRight - margin : boundsRight - margin;
  const defaultRight = anchorLeft ? chipLeft + treeWidth : anchorX + treeWidth;

  if (preferRight || anchorLeft) {
    if (defaultRight <= limitRight) {
      return { flip: false, branchMaxPx: null };
    }
    const branchOrigin = anchorLeft ? chipLeft + 12 : anchorX;
    const branchMaxPx = Math.max(96, Math.floor(limitRight - branchOrigin - 12));
    return { flip: false, branchMaxPx };
  }

  if (defaultRight <= limitRight) {
    return { flip: false, branchMaxPx: null };
  }

  const flipLeft = centerX - treeWidth;
  const fits = flipLeft >= boundsLeft + margin;
  const branchMaxPx = fits
    ? null
    : Math.max(96, Math.floor(centerX - boundsLeft - margin - 24));

  return { flip: true, fits, branchMaxPx };
}