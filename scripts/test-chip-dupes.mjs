import { dedupeBullets, expandDetailLines, enrichProofChip } from "../assets/chip-bullet-enrich.js";
import { readFileSync, readdirSync } from "fs";

function norm(s) {
  return s
    .toLowerCase()
    .replace(/[.!?]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isNearDupe(a, b) {
  const na = norm(a);
  const nb = norm(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  if (na.length >= 8 && nb.length >= 8 && (na.includes(nb) || nb.includes(na))) return true;
  return false;
}

const files = readdirSync("./assets").filter((f) => f.startsWith("hero-") && f.endsWith(".js"));
const dups = [];

for (const file of files) {
  const src = readFileSync(`./assets/${file}`, "utf8");
  for (const block of [...src.matchAll(/proof:\s*\[([\s\S]*?)\]/g)]) {
    const labels = [...block[1].matchAll(/label:\s*"([^"]+)"/g)].map((m) => m[1]);
    const details = [...block[1].matchAll(/detail:\s*"([^"]+)"/g)].map((m) => m[1]);
    const proof = labels.map((l, j) => ({ label: l, detail: details[j] }));
    labels.forEach((label, i) => {
      const detail = details[i];
      if (!detail) return;
      const expanded = expandDetailLines(detail);
      const chip = enrichProofChip({ label, detail }, { proof, note: "", sub: "" }, i);
      const nodes = chip.nodes || [];
      const all = dedupeBullets([...expanded, ...nodes]);
      for (let a = 0; a < all.length; a++) {
        for (let b = a + 1; b < all.length; b++) {
          if (isNearDupe(all[a], all[b])) {
            dups.push({ file, label, detail, a: all[a], b: all[b] });
          }
        }
      }
    });
  }
}

console.log("near-dup pairs:", dups.length);
dups.forEach((d) => console.log(JSON.stringify(d)));