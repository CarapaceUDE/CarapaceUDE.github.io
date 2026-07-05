/**
 * Drive hero slide changes via real mouse wheel events (browser scroll path).
 */

function parseStageIndex(stageText) {
  const m = stageText?.trim().match(/^(\d+)\s*\/\s*(\d+)/);
  if (!m) return null;
  return { index: parseInt(m[1], 10) - 1, count: parseInt(m[2], 10) };
}

export async function wheelScrollToStage(page, slideCount, targetIndex, { timeoutMs = 25000 } = {}) {
  const expected = `${String(targetIndex + 1).padStart(2, "0")} / ${String(slideCount).padStart(2, "0")}`;

  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.waitForTimeout(250);

  const start = Date.now();
  let wheelSteps = 0;
  let lastY = 0;

  while (Date.now() - start < timeoutMs) {
    const stage = (await page.textContent("#meta-stage"))?.trim() ?? "";
    if (stage === expected) {
      return { ok: true, expected, wheelSteps, scrollY: lastY, method: "mouse.wheel" };
    }

    const parsed = parseStageIndex(stage);
    let deltaY = 160;
    if (parsed && parsed.index > targetIndex) {
      deltaY = -100;
    } else if (parsed && parsed.index === targetIndex - 1) {
      deltaY = 80;
    }

    await page.mouse.move(640, 400);
    await page.mouse.wheel(0, deltaY);
    wheelSteps += 1;
    await page.waitForTimeout(70);
    lastY = await page.evaluate(() => window.scrollY);
  }

  const finalStage = (await page.textContent("#meta-stage"))?.trim() ?? "";
  return {
    ok: finalStage === expected,
    expected,
    actual: finalStage,
    wheelSteps,
    scrollY: lastY,
    method: "mouse.wheel"
  };
}