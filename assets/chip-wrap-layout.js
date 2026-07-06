export const CHIP_ROW_TOLERANCE_PX = 3;
export const CHIP_BULLET_CONNECTOR_MS = 160;
export const CHIP_BULLET_SPINE_MS = 240;
export const CHIP_BULLET_SPINE_DELAY_MS = 100;

export function detectChipRows(chipTops, narrow = true, tolerance = CHIP_ROW_TOLERANCE_PX) {
  if (!narrow || chipTops.length < 2) {
    return { wrap: false, rows: chipTops.map(() => 0) };
  }

  const sorted = [...chipTops].sort((a, b) => a - b);
  const rowTops = [];
  for (const top of sorted) {
    if (!rowTops.some((rowTop) => Math.abs(rowTop - top) <= tolerance)) rowTops.push(top);
  }

  if (rowTops.length < 2) {
    return { wrap: false, rows: chipTops.map(() => 0) };
  }

  return {
    wrap: true,
    rows: chipTops.map((top) => rowTops.findIndex((rowTop) => Math.abs(rowTop - top) <= tolerance))
  };
}

export function shouldHideChipRow(chipRow, activeRow) {
  return Number(chipRow) > Number(activeRow);
}

export function shouldUseChipStackLayout(narrowViewport, landscapeShort = false) {
  return narrowViewport || landscapeShort;
}