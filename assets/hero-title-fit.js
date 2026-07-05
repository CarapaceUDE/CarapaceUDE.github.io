/**
 * fitHeroSlideCopy — keep hero title words intact and scale to column width.
 */
export function fitHeroSlideCopy(slideContent) {
  if (!slideContent) return;

  const pinned = slideContent.closest(".pinned");
  const titleBlock = slideContent.querySelector("h1.title-block, .title-block");
  if (!pinned || !titleBlock) return;

  const limit = Math.max(148, pinned.clientWidth - 6);
  titleBlock.style.setProperty("--title-fit-scale", "1");

  const overflows = () => titleBlock.scrollWidth > limit;
  if (!overflows()) return;

  let lo = 0.5;
  let hi = 1;
  for (let step = 0; step < 14; step++) {
    const mid = (lo + hi) / 2;
    titleBlock.style.setProperty("--title-fit-scale", mid.toFixed(4));
    if (overflows()) hi = mid;
    else lo = mid;
  }
  titleBlock.style.setProperty("--title-fit-scale", lo.toFixed(4));
}