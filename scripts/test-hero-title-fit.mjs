#!/usr/bin/env node
/**
 * Unit tests for hero pinned offset math (thin viewport eyebrow spacing).
 */
import {
  computePinnedYOffset,
  computeSlideContentGap,
  measureTitleFitLimit,
  titleCopyOverflows,
  viewportTitleMargin,
  widthTitleScaleCap,
  TITLE_FIT_MIN_SCALE,
  TITLE_FIT_GUTTER_PX,
  TITLE_FIT_BENCHMARK_WORD,
  isLandscapeShortViewport,
  computeHeroUiScale,
  landscapeContentBudget,
  LANDSCAPE_SHORT_MAX_HEIGHT,
  LANDSCAPE_TITLE_SCALE_MIN
} from "../assets/hero-title-fit.js";

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    console.error(`FAIL: ${msg}`);
    failed++;
  } else {
    console.log(`ok: ${msg}`);
  }
}

assert(
  computePinnedYOffset({
    viewportWidth: 1200,
    viewportHeight: 900,
    navBottom: 68,
    contentHeight: 240,
    baseOffset: 34
  }) === 34,
  "wide viewport keeps base offset"
);

const iphone14 = computePinnedYOffset({
  viewportWidth: 393,
  viewportHeight: 852,
  navBottom: 68,
  contentHeight: 360,
  baseOffset: 28,
  footerReserve: 148
});
assert(iphone14 < 16, `iPhone-width pulls eyebrow up (${iphone14})`);

const tallNarrow = computePinnedYOffset({
  viewportWidth: 360,
  viewportHeight: 800,
  navBottom: 68,
  contentHeight: 300,
  baseOffset: 28,
  footerReserve: 148
});
assert(tallNarrow < 12, `tall narrow trims offset (${tallNarrow})`);

const cramped = computePinnedYOffset({
  viewportWidth: 320,
  viewportHeight: 520,
  navBottom: 68,
  contentHeight: 320,
  baseOffset: 28,
  footerReserve: 148
});
assert(cramped <= 6, `cramped viewport trims aggressively (${cramped})`);

assert(computeSlideContentGap(500, 900) === null, "gap unchanged above 480px width");
assert(computeSlideContentGap(393, 852) === 11, "phone-width tightens grid gap");
assert(computeSlideContentGap(340, 800) === 11, "very narrow gap tightens slightly");
assert(computeSlideContentGap(320, 700) === 10, "min-width gap floor");
assert(computeSlideContentGap(844, 390) === 4, "landscape short tightens grid gap");

assert(measureTitleFitLimit({ clientWidth: 292 }, { clientWidth: 300 }, 320) === 284, "fit limit uses slide width");
assert(
  measureTitleFitLimit({ clientWidth: 0 }, { clientWidth: 0 }, 393) === 349,
  "fit limit falls back to viewport width"
);
assert(TITLE_FIT_MIN_SCALE === 0.32, "title scale can shrink further on thin viewports");
assert(TITLE_FIT_GUTTER_PX === 8, "title fit gutter");
assert(TITLE_FIT_BENCHMARK_WORD === "Intelligence", "title fit benchmark word");
assert(viewportTitleMargin(393) === 12, "phone viewport margin");
assert(widthTitleScaleCap(393, 852) === 0.9, "phone width scale cap");
assert(widthTitleScaleCap(844, 390) === 1, "landscape keeps full title width scale");
assert(widthTitleScaleCap(1200, 900) === 1, "desktop scale cap");
assert(isLandscapeShortViewport(844, 390), "phone landscape is short");
assert(!isLandscapeShortViewport(390, 844), "phone portrait is not short landscape");
assert(computeHeroUiScale(844, 390) > 0.88, "landscape UI scale stays readable");
assert(computeHeroUiScale(1200, 900) === 1, "desktop UI scale unchanged");
assert(
  landscapeContentBudget(844, 390, 48, 0.92) > 220,
  "landscape content budget uses vertical space"
);
assert(LANDSCAPE_SHORT_MAX_HEIGHT === 520, "landscape short threshold");
assert(LANDSCAPE_TITLE_SCALE_MIN === 0.78, "landscape title floor");

const mockTitle = {
  clientWidth: 300,
  scrollWidth: 320,
  getBoundingClientRect: () => ({ left: 10, right: 330 }),
  querySelectorAll: () => [
    { scrollWidth: 180, getBoundingClientRect: () => ({ left: 10, right: 190, width: 180 }) },
    { scrollWidth: 310, getBoundingClientRect: () => ({ left: 10, right: 390, width: 310 }) }
  ]
};
assert(titleCopyOverflows(mockTitle, null, 288), "overflow when a word exceeds limit");
assert(titleCopyOverflows(mockTitle, null, 300, 393), "overflow when a word exceeds viewport");
assert(!titleCopyOverflows({ scrollWidth: 200, getBoundingClientRect: () => ({ left: 10, right: 180 }), querySelectorAll: () => [] }, null, 288), "no overflow when within limit");

if (failed) {
  console.error(`\n${failed} assertion(s) failed`);
  process.exit(1);
}
console.log("\nAll hero title-fit assertions passed");