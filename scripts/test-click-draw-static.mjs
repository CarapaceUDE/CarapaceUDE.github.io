/**
 * Static draw-path gate — click handler state must be consumed in _drawEffect.
 */
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const scratch = process.argv[2];
if (!scratch) process.exit(1);

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const anime = readFileSync(resolve(root, "assets/effects-anime.js"), "utf8");
const click = readFileSync(resolve(root, "assets/effects-click.js"), "utf8");

const log = [];
let ok = true;

const drawStart = anime.indexOf("_drawEffect(id, state, alpha)");
const traceStart = anime.indexOf('if (id === "trace")', drawStart);
const traceEnd = anime.indexOf('if (id === "checksum")', traceStart);
const traceBlock = traceStart >= 0 && traceEnd > traceStart ? anime.slice(traceStart, traceEnd) : "";
if (traceBlock.includes("clickSegFlash") && traceBlock.includes("clickProg")) {
  log.push("PASS trace draw: reads clickSegFlash for transient replay");
} else {
  log.push("FAIL trace draw: missing clickSegFlash consumption");
  ok = false;
}

const flashSegFn = click.slice(click.indexOf("function flashSeg"), click.indexOf("export function spawnClickPulse"));
const traceHandler = click.slice(click.indexOf("trace(field"), click.indexOf("branch(field"));
if (
  flashSegFn.includes("clickSegFlash") &&
  flashSegFn.includes("p: [proxy.p, 1, 0]") &&
  traceHandler.includes("flashSeg(field, state, bestSeg)")
) {
  log.push("PASS trace handler: clickSegFlash decay via flashSeg");
} else {
  log.push("FAIL trace handler: missing clickSegFlash decay pattern");
  ok = false;
}
if (click.includes("cancelClickAnims") && click.includes("CLICK_COOLDOWN_MS = 200")) {
  log.push("PASS click reentry: cancelClickAnims + 200ms cooldown");
} else {
  log.push("FAIL click reentry: missing cancel/baseline guard");
  ok = false;
}

const filamentStart = anime.indexOf('if (id === "filament")', drawStart);
const filamentEnd = anime.indexOf("drawClickPulses", filamentStart);
const filamentBlock =
  filamentStart >= 0 && filamentEnd > filamentStart ? anime.slice(filamentStart, filamentEnd) : "";
if (filamentBlock.includes("clickKnots") && filamentBlock.includes("activeClickKnots")) {
  log.push("PASS filament draw: renders clickKnots detour");
} else {
  log.push("FAIL filament draw: missing clickKnots render");
  ok = false;
}

if (click.includes("c.strokeStyle = field._pc(0.42 * ch.alpha)") || click.includes("field._pc(0.42 * ch.alpha)")) {
  log.push("PASS schematic crosshair: explicit strokeStyle");
} else {
  log.push("FAIL schematic crosshair: missing strokeStyle");
  ok = false;
}

const core = readFileSync(resolve(root, "assets/hero-core.js"), "utf8");
if (core.includes("removeEventListener(\"pointerdown\", onPointerDown") && core.includes("const onPointerDown")) {
  log.push("PASS hero-core: pointerdown dispose wired");
} else {
  log.push("FAIL hero-core: pointerdown dispose missing");
  ok = false;
}

log.push(`gating: ${ok ? "PASS" : "FAIL"}`);
writeFileSync(resolve(scratch, "click-draw-static.log"), log.join("\n") + "\n");
console.log(ok ? "OK" : "FAIL");
process.exit(ok ? 0 : 1);